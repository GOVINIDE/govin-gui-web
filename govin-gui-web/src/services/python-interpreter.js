const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class PythonInterpreter {
    constructor() {
        this.process = null;
        this.isRunning = false;
        this.outputBuffer = '';
        this.errorBuffer = '';
        this.callbacks = {
            onOutput: null,
            onError: null,
            onExit: null
        };
    }

    /**
     * Initialize Python interpreter
     * @param {string} pythonPath - Path to Python executable
     */
    async initialize(pythonPath = 'python3') {
        try {
            // Check if Python is available
            await this.checkPythonInstallation(pythonPath);
            
            // Start Python process in interactive mode
            this.process = spawn(pythonPath, ['-i', '-u'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            this.setupEventHandlers();
            this.isRunning = true;
            
            // Install required packages if not present
            await this.ensureRequiredPackages();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Python interpreter:', error);
            return false;
        }
    }

    /**
     * Check if Python is installed and accessible
     */
    async checkPythonInstallation(pythonPath) {
        return new Promise((resolve, reject) => {
            const checkProcess = spawn(pythonPath, ['--version'], { shell: true });
            
            checkProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Python not found at ${pythonPath}`));
                }
            });
            
            checkProcess.on('error', (error) => {
                reject(new Error(`Python not found: ${error.message}`));
            });
        });
    }

    /**
     * Ensure required packages are installed
     */
    async ensureRequiredPackages() {
        const requiredPackages = [
            'numpy',
            'pandas', 
            'matplotlib',
            'scipy',
            'requests'
        ];

        for (const packageName of requiredPackages) {
            try {
                await this.installPackage(packageName);
            } catch (error) {
                console.warn(`Failed to install ${packageName}:`, error.message);
            }
        }
    }

    /**
     * Install a Python package using pip
     */
    async installPackage(packageName) {
        return new Promise((resolve, reject) => {
            const pipProcess = spawn('pip', ['install', packageName], { shell: true });
            
            pipProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Failed to install ${packageName}`));
                }
            });
            
            pipProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Setup event handlers for Python process
     */
    setupEventHandlers() {
        this.process.stdout.on('data', (data) => {
            const output = data.toString();
            this.outputBuffer += output;
            
            if (this.callbacks.onOutput) {
                this.callbacks.onOutput(output);
            }
        });

        this.process.stderr.on('data', (data) => {
            const error = data.toString();
            this.errorBuffer += error;
            
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        });

        this.process.on('close', (code) => {
            this.isRunning = false;
            if (this.callbacks.onExit) {
                this.callbacks.onExit(code);
            }
        });

        this.process.on('error', (error) => {
            console.error('Python process error:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error.message);
            }
        });
    }

    /**
     * Execute Python code
     * @param {string} code - Python code to execute
     */
    executeCode(code) {
        if (!this.isRunning || !this.process) {
            throw new Error('Python interpreter not running');
        }

        // Clear previous output
        this.outputBuffer = '';
        this.errorBuffer = '';

        // Send code to Python process
        this.process.stdin.write(code + '\n');
    }

    /**
     * Set callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Stop the Python interpreter
     */
    stop() {
        if (this.process && this.isRunning) {
            this.process.kill();
            this.isRunning = false;
        }
    }

    /**
     * Get available packages
     */
    async getInstalledPackages() {
        return new Promise((resolve, reject) => {
            const pipProcess = spawn('pip', ['list'], { shell: true });
            let output = '';

            pipProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pipProcess.on('close', (code) => {
                if (code === 0) {
                    const packages = this.parsePackageList(output);
                    resolve(packages);
                } else {
                    reject(new Error('Failed to get package list'));
                }
            });
        });
    }

    /**
     * Parse pip list output
     */
    parsePackageList(output) {
        const lines = output.split('\n');
        const packages = [];

        for (const line of lines) {
            if (line.trim() && !line.startsWith('Package')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    packages.push({
                        name: parts[0],
                        version: parts[1]
                    });
                }
            }
        }

        return packages;
    }
}

module.exports = PythonInterpreter;
