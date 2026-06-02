/**
 * Logging Utility
 * Centralized logging for all modules
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

class Logger {
    constructor(name) {
        this.name = name;
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${this.name}] [${level}] ${message}`;

        // Console output
        const colors = {
            INFO: '\x1b[36m',    // Cyan
            WARN: '\x1b[33m',    // Yellow
            ERROR: '\x1b[31m',   // Red
            DEBUG: '\x1b[35m',   // Magenta
            RESET: '\x1b[0m'
        };

        const color = colors[level] || '';
        console.log(`${color}${logMessage}${colors.RESET}`);

        // File output
        try {
            fs.appendFileSync(LOG_FILE, logMessage + '\n');
        } catch (error) {
            console.error(`Failed to write to log file: ${error.message}`);
        }
    }

    info(message) {
        this.log('INFO', message);
    }

    warn(message) {
        this.log('WARN', message);
    }

    error(message) {
        this.log('ERROR', message);
    }

    debug(message) {
        this.log('DEBUG', message);
    }
}

function getLogger(name) {
    return new Logger(name);
}

module.exports = {
    getLogger,
    Logger
};
