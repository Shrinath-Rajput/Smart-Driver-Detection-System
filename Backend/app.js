/**
 * Smart Driver Drowsiness Detection System
 * Production-Ready Backend Application
 * 
 * Entry point for Express.js server with comprehensive middleware,
 * error handling, and route configuration.
 */

const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const config = require("./config/config");
const db = require("./db/setup");
const logging = require("./utils/logging");
const detectionManager = require("./services/detection-manager");

const logger = logging.getLogger('App');

// Import API Routes
const apiRoutes = require("./routes/api");
const alertRoutes = require("./routes/alerts");
const dashboardRoutes = require("./routes/dashboard");
const gpsRoutes = require("./routes/gps");
const smsRoutes = require("./routes/sms");
const detectionRoutes = require("./routes/detection");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: config.APP.CORS_ORIGIN,
        methods: ["GET", "POST"]
    }
});

// Make io globally available
global.io = io;

// ========== GLOBAL MIDDLEWARE ==========

// CORS Configuration
app.use(cors({
    origin: config.APP.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Request Body Parser
app.use(express.json({ limit: config.APP.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({
    limit: config.APP.MAX_REQUEST_SIZE,
    extended: true
}));

// Request Logging Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} | ${req.method} ${req.path} | ${res.statusCode} | ${duration}ms`);
    });
    next();
});

// ========== VIEW ENGINE SETUP ==========
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

// ========== STATIC FILES ==========
app.use(express.static(path.join(__dirname, "public")));
app.use("/static", express.static(path.join(__dirname, "public")));

// ========== HEALTH CHECK ==========
app.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "operational",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
    });
});

app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        status: "operational",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// ========== API ROUTES (v1) ==========

// Core API Routes
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/gps", gpsRoutes);
app.use("/api/v1/sms", smsRoutes);
app.use("/api/v1/detection", detectionRoutes);

// Legacy Routes (backward compatibility)
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/gps", gpsRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/detection", detectionRoutes);

// ========== FRONTEND ROUTES ==========

/**
 * Home Page - Landing Page
 */
