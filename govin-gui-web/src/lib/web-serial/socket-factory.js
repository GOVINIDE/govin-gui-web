/**
 * Socket factory for the VM: returns Web Serial adapter in browser (when
 * navigator.serial is available and not running in Govin Desktop), otherwise
 * returns the default g-link WebSocket. This keeps desktop upload unchanged.
 *
 * govin 2.3.2: Purpose: Select Web Serial socket for SERIALPORT in browser only;
 * desktop continues to use g-link.
 */

import WebSerialLinkAdapter from './serial-link-adapter.js';

// Lazy load default g-link WebSocket (used for BLE/BT when using Web Serial for SERIALPORT)
let ScratchLinkWebSocket = null;
function getDefaultSocket (type) {
    if (!ScratchLinkWebSocket) {
        ScratchLinkWebSocket = require('govin-vm/src/util/scratch-link-websocket');
    }
    return new ScratchLinkWebSocket(type);
}

/**
 * Returns a factory that creates WebSerialLinkAdapter for SERIALPORT in browser,
 * and default ScratchLinkWebSocket for SERIALPORT in desktop or for BLE/BT.
 * @returns {function(string): object}
 */
export function createWebSerialSocketFactory () {
    return function (type) {
        if (type === 'SERIALPORT') {
            return new WebSerialLinkAdapter();
        }
        return getDefaultSocket(type);
    };
}

/**
 * Use Web Serial for serialport only when:
 * - Running in a browser (window, navigator.serial)
 * - Not in Electron/Desktop (g-link is used there; no change to existing desktop behaviour)
 */
export function shouldUseWebSerial () {
    if (typeof window === 'undefined') return false;
    if (window.GOVIN_DESKTOP) return false;
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) return false;
    return typeof navigator !== 'undefined' && navigator.serial != null;
}
