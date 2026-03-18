import React from 'react';
import { FormattedMessage } from 'react-intl';
import { defaults } from 'lodash';
import log from '../../log';
import { DeviceType } from '../../device';


import arduinoBaseToolBox from './baseToolbox/arduino';
import microbitBaseToolBox from './baseToolbox/microbit';
//CARES
import microPythonBaseToolBox from './baseToolbox/microPython'; //cares

import unselectDeviceIconURL from './unselectDevice/unselectDevice.png';

import arduinoUnoIconURL from './arduinoUno/arduinoUno.png';
import arduinoUnoConnectionIconURLL from './arduinoUno/arduinoUno-illustration.svg';
import arduinoUnoConnectionSmallIconURL from './arduinoUno/arduinoUno-small.svg';

import arduinoNanoIconURL from './arduinoNano/arduinoNano.png';
import arduinoNanoConnectionIconURLL from './arduinoNano/arduinoNano-illustration.svg';
import arduinoNanoConnectionSmallIconURL from './arduinoNano/arduinoNano-small.svg';

import arduinoLeonardoIconURL from './arduinoLeonardo/arduinoLeonardo.png';
import arduinoLeonardoConnectionIconURLL from './arduinoLeonardo/arduinoLeonardo-illustration.svg';
import arduinoLeonardoConnectionSmallIconURL from './arduinoLeonardo/arduinoLeonardo-small.svg';

import arduinoMega2560IconURL from './arduinoMega2560/arduinoMega2560.png';
import arduinoMega2560ConnectionIconURLL from './arduinoMega2560/arduinoMega2560-illustration.svg';
import arduinoMega2560ConnectionSmallIconURL from './arduinoMega2560/arduinoMega2560-small.svg';

import microbitIconURL from './microbit/microbit.png';
import microbitConnectionIconURLL from './microbit/microbit-illustration.svg';
import microbitConnectionSmallIconURL from './microbit/microbit-small.svg';

import microbitV2IconURL from './microbitV2/microbitV2.png';
import microbitV2ConnectionIconURLL from './microbitV2/microbitV2-illustration.svg';
import microbitV2ConnectionSmallIconURL from './microbitV2/microbitV2-small.svg';

import esp32IconURL from './esp32/esp32.png';
import esp32ConnectionIconURLL from './esp32/esp32-illustration.svg';
import esp32ConnectionSmallIconURL from './esp32/esp32-small.svg';

import esp8266NodeMCUIconURL from './esp8266NodeMCU/esp8266NodeMCU.png';
import esp8266NodeMCUConnectionIconURL from './esp8266NodeMCU/esp8266NodeMCU-illustration.svg';
import esp8266NodeMCUConnectionSmallIconURL from './esp8266NodeMCU/esp8266NodeMCU-small.svg';

import k210MaixDockIconURL from './k210MaixDock/k210MaixDock.png';
import k210MaixDockConnectionIconURLL from './k210MaixDock/k210MaixDock-illustration.svg';
import k210MaixDockConnectionSmallIconURL from './k210MaixDock/k210MaixDock-small.svg';

import k210MaixduinoIconURL from './k210Maixduino/k210Maixduino.png';
import k210MaixduinoConnectionIconURLL from './k210Maixduino/k210Maixduino-illustration.svg';
import k210MaixduinoConnectionSmallIconURL from './k210Maixduino/k210Maixduino-small.svg';

import raspberryPiPicoIconURL from './raspberryPiPico/raspberryPiPico.png';
import raspberryPiPicoConnectionIconURL from './raspberryPiPico/raspberryPiPico-illustration.svg';
import raspberryPiPicoConnectionSmallIconURL from './raspberryPiPico/raspberryPiPico-small.svg';

import makeymakeyIconURL from './makeymakey/makeymakey.png';
import makeymakeyConnectionIconURL from './makeymakey/makeymakey-illustration.svg';
import makeymakeyConnectionSmallIconURL from './makeymakey/makeymakey-small.svg';

