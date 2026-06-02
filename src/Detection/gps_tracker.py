"""
GPS Tracker Module
Tracks driver location and sends updates to backend
"""

import json
import threading
import time
from datetime import datetime

try:
    import requests
except ImportError:
    print("⚠️  requests library not installed. Install with: pip install requests")
    requests = None

from src.Config.config import Config
from src.logger import logging

logger = logging.getLogger(__name__)


class GPSTracker:
    """GPS tracking and location update handler"""

    def __init__(self, driver_id=Config.DRIVER_ID):
        self.driver_id = driver_id
        self.current_latitude = 0.0
        self.current_longitude = 0.0
        self.last_update = None
        self.is_running = False
        self.update_interval = Config.GPS_UPDATE_INTERVAL / 1000  # Convert to seconds

    def get_location(self):
        """
        Get current GPS location
        In production, integrate with actual GPS module or device location API
        """
        try:
            if Config.USE_DUMMY_GPS:
                # Dummy GPS for testing
                import random

                # Simulate location around a specific area (e.g., 18.5204, 73.8567 - Pune)
                self.current_latitude = 18.5204 + random.uniform(-0.01, 0.01)
                self.current_longitude = 73.8567 + random.uniform(-0.01, 0.01)
            else:
                # TODO: Integrate with actual GPS module
                # Example using geolocation API or device GPS
                pass

            return {
                "latitude": self.current_latitude,
                "longitude": self.current_longitude,
                "accuracy": 10,  # meters
                "timestamp": datetime.now().isoformat(),
            }
        except Exception as e:
            logger.error(f"Error getting GPS location: {e}")
            return None

    def update_location_to_backend(self):
        """Send current location to backend"""
        try:
            location = self.get_location()
            if not location:
                return False

            url = f"{Config.BACKEND_URL}/api/gps/update"
            payload = {
                "driver_id": self.driver_id,
                "latitude": location["latitude"],
                "longitude": location["longitude"],
                "accuracy": location["accuracy"],
                "timestamp": location["timestamp"],
            }

            if requests is None:
                logger.warning("requests library not available for GPS update")
                return False

            response = requests.post(url, json=payload, timeout=5)

            if response.status_code == 200:
                data = response.json()
                self.last_update = datetime.now()
                logger.info(f"✓ GPS location updated: {location['latitude']}, {location['longitude']}")
                return True
            else:
                logger.warning(f"Backend GPS update failed: {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"Error updating location to backend: {e}")
            return False

    def start_tracking(self):
        """Start periodic GPS tracking"""
        if self.is_running:
            return

        self.is_running = True
        logger.info("✓ GPS tracking started")

        def track():
            while self.is_running:
                try:
                    self.update_location_to_backend()
                    time.sleep(self.update_interval)
                except Exception as e:
                    logger.error(f"Error in GPS tracking loop: {e}")
                    time.sleep(self.update_interval)

        # Start in background thread
        tracking_thread = threading.Thread(target=track, daemon=True)
        tracking_thread.start()

    def stop_tracking(self):
        """Stop GPS tracking"""
        self.is_running = False
        logger.info("✓ GPS tracking stopped")

    def get_maps_link(self):
        """Generate Google Maps link with current location"""
        if self.current_latitude and self.current_longitude:
            return f"https://maps.google.com/?q={self.current_latitude},{self.current_longitude}"
        return None


# Global GPS tracker instance
gps_tracker = None


def initialize_gps_tracker(driver_id=Config.DRIVER_ID):
    """Initialize global GPS tracker"""
    global gps_tracker
    gps_tracker = GPSTracker(driver_id)
    gps_tracker.start_tracking()
    return gps_tracker


def get_gps_tracker():
    """Get global GPS tracker instance"""
    global gps_tracker
    if gps_tracker is None:
        initialize_gps_tracker()
    return gps_tracker


def get_current_location():
    """
    Get current GPS location
    This is the main function used by detection_service.py
    """
    try:
        tracker = get_gps_tracker()
        return tracker.get_location()
    except Exception as e:
        logger.error(f"Error getting current location: {e}")
        return None
