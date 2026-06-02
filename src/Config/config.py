import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application Configuration"""

    # Backend Server
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

    # Detection Settings
    ALARM_THRESHOLD = int(os.getenv("ALARM_THRESHOLD", "150"))  # ~5 seconds at 30 FPS
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
    FRAME_CHECK_INTERVAL = int(os.getenv("FRAME_CHECK_INTERVAL", "100"))

    # Driver Settings
    DRIVER_ID = os.getenv("DRIVER_ID", "DRIVER_001")
    DRIVER_NAME = os.getenv("DRIVER_NAME", "Default Driver")

    # GPS Settings
    GPS_UPDATE_INTERVAL = int(os.getenv("GPS_UPDATE_INTERVAL", "5000"))
    USE_DUMMY_GPS = os.getenv("USE_DUMMY_GPS", "True").lower() == "true"

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "logs/drowsiness_detection.log")

    # Model Path
    MODEL_PATH = os.getenv("MODEL_PATH", "artifacts/drowsiness_model.h5")

    # Camera Settings
    CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
    DISPLAY_ENABLED = os.getenv("DISPLAY_ENABLED", "True").lower() == "true"

    # AI/LLM Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
