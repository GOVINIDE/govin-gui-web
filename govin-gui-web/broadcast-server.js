/**
 * Govin 2.3.1: Classroom Broadcast WebSocket Server
 * 
 * This server enables classroom code broadcasting between teacher and students.
 * Run this on the teacher's computer before enabling Master Mode.
 * 
 * Usage:
 *   node broadcast-server.js [port]
 * 
 * Default port: 8765
 */

const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map(); // clientId -> {ws, name}
let masterClient = null;

console.log('='.repeat(60));
console.log('Govin Classroom Broadcast Server');
console.log('='.repeat(60));

wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`[${new Date().toLocaleTimeString()}] New connection from ${clientIP}`);
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'client_hello':
                    if (message.clientId === 'master' || message.isMaster) {
                        // This is the master/teacher
                        masterClient = ws;
                        ws.clientId = 'master';
                        ws.isMaster = true;
                        console.log(`[${new Date().toLocaleTimeString()}] ✓ Master (Teacher) registered`);
                        
                        // Send current client list to master
                        if (clients.size > 0) {
                            const clientList = Array.from(clients.entries()).map(([id, data]) => ({
                                id,
                                name: data.name
                            }));
                            ws.send(JSON.stringify({
                                type: 'client_list',
                                clients: clientList
                            }));
                        }
                    } else {
                        // This is a student client
                        ws.clientId = message.clientId;
                        ws.clientName = message.clientName || `Student_${message.clientId.substr(-4)}`;
                        clients.set(message.clientId, {
                            ws,
                            name: ws.clientName
                        });
                        console.log(`[${new Date().toLocaleTimeString()}] ✓ Client registered: ${ws.clientName} (${message.clientId})`);
                        console.log(`   Total students connected: ${clients.size}`);
                        
                        // Notify master of new client
                        if (masterClient && masterClient.readyState === WebSocket.OPEN) {
                            masterClient.send(JSON.stringify({
                                type: 'client_hello',
                                clientId: message.clientId,
                                clientName: ws.clientName
                            }));
                        }
                    }
                    break;
                    
                case 'code_broadcast':
                    // Master is broadcasting code
                    if (ws.isMaster) {
                        const codeType = message.codeType || 'unknown';
                        console.log(`[${new Date().toLocaleTimeString()}] 📡 Broadcasting ${codeType} code to ${clients.size} student(s)`);
                        
                        let successCount = 0;
                        clients.forEach((clientData, clientId) => {
                            if (clientData.ws.readyState === WebSocket.OPEN) {
                                clientData.ws.send(data);
                                successCount++;
                            }
                        });
                        
                        console.log(`   ✓ Sent to ${successCount}/${clients.size} students`);
                        
                        // Send acknowledgment to master
                        ws.send(JSON.stringify({
                            type: 'broadcast_ack',
                            successCount,
                            totalClients: clients.size
                        }));
                    } else {
                        console.warn(`[${new Date().toLocaleTimeString()}] ⚠ Non-master client attempted to broadcast`);
                    }
                    break;
                    
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                    
                default:
                    console.log(`[${new Date().toLocaleTimeString()}] Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error(`[${new Date().toLocaleTimeString()}] ✗ Error handling message:`, error.message);
        }
    });
    
    ws.on('close', () => {
        console.log(`[${new Date().toLocaleTimeString()}] ✗ Client disconnected: ${ws.clientId || 'unknown'}`);
        
        if (ws.isMaster) {
            masterClient = null;
            console.log('   ⚠ Master disconnected - broadcasting disabled');
            
            // Notify all clients that master disconnected
            clients.forEach((clientData) => {
                if (clientData.ws.readyState === WebSocket.OPEN) {
                    clientData.ws.send(JSON.stringify({
                        type: 'master_disconnected'
                    }));
                }
            });
        } else if (ws.clientId) {
            const clientData = clients.get(ws.clientId);
            if (clientData) {
                const clientName = clientData.name;
                clients.delete(ws.clientId);
                console.log(`   Total students connected: ${clients.size}`);
                
                // Notify master
                if (masterClient && masterClient.readyState === WebSocket.OPEN) {
                    masterClient.send(JSON.stringify({
                        type: 'client_goodbye',
                        clientId: ws.clientId,
                        clientName
                    }));
                }
            }
        }
    });
    
    ws.on('error', (error) => {
        console.error(`[${new Date().toLocaleTimeString()}] ✗ WebSocket error for ${ws.clientId || 'unknown'}:`, error.message);
    });
});

// Get local IP address
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = [];
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                results.push({
                    name,
                    address: net.address
                });
            }
        }
    }
    
    return results;
}

// Handle server errors
server.on('error', (error) => {
    console.error('✗ Server error:', error.message);
    if (error.code === 'EADDRINUSE') {
        console.error(`  Port ${PORT} is already in use. Try a different port or close the other application.`);
    }
    process.exit(1);
});

// Start server
const PORT = process.env.PORT || parseInt(process.argv[2]) || 8765;

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('✓ Server started successfully!');
    console.log('');
    console.log(`Port: ${PORT}`);
    console.log('');
    
    const interfaces = getLocalIP();
    if (interfaces.length > 0) {
        console.log('Network Addresses (share this with students):');
        interfaces.forEach(iface => {
            console.log(`  • ${iface.address} (${iface.name})`);
        });
        console.log('');
        console.log(`Students should connect to: ${interfaces[0].address}:${PORT}`);
    } else {
        console.log('Local IP: localhost (no network interfaces found)');
    }
    
    console.log('');
    console.log('Instructions:');
    console.log('  1. Teacher: Click "Master Mode" in Govin menu bar');
    console.log('  2. Students: Click "Join Class" and enter teacher\'s IP address');
    console.log('  3. Teacher: Click "Broadcast Code" to send code to all students');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('='.repeat(60));
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('Shutting down server...');
    
    // Close all connections
    if (masterClient) {
        masterClient.close();
    }
    clients.forEach(clientData => {
        clientData.ws.close();
    });
    
    server.close(() => {
        console.log('✓ Server stopped');
        console.log('='.repeat(60));
        process.exit(0);
    });
    
    // Force exit after 5 seconds
    setTimeout(() => {
        console.error('✗ Forced shutdown after timeout');
        process.exit(1);
    }, 5000);
});

// Periodic status update
setInterval(() => {
    const status = {
        master: masterClient ? 'connected' : 'disconnected',
        students: clients.size,
        uptime: process.uptime().toFixed(0) + 's'
    };
    
    if (process.env.DEBUG) {
        console.log(`[${new Date().toLocaleTimeString()}] Status: Master ${status.master}, Students ${status.students}, Uptime ${status.uptime}`);
    }
}, 30000); // Every 30 seconds

