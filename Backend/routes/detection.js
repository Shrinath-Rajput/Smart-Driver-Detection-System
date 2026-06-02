/**
 * Detection Control Routes
 * Handles AI detection process control and real-time status updates
 */

const express = require("express");
const router = express.Router();
const db = require("../db/setup");
const detectionManager = require("../services/detection-manager");
const logging = require("../utils/logging");

const logger = logging.getLogger('DetectionRoutes');

// ========== WEBSOCKET SETUP (from app.js) ==========
// These routes will work with WebSocket events

// ========== DETECTION CONTROL ==========

/**
 * POST /api/v1/detection/start
 * Start AI detection process
 */
router.post("/start", async (req, res) => {
    try {
        const { driverId = "DRIVER_001" } = req.body;

        logger.info(`Starting detection for driver: ${driverId}`);

        const result = await detectionManager.start(driverId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            message: "Detection started successfully",
            sessionId: result.sessionId,
            driverId: result.driverId,
            pid: result.pid
        });

    } catch (error) {
        logger.error(`Error starting detection: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/v1/detection/stop
 * Stop AI detection process
 */
router.post("/stop", async (req, res) => {
    try {
        logger.info("Stopping detection");

        const result = await detectionManager.stop();

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);

    } catch (error) {
        logger.error(`Error stopping detection: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/v1/detection/status
 * Get current detection status
 */
router.get("/status", async (req, res) => {
    try {
        const status = await detectionManager.getStatus();

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        logger.error(`Error getting status: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/v1/detection/is-running
 * Check if detection is running
 */
router.get("/is-running", (req, res) => {
    const isRunning = detectionManager.isDetectionRunning();

    res.json({
        success: true,
        isRunning: isRunning,
        sessionId: detectionManager.sessionId
    });
});

/**
 * POST /api/v1/detection/update
 * Update detection data from Python state machine
 * Handles: AWAKE, SLEEPY, EMERGENCY, RECOVERY states
 */
router.post("/update", async (req, res) => {
    try {
        const state = req.body;
        
        const {
            driver_id,
            session_id,
            current_state,
            previous_state,
            confidence,
            eyes_closed_duration,
            face_detected,
            eyes_detected,
            latitude,
            longitude,
            maps_url,
            location_timestamp,
            alarm_active,
            sms_sent,
            whatsapp_sent,
            alert_count,
            last_alert_time,
            emergency_triggered_time,
            last_update
        } = state;

        if (!driver_id) {
            return res.status(400).json({
                success: false,
                message: "Missing driver_id"
            });
        }

        logger.info(`📥 Detection Update - Driver: ${driver_id}, State: ${current_state}`);

        // ========== UPDATE DRIVER STATUS ==========
        await db.query(
            `UPDATE driver_status 
            SET status = ?, confidence = ?, latitude = ?, longitude = ?, 
                alarm_active = ?, is_active = TRUE, last_updated = CURRENT_TIMESTAMP 
            WHERE driver_id = ?`,
            [current_state, confidence, latitude, longitude, alarm_active, driver_id]
        );

        // ========== HANDLE STATE TRANSITIONS ==========

        // STATE: SLEEPY (Eyes closed 2+ seconds)
        if (current_state === 'SLEEPY' && previous_state !== 'SLEEPY' && previous_state !== 'EMERGENCY') {
            logger.warn(`⚠️  SLEEPY: Driver ${driver_id} - Eyes closed for ${eyes_closed_duration.toFixed(1)}s`);
            
            // Save SLEEPY alert
            await db.query(
                `INSERT INTO alert_history 
                (driver_id, alert_type, status, confidence, latitude, longitude, maps_link, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [driver_id, 'DROWSINESS_DETECTED', 'SLEEPY', confidence, latitude, longitude, maps_url, last_update]
            );
        }

        // STATE: EMERGENCY (Eyes closed 10+ seconds)
        if (current_state === 'EMERGENCY' && previous_state !== 'EMERGENCY') {
            logger.error(`🚨 EMERGENCY: Driver ${driver_id} - ALARM ACTIVATED`);
            logger.error(`   Location: ${latitude}, ${longitude}`);
            logger.error(`   Maps: ${maps_url}`);
            
            // Save EMERGENCY alert with full details
            const [alertResult] = await db.query(
                `INSERT INTO alert_history 
                (driver_id, alert_type, status, confidence, latitude, longitude, maps_link, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [driver_id, 'DROWSINESS_CRITICAL', 'EMERGENCY', confidence, latitude, longitude, maps_url, emergency_triggered_time]
            );

            logger.info(`✓ Alert saved to database with ID: ${alertResult.insertId}`);

            // Send SMS alert (queued by Python service)
            if (sms_sent) {
                logger.info(`📱 SMS alert queued for delivery`);
            }

            // Send WhatsApp alert (queued by Python service)
            if (whatsapp_sent) {
                logger.info(`💬 WhatsApp alert queued for delivery`);
            }
        }

        // STATE: RECOVERY (Eyes opened after SLEEPY/EMERGENCY)
        if (current_state === 'RECOVERY' || (current_state === 'AWAKE' && alarm_active === false && (previous_state === 'SLEEPY' || previous_state === 'EMERGENCY')) ){
            logger.info(`✓ RECOVERY: Driver ${driver_id} - Eyes opened, alarm stopped`);
            
            // Update the last alert's recovery timestamp
            await db.query(
                `UPDATE alert_history 
                SET recovered_at = CURRENT_TIMESTAMP, recovery_notes = 'Driver recovered by opening eyes'
                WHERE driver_id = ? AND status = 'EMERGENCY' AND recovered_at IS NULL
                LIMIT 1`,
                [driver_id]
            );
        }

        // ========== EMIT WEBSOCKET EVENT ==========
        if (global.io) {
            global.io.emit('detection:update', {
                driver_id,
                current_state,
                previous_state,
                confidence,
                eyes_closed_duration,
                alarm_active,
                alert_count,
                latitude,
                longitude,
                maps_url,
                timestamp: last_update
            });

            // Also update dashboard in real-time
            global.io.to('dashboard').emit('dashboard:update', {
                driver_id,
                state: current_state,
                confidence: (confidence * 100).toFixed(2),
                alarm_active,
                latitude,
                longitude,
                maps_url,
                alert_count,
                last_update
            });
        }

        res.json({
            success: true,
            message: "Detection state updated successfully",
            state: current_state,
            alert_count: alert_count
        });

    } catch (error) {
        logger.error(`Error updating detection: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Failed to update detection state",
            error: error.message
        });
    }
});

/**
 * GET /api/v1/detection/history
 * Get detection history for a driver
 */
router.get("/history", async (req, res) => {
    try {
        const { driverId = "DRIVER_001", limit = 100 } = req.query;

        const [history] = await db.query(
            `SELECT * FROM alerts 
            WHERE driver_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?`,
            [driverId, parseInt(limit)]
        );

        res.json({
            success: true,
            driverId,
            count: history.length,
            data: history
        });

    } catch (error) {
        logger.error(`Error fetching history: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/v1/detection/restart
 * Restart detection process
 */
router.post("/restart", async (req, res) => {
    try {
        const { driverId = "DRIVER_001" } = req.body;

        logger.info(`Restarting detection for driver: ${driverId}`);

        const result = await detectionManager.restart(driverId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);

    } catch (error) {
        logger.error(`Error restarting detection: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== DETECTION CONFIGURATION ==========

/**
 * GET /api/v1/detection/config
 * Get detection configuration
 */
router.get("/config", async (req, res) => {
    try {
        const config = {
            alarmThreshold: process.env.ALARM_THRESHOLD || 15,
            confidenceThreshold: process.env.CONFIDENCE_THRESHOLD || 0.5,
            frameCheckInterval: process.env.FRAME_CHECK_INTERVAL || 100,
            cameraIndex: process.env.CAMERA_INDEX || 0,
            backendUrl: process.env.BACKEND_URL || "http://localhost:5000",
            sendSms: process.env.SEND_SMS === 'true'
        };

        res.json({
            success: true,
            data: config
        });

    } catch (error) {
        logger.error(`Error getting config: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
