const express = require("express");
const router = express.Router();
const db = require("../db/setup");

// POST: Update GPS location
router.post("/update", async (req, res) => {
    try {
        const { driver_id, latitude, longitude, accuracy, timestamp } = req.body;

        if (!driver_id || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Update driver location
        await db.query(
            `UPDATE driver_status 
             SET latitude = ?, longitude = ? 
             WHERE driver_id = ?`,
            [latitude, longitude, driver_id]
        );

        // Generate Google Maps link
        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

        res.json({
            success: true,
            message: "GPS location updated",
            mapsLink: mapsLink,
        });
    } catch (error) {
        console.error("Error updating GPS location:", error);
        res.status(500).json({
            success: false,
            message: "Error updating location",
        });
    }
});

// GET: Get driver's last known location
router.get("/location/:driver_id", async (req, res) => {
    try {
        const { driver_id } = req.params;

        const [location] = await db.query(
            "SELECT latitude, longitude, last_updated FROM driver_status WHERE driver_id = ?",
            [driver_id]
        );

        if (location.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Location not found",
            });
        }

        const { latitude, longitude, last_updated } = location[0];

        res.json({
            success: true,
            data: {
                latitude,
                longitude,
                last_updated,
                mapsLink:
                    latitude && longitude
                        ? `https://maps.google.com/?q=${latitude},${longitude}`
                        : null,
            },
        });
    } catch (error) {
        console.error("Error getting location:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving location",
        });
    }
});

module.exports = router;
