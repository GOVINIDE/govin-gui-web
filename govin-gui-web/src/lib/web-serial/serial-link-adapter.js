/**
 * Web Serial adapter that implements the same JSON-RPC interface as g-link
 * for SERIALPORT. Used in the browser build so upload/connect work without
 * the Electron desktop (g-link). Desktop app is unchanged and still uses
 * WebSocket to g-link.
 *
 * Interface: same as ScratchLinkWebSocket (open, close, setOnOpen, setOnClose,
 * setOnError, setHandleMessage, sendMessage, isOpen). When sendMessage is
 * called with a request, we handle it locally via Web Serial and push
 * responses/notifications back through the message handler.
 *
 * govin 2.3.2: Purpose: Browser-only serial connection and MicroPython upload
 * via Web Serial API; drop-in replacement for g-link SERIALPORT socket.
 */

import {uploadCodeToDevice} from './repl-uploader.js';
import {uploadFirmwareToDevice, eraseFlash} from './firmware-uploader.js';

const WEB_SERIAL_PERIPHERAL_ID = 'web-serial-0';

export default class WebSerialLinkAdapter {
    constructor () {
        this._onOpen = null;
        this._onClose = null;
        this._onError = null;
        this._handleMessage = null;
        this._port = null;
        this._open = false;
        this._abortController = null;
        this._readLoopAbortController = null;
        this._readLoopReleasedResolve = null;
        this._readLoopReader = null;
        this._lastBaudRate = 115200;
        this._justFlashedFirmware = false; // Track if we just flashed firmware
        this._requestPortFilters = [];
    }

    setOnOpen (fn) {
        this._onOpen = fn;
    }

    setOnClose (fn) {
        this._onClose = fn;
    }

    setOnError (fn) {
        this._onError = fn;
    }

    setHandleMessage (fn) {
        this._handleMessage = fn;
    }

    _emit (msg) {
        if (this._handleMessage) this._handleMessage(msg);
    }

    open () {
        if (!this._onOpen || !this._onClose || !this._onError || !this._handleMessage) {
            throw new Error('Must set open, close, message and error handlers before calling open');
        }
        this._open = true;
        setTimeout(() => this._onOpen(), 0);
    }

    close () {
        this._open = false;
        if (this._abortController) this._abortController.abort();
        if (this._readLoopAbortController) this._readLoopAbortController.abort();
        if (this._port) {
            this._port.close().catch(() => {});
            this._port = null;
        }
        if (this._onClose) this._onClose();
    }

    sendMessage (message) {
        if (!message || message.jsonrpc !== '2.0') return;
        if (message.method !== undefined) {
            this._handleRequest(message);
        }
    }

    isOpen () {
        return this._open;
    }

    async _handleRequest (request) {
        const {method, params, id} = request;

        const sendResult = (result) => {
            this._emit({jsonrpc: '2.0', id, result: result != null ? result : null});
        };
        const sendError = (error) => {
            this._emit({jsonrpc: '2.0', id, error: typeof error === 'string' ? {message: error} : error});
        };
        const sendNotification = (methodName, notifParams) => {
            this._emit({jsonrpc: '2.0', method: methodName, params: notifParams != null ? notifParams : {}});
        };

        try {
            switch (method) {
            case 'discover':
                await this._handleDiscover(params, sendNotification, sendError);
                sendResult(null);
                break;
            case 'connect':
                await this._handleConnect(params, sendResult, sendError);
                break;
            case 'disconnect':
                await this._handleDisconnect();
                sendResult(null);
                break;
            case 'updateBaudrate':
                sendResult(null);
                break;
            case 'write':
                await this._handleWrite(params, sendResult, sendError);
                break;
            case 'read':
                this._startReadLoop(sendNotification);
                sendResult(null);
                break;
            case 'upload':
                await this._handleUpload(params, sendNotification, sendResult, sendError);
                break;
            case 'uploadFirmware':
                await this._handleUploadFirmware(params, sendNotification, sendResult, sendError);
                break;
            case 'abortUpload':
                if (this._abortController) this._abortController.abort();
                sendResult(null);
                break;
            default:
                sendResult(null);
            }
        } catch (err) {
            sendError(err.message || String(err));
        }
    }

