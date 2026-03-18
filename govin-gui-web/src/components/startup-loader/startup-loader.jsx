// import React from 'react';
// import styles from './startup-loader.css';
// import packageJson from '../../../package.json';

// const StartupLoader = () => (
//     <div className={styles.startupOverlay}>
//         <div className={styles.loadingContainer}>
//             <div className={styles.logoSection}>
//                 <div className={styles.loadingSpinner}>
//                     <div className={styles.spinnerRing1} />
//                     <div className={styles.spinnerRing2} />
//                     <div className={styles.spinnerRing3} />
//                     <div className={styles.spinnerSegments}>
//                         <div className={styles.segment} />
//                         <div className={styles.segment} />
//                         <div className={styles.segment} />
//                         <div className={styles.segment} />
//                         <div className={styles.segment} />
//                         <div className={styles.segment} />
//                     </div>
//                     <div className={styles.spinnerCore}>
//                         <div className={styles.govinText}>{'GOVIN'}</div>
//                     </div>
//                     <div className={styles.dataLine} />
//                     <div className={styles.dataLine} />
//                 </div>
//             </div>
//             <h1 className={styles.splash}>{'Loading...'}</h1>
//             <div className={styles.loadingDots}>
//                 <div className={styles.dot} />
//                 <div className={styles.dot} />
//                 <div className={styles.dot} />
//             </div>
//             <div className={styles.versionInfo}>{'Please wait while we prepare your workspace'}</div>
//             <div className={styles.versionInfo}>{'Please wait while we prepare your workspace'}</div>
//         </div>
//     </div>
// );

// export default StartupLoader;

import React from 'react';
import styles from './startup-loader.css';
import packageJson from '../../../package.json';

const StartupLoader = () => {
    const appVersion = packageJson.version;

    return (
        <div className={styles.startupOverlay}>
            <div className={styles.loadingContainer}>
                <div className={styles.logoSection}>
                    <div className={styles.loadingSpinner}>
                        <div className={styles.spinnerRing1} />
                        <div className={styles.spinnerRing2} />
                        <div className={styles.spinnerRing3} />
                        <div className={styles.spinnerSegments}>
                            <div className={styles.segment} />
                            <div className={styles.segment} />
                            <div className={styles.segment} />
                            <div className={styles.segment} />
                            <div className={styles.segment} />
                            <div className={styles.segment} />
                        </div>
                        <div className={styles.spinnerCore}>
                            <div className={styles.govinText}>{'GOVIN'}</div>
                        </div>
                        <div className={styles.dataLine} />
                        <div className={styles.dataLine} />
                    </div>
                </div>

                <h1 className={styles.splash}>{'Loading...'}</h1>

                <div className={styles.loadingDots}>
                    <div className={styles.dot} />
                    <div className={styles.dot} />
                    <div className={styles.dot} />
                </div>

                <div className={styles.versionInfo}>
                    {`Please wait while we prepare your workspace`}
                </div>

                <div className={styles.versionInfo}>
                    {`Version: ${appVersion}`}
                </div>
            </div>
        </div>
    );
};

export default StartupLoader;