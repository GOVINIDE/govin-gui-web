/**
 * Govin 2.3.1: Broadcast Service for classroom code sharing
 * Supports local network WebSocket communication without internet
 * 
 * Master mode: Starts a WebSocket server that broadcasts code to connected clients
 * Client mode: Connects to a master's WebSocket server to receive code
 */

import {
    setBroadcastEnabled,
    setIncomingCode,
    addConnectedClient,
    removeConnectedClient,
    setConnectionStatus,
    BroadcastMode,
    ConnectionStatus
} from '../reducers/broadcast';
import embeddedServer from './embedded-broadcast-server';

class BroadcastService {
    constructor () {
        this.mode = BroadcastMode.NONE;
        this.websocket = null;
        this.websocketServer = null;
        this.dispatch = null;
        this.vm = null;
        this.clients = new Map(); // For master mode
        this.reconnectTimeout = null;
        this.reconnectDelay = 5000; // 5 seconds
        this.embeddedServer = embeddedServer;
    }

    /**
     * Initialize the broadcast service
     * @param {Function} dispatch - Redux dispatch function
     * @param {Object} vm - OpenBlock VM instance
     */
    initialize (dispatch, vm) {
        this.dispatch = dispatch;
        this.vm = vm;
    }

    /**
     * Start as master (teacher)
     * Automatically starts embedded server in desktop app
     * @param {number} port - WebSocket server port
     * @returns {Promise<boolean>}
     */
    async startMaster (port = 8765) {
        if (this.mode === BroadcastMode.MASTER) {
            console.log('Already running as master');
            return true;
        }

        try {
            this.dispatch(setConnectionStatus(ConnectionStatus.CONNECTING));

            // Step 1: Try to start embedded server (if in desktop app)
            const serverResult = await this.embeddedServer.start(port);
            
            let serverIP = 'localhost';
            let useExternalServer = false;

            if (!serverResult.success) {
                if (serverResult.error === 'SERVER_NOT_AVAILABLE') {
                    // Running in browser - try to connect to external server
                    console.log('Browser mode detected - connecting to external server on localhost:' + port);
                    useExternalServer = true;
                    
                    // Try to get local IP for sharing with students
                    // In browser, we can't easily get IP, so we'll show instructions
                    serverIP = this.getLocalIPForBrowser();
                } else {
                    // Other errors
                    alert(`Failed to start server: ${serverResult.message}`);
                    this.dispatch(setConnectionStatus(ConnectionStatus.ERROR));
                    return false;
                }
            } else {
                // Embedded server started successfully
                serverIP = serverResult.ip;
            }

            // Step 2: Connect to the server as master (embedded or external)
            this.mode = BroadcastMode.MASTER;
            const wsUrl = `ws://localhost:${port}`;
            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('Connected to broadcast server as master');
                
                // Register as master
                this.sendMessage({
                    type: 'client_hello',
                    clientId: 'master',
                    isMaster: true
                });
                
                this.dispatch(setConnectionStatus(ConnectionStatus.CONNECTED));
                this.dispatch(setBroadcastEnabled(true));

                // Show success message with IP
                if (useExternalServer) {
                    const ipMessage = `Teacher Mode Enabled! ✓

Connected to external server on port ${port}


Share your IP with students:
"Connect to YOUR_IP:${port}"

Students should:
1. Click "Join Class"
2. Enter: YOUR_IP (from ifconfig/ipconfig)
3. Port: ${port}
4. Click "Connect"`;

                    alert(ipMessage);
                } else {
                    const ipMessage = `Teacher Mode Enabled! ✓

Your IP Address: ${serverIP}
Port: ${port}

Share this with students:
"Connect to ${serverIP}:${port}"

Students should:
1. Click "Join Class"
2. Enter: ${serverIP}
3. Port: ${port}
4. Click "Connect"`;

                    alert(ipMessage);
                }
            };

            this.websocket.onmessage = event => {
                this.handleMessage(event.data);
            };

            this.websocket.onerror = error => {
                console.error('WebSocket error (master):', error);
                this.dispatch(setConnectionStatus(ConnectionStatus.ERROR));
            };

            this.websocket.onclose = () => {
                console.log('Disconnected from broadcast server');
                this.dispatch(setConnectionStatus(ConnectionStatus.DISCONNECTED));
                this.dispatch(setBroadcastEnabled(false));
                this.mode = BroadcastMode.NONE;
            };
            
            return true;
        } catch (error) {
            console.error('Failed to start master mode:', error);
            this.dispatch(setConnectionStatus(ConnectionStatus.ERROR));
            alert(`Error: ${error.message}`);
            return false;
        }
    }

    /**
     * Start as client (student)
     * @param {string} masterAddress - Master's IP address or hostname
     * @param {number} port - WebSocket port
     * @returns {Promise<boolean>}
     */
    async startClient (masterAddress, port = 8765) {
        if (this.mode === BroadcastMode.CLIENT) {
            console.log('Already running as client');
            return true;
        }

        try {
            this.mode = BroadcastMode.CLIENT;
            this.dispatch(setConnectionStatus(ConnectionStatus.CONNECTING));

            const wsUrl = `ws://${masterAddress}:${port}`;
            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('Connected to master');
                this.dispatch(setConnectionStatus(ConnectionStatus.CONNECTED));
                this.dispatch(setBroadcastEnabled(true));
                
                // Send client info
                this.sendMessage({
                    type: 'client_hello',
                    clientId: this.getClientId(),
                    clientName: this.getClientName()
                });
            };

            this.websocket.onmessage = event => {
                this.handleMessage(event.data);
            };

            this.websocket.onerror = error => {
                console.error('WebSocket error:', error);
                this.dispatch(setConnectionStatus(ConnectionStatus.ERROR));
            };

            this.websocket.onclose = () => {
                console.log('Disconnected from master');
                this.dispatch(setConnectionStatus(ConnectionStatus.DISCONNECTED));
                this.dispatch(setBroadcastEnabled(false));
                
                // Auto-reconnect
                this.scheduleReconnect(masterAddress, port);
            };

            return true;
        } catch (error) {
            console.error('Failed to start client mode:', error);
            this.dispatch(setConnectionStatus(ConnectionStatus.ERROR));
            return false;
        }
    }

    /**
     * Stop broadcast service
     */
    async stop () {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Stop embedded server if we were master
        if (this.mode === BroadcastMode.MASTER) {
            await this.embeddedServer.stop();
        }

        this.clients.clear();
        this.mode = BroadcastMode.NONE;
        this.dispatch(setBroadcastEnabled(false));
        this.dispatch(setConnectionStatus(ConnectionStatus.DISCONNECTED));
    }

    /**
     * Broadcast current project to all connected clients
     * @param {string} codeType - 'blocks' or 'text'
     * @param {string} textContent - For text mode, the actual code content
     */
    broadcast (codeType = 'blocks', textContent = null) {
        if (this.mode !== BroadcastMode.MASTER) {
            console.warn('Not in master mode, cannot broadcast');
            return;
        }

        try {
            let codeData;
            
            if (codeType === 'blocks') {
                // Serialize the entire project (blocks)
                codeData = this.vm.toJSON();
            } else if (codeType === 'text') {
                // Use the provided text content
                codeData = textContent;
            }

            const message = {
                type: 'code_broadcast',
                codeType,
                data: codeData,
                timestamp: Date.now(),
                from: this.getClientName()
            };

            // In a real implementation, broadcast to all connected clients
            this.broadcastMessage(message);
            
            console.log(`Broadcasted ${codeType} code to ${this.clients.size} clients`);
        } catch (error) {
            console.error('Failed to broadcast:', error);
        }
    }

    /**
     * Handle incoming message
     * @param {string} messageData - Message data
     */
    handleMessage (messageData) {
        try {
            const message = JSON.parse(messageData);

            switch (message.type) {
            case 'code_broadcast':
                // Received code from master
                this.dispatch(setIncomingCode({
                    type: message.codeType,
                    data: message.data,
                    from: message.from,
                    timestamp: message.timestamp
                }));
                break;

            case 'client_hello':
                // New client connected (master only)
                if (this.mode === BroadcastMode.MASTER) {
                    this.dispatch(addConnectedClient({
                        id: message.clientId,
                        name: message.clientName
                    }));
                }
                break;

            case 'client_list':
                // Initial client list from server (master only)
                if (this.mode === BroadcastMode.MASTER && message.clients) {
                    message.clients.forEach(client => {
                        this.dispatch(addConnectedClient(client));
                    });
                }
                break;

            case 'broadcast_ack':
                // Broadcast acknowledgment (master only)
                console.log(`Code broadcast acknowledged: ${message.successCount}/${message.totalClients} students received`);
                break;

            case 'client_goodbye':
                // Client disconnected (master only)
                if (this.mode === BroadcastMode.MASTER) {
                    this.dispatch(removeConnectedClient(message.clientId));
                }
                break;

            default:
                console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to handle message:', error);
        }
    }

    /**
     * Send message through WebSocket
     * @param {Object} message - Message object
     */
    sendMessage (message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast message to all clients (master only)
     * @param {Object} message - Message object
     */
    broadcastMessage (message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
            console.log('Message sent to broadcast server');
        } else {
            console.error('Cannot broadcast: not connected to server');
        }
    }

    /**
     * Schedule reconnection attempt
     * @param {string} masterAddress - Master address
     * @param {number} port - Port
     */
    scheduleReconnect (masterAddress, port) {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.startClient(masterAddress, port);
        }, this.reconnectDelay);
    }

    /**
     * Get unique client ID
     * @returns {string}
     */
    getClientId () {
        let clientId = localStorage.getItem('govin_client_id');
        if (!clientId) {
            clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('govin_client_id', clientId);
        }
        return clientId;
    }

    /**
     * Get client name (can be customized by user)
     * @returns {string}
     */
    getClientName () {
        return localStorage.getItem('govin_client_name') || `Govin_${this.getClientId().substr(-4)}`;
    }

    /**
     * Set client name
     * @param {string} name - Client name
     */
    setClientName (name) {
        localStorage.setItem('govin_client_name', name);
    }

    /**
     * Get local IP for browser mode (helper function)
     * In browser, we can't directly get IP, so return placeholder
     * @returns {string}
     */
    getLocalIPForBrowser () {
        // In browser, we can't get IP directly
        // User needs to check with ifconfig/ipconfig
        return 'YOUR_IP';
    }
}

// Singleton instance
const broadcastService = new BroadcastService();

export default broadcastService;

