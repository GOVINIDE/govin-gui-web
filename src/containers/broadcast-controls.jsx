// Govin 2.3.1: Broadcast controls container - Redux integration
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'govin-vm';

import BroadcastControlsComponent from '../components/broadcast-controls/broadcast-controls.jsx';
import {
    setBroadcastMode,
    BroadcastMode
} from '../reducers/broadcast';
import broadcastService from '../lib/broadcast-service';
import {ARDUINO_TAB_INDEX} from '../reducers/editor-tab';
import {MASTER_PASSWORD} from '../lib/broadcast-config'; // Govin 2.3.1: Import master password

class BroadcastControls extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleToggleMaster',
            'handleStartClient',
            'handleBroadcast',
            'handleStop',
            'handleVerifyPassword' // Govin 2.3.1: Password verification
        ]);
    }

    componentDidMount () {
        // Initialize broadcast service with Redux dispatch and VM
        broadcastService.initialize(this.props.dispatch, this.props.vm);
    }

    handleToggleMaster () {
        broadcastService.startMaster()
            .then(success => {
                if (success) {
                    this.props.onSetBroadcastMode(BroadcastMode.MASTER);
                    alert('Teacher mode enabled! Students can now connect to your IP address.');
                } else {
                    alert('Failed to enable master mode. Please check your network settings.');
                }
            });
    }

    // Govin 2.3.1: Verify password before enabling master mode
    handleVerifyPassword (password, onSuccess, onError) {
        if (password === MASTER_PASSWORD) {
            // Password correct - start master mode
            this.handleToggleMaster();
            onSuccess();
        } else {
            // Password incorrect
            onError('Incorrect password. Try Again');
        }
    }

    handleStartClient (masterAddress, port) {
        broadcastService.startClient(masterAddress, port)
            .then(success => {
                if (success) {
                    this.props.onSetBroadcastMode(BroadcastMode.CLIENT);
                } else {
                    alert('Failed to connect to teacher. Please check the IP address and try again.');
                }
            });
    }

    handleBroadcast () {
        // Determine if we're in text mode or blocks mode
        const {activeTabIndex, codeEditorValue} = this.props;
        
        // Check if on text programming tab (Arduino or Python)
        if (activeTabIndex === ARDUINO_TAB_INDEX) {
            // Broadcast text code (same way as file saving)
            const textContent = codeEditorValue || '';
            console.log('Govin 2.3.1: Broadcasting text code, length:', textContent.length, 'preview:', textContent.substring(0, 50));
            broadcastService.broadcast('text', textContent);
            alert(`Broadcasted text code to all students!`);
        } else {
            // Broadcast blocks project
            broadcastService.broadcast('blocks');
            alert(`Broadcasted blocks project to all students!`);
        }
    }

    handleStop () {
        broadcastService.stop();
        this.props.onSetBroadcastMode(BroadcastMode.NONE);
    }

    render () {
        return (
            <BroadcastControlsComponent
                connectedClientsCount={this.props.connectedClients.length}
                connectionStatus={this.props.connectionStatus}
                enabled={this.props.enabled}
                mode={this.props.mode}
                onBroadcast={this.handleBroadcast}
                onStartClient={this.handleStartClient}
                onStop={this.handleStop}
                onToggleMaster={this.handleToggleMaster}
                onVerifyPassword={this.handleVerifyPassword} // Govin 2.3.1: Password verification
            />
        );
    }
}

BroadcastControls.propTypes = {
    mode: PropTypes.string.isRequired,
    enabled: PropTypes.bool.isRequired,
    connectionStatus: PropTypes.string.isRequired,
    connectedClients: PropTypes.array.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    activeTabIndex: PropTypes.number,
    codeEditorValue: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    onSetBroadcastMode: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    mode: state.scratchGui.broadcast.mode,
    enabled: state.scratchGui.broadcast.enabled,
    connectionStatus: state.scratchGui.broadcast.connectionStatus,
    connectedClients: state.scratchGui.broadcast.connectedClients,
    activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
    codeEditorValue: state.scratchGui.code.codeEditorValue // Govin 2.3.1: Fixed - use codeEditorValue (same as file saving)
});

const mapDispatchToProps = dispatch => ({
    dispatch,
    onSetBroadcastMode: mode => dispatch(setBroadcastMode(mode))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BroadcastControls);

