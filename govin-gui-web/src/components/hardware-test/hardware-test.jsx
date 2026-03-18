import React from 'react';
import PropTypes from 'prop-types';
import Box from '../box/box.jsx';
import classNames from 'classnames';

import {STAGE_SIZE_MODES} from '../../lib/layout-constants';
import HardwareConsole from '../../containers/hardware-console.jsx';

import styles from './hardware-test.css';

import lockIcon from './icon--lock.svg';
import unlockIcon from './icon--unlock.svg';
import uploadIcon from './icon--upload.svg';
import micropythonLogo from './micropython-logo.jpg'; // GOVIN 2.2.3
import CodeEditorTest from '../../containers/code-editor-test.jsx';

import VM from 'govin-vm';
import { saveAs } from 'file-saver';
// import { logCodeDetails } from '../../reducers/logger.js';


import { openUploadProgress } from '../../reducers/modals';
import { showAlertWithTimeout } from '../../reducers/alerts';



// Govin 2.2.0: Converted to class component and added multi-file tabs support
class HardwareComponentTest extends React.Component {
    constructor (props) {
        super(props);
        const ext = props.deviceType === 'arduino' ? 'ino' : 'py';
        // Govin 2.3.1: Keep a monotonic counter so tab IDs stay unique even when names are reused.
        this.nextFileId = 1;
        this.state = {
            files: [{ id: 'file-0', name: `main.${ext}`, content: props.codeEditorValue || '', hasChanges: false, source: 'disk' }],
            activeIndex: 0,
            renamingIndex: -1,
            tempName: '',
            // Govin 2.2.0: Console visibility toggle state
            isConsoleHidden: false,
            // Govin 2.2.0: Editor font size state
            editorFontSize: 14,
            // GOVIN 2.2.3: Device file browser state
            showDeviceFileBrowser: false,
            showOpenSourceDialog: false,
            showSaveDialog: false,
            deviceFiles: [],
            loadingDeviceFiles: false,
            // GOVIN 2.2.3: File reading from device
            readingDeviceFile: null,
            deviceFileBuffer: '',
            suppressConsoleOutput: false,
            listingDeviceFiles: false,
            deviceFileListBuffer: '',
            deletingDeviceFile: null,
            deviceDeleteBuffer: ''
        };
        this.handleSwitchFile = this.handleSwitchFile.bind(this);
        this.handleAddFile = this.handleAddFile.bind(this);
        this.handleCloseFile = this.handleCloseFile.bind(this);
        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.startRenaming = this.startRenaming.bind(this);
        this.commitRename = this.commitRename.bind(this);
        this.handleOpenFileEvent = this.handleOpenFileEvent.bind(this);
        this.handleNewFileEvent = this.handleNewFileEvent.bind(this);
        // Govin 2.2.0: Console toggle handler
        this.toggleConsole = this.toggleConsole.bind(this);
        // Govin 2.2.0: Editor mount handler
        this.handleEditorDidMount = this.handleEditorDidMount.bind(this);
        // Govin 2.2.0: Font size handlers
        this.increaseFontSize = this.increaseFontSize.bind(this);
        this.decreaseFontSize = this.decreaseFontSize.bind(this);
        // Govin 2.2.0: Copy selected text handler
        this.copySelectedText = this.copySelectedText.bind(this);
        // Govin 2.2.0: Paste text handler
        this.pasteText = this.pasteText.bind(this);
        // Govin 2.2.0: Cut selected text handler
        this.cutSelectedText = this.cutSelectedText.bind(this);
        // Theme toggle handler
        this.toggleTheme = this.toggleTheme.bind(this);

        this.handleUpload = this.handleUpload.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleSaveToComputer = this.handleSaveToComputer.bind(this);
        this.handleRunREPL = this.handleRunREPL.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
        // GOVIN 2.2.3: Device file browser handlers
        this.handleOpenFromComputer = this.handleOpenFromComputer.bind(this);
        this.handleOpenFromDevice = this.handleOpenFromDevice.bind(this);
        this.handleCloseFileBrowser = this.handleCloseFileBrowser.bind(this);
        this.handleLoadDeviceFile = this.handleLoadDeviceFile.bind(this);
        this.handleSaveToDevice = this.handleSaveToDevice.bind(this);
        this.captureDeviceOutput = this.captureDeviceOutput.bind(this);
        this.handleDeleteDeviceFile = this.handleDeleteDeviceFile.bind(this);
      
    }

    // Govin 2.3.1: Centralized tab limit guard used by all tab creation paths.
    canCreateMoreTabs (files) {
        if (files.length >= 4) {
            alert('Maximum of 4 tabs allowed. Please close an existing tab before opening a new one.');
            return false;
        }
        return true;
    }

    // Govin 2.3.1: Generate stable unique tab IDs independent of user-visible file names.
    createFileId () {
        const id = `file-${this.nextFileId}`;
        this.nextFileId += 1;
        return id;
    }

    // Govin 2.3.1: Pick the first available untitled index to avoid name reuse after deletions.
    getNextUntitledName (files, ext) {
        let suffix = 1;
        while (files.some(f => f.name === `untitled${suffix}.${ext}`)) {
            suffix += 1;
        }
        return `untitled${suffix}.${ext}`;
    }

    // Govin 2.2.0: Listen for file open/new events and expose current filename
    // GOVIN 2.2.3: Added listener for device output capture
    componentDidMount () {
        window.currentHardwareFileName = this.state.files[this.state.activeIndex]
            ? this.state.files[this.state.activeIndex].name : undefined;
        window.addEventListener('hardware.openFile', this.handleOpenFileEvent);
        window.addEventListener('hardware.newFile', this.handleNewFileEvent);
        
        // Listen for REPL output to capture file content
        if (this.props.vm && this.props.vm.runtime) {
            this.props.vm.runtime.on('PERIPHERAL_RECIVE_DATA', this.captureDeviceOutput);
        }
    }

