import {defineMessages} from 'react-intl';
import sharedMessages from '../shared-messages';

let messages = defineMessages({
    grunt: {
        defaultMessage: 'Grunt',
        description: 'Name for the grunt sound',
        id: 'gui.defaultProject.grunt'
    },
    variable: {
        defaultMessage: 'my variable',
        description: 'Name for the default variable',
        id: 'gui.defaultProject.variable'
    }
});

messages = {...messages, ...sharedMessages};

// use the default message if a translation function is not passed
const defaultTranslator = msgObj => msgObj.defaultMessage;

/**
 * Generate a localized version of the default project
 * @param {function} translateFunction a function to use for translating the default names
 * @return {object} the project data json for the default project
 */
const projectData = translateFunction => {
    const translator = translateFunction || defaultTranslator;
    return ({
        targets: [
            {
                isStage: true,
                name: 'Stage',
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
                        name: translator(messages.backdrop, {index: 1}),
                        md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
                        dataFormat: 'svg',
                        rotationCenterX: 240,
                        rotationCenterY: 180
                    }
                ],
                sounds: [
                    {
                        assetId: '83a9787d4cb6f3b7632b4ddfebf74367',
                        name: translator(messages.pop),
                        dataFormat: 'wav',
                        format: '',
                        rate: 11025,
                        sampleCount: 258,
                        md5ext: '83a9787d4cb6f3b7632b4ddfebf74367.wav'
                    }
                ],
                volume: 100
            },
            {
                isStage: false,
                name: 'Gaur', // CARES 2.1.7
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: 'e265f59658ef7515be25429e2404e0f7',
                        // name: translator(messages.costume, {index: 1}),
                        name: 'Gaur-a', //CARES 2.1.7
                        bitmapResolution: 1,
                        md5ext: 'e265f59658ef7515be25429e2404e0f7.svg',
                        dataFormat: 'svg',
                        rotationCenterX: 44,
                        rotationCenterY: 64
                    },
                    {
                        assetId: 'ec10d6be5f31c3efb9b53168f13bd70f',
                        //name: translator(messages.costume, {index: 2}),
                        name: 'Gaur-b', //CARES 2.1.7
                        bitmapResolution: 1,
                        md5ext: 'ec10d6be5f31c3efb9b53168f13bd70f.svg',
                        dataFormat: 'svg',
                        rotationCenterX: 44,
                        rotationCenterY: 64
                    }
                ],
                sounds: [
                    {
                        assetId: '09a47472ea03da7c4669fdeac3264939',
                        name: translator(messages.grunt),
                        dataFormat: 'wav',
                        format: '',
                        rate: 22050,
                        sampleCount: 18688,
                        md5ext: '09a47472ea03da7c4669fdeac3264939.wav'
                    }
                ],
                volume: 100,
                visible: true,
                x: 0,
                y: 0,
                size: 100,
                direction: 90,
                draggable: false,
                rotationStyle: 'all around'
            }
        ],
        meta: {
            semver: '3.0.0',
            vm: '0.1.0',
            agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36' // eslint-disable-line max-len
        }
    });
};


export default projectData;
