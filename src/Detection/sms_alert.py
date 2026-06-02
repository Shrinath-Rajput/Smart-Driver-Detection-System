"""
SMS Alert Module
Sends SMS alerts to vehicle owner
"""

import json
import logging

try:
    import requests
except ImportError:
    print("⚠️  requests library not installed. Install with: pip install requests")
    requests = None

from src.Config.config import Config

logger = logging.getLogger(__name__)


class SMSAlertHandler:
    """Handles SMS alert sending through backend"""

    def __init__(self, backend_url=Config.BACKEND_URL):
        self.backend_url = backend_url
        self.alert_cooldown = 300  # 5 minutes between alerts
        self.last_alert_time = 0

    def send_alert(self, driver_id, alert_data):
        """
        Send SMS alert through backend
        
        Args:
            driver_id: Driver identifier
            alert_data: Dict with status, confidence, location data
        """
        try:
            import time

            # Check cooldown period
            current_time = time.time()
            if current_time - self.last_alert_time < self.alert_cooldown:
                return {"success": False, "reason": "Alert cooldown active"}

            if requests is None:
                logger.warning("requests library not available for SMS")
                return {"success": False, "reason": "requests library not available"}

            url = f"{self.backend_url}/api/sms/test"
            payload = {
                "driver_id": driver_id,
                "phone_number": alert_data.get("owner_phone", ""),
                "alert_type": "DROWSINESS",
                "status": alert_data.get("status", "SLEEPY"),
                "confidence": alert_data.get("confidence", 0.0),
                "latitude": alert_data.get("latitude"),
                "longitude": alert_data.get("longitude"),
            }

            response = requests.post(url, json=payload, timeout=5)

            if response.status_code == 200:
                data = response.json()
                self.last_alert_time = current_time
                logger.info(f"✓ SMS alert sent to {alert_data.get('owner_phone', 'unknown')}")
                return {"success": True, "data": data}
            else:
                logger.warning(f"SMS alert failed: {response.status_code}")
                return {"success": False, "status_code": response.status_code}

        except Exception as e:
            logger.error(f"Error sending SMS alert: {e}")
            return {"success": False, "error": str(e)}

    def configure_alert_cooldown(self, cooldown_seconds):
        """Configure minimum time between alerts"""
        self.alert_cooldown = cooldown_seconds
        logger.info(f"Alert cooldown set to {cooldown_seconds} seconds")


# Global SMS alert handler instance
sms_handler = None


def initialize_sms_handler(backend_url=Config.BACKEND_URL):
    """Initialize global SMS handler"""
    global sms_handler
    sms_handler = SMSAlertHandler(backend_url)
    return sms_handler


def get_sms_handler():
    """Get global SMS handler instance"""
    global sms_handler
    if sms_handler is None:
        initialize_sms_handler()
    return sms_handler