    componentWillUnmount () {
        window.removeEventListener('hardware.openFile', this.handleOpenFileEvent);
        window.removeEventListener('hardware.newFile', this.handleNewFileEvent);
        
        // Remove REPL output listener
        if (this.props.vm && this.props.vm.runtime) {
            this.props.vm.runtime.removeListener('PERIPHERAL_RECIVE_DATA', this.captureDeviceOutput);
        }
    }

    componentDidUpdate (prevProps, prevState) {
        window.currentHardwareFileName = this.state.files[this.state.activeIndex]
            ? this.state.files[this.state.activeIndex].name : undefined;
    }

    // Govin 2.2.0: Open file into an existing/new tab and activate it
    // GOVIN 2.2.3: Track file source (disk or device)
    handleOpenFileEvent (e) {
        const detail = e.detail || {};
        const name = detail.name;
        const content = detail.content || '';
        const source = detail.source || 'disk';
        if (!name) return;
        this.setState(prev => {
            const existingIndex = prev.files.findIndex(f => f.name === name);
            if (existingIndex !== -1) {
                const updated = prev.files.map((f, i) => 
                    i === existingIndex ? {...f, content, source, hasChanges: false} : f
                );
                return { files: updated, activeIndex: existingIndex };
            }
            // Govin 2.3.1: Enforce max tab count for externally opened files too.
            if (!this.canCreateMoreTabs(prev.files)) return null;
            const nf = { id: this.createFileId(), name, content, source, hasChanges: false };
            return { files: [...prev.files, nf], activeIndex: prev.files.length };
        });
    }

    // Govin 2.2.0: Create a new tab with provided name/content
    handleNewFileEvent (e) {
        const detail = e.detail || {};
        const name = detail.name;
        const content = detail.content || '';
        const replaceCurrent = detail.replaceCurrent || false;
        
        if (!name) return;
        
        this.setState(prev => {
            if (replaceCurrent && prev.files.length > 0) {
                // Replace the current active tab's content instead of creating a new tab
                const updatedFiles = prev.files.map((f, i) => 
                    i === prev.activeIndex ? {...f, content: content} : f
                );
                return { files: updatedFiles, activeIndex: prev.activeIndex };
            } else {
                const existingIndex = prev.files.findIndex(f => f.name === name);
                if (existingIndex !== -1) {
                    // Govin 2.3.1: Reuse existing tab by name instead of creating duplicate-name tabs.
                    const updated = prev.files.map((f, i) =>
                        i === existingIndex ? {...f, content, hasChanges: false} : f
                    );
                    return { files: updated, activeIndex: existingIndex };
                }
                if (!this.canCreateMoreTabs(prev.files)) return null;
                return { files: [...prev.files, { id: this.createFileId(), name, content, hasChanges: false, source: 'disk' }], activeIndex: prev.files.length };
            }
        });
    }

    handleSwitchFile (index) {
        this.setState({ activeIndex: index });
    }

    // Govin 2.2.0: Add new untitled file with device-specific extension and default content
    // GOVIN: Limit tabs to 4 maximum
    handleAddFile () {
        // Govin 2.3.1: Reuse centralized max-tab guard.
        if (!this.canCreateMoreTabs(this.state.files)) {
            return;
        }
        
        const ext = this.props.deviceType === 'arduino' ? 'ino' : 'py';
        const untitledName = this.getNextUntitledName(this.state.files, ext);
        
        // Set default content based on device type Govin 2.2.1
        let defaultContent = '';
        if (this.props.deviceType === 'arduino') {
            defaultContent = '// Arduino-C\nvoid setup() {\n}\n\nvoid loop() {\n}';
        } else if (this.props.deviceType === 'microPython') {
            defaultContent = '#MicroPython\n';
        } else {
            defaultContent = ''; // Default empty for other types
        }
        
        const nf = { id: this.createFileId(), name: untitledName, content: defaultContent, hasChanges: false, source: 'disk' };
        this.setState(prev => ({ files: [...prev.files, nf], activeIndex: prev.files.length }));
    }
 // GOVIN 2.2.3: Added confirmation dialog for unsaved changes
 handleCloseFile (index, e) {
    e.stopPropagation();
    if (this.state.files.length === 1) return;
    
    // GOVIN 2.2.3: Check if file has unsaved changes
    const fileToClose = this.state.files[index];
    if (fileToClose && fileToClose.hasChanges) {
        const confirmClose = window.confirm(
            `"${fileToClose.name}" has unsaved changes.\n\nDo you want to close it without saving?`
        );
        if (!confirmClose) {
            return; // User cancelled, don't close the file
        }
    }
    
    this.setState(prev => {
        const next = prev.files.filter((_, i) => i !== index);
        let nextActive = prev.activeIndex;
        if (index === prev.activeIndex) nextActive = Math.max(0, prev.activeIndex - 1);
        else if (index < prev.activeIndex) nextActive = prev.activeIndex - 1;
        return { files: next, activeIndex: nextActive };
    });
}

    // Govin 2.2.0: Keep active tab content in sync with editor changes
    // GOVIN 2.2.3: Mark file as changed when edited
    handleEditorChange (value) {
        this.setState(prev => ({
            files: prev.files.map((f, i) => 
                i === prev.activeIndex ? {...f, content: value, hasChanges: true} : f
            )
        }));
        if (this.props.onCodeEditorChange) this.props.onCodeEditorChange(value);
    }

    // Govin 2.2.0: Store Monaco editor reference for resize
    handleEditorDidMount (editor) {
        window.monacoEditor = editor;
        if (this.props.onCodeEditorDidMount) this.props.onCodeEditorDidMount(editor);
    }

