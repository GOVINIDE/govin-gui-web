/**
 * Govin 2.3.1: Embedded Broadcast Server for Desktop App
 * Starts automatically when Master Mode is enabled - no terminal needed!
 */

class EmbeddedBroadcastServer {
    constructor() {
        this.server = null;
        this.wss = null;
        this.clients = new Map();
        this.masterClient = null;
        this.port = 8765;
        this.isRunning = false;
    }

    /**
     * Check if running in Electron/Desktop environment
     */
    isElectronApp() {
        return typeof window !== 'undefined' && 
               window.process && 
               window.process.type === 'renderer';
    }

    /**
     * Check if WebSocket server is available (Node.js/Electron)
     */
    canRunServer() {
        try {
            // Check if we have Node.js WebSocket available
            if (this.isElectronApp()) {
                return true;
            }
            // In browser, we can't run a server
            return false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Start embedded WebSocket server
     * @param {number} port - Port to listen on
     * @returns {Promise<{success: boolean, ip: string, port: number, error?: string}>}
     */
    async start(port = 8765) {
        if (this.isRunning) {
            return {
                success: true,
                ip: this.getLocalIP(),
                port: this.port
            };
        }

        this.port = port;

        // If we can't run server (browser environment), return instructions
        if (!this.canRunServer()) {
            return {
                success: false,
                error: 'SERVER_NOT_AVAILABLE',
                message: 'Running in browser mode. Please use external server.',
                instructions: `
                    To use Master Mode:
                    1. Open a terminal
                    2. Run: npm run broadcast-server
                    3. Share the IP address with students
                `
            };
        }

        try {
            // For Electron app - use Node.js modules
            const http = window.require('http');
            const WebSocket = window.require('ws');
            const os = window.require('os');

            this.server = http.createServer();
            this.wss = new WebSocket.Server({ server: this.server });

            // Setup WebSocket handlers
            this.wss.on('connection', (ws, req) => {
                this.handleConnection(ws, req);
            });

            // Start listening
            await new Promise((resolve, reject) => {
                this.server.listen(this.port, '0.0.0.0', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            this.isRunning = true;
            const ip = this.getLocalIP();

            console.log(`✓ Broadcast server started on ${ip}:${this.port}`);

            return {
                success: true,
                ip: ip,
                port: this.port,
                message: `Share this address with students: ${ip}:${this.port}`
            };

        } catch (error) {
            console.error('Failed to start embedded server:', error);
            
            // If port is in use, try alternative
            if (error.code === 'EADDRINUSE') {
                return {
                    success: false,
                    error: 'PORT_IN_USE',
                    message: `Port ${this.port} is already in use. Try closing other instances of the app.`
                };
            }

            return {
                success: false,
                error: error.code || 'UNKNOWN_ERROR',
                message: error.message
            };
        }
    }

    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws, req) {
        const clientIP = req.socket.remoteAddress;
        console.log(`New connection from ${clientIP}`);

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(ws, message);
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        ws.on('close', () => {
            this.handleDisconnect(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    /**
     * Handle incoming message
     */
    handleMessage(ws, message) {
        switch (message.type) {
            case 'client_hello':
                if (message.clientId === 'master' || message.isMaster) {
                    this.masterClient = ws;
                    ws.clientId = 'master';
                    ws.isMaster = true;
                    console.log('Master registered');

                    // Send current client list
                    if (this.clients.size > 0) {
                        const clientList = Array.from(this.clients.entries()).map(([id, data]) => ({
                            id,
                            name: data.name
                        }));
                        ws.send(JSON.stringify({
                            type: 'client_list',
                            clients: clientList
                        }));
                    }
                } else {
                    ws.clientId = message.clientId;
                    ws.clientName = message.clientName || `Student_${message.clientId.substr(-4)}`;
                    this.clients.set(message.clientId, {
                        ws,
                        name: ws.clientName
                    });
                    console.log(`Client registered: ${ws.clientName}`);

                    // Notify master
                    if (this.masterClient && this.masterClient.readyState === 1) {
                        this.masterClient.send(JSON.stringify({
                            type: 'client_hello',
                            clientId: message.clientId,
                            clientName: ws.clientName
                        }));
                    }
                }
                break;

            case 'code_broadcast':
                if (ws.isMaster) {
                    console.log(`Broadcasting code to ${this.clients.size} students`);
                    let successCount = 0;

                    this.clients.forEach((clientData) => {
                        if (clientData.ws.readyState === 1) {
                            clientData.ws.send(JSON.stringify(message));
                            successCount++;
                        }
                    });

                    console.log(`Sent to ${successCount}/${this.clients.size} students`);

                    // Send acknowledgment
                    ws.send(JSON.stringify({
                        type: 'broadcast_ack',
                        successCount,
                        totalClients: this.clients.size
                    }));
                }
                break;

            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    }

    /**
     * Handle client disconnect
     */
    handleDisconnect(ws) {
        console.log(`Client disconnected: ${ws.clientId || 'unknown'}`);

        if (ws.isMaster) {
            this.masterClient = null;
            console.log('Master disconnected');

            // Notify all clients
            this.clients.forEach((clientData) => {
                if (clientData.ws.readyState === 1) {
                    clientData.ws.send(JSON.stringify({
                        type: 'master_disconnected'
                    }));
                }
            });
        } else if (ws.clientId) {
            const clientData = this.clients.get(ws.clientId);
            if (clientData) {
                this.clients.delete(ws.clientId);

                // Notify master
                if (this.masterClient && this.masterClient.readyState === 1) {
                    this.masterClient.send(JSON.stringify({
                        type: 'client_goodbye',
                        clientId: ws.clientId,
                        clientName: clientData.name
                    }));
                }
            }
        }
    }

    /**
     * Stop the server
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        try {
            // Close all connections
            if (this.masterClient) {
                this.masterClient.close();
            }

            this.clients.forEach(clientData => {
                clientData.ws.close();
            });

            // Close WebSocket server
            if (this.wss) {
                this.wss.close();
            }

            // Close HTTP server
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
            }

            this.isRunning = false;
            this.clients.clear();
            this.masterClient = null;

            console.log('✓ Broadcast server stopped');
        } catch (error) {
            console.error('Error stopping server:', error);
        }
    }

    /**
     * Get local IP address
     */
    getLocalIP() {
        try {
            if (this.isElectronApp()) {
                const os = window.require('os');
                const interfaces = os.networkInterfaces();
                
                for (const name of Object.keys(interfaces)) {
                    for (const iface of interfaces[name]) {
                        if (iface.family === 'IPv4' && !iface.internal) {
                            return iface.address;
                        }
                    }
                }
            }
            return 'localhost';
        } catch (e) {
            return 'localhost';
        }
    }

    /**
     * Get server status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            ip: this.getLocalIP(),
            connectedClients: this.clients.size,
            hasMaster: this.masterClient !== null
        };
    }
}

// Singleton instance
const embeddedServer = new EmbeddedBroadcastServer();

export default embeddedServer;

