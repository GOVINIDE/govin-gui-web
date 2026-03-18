import VM from 'govin-vm';
import storage from '../lib/storage';
import {createWebSerialSocketFactory, shouldUseWebSerial} from '../lib/web-serial/socket-factory.js';

// govin 2.3.2: Purpose: Use Web Serial for SERIALPORT in browser; desktop keeps g-link.

const SET_VM = 'scratch-gui/vm/SET_VM';
const defaultVM = new VM();
defaultVM.attachStorage(storage);

// Browser-only: use Web Serial for upload/connect when g-link is not available (no desktop app).
// Desktop app sets window.GOVIN_DESKTOP = true so it keeps using g-link.
if (shouldUseWebSerial()) {
    defaultVM.runtime.configureScratchLinkSocketFactory(createWebSerialSocketFactory());
}

const initialState = defaultVM;

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_VM:
        return action.vm;
    default:
        return state;
    }
};
const setVM = function (vm) {
    return {
        type: SET_VM,
        vm: vm
    };
};

export {
    reducer as default,
    initialState as vmInitialState,
    setVM
};
