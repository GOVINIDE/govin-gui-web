// Govin 2.3.1: Broadcast controls UI component for menu bar
import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';
import styles from './broadcast-controls.css';
import {BroadcastMode, ConnectionStatus} from '../../reducers/broadcast';

class BroadcastControls extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleStartClient',
            'handleShowDialog',
            'handleHideDialog',
            'handleAddressChange',
            'handlePortChange',
            'handleShowPasswordDialog',
            'handleHidePasswordDialog',
            'handlePasswordChange',
            'handlePasswordSubmit'
        ]);
        
        this.state = {
            showClientDialog: false,
            masterAddress: '',
            masterPort: '8765',
            showPasswordDialog: false,
            password: '',
            passwordError: ''
        };
    }

    handleStartClient () {
        if (this.state.masterAddress) {
            this.props.onStartClient(this.state.masterAddress, parseInt(this.state.masterPort));
            this.setState({showClientDialog: false});
        }
    }

    handleShowDialog () {
        this.setState({showClientDialog: true});
    }

    handleHideDialog () {
        this.setState({showClientDialog: false});
    }

    handleAddressChange (e) {
        this.setState({masterAddress: e.target.value});
    }

    handlePortChange (e) {
        this.setState({masterPort: e.target.value});
    }

    handleShowPasswordDialog () {
        this.setState({showPasswordDialog: true, password: '', passwordError: ''});
    }

    handleHidePasswordDialog () {
        this.setState({showPasswordDialog: false, password: '', passwordError: ''});
    }

    handlePasswordChange (e) {
        this.setState({password: e.target.value, passwordError: ''});
    }

    handlePasswordSubmit () {
        const {password} = this.state;
        if (!password) {
            this.setState({passwordError: 'Password is required'});
            return;
        }
        
        // Verify password and call onToggleMaster if correct
        this.props.onVerifyPassword(password, () => {
            // Password correct - close dialog
            this.handleHidePasswordDialog();
        }, (error) => {
            // Password incorrect - show error
            this.setState({passwordError: error || 'Incorrect password'});
        });
    }

    render () {
        const {
            mode,
            enabled,
            connectionStatus,
            connectedClientsCount,
            onToggleMaster,
            onBroadcast,
            onStop
        } = this.props;

        const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
        const isMaster = mode === BroadcastMode.MASTER;
        const isClient = mode === BroadcastMode.CLIENT;

        return (
            <div className={styles.container}>
                {/* Status Indicator */}
                {enabled && (
                    <div className={styles.statusIndicator}>
                        <div className={classNames(styles.statusDot, {
                            [styles.connected]: isConnected,
                            [styles.connecting]: connectionStatus === ConnectionStatus.CONNECTING,
                            [styles.error]: connectionStatus === ConnectionStatus.ERROR
                        })}
                        />
                        <span className={styles.statusText}>
                            {isMaster && (
                                <FormattedMessage
                                    defaultMessage="Teacher ({count} students)"
                                    description="Teacher mode status"
                                    id="gui.broadcastControls.masterStatus"
                                    values={{count: connectedClientsCount}}
                                />
                            )}
                            {isClient && (
                                <FormattedMessage
                                    defaultMessage="Connected to teacher"
                                    description="Client mode status"
                                    id="gui.broadcastControls.clientStatus"
                                />
                            )}
                        </span>
                    </div>
                )}

                {/* Main Controls */}
                {!enabled ? (
                    <div className={styles.buttonGroup}>
                        <button
                            className={styles.masterButton}
                            onClick={this.handleShowPasswordDialog}
                            title="Enable Teacher Mode- Password Required"
                        >
                            <span className={styles.icon}>👨‍🏫</span>
                            <FormattedMessage
                                defaultMessage="Teacher Mode"
                                description="Button to enable Teacher Mode"
                                id="gui.broadcastControls.masterMode"
                            />
                        </button>
                        
                        <button
                            className={styles.clientButton}
                            onClick={this.handleShowDialog}
                            title="Connect to Teacher"
                        >
                            <span className={styles.icon}>👨‍🎓</span>
                            <FormattedMessage
                                defaultMessage="Join Class"
                                description="Button to join as Student"
                                id="gui.broadcastControls.joinClass"
                            />
                        </button>
                    </div>
                ) : (
                    <div className={styles.buttonGroup}>
                        {isMaster && (
                            <button
                                className={styles.broadcastButton}
                                onClick={onBroadcast}
                                disabled={!isConnected}
                                title="Broadcast code to all students"
                            >
                                <span className={styles.icon}>📡</span>
                                <FormattedMessage
                                    defaultMessage="Broadcast Code"
                                    description="Button to broadcast code"
                                    id="gui.broadcastControls.broadcast"
                                />
                            </button>
                        )}
                        
                        <button
                            className={styles.stopButton}
                            onClick={onStop}
                            title="Disconnect"
                        >
                            <span className={styles.icon}>🛑</span>
                            <FormattedMessage
                                defaultMessage="Disconnect"
                                description="Button to stop broadcast"
                                id="gui.broadcastControls.stop"
                            />
                        </button>
                    </div>
                )}

                {/* Client Connection Dialog */}
                {this.state.showClientDialog && (
                    <div className={styles.dialogOverlay} onClick={this.handleHideDialog}>
                        <div className={styles.dialog} onClick={e => e.stopPropagation()}>
                            <div className={styles.dialogHeader}>
                                <FormattedMessage
                                    defaultMessage="Connect to Teacher"
                                    description="Dialog title"
                                    id="gui.broadcastControls.connectDialog.title"
                                />
                            </div>
                            <div className={styles.dialogBody}>
                                <label className={styles.inputLabel}>
                                    <FormattedMessage
                                        defaultMessage="Teacher's IP Address:"
                                        description="Input label for master address"
                                        id="gui.broadcastControls.connectDialog.ipLabel"
                                    />
                                </label>
                                <input
                                    className={styles.input}
                                    placeholder="192.168.1.100"
                                    type="text"
                                    value={this.state.masterAddress}
                                    onChange={this.handleAddressChange}
                                />
                                
                                <label className={styles.inputLabel}>
                                    <FormattedMessage
                                        defaultMessage="Port:"
                                        description="Input label for port"
                                        id="gui.broadcastControls.connectDialog.portLabel"
                                    />
                                </label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={this.state.masterPort}
                                    onChange={this.handlePortChange}
                                />
                            </div>
                            <div className={styles.dialogFooter}>
                                <button
                                    className={styles.cancelButton}
                                    onClick={this.handleHideDialog}
                                >
                                    <FormattedMessage
                                        defaultMessage="Cancel"
                                        description="Cancel button"
                                        id="gui.broadcastControls.connectDialog.cancel"
                                    />
                                </button>
                                <button
                                    className={styles.connectButton}
                                    onClick={this.handleStartClient}
                                >
                                    <FormattedMessage
                                        defaultMessage="Connect"
                                        description="Connect button"
                                        id="gui.broadcastControls.connectDialog.connect"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Dialog for Master Mode */}
                {this.state.showPasswordDialog && (
                    <div className={styles.dialogOverlay} onClick={this.handleHidePasswordDialog}>
                        <div className={styles.dialog} onClick={e => e.stopPropagation()}>
                            <div className={styles.dialogHeader}>
                                <FormattedMessage
                                    defaultMessage="Teacher Mode Activation"
                                    description="Password dialog title"
                                    id="gui.broadcastControls.passwordDialog.title"
                                />
                            </div>
                            <div className={styles.dialogBody}>
                                <label className={styles.inputLabel}>
                                    <FormattedMessage
                                        defaultMessage="Enter Teacher Password to Proceed:"
                                        description="Password input label"
                                        id="gui.broadcastControls.passwordDialog.label"
                                    />
                                </label>
                                <input
                                    className={styles.input}
                                    type="password"
                                    placeholder="Enter password"
                                    value={this.state.password}
                                    onChange={this.handlePasswordChange}
                                    onKeyPress={e => {
                                        if (e.key === 'Enter') {
                                            this.handlePasswordSubmit();
                                        }
                                    }}
                                    autoFocus
                                />
                                {this.state.passwordError && (
                                    <div className={styles.errorMessage}>
                                        {this.state.passwordError}
                                    </div>
                                )}
                                <div className={styles.passwordHint}>
                                    <FormattedMessage
                                        defaultMessage="Only activates with Password"
                                        description="Password hint"
                                        id="gui.broadcastControls.passwordDialog.hint"
                                    />
                                </div>
                            </div>
                            <div className={styles.dialogFooter}>
                                <button
                                    className={styles.cancelButton}
                                    onClick={this.handleHidePasswordDialog}
                                >
                                    <FormattedMessage
                                        defaultMessage="Cancel"
                                        description="Cancel button"
                                        id="gui.broadcastControls.passwordDialog.cancel"
                                    />
                                </button>
                                <button
                                    className={styles.connectButton}
                                    onClick={this.handlePasswordSubmit}
                                >
                                    <FormattedMessage
                                        defaultMessage="Enable Teacher Mode"
                                        description="Submit password button"
                                        id="gui.broadcastControls.passwordDialog.submit"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

BroadcastControls.propTypes = {
    mode: PropTypes.string.isRequired,
    enabled: PropTypes.bool.isRequired,
    connectionStatus: PropTypes.string.isRequired,
    connectedClientsCount: PropTypes.number.isRequired,
    onToggleMaster: PropTypes.func.isRequired,
    onStartClient: PropTypes.func.isRequired,
    onBroadcast: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    onVerifyPassword: PropTypes.func.isRequired // Govin 2.3.1: Password verification callback
};

export default BroadcastControls;