    // Govin 2.3.1: Parse VM pnpid filters like "USB\\VID_10C4&PID_EA60" for Web Serial picker filtering.
    _buildRequestPortFilters (discoverParams) {
        const pnpIds = discoverParams &&
            discoverParams.filters &&
            Array.isArray(discoverParams.filters.pnpid)
            ? discoverParams.filters.pnpid
            : null;

        if (!pnpIds || pnpIds.length === 0 || pnpIds.includes('*')) {
            return [];
        }

        const dedupe = new Set();
        const filters = [];
        pnpIds.forEach(id => {
            if (typeof id !== 'string') return;
            const match = id.match(/VID_([0-9A-Fa-f]{4})&PID_([0-9A-Fa-f]{4})/);
            if (!match) return;
            const usbVendorId = parseInt(match[1], 16);
            const usbProductId = parseInt(match[2], 16);
            const key = `${usbVendorId}:${usbProductId}`;
            if (dedupe.has(key)) return;
            dedupe.add(key);
            filters.push({usbVendorId, usbProductId});
        });
        return filters;
    }

    async _requestPortWithCurrentFilters () {
        if (this._requestPortFilters && this._requestPortFilters.length > 0) {
            return navigator.serial.requestPort({filters: this._requestPortFilters});
        }
        return navigator.serial.requestPort();
    }

    async _handleDiscover (params, sendNotification, sendError) {
        if (!navigator.serial || !navigator.serial.requestPort) {
            sendError('Web Serial is not supported in this browser. Use Chrome/Edge.');
            return;
        }
        this._requestPortFilters = this._buildRequestPortFilters(params);
        try {
            const port = await this._requestPortWithCurrentFilters();
            this._port = port;
            const info = (port.getInfo && port.getInfo());
            const name = (info && (info.serialNumber || info.productName)) || 'Web Serial device';
            sendNotification('didDiscoverPeripheral', {
                peripheralId: WEB_SERIAL_PERIPHERAL_ID,
                name: name
            });
        } catch (err) {
            if (err.name === 'NotFoundError') {
                sendError('No port selected.');
            } else {
                sendError(err.message || 'Failed to request serial port.');
            }
        }
    }

    async _handleConnect (params, sendResult, sendError) {
        try {
            if (!this._port && navigator.serial && navigator.serial.requestPort) {
                const port = await this._requestPortWithCurrentFilters();
                this._port = port;
            }
            if (!this._port) {
                sendError('No port selected. Please use Connect to choose a port.');
                return;
            }
            const config = (params && params.peripheralConfig && params.peripheralConfig.config) || {};
            const options = {baudRate: config.baudRate || 115200};
            this._lastBaudRate = options.baudRate;
            await this._port.open(options);
            
            // If we just flashed firmware, send a reset sequence to wake up the device
            if (this._justFlashedFirmware) {
                await this._wakeUpDevice();
                this._justFlashedFirmware = false;
            }
            
            sendResult(null);
        } catch (err) {
            if (err.name === 'NotFoundError') {
                sendError('No port selected.');
            } else {
                sendError(err.message || 'Failed to open port.');
            }
        }
    }
    
    /**
     * Wake up the device by sending interrupts and a soft reset
     * This is especially needed after firmware upload when device might be stuck
     */
    async _wakeUpDevice() {
        if (!this._port || !this._port.writable) return;
        
        try {
            const writer = this._port.writable.getWriter();
            const INTERRUPT = 0x03; // Ctrl+C
            const SOFT_RESET = 0x04; // Ctrl+D
            
            // Send multiple interrupts to break any running code
            await writer.write(new Uint8Array([INTERRUPT]));
            await new Promise(r => setTimeout(r, 200));
            await writer.write(new Uint8Array([INTERRUPT]));
            await new Promise(r => setTimeout(r, 200));
            await writer.write(new Uint8Array([INTERRUPT]));
            await new Promise(r => setTimeout(r, 300));
            
            // Send soft reset (Ctrl+D) to reboot into REPL
            await writer.write(new Uint8Array([SOFT_RESET]));
            await new Promise(r => setTimeout(r, 500));
            
            writer.releaseLock();
        } catch (err) {
            // Ignore errors - device might not be ready yet
        }
    }

