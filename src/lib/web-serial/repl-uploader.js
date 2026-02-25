/**
 * MicroPython REPL-based file upload over Web Serial.
 * Matches the protocol used by Arduino lab-micropython-editor (micropython.js):
 * raw REPL only (no paste mode); send Python source then Ctrl+D; wait for \x04>.
 * Writes file with save-style command: with open('/main.py','w') as f: f.write(...)
 *
 * govin 2.3.2: Purpose: Write main.py to device over raw REPL (save-style flow).
 * browser-only, no g-link/ampy.
 */

const RAW_REPL_ENTER = 0x01;  // Ctrl+A
const RAW_REPL_EXIT = 0x02;   // Ctrl+B
const EXECUTE = 0x04;         // Ctrl+D
const INTERRUPT = 0x03;       // Ctrl+C

const WRITE_CHUNK_SIZE = 128;  // bytes of Python source per write (micropython.js)
const CHUNK_DELAY_MS = 15;
const PROMPT_TIMEOUT_MS = 15000;  // Increased for Windows compatibility

/**
 * Normalize line endings to \n (micropython.js fixLineBreak).
 */
function fixLineBreak (str) {
    return str.replace(/\r\n/g, '\n');
}

/**
 * Best-effort hardware reset pulse (EN-like) via Web Serial control signals.
 * On many ESP32 USB-UART bridges this removes the need to press EN manually
 * before talking to raw REPL.
 */
async function pulseResetLines (serialPort, onStdout) {
    if (!serialPort || typeof serialPort.setSignals !== 'function') return;
    try {
        if (onStdout) onStdout('Pulsing reset lines...\n');
        // Keep BOOT not asserted; pulse reset.
        await serialPort.setSignals({dataTerminalReady: false, requestToSend: false});
        await new Promise(r => setTimeout(r, 80));
        await serialPort.setSignals({dataTerminalReady: true, requestToSend: false});
        await new Promise(r => setTimeout(r, 220));
        await serialPort.setSignals({dataTerminalReady: false, requestToSend: false});
        await new Promise(r => setTimeout(r, 180));
    } catch (_) {
        // Ignore; some drivers/boards may not expose or honor line control.
    }
}

/**
 * Read from the port until we see the given ending or timeout.
 * Improved for Windows compatibility with better buffering handling.
 */
async function readUntil (reader, ending, abortSignal) {
    let buffer = '';
    const deadline = Date.now() + PROMPT_TIMEOUT_MS;
    const decoder = new TextDecoder();
    while (Date.now() < deadline && (!abortSignal || !abortSignal.aborted)) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
            buffer += decoder.decode(value, { stream: true });
        if (buffer.includes(ending)) return buffer;
        }
        // Small delay to allow more data to arrive (helps with Windows buffering)
        await new Promise(r => setTimeout(r, 10));
    }
    const err = new Error(`Timeout waiting for device prompt: ${JSON.stringify(ending)}. Last output: ${buffer.slice(-300)}`);
    err.partialOutput = buffer;
    throw err;
}

/**
 * Send a raw REPL command: send Python source in 128-byte chunks, then Ctrl+D, then read until \x04>.
 * (Matches micropython.js exec_raw.)
 */
async function execRaw (writer, reader, pyCode, abortSignal) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(pyCode);
    for (let i = 0; i < bytes.length; i += WRITE_CHUNK_SIZE) {
        const chunk = bytes.subarray(i, Math.min(i + WRITE_CHUNK_SIZE, bytes.length));
        await writer.write(chunk);
        if (bytes.length > WRITE_CHUNK_SIZE && CHUNK_DELAY_MS > 0) {
            await new Promise(r => setTimeout(r, CHUNK_DELAY_MS));
        }
    }
    await writer.write(new Uint8Array([EXECUTE]));
    const out = await readUntil(reader, '\x04>', abortSignal);
    if (/Traceback|SyntaxError|Error/.test(out)) {
        throw new Error(out.slice(-600));
    }
    return out;
}

/**
 * Upload code to the device as a file using a save-like write flow.
 * Expects exclusive access to serial reader/writer while uploading so each
 * raw REPL command can wait for an explicit ACK prompt.
 *
 * @param {SerialPort} serialPort - Web Serial port (already open)
 * @param {string} code - Python code to write (UTF-8)
 * @param {string} filename - target path on device, e.g. 'main.py'
 * @param {function(string)} onStdout - progress/log callback
 * @param {AbortSignal} [abortSignal] - optional, to cancel upload
 * @returns {Promise<'Success'|'Aborted'|Error>}
 */
export async function uploadCodeToDevice (serialPort, code, filename, onStdout, abortSignal) {
    let writer;
    let reader;
    const send = async (bytes) => {
        if (abortSignal && abortSignal.aborted) throw new Error('Aborted');
        await writer.write(bytes instanceof Uint8Array ? bytes : new Uint8Array([bytes]));
    };

    try {
        writer = serialPort.writable.getWriter();
        reader = serialPort.readable.getReader();

        if (onStdout) onStdout('Preparing device...\n');
        await pulseResetLines(serialPort, onStdout);

        // Step 1: Interrupt any running code and enter raw REPL (with retries).
        let enteredRawRepl = false;
        let enterError = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await send(INTERRUPT);
                await new Promise(r => setTimeout(r, 200));
                await send(INTERRUPT);
                await new Promise(r => setTimeout(r, 150));
                await send(INTERRUPT);
                await new Promise(r => setTimeout(r, 150));
                // Exit normal/raw mode if currently in an unexpected state.
                await send(RAW_REPL_EXIT);
                await new Promise(r => setTimeout(r, 120));
                await send(RAW_REPL_ENTER);
                await readUntil(reader, '>', abortSignal);
                enteredRawRepl = true;
                break;
            } catch (err) {
                enterError = err;
                if (onStdout) onStdout(`Raw REPL sync attempt ${attempt}/3 failed, retrying...\n`);
                await new Promise(r => setTimeout(r, 250));
            }
        }
        if (!enteredRawRepl) {
            throw enterError || new Error('Failed to enter raw REPL');
        }

        if (abortSignal && abortSignal.aborted) return 'Aborted';

        if (onStdout) onStdout('Writing main.py...\n');

        // Step 2: Use the same save-style logic as "Save to Device".
        const safeFilename = filename.replace(/'/g, "\\'");
        const normalizedCode = fixLineBreak(code);
        const escapedContent = normalizedCode
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        const saveCmd = `with open('/${safeFilename}', 'w') as f:\n    f.write('${escapedContent}')\nprint('<<<SAVE_SUCCESS>>>')\n`;
        const saveOut = await execRaw(writer, reader, saveCmd, abortSignal);
        if (!saveOut.includes('<<<SAVE_SUCCESS>>>')) {
            throw new Error(`Device did not confirm save. Last output: ${saveOut.slice(-300)}`);
        }

        if (abortSignal && abortSignal.aborted) return 'Aborted';

        // Step 3: Exit raw REPL. Reboot is user-controlled, same as Save workflow.
        try {
            await send(RAW_REPL_EXIT);
            await new Promise(r => setTimeout(r, 120));
        } catch (_) {}

        if (onStdout) onStdout('Saved main.py successfully. Press Reboot in console to run new code.\n');
        return 'Success';
    } catch (err) {
        if (err.message === 'Aborted') {
            return 'Aborted';
        }
        if (onStdout) onStdout(`Error: ${err.message}\n`);
        return err;
    } finally {
        try {
            if (reader) reader.releaseLock();
        } catch (_) {}
        try {
            if (writer) writer.releaseLock();
        } catch (_) {}
    }
}
