const db = require("../db/setup");

class AlertModel {
    // Create alert
    static async create(alertData) {
        try {
            const {
                driverId,
                alertType,
                status,
                confidence,
                latitude,
                longitude,
                mapsLink,
            } = alertData;

            const [result] = await db.query(
                `INSERT INTO alert_history 
                 (driver_id, alert_type, status, confidence, latitude, longitude, maps_link)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [driverId, alertType, status, confidence, latitude, longitude, mapsLink]
            );

            return result.insertId;
        } catch (error) {
            console.error("Error creating alert:", error);
            throw error;
        }
    }

    // Get alert history for driver
    static async getHistory(driverId, limit = 50) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM alert_history 
                 WHERE driver_id = ? 
                 ORDER BY alert_time DESC 
                 LIMIT ?`,
                [driverId, limit]
            );
            return rows;
        } catch (error) {
            console.error("Error getting alert history:", error);
            throw error;
        }
    }

    // Get recent alerts (last 24 hours)
    static async getRecentAlerts(driverId) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM alert_history 
                 WHERE driver_id = ? AND alert_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                 ORDER BY alert_time DESC`,
                [driverId]
            );
            return rows;
        } catch (error) {
            console.error("Error getting recent alerts:", error);
            throw error;
        }
    }

    // Mark SMS as sent
    static async markSmsSent(alertId) {
        try {
            await db.query(
                "UPDATE alert_history SET sms_sent = TRUE, sms_sent_at = NOW() WHERE id = ?",
                [alertId]
            );
            return { success: true };
        } catch (error) {
            console.error("Error marking SMS sent:", error);
            throw error;
        }
    }

    // Get statistics
    static async getStats(driverId, hours = 24) {
        try {
            const [stats] = await db.query(
                `SELECT 
                    COUNT(*) as total_alerts,
                    SUM(CASE WHEN status = 'SLEEPY' THEN 1 ELSE 0 END) as drowsiness_alerts,
                    AVG(confidence) as avg_confidence
                 FROM alert_history 
                 WHERE driver_id = ? AND alert_time >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
                [driverId, hours]
            );
            return stats[0];
        } catch (error) {
            console.error("Error getting statistics:", error);
            throw error;
        }
    }
}

module.exports = AlertModel;