    _startReadLoop (sendNotification) {
        if (!this._port || !this._port.readable || !this._open) return;
        if (this._readLoopAbortController) this._readLoopAbortController.abort();
        this._readLoopAbortController = new AbortController();
        const signal = this._readLoopAbortController.signal;
        const port = this._port;
        const emit = (msg) => this._emit(msg);
        const adapter = this;

        (async () => {
            let reader;
            try {
                reader = port.readable.getReader();
                adapter._readLoopReader = reader;
                while (!signal.aborted && this._open && port === this._port) {
                    const {value, done} = await reader.read();
                    if (done) break;
                    if (value && value.length > 0) {
                        let binary = '';
                        const chunkSize = 8192;
                        for (let i = 0; i < value.length; i += chunkSize) {
                            const chunk = value.subarray(i, Math.min(i + chunkSize, value.length));
                            binary += String.fromCharCode.apply(null, chunk);
                        }
                        const base64 = btoa(binary);
                        emit({jsonrpc: '2.0', method: 'onMessage', params: {encoding: 'base64', message: base64}});
                    }
                }
            } catch (e) {
                if (!signal.aborted && this._open) emit({jsonrpc: '2.0', method: 'peripheralUnplug', params: null});
            } finally {
                adapter._readLoopReader = null;
                try { if (reader) reader.releaseLock(); } catch (_) {}
                if (adapter._readLoopReleasedResolve) {
                    adapter._readLoopReleasedResolve();
                    adapter._readLoopReleasedResolve = null;
                }
            }
        })();
    }

    async _stopReadLoopAndWait () {
        if (!this._readLoopAbortController && !this._readLoopReader) return;
        const released = new Promise(resolve => {
            this._readLoopReleasedResolve = resolve;
        });
        if (this._readLoopReader) {
            this._readLoopReader.cancel().catch(() => {});
        }
        if (this._readLoopAbortController) this._readLoopAbortController.abort();
        this._readLoopAbortController = null;
        await Promise.race([released, new Promise(r => setTimeout(r, 1000))]);
        this._readLoopReleasedResolve = null;
        if (this._port) {
            try {
                await this._port.close();
                // Additional delay for Windows serial port cleanup
                await new Promise(r => setTimeout(r, 200));
            } catch (_) {}
            try {
            await this._port.open({baudRate: this._lastBaudRate || 115200});
                // Small delay after opening for Windows
                await new Promise(r => setTimeout(r, 100));
            } catch (err) {
                // If port is already open, that's okay
                if (!err.message || !err.message.includes('already open')) {
                    throw err;
                }
            }
        }
    }

    async _handleDisconnect () {
        if (this._port) {
            try {
                await this._port.close();
            } catch (_) {}
            this._port = null;
        }
        this._emit({jsonrpc: '2.0', method: 'peripheralUnplug', params: null});
    }

    async _handleWrite (params, sendResult, sendError) {
        if (!this._port || !this._port.writable) {
            sendError('Not connected.');
            return;
        }
        try {
            const encoding = (params && params.encoding) || 'utf8';
            const msg = params && params.message;
            if (msg == null) {
                sendResult(null);
                return;
            }
            const writer = this._port.writable.getWriter();
            try {
                const data = encoding === 'base64'
                    ? Uint8Array.from(atob(msg), c => c.charCodeAt(0))
                    : new TextEncoder().encode(msg);
                await writer.write(data);
            } finally {
                writer.releaseLock();
            }
            sendResult(null);
        } catch (err) {
            sendError(err.message);
        }
    }