app.get("/", (req, res) => {
    try {
        res.render("home", {
            title: "Driver Drowsiness Detection",
        });
    } catch (error) {
        console.error("Error rendering home:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * Dashboard Page - Real-time Monitoring
 */
app.get("/dashboard", async (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";

        // Fetch driver status
        const [driverStatus] = await db.query(
            "SELECT * FROM driver_status WHERE driver_id = ?",
            [driverId]
        );

        // Fetch recent alerts
        const [recentAlerts] = await db.query(
            "SELECT * FROM alert_history WHERE driver_id = ? ORDER BY alert_time DESC LIMIT 10",
            [driverId]
        );

        // Fetch alert statistics
        const [alertStats] = await db.query(
            "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'SLEEPY' THEN 1 ELSE 0 END) as drowsiness_count FROM alert_history WHERE driver_id = ? AND alert_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
            [driverId]
        );

        if (driverStatus.length === 0) {
            return res.render("dashboard", {
                status: "OFFLINE",
                confidence: 0,
                driverId: driverId,
                latitude: null,
                longitude: null,
                lastUpdated: null,
                recentAlerts: [],
                alertStats: { total: 0, drowsiness_count: 0 },
                confidencePercentage: "0.00"
            });
        }

        const driver = driverStatus[0];
        const mapsLink = driver.latitude && driver.longitude
            ? `https://maps.google.com/?q=${driver.latitude},${driver.longitude}`
            : null;

        res.render("dashboard", {
            status: driver.status || "AWAKE",
            confidence: driver.confidence || 0,
            confidencePercentage: ((driver.confidence || 0) * 100).toFixed(2),
            driverId: driverId,
            latitude: driver.latitude,
            longitude: driver.longitude,
            mapsLink: mapsLink,
            lastUpdated: driver.last_updated,
            recentAlerts: recentAlerts,
            alertStats: alertStats[0] || { total: 0, drowsiness_count: 0 },
        });
    } catch (error) {
        console.error("Error rendering dashboard:", error);
        res.render("dashboard", {
            status: "ERROR",
            confidence: 0,
            confidencePercentage: "0.00",
            driverId: driverId || "DRIVER_001",
            latitude: null,
            longitude: null,
            lastUpdated: null,
            error: error.message,
            recentAlerts: [],
            alertStats: { total: 0, drowsiness_count: 0 },
        });
    }
});

/**
 * Analyze/Detection Page - Live Monitoring
 */
app.get("/analyze", (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";
        res.render("analyze", {
            driverId: driverId,
        });
    } catch (error) {
        console.error("Error rendering analyze page:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * Alert History Page
 */
app.get("/alerts", async (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        // Fetch alerts with pagination
        const [alerts] = await db.query(
            "SELECT * FROM alert_history WHERE driver_id = ? ORDER BY alert_time DESC LIMIT ? OFFSET ?",
            [driverId, limit, offset]
        );

        // Fetch total count
        const [countResult] = await db.query(
            "SELECT COUNT(*) as count FROM alert_history WHERE driver_id = ?",
            [driverId]
        );

        const totalAlerts = countResult[0].count;
        const totalPages = Math.ceil(totalAlerts / limit);

        res.render("alerts", {
            alerts: alerts,
            currentPage: page,
            totalPages: totalPages,
            totalAlerts: totalAlerts,
            driverId: driverId,
        });
    } catch (error) {
        console.error("Error rendering alerts page:", error);
        res.render("alerts", {
            alerts: [],
            currentPage: 1,
            totalPages: 1,
            totalAlerts: 0,
            driverId: driverId || "DRIVER_001",
            error: error.message,
        });
    }
});

/**
 * About Page
 */
app.get("/about", (req, res) => {
    try {
        res.render("about", {
            title: "About - Driver Drowsiness Detection",
        });
    } catch (error) {
        console.error("Error rendering about page:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * Location Page
 */
app.get("/location", async (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";

        const [location] = await db.query(
            "SELECT latitude, longitude, last_updated FROM driver_status WHERE driver_id = ?",
            [driverId]
        );

        if (location.length === 0) {
            return res.render("location", {
                latitude: null,
                longitude: null,
                mapsLink: null,
                lastUpdated: null,
            });
        }

        const { latitude, longitude, last_updated } = location[0];
        const mapsLink = latitude && longitude
            ? `https://maps.google.com/?q=${latitude},${longitude}`
            : null;

        res.render("location", {
            latitude: latitude,
            longitude: longitude,
            mapsLink: mapsLink,
            lastUpdated: last_updated,
        });
    } catch (error) {
        console.error("Error rendering location page:", error);
        res.render("location", {
            latitude: null,
            longitude: null,
            mapsLink: null,
            error: error.message,
        });
    }
});

// ========== WEBSOCKET SETUP ==========

io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });

    // Listen for detection start request
    socket.on("detection:start", async (data) => {
        logger.info("Detection start requested via WebSocket");
        const result = await detectionManager.start(data.driverId || "DRIVER_001");
        socket.emit("detection:started", result);
    });

    // Listen for detection stop request
    socket.on("detection:stop", async () => {
        logger.info("Detection stop requested via WebSocket");
        const result = await detectionManager.stop();
        socket.emit("detection:stopped", result);
    });
});

// ========== DETECTION MANAGER LISTENERS ==========

// Listen for detection events and emit to all connected clients
detectionManager.on("started", (data) => {
    logger.info(`Detection session started: ${data.sessionId}`);
    io.emit("detection:session-started", data);
});

detectionManager.on("stopped", (data) => {
    logger.info(`Detection session stopped: ${data.sessionId}`);
    io.emit("detection:session-stopped", data);
});

detectionManager.on("status", (status) => {
    // Emit status updates to all connected clients
    io.emit("detection:status-update", status);
});

detectionManager.on("alert", (alert) => {
    logger.warn(`Detection alert: ${alert.type}`);
    io.emit("detection:alert", alert);
});

detectionManager.on("error", (error) => {
    logger.error(`Detection error: ${error.message}`);
    io.emit("detection:error", error);
});

detectionManager.on("crashed", (data) => {
    logger.error(`Detection process crashed: ${data.code}`);
    io.emit("detection:crashed", data);
});

// ========== 404 NOT FOUND ==========
app.use((req, res) => {
    console.warn(`404 - Not Found: ${req.method} ${req.path}`);
    
    // Check if it's an API request
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({
            success: false,
            message: "API endpoint not found",
            path: req.path,
            method: req.method,
        });
    }

    res.status(404).render("error", {
        title: "404 - Page Not Found",
        message: "The page you're looking for doesn't exist",
        statusCode: 404,
    });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
    console.error("Error:", err);

    const statusCode = err.status || 500;
    const isDevelopment = config.NODE_ENV === "development";

    // API error response
    if (req.path.startsWith("/api/")) {
        return res.status(statusCode).json({
            success: false,
            message: err.message || "Internal server error",
            ...(isDevelopment && { stack: err.stack }),
        });
    }

    // Page error response
    res.status(statusCode).render("error", {
        title: `Error ${statusCode}`,
        message: isDevelopment ? err.message : "An error occurred",
        statusCode: statusCode,
    });
});

// ========== SERVER STARTUP ==========
const PORT = config.PORT;

async function startServer() {
    try {
        // Initialize database connection and schema
        await db.initializeDatabase();
        logger.info("Database initialized successfully");

        // Start listening on HTTP server instead of app
        server.listen(PORT, () => {
            console.log("\n" + "=".repeat(60));
            console.log("🚀 DRIVER DROWSINESS DETECTION SYSTEM");
            console.log("=".repeat(60));
            console.log(`✓ Server running on port: ${PORT}`);
            console.log(`✓ Environment: ${config.NODE_ENV}`);
            console.log(`✓ Database: ${config.DB.DATABASE}`);
            console.log(`✓ WebSocket enabled`);
            console.log(`✓ AI Detection engine ready`);
            console.log("\n📍 Access URLs:");
            console.log(`   Home:      http://localhost:${PORT}`);
            console.log(`   Dashboard: http://localhost:${PORT}/dashboard?driver_id=DRIVER_001`);
            console.log(`   Analyze:   http://localhost:${PORT}/analyze?driver_id=DRIVER_001`);
            console.log(`   Alerts:    http://localhost:${PORT}/alerts?driver_id=DRIVER_001`);
            console.log(`   About:     http://localhost:${PORT}/about`);
            console.log(`   Health:    http://localhost:${PORT}/health`);
            console.log("\n" + "=".repeat(60) + "\n");
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully...");
    
    try {
        // Stop detection if running
        if (detectionManager.isDetectionRunning()) {
            await detectionManager.stop();
        }
        
        // Close server
        server.close(() => {
            logger.info("Server closed");
            process.exit(0);
        });
        
        // Force exit after 10 seconds
        setTimeout(() => {
            logger.error("Forced shutdown after 10 seconds");
            process.exit(1);
        }, 10000);
    } catch (error) {
        logger.error(`Shutdown error: ${error.message}`);
        process.exit(1);
    }
});

process.on("SIGINT", async () => {
    logger.info("SIGINT received, shutting down gracefully...");
    
    try {
        // Stop detection if running
        if (detectionManager.isDetectionRunning()) {
            await detectionManager.stop();
        }
        
        // Close server
        server.close(() => {
            logger.info("Server closed");
            process.exit(0);
        });
        
        // Force exit after 10 seconds
        setTimeout(() => {
            logger.error("Forced shutdown after 10 seconds");
            process.exit(1);
        }, 10000);
    } catch (error) {
        logger.error(`Shutdown error: ${error.message}`);
        process.exit(1);
    }
});

// Start the server
startServer();

module.exports = app;