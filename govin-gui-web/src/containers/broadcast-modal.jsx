// Govin 2.3.1: Broadcast modal container for accepting incoming code from teacher
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'govin-vm';

import BroadcastModalComponent from '../components/broadcast-modal/broadcast-modal.jsx';
import {clearIncomingCode} from '../reducers/broadcast';
import {setCodeEditorValue} from '../reducers/code'; // Govin 2.3.1: Import code editor action
import broadcastService from '../lib/broadcast-service';

class BroadcastModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAccept',
            'handleReject'
        ]);
    }

    handleAccept () {
        const {incomingCode} = this.props;
        
        if (!incomingCode) return;

        try {
            if (incomingCode.type === 'blocks') {
                // Load blocks project
                this.props.vm.loadProject(incomingCode.data)
                    .then(() => {
                        // console.log('✓ Govin 2.3.1: Successfully loaded broadcasted blocks project');
                        this.props.onClearIncomingCode();
                    })
                    .catch(err => {
                        // console.error('✗ Govin 2.3.1: Failed to load blocks project:', err);
                        alert('Failed to load the received code. Please try again.');
                    });
            } else if (incomingCode.type === 'text') {
                // Govin 2.3.1: Ensure we have valid content
                const textContent = incomingCode.data || '';
                const {deviceType} = this.props;
                
                // Govin 2.3.1: Determine file extension based on device type (same as hardware-test)
                const ext = deviceType === 'arduino' ? 'ino' : 'py';
                const filename = `broadcast_code.${ext}`;
                
                // console.log('Govin 2.3.1: Loading text code, length:', textContent.length, 'deviceType:', deviceType, 'extension:', ext);
                
                // Govin 2.3.1: Load text code via Redux action first
                this.props.onSetCodeEditorValue(textContent);
                
                // Govin 2.3.1: Notify the tabs/editor to display the content (same as file loading)
                // Use setTimeout to ensure Redux state is updated and editor is ready
                setTimeout(() => {
                    if (typeof window !== 'undefined') {
                        const evt = new CustomEvent('hardware.openFile', { 
                            detail: { 
                                name: filename, // Govin 2.3.1: Use device-specific extension (.ino or .py)
                                content: textContent // Ensure we use the same content
                            } 
                        });
                        window.dispatchEvent(evt);
                        // console.log('Govin 2.3.1: Dispatched hardware.openFile event with filename:', filename, 'content length:', textContent.length);
                    }
                }, 100); // Small delay to ensure state is updated
                
                // console.log('✓ Govin 2.3.1: Successfully loaded broadcasted text code');
                this.props.onClearIncomingCode();
            }
        } catch (error) {
            // console.error('✗ Govin 2.3.1: Error loading received code:', error);
            alert('An error occurred while loading the code.');
        }
    }

    handleReject () {
        this.props.onClearIncomingCode();
    }

    render () {
        if (!this.props.incomingCode) {
            return null;
        }

        return (
            <BroadcastModalComponent
                incomingCode={this.props.incomingCode}
                onAccept={this.handleAccept}
                onReject={this.handleReject}
            />
        );
    }
}

BroadcastModal.propTypes = {
    incomingCode: PropTypes.shape({
        type: PropTypes.oneOf(['blocks', 'text']).isRequired,
        data: PropTypes.any.isRequired,
        from: PropTypes.string.isRequired,
        timestamp: PropTypes.number.isRequired
    }),
    vm: PropTypes.instanceOf(VM).isRequired,
    deviceType: PropTypes.string, // Govin 2.3.1: Device type for file extension
    onClearIncomingCode: PropTypes.func.isRequired,
    onSetCodeEditorValue: PropTypes.func.isRequired // Govin 2.3.1: Text code editor action
};

const mapStateToProps = state => ({
    incomingCode: state.scratchGui.broadcast.incomingCode,
    deviceType: state.scratchGui.device.deviceType // Govin 2.3.1: Get device type for file extension
});

const mapDispatchToProps = dispatch => ({
    onClearIncomingCode: () => dispatch(clearIncomingCode()),
    onSetCodeEditorValue: value => dispatch(setCodeEditorValue(value)) // Govin 2.3.1: Dispatch text code to editor
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BroadcastModal);

