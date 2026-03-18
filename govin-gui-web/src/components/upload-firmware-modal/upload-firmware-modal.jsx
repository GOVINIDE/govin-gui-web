
// Govin 2.3.1: Updated Upload Firmware Modal - Modern styled confirmation dialog
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Modal from 'react-modal';
import classNames from 'classnames';

import styles from './upload-firmware-modal.css';

const UploadFirmwareModal = props => {
    const {
        isOpen = true,
        onConfirm,
        onClose,
        isDarkTheme = false,
        ...componentProps
    } = props;

    return (
        <Modal
            isOpen={isOpen}
            className={classNames(styles.modalContent, isDarkTheme ? styles.darkTheme : null)}
            overlayClassName={styles.modalOverlay}
            contentLabel="Upload Firmware Confirmation"
            onRequestClose={onClose}
            {...componentProps}
        >
            <div className={styles.header}>
                <FormattedMessage
                    defaultMessage="Upload Firmware?"
                    description="Title for firmware upload confirmation modal"
                    id="gui.uploadFirmwareModal.title"
                />
            </div>

            <div className={styles.body}>
                <div className={styles.icon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                </div>

                {/* <div className={styles.message}>
                    <FormattedMessage
                        defaultMessage="This will upload the firmware to the connected device. Do you want to continue?"

                        description="Confirmation message for firmware upload"
                        id="gui.uploadFirmwareModal.message"
                    />
                </div> */}
                <div className={styles.message}>
                    <FormattedMessage
                        defaultMessage="This will upload the firmware to the connected device. Do you want to continue?"
                        description="Confirmation message for firmware upload"
                        id="gui.uploadFirmwareModal.message"
                    />
                    <br />
                    <strong>
                        <FormattedMessage
                            defaultMessage="As of now Firmware Upload is only Supported on Linux Systems. We are working on making it available for Windows soon."
                            description="Warning below firmware confirmation"
                            id="gui.uploadFirmwareModal.warning"
                        />
                    </strong>
                </div>

            </div>

            <div className={styles.footer}>
                <button
                    className={styles.cancelButton}
                    onClick={onClose}
                >
                    <FormattedMessage
                        defaultMessage="Cancel"
                        description="Button to cancel firmware upload"
                        id="gui.uploadFirmwareModal.cancel"
                    />
                </button>

                <button
                    className={styles.confirmButton}
                    onClick={onConfirm}
                >
                    <FormattedMessage
                        defaultMessage="Upload"
                        description="Button to confirm firmware upload"
                        id="gui.uploadFirmwareModal.confirm"
                    />
                </button>
            </div>
        </Modal>
    );
};

UploadFirmwareModal.propTypes = {
    isOpen: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isDarkTheme: PropTypes.bool
};

export default UploadFirmwareModal; 