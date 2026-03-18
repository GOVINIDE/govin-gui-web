import React from 'react';
import PropTypes from 'prop-types';

// Govin 2.2.1 - Added modern CSS styling for sleek modal design
import styles from './check-update-modal.css';

const CheckUpdateModal = ({ onClose, message }) => {
    // const fileUrl = 'https://drive.google.com/drive/folders/1f1FBFC2GwCUpOt9CmlSGfW3Jubtq2vIU?usp=drive_link';
    const fileUrl = 'https://github.com/CARES-GOA-PMU/GOVIN-v.2.0/releases'; //CARES 2.1.6 Redirecto github

    const isUpdateAvailable = message === "update";
    const isUpToDate = message === "noupdate";

    const errorFetch = message === "error";

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            {/* Govin 2.2.1 - Redesigned modal with modern overlay, backdrop blur, and sleek styling */}
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    ×
                </button>

                <div className={styles.modalBody}>
                    {/* Govin 2.2.1 - Added animated gradient icon container with pulsing effects */}
                    <div className={`${styles.iconContainer} ${isUpdateAvailable ? styles.updateAvailable : styles.noUpdate}`}>
                        <div className={styles.icon}>
                            {isUpdateAvailable ? "↑" : "✓"}
                        </div>
                    </div>

                    {/* Govin 2.2.1 - Redesigned content layout with modern typography and spacing */}
                    {isUpdateAvailable && (
                        <>
                            <div className={styles.versionBadge}>
                                New Version Available
                            </div>
                            <h2 className={styles.messageTitle}>
                                Update Ready!
                            </h2>
                            <p className={styles.messageSubtitle}>
                                A new version of Govin is available with improvements and bug fixes.
                            </p>

                            {/* <ul className={styles.featureList}>
                                <li className={styles.featureItem}>Enhanced performance</li>
                                <li className={styles.featureItem}>Bug fixes and improvements</li>
                                <li className={styles.featureItem}>New features and tools</li>
                            </ul> */}

                            {/* Govin 2.2.1 - Modern gradient button with hover effects and shimmer animation */}
                            <div className={styles.buttonContainer}>
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    <button className={styles.downloadButton}>
                                        <span>Download Update</span>
                                        <span>→</span>
                                    </button>
                                </a>
                            </div>
                        </>
                    )}

                    {isUpToDate && (
                        <>
                            <h2 className={styles.messageTitle}>
                                You're Up to Date!
                            </h2>
                            <p className={styles.messageSubtitle}>
                                Govin is running the latest version with all the newest features.
                            </p>

                            <div className={styles.buttonContainer}>
                                <button className={styles.closeOnlyButton} onClick={onClose}>
                                    Great!
                                </button>
                            </div>
                        </>
                    )}

                    {errorFetch && (
                        <>
                            <div className={styles.versionBadge}>
                                Connection Error
                            </div>
                            <h2 className={styles.messageTitle}>
                                Unable to Check for Updates
                            </h2>
                            <p className={styles.messageSubtitle}>
                                Unable to connect to the update server. Please check your internet connection and try again.
                            </p>

                            <div className={styles.buttonContainer}>
                                <button className={styles.closeOnlyButton} onClick={onClose}>
                                    OK
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

CheckUpdateModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    message: PropTypes.string.isRequired,
};

export default CheckUpdateModal;
