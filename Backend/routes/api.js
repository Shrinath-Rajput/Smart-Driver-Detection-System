/**
 * Core API Routes
 * Handles all RESTful API endpoints for drowsiness detection system
 */

const express = require("express");
const router = express.Router();
const db = require("../db/setup");
const config = require("../config/config");

// ========== DRIVER STATUS API ==========

/**
 * GET /api/v1/status
 * Get current driver status
 * Query params: driver_id (optional)
 */
router.get("/status", async (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";

        const [driverStatus] = await db.query(
            "SELECT * FROM driver_status WHERE driver_id = ?",
            [driverId]
        );

        if (driverStatus.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
                driverId: driverId,
            });
        }

        const driver = driverStatus[0];
        const mapsLink = driver.latitude && driver.longitude
            ? `https://maps.google.com/?q=${driver.latitude},${driver.longitude}`
            : null;

        res.json({
            success: true,
            data: {
                driverId: driver.driver_id,
                status: driver.status,
                confidence: driver.confidence,
                confidencePercentage: (driver.confidence * 100).toFixed(2),
                latitude: driver.latitude,
                longitude: driver.longitude,
                mapsLink: mapsLink,
                isActive: driver.is_active,
                lastUpdated: driver.last_updated,
            },
        });
    } catch (error) {
        console.error("Error fetching status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

/**
 * POST /api/v1/status
 * Update driver status (from Python detection system)
 */
router.post("/status", async (req, res) => {
    try {
        const { driverId, status, confidence, latitude, longitude } = req.body;

        if (!driverId || !status) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: driverId, status",
            });
        }

        // Check if driver exists
        const [existing] = await db.query(
            "SELECT id FROM driver_status WHERE driver_id = ?",
            [driverId]
        );

        let result;
        if (existing.length > 0) {
            // Update existing
            [result] = await db.query(
                "UPDATE driver_status SET status = ?, confidence = ?, latitude = ?, longitude = ?, is_active = TRUE, last_updated = CURRENT_TIMESTAMP WHERE driver_id = ?",
                [status, confidence || 0, latitude || null, longitude || null, driverId]
            );
        } else {
            // Insert new
            [result] = await db.query(
                "INSERT INTO driver_status (driver_id, status, confidence, latitude, longitude, is_active) VALUES (?, ?, ?, ?, ?, TRUE)",
                [driverId, status, confidence || 0, latitude || null, longitude || null]
            );
        }

        res.json({
            success: true,
            message: "Status updated successfully",
            data: { driverId, status, confidence },
        });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update status",
            error: error.message,
        });
    }
});

// ========== LOCATION API ==========

/**
 * GET /api/v1/location
 * Get driver's current location
 */
router.get("/location", async (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";

        const [location] = await db.query(
            "SELECT latitude, longitude, last_updated FROM driver_status WHERE driver_id = ?",
            [driverId]
        );

        if (location.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
                driverId: driverId,
            });
        }

        const { latitude, longitude, last_updated } = location[0];
        const mapsLink = latitude && longitude
            ? `https://maps.google.com/?q=${latitude},${longitude}`
            : null;

        res.json({
            success: true,
            data: {
                driverId: driverId,
                latitude: latitude,
                longitude: longitude,
                mapsLink: mapsLink,
                lastUpdated: last_updated,
                hasLocation: !!(latitude && longitude),
            },
        });
    } catch (error) {
        console.error("Error fetching location:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

/**
 * POST /api/v1/location
 * Update driver location
 */
router.post("/location", async (req, res) => {
    try {
        const { driverId, latitude, longitude } = req.body;

        if (!driverId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: driverId, latitude, longitude",
            });
        }

        // Update location
        await db.query(
            "UPDATE driver_status SET latitude = ?, longitude = ?, last_updated = CURRENT_TIMESTAMP WHERE driver_id = ?",
            [latitude, longitude, driverId]
        );

        res.json({
            success: true,
            message: "Location updated successfully",
            data: { driverId, latitude, longitude },
        });
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update location",
            error: error.message,
        });
    }
});

// ========== ALERTS API ==========

/**
 * GET /api/v1/alerts
 * Get all alerts for a driver with pagination
 */