    startRenaming (index, e) {
        e.stopPropagation();
        this.setState({ renamingIndex: index, tempName: this.state.files[index].name });
    }

    commitRename () {
        const { renamingIndex, tempName } = this.state;
        if (renamingIndex < 0) return;
        const trimmed = (tempName || '').trim();
        if (trimmed) {
            this.setState(prev => ({
                // Govin 2.3.1: Preserve immutable tab IDs so React keys remain unique and stable.
                files: prev.files.map((f, i) => i === renamingIndex ? {...f, name: trimmed} : f)
            }));
        }
        this.setState({ renamingIndex: -1, tempName: '' });
    }

    // Govin 2.2.0: Toggle console visibility
    toggleConsole () {
        this.setState(prev => ({ isConsoleHidden: !prev.isConsoleHidden }), () => {
            // Force editor container to recalculate height and Monaco to resize
            setTimeout(() => {
                if (window.forceCodeEditorResize) {
                    window.forceCodeEditorResize();
                }
                if (window.monacoEditor) {
                    window.monacoEditor.layout();
                }
            }, 100);
        });
    }

    // Govin 2.2.0: Increase editor font size
    increaseFontSize () {
        this.setState(prev => ({
            editorFontSize: Math.min(prev.editorFontSize + 1, 32)
        }), () => {
            if (window.monacoEditor) window.monacoEditor.layout();
        });
    }

    // Govin 2.2.0: Decrease editor font size
    decreaseFontSize () {
        this.setState(prev => ({
            editorFontSize: Math.max(prev.editorFontSize - 1, 8)
        }), () => {
            if (window.monacoEditor) window.monacoEditor.layout();
        });
    }

