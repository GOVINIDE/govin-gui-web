

import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { intlShape, injectIntl, defineMessages } from 'react-intl';
import VM from 'govin-vm';

import HardwareConsoleComponent from '../components/hardware-console/hardware-console.jsx';

import {
    openSerialportMenu,
    closeSerialportMenu,
    serialportMenuOpen
} from '../reducers/menus';

import { showAlertWithTimeout } from '../reducers/alerts';
import { setBaudrate, setEol, switchHexForm, switchTimeStamp, switchAutoScroll, switchPause } from '../reducers/hardware-console'; //CARES 2.0.7

const messages = defineMessages({
    noLineTerminators: {
        defaultMessage: 'No line terminators',
        description: 'no line terminators in the end of serialsport messge to send',
        id: 'gui.hardwareConsole.noLineTerminators'
    },
    lineFeed: {
        defaultMessage: 'Line feed',
        description: 'Line feed in the end of serialsport messge to send',
        id: 'gui.hardwareConsole.lineFeed'
    },
    carriageReturn: {
        defaultMessage: 'Carriage return',
        description: 'Carriage return in the end of serialsport messge to send',
        id: 'gui.hardwareConsole.carriageReturn'
    },
    lfAndCr: {
        defaultMessage: 'LF & CR',
        description: 'LF & CR in the end of serialsport messge to send',
        id: 'gui.hardwareConsole.lfAndCr'
    }
});

const baudrateList = [
    { key: '1200', value: 1200 },
    { key: '2400', value: 2400 },
    { key: '4800', value: 4800 },
    { key: '9600', value: 9600 },
    { key: '14400', value: 14400 },
    { key: '19200', value: 19200 },
    { key: '38400', value: 38400 },
    { key: '57600', value: 57600 },
    { key: '76800', value: 76800 },
    { key: '115200', value: 115200 },
    { key: '256000', value: 256000 }
];

const eolList = [
    { key: 'null', value: messages.noLineTerminators },
    { key: 'lf', value: messages.lineFeed },
    { key: 'cr', value: messages.carriageReturn },
    { key: 'lfAndCr', value: messages.lfAndCr }
];

const MAX_CONSOLE_LENGTH = 32768;

