"""
Smart Driver Drowsiness Detection System
Integrated with Node.js Backend for real-time monitoring
"""

import cv2
import numpy as np
import threading
import time
import logging
import winsound
from datetime import datetime

try:
    import requests
except ImportError:
    print("⚠️  requests library not installed. Install with: pip install requests")
    requests = None

from tensorflow.keras.models import load_model
from src.Config.config import Config
from src.Detection.gps_tracker import initialize_gps_tracker, get_gps_tracker
from src.Detection.sms_alert import initialize_sms_handler, get_sms_handler
from src.logger import logging

logger = logging.getLogger(__name__)

# ========== CONFIGURATION ==========

MODEL_PATH = Config.MODEL_PATH
BACKEND_URL = Config.BACKEND_URL
DRIVER_ID = Config.DRIVER_ID
ALARM_THRESHOLD = Config.ALARM_THRESHOLD
CONFIDENCE_THRESHOLD = Config.CONFIDENCE_THRESHOLD
DISPLAY_ENABLED = Config.DISPLAY_ENABLED

# ========== GLOBAL STATE ==========

sleep_counter = 0
alarm_running = False
last_alert_sent = 0
alert_cooldown = 300  # 5 minutes between alerts
current_confidence = 0.0
current_status = "AWAKE"


# ========== MODEL LOADING ==========

def load_drowsiness_model():
    """Load pre-trained CNN model"""
    try:
        model = load_model(MODEL_PATH)
        logger.info(f"✓ Model loaded from {MODEL_PATH}")
        return model
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        print(f"Error loading model: {e}")
        exit()


# ========== CASCADE CLASSIFIERS ==========

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
eye_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_eye.xml"
)


# ========== ALARM SYSTEM ==========

def play_alarm():
    """Play beep alarm on Windows"""
    global alarm_running

    alarm_running = True

    try:
        # Play high-pitch beep for 1 second
        winsound.Beep(2500, 1000)
        logger.info("🔔 ALARM TRIGGERED!")
    except Exception as e:
        logger.warning(f"Alarm error: {e}")

    alarm_running = False


# ========== BACKEND COMMUNICATION ==========

def send_alert_to_backend(status, confidence, latitude=None, longitude=None, alarm_triggered=False):
    """
    Send drowsiness alert to Node.js backend
    
    Args:
        status: "AWAKE" or "SLEEPY"
        confidence: Prediction confidence (0-1)
        latitude: Driver's latitude
        longitude: Driver's longitude
        alarm_triggered: Whether alarm was triggered
    """
    try:
        if requests is None:
            logger.warning("requests library not available")
            return False

        gps_tracker = get_gps_tracker()
        if latitude is None:
            latitude = gps_tracker.current_latitude
        if longitude is None:
            longitude = gps_tracker.current_longitude

        url = f"{BACKEND_URL}/api/alerts"
        payload = {
            "driver_id": DRIVER_ID,
            "status": status,
            "confidence": float(confidence),
            "latitude": latitude,
            "longitude": longitude,
            "alarm_triggered": alarm_triggered,
            "timestamp": datetime.now().isoformat(),
        }

        response = requests.post(url, json=payload, timeout=5)

        if response.status_code == 200:
            data = response.json()
            logger.info(f"✓ Alert sent to backend - Status: {status}")
            return True
        else:
            logger.warning(f"Backend alert failed: {response.status_code}")
            return False

    except Exception as e:
        logger.error(f"Error sending alert to backend: {e}")
        return False


# ========== DETECTION LOGIC ==========

def predict_drowsiness(model, eye_frame):
    """
    Predict drowsiness from eye frame
    
    Args:
        model: Trained CNN model
        eye_frame: Eye region image
        
    Returns:
        confidence: Prediction confidence (0-1)
    """
    try:
        # Resize to model input size
        eye_frame = cv2.resize(eye_frame, (64, 64))

        # Normalize
        eye_frame = eye_frame.astype("float32") / 255.0

        # Add batch dimension
        eye_frame = np.expand_dims(eye_frame, axis=0)

        # Predict
        prediction = model.predict(eye_frame, verbose=0)
        confidence = float(prediction[0][0])

        return confidence

    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return 0.0


