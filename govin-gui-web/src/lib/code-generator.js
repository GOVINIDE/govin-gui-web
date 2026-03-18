import 'govin-blocks/arduino_compressed';
import 'govin-blocks/python_compressed';

import {DeviceType} from './device';

const getGeneratorNameFromDeviceType = deviceType => {
    if (deviceType === DeviceType.arduino) {
        return 'Arduino';
    } else if (deviceType === DeviceType.python ||
        deviceType === DeviceType.microPython ||
        deviceType === DeviceType.microbit) {
        return 'Python';
    }
    return 'null';
};

export {
    getGeneratorNameFromDeviceType
};
