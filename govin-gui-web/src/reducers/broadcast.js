// Govin 2.3.1: Classroom broadcast feature - Redux state management
const SET_BROADCAST_MODE = 'scratch-gui/broadcast/SET_BROADCAST_MODE';
const SET_BROADCAST_ENABLED = 'scratch-gui/broadcast/SET_BROADCAST_ENABLED';
const SET_INCOMING_CODE = 'scratch-gui/broadcast/SET_INCOMING_CODE';
const CLEAR_INCOMING_CODE = 'scratch-gui/broadcast/CLEAR_INCOMING_CODE';
const ADD_CONNECTED_CLIENT = 'scratch-gui/broadcast/ADD_CONNECTED_CLIENT';
const REMOVE_CONNECTED_CLIENT = 'scratch-gui/broadcast/REMOVE_CONNECTED_CLIENT';
const SET_CONNECTION_STATUS = 'scratch-gui/broadcast/SET_CONNECTION_STATUS';

const BroadcastMode = {
    NONE: 'none',
    MASTER: 'master',
    CLIENT: 'client'
};

const ConnectionStatus = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
};

const initialState = {
    mode: BroadcastMode.NONE,
    enabled: false,
    incomingCode: null, // {type: 'blocks' | 'text', data: string, from: string}
    connectedClients: [], // Array of {id, name}
    connectionStatus: ConnectionStatus.DISCONNECTED,
    serverPort: 8765, // Default WebSocket port
    masterPassword: '' // Optional password for master mode
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    
    switch (action.type) {
    case SET_BROADCAST_MODE:
        return Object.assign({}, state, {
            mode: action.mode
        });
    case SET_BROADCAST_ENABLED:
        return Object.assign({}, state, {
            enabled: action.enabled
        });
    case SET_INCOMING_CODE:
        return Object.assign({}, state, {
            incomingCode: action.incomingCode
        });
    case CLEAR_INCOMING_CODE:
        return Object.assign({}, state, {
            incomingCode: null
        });
    case ADD_CONNECTED_CLIENT:
        return Object.assign({}, state, {
            connectedClients: [...state.connectedClients, action.client]
        });
    case REMOVE_CONNECTED_CLIENT:
        return Object.assign({}, state, {
            connectedClients: state.connectedClients.filter(c => c.id !== action.clientId)
        });
    case SET_CONNECTION_STATUS:
        return Object.assign({}, state, {
            connectionStatus: action.status
        });
    default:
        return state;
    }
};

const setBroadcastMode = mode => ({
    type: SET_BROADCAST_MODE,
    mode
});

const setBroadcastEnabled = enabled => ({
    type: SET_BROADCAST_ENABLED,
    enabled
});

const setIncomingCode = incomingCode => ({
    type: SET_INCOMING_CODE,
    incomingCode
});

const clearIncomingCode = () => ({
    type: CLEAR_INCOMING_CODE
});

const addConnectedClient = client => ({
    type: ADD_CONNECTED_CLIENT,
    client
});

const removeConnectedClient = clientId => ({
    type: REMOVE_CONNECTED_CLIENT,
    clientId
});

const setConnectionStatus = status => ({
    type: SET_CONNECTION_STATUS,
    status
});

export {
    reducer as default,
    initialState as broadcastInitialState,
    BroadcastMode,
    ConnectionStatus,
    setBroadcastMode,
    setBroadcastEnabled,
    setIncomingCode,
    clearIncomingCode,
    addConnectedClient,
    removeConnectedClient,
    setConnectionStatus
};

