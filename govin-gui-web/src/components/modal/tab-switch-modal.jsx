import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import Modal from 'react-modal';
import classNames from 'classnames';

import styles from './tab-switch-modal.css';

const TabSwitchModal = props => {
    const {
        isOpen,
        onConfirm,
        onCancel,
        isDarkTheme = false,
        ...componentProps
    } = props;

    return (
        <Modal
            isOpen={isOpen}
            className={classNames(styles.modalContent, isDarkTheme ? styles.darkTheme : null)}
            overlayClassName={styles.modalOverlay}
            contentLabel="Tab Switch Warning"
            onRequestClose={onCancel}
            {...componentProps}
        >
            <div className={styles.header}>
                <FormattedMessage
                    defaultMessage="Switch to Block Based Coding?"
                    description="Title for tab switch warning modal"
                    id="gui.modal.tabSwitch.title"
                />
            </div>
            
            <div className={styles.body}>
                <div className={styles.icon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                
                <div className={styles.message}>
                    <FormattedMessage
                        defaultMessage="You are switching from Text Programming to Block Based Coding. Any unsaved changes in your text code will be lost. Are you sure you want to continue?"
                        description="Warning message about losing text programming changes"
                        id="gui.modal.tabSwitch.message"
                    />
                </div>
            </div>
            
            <div className={styles.footer}>
                <button
                    className={styles.cancelButton}
                    onClick={onCancel}
                >
                    <FormattedMessage
                        defaultMessage="Cancel"
                        description="Cancel button for tab switch modal"
                        id="gui.modal.tabSwitch.cancel"
                    />
                </button>
                
                <button
                    className={styles.confirmButton}
                    onClick={onConfirm}
                >
                    <FormattedMessage
                        defaultMessage="Continue"
                        description="Confirm button for tab switch modal"
                        id="gui.modal.tabSwitch.confirm"
                    />
                </button>
            </div>
        </Modal>
    );
};

TabSwitchModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isDarkTheme: PropTypes.bool
};

export default TabSwitchModal;
