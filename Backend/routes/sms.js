const express = require("express");
const router = express.Router();
const SMSAlert = require("../models/SMSAlert");

// POST: Add owner contact
router.post("/contact/add", async (req, res) => {
    try {
        const { driver_id, owner_name, phone_number, email } = req.body;

        if (!driver_id || !owner_name || !phone_number) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        await SMSAlert.addContact(driver_id, owner_name, phone_number, email);

        res.json({
            success: true,
            message: "Contact added successfully",
        });
    } catch (error) {
        console.error("Error adding contact:", error);
        res.status(500).json({
            success: false,
            message: "Error adding contact",
        });
    }
});

// GET: Get contacts for driver
router.get("/contacts/:driver_id", async (req, res) => {
    try {
        const { driver_id } = req.params;
        const contacts = await SMSAlert.getContacts(driver_id);

        res.json({
            success: true,
            data: contacts,
            count: contacts.length,
        });
    } catch (error) {
        console.error("Error getting contacts:", error);
        res.status(500).json({
            success: false,
            message: "Error retrieving contacts",
        });
    }
});

// POST: Send test SMS
router.post("/test", async (req, res) => {
    try {
        const { driver_id, phone_number } = req.body;

        if (!driver_id || !phone_number) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        const testData = {
            latitude: 18.5204,
            longitude: 73.8567,
            status: "SLEEPY",
            confidence: 0.95,
            timestamp: new Date(),
        };

        const result = await SMSAlert.sendAlert(driver_id, testData, phone_number);

        res.json({
            success: result.success,
            message: result.success ? "Test SMS sent" : "Failed to send test SMS",
            result,
        });
    } catch (error) {
        console.error("Error sending test SMS:", error);
        res.status(500).json({
            success: false,
            message: "Error sending test SMS",
        });
    }
});

// POST: Send alert SMS (called from Python detection service)
router.post("/alert", async (req, res) => {
    try {
        const { driverId, status, confidence, latitude, longitude, timestamp } = req.body;

        if (!driverId || !status) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: driverId, status",
            });
        }

        // Get driver's contact information
        const contacts = await SMSAlert.getContacts(driverId);
        
        if (!contacts || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No contact information found for driver",
            });
        }

        // Send SMS to the first contact
        const contact = contacts[0];
        const alertData = {
            latitude: latitude || 0,
            longitude: longitude || 0,
            status: status,
            confidence: confidence || 0,
            timestamp: timestamp || new Date(),
        };

        const result = await SMSAlert.sendAlert(driverId, alertData, contact.phone_number);

        res.json({
            success: result.success,
            message: result.success ? "Alert SMS sent successfully" : "Failed to send alert SMS",
            contact: contact.owner_name,
            phone: contact.phone_number,
            result,
        });

    } catch (error) {
        console.error("Error sending alert SMS:", error);
        res.status(500).json({
            success: false,
            message: "Error sending alert SMS",
            error: error.message,
        });
    }
});

module.exports = router;