router.get("/alerts", async (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const offset = (page - 1) * limit;
        const filterType = req.query.type || "all";
        const filterStatus = req.query.status || "all";

        // Build WHERE clause
        let whereClause = "WHERE driver_id = ?";
        const params = [driverId];

        if (filterType !== "all") {
            whereClause += " AND alert_type = ?";
            params.push(filterType);
        }

        if (filterStatus !== "all") {
            whereClause += " AND status = ?";
            params.push(filterStatus);
        }

        // Fetch alerts
        const [alerts] = await db.query(
            `SELECT * FROM alert_history ${whereClause} ORDER BY alert_time DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Fetch total count
        const countParams = filterType !== "all" ? [...params.slice(0, -1)] : [driverId];
        if (filterType !== "all") countParams.push(filterType);
        if (filterStatus !== "all") countParams.push(filterStatus);

        const [countResult] = await db.query(
            `SELECT COUNT(*) as count FROM alert_history ${whereClause}`,
            [...params.slice(0, -2)]
        );

        const totalAlerts = countResult[0].count;
        const totalPages = Math.ceil(totalAlerts / limit);

        res.json({
            success: true,
            data: {
                alerts: alerts,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalAlerts: totalAlerts,
                    limit: limit,
                    offset: offset,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch alerts",
            error: error.message,
        });
    }
});

/**
 * POST /api/v1/alert
 * Create a new alert
 */
router.post("/alert", async (req, res) => {
    try {
        const {
            driverId,
            alertType = "DROWSINESS",
            status,
            confidence,
            latitude,
            longitude,
            mapsLink,
        } = req.body;

        if (!driverId || !status) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: driverId, status",
            });
        }

        const [result] = await db.query(
            "INSERT INTO alert_history (driver_id, status, confidence, latitude, longitude, maps_link) VALUES (?, ?, ?, ?, ?, ?)",
            [driverId, status, confidence || 0, latitude || null, longitude || null, mapsLink || null]
        );

        res.status(201).json({
            success: true,
            message: "Alert created successfully",
            data: {
                alertId: result.insertId,
                driverId,
                alertType,
                status,
            },
        });
    } catch (error) {
        console.error("Error creating alert:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create alert",
            error: error.message,
        });
    }
});

/**
 * GET /api/v1/alerts/stats
 * Get alert statistics
 */
router.get("/alerts/stats", async (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";
        const hours = parseInt(req.query.hours) || 24;

        const [stats] = await db.query(
            "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'SLEEPY' THEN 1 ELSE 0 END) as drowsiness_count, SUM(CASE WHEN sms_sent = TRUE THEN 1 ELSE 0 END) as sms_sent FROM alert_history WHERE driver_id = ? AND alert_time >= DATE_SUB(NOW(), INTERVAL ? HOUR)",
            [driverId, hours]
        );

        const [hourlyStats] = await db.query(
            "SELECT HOUR(alert_time) as hour, COUNT(*) as count FROM alert_history WHERE driver_id = ? AND alert_time >= DATE_SUB(NOW(), INTERVAL ? HOUR) GROUP BY HOUR(alert_time) ORDER BY hour",
            [driverId, hours]
        );

        res.json({
            success: true,
            data: {
                totalAlerts: stats[0].total || 0,
                drowsinessAlerts: stats[0].drowsiness_count || 0,
                smsSent: stats[0].sms_sent || 0,
                hourlyData: hourlyStats,
                period: `Last ${hours} hours`,
            },
        });
    } catch (error) {
        console.error("Error fetching alert stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch alert statistics",
            error: error.message,
        });
    }
});

// ========== EMERGENCY API ==========

/**
 * POST /api/v1/emergency
 * Report emergency drowsiness situation
 */
router.post("/emergency", async (req, res) => {
    try {
        const { driverId, status, sleepDuration, latitude, longitude, confidence } = req.body;

        if (!driverId) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: driverId",
            });
        }

        const mapsLink = latitude && longitude
            ? `https://maps.google.com/?q=${latitude},${longitude}`
            : null;

        // Create emergency alert
        const [alertResult] = await db.query(
            "INSERT INTO alert_history (driver_id, status, confidence, latitude, longitude, maps_link) VALUES (?, ?, ?, ?, ?, ?)",
            [driverId, "EMERGENCY", confidence || 0.95, latitude || null, longitude || null, mapsLink]
        );

        // Update driver status
        await db.query(
            "UPDATE driver_status SET status = ?, confidence = ?, latitude = ?, longitude = ?, is_active = TRUE, last_updated = CURRENT_TIMESTAMP WHERE driver_id = ?",
            ["EMERGENCY", confidence || 0.95, latitude || null, longitude || null, driverId]
        );

        // TODO: Trigger SMS alert
        // TODO: Trigger audio alarm
        // TODO: Send email notification

        res.status(201).json({
            success: true,
            message: "Emergency alert reported successfully",
            data: {
                alertId: alertResult.insertId,
                driverId,
                status: "EMERGENCY",
                mapsLink: mapsLink,
                sleepDuration: sleepDuration,
            },
        });
    } catch (error) {
        console.error("Error reporting emergency:", error);
        res.status(500).json({
            success: false,
            message: "Failed to report emergency",
            error: error.message,
        });
    }
});

// ========== ANALYTICS API ==========

/**
 * GET /api/v1/analytics
 * Get comprehensive analytics and statistics
 */
router.get("/analytics", async (req, res) => {
    try {
        const driverId = req.query.driver_id || "DRIVER_001";

        // Total drowsiness events
        const [drowsinessEvents] = await db.query(
            "SELECT COUNT(*) as count FROM alert_history WHERE driver_id = ? AND status = 'SLEEPY'",
            [driverId]
        );

        // Today's events
        const [todayEvents] = await db.query(
            "SELECT COUNT(*) as count FROM alert_history WHERE driver_id = ? AND DATE(alert_time) = CURDATE()",
            [driverId]
        );

        // Weekly data
        const [weeklyData] = await db.query(
            "SELECT DATE(alert_time) as date, COUNT(*) as count FROM alert_history WHERE driver_id = ? AND alert_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(alert_time) ORDER BY date DESC",
            [driverId]
        );

        // Average confidence
        const [avgConfidence] = await db.query(
            "SELECT AVG(confidence) as avg_confidence, MAX(confidence) as max_confidence, MIN(confidence) as min_confidence FROM alert_history WHERE driver_id = ?",
            [driverId]
        );

        // Status distribution
        const [statusDistribution] = await db.query(
            "SELECT status, COUNT(*) as count FROM alert_history WHERE driver_id = ? GROUP BY status",
            [driverId]
        );

        res.json({
            success: true,
            data: {
                totalDrowsinessEvents: drowsinessEvents[0].count,
                todayEvents: todayEvents[0].count,
                averageConfidence: (avgConfidence[0].avg_confidence || 0).toFixed(2),
                maxConfidence: (avgConfidence[0].max_confidence || 0).toFixed(2),
                minConfidence: (avgConfidence[0].min_confidence || 0).toFixed(2),
                weeklyData: weeklyData,
                statusDistribution: statusDistribution,
            },
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics",
            error: error.message,
        });
    }
});

// ========== HEALTH CHECK ==========

/**
 * GET /api/v1/api/health
 * Check API health
 */
router.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "operational",
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
