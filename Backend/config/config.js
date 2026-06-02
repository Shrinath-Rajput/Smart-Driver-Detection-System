require("dotenv").config();

module.exports = {
    // ========== SERVER CONFIGURATION ==========
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    API_TIMEOUT: 30000,
    REQUEST_LIMIT: "50mb",

    // ========== DATABASE CONFIGURATION ==========
    DB: {
        HOST: process.env.DB_HOST || "localhost",
        USER: process.env.DB_USER || "root",
        PASSWORD: process.env.DB_PASSWORD || "",
        DATABASE: process.env.DB_NAME || "drowsiness_detection",
        POOL_SIZE: 10,
        WAIT_FOR_CONNECTIONS: true,
        QUEUE_LIMIT: 0,
        ENABLE_KEEP_ALIVE: true,
    },

    // ========== SMS CONFIGURATION (TWILIO) ==========
    SMS: {
        ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
        AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
        FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || "",
        ENABLED: !!process.env.TWILIO_ACCOUNT_SID,
    },

    // ========== GOOGLE MAPS API ==========
    GOOGLE_MAPS: {
        API_KEY: process.env.GOOGLE_MAPS_API_KEY || "",
    },

    // ========== DETECTION SETTINGS ==========
    DETECTION: {
        ALARM_THRESHOLD: parseInt(process.env.ALARM_THRESHOLD) || 5,
        CONFIDENCE_THRESHOLD: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.6,
        SLEEP_CHECK_INTERVAL: parseInt(process.env.SLEEP_CHECK_INTERVAL) || 1000,
        EMERGENCY_COOLDOWN: 300000, // 5 minutes
        ALERT_RETRY_INTERVAL: 30000, // 30 seconds
    },

    // ========== PYTHON BACKEND ==========
    PYTHON_BACKEND: {
        URL: process.env.PYTHON_BACKEND_URL || "http://localhost:5001",
        TIMEOUT: 15000,
    },

    // ========== APPLICATION SETTINGS ==========
    APP: {
        SECURE_COOKIES: process.env.NODE_ENV === "production",
        CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
        MAX_REQUEST_SIZE: "10mb",
    },

    // ========== LOGGING ==========
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || "info",
        FORMAT: "json",
    },

    // ========== DRIVER DEFAULT SETTINGS ==========
    DRIVER_DEFAULTS: {
        ALARM_THRESHOLD: 5,
        SMS_ENABLED: true,
        ALERT_ENABLED: true,
        CONFIDENCE_THRESHOLD: 0.6,
    },
};
