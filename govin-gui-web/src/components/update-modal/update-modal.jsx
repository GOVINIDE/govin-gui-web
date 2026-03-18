import React from 'react';
import { intlShape, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ProgressBar from '@ramonak/react-progress-bar';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import { UPDATE_MODAL_STATE, RESOURCE_UPDATE_STATE, RESOURCE_UPDATE_CONTENT } from '../../lib/update-state.js';

import styles from './update-modal.css';

// Adds an initial offset value to the progress bar so that it can display the full percentage at the beginning
const PROGRESS_INITIAL_OFFSET_VALUE = 13.0;

const calculateProgressBarValue = progress => parseFloat(((progress * (100 - PROGRESS_INITIAL_OFFSET_VALUE)) + PROGRESS_INITIAL_OFFSET_VALUE).toFixed(1)); // eslint-disable-line max-len

const UpdateModalComponent = props => {
    let updateMessage;
    if (props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdateAvailable ||
        props.updateState.phase === UPDATE_MODAL_STATE.applicationUpdateAvailable) {
        if (typeof props.updateState.info.message === 'object') {
            if (props.updateState.info.message[`${props.intl.locale}`]) {
                updateMessage = props.updateState.info.message[`${props.intl.locale}`];
            } else if (props.intl.locale === 'zh-tw') {
                updateMessage = props.updateState.info.message['zh-cn'];
            } else {
                updateMessage = props.updateState.info.message.en;
            }
        }
    }

    const close = (
        <FormattedMessage
            defaultMessage="Close"
            description="Button in bottom to close update modal"
            id="gui.updateModal.close"
        />
    );

    const downloading = (
        <FormattedMessage
            defaultMessage="Downloading"
            description="Prompt for in downloading porgress"
            id="gui.updateModal.downloading"
        />
    );

    const abort = (
        <FormattedMessage
            defaultMessage="Abort"
            description="Button in bottom to abort update"
            id="gui.updateModal.abort"
        />
    );

    const progressBar = value => (
        <ProgressBar
            completed={value}
            bgColor="#4C97FF"
            baseBgColor="#D9E3F2"
            height="15px"
        />
    );

    return (
        <Modal
            className={styles.modalContent}
            headerClassName={styles.header}
            id="updateModal"
            onRequestClose={props.onCancel}
            shouldCloseOnOverlayClick={false}
            closeButtonVisible={false}
        >
            <Box className={styles.body}>
                {(props.updateState.phase === UPDATE_MODAL_STATE.checkingResource ||
                    props.updateState.phase === UPDATE_MODAL_STATE.checkingApplication) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="Checking for update"
                                description="Tile of update modal in checking for update"
                                id="gui.updateModel.tileCheckingForUpdate"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            <FormattedMessage
                                defaultMessage="Depending on your network, this step may take a few seconds to a dozen seconds, please wait." // eslint-disable-line max-len
                                description="Prompt for in checking update process"
                                id="gui.updateModel.checkingTips"
                            />
                        </div>
                        <div className={styles.bottomArea}>
                            <button
                                className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                onClick={props.onCancel}
                            >
                                {close}
                            </button>
                        </div>
                    </div>
                ) : null}
                {props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdateAvailable ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="New version of external resource detected"
                                description="Tile of update modal in new external resource version detected"
                                id="gui.updateModel.tileUpdateExternalResource"
                            />
                            {`: ${props.updateState.info.version}`}
                        </div>
                        <div className={styles.updateInfo}>
                            {updateMessage ? Object.keys(updateMessage).map((subTitle, index) => (
                                <div key={index}>
                                    <div className={styles.updateInfoSubTitle} >
                                        {subTitle}
                                    </div>
                                    <div className={styles.updateInfoDetail} >
                                        {updateMessage[`${subTitle}`].join('\n')}
                                    </div>
                                    {index === Object.keys(updateMessage).length - 1 ? null : <br />}
                                </div>
                            )) : null}
                        </div>
                        <div className={styles.bottomArea}>
                            <div className={styles.updateButtonWrapper}>
                                <button
                                    className={classNames(styles.bottomAreaItem,
                                        styles.updateButton, styles.primary)}
                                    onClick={props.onCancel}
                                >
                                    <FormattedMessage
                                        defaultMessage="Update later"
                                        description="Button in bottom to update later"
                                        id="gui.updateModal.updateLater"
                                    />
                                </button>
    
                                <button
                                    className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                    onClick={() => {
                                        props.onCancel(); // Close the modal
                                        setTimeout(() => {
                                            window.open("https://github.com/CARES-GOA-PMU/GOVIN-v.2.0/releases", "_blank"); // Redirect after closing
                                        }, 300); // Small delay to ensure smooth UI transition
                                    }}
                                >
                                    <FormattedMessage
                                        defaultMessage="Update Now"
                                        description="Button in bottom to confirm update now"
                                        id="gui.updateModal.updateNow"
                                    />
                                </button>

                            </div>
                        </div>
                    </div>
                ) : null}
                {props.updateState.phase === UPDATE_MODAL_STATE.applicationUpdateAvailable ? (
                    <div className={styles.centeredContent}>
                        {/* Govin 2.2.1 - Redesigned application update modal with modern UI, animated icons, and sleek styling */}
                        {/* Govin 2.2.1 - Added animated gradient icon container with pulsing effects */}
                        <div className={`${styles.iconContainer} ${styles.appUpdate}`}>
                            <div className={styles.icon}>↑</div>
                        </div>
                        
                        <div className={styles.versionBadge}>
                            <FormattedMessage
                                defaultMessage="New Version Available"
                                description="Badge for new version available"
                                id="gui.updateModal.newVersionBadge"
                            />
                        </div>
                        
                        <div className={classNames(styles.updateTitle, styles.appUpdate)}>
                            <FormattedMessage
                                defaultMessage="Application Update Ready!"
                                description="Title for application update available"
                                id="gui.updateModel.appUpdateReady"
                            />
                        </div>
                        
                        <div className={styles.messageSubtitle}>
                            <FormattedMessage
                                defaultMessage="A new version of Govin is available with improvements and bug fixes."
                                description="Subtitle for application update"
                                id="gui.updateModal.appUpdateSubtitle"
                            />
                        </div>
                        
                        {updateMessage ? (
                            <div className={styles.updateInfo}>
                                {Object.keys(updateMessage).map((subTitle, index) => (
                                    <div key={index}>
                                        <div className={styles.updateInfoSubTitle} >
                                            {subTitle}
                                        </div>
                                        <div className={styles.updateInfoDetail} >
                                            {updateMessage[`${subTitle}`].join('\n')}
                                        </div>
                                        {index === Object.keys(updateMessage).length - 1 ? null : <br />}
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {/* Govin 2.2.1 - Modern gradient buttons with hover effects and improved styling */}
                        <div className={styles.buttonContainer}>
                            <button
                                className={classNames(styles.updateButton, styles.primary)}
                                onClick={props.onCancel}
                            >
                                <FormattedMessage
                                    defaultMessage="Update Later"
                                    description="Button to update application later"
                                    id="gui.updateModal.appUpdateLater"
                                />
                            </button>

                            <button
                                className={styles.updateButton}
                                onClick={() => {
                                    props.onCancel();
                                    setTimeout(() => {
                                        window.open("https://github.com/CARES-GOA-PMU/GOVIN-v.2.0/releases", "_blank");
                                    }, 300);
                                }}
                            >
                                <span>
                                    <FormattedMessage
                                        defaultMessage="Update Now"
                                        description="Button to update application now"
                                        id="gui.updateModal.appUpdateNow"
                                    />
                                </span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.latest) ? (
                    <div className={styles.centeredContent}>
                        {/* Govin 2.2.1 - Redesigned up-to-date state with modern success styling */}
                        {/* Govin 2.2.1 - Added success icon with green gradient and pulsing animation */}
                        <div className={`${styles.iconContainer} ${styles.success}`}>
                            <div className={styles.icon}>✓</div>
                        </div>
                        
                        <div className={classNames(styles.updateTitle, styles.success)}>
                            <FormattedMessage
                                defaultMessage="You're Up to Date!"
                                description="Title for already latest version"
                                id="gui.updateModel.upToDateTitle"
                            />
                        </div>
                        
                        <div className={styles.messageSubtitle}>
                            <FormattedMessage
                                defaultMessage="Govin is running the latest version with all the newest features."
                                description="Subtitle for already latest version"
                                id="gui.updateModel.upToDateSubtitle"
                            />
                        </div>

                        <div className={styles.buttonContainer}>
                            <button
                                className={classNames(styles.updateButton, styles.primary)}
                                onClick={props.onCancel}
                            >
                                <FormattedMessage
                                    defaultMessage="Great!"
                                    description="Button to close up-to-date modal"
                                    id="gui.updateModal.great"
                                />
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.error) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="Operation failed"
                                description="Tile of update modal in error"
                                id="gui.updateModel.tileError"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            {props.updateState.info.message ? props.updateState.info.message : null}
                        </div>
                        <div className={styles.bottomArea}>
                            <button
                                className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                onClick={props.onCancel}
                            >
                                {close}
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdating) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="Upgrading external resource"
                                description="Tile of update modal in external resource upgrading"
                                id="gui.updateModel.upgradingExternalResource"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            <div className={classNames(styles.updateInfoWrapper)}>
                                <div >
                                    {props.updateState.info.phase === RESOURCE_UPDATE_STATE.downloading ?
                                        downloading : null}
                                    {props.updateState.info.phase === RESOURCE_UPDATE_STATE.deleting ?
                                        (props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.zip ?
                                            <FormattedMessage
                                                defaultMessage="Deleting compressed file"
                                                description="Prompt for in deleting compressed file porgress"
                                                id="gui.updateModal.deletingCompressedFile"
                                            /> :
                                            <FormattedMessage
                                                defaultMessage="Deleting cache file"
                                                description="Prompt for in deleting cache file porgress"
                                                id="gui.updateModal.deletingCacheFile"
                                            />
                                        ) : null}
                                    {props.updateState.info.phase === RESOURCE_UPDATE_STATE.extracting ?
                                        <FormattedMessage
                                            defaultMessage="Extracting compressed file"
                                            description="Prompt for in extracting compressed file porgress"
                                            id="gui.updateModal.extractingCompressedFile"
                                        /> : null}
                                    {props.updateState.info.phase === RESOURCE_UPDATE_STATE.verifying ?
                                        (props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.zip ?
                                            <FormattedMessage
                                                defaultMessage="Verifying compressed file"
                                                description="Prompt for in verifying compressed file porgress"
                                                id="gui.updateModal.verifyingCompressedFile"
                                            /> :
                                            <FormattedMessage
                                                defaultMessage="Verifying cache file"
                                                description="Prompt for in verifying cache file porgress"
                                                id="gui.updateModal.verifyingCacheFile"
                                            />
                                        ) : null}
                                </div>
                                <div>
                                    {props.updateState.info.state ?
                                        <div >
                                            {props.updateState.info.state.speed}
                                        </div> : null}
                                </div>
                            </div>
                            <div className={classNames(styles.progressWrapper)}>
                                {progressBar(calculateProgressBarValue(props.updateState.info.progress))}
                            </div>
                            {props.updateState.info.state ?
                                <div className={classNames(styles.updateInfoWrapper)}>
                                    <div >
                                        {props.updateState.info.phase === RESOURCE_UPDATE_STATE.downloading ?
                                            props.updateState.info.state.name : null}
                                    </div>
                                    {props.updateState.info.state.done && props.updateState.info.state.total ?
                                        <div >
                                            {`${props.updateState.info.state.done}/` +
                                                `${props.updateState.info.state.total}`}
                                        </div> : null}
                                </div> : null}
                        </div>
                        <div className={styles.bottomArea}>
                            <button
                                className={classNames(styles.bottomAreaItem, styles.updateButton)}
                                onClick={props.onCancel}
                                disabled={props.updateState.info.phase === RESOURCE_UPDATE_STATE.extracting ||
                                    (props.updateState.info.phase === RESOURCE_UPDATE_STATE.verifying &&
                                        props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.cache) ||
                                    (props.updateState.info.phase === RESOURCE_UPDATE_STATE.deleting &&
                                        (props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.errorCache ||
                                            props.updateState.info.state.name === RESOURCE_UPDATE_CONTENT.zip))}
                            >
                                {abort}
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.resourceUpdatFinish) ? (
                    <div>
                        <div className={styles.updateTitle}>
                            <FormattedMessage
                                defaultMessage="External resource update complete"
                                description="Tile of update modal in external resource update finish"
                                id="gui.updateModel.tileResourceUpdateFinish"
                            />
                        </div>
                        <div className={styles.updateInfo}>
                            <FormattedMessage
                                defaultMessage="External resource update complete, the application will automatically restart after 3 seconds." // eslint-disable-line max-len
                                description="Prompt for external resource update finish"
                                id="gui.updateModal.resourceUpdateFinishTips"
                            />
                        </div>
                        <div className={styles.bottomArea} />
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.applicationDownloading) ? (
                    <div className={styles.centeredContent}>
                        {/* Govin 2.2.1 - Redesigned downloading state with animated progress indicators */}
                        {/* Govin 2.2.1 - Added rotating download icon with purple gradient */}
                        <div className={`${styles.iconContainer} ${styles.downloading}`}>
                            <div className={styles.icon}>⬇</div>
                        </div>
                        
                        <div className={classNames(styles.updateTitle, styles.appUpdate)}>
                            <FormattedMessage
                                defaultMessage="Downloading Application"
                                description="Title for application downloading"
                                id="gui.updateModel.downloadingApplication"
                            />
                        </div>
                        
                        <div className={styles.messageSubtitle}>
                            <FormattedMessage
                                defaultMessage="Please wait while the new version is being downloaded..."
                                description="Subtitle for application downloading"
                                id="gui.updateModal.downloadingSubtitle"
                            />
                        </div>
                        
                        {/* Govin 2.2.1 - Enhanced progress display with speed and percentage indicators */}
                        <div className={styles.progressContainer}>
                            <div className={styles.progressStatus}>
                                {downloading}
                                {props.updateState.info.state && props.updateState.info.state.speed && (
                                    <span> - {props.updateState.info.state.speed}</span>
                                )}
                            </div>
                            
                            <div className={styles.progressWrapper}>
                                {progressBar(calculateProgressBarValue(props.updateState.info.progress))}
                            </div>
                            
                            {props.updateState.info.state && props.updateState.info.state.done && props.updateState.info.state.total && (
                                <div className={styles.progressDetails}>
                                    <span>{`${props.updateState.info.state.done}/${props.updateState.info.state.total}`}</span>
                                    <span>{Math.round(calculateProgressBarValue(props.updateState.info.progress))}%</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.buttonContainer}>
                            <button
                                className={classNames(styles.updateButton, styles.primary)}
                                onClick={props.onCancel}
                            >
                                {abort}
                            </button>
                        </div>
                    </div>
                ) : null}
                {(props.updateState.phase === UPDATE_MODAL_STATE.applicationDownloadFinish) ? (
                    <div className={styles.centeredContent}>
                        {/* Govin 2.2.1 - Redesigned download complete state with success styling */}
                        {/* Govin 2.2.1 - Added success checkmark icon with green gradient */}
                        <div className={`${styles.iconContainer} ${styles.success}`}>
                            <div className={styles.icon}>✓</div>
                        </div>
                        
                        <div className={classNames(styles.updateTitle, styles.success)}>
                            <FormattedMessage
                                defaultMessage="Download Complete!"
                                description="Title for application download complete"
                                id="gui.updateModel.downloadCompleteTitle"
                            />
                        </div>
                        
                        <div className={styles.messageSubtitle}>
                            <FormattedMessage
                                defaultMessage="Application download complete. The installer will start automatically in 3 seconds."
                                description="Subtitle for application download complete"
                                id="gui.updateModal.downloadCompleteSubtitle"
                            />
                        </div>
                    </div>
                ) : null}
            </Box>
        </Modal>
    );
};

UpdateModalComponent.propTypes = {
    intl: intlShape,
    onClickUpdate: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    updateState: PropTypes.shape({
        phase: PropTypes.oneOf(Object.keys(UPDATE_MODAL_STATE)),
        info:
            PropTypes.shape({
                version: PropTypes.string,
                message: PropTypes.oneOf([PropTypes.object, PropTypes.string]),
                phase: PropTypes.string,
                progress: PropTypes.number,
                state: PropTypes.shape({
                    name: PropTypes.string,
                    speed: PropTypes.string,
                    total: PropTypes.string,
                    done: PropTypes.string
                })
            })
    })
};

export {
    UpdateModalComponent as default
};