    async _handleUpload (params, sendNotification, sendResult, sendError) {
        if (!this._port || !this._port.writable) {
            sendError('Not connected. Connect to the device first.');
            sendResult(null);
            return;
        }

        const config = (params && params.config) || {};
        if (config.type !== 'microPython') {
            sendNotification('uploadError', {message: 'Browser upload supports only MicroPython. Use the desktop app for other devices.'});
            sendResult(null);
            return;
        }

        sendNotification('setUploadAbortEnabled', true);
        this._abortController = new AbortController();

        // Pause background read loop so uploader can read raw REPL ACK bytes.
        if (this._readLoopReader) {
            try {
                await this._readLoopReader.cancel();
            } catch (_) {}
            this._readLoopReader = null;
        }
        if (this._readLoopAbortController) {
            this._readLoopAbortController.abort();
            this._readLoopAbortController = null;
        }
        await new Promise(r => setTimeout(r, 150));

        const encoding = (params && params.encoding) || 'utf8';
        const rawMessage = params && params.message;
        const code = encoding === 'base64'
            ? decodeURIComponent(escape(atob(rawMessage)))
            : (typeof rawMessage === 'string' ? rawMessage : '');

        const onStdout = (text) => {
            sendNotification('uploadStdout', {message: text});
        };

        const filename = 'main.py';

        let result;
        try {
            result = await uploadCodeToDevice(
                this._port,
                code,
                filename,
                onStdout,
                this._abortController.signal
            );
        } finally {
            this._abortController = null;
            sendNotification('setUploadAbortEnabled', false);
            this._startReadLoop(sendNotification);
        }

        if (result === 'Aborted') {
            sendNotification('uploadSuccess', {aborted: true});
        } else if (result === 'Success') {
            sendNotification('uploadSuccess', {aborted: false});
        } else {
            sendNotification('uploadError', {message: (result && result.message) || String(result)});
        }
        sendResult(null);
    }

