const db = require("../db/setup");

class DriverModel {
    // Get driver status
    static async getStatus(driverId) {
        try {
            const [rows] = await db.query(
                "SELECT * FROM driver_status WHERE driver_id = ?",
                [driverId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("Error getting driver status:", error);
            throw error;
        }
    }

    // Update or create driver status
    static async updateStatus(driverId, data) {
        try {
            const {
                status,
                confidence,
                latitude,
                longitude,
            } = data;

            const [existingDriver] = await db.query(
                "SELECT id FROM driver_status WHERE driver_id = ?",
                [driverId]
            );

            if (existingDriver.length > 0) {
                // Update existing
                await db.query(
                    `UPDATE driver_status 
                     SET status = ?, confidence = ?, latitude = ?, longitude = ?, last_updated = NOW()
                     WHERE driver_id = ?`,
                    [status, confidence, latitude, longitude, driverId]
                );
            } else {
                // Create new
                await db.query(
                    `INSERT INTO driver_status (driver_id, status, confidence, latitude, longitude)
                     VALUES (?, ?, ?, ?, ?)`,
                    [driverId, status, confidence, latitude, longitude]
                );
            }

            return { success: true };
        } catch (error) {
            console.error("Error updating driver status:", error);
            throw error;
        }
    }

    // Get all active drivers
    static async getAllActive() {
        try {
            const [rows] = await db.query(
                "SELECT * FROM driver_status WHERE is_active = TRUE"
            );
            return rows;
        } catch (error) {
            console.error("Error getting active drivers:", error);
            throw error;
        }
    }

    // Deactivate driver
    static async deactivate(driverId) {
        try {
            await db.query(
                "UPDATE driver_status SET is_active = FALSE WHERE driver_id = ?",
                [driverId]
            );
            return { success: true };
        } catch (error) {
            console.error("Error deactivating driver:", error);
            throw error;
        }
    }
}

module.exports = DriverModel;