//CARES
import esp32microPythonIconURL from './espmicropython/esp32micropython.png';
import esp32microPythonConnectionIconURL from './espmicropython/esp32micropython-illustration.svg';
import esp32microPythonConnectionSmallIconURL from './espmicropython/esp32micropython-small.svg';

//CARES Genesis
import esp32genesisIconURL from './caresGenesis/esp32genesis.png';
import esp32genesisConnectionIconURL from './caresGenesis/esp32genesis-illustration.svg';
import esp32genesisConnectionSmallIconURL from './caresGenesis/esp32genesis-small.svg';

//CARES Odyssey
import esp32odysseyIconURL from './caresOdyssey/esp32odyssey.png';
import esp32odysseyConnectionIconURL from './caresOdyssey/esp32odyssey-illustration.svg';
import esp32odysseyConnectionSmallIconURL from './caresOdyssey/esp32odyssey-small.svg';

//CARES Apex
import esp32apexIconURL from './caresApex/esp32apex.png';
import esp32apexConnectionIconURL from './caresApex/esp32apex-illustration.svg';
import esp32apexConnectionSmallIconURL from './caresApex/esp32apex-small.svg';

 //CARES Nirman CNC
 import esp32nirmanIconURL from './caresCNC/esp32nirman.png';
import esp32nirmanConnectionIconURL from './caresCNC/esp32nirman-illustration.svg';
import esp32nirmanConnectionSmallIconURL from './caresCNC/esp32nirman-small.svg';

//CARES Garuda
import esp32garudaIconURL from './caresGaruda/esp32garuda.png';
import esp32garudaConnectionIconURL from './caresGaruda/esp32garuda-illustration.svg';
import esp32garudaConnectionSmallIconURL from './caresGaruda/esp32garuda-small.svg';



