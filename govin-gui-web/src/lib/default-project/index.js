import projectData from './project-data';

/* eslint-disable import/no-unresolved */
import popWav from '!arraybuffer-loader!./83a9787d4cb6f3b7632b4ddfebf74367.wav';
import meowWav from '!arraybuffer-loader!./4e080acae1c3dc65eef30f07c2b0d4a5.wav'; 
import hamma from '!arraybuffer-loader!./09a47472ea03da7c4669fdeac3264939.wav'; 
import backdrop from '!raw-loader!./cd21514d0531fdffb22204e0ec5ed84a.svg';
import gaur1 from '!raw-loader!./e265f59658ef7515be25429e2404e0f7.svg';
import gaur2 from '!raw-loader!./ec10d6be5f31c3efb9b53168f13bd70f.svg';

import forest from '!raw-loader!./e908c45402237c6dbfe82f19e4f9d690.svg';
import gameOver from '!raw-loader!./19bf83f7a1ad16a4e7a253316686ac0c.svg';
import grass from '!raw-loader!./43a4c39b7c67ba7df35d2c738335ecb4.svg';
import gamewon from '!raw-loader!./ceb09599f83b7c8e450511e69fa0fc3f.svg';


import costume3 from '!raw-loader!./1539398f9e0531b279945199e0d912f2.svg';
import costume4 from '!raw-loader!./11040341808adea8b06675666571844f.svg';
import costume5 from '!raw-loader!./cf04842e5997c197f085649673eda143.svg';
import costume6 from '!raw-loader!./e14580f3d9ace5ecbc6f602485397f11.svg';
import costume7 from '!raw-loader!./a78cd63cc29e02ac7c75d1d8eaad0a43.svg';
import costume8 from '!raw-loader!./7a829a8850a898980f4688860486089c.svg';
import costume9 from '!raw-loader!./86eaaa365403a907c8beb11def912558.svg';

import seed from '!raw-loader!./04d4c590c2a49d49e572a58263cfcfb9.svg';
import sprout from '!raw-loader!./919f6d8fdb485d0f5bb6a3181dde5319.svg';
import plant from '!raw-loader!./5813a3e0aafe9ce375db79ad78e6f36a.svg';




/* eslint-enable import/no-unresolved */

const defaultProject = translator => {
    let _TextEncoder;
    if (typeof TextEncoder === 'undefined') {
        _TextEncoder = require('text-encoding').TextEncoder;
    } else {
        /* global TextEncoder */
        _TextEncoder = TextEncoder;
    }
    const encoder = new _TextEncoder();

    const projectJson = projectData(translator);
    return [{
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: '83a9787d4cb6f3b7632b4ddfebf74367',
        assetType: 'Sound',
        dataFormat: 'WAV',
        data: new Uint8Array(popWav)
    }, {
        id: '4e080acae1c3dc65eef30f07c2b0d4a5',
        assetType: 'Sound',
        dataFormat: 'WAV',
        data: new Uint8Array(meowWav)
    },{
        id: '09a47472ea03da7c4669fdeac3264939',
        assetType: 'Sound',
        dataFormat: 'WAV',
        data: new Uint8Array(hamma)
    },{
        id: 'cd21514d0531fdffb22204e0ec5ed84a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(backdrop)
    }, {
        id: 'e265f59658ef7515be25429e2404e0f7',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(gaur1)
    }, {
        id: 'ec10d6be5f31c3efb9b53168f13bd70f',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(gaur2)
    },{
        id: 'e908c45402237c6dbfe82f19e4f9d690',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(forest)
    }, ,{
        id: '19bf83f7a1ad16a4e7a253316686ac0c',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(gameOver)
    }, ,{
        id: '43a4c39b7c67ba7df35d2c738335ecb4',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(grass)
    },{
        id: 'ceb09599f83b7c8e450511e69fa0fc3f',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(gamewon)
    }, {
        id: '04d4c590c2a49d49e572a58263cfcfb9',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(seed)
    }, {
        id: '919f6d8fdb485d0f5bb6a3181dde5319',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(sprout)
    }, {
        id: '5813a3e0aafe9ce375db79ad78e6f36a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(plant)
    }, {
        id: '1539398f9e0531b279945199e0d912f2',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume3)
    }, {
        id: '11040341808adea8b06675666571844f',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume4)
    }, {
        id: 'cf04842e5997c197f085649673eda143',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume5)
    }, {
        id: 'e14580f3d9ace5ecbc6f602485397f11',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume6)
    }, {
        id: 'a78cd63cc29e02ac7c75d1d8eaad0a43',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume7)
    }, {
        id: '7a829a8850a898980f4688860486089c',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume8)
    }, {
        id: '86eaaa365403a907c8beb11def912558',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume9)
    }];
};

export default defaultProject;
