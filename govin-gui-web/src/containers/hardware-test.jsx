import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';

import {connect} from 'react-redux';
import {compose} from 'redux';
import {injectIntl} from 'react-intl';

import {showAlertWithTimeout} from '../reducers/alerts';
import {setCodeEditorValue, toggleLock} from '../reducers/code';
import {setTheme} from '../reducers/theme';
import {openUploadProgress} from '../reducers/modals'; // GOVIN 2.2.3


import {getLanguageFromDeviceType} from '../lib/device';


import HardwareComponentTest from '../components/hardware-test/hardware-test.jsx';

class HardwareTest extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleCodeEditorDidMount',
            'handleCodeEditorChange',
          
            'handleClickCodeEditorLock'
        ]);
    }

    handleCodeEditorWillMount (monaco) {
        // Define modern themes
        monaco.editor.defineTheme('modernLight', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
                { token: 'string', foreground: 'A31515' },
                { token: 'number', foreground: '098658' },
                { token: 'operator', foreground: '000000' },
                { token: 'identifier', foreground: '001080' }
            ],
            colors: {
                'editor.background': '#FFFFFF',
                'editor.foreground': '#333333',
                'editor.lineHighlightBackground': '#F5F5F5',
                'editor.selectionBackground': '#ADD6FF',
                'editor.inactiveSelectionBackground': '#E5EBF1',
                'editorCursor.foreground': '#000000',
                'editorLineNumber.foreground': '#237893',
                'editorLineNumber.activeForeground': '#0B216F',
                'editorIndentGuide.background': '#D3D3D3',
                'editorIndentGuide.activeBackground': '#939393'
            }
        });

        monaco.editor.defineTheme('modernDark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'operator', foreground: 'D4D4D4' },
                { token: 'identifier', foreground: '9CDCFE' }
            ],
            colors: {
                'editor.background': '#1E1E1E',
                'editor.foreground': '#D4D4D4',
                'editor.lineHighlightBackground': '#2A2D2E',
                'editor.selectionBackground': '#264F78',
                'editor.inactiveSelectionBackground': '#3A3D41',
                'editorCursor.foreground': '#AEAFAD',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#C6C6C6',
                'editorIndentGuide.background': '#404040',
                'editorIndentGuide.activeBackground': '#707070'
            }
        });

        monaco.editor.defineTheme('readOnlyTheme', {
            base: 'vs',
            inherit: true,
            rules: [{background: 'F9F9F9'}],
            colors: {
                'editor.background': '#F9F9F9'
            }
        });
    }

    handleCodeEditorDidMount (editor) {
        // Close the alert message from editor
        const messageContribution = editor.getContribution(
            'editor.contrib.messageController'
        );
        if (messageContribution) {
            messageContribution.dispose();
        }

        editor.onDidAttemptReadOnlyEdit(() => {
            this.props.onCodeEditorIsLocked();
        });
    }

    handleCodeEditorChange (Value) {
        this.props.onSetCodeEditorValue(Value);
    }

 

    handleClickCodeEditorLock () {
        this.props.onToggleCodeEditorLock();
    }

    render () {
        const codeEditorLanguage = getLanguageFromDeviceType(this.props.deviceType);
        const {
            ...props
        } = this.props;
        return (
            <HardwareComponentTest
                codeEditorLanguage={codeEditorLanguage}
                codeEditorOptions={this.props.isCodeEditorLocked ? {readOnly: false} : {readOnly: false}}
                codeEditorTheme={this.props.isCodeEditorLocked ? 'readOnlyTheme' : (this.props.isDarkTheme ? 'modernDark' : 'modernLight')}
                codeEditorValue={this.props.codeEditorValue}
                isDarkTheme={this.props.isDarkTheme}
                onSetTheme={this.props.onSetTheme}
                isCodeEditorLocked={this.props.isCodeEditorLocked}
                onCodeEditorWillMount={this.handleCodeEditorWillMount}
                onCodeEditorDidMount={this.handleCodeEditorDidMount}
                onCodeEditorChange={this.handleCodeEditorChange}
                onClickCodeEditorLock={this.handleClickCodeEditorLock}
                {...props}
            />
        );
    }
}

HardwareTest.propTypes = {
    codeEditorValue: PropTypes.string,
   
    deviceType: PropTypes.string,
    isCodeEditorLocked: PropTypes.bool.isRequired,
    onCodeEditorIsLocked: PropTypes.func.isRequired,
    onSetCodeEditorValue: PropTypes.func.isRequired,
   
    onToggleCodeEditorLock: PropTypes.func.isRequired
};

// GOVIN 2.2.3: Added vm, deviceId, peripheralName for upload button
const mapStateToProps = state => ({
    codeEditorValue: state.scratchGui.code.codeEditorValue,
    codeEditorValuePython: state.scratchGui.code.codeEditorValuePython,
    deviceType: state.scratchGui.device.deviceType,
    isCodeEditorLocked: state.scratchGui.code.isCodeEditorLocked,
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    isDarkTheme: state.scratchGui.theme.isDarkTheme,
    deviceId: state.scratchGui.device.deviceId,
    peripheralName: state.scratchGui.connectionModal.peripheralName
});

// GOVIN 2.2.3: Added props for upload, open, run buttons
// GOVIN 2.2.3: Added props for upload, open, save, run buttons and file operations
const mapDispatchToProps = dispatch => ({
    onCodeEditorIsLocked: () => showAlertWithTimeout(dispatch, 'codeEditorIsLocked'),
    onSetCodeEditorValue: value => {
        dispatch(setCodeEditorValue(value));
    },
    onToggleCodeEditorLock: () => dispatch(toggleLock()),
    onSetTheme: isDarkTheme => dispatch(setTheme(isDarkTheme)),
    onOpenUploadProgress: () => dispatch(openUploadProgress()), // GOVIN 2.2.3
    onNoPeripheralIsConnected: () => showAlertWithTimeout(dispatch, 'connectAPeripheralFirst'), // GOVIN 2.2.3
    updateCodeEditorValue: value => dispatch(setCodeEditorValue(value)), // GOVIN 2.2.3
    onWorkspaceIsEmpty: () => showAlertWithTimeout(dispatch, 'workspaceIsEmpty') // GOVIN 2.2.3
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(HardwareTest);