# ========== MAIN DETECTION LOOP ==========

def start_detection():
    """Start drowsiness detection system"""
    global sleep_counter, alarm_running, last_alert_sent, current_confidence, current_status

    # Load model
    model = load_drowsiness_model()
    logger.info("🚗 Smart Driver Drowsiness Detection Started")

    # Initialize GPS tracker
    gps_tracker = initialize_gps_tracker(DRIVER_ID)
    logger.info("📍 GPS Tracker initialized")

    # Initialize SMS handler
    sms_handler = initialize_sms_handler(BACKEND_URL)
    logger.info("📱 SMS Alert Handler initialized")

    # Open camera
    cap = cv2.VideoCapture(Config.CAMERA_INDEX)

    if not cap.isOpened():
        logger.error("Error: Camera not found")
        print("Error: Camera not found")
        return

    logger.info(f"✓ Camera opened (Index: {Config.CAMERA_INDEX})")

    frame_count = 0

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                logger.warning("Failed to read frame")
                break

            frame_count += 1
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            # Detect faces
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

            current_status = "AWAKE"
            frame_has_face = len(faces) > 0

            # Process each face
            for (x, y, w, h) in faces:
                # Draw face rectangle
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

                roi_color = frame[y : y + h, x : x + w]

                # Detect eyes
                eyes = eye_cascade.detectMultiScale(roi_color)

                if len(eyes) > 0:
                    # Process first eye
                    ex, ey, ew, eh = eyes[0]
                    eye = roi_color[ey : ey + eh, ex : ex + ew]

                    # Predict drowsiness
                    current_confidence = predict_drowsiness(model, eye)

                    if current_confidence > CONFIDENCE_THRESHOLD:
                        current_status = "SLEEPY"
                        sleep_counter += 1
                    else:
                        current_status = "AWAKE"
                        sleep_counter = 0

                    # Draw eye rectangle
                    cv2.rectangle(
                        roi_color,
                        (ex, ey),
                        (ex + ew, ey + eh),
                        (255, 0, 0),
                        2,
                    )

            # Check alarm threshold
            alarm_triggered = sleep_counter > ALARM_THRESHOLD
            if alarm_triggered:
                cv2.putText(
                    frame,
                    "DROWSINESS ALERT!",
                    (40, 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    3,
                )

                if not alarm_running:
                    threading.Thread(target=play_alarm, daemon=True).start()

                # Send alert to backend periodically (avoid spam)
                current_time = time.time()
                if current_time - last_alert_sent > alert_cooldown:
                    send_alert_to_backend(
                        current_status,
                        current_confidence,
                        alarm_triggered=True,
                    )
                    last_alert_sent = current_time

            else:
                # Send regular status update
                if frame_count % 100 == 0:  # Every 100 frames
                    send_alert_to_backend(
                        current_status,
                        current_confidence,
                        alarm_triggered=False,
                    )

            # Display information on frame
            cv2.putText(
                frame,
                f"Status: {current_status}",
                (40, 100),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (255, 0, 0),
                2,
            )

            cv2.putText(
                frame,
                f"Confidence: {current_confidence:.2f}",
                (40, 140),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 0),
                2,
            )

            cv2.putText(
                frame,
                f"Sleep Counter: {sleep_counter}",
                (40, 170),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 0),
                2,
            )

            cv2.putText(
                frame,
                f"Driver: {DRIVER_ID}",
                (40, 200),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )

            # Show frame
            if DISPLAY_ENABLED:
                cv2.imshow("Smart Driver Drowsiness Detection System", frame)

            # Exit on 'q' key
            key = cv2.waitKey(1)
            if key == ord("q"):
                logger.info("Exiting detection system...")
                break

    except KeyboardInterrupt:
        logger.info("Detection interrupted by user")
    except Exception as e:
        logger.error(f"Error in detection loop: {e}")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        gps_tracker.stop_tracking()
        logger.info("✓ Detection system stopped")


# ========== ENTRY POINT ==========

if __name__ == "__main__":
    start_detection()