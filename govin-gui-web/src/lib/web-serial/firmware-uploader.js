/**
 * Firmware uploader for ESP devices using esptool-js
 * Based on the working esptool-js implementation
 */

// Import from esptool-js - use explicit path for webpack resolution
import {
    ESPLoader,
    Transport
} from 'esptool-js/lib/index.js';

const INITIAL_CONNECT_BAUDRATE = 115200;
const FLASH_BAUDRATE_CANDIDATES = [921600, 460800, 230400];

/**
 * Best-effort bootloader pulse for ESP boards over Web Serial control lines.
 * Many ESP32 boards (CP210x/CH340/FTDI bridges) need this on Windows before sync.
 */
const pulseBootloaderLines = async (port, log) => {
    if (!port || typeof port.setSignals !== 'function') return;
    let openedHere = false;
    let tempTransport = null;
    try {
        if (!port.readable && !port.writable) {
            await port.open({baudRate: INITIAL_CONNECT_BAUDRATE});
            openedHere = true;
        }
        // Use esptool-js Transport methods so Windows usbser RTS/DTR workaround is applied.
        tempTransport = new Transport(port, false);
        log('Applying ESP bootloader reset sequence...');
        // Same classic reset sequence used by esptool-js.
        await tempTransport.setDTR(false);
        await tempTransport.setRTS(true);
        await new Promise(r => setTimeout(r, 100));
        await tempTransport.setDTR(true);
        await tempTransport.setRTS(false);
        await new Promise(r => setTimeout(r, 120));
        await tempTransport.setDTR(false);
        await new Promise(r => setTimeout(r, 80));
    } catch (err) {
        log(`Bootloader pulse skipped: ${err.message || err}`);
    } finally {
        if (openedHere) {
            try {
                await port.close();
                await new Promise(r => setTimeout(r, 250));
            } catch (_) {}
        }
    }
};

/**
 * Upload firmware to ESP device using esptool-js
 * @param {SerialPort} port - The serial port (Web Serial) - will be closed and a new one requested
 * @param {ArrayBuffer|Uint8Array} firmwareData - The firmware binary data
 * @param {number} offset - Flash offset address (default: 0x1000 for ESP32 app partition)
 * @param {Function} onProgress - Progress callback (fileIndex, bytesWritten, totalBytes)
 * @param {Function} onLog - Log message callback
 * @param {Function} onError - Error callback
 * @param {AbortSignal} abortSignal - Abort signal to cancel upload
 * @param {boolean} eraseAll - If true, chip erase before flashing (clears filesystem)
 * @returns {Promise<string>} 'Success' on success, error message on failure
 */
export async function uploadFirmwareToDevice(
    port,
    firmwareData,
    offset = 0x1000,
    onProgress = null,
    onLog = null,
    onError = null,
    abortSignal = null,
    eraseAll = true
) {
    const log = onLog || (() => {});
    const error = onError || ((msg) => console.error(msg));
    let esploader = null;
    let transport = null;
    let device = null;
    
    try {
        // Convert firmware data to Uint8Array if needed
        let firmware;
        if (firmwareData instanceof ArrayBuffer) {
            firmware = new Uint8Array(firmwareData);
        } else if (firmwareData instanceof Uint8Array) {
            firmware = firmwareData;
        } else {
            throw new Error('Invalid firmware data type');
        }

        log('Connecting to ESP device...');
        
        // Create terminal interface for esptool-js
        const espLoaderTerminal = {
            clean() {
                // Terminal clean - not needed for our use case
            },
            writeLine(data) {
                log(data);
            },
            write(data) {
                // Write without newline - can be used for progress updates
                if (data && data.trim()) {
                    log(data);
                }
            }
        };
        
        // Close the existing port completely before esptool-js uses it
        // This is critical - the port must be fully closed and released
        if (port && (port.readable || port.writable)) {
            try {
                // Release any locks first
                if (port.readable && port.readable.locked) {
                    try {
                        const reader = port.readable.getReader();
                        await reader.cancel();
                        reader.releaseLock();
                    } catch (_) {
                        // Reader might not be available
                    }
                }
                if (port.writable && port.writable.locked) {
                    try {
                        const writer = port.writable.getWriter();
                        writer.releaseLock();
                    } catch (_) {
                        // Writer might not be available
                    }
                }
                
                // Close the port
                await port.close();
                
                // Wait for port to be fully released by the OS
                // This is especially important for CP2102 and other USB-Serial chips
                await new Promise(r => setTimeout(r, 1000));
            } catch (closeErr) {
                // Port might already be closed
                log(`Port close: ${closeErr.message || 'already closed'}`);
                await new Promise(r => setTimeout(r, 500));
            }
        }
        
        // Verify port is closed - retry if needed
        let retries = 0;
        while (port && (port.readable || port.writable) && retries < 10) {
            try {
                await port.close();
                await new Promise(r => setTimeout(r, 200));
                retries++;
            } catch (e) {
                // Port might be in transition, wait a bit
                await new Promise(r => setTimeout(r, 200));
                retries++;
            }
        }
        
        // Use the same port (now closed) - esptool-js will open it
        device = port;

        // On Windows especially, pre-pulsing reset lines improves first sync reliability.
        await pulseBootloaderLines(device, log);

        log('Initializing ESP device...');

        // Connect and detect chip with retries.
        let chipName = null;
        let lastConnectErr = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                if (attempt > 1) {
                    log(`Retrying ESP sync (${attempt}/3)...`);
                    await new Promise(r => setTimeout(r, 300));
                    await pulseBootloaderLines(device, log);
                }
                // Recreate transport/loader each attempt for clean state.
                transport = new Transport(device, false); // tracing = false
                const loaderOptions = {
                    transport: transport,
                    baudrate: INITIAL_CONNECT_BAUDRATE,
                    terminal: espLoaderTerminal,
                    debugLogging: false
                };
                esploader = new ESPLoader(loaderOptions);
                chipName = await esploader.main();
                break;
            } catch (err) {
                lastConnectErr = err;
                try {
                    if (esploader) await esploader.after();
                } catch (_) {}
                esploader = null;
                try {
                    if (transport) await transport.disconnect();
                } catch (_) {}
                transport = null;
            }
        }

        if (!chipName) {
            throw lastConnectErr || new Error('Failed to connect with the device');
        }
        log(`Connected to ${chipName}`);
        
        // For ESP32, default offset should be 0x1000 if not specified
        // (0x0 is for bootloader, 0x1000 is for app partition)
        let flashOffset = offset;
        if (flashOffset === 0x0 && chipName !== 'ESP8266') {
            log('Note: Using offset 0x1000 for ESP32 app partition (use offset=0x0 for full image with bootloader)');
            flashOffset = 0x1000;
        }
        
        log(`Preparing to flash firmware (${firmware.length} bytes) at offset 0x${flashOffset.toString(16)}...`);
        
        // Prepare flash options
        const flashOptions = {
            fileArray: [{
                data: firmware,
                address: flashOffset
            }],
            flashMode: 'keep', // Keep existing flash mode
            flashFreq: 'keep', // Keep existing flash frequency
            flashSize: 'keep', // Keep existing flash size (or use 'detect')
            eraseAll: Boolean(eraseAll), // Full erase clears old filesystem (main.py, etc.)
            compress: true, // Use compression for faster upload
            reportProgress: (fileIndex, written, total) => {
                if (onProgress) {
                    onProgress(fileIndex, written, total);
                }
                // Log progress every 10%
                const percent = Math.floor((written / total) * 100);
                if (percent % 10 === 0 && written > 0) {
                    log(`Progress: ${percent}% (${written}/${total} bytes)`);
                }
            }
        };
        
        let activeFlashBaud = INITIAL_CONNECT_BAUDRATE;
        for (const candidate of FLASH_BAUDRATE_CANDIDATES) {
            try {
                // Increase baud after successful sync for faster flashing.
                await esploader.changeBaud(candidate);
                activeFlashBaud = candidate;
                break;
            } catch (_) {
                // Try next lower candidate.
            }
        }
        log(`Flashing firmware at baud ${activeFlashBaud}...`);
        
        // Flash the firmware
        await esploader.writeFlash(flashOptions);
        
        log('Firmware upload completed successfully!');
        log('Please reset your device to run the new firmware.');
        
        // Clean up esploader first
        await esploader.after();
        
        // Wait a bit for device to reset
        await new Promise(r => setTimeout(r, 500));
        
        return 'Success';
    } catch (err) {
        const errorMsg = err.message || String(err);
        error(`Firmware upload failed: ${errorMsg}`);
        
        // Check if aborted
        if (abortSignal && abortSignal.aborted) {
            return 'Aborted';
        }
        
        // Clean up on error
        try {
            if (esploader) {
                await esploader.after();
            }
        } catch (cleanupErr) {
            // Ignore cleanup errors
        }
        
        return errorMsg;
    } finally {
        // Disconnect transport and close device
        // This must be done carefully to ensure port is fully released
        try {
            if (transport) {
                // Transport.disconnect() will close the device
                await transport.disconnect();
                // Wait for disconnect to complete
                await new Promise(r => setTimeout(r, 300));
            }
            
            // Ensure device is fully closed and released
            if (device) {
                try {
                    // Release any remaining locks
                    if (device.readable && device.readable.locked) {
                        try {
                            const reader = device.readable.getReader();
                            await reader.cancel();
                            reader.releaseLock();
                        } catch (_) {}
                    }
                    if (device.writable && device.writable.locked) {
                        try {
                            const writer = device.writable.getWriter();
                            writer.releaseLock();
                        } catch (_) {}
                    }
                    
                    // Close the device if still open
                    if (device.readable || device.writable) {
                        await device.close();
                        // Wait longer for port to be fully released by OS
                        // This is critical for allowing browser to reconnect
                        await new Promise(r => setTimeout(r, 1000));
                    }
                } catch (closeErr) {
                    // Ignore close errors - port might already be closed
                }
            }
        } catch (disconnectErr) {
            // Ignore disconnect errors
        }
    }
}

