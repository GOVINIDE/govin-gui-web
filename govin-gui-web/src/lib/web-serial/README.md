# Web Serial support (browser-only upload) — Govin 2.3.2

This folder adds **browser-based** MicroPython code upload and serial connection using the [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API), without changing the desktop app.

**Full working and implementation:** see [WEB_SERIAL_GOVIN_2.3.2.md](./WEB_SERIAL_GOVIN_2.3.2.md).

## Behaviour

- **Browser (e.g. `npm run build` → open `index.html` in Chrome/Edge):**
  - Connect: user selects a port via the browser’s serial port picker.
  - Upload code: code is sent to the device over the same connection using the MicroPython **raw REPL** (no paste mode; protocol matches Arduino lab-micropython-editor / micropython.js). No g-link, esptool, or ampy.
  - Upload firmware: not supported; the UI shows a message to use the Govin Desktop app.

- **Desktop (Govin Desktop / Electron):**
  - Unchanged: connection and upload still go through g-link (WebSocket to `ws://127.0.0.1:20111/govin/serialport`) and use esptool/ampy as before.
  - **ampy required for upload:** the desktop spawns the `ampy` CLI to push files; if you see `Error: spawn ampy ENOENT`, install with `pip install adafruit-ampy` and ensure `ampy` is on your PATH (see [WEB_SERIAL_GOVIN_2.3.2.md](./WEB_SERIAL_GOVIN_2.3.2.md) §2.B).
  - Detection: if `window.GOVIN_DESKTOP` is set or `process.versions.electron` exists, the Web Serial path is not used.

## Files (govin 2.3.2)

- `repl-uploader.js` – writes a single file (e.g. `main.py`) to the device via raw REPL (`exec_raw` + `w(bytes([...]))`), 48-byte chunks.
- `serial-link-adapter.js` – implements the same JSON-RPC “socket” interface as g-link for discover, connect, write, read, upload, etc., using Web Serial and the REPL uploader.
- `socket-factory.js` – returns the Web Serial adapter for `SERIALPORT` only when `shouldUseWebSerial()` is true; otherwise returns the default g-link WebSocket.

## Optional: desktop flag

If the desktop app ever loads the GUI in a context where `process.versions.electron` is not available, it can set `window.GOVIN_DESKTOP = true` before the GUI runs so the VM keeps using g-link.
