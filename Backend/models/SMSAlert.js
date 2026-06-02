const twilio = require("twilio");
const config = require("../config/config");
const db = require("../db/setup");

// Initialize Twilio client (only if valid credentials are provided)
let twilioClient = null;
try {
    if (
        config.SMS.ACCOUNT_SID &&
        config.SMS.AUTH_TOKEN &&
        config.SMS.ACCOUNT_SID.toString().trim() !== "" &&
        config.SMS.AUTH_TOKEN.toString().trim() !== ""
    ) {
        twilioClient = twilio(config.SMS.ACCOUNT_SID, config.SMS.AUTH_TOKEN);
        console.log("✓ Twilio SMS service initialized");
    } else {
        console.log("⚠️  Twilio credentials not configured. SMS feature will be disabled.");
    }
} catch (error) {
    console.warn("⚠️  Failed to initialize Twilio:", error.message);
    twilioClient = null;
}

class SMSAlert {
    /**
     * Send SMS alert to vehicle owner
     * @param {string} driverId - Driver ID
     * @param {object} alertData - Alert data with location and details
     * @param {string} ownerPhone - Owner's phone number
     */
    static async sendAlert(driverId, alertData, ownerPhone) {
        try {
            if (!twilioClient) {
                console.warn("⚠️  Twilio not configured. SMS feature disabled.");
                return { success: false, reason: "Twilio not configured" };
            }

            const { latitude, longitude, status, confidence, timestamp } = alertData;
            const mapsLink = latitude && longitude
                ? `https://maps.google.com/?q=${latitude},${longitude}`
                : "Location unavailable";

            const message = `
🚨 DROWSINESS ALERT 🚨

Driver: ${driverId}
Status: ${status.toUpperCase()}
Confidence: ${(confidence * 100).toFixed(2)}%
Time: ${new Date(timestamp).toLocaleString()}

📍 Location: ${mapsLink}

Please check on the driver immediately!
            `.trim();

            // Send SMS
            const result = await twilioClient.messages.create({
                body: message,
                from: config.SMS.FROM_NUMBER,
                to: ownerPhone,
            });

            console.log(`✓ SMS sent to ${ownerPhone} (MessageSID: ${result.sid})`);

            return {
                success: true,
                messageSid: result.sid,
            };
        } catch (error) {
            console.error("Error sending SMS:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send alert to all monitoring contacts
     */
    static async sendAlertToAllContacts(driverId, alertData, alertId) {
        try {
            // Get owner contacts for this driver
            const [contacts] = await db.query(
                "SELECT * FROM owner_contacts WHERE driver_id = ?",
                [driverId]
            );

            if (contacts.length === 0) {
                console.log(`No contacts configured for driver: ${driverId}`);
                return { success: false, reason: "No contacts" };
            }

            const results = [];

            for (const contact of contacts) {
                const result = await this.sendAlert(
                    driverId,
                    alertData,
                    contact.phone_number
                );

                results.push({
                    contact: contact.phone_number,
                    ...result,
                });

                // Mark alert SMS as sent in database
                if (result.success && alertId) {
                    await db.query(
                        "UPDATE alert_history SET sms_sent = TRUE, sms_sent_at = NOW() WHERE id = ?",
                        [alertId]
                    );
                }
            }

            return { success: true, results };
        } catch (error) {
            console.error("Error sending alerts to contacts:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add owner contact
     */
    static async addContact(driverId, ownerName, phoneNumber, email = null) {
        try {
            await db.query(
                `INSERT INTO owner_contacts (driver_id, owner_name, phone_number, email)
                 VALUES (?, ?, ?, ?)`,
                [driverId, ownerName, phoneNumber, email]
            );

            return { success: true };
        } catch (error) {
            console.error("Error adding contact:", error);
            throw error;
        }
    }

    /**
     * Get owner contacts
     */
    static async getContacts(driverId) {
        try {
            const [contacts] = await db.query(
                "SELECT * FROM owner_contacts WHERE driver_id = ?",
                [driverId]
            );

            return contacts;
        } catch (error) {
            console.error("Error getting contacts:", error);
            throw error;
        }
    }
}

module.exports = SMSAlert;