const deviceData = [
    /**
     * Unselect the deivce back to pure scratch mode
     */
    {
        name: (
            <FormattedMessage
                defaultMessage="Unselect device"
                description="Name for the unselect device"
                id="gui.device.unselectDevice.name"
            />
        ),
        deviceId: 'null',
        iconURL: unselectDeviceIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Unselect the device, return to pure realtime programming mode."
                description="Description for the unselect device"
                id="gui.device.unselectDevice.description"
            />
        ),
        featured: true,
        hide: false
        // programMode: ['realtime'],
        // programLanguage: ['block'],
        // tags: ['realtime']
    },

    {//cares
        name: 'RHK Expansion Board',
        deviceId: 'microPythonEsp32',
        manufactor: 'PMU-CARES GOA',
        learnMore: 'https://cares.goa.gov.in/robotic-kit/',
        type: DeviceType.microPython,
        iconURL: esp32microPythonIconURL,
        description: (
            <FormattedMessage
                defaultMessage="A Great Expansion Board Developed In House by PMU-CARES GOA"
                description="Towards being Swayam-purn Goem and driving the Make-in India initiative; PMU has in-house developed and designed Robotics Hardware Kits and got it contract manufactured"
                id="gui.device.microPythonEsp32.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '115200',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: esp32microPythonConnectionIconURL,
        connectionSmallIconURL: esp32microPythonConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their Microcontroller"
                id="gui.device.microPythonEsp32.connectingMessage"
            />
        ),
        baseToolBoxXml: microPythonBaseToolBox,
        programMode: ['upload'],
        programLanguage: ['block', 'microPython'],
        tags: ['microPython'],
        helpLink: 'https://caresgoa.robokitsupport.co.in/'
    },


    {//cares Govin 2.3.2 Genesis
        name: 'Genesis',
        deviceId: 'genesisEsp32',
        manufactor: 'PMU-CARES GOA',
        learnMore: 'https://cares.goa.gov.in/robotic-kit/',
        type: DeviceType.microPython,
        iconURL: esp32genesisIconURL,
        description: (
            <FormattedMessage
                defaultMessage="A beginner level Robotics Hardware Kit by PMU-CARES GOA"
                description="A beginner-level Robotics Hardware Kit developed by PMU-CARES Goa to introduce students to hands-on robotics, design thinking, and critical problem solving"
                id="gui.device.genesisEsp32.description"
            />
        ),
        featured: true,
        disabled: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '115200',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: esp32genesisConnectionIconURL,
        connectionSmallIconURL: esp32genesisConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their Microcontroller"
                id="gui.device.genesisEsp32.connectingMessage"
            />
        ),
        baseToolBoxXml: microPythonBaseToolBox,
        programMode: ['upload'],
        programLanguage: ['block', 'microPython'],
        tags: ['microPython', 'kit'],
        helpLink: 'https://caresgoa.robokitsupport.co.in/',
        buylink: ''
    },

    {//cares Govin 2.3.2 Odyssey
        name: 'Odyssey',
        deviceId: 'odysseyEsp32',
        manufactor: 'PMU-CARES GOA',
        learnMore: 'https://cares.goa.gov.in/robotic-kit/',
        type: DeviceType.microPython,
        iconURL: esp32odysseyIconURL,
        description: (
            <FormattedMessage
                defaultMessage="An intermediate level Robotics Hardware Kit by PMU-CARES GOA"
                description="An intermediate-level Robotics Hardware Kit Odyssey developed by PMU-CARES Goa to help students explore advanced robotics concepts through hands-on building, design thinking, and problem solving. Age 12+"
                id="gui.device.odysseyEsp32.description"
            />
        ),
        featured: true,
        disabled: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '115200',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: esp32odysseyConnectionIconURL,
        connectionSmallIconURL: esp32odysseyConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their Microcontroller"
                id="gui.device.odysseyEsp32.connectingMessage"
            />
        ),
        baseToolBoxXml: microPythonBaseToolBox,
        programMode: ['upload'],
        programLanguage: ['block', 'microPython'],
        tags: ['microPython', 'kit'],
        helpLink: 'https://caresgoa.robokitsupport.co.in/',
        buylink: ''
    },
    {//cares Govin 2.3.2 Apex
        name: 'Apex',
        deviceId: 'apexEsp32',
        manufactor: 'PMU-CARES GOA',
        learnMore: 'https://cares.goa.gov.in/robotic-kit/',
        type: DeviceType.microPython,
        iconURL: esp32apexIconURL,
        description: (
            <FormattedMessage
                defaultMessage="An advance level Robotics Hardware Kit by PMU-CARES GOA. Age 14+"
                description="The Apex Advanced Robotics Hardware Kit by PMU-CARES Goa enables learners to design, prototype, and experiment with advanced robotics concepts through hands-on engineering.Age: 14+"
                id="gui.device.apexEsp32.description"
            />
        ),
        featured: true,
        disabled: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '115200',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: esp32apexConnectionIconURL,
        connectionSmallIconURL: esp32apexConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their Microcontroller"
                id="gui.device.apexEsp32.connectingMessage"
            />
        ),
        baseToolBoxXml: microPythonBaseToolBox,
        programMode: ['upload'],
        programLanguage: ['block', 'microPython'],
        tags: ['microPython', 'kit'],
        helpLink: 'https://caresgoa.robokitsupport.co.in/',
        buylink: ''
    },

    {//cares Govin 2.3.2 Nirman CNC
        name: 'Nirman-CNC',
        deviceId: 'nirmanEsp32',
        manufactor: 'PMU-CARES GOA',
        learnMore: 'https://cares.goa.gov.in/robotic-kit/',
        type: DeviceType.microPython,
        iconURL: esp32nirmanIconURL,
        description: (
            <FormattedMessage
        defaultMessage="The Nirman CNC Kit by PMU-CARES Goa allows learners to explore computer-controlled manufacturing by designing, prototyping, and fabricating components while building practical engineering and digital fabrication skills"
                // description="The Apex Advanced Robotics Hardware Kit by PMU-CARES Goa enables learners to design, prototype, and experiment with advanced robotics concepts through hands-on engineering.Age: 14+"
                id="gui.device.nirmanEsp32.description"
            />
        ),
        featured: true,
        disabled: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '115200',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: esp32nirmanConnectionIconURL,
        connectionSmallIconURL: esp32nirmanConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their Microcontroller"
                id="gui.device.nirmanEsp32.connectingMessage"
            />
        ),
        baseToolBoxXml: microPythonBaseToolBox,
        programMode: ['upload'],
        programLanguage: ['block','microPython'],
        tags: ['microPython','EduToys'],
        helpLink: 'https://caresgoa.robokitsupport.co.in/',
    buylink: ''
    },
    {//cares Govin 2.3.2 Garuda
        name: 'Garuda',
        deviceId: 'garudaEsp32',
        manufactor: 'PMU-CARES GOA',
        learnMore: 'https://cares.goa.gov.in/robotic-kit/',
        type: DeviceType.microPython,
        iconURL: esp32garudaIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Garuda is a hands-on drone kit developed by PMU-CARES Goa that enables learners to design, prototype, and experiment with drone technology while building real-world engineering and problem-solving skills"
                // description="The Apex Advanced Robotics Hardware Kit by PMU-CARES Goa enables learners to design, prototype, and experiment with advanced robotics concepts through hands-on engineering.Age: 14+"
                id="gui.device.garudaEsp32.description"
            />
        ),
        featured: true,
        disabled: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '115200',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: esp32garudaConnectionIconURL,
        connectionSmallIconURL: esp32garudaConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their Microcontroller"
                id="gui.device.garudaEsp32.connectingMessage"
            />
        ),
        baseToolBoxXml: microPythonBaseToolBox,
        programMode: ['upload'],
        programLanguage: ['block', 'microPython'],
        tags: ['microPython', 'EduToys'],
        helpLink: 'https://caresgoa.robokitsupport.co.in/',
        buylink: ''
    },

    {
        name: 'Arduino Uno',
        deviceId: 'arduinoUno',
        manufactor: 'arduino.cc',
        learnMore: 'https://store.arduino.cc/usa/arduino-uno-rev3',
        type: DeviceType.arduino,
        iconURL: arduinoUnoIconURL,
        description: (
            <FormattedMessage
                defaultMessage="A great board to get started with electronics and coding."
                description="Description for the Arduino Uno device"
                id="gui.device.arduinoUno.description"
            />
        ),
        featured: true,
        disabled: false,
        webVersion: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '9600',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: arduinoUnoConnectionIconURLL,
        connectionSmallIconURL: arduinoUnoConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their device."
                id="gui.device.arduinoUno.connectingMessage"
            />
        ),
        baseToolBoxXml: arduinoBaseToolBox,
        programMode: ['realtime', 'upload'],
        programLanguage: ['block', 'c', 'cpp'],
        tags: ['arduino'],
        helpLink: 'https://store.arduino.cc/usa/arduino-uno-rev3'
    },
    {
        name: 'Arduino Nano',
        deviceId: 'arduinoNano',
        manufactor: 'arduino.cc',
        learnMore: 'https://store.arduino.cc/usa/arduino-nano',
        type: DeviceType.arduino,
        iconURL: arduinoNanoIconURL,
        description: (
            <FormattedMessage
                defaultMessage="The Arduino Nano is a classic small board to build your projects with."
                description="Description for the Arduino Nano device"
                id="gui.device.arduinoNano.description"
            />
        ),
        featured: true,
        disabled: false,
        webVersion: true,
        bluetoothRequired: true,
        serialportRequired: true,
        defaultBaudRate: '9600',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: arduinoNanoConnectionIconURLL,
        connectionSmallIconURL: arduinoNanoConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their device."
                id="gui.device.arduinoNano.connectingMessage"
            />
        ),
        baseToolBoxXml: arduinoBaseToolBox,
        programMode: ['realtime', 'upload'],
        programLanguage: ['block', 'c', 'cpp'],
        tags: ['arduino'],
        helpLink: 'https://store.arduino.cc/usa/arduino-nano'
    },
    // {
    //     name: 'Arduino Leonardo',
    //     deviceId: 'arduinoLeonardo',
    //     manufactor: 'arduino.cc',
    //     learnMore: 'https://store.arduino.cc/usa/leonardo',
    //     type: DeviceType.arduino,
    //     iconURL: arduinoLeonardoIconURL,
    //     description: (
    //         <FormattedMessage
    //             defaultMessage="The classic Arduino board that can act as a mouse or keyboard."
    //             description="Description for the Arduino Leonardo device"
    //             id="gui.device.arduinoLeonardo.description"
    //         />
    //     ),
    //     featured: true,
    //     disabled: false,
    //     bluetoothRequired: false,
    //     serialportRequired: true,
    //     defaultBaudRate: '9600',
    //     internetConnectionRequired: false,
    //     launchPeripheralConnectionFlow: true,
    //     useAutoScan: false,
    //     connectionIconURL: arduinoLeonardoConnectionIconURLL,
    //     connectionSmallIconURL: arduinoLeonardoConnectionSmallIconURL,
    //     connectingMessage: (
    //         <FormattedMessage
    //             defaultMessage="Connecting"
    //             description="Message to help people connect to their device."
    //             id="gui.device.arduinoLeonardo.connectingMessage"
    //         />
    //     ),
    //     baseToolBoxXml: arduinoBaseToolBox,
    //     programMode: ['upload'], // due to the software serilport realtim mode is unstable
    //     programLanguage: ['block', 'c', 'cpp'],
    //     tags: ['arduino'],
    //     helpLink: 'https://store.arduino.cc/usa/leonardo'
    // },
    {
        name: 'Arduino Mega 2560',
        deviceId: 'arduinoMega2560',
        manufactor: 'arduino.cc',
        learnMore: 'https://store.arduino.cc/usa/mega-2560-r3',
        type: DeviceType.arduino,
        iconURL: arduinoMega2560IconURL,
        description: (
            <FormattedMessage
                defaultMessage="The 8-bit board with 54 digital pins, 16 analog inputs, and 4 serial ports."
                description="Description for the Arduino Mega 2560 device"
                id="gui.device.arduinoMega2560.description"
            />
        ),
        featured: true,
        disabled: false,
        webVersion: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '9600',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: arduinoMega2560ConnectionIconURLL,
        connectionSmallIconURL: arduinoMega2560ConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their device."
                id="gui.device.arduinoMega2560.connectingMessage"
            />
        ),
        baseToolBoxXml: arduinoBaseToolBox,
        programMode: ['realtime', 'upload'],
        programLanguage: ['block', 'c', 'cpp'],
        tags: ['arduino'],
        helpLink: 'https://store.arduino.cc/usa/mega-2560-r3'
    },
    {
        name: 'ESP32',
        deviceId: 'arduinoEsp32',
        manufactor: 'espressif',
        learnMore: 'https://www.espressif.com/',
        type: DeviceType.arduino,
        iconURL: esp32IconURL,
        description: (
            <FormattedMessage
                defaultMessage="Wi-Fi & Bluetooth control board with rich functions."
                description="Description for the esp32 device"
                id="gui.device.esp32.description"
            />
        ),
        featured: true,
        disabled: false,
        webVersion: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '115200',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: esp32ConnectionIconURLL,
        connectionSmallIconURL: esp32ConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their esp32."
                id="gui.device.esp32.connectingMessage"
            />
        ),
        baseToolBoxXml: arduinoBaseToolBox,
        programMode: ['upload', 'realtime'],
        programLanguage: ['block', 'c', 'cpp'],
        tags: ['arduino'],
        helpLink: 'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/index.html'
    },
    {
        name: 'NodeMCU',
        deviceId: 'arduinoEsp8266NodeMCU',
        manufactor: 'espressif',
        learnMore: 'https://www.nodemcu.com',
        type: DeviceType.arduino,
        iconURL: esp8266NodeMCUIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Low-cost Wi-Fi SOC control board."
                description="Description for the esp8266 NodeMCU device"
                id="gui.device.esp8266NodeMCU.description"
            />
        ),
        featured: true,
        disabled: false,
        webVersion: true,
        bluetoothRequired: false,
        serialportRequired: true,
        defaultBaudRate: '76800',
        internetConnectionRequired: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: esp8266NodeMCUConnectionIconURL,
        connectionSmallIconURL: esp8266NodeMCUConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their device."
                id="gui.device.esp8266NodeMCU.connectingMessage"
            />
        ),
        baseToolBoxXml: arduinoBaseToolBox,
        deviceExtensionsCompatible: 'arduinoEsp8266',
        programMode: ['upload'],
        programLanguage: ['block', 'c', 'cpp'],
        tags: ['arduino'],
        helpLink: 'https://arduino-esp8266.readthedocs.io/en/3.0.0/index.html'
    },


    /**
     * For those parent devices that exist in VM but are not displayed in GUI
     */
    {
        deviceId: 'arduinoUnoUltra',
        type: DeviceType.arduino,
        featured: true,
        disabled: false,
        hide: true,
        baseToolBoxXml: arduinoBaseToolBox
    },
    {
        deviceId: 'arduinoSE',
        type: DeviceType.arduino,
        featured: true,
        disabled: false,
        hide: true,
        baseToolBoxXml: arduinoBaseToolBox
    },
    {
        deviceId: 'arduinoEsp8266',
        type: DeviceType.arduino,
        featured: true,
        disabled: false,
        hide: true,
        baseToolBoxXml: arduinoBaseToolBox
    }
];