class HardwareConsole extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleClickClean',
            'handleClickAutoScroll',
            'handleClickHexForm',
            'handleClickTimeStamp',
            'handleClickPause',
            'handleClickSave',
            'handleClickSend',
            'handleClickReboot',
            'handleClickStop', //GOVIN 2.2.1
            'handleInputChange',
            'handleKeyPress',
            'handleKeyDown',
            'handleSelectBaudrate',
            'handleSelectEol',
            'onReciveData',
            'writeToPeripheral',
            'downloadFile' // Add downloadFile method binding here
        ]);
        this.state = {
            consoleArray: new Uint8Array(0),
            dataToSend: '',
            commandHistory: [],     //CARES 2.1.6 Added to add command history    //CARES 2.1.6 Added to add command history
            historyIndex: -1
        };
        this._recivceBuffer = new Uint8Array(0);
    }

    componentDidMount() {
        this.props.vm.addListener('PERIPHERAL_RECIVE_DATA', this.onReciveData);
        if (this.props.peripheralName) {
            this.props.vm.setPeripheralBaudrate(this.props.deviceId, parseInt(this.props.baudrate, 10));
        }
    }

    componentWillUnmount() {
        this.props.vm.removeListener('PERIPHERAL_RECIVE_DATA', this.onReciveData);
    }

    appendBuffer(arr1, arr2) {
        const arr = new Uint8Array(arr1.byteLength + arr2.byteLength);
        arr.set(arr1, 0);
        arr.set(arr2, arr1.byteLength);
        return arr;
    }

    // onReciveData (data) {
    //     if (this.props.isPause) {
    //         return;
    //     }

    //     // limit data length to MAX_CONSOLE_LENGTH
    //     if (this._recivceBuffer.byteLength + data.byteLength >= MAX_CONSOLE_LENGTH) {
    //         this._recivceBuffer = this._recivceBuffer.slice(
    //             this._recivceBuffer.byteLength + data.byteLength - MAX_CONSOLE_LENGTH);
    //     }

    //     this._recivceBuffer = this.appendBuffer(this._recivceBuffer, data);

    //     // update the display per 0.1s
    //     if (!this._updateTimeoutID) {
    //         this._updateTimeoutID = setTimeout(() => {
    //             this.setState({
    //                 consoleArray: this._recivceBuffer,

    //             });
    //             this._updateTimeoutID = null;
    //         }, 50);
    //     }
    // }

    // onReciveData(data) {
    //     if (this.props.isPause) {
    //         return;
    //     }



    //     // Get the current timestamp
    //     const timestamp = new Date().toISOString();

    //     // Convert timestamp and received data to strings
    //     const timestampedData = `[${timestamp}] ${new TextDecoder().decode(data)}`;

    //     // Convert back to Uint8Array for storage
    //     const timestampedDataArray = new TextEncoder().encode(timestampedData);

    //     // Limit data length to MAX_CONSOLE_LENGTH
    //     if (this._recivceBuffer.byteLength + timestampedDataArray.byteLength >= MAX_CONSOLE_LENGTH) {
    //         this._recivceBuffer = this._recivceBuffer.slice(
    //             this._recivceBuffer.byteLength + timestampedDataArray.byteLength - MAX_CONSOLE_LENGTH
    //         );
    //     }

    //     // Append the timestamped data to the buffer
    //     this._recivceBuffer = this.appendBuffer(this._recivceBuffer, timestampedDataArray);


    //     // Update the display every 0.1 seconds
    //     if (!this._updateTimeoutID) {
    //         this._updateTimeoutID = setTimeout(() => {
    //             this.setState({
    //                 consoleArray: this._recivceBuffer
    //             });
    //             this._updateTimeoutID = null;
    //         }, 50);
    //     }
    // }

    // GOVIN 2.2.3: Filter console output during file reading operations
    onReciveData(data) {
        if (this.props.isPause) {
            return;
        }

        // GOVIN 2.2.3: Suppress output during file reading from device
        if (this.props.suppressOutput) {
            return;
        }

        // Convert received data to a string for processing
        let receivedDataString = new TextDecoder().decode(data);

        // If the timestamp is enabled, prepend a timestamp to the data
        if (this.props.isTimeStamp) {
            const timestamp = new Date().toISOString();
            receivedDataString = `[${timestamp}] ${receivedDataString}`;
        }

        // Convert the data back to Uint8Array with the timestamp, if applicable
        const dataWithTimestamp = new TextEncoder().encode(receivedDataString);

        // Limit data length to MAX_CONSOLE_LENGTH
        if (this._recivceBuffer.byteLength + dataWithTimestamp.byteLength >= MAX_CONSOLE_LENGTH) {
            this._recivceBuffer = this._recivceBuffer.slice(
                this._recivceBuffer.byteLength + dataWithTimestamp.byteLength - MAX_CONSOLE_LENGTH
            );
        }

        // Append the timestamped data to the buffer
        this._recivceBuffer = this.appendBuffer(this._recivceBuffer, dataWithTimestamp);

        // Update the display every 0.1 seconds
        if (!this._updateTimeoutID) {
            this._updateTimeoutID = setTimeout(() => {
                this.setState({
                    consoleArray: this._recivceBuffer
                });
                this._updateTimeoutID = null;
            }, 50);
        }
    }


    // Save the console content to a CSV file
    downloadFile(filename, data) {
        const blob = new Blob([data], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleClickClean() {
        this._recivceBuffer = new Uint8Array(0);
        this.setState({
            consoleArray: new Uint8Array(0)
        });
    }

    handleClickPause() {
        this.props.onSwitchPause();
    }

    // Modified Save Method to handle CSV Export
    handleClickSave() {
        // Convert consoleArray (which is a Uint8Array) to a string
        const consoleData = new TextDecoder().decode(this.state.consoleArray);

        // Prepare the CSV headers (e.g., Timestamp, Sensor Value)
        const headers = 'Timestamp,Value\n';

        // Assuming the console data is sensor data in a known format, we can process it into CSV rows.
        // You may need to adjust this parsing logic based on the actual structure of your data
        const rows = consoleData.split('\n').map(line => {
            // Split by space or other delimiters, this should be adjusted according to the actual format
            const [timestamp, sensor, value] = line.split(' ');  // Adjust this to match your data format
            return `${timestamp},${sensor},${value}`;
        }).join('\n');

        // Combine headers and rows
        const csvData = headers + rows;

        // Define the filename with the current timestamp
        const filename = `sensor_data_${new Date().toISOString()}.csv`;

        // Trigger the download of the CSV file
        this.downloadFile(filename, csvData);

        // Optionally pause as well if needed
        this.props.onSwitchPause();
    }

    handleKeyPress(e) {
        const keyCode = e.keyCode || e.which || e.charCode;

        // User pressed enter
        if (keyCode === 13) {
            this.handleClickSend();
            e.target.value = ''; // Clear the input after sending
        }
    }

    // handleKeyDown(e) {
    //     const keyCode = e.keyCode || e.which || e.charCode;
    //     const ctrlKey = e.ctrlKey || e.metaKey;

    //     // Ctrl + A
    //     if (keyCode === 65 && ctrlKey) {
    //         this.writeToPeripheral(String.fromCharCode(1));
    //     }
    //     // Ctrl + B
    //     if (keyCode === 66 && ctrlKey) {
    //         this.writeToPeripheral(String.fromCharCode(2));
    //     }
    //     // Ctrl + C
    //     if (keyCode === 67 && ctrlKey) {
    //         this.writeToPeripheral(String.fromCharCode(3));
    //     }
    //     // Ctrl + D
    //     if (keyCode === 68 && ctrlKey) {
    //         this.writeToPeripheral(String.fromCharCode(4));
    //     }
    // }

     //CARES 2.1.6 Added to add command history
     handleKeyDown(e){
        const { commandHistory, historyIndex } = this.state;
        const keyCode = e.keyCode || e.which || e.charCode;
        const ctrlKey = e.ctrlKey || e.metaKey;

        // Ctrl + A
        if (keyCode === 65 && ctrlKey) {
            this.writeToPeripheral(String.fromCharCode(1));
        }
        // Ctrl + B
        if (keyCode === 66 && ctrlKey) {
            this.writeToPeripheral(String.fromCharCode(2));
        }
        // Ctrl + C
        if (keyCode === 67 && ctrlKey) {
            this.writeToPeripheral(String.fromCharCode(3));
        }
        // Ctrl + D
        if (keyCode === 68 && ctrlKey) {
            this.writeToPeripheral(String.fromCharCode(4));
        }
    
    
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                const cmd = commandHistory[newIndex];
                this.setState({
                    dataToSend: cmd,
                    historyIndex: newIndex
                });
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                const cmd = commandHistory[newIndex];
                this.setState({
                    dataToSend: cmd,
                    historyIndex: newIndex
                });
            } else if (historyIndex === commandHistory.length - 1) {
                this.setState({
                    dataToSend: '',
                    historyIndex: commandHistory.length
                });
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.handleClickSend();
        }
    }
    
    
    handleInputChange(e) {
        this.setState({
            dataToSend: e.target.value
        });
    }

    writeToPeripheral(data) {
        if (this.props.peripheralName) {
            this.props.vm.writeToPeripheral(this.props.deviceId, data);
        } else {
            this.props.onNoPeripheralIsConnected();
        }
    }

    // handleClickSend() {
    //     let data = this.state.dataToSend;
    //     if (this.props.eol === 'lf') {
    //         data = `${data}\n`;
    //     } else if (this.props.eol === 'cr') {
    //         data = `${data}\r`;
    //     } else if (this.props.eol === 'lfAndCr') {
    //         data = `${data}\r\n`;
    //     }
    //     this.writeToPeripheral(data);
    //     this.setState({
    //         dataToSend: ''
    //     });

    // }

    //CARES 2.1.6 Modified to add command history
    handleClickSend() {
        let data = this.state.dataToSend;
        const trimmedData = data.trim();
    
        if (!trimmedData) return; // don't send empty commands
    
        // EOL handling
        if (this.props.eol === 'lf') {
            data = `${data}\n`;
        } else if (this.props.eol === 'cr') {
            data = `${data}\r`;
        } else if (this.props.eol === 'lfAndCr') {
            data = `${data}\r\n`;
        }
    
        // Send to device
        this.writeToPeripheral(data);
    
        // Clear field, save to history
        this.setState(prevState => ({
            dataToSend: '',
            commandHistory: [...prevState.commandHistory, trimmedData],
            historyIndex: prevState.commandHistory.length + 1 // points to "after last"
        }));
        
    }
    
    
    //cares 2.1.2
    handleClickReboot() {
        this.writeToPeripheral("\x03");  // Send Ctrl+C to stop execution
        setTimeout(() => {
            this.writeToPeripheral("\x04");  // Send Ctrl+D to soft reboot
        }, 100);  // Add slight delay for safety
    }

    //GOVIN 2.2.1 STOP BUTTON
    handleClickStop() {
        this.writeToPeripheral("\x03");  // Send Ctrl+C to stop execution
    
    }


    handleSelectBaudrate(e) {
        if (this.props.peripheralName) {
            const index = e.target.selectedIndex;
            this.props.onSetBaudrate(baudrateList[index].key);
            this.props.vm.setPeripheralBaudrate(this.props.deviceId, baudrateList[index].value);
        } else {
            this.props.onNoPeripheralIsConnected();
        }
    }

    handleSelectEol(e) {
        const index = e.target.selectedIndex;
        this.props.onSetEol(eolList[index].key);
    }

    handleClickHexForm() {
        this.props.onSwitchHexForm();
    }

    handleClickTimeStamp() {
        this.props.onSwitchTimeStamp();
    }

    handleClickAutoScroll() {
        this.props.onSwitchAutoScroll();
    }

    render() {
        const {
            ...props
        } = this.props;
        return (
            <HardwareConsoleComponent
                baudrate={this.props.baudrate}
                baudrateList={baudrateList}
                consoleArray={this.state.consoleArray}
                eol={this.props.eol}
                eolList={eolList}
                isAutoScroll={this.props.isAutoScroll}
                isTimeStamp={this.props.isTimeStamp} //cares 2.0.7
                isHexForm={this.props.isHexForm}
                isPause={this.props.isPause}
                isRtl={this.props.isRtl}
                onClickClean={this.handleClickClean}
                onClickPause={this.handleClickPause}
                onClickSave={this.handleClickSave} // Pass the save handler to the component
                onClickAutoScroll={this.handleClickAutoScroll}
                onClickHexForm={this.handleClickHexForm}
                onClickTimeStamp={this.handleClickTimeStamp} //CARES 2.0.7
                onClickSend={this.handleClickSend}
                onClickReboot={this.handleClickReboot}
                onClickStop={this.handleClickStop} //GOVIN 2.2.1
                onClickSerialportMenu={this.props.handleClickSerialportMenu}
                onKeyPress={this.handleKeyPress}
                onKeyDown={this.handleKeyDown}
                onInputChange={this.handleInputChange}
                onRequestSerialportMenu={this.props.handleRequestSerialportMenu}
                dataToSend={this.state.dataToSend}  //CARES 2.1.5 ADDED TO CLEAN CONSOLE AFTER PRESSING SEND
                onSelectBaudrate={this.handleSelectBaudrate}
                onSelectEol={this.handleSelectEol}
                serialportMenuOpen={serialportMenuOpen}
                {...props}
            />
        );
    }
}

