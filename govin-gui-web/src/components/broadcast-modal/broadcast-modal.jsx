// Govin 2.3.1: Confirmation modal for accepting incoming broadcast code
import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import styles from './broadcast-modal.css';

const BroadcastModal = ({
    incomingCode,
    onAccept,
    onReject
}) => {
    if (!incomingCode) return null;

    const codeTypeLabel = incomingCode.type === 'blocks' ? 'Block Code' : 'Text Code';
    const timeString = new Date(incomingCode.timestamp).toLocaleTimeString();

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.header}>
                    <div className={styles.icon}>📡</div>
                    <div className={styles.title}>
                        <FormattedMessage
                            defaultMessage="Incoming Code"
                            description="Title for incoming code modal"
                            id="gui.broadcastModal.title"
                        />
                    </div>
                </div>
                
                <div className={styles.body}>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>
                            <FormattedMessage
                                defaultMessage="From:"
                                description="Label for sender name"
                                id="gui.broadcastModal.from"
                            />
                        </span>
                        <span className={styles.value}>{incomingCode.from}</span>
                    </div>
                    
                    <div className={styles.infoRow}>
                        <span className={styles.label}>
                            <FormattedMessage
                                defaultMessage="Type:"
                                description="Label for code type"
                                id="gui.broadcastModal.type"
                            />
                        </span>
                        <span className={styles.value}>{codeTypeLabel}</span>
                    </div>
                    
                    <div className={styles.infoRow}>
                        <span className={styles.label}>
                            <FormattedMessage
                                defaultMessage="Time:"
                                description="Label for timestamp"
                                id="gui.broadcastModal.time"
                            />
                        </span>
                        <span className={styles.value}>{timeString}</span>
                    </div>
                    
                    <div className={styles.warning}>
                        <FormattedMessage
                            defaultMessage="⚠️ Accepting this code will replace your current work!"
                            description="Warning message about replacing current code"
                            id="gui.broadcastModal.warning"
                        />
                    </div>
                    
                    <div className={styles.message}>
                        <FormattedMessage
                            defaultMessage="Do you want to load this code?"
                            description="Confirmation question"
                            id="gui.broadcastModal.message"
                        />
                    </div>
                </div>
                
                <div className={styles.buttonRow}>
                    <button
                        className={styles.rejectButton}
                        onClick={onReject}
                    >
                        <FormattedMessage
                            defaultMessage="Reject"
                            description="Button to reject incoming code"
                            id="gui.broadcastModal.reject"
                        />
                    </button>
                    <button
                        className={styles.acceptButton}
                        onClick={onAccept}
                    >
                        <FormattedMessage
                            defaultMessage="Accept & Load"
                            description="Button to accept and load incoming code"
                            id="gui.broadcastModal.accept"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

BroadcastModal.propTypes = {
    incomingCode: PropTypes.shape({
        type: PropTypes.oneOf(['blocks', 'text']).isRequired,
        data: PropTypes.any.isRequired,
        from: PropTypes.string.isRequired,
        timestamp: PropTypes.number.isRequired
    }),
    onAccept: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired
};

export default BroadcastModal;