/**
 * To get real device id. eg: the third party id like ironKit_arduinoUno.
 * @param {string} deviceId - the id of the device.
 * @return {string} deviceId - the real device id.
 */
const analysisRealDeviceId = deviceId => {
    if (deviceId) {
        // if the id contain '_' use the string afer the '_'.
        if (deviceId.indexOf('_') !== -1) {
            deviceId = deviceId.split('_')[1];
        }
    }
    return deviceId;
};

/**
 * Make device data from the input data. If it is a buid-in device, return the buid-in
 * data. If it is a third party device, find it's parent device, and overwrite its attributes
 * with the input data.
 * @param {string} deviceList - the list of devices.
 * @return {string} fullData - processed data of devices.
 */
const makeDeviceLibrary = (deviceList = null) => {
    let regeneratedDeviceData = [];

    if (deviceList) {
        deviceList.forEach(dev => {
            // Because the micropython framework is not included in the community version,
            // for a control board that supports multiple programming frameworks, if it
            // also supports arduino, then we only load the arduino version of the device.
            if ((typeof dev.typeList !== 'undefined') && (dev.deviceId.indexOf('arduino') !== -1)) {
                dev.hide = false;
            }

            // Check if this is a build-in device.
            const matchedDevice = deviceData.find(item => dev.deviceId === item.deviceId);
            if (matchedDevice) {
                return regeneratedDeviceData.push(matchedDevice);
            }

            // This is a third party device. Try to parse it's parent deivce.
            const realDeviceId = analysisRealDeviceId(dev.deviceId);
            if (realDeviceId) {
                const parentDevice = deviceData.find(item => realDeviceId === item.deviceId);
                if (parentDevice) {
                    return regeneratedDeviceData.push(defaults({}, dev, { hide: false }, parentDevice));
                }
            }
            log.warn('Cannot find this device or it\'s parent device :', dev.deviceId);
            return null;
        });

        regeneratedDeviceData.unshift(deviceData[0]); // add unselect deive in the head.
    } else {
        regeneratedDeviceData = deviceData;
    }

    return regeneratedDeviceData;
};

export {
    deviceData as default,
    makeDeviceLibrary
};