// GOVIN 2.2.3: Added suppressOutput prop to hide file reading output
HardwareConsole.propTypes = {
    baudrate: PropTypes.string.isRequired,
    deviceId: PropTypes.string.isRequired,
    eol: PropTypes.string.isRequired,
    handleClickSerialportMenu: PropTypes.func.isRequired,
    handleRequestSerialportMenu: PropTypes.func.isRequired,
    isAutoScroll: PropTypes.bool.isRequired,
    isTimeStamp: PropTypes.bool.isRequired, //CARES 2.0.7
    isHexForm: PropTypes.bool.isRequired,
    isPause: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    isRtl: PropTypes.bool,
    onNoPeripheralIsConnected: PropTypes.func.isRequired,
    onSetBaudrate: PropTypes.func.isRequired,
    onSetEol: PropTypes.func.isRequired,
    onSwitchAutoScroll: PropTypes.func.isRequired,
    onSwitchHexForm: PropTypes.func.isRequired,
    onSwitchTimeStamp: PropTypes.func.isRequired, //CARES 2.0.7
    onSwitchPause: PropTypes.func.isRequired,
    peripheralName: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired,
    suppressOutput: PropTypes.bool // GOVIN 2.2.3: Suppress output during file operations
};

const mapStateToProps = state => ({
    baudrate: state.scratchGui.hardwareConsole.baudrate,
    deviceId: state.scratchGui.device.deviceId,
    eol: state.scratchGui.hardwareConsole.eol,
    isAutoScroll: state.scratchGui.hardwareConsole.isAutoScroll,
    isTimeStamp: state.scratchGui.hardwareConsole.isTimeStamp, //carres 2.0.7
    isHexForm: state.scratchGui.hardwareConsole.isHexForm,
    isPause: state.scratchGui.hardwareConsole.isPause,
    isRtl: state.locales.isRtl,
    peripheralName: state.scratchGui.connectionModal.peripheralName,
    serialportMenuOpen: serialportMenuOpen(state)
});

const mapDispatchToProps = dispatch => ({
    handleClickSerialportMenu: () => dispatch(openSerialportMenu()),
    handleRequestSerialportMenu: () => dispatch(closeSerialportMenu()),
    onNoPeripheralIsConnected: () => showAlertWithTimeout(dispatch, 'connectAPeripheralFirst'),
    onSetBaudrate: baudrate => dispatch(setBaudrate(baudrate)),
    onSetEol: eol => dispatch(setEol(eol)),
    onSwitchAutoScroll: () => dispatch(switchAutoScroll()),
    onSwitchHexForm: () => dispatch(switchHexForm()),
    onSwitchTimeStamp: () => dispatch(switchTimeStamp()), //cares 2.0.7
    onSwitchPause: () => dispatch(switchPause())
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(HardwareConsole);