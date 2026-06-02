const express = require("express");
const router = express.Router();
const db = require("../db/setup");

// GET: Dashboard data for a driver
router.get("/:driver_id", async (req, res) => {
    try {
        const { driver_id } = req.params;

        // Get current driver status
        const [driverStatus] = await db.query(
            "SELECT * FROM driver_status WHERE driver_id = ?",
            [driver_id]
        );

        if (driverStatus.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Driver not found",
            });
        }

        const driver = driverStatus[0];

        // Get recent alerts (last 5)
        const [recentAlerts] = await db.query(
            `SELECT * FROM alert_history 
             WHERE driver_id = ? 
             ORDER BY created_at DESC 
             LIMIT 5`,
            [driver_id]
        );

        // Get statistics
        const [stats] = await db.query(
            `SELECT 
                COUNT(*) as total_alerts,
                SUM(CASE WHEN alert_type = 'DROWSINESS' THEN 1 ELSE 0 END) as drowsiness_alerts,
                AVG(confidence) as avg_confidence,
                MAX(created_at) as last_alert
             FROM alert_history 
             WHERE driver_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [driver_id]
        );

        res.json({
            success: true,
            data: {
                driver: driver,
                recentAlerts: recentAlerts,
                stats: stats[0],
            },
        });
    } catch (error) {
        console.error("Error getting dashboard data:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving dashboard data",
        });
    }
});

// GET: All active drivers (for admin dashboard)
router.get("/", async (req, res) => {
    try {
        const [drivers] = await db.query(
            "SELECT * FROM driver_status WHERE is_active = TRUE"
        );

        res.json({
            success: true,
            data: drivers,
            count: drivers.length,
        });
    } catch (error) {
        console.error("Error getting all drivers:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving drivers",
        });
    }
});

module.exports = router;
