const express = require("express");
const router = express.Router();
const AlertModel = require("../models/Alert");
const DriverModel = require("../models/Driver");
const config = require("../config/config");

// POST: Receive drowsiness alert from Python backend
router.post("/", async (req, res) => {
    try {
        const {
            driver_id,
            status,
            confidence,
            latitude,
            longitude,
            alarm_triggered,
        } = req.body;

        if (!driver_id || !status) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: driver_id, status",
            });
        }

        // Update driver status
        await DriverModel.updateStatus(driver_id, {
            status,
            confidence,
            latitude,
            longitude,
        });

        // Generate Google Maps link
        const mapsLink = latitude && longitude
            ? `https://maps.google.com/?q=${latitude},${longitude}`
            : null;

        // Create alert if drowsiness detected
        let alertId = null;
        if (alarm_triggered && status === "SLEEPY") {
            alertId = await AlertModel.create({
                driverId: driver_id,
                alertType: "DROWSINESS",
                status,
                confidence,
                latitude,
                longitude,
                mapsLink,
            });

            // Emit real-time event for dashboard (WebSocket can be added later)
            // For now, alert is stored in DB
            console.log(`[ALERT] Drowsiness detected for driver: ${driver_id}`);
        }

        res.json({
            success: true,
            message: "Alert received and processed",
            alert_id: alertId,
            driver_status: status,
        });
    } catch (error) {
        console.error("Error in POST /alerts:", error);
        res.status(500).json({
            success: false,
            message: "Error processing alert",
            error: error.message,
        });
    }
});

// GET: Get current driver status
router.get("/status/:driver_id", async (req, res) => {
    try {
        const { driver_id } = req.params;
        const driverStatus = await DriverModel.getStatus(driver_id);

        if (!driverStatus) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        res.json({
            success: true,
            data: driverStatus,
        });
    } catch (error) {
        console.error("Error getting driver status:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving driver status",
        });
    }
});

// GET: Get alert history
router.get("/history/:driver_id", async (req, res) => {
    try {
        const { driver_id } = req.params;
        const limit = req.query.limit || 50;

        const history = await AlertModel.getHistory(driver_id, limit);

        res.json({
            success: true,
            data: history,
            count: history.length,
        });
    } catch (error) {
        console.error("Error getting alert history:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving alert history",
        });
    }
});

// GET: Get recent alerts (last 24 hours)
router.get("/recent/:driver_id", async (req, res) => {
    try {
        const { driver_id } = req.params;
        const recentAlerts = await AlertModel.getRecentAlerts(driver_id);

        res.json({
            success: true,
            data: recentAlerts,
            count: recentAlerts.length,
        });
    } catch (error) {
        console.error("Error getting recent alerts:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving recent alerts",
        });
    }
});

// GET: Get statistics
router.get("/stats/:driver_id", async (req, res) => {
    try {
        const { driver_id } = req.params;
        const hours = req.query.hours || 24;

        const stats = await AlertModel.getStats(driver_id, hours);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error("Error getting statistics:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving statistics",
        });
    }
});

module.exports = router;