/**
 * Erase flash memory
 * @param {SerialPort} port - The serial port
 * @param {Function} onLog - Log callback
 * @param {Function} onError - Error callback
 * @returns {Promise<boolean>} True on success
 */
export async function eraseFlash(port, onLog = null, onError = null) {
    const log = onLog || (() => {});
    const error = onError || ((msg) => console.error(msg));
    let esploader = null;
    let transport = null;
    
    try {
        log('Connecting to ESP device...');
        
        const espLoaderTerminal = {
            clean() {},
            writeLine(data) {
                log(data);
            },
            write(data) {
                if (data && data.trim()) {
                    log(data);
                }
            }
        };

        transport = new Transport(port, false);
        await transport.connect(115200);
        
        transport.readLoop().catch((err) => {
            error(`Read loop error: ${err.message || err}`);
        });

        const loaderOptions = {
            transport: transport,
            baudrate: 115200,
            terminal: espLoaderTerminal,
            debugLogging: false
        };
        
        esploader = new ESPLoader(loaderOptions);
        
        const chipName = await esploader.main();
        log(`Connected to ${chipName}`);
        
        log('Erasing flash memory...');
        await esploader.eraseFlash();
        
        log('Flash erased successfully!');
        
        await esploader.after();
        
        return true;
    } catch (err) {
        const errorMsg = err.message || String(err);
        error(`Erase failed: ${errorMsg}`);
        return false;
    } finally {
        try {
            if (esploader) {
                await esploader.after();
            }
            if (transport) {
                await transport.disconnect();
            }
        } catch (cleanupErr) {
            // Ignore cleanup errors
        }
    }
}