    async _handleUploadFirmware (params, sendNotification, sendResult, sendError) {
        // Check if we have a port
        if (!this._port) {
            sendError('Not connected. Please connect to the device first.');
            sendResult(null);
            return;
        }

        // Get firmware file from params or prompt user
        let firmwareData = null;
        let offset = 0x1000; // Default to 0x1000 for ESP32 app partition
        let eraseAll = true; // Default: clear flash so old filesystem files are removed

        if (params && params.firmwareData) {
            // Firmware data provided directly (base64 or ArrayBuffer)
            if (typeof params.firmwareData === 'string') {
                // Base64 encoded
                const binaryString = atob(params.firmwareData);
                firmwareData = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    firmwareData[i] = binaryString.charCodeAt(i);
                }
            } else if (params.firmwareData instanceof ArrayBuffer) {
                firmwareData = new Uint8Array(params.firmwareData);
            } else if (params.firmwareData instanceof Uint8Array) {
                firmwareData = params.firmwareData;
            }
            offset = params.offset !== undefined ? params.offset : 0x1000;
            eraseAll = params.eraseAll !== undefined ? Boolean(params.eraseAll) : true;
        } else if (params && params.firmwareUrl) {
            // Firmware URL provided - fetch it
            try {
                sendNotification('uploadStdout', {message: `Downloading firmware from ${params.firmwareUrl}...`});
                const response = await fetch(params.firmwareUrl);
                if (!response.ok) {
                    throw new Error(`Failed to download firmware: ${response.statusText}`);
                }
                firmwareData = new Uint8Array(await response.arrayBuffer());
                offset = params.offset !== undefined ? params.offset : 0x1000;
                eraseAll = params.eraseAll !== undefined ? Boolean(params.eraseAll) : true;
            } catch (err) {
                sendError(`Failed to download firmware: ${err.message}`);
                sendResult(null);
                return;
            }
        } else {
            // No firmware provided - prompt user to select file
            try {
                // Create a file input element
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.bin,.hex';
                
                const fileSelected = new Promise((resolve, reject) => {
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (!file) {
                            reject(new Error('No file selected'));
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            resolve(new Uint8Array(event.target.result));
                        };
                        reader.onerror = () => reject(new Error('Failed to read file'));
                        reader.readAsArrayBuffer(file);
                    };
                    input.oncancel = () => reject(new Error('File selection cancelled'));
                });
                
                sendNotification('uploadStdout', {message: 'Please select a firmware file (.bin or .hex)...'});
                input.click();
                firmwareData = await fileSelected;
                offset = params && params.offset !== undefined ? params.offset : 0x1000;
                eraseAll = params && params.eraseAll !== undefined ? Boolean(params.eraseAll) : true;
            } catch (err) {
                if (err.message === 'File selection cancelled') {
                    sendNotification('uploadSuccess', {aborted: true});
                } else {
                    sendError(err.message || 'Failed to load firmware file');
                }
                sendResult(null);
                return;
            }
        }

        if (!firmwareData || firmwareData.length === 0) {
            sendError('No firmware data provided');
            sendResult(null);
            return;
        }

        sendNotification('setUploadAbortEnabled', true);
        this._abortController = new AbortController();
        
        // Stop read loop before firmware upload
        // esptool-js will request its own port, so we just need to stop our read loop
        if (this._readLoopReader) {
            try {
                await this._readLoopReader.cancel();
            } catch (_) {}
            this._readLoopReader = null;
        }
        if (this._readLoopAbortController) {
            this._readLoopAbortController.abort();
            this._readLoopAbortController = null;
        }
        
        // Wait a bit for read loop to fully stop
        await new Promise(r => setTimeout(r, 300));
        
        // Get the current port reference (for closing later)
        // esptool-js will request a new port, so we don't need to close this one
        const port = this._port;

        const onProgress = (fileIndex, bytesWritten, totalBytes) => {
            const percent = Math.floor((bytesWritten / totalBytes) * 100);
            sendNotification('uploadProgress', {
                bytesWritten: bytesWritten,
                totalBytes: totalBytes,
                percent: percent
            });
        };

        const onLog = (message) => {
            sendNotification('uploadStdout', {message: message});
        };

        const onError = (message) => {
            sendNotification('uploadError', {message: message});
        };

        try {
            const result = await uploadFirmwareToDevice(
                port,
                firmwareData,
                offset,
                onProgress,
                onLog,
                onError,
                this._abortController.signal,
                eraseAll
            );

            this._abortController = null;
            sendNotification('setUploadAbortEnabled', false);

            // After firmware upload, the device resets automatically
            // esptool-js used the same port, so we need to ensure it's fully released
            // Wait a bit for firmware uploader to finish cleanup
            await new Promise(r => setTimeout(r, 500));
            
            if (port) {
                try {
                    // Release any locks first
                    if (port.readable && port.readable.locked) {
                        try {
                            const reader = port.readable.getReader();
                            await reader.cancel();
                            reader.releaseLock();
                        } catch (_) {}
                    }
                    if (port.writable && port.writable.locked) {
                        try {
                            const writer = port.writable.getWriter();
                            writer.releaseLock();
                        } catch (_) {}
                    }
                    
                    // Close our original port - device has reset anyway
                    if (port.readable || port.writable) {
                        try {
                            await port.close();
                            // Wait longer for port to be fully released by OS
                            // This is critical for allowing browser to reconnect without USB unplug
                            await new Promise(r => setTimeout(r, 1500));
                        } catch (closeErr) {
                            // Port might already be closed by esptool-js
                        }
                    }
                } catch (err) {
                    // Ignore errors
                }
                
                // Clear the port reference - forces reconnection
                this._port = null;
                
                // Mark connection as closed
                this._open = false;
                
                // Notify that the device was disconnected (due to reset after firmware flash)
                sendNotification('peripheralUnplug', null);
            }

            if (result === 'Aborted') {
                sendNotification('uploadSuccess', {aborted: true});
            } else if (result === 'Success') {
                sendNotification('uploadSuccess', {aborted: false});
                // After successful firmware upload, device resets
                // Mark that we just flashed firmware so we can wake up device on reconnect
                this._justFlashedFirmware = true;
                // User needs to reconnect manually after device reboots
                sendNotification('uploadStdout', {
                    message: 'Firmware uploaded successfully! Device is resetting. Please wait a few seconds and reconnect.'
                });
            } else {
                sendNotification('uploadError', {message: result});
            }
        } catch (err) {
            this._abortController = null;
            sendNotification('setUploadAbortEnabled', false);
            sendNotification('uploadError', {message: err.message || String(err)});
            
            // On error, clear the port reference
            if (this._port) {
                try {
                    if (this._port.readable || this._port.writable) {
                        await this._port.close();
                    }
                } catch (closeErr) {
                    // Ignore close errors
                }
                
                this._port = null;
                this._open = false;
                sendNotification('peripheralUnplug', null);
            }
        }

        sendResult(null);
    }
}