    // Govin 2.2.0: Copy selected text from editor
    copySelectedText () {
        if (window.monacoEditor) {
            const selection = window.monacoEditor.getSelection();
            const selectedText = window.monacoEditor.getModel().getValueInRange(selection);
            
            if (selectedText) {
                // Use the Clipboard API if available
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(selectedText).then(() => {
                        console.log('Text copied to clipboard');
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                        // Fallback to execCommand for older browsers
                        this.fallbackCopyText(selectedText);
                    });
                } else {
                    // Fallback for older browsers
                    this.fallbackCopyText(selectedText);
                }
            } else {
                console.log('No text selected');
            }
        }
    }

    // Fallback copy method for older browsers
    fallbackCopyText (text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            console.log('Text copied to clipboard (fallback)');
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
        document.body.removeChild(textArea);
    }


    // Govin 2.2.0: Paste text from clipboard
    pasteText () {
        if (window.monacoEditor) {
            // Use the Clipboard API if available
            if (navigator.clipboard && navigator.clipboard.readText) {
                navigator.clipboard.readText().then(text => {
                    const selection = window.monacoEditor.getSelection();
                    window.monacoEditor.executeEdits('paste', [{
                        range: selection,
                        text: text,
                        forceMoveMarkers: true
                    }]);
                    console.log('Text pasted from clipboard');
                }).catch(err => {
                    console.error('Failed to paste text: ', err);
                });
            } else {
                console.log('Clipboard API not supported for paste');
            }
        }
    }

    // Govin 2.2.0: Cut selected text (copy + delete)
    cutSelectedText () {
        if (window.monacoEditor) {
            const selection = window.monacoEditor.getSelection();
            const selectedText = window.monacoEditor.getModel().getValueInRange(selection);
            
            if (selectedText) {
                // First copy the text
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(selectedText).then(() => {
                        // Then delete the selected text
                        window.monacoEditor.executeEdits('cut', [{
                            range: selection,
                            text: '',
                            forceMoveMarkers: true
                        }]);
                        console.log('Text cut to clipboard');
                    }).catch(err => {
                        console.error('Failed to cut text: ', err);
                    });
                } else {
                    // Fallback: just delete the text
                    window.monacoEditor.executeEdits('cut', [{
                        range: selection,
                        text: '',
                        forceMoveMarkers: true
                    }]);
                    console.log('Text cut (fallback)');
                }
            } else {
                console.log('No text selected to cut');
            }
        }
    }

    // Theme toggle handler
    toggleTheme () {
        if (this.props.onSetTheme) {
            this.props.onSetTheme(!this.props.isDarkTheme);
        }
    }

    // GOVIN 2.2.3: Upload button handler in editor
    handleUpload() {
        if (this.props.peripheralName) {
            const activeFile = this.state.files[this.state.activeIndex];
            const activeContent = activeFile ? activeFile.content : '';
            this.props.vm.uploadToPeripheral(this.props.deviceId, activeContent);
            if (this.props.onOpenUploadProgress) {
                this.props.onOpenUploadProgress();
            }
        } else {
            if (this.props.onNoPeripheralIsConnected) {
                this.props.onNoPeripheralIsConnected();
            }
        }
    }

    // GOVIN 2.2.3: Save - shows dialog if MicroPython device connected
    // GOVIN 2.2.4: Added telemetry logging for text-based coding
    handleSave() {
        const { deviceType, peripheralName } = this.props;
        
        const activeFile = this.state.files[this.state.activeIndex];
        const currentCode = activeFile ? activeFile.content : '';
        
        // If MicroPython device connected, show save options
        if (deviceType === 'microPython' && peripheralName) {
            this.setState({ showSaveDialog: true });
        } else {
            // Default to computer save
            this.handleSaveToComputer();
            return;
        }
        
        // GOVIN 2.2.4: Log code details to telemetry when save dialog is shown
        if (currentCode) {
            try {
                // logCodeDetails(currentCode);
            } catch (error) {
                console.error('Error logging code details:', error);
            }
        }
    }

    // GOVIN 2.2.3: Save file to computer
    // GOVIN 2.2.4: Added telemetry logging for text-based coding
    handleSaveToComputer() {
        this.setState({ showSaveDialog: false }); // Close dialog
        
        const activeFile = this.state.files[this.state.activeIndex];
        if (!activeFile) return;
        
        const { deviceType } = this.props;
        const filename = activeFile.name || `code.${deviceType === 'arduino' ? 'ino' : 'py'}`;
        const content = activeFile.content;

        // GOVIN 2.2.4: Log code details to telemetry for text-based coding mode
        if (content) {
            try {
                // logCodeDetails(content);
            } catch (error) {
                console.error('Error logging code details:', error);
            }
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, filename);
        
        // GOVIN 2.2.3: Mark file as saved (clear * indicator)
        this.setState(prev => ({
            files: prev.files.map((f, i) => 
                i === prev.activeIndex ? {...f, hasChanges: false} : f
            )
        }));
        
        console.log(`Saved ${filename} to computer`);
    }


    // GOVIN 2.2.3: Open button - shows dialog to choose Computer or Device (MicroPython only)
    handleOpen() {
        const { deviceType, peripheralName } = this.props;
        
        // Only show choice for MicroPython devices that are connected
        if (deviceType === 'microPython' && peripheralName) {
            this.setState({ showOpenSourceDialog: true });
        } else {
            // Default to computer for non-MicroPython or not connected
            this.handleOpenFromComputer();
        }
    }

    // GOVIN 2.2.3: Open file from computer
    handleOpenFromComputer() {
        this.setState({ showOpenSourceDialog: false }); // Close dialog
        
        const input = document.createElement('input');
        input.type = 'file';
        const { deviceType } = this.props;
        input.accept = (deviceType === 'arduino') ? '.ino,.cpp,.h' : '.py';

        input.onchange = (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const content = ev.target.result;
                    this.props.updateCodeEditorValue(content);
                    if (typeof window !== 'undefined') {
                        const evt = new CustomEvent('hardware.openFile', { 
                            detail: { name: file.name, content, source: 'disk' } 
                        });
                        window.dispatchEvent(evt);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // GOVIN 2.2.3: Open file from MicroPython device
    handleOpenFromDevice() {
        this.setState({ showOpenSourceDialog: false }); // Close dialog
        
        if (!this.props.peripheralName) {
            alert('Please connect a MicroPython device first');
            return;
        }
        
        this.setState({ showDeviceFileBrowser: true, loadingDeviceFiles: true });
        this.loadDeviceFileList();
    }

    // GOVIN 2.2.3: Load file list from device - reads actual files from ESP32
    loadDeviceFileList() {
        const { vm, deviceId } = this.props;
        
        this.setState({ 
            listingDeviceFiles: true,
            deviceFileListBuffer: '',
            suppressConsoleOutput: true
        });
        
        // Send Python command to list files
        const listCommand = `
import os
print('<<<LIST_START>>>')
try:
    files = os.listdir('/')
    for f in files:
        try:
            s = os.stat('/' + f)
            t = 'D' if s[0] & 0x4000 else 'F'
            print(f + '|' + t)
        except:
            print(f + '|F')
except Exception as e:
    print('ERROR:' + str(e))
print('<<<LIST_END>>>')
`;
        
        try {
            vm.writeToPeripheral(deviceId, '\x03'); // Interrupt
            setTimeout(() => {
                vm.writeToPeripheral(deviceId, '\x01'); // Raw REPL
                setTimeout(() => {
                    vm.writeToPeripheral(deviceId, listCommand);
                    setTimeout(() => {
                        vm.writeToPeripheral(deviceId, '\x04'); // Execute
                        console.log('Listing files from device...');
                    }, 100);
                }, 200);
            }, 100);
        } catch (error) {
            console.error('Error listing files:', error);
            this.setState({ 
                loadingDeviceFiles: false,
                listingDeviceFiles: false,
                suppressConsoleOutput: false
            });
        }
    }

    // GOVIN 2.2.3: Capture output from device (for file content reading, file listing, and file deletion)
    // Suppresses console output while reading files
    captureDeviceOutput(data) {
        // Handle file deletion
        if (this.state.deletingDeviceFile) {
            const buffer = this.state.deviceDeleteBuffer + data;
            
            if (buffer.includes('<<<DELETE_SUCCESS>>>') || buffer.includes('<<<DELETE_ERROR>>>')) {
                const success = buffer.includes('<<<DELETE_SUCCESS>>>');
                const fileName = this.state.deletingDeviceFile;
                
                this.setState({
                    deletingDeviceFile: null,
                    deviceDeleteBuffer: '',
                    suppressConsoleOutput: false
                });
                
                // Exit raw REPL mode
                setTimeout(() => {
                    this.props.vm.writeToPeripheral(this.props.deviceId, '\x02'); // Ctrl+B
                }, 200);
                
                if (success) {
                    console.log(`Deleted ${fileName} from device`);
                    alert(`${fileName} deleted successfully!`);
                    // Refresh file list
                    this.setState({ loadingDeviceFiles: true });
                    setTimeout(() => {
                        this.loadDeviceFileList();
                    }, 500);
                } else {
                    console.error(`Failed to delete ${fileName}`);
                    alert(`Error deleting ${fileName}`);
                }
            } else {
                this.setState({ deviceDeleteBuffer: buffer });
            }
            return;
        }
        
        // Handle file listing
        if (this.state.listingDeviceFiles) {
            const buffer = this.state.deviceFileListBuffer + data;
            
            if (buffer.includes('<<<LIST_END>>>')) {
                const startMarker = '<<<LIST_START>>>';
                const endMarker = '<<<LIST_END>>>';
                const startIdx = buffer.indexOf(startMarker);
                const endIdx = buffer.indexOf(endMarker);
                
                if (startIdx !== -1 && endIdx !== -1) {
                    const listOutput = buffer.substring(startIdx + startMarker.length, endIdx).trim();
                    const lines = listOutput.split('\n').filter(line => line.trim());
                    
                    const files = lines.map(line => {
                        const parts = line.split('|');
                        return {
                            name: parts[0],
                            type: parts[1] === 'D' ? 'dir' : 'file'
                        };
                    });
                    
                    this.setState({
                        deviceFiles: files,
                        loadingDeviceFiles: false,
                        listingDeviceFiles: false,
                        deviceFileListBuffer: '',
                        suppressConsoleOutput: false
                    });
                    
                    // GOVIN 2.2.3: Exit raw REPL mode
                    setTimeout(() => {
                        this.props.vm.writeToPeripheral(this.props.deviceId, '\x02'); // Ctrl+B to exit raw REPL
                    }, 200);
                    
                    console.log(`Listed ${files.length} files from device`);
                }
            } else {
                this.setState({ deviceFileListBuffer: buffer });
            }
            return;
        }
        
        // Handle file content reading
        if (!this.state.readingDeviceFile) return;
        
        const buffer = this.state.deviceFileBuffer + data;
        
        // Check if we have complete file content
        if (buffer.includes('<<<FILE_END>>>')) {
            const startMarker = '<<<FILE_START>>>';
            const endMarker = '<<<FILE_END>>>';
            const startIdx = buffer.indexOf(startMarker);
            const endIdx = buffer.indexOf(endMarker);
            
            if (startIdx !== -1 && endIdx !== -1) {
                const fileContent = buffer.substring(startIdx + startMarker.length, endIdx).trim();
                const fileName = this.state.readingDeviceFile;
                
                // Load file into editor
                this.props.updateCodeEditorValue(fileContent);
                if (typeof window !== 'undefined') {
                    const evt = new CustomEvent('hardware.openFile', { 
                        detail: { 
                            name: fileName, 
                            content: fileContent,
                            source: 'device'
                        } 
                    });
                    window.dispatchEvent(evt);
                }
                
                // Update file state to mark as from device
                this.setState(prev => ({
                    files: prev.files.map(f => 
                        f.name === fileName ? {...f, source: 'device', hasChanges: false} : f
                    ),
                    readingDeviceFile: null,
                    deviceFileBuffer: '',
                    suppressConsoleOutput: false
                }));
                
                // GOVIN 2.2.3: Exit raw REPL mode
                setTimeout(() => {
                    this.props.vm.writeToPeripheral(this.props.deviceId, '\x02'); // Ctrl+B to exit raw REPL
                }, 200);
                
                console.log(`Loaded ${fileName} from device: ${fileContent.length} bytes`);
            }
        } else {
            // Accumulate buffer
            this.setState({ deviceFileBuffer: buffer });
        }
    }

    // GOVIN 2.2.3: Load selected file from device - reads actual content from ESP32
    handleLoadDeviceFile(fileName) {
        const { vm, deviceId } = this.props;
        
        this.setState({ 
            showDeviceFileBrowser: false,
            readingDeviceFile: fileName,
            deviceFileBuffer: '',
            suppressConsoleOutput: true
        });
        
        // Send command to read file from device
        const readCommand = `
with open('/${fileName}', 'r') as f:
    print('<<<FILE_START>>>')
    print(f.read())
    print('<<<FILE_END>>>')
`;
        
        try {
            vm.writeToPeripheral(deviceId, '\x03'); // Interrupt
            setTimeout(() => {
                vm.writeToPeripheral(deviceId, '\x01'); // Raw REPL
                setTimeout(() => {
                    vm.writeToPeripheral(deviceId, readCommand);
                    setTimeout(() => {
                        vm.writeToPeripheral(deviceId, '\x04'); // Execute
                        console.log(`Reading ${fileName} from device...`);
                    }, 100);
                }, 200);
            }, 100);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file from device');
            this.setState({ readingDeviceFile: null, deviceFileBuffer: '' });
        }
    }

    // GOVIN 2.2.3: Save file back to device (like Arduino Lab)
    // GOVIN 2.2.4: Added telemetry logging for text-based coding
    handleSaveToDevice() {
        this.setState({ showSaveDialog: false }); // Close dialog
        
        const { vm, deviceId, peripheralName } = this.props;
        const activeFile = this.state.files[this.state.activeIndex];
        
        if (!activeFile) return;
        
        if (!peripheralName) {
            alert('Please connect a MicroPython device first');
            return;
        }
        
        const fileName = activeFile.name;
        const content = activeFile.content;
        
        // GOVIN 2.2.4: Log code details to telemetry for text-based coding mode
        if (content) {
            try {
                // logCodeDetails(content);
            } catch (error) {
                console.error('Error logging code details:', error);
            }
        }
        
        // Escape content for Python string - handle special characters
        const escapedContent = content
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        
        const saveCommand = `
with open('/${fileName}', 'w') as f:
    f.write('${escapedContent}')
print('<<<SAVE_SUCCESS>>>')
`;
        
        try {
            this.setState({ suppressConsoleOutput: true });
            
            vm.writeToPeripheral(deviceId, '\x03');
            setTimeout(() => {
                vm.writeToPeripheral(deviceId, '\x01');
                setTimeout(() => {
                    vm.writeToPeripheral(deviceId, saveCommand);
                    setTimeout(() => {
                        vm.writeToPeripheral(deviceId, '\x04');
                        
                        // Mark as saved and update file source
                        this.setState(prev => ({
                            files: prev.files.map((f, i) => 
                                i === prev.activeIndex ? {...f, hasChanges: false, source: 'device'} : f
                            ),
                            suppressConsoleOutput: false
                        }));
                        
                        // GOVIN 2.2.3: Exit raw REPL mode
                        setTimeout(() => {
                            vm.writeToPeripheral(deviceId, '\x02'); // Ctrl+B to exit raw REPL
                        }, 200);
                        
                        console.log(`Saved ${fileName} to device`);
                        alert(`${fileName} saved to device successfully!`);
                    }, 100);
                }, 200);
            }, 100);
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file to device');
            this.setState({ suppressConsoleOutput: false });
        }
    }

    // GOVIN 2.2.3: Delete file from device (like Arduino Lab)
    handleDeleteDeviceFile(fileName) {
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${fileName}" from the device? This cannot be undone.`)) {
            return;
        }
        
        const { vm, deviceId, peripheralName } = this.props;
        
        if (!peripheralName) {
            alert('Please connect a MicroPython device first');
            return;
        }
        
        this.setState({ 
            deletingDeviceFile: fileName,
            deviceDeleteBuffer: '',
            suppressConsoleOutput: true
        });
        
        const deleteCommand = `
import os
try:
    os.remove('/${fileName}')
    print('<<<DELETE_SUCCESS>>>')
except Exception as e:
    print('<<<DELETE_ERROR>>>')
    print(str(e))
`;
        
        try {
            vm.writeToPeripheral(deviceId, '\x03'); // Interrupt
            setTimeout(() => {
                vm.writeToPeripheral(deviceId, '\x01'); // Raw REPL
                setTimeout(() => {
                    vm.writeToPeripheral(deviceId, deleteCommand);
                    setTimeout(() => {
                        vm.writeToPeripheral(deviceId, '\x04'); // Execute
                        console.log(`Deleting ${fileName} from device...`);
                    }, 100);
                }, 200);
            }, 100);
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Error deleting file from device');
            this.setState({ 
                deletingDeviceFile: null,
                deviceDeleteBuffer: '',
                suppressConsoleOutput: false
            });
        }
    }

    // GOVIN 2.2.3: Close file browser
    handleCloseFileBrowser() {
        this.setState({ showDeviceFileBrowser: false });
    }

    // GOVIN 2.2.3: New Run button - replaces "New" button
    // Run code in REPL without uploading - GUI-only solution using existing vm.writeToPeripheral
    // Similar to Arduino Lab for MicroPython - no VM changes needed
    handleRunREPL() {
        const { codeEditorValue, deviceId, deviceType, peripheralName, vm } = this.props;
        
        // Only MicroPython devices support REPL execution
        if (deviceType !== 'microPython') {
            alert('REPL execution is only available for MicroPython devices');
            return;
        }
        
        if (!peripheralName) {
            this.props.onNoPeripheralIsConnected();
            return;
        }

        if (!codeEditorValue || codeEditorValue.trim() === '') {
            this.props.onWorkspaceIsEmpty();
            return;
        }

        console.log('Running code in REPL:', codeEditorValue);
        
        // Use existing vm.writeToPeripheral - no VM changes needed!
        // MicroPython REPL protocol:
        // 1. Ctrl+C (0x03) to interrupt any running code
        // 2. Ctrl+A (0x01) to enter raw REPL mode  
        // 3. Send the code
        // 4. Ctrl+D (0x04) to execute
        
        try {
            // Step 1: Interrupt any running code
            vm.writeToPeripheral(deviceId, '\x03');
            
            setTimeout(() => {
                // Step 2: Enter raw REPL mode
                vm.writeToPeripheral(deviceId, '\x01');
                
                setTimeout(() => {
                    // Step 3: Send the code
                    vm.writeToPeripheral(deviceId, codeEditorValue);
                    
                    setTimeout(() => {
                        // Step 4: Execute with Ctrl+D
                        vm.writeToPeripheral(deviceId, '\x04');
                        
                        // GOVIN 2.2.3: Exit raw REPL mode after execution
                        setTimeout(() => {
                            vm.writeToPeripheral(deviceId, '\x02'); // Ctrl+B to exit raw REPL
                        }, 500);
                    }, 100);
                }, 200);
            }, 100);
            
        } catch (error) {
            console.error('Error running code in REPL:', error);
            alert('Error executing code in REPL: ' + error.message);
        }
    }
    render () {
        const {
            codeEditorLanguage,
            codeEditorOptions,
            codeEditorTheme,
            isCodeEditorLocked,
            onCodeEditorWillMount,
            onCodeEditorDidMount,
            onClickCodeEditorLock,
            stageSizeMode,
            ...passThrough
        } = this.props;

        const { files, activeIndex, renamingIndex, tempName, isConsoleHidden, showDeviceFileBrowser, showOpenSourceDialog, showSaveDialog, deviceFiles, loadingDeviceFiles } = this.state;
        const activeContent = files[activeIndex] ? files[activeIndex].content : '';
        const activeFile = files[activeIndex];

        return (
            <Box className={classNames(styles.hardwareWrapper, this.props.isDarkTheme ? styles.darkTheme : null)}>
                <Box className={classNames(styles.codeEditorWrapper, isConsoleHidden ? styles.fullHeight : null)}>
                    {/* Govin 2.2.0: Editor header with file tabs */}
                    <div className={styles.editorHeader}>
                       {/* / <div className={styles.editorTitle}>Editor </div> */}
                        <div className={styles.editorTitle}>Editor &lt;/&gt;</div>

                        {/* Govin 2.2.0: Console toggle button */}
                        <div className={styles.editorHeaderControls}>
                            {/* GOVIN 2.2.3: Icon button for console toggle to save space */}
                            <button 
                                className={styles.iconButton}
                                onClick={this.toggleConsole}
                                title={isConsoleHidden ? 'Show Console' : 'Hide Console'}
                            >
                                {isConsoleHidden ? (
                                    // Eye icon - Show Console
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    </svg>
                                ) : (
                                    // Eye-off icon - Hide Console
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                    </svg>
                                )}
                            </button>
                            {/* Govin 2.2.0: Font size controls */}
                            {/* <button
                                className={styles.consoleToggleButton}
                                onClick={this.decreaseFontSize}
                                title="Font -"
                            >
                                A-
                            </button>
                            <button
                                className={styles.consoleToggleButton}
                                onClick={this.increaseFontSize}
                                title="Font +"
                            >
                                A+
                            </button> */}

                            <button
                                className={styles.consoleToggleButton}
                                onClick={this.handleUpload}
                                title="Upload Code to Device"
                            >
                             <img
                                    alt="Upload Code to Device"
                                    className={styles.uploadIcon}
                                    draggable={false}
                                    src={uploadIcon}
                                />
                                Upload
                            </button>


                            <button
                                className={styles.consoleToggleButton}
                                onClick={this.handleSave}
                                title="Save file"
                            >
                                Save
                            </button>

                            <button
                                className={styles.consoleToggleButton}
                                onClick={this.handleRunREPL}
                                title="Run Code in REPL"
                            >
                                Run
                            </button>

                            <button
                                className={styles.consoleToggleButton}
                                onClick={this.handleOpen}
                                title="Open Text File"
                            >
                                    Open
                            </button>
                          
                          
                            <button
                                className={styles.iconButton}
                                onClick={this.toggleTheme}
                                title={`Switch to ${this.props.isDarkTheme ? 'Light' : 'Dark'} Theme`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    {this.props.isDarkTheme ? (
                                        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                                    ) : (
                                        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                                    )}
                                </svg>
                            </button>

                        </div>
                        <div className={styles.fileTabs}>
                            {files.map((file, idx) => (
                                <div
                                    key={file.id}
                                    className={classNames(styles.fileTab, idx === activeIndex ? styles.active : null)}
                                    onClick={() => this.handleSwitchFile(idx)}
                                >
                                    {renamingIndex === idx ? (
                                        <input
                                            className={styles.fileTabRename}
                                            value={tempName}
                                            onChange={e => this.setState({ tempName: e.target.value })}
                                            onBlur={this.commitRename}
                                            onKeyDown={e => { if (e.key === 'Enter') this.commitRename(); if (e.key === 'Escape') { this.setState({ renamingIndex: -1, tempName: '' }); } }}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className={styles.fileTabName} onDoubleClick={e => this.startRenaming(idx, e)}>
                                            {file.name}{file.hasChanges ? ' *' : ''}
                                        </span>
                                    )}
                                    <span className={styles.fileTabClose} onClick={e => this.handleCloseFile(idx, e)}>×</span>
                                </div>
                            ))}
                            <button 
                                className={classNames(styles.fileTabsAdd, files.length >= 4 ? styles.fileTabsAddDisabled : null)}
                                onClick={this.handleAddFile} 
                                disabled={files.length >= 4}
                                title={files.length >= 4 ? 'Maximum of 4 tabs allowed' : 'Add new tab'}
                            >
                                +
                            </button>
                        </div>
                    </div>
                    
                    {/* GOVIN 2.2.3: Editor container with floating font buttons */}
                    <Box className={styles.editorContainer}>
                        {/* GOVIN 2.2.3: Font size buttons floating over editor */}
                        <button
                            className={classNames(styles.button, styles.fontButton)}
                            onClick={this.decreaseFontSize}
                            title="Decrease Font Size"
                        >
                            A-
                        </button>
                        <button
                            className={classNames(styles.button, styles.fontButtonPlus)}
                            onClick={this.increaseFontSize}
                            title="Increase Font Size"
                        >
                            A+
                        </button>

                        {/* GOVIN 2.2.3: Copy/Paste/Cut buttons stacked vertically */}
                        <button
                            className={classNames(styles.button, styles.copyButton)}
                            onClick={this.copySelectedText}
                            title="Copy Selected Text"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                        <button
                            className={classNames(styles.button, styles.pasteButton)}
                            onClick={this.pasteText}
                            title="Paste Text"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
                            </svg>
                        </button>
                        <button
                            className={classNames(styles.button, styles.cutButton)}
                            onClick={this.cutSelectedText}
                            title="Cut Selected Text"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 12l-2.5-2.5L19 7l2.5 2.5L19 12z"/>
                            </svg>
                        </button>

                            <CodeEditorTest
                            width={(stageSizeMode === STAGE_SIZE_MODES.large) ? 1920 : 1440}
                            value={activeContent}
                            language={codeEditorLanguage}
                            editorWillMount={onCodeEditorWillMount}
                            editorDidMount={this.handleEditorDidMount}
                            onChange={this.handleEditorChange}
                            theme={this.props.isDarkTheme ? 'modernDark' : 'modernLight'}
                            options={{...codeEditorOptions, contextmenu: true, automaticLayout: true, fontSize: this.state.editorFontSize}} // Govin 2.2.0: right-click + auto layout + font size
                        />
                    </Box>
                </Box>
                {/* Govin 2.2.0: Keep console mounted; hide via CSS to preserve content */}
                <Box
                    className={classNames(
                        styles.hardwareConsoleWrapper,
                        (stageSizeMode === STAGE_SIZE_MODES.large) ? styles.hide : styles.narrowWrapper,
                        isConsoleHidden ? styles.consoleHidden : null
                    )}
                >
                    <div className={styles.consoleHeader}>Console &gt;&gt;&gt; </div>
                    <HardwareConsole
                        {...passThrough}
                        suppressOutput={this.state.suppressConsoleOutput}
                    />
                </Box>

                {/* GOVIN 2.2.3: Open source selection dialog (Computer vs Device) */}
                {showOpenSourceDialog && (
                    <div className={styles.fileBrowserOverlay}>
                        <div className={styles.openSourceDialog}>
                            <div className={styles.fileBrowserHeader}>
                                <h3>Open File From...</h3>
                                <button 
                                    className={styles.closeButton}
                                    onClick={() => this.setState({ showOpenSourceDialog: false })}
                                >
                                    ×
                                </button>
                            </div>
                            <div className={styles.openSourceBody}>
                                <button
                                    className={styles.sourceOptionButton}
                                    onClick={this.handleOpenFromComputer}
                                >
                                    <div className={styles.sourceIcon}>💻</div>
                                    <div className={styles.sourceText}>
                                        <div className={styles.sourceTitle}>Computer</div>
                                        <div className={styles.sourceDesc}>Open from your local files</div>
                                    </div>
                                </button>
                                <button
                                    className={styles.sourceOptionButton}
                                    onClick={this.handleOpenFromDevice}
                                >
                                    <div className={styles.sourceIconImage}>
                                        <img src={micropythonLogo} alt="MicroPython" />
                                    </div>
                                    <div className={styles.sourceText}>
                                        <div className={styles.sourceTitle}>MicroPython Device</div>
                                        <div className={styles.sourceDesc}>Open from connected board</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* GOVIN 2.2.3: Save destination selection dialog (Computer vs Device) */}
                {showSaveDialog && (
                    <div className={styles.fileBrowserOverlay}>
                        <div className={styles.openSourceDialog}>
                            <div className={styles.fileBrowserHeader}>
                                <h3>Save File To...</h3>
                                <button 
                                    className={styles.closeButton}
                                    onClick={() => this.setState({ showSaveDialog: false })}
                                >
                                    ×
                                </button>
                            </div>
                            <div className={styles.openSourceBody}>
                                <button
                                    className={styles.sourceOptionButton}
                                    onClick={this.handleSaveToComputer}
                                >
                                    <div className={styles.sourceIcon}>💻</div>
                                    <div className={styles.sourceText}>
                                        <div className={styles.sourceTitle}>Computer</div>
                                        <div className={styles.sourceDesc}>Download to your local drive</div>
                                    </div>
                                </button>
                                <button
                                    className={styles.sourceOptionButton}
                                    onClick={this.handleSaveToDevice}
                                >
                                    <div className={styles.sourceIconImage}>
                                        <img src={micropythonLogo} alt="MicroPython" />
                                    </div>
                                    <div className={styles.sourceText}>
                                        <div className={styles.sourceTitle}>MicroPython Device</div>
                                        <div className={styles.sourceDesc}>Save to connected board</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* GOVIN 2.2.3: Device file browser modal */}
                {showDeviceFileBrowser && (
                    <div className={styles.fileBrowserOverlay}>
                        <div className={styles.fileBrowserModal}>
                            <div className={styles.fileBrowserHeader}>
                                <h3>Open File from MicroPython Device</h3>
                                <div className={styles.headerButtons}>
                                    <button 
                                        className={styles.refreshButton}
                                        onClick={this.loadDeviceFileList}
                                        disabled={loadingDeviceFiles}
                                        title="Refresh file list"
                                    >
                                        🔄
                                    </button>
                                    <button 
                                        className={styles.closeButton}
                                        onClick={this.handleCloseFileBrowser}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className={styles.fileBrowserBody}>
                                {loadingDeviceFiles ? (
                                    <div className={styles.loading}>Loading files...</div>
                                ) : (
                                    <div className={styles.fileList}>
                                        {deviceFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className={styles.fileItem}
                                            >
                                                <div
                                                    className={styles.fileItemContent}
                                                    onDoubleClick={() => {
                                                        if (file.type === 'file') {
                                                            this.handleLoadDeviceFile(file.name);
                                                        }
                                                    }}
                                                >
                                                    <span className={styles.fileIcon}>
                                                        {file.type === 'dir' ? '📁' : '📄'}
                                                    </span>
                                                    <span className={styles.fileName}>{file.name}</span>
                                                </div>
                                                {file.type === 'file' && (
                                                    <button
                                                        className={styles.deleteButton}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            this.handleDeleteDeviceFile(file.name);
                                                        }}
                                                        title="Delete file"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={styles.fileBrowserFooter}>
                                <div className={styles.hint}>
                                    💡 Double-click a file to open it
                                </div>
                                <button
                                    className={styles.cancelButton}
                                    onClick={this.handleCloseFileBrowser}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Box>
        );
    }
}

// GOVIN 2.2.3: Added props for upload button functionality
HardwareComponentTest.propTypes = {
    codeEditorLanguage: PropTypes.string,
    codeEditorOptions: PropTypes.shape({
        highlightActiveIndentGuide: PropTypes.bool,
        cursorSmoothCaretAnimation: PropTypes.bool,
        readOnly: PropTypes.bool,
        contextmenu: PropTypes.bool,
        minimap: PropTypes.shape({
            enabled: PropTypes.bool
        })
    }),
    codeEditorTheme: PropTypes.string,
    codeEditorValue: PropTypes.string,
    updateCodeEditorValue: PropTypes.func,
    onWorkspaceIsEmpty: PropTypes.func,
    isDarkTheme: PropTypes.bool,
    onSetTheme: PropTypes.func,
    isCodeEditorLocked: PropTypes.bool,
    onCodeEditorWillMount: PropTypes.func,
    onCodeEditorDidMount: PropTypes.func,
    onCodeEditorChange: PropTypes.func,
    onClickCodeEditorLock: PropTypes.func,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    // GOVIN 2.2.3: Props for upload button
    vm: PropTypes.instanceOf(VM),
    deviceId: PropTypes.string,
    deviceType: PropTypes.string,
    peripheralName: PropTypes.string,
    onOpenUploadProgress: PropTypes.func,
    onNoPeripheralIsConnected: PropTypes.func
};

HardwareComponentTest.defaultProps = {
    stageSizeMode: STAGE_SIZE_MODES.hide
};

export default HardwareComponentTest;
