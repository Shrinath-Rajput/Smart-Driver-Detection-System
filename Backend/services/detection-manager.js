/**
 * AI Detection Process Manager
 * Manages Python detection process lifecycle and communication
 */

const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const logging = require('../utils/logging');

const logger = logging.getLogger('DetectionManager');

class DetectionManager {
    constructor() {
        this.detectionProcess = null;
        this.isRunning = false;
        this.sessionId = null;
        this.statusInterval = null;
        this.currentState = null;
        this.listeners = [];
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Start AI detection process
     */
    async start(driverId = 'DRIVER_001') {
        try {
            if (this.isRunning) {
                logger.warn('Detection already running');
                return { success: false, message: 'Detection already running' };
            }

            logger.info(`Starting detection service for driver: ${driverId}`);

            // Spawn Python process - USE REAL DETECTION SERVICE, NOT MOCK
            // Use virtual environment Python on Windows, system Python on Linux/Mac
            const pythonPath = process.platform === 'win32'
                ? path.join(__dirname, '../../.venv/Scripts/python.exe')
                : 'python3';
            
            const scriptPath = path.join(
                __dirname,
                '../../src/Detection/detection_service.py'
            );

            this.detectionProcess = spawn(pythonPath, [scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false,
                cwd: path.join(__dirname, '../../'),
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });

            if (!this.detectionProcess.pid) {
                throw new Error('Failed to spawn detection process');
            }

            logger.info(`Detection process started with PID: ${this.detectionProcess.pid}`);

            this.isRunning = true;
            this.sessionId = this.generateSessionId();

            // Setup output handling
            this.setupProcessHandlers();

            // Wait for service to be ready
            await this.waitForServiceReady(30000); // 30 second timeout

            // CRITICAL: Actually start the detection on the Python service
            logger.info('Calling Python service to start detection loop...');
            const startResponse = await axios.post('http://localhost:5001/api/detection/start', {}, {
                timeout: 5000
            });
            logger.info(`Detection loop started: ${JSON.stringify(startResponse.data)}`);

            // Start polling for status updates
            this.startStatusPolling();

            // Notify listeners
            this.emit('started', { sessionId: this.sessionId, driverId });

            return {
                success: true,
                message: 'Detection started successfully',
                sessionId: this.sessionId,
                driverId: driverId,
                pid: this.detectionProcess.pid
            };

        } catch (error) {
            logger.error(`Failed to start detection: ${error.message}`);
            this.isRunning = false;
            this.cleanup();
            return { success: false, message: error.message };
        }
    }

    /**
     * Stop AI detection process
     */
    async stop() {
        try {
            if (!this.isRunning || !this.detectionProcess) {
                return { success: false, message: 'Detection not running' };
            }

            logger.info('Stopping detection process...');

            // Call stop endpoint to gracefully shutdown
            try {
                await axios.post('http://localhost:5001/api/detection/stop', {}, {
                    timeout: 5000
                });
            } catch (error) {
                logger.warn(`Stop endpoint not responsive: ${error.message}`);
            }

            // Kill process if still running
            if (this.detectionProcess && !this.detectionProcess.killed) {
                this.detectionProcess.kill('SIGTERM');
                
                // Force kill if not dead after 5 seconds
                setTimeout(() => {
                    if (this.detectionProcess && !this.detectionProcess.killed) {
                        this.detectionProcess.kill('SIGKILL');
                    }
                }, 5000);
            }

            this.isRunning = false;
            this.cleanup();

            this.emit('stopped', { sessionId: this.sessionId });

            return {
                success: true,
                message: 'Detection stopped successfully'
            };

        } catch (error) {
            logger.error(`Error stopping detection: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get current detection status
     */
    async getStatus() {
        try {
            if (!this.isRunning) {
                return {
                    is_running: false,
                    current_status: 'IDLE'
                };
            }

            const response = await axios.get('http://localhost:5001/api/detection/status', {
                timeout: 5000
            });

            this.currentState = response.data;
            return response.data;

        } catch (error) {
            logger.warn(`Failed to get status: ${error.message}`);
            return { error: error.message };
        }
    }

    /**
     * Setup process event handlers
     */
    setupProcessHandlers() {
        if (!this.detectionProcess) return;

        // Stdout
        this.detectionProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                logger.info(`[DETECTION SERVICE]: ${output}`);
            }
        });

        // Stderr - Filter out TensorFlow startup warnings and only capture real errors
        this.detectionProcess.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (!output) return;

            // Filter out TensorFlow startup warnings that are NOT errors
            const isTensorFlowWarning = 
                output.includes('WARNING:') ||
                output.includes('oneDNN') ||
                output.includes('absl::InitializeLog') ||
                output.includes('I tensorflow') ||
                output.includes('tensorflow/') ||
                output.includes('successful NUMA node read') ||
                output.includes('Your CPU');

            // Only treat as real errors: Traceback, ImportError, Exception, SyntaxError, etc.
            const isRealError = 
                output.includes('Traceback') ||
                output.includes('ImportError') ||
                output.includes('ModuleNotFoundError') ||
                output.includes('AttributeError') ||
                output.includes('TypeError') ||
                output.includes('SyntaxError') ||
                output.includes('FileNotFoundError') ||
                output.includes('RuntimeError') ||
                output.includes('Exception') ||
                output.includes('Error:');

            if (isTensorFlowWarning) {
                logger.warn(`[TF]: ${output}`);
            } else if (isRealError) {
                logger.error(`[DETECTION SERVICE ERROR]: ${output}`);
                this.emit('error', { message: output });
            } else if (output.includes('ERROR:')) {
                logger.error(`[DETECTION SERVICE ERROR]: ${output}`);
                this.emit('error', { message: output });
            }
        });

        // Exit
        this.detectionProcess.on('exit', (code, signal) => {
            logger.warn(`Detection process exited with code ${code}, signal ${signal}`);
            this.isRunning = false;
            this.cleanup();
            this.emit('crashed', { code, signal });
        });

        // Error
        this.detectionProcess.on('error', (error) => {
            logger.error(`Detection process error: ${error.message}`);
            this.isRunning = false;
            this.cleanup();
            this.emit('error', { message: error.message });
        });
    }

    /**
     * Wait for service to be ready
     */
    async waitForServiceReady(timeout = 30000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                const response = await axios.get('http://localhost:5001/api/detection/health', {
                    timeout: 2000
                });

                if (response.status === 200) {
                    logger.info('Detection service is ready');
                    return true;
                }
            } catch (error) {
                // Service not ready yet
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        throw new Error('Detection service failed to start within timeout');
    }

    /**
     * Start polling for status updates
     */
    startStatusPolling() {
        if (this.statusInterval) clearInterval(this.statusInterval);

        // Poll every 500ms
        this.statusInterval = setInterval(async () => {
            try {
                const status = await this.getStatus();

                if (status && !status.error) {
                    // Emit status update to listeners
                    this.emit('status', status);

                    // Check for emergency alerts
                    if (status.alert_triggered && status.current_status === 'EMERGENCY') {
                        this.emit('alert', {
                            type: 'EMERGENCY',
                            sessionId: status.session_id,
                            timestamp: status.last_update,
                            latitude: status.latitude,
                            longitude: status.longitude
                        });
                    }
                }
            } catch (error) {
                logger.warn(`Status polling error: ${error.message}`);
            }
        }, 500);
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        this.listeners = this.listeners.filter(
            listener => !(listener.event === event && listener.callback === callback)
        );
    }

    /**
     * Emit event to all listeners
     */
    emit(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => {
                try {
                    listener.callback(data);
                } catch (error) {
                    logger.error(`Listener error for ${event}: ${error.message}`);
                }
            });
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }

        if (this.detectionProcess && !this.detectionProcess.killed) {
            try {
                this.detectionProcess.kill();
            } catch (error) {
                logger.warn(`Cleanup kill error: ${error.message}`);
            }
        }

        this.detectionProcess = null;
        this.currentState = null;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Restart detection process
     */
    async restart(driverId = 'DRIVER_001') {
        await this.stop();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return await this.start(driverId);
    }

    /**
     * Check if detection is running
     */
    isDetectionRunning() {
        return this.isRunning && this.detectionProcess && !this.detectionProcess.killed;
    }
}

// Singleton instance
const detectionManager = new DetectionManager();

module.exports = detectionManager;
