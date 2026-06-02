"""
AI Detection Service - FINAL PRODUCTION WORKFLOW
Implements complete state machine with AWAKE, SLEEPY, EMERGENCY, and RECOVERY states.
Provides real-time video streaming, GPS tracking, SMS/WhatsApp alerts, and dashboard updates.
"""

import cv2
import numpy as np
import threading
import time
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.Config.config import Config
from tensorflow.keras.models import load_model
from src.Detection.gps_tracker import get_current_location

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask app
app = Flask(__name__)
CORS(app)

# ========== VIDEO STREAMING GLOBALS ==========

current_frame = None
frame_lock = threading.Lock()

def get_frame_bytes():
    """Get current frame as JPEG bytes for streaming"""
    global current_frame
    try:
        with frame_lock:
            if current_frame is not None:
                ret, buffer = cv2.imencode('.jpg', current_frame)
                if ret:
                    return buffer.tobytes()
    except Exception as e:
        logger.warning(f"Error encoding frame: {e}")
    return None

# ========== STATE MACHINE ==========

class DrowsinessStateMachine:
    """
    Production state machine for driver drowsiness detection.
    
    States:
    - AWAKE: Face detected, eyes open
    - SLEEPY: Eyes closed for 2+ seconds
    - EMERGENCY: Eyes closed for 10+ seconds
    - RECOVERY: Eyes opened after SLEEPY/EMERGENCY
    """
    
    def __init__(self):
        self.is_running = False
        self.driver_id = Config.DRIVER_ID
        self.session_id = str(uuid.uuid4())
        self.start_time = None
        
        # States
        self.current_state = "IDLE"  # IDLE, AWAKE, SLEEPY, EMERGENCY, RECOVERY
        self.previous_state = None
        self.state_start_time = None
        
        # Detection metrics
        self.confidence = 0.0
        self.eyes_closed_duration = 0.0  # seconds
        self.face_detected = False
        self.eyes_detected = False
        self.last_update = None
        self.frame_count = 0
        self.fps = 0
        
        # GPS and Location
        self.latitude = None
        self.longitude = None
        self.maps_url = None
        self.location_timestamp = None
        
        # Alert tracking
        self.alarm_active = False
        self.alarm_start_time = None
        self.sms_sent = False
        self.whatsapp_sent = False
        self.alert_count = 0
        self.last_alert_time = None
        
        # State transition tracking
        self.sleepy_triggered_time = None
        self.emergency_triggered_time = None
        
    def update_state(self, eyes_closed: bool, face_detected: bool, eyes_detected: bool):
        """Update state machine based on detection results"""
        self.previous_state = self.current_state
        self.face_detected = face_detected
        self.eyes_detected = eyes_detected
        self.last_update = datetime.now().isoformat()
        
        # State transitions logic
        if not face_detected:
            self.current_state = "NO_FACE"
            self.eyes_closed_duration = 0
            self.alarm_active = False
            self.sms_sent = False
            self.whatsapp_sent = False
            return
        
        if not eyes_detected:
            self.current_state = "INSUFFICIENT_EYES"
            self.eyes_closed_duration = 0
            return
        
        # Eyes detected - manage state machine
        if not eyes_closed:
            # RECOVERY: Eyes are open
            if self.current_state in ["SLEEPY", "EMERGENCY"]:
                self.current_state = "RECOVERY"
                self.eyes_closed_duration = 0
                self.alarm_active = False  # Stop alarm when eyes open
                self.sms_sent = False
                self.whatsapp_sent = False
                logger.info("✓ RECOVERY: Eyes opened - Alarm stopped, counters reset")
            else:
                self.current_state = "AWAKE"
                self.eyes_closed_duration = 0
                self.alarm_active = False
        else:
            # Eyes are closed
            if self.state_start_time is None:
                self.state_start_time = datetime.now()
            
            elapsed = (datetime.now() - self.state_start_time).total_seconds()
            self.eyes_closed_duration = elapsed
            
            # Check for SLEEPY (2 seconds)
            if elapsed >= 2.0 and self.current_state not in ["SLEEPY", "EMERGENCY"]:
                self.current_state = "SLEEPY"
                self.sleepy_triggered_time = datetime.now().isoformat()
                self.alarm_active = True
                self.alarm_start_time = datetime.now()
                logger.info("🔔 SLEEPY: Eyes closed for 2+ seconds - ALARM STARTED")
            
            # Check for EMERGENCY (10 seconds)
            elif elapsed >= 10.0 and self.current_state != "EMERGENCY":
                self.current_state = "EMERGENCY"
                self.emergency_triggered_time = datetime.now().isoformat()
                self.alarm_active = True  # Keep alarm running
                
                # Capture GPS location
                self.capture_gps_location()
                
                # Increment alert count
                self.alert_count += 1
                self.last_alert_time = datetime.now().isoformat()
                
                logger.info("🚨 EMERGENCY: Eyes closed for 10+ seconds - GPS captured, alerts queued")
                logger.info(f"   Location: ({self.latitude}, {self.longitude})")
                logger.info(f"   Maps URL: {self.maps_url}")
    
    def capture_gps_location(self):
        """Capture GPS location and generate Google Maps URL"""
        try:
            location = get_current_location()
            if location:
                self.latitude = location.get('latitude', 0)
                self.longitude = location.get('longitude', 0)
                self.location_timestamp = datetime.now().isoformat()
                
                # Generate Google Maps URL
                self.maps_url = f"https://www.google.com/maps?q={self.latitude},{self.longitude}"
                logger.info(f"✓ GPS Captured: {self.latitude}, {self.longitude}")
            else:
                logger.warning("GPS location not available")
                # Use default/mock location
                self.latitude = 37.7749
                self.longitude = -122.4194
                self.maps_url = f"https://www.google.com/maps?q={self.latitude},{self.longitude}"
        except Exception as e:
            logger.warning(f"GPS capture error: {e}")
            # Fallback location
            self.latitude = 37.7749
            self.longitude = -122.4194
            self.maps_url = f"https://www.google.com/maps?q={self.latitude},{self.longitude}"
    
    def reset_eyes_closed_timer(self):
        """Reset the eyes closed timer when eyes open"""
        self.state_start_time = None
        self.eyes_closed_duration = 0
    
    def to_dict(self):
        """Convert state to dictionary for JSON serialization"""
        return {
            'is_running': self.is_running,
            'driver_id': self.driver_id,
            'session_id': self.session_id,
            'current_state': self.current_state,
            'previous_state': self.previous_state,
            'confidence': round(self.confidence, 4),
            'eyes_closed_duration': round(self.eyes_closed_duration, 2),
            'face_detected': self.face_detected,
            'eyes_detected': self.eyes_detected,
            'frame_count': self.frame_count,
            'fps': round(self.fps, 2),
            'latitude': self.latitude,
            'longitude': self.longitude,
            'maps_url': self.maps_url,
            'location_timestamp': self.location_timestamp,
            'alarm_active': self.alarm_active,
            'alarm_start_time': self.alarm_start_time.isoformat() if self.alarm_start_time else None,
            'sms_sent': self.sms_sent,
            'whatsapp_sent': self.whatsapp_sent,
            'alert_count': self.alert_count,
            'last_alert_time': self.last_alert_time,
            'sleepy_triggered_time': self.sleepy_triggered_time,
            'emergency_triggered_time': self.emergency_triggered_time,
            'last_update': self.last_update,
        }

# Global state machine instance
state_machine = DrowsinessStateMachine()

# ========== MODEL LOADING ==========

model = None
face_cascade = None
eye_cascade = None

def initialize_models():
    """Initialize AI models and cascades"""
    global model, face_cascade, eye_cascade
    
    try:
        logger.info("Loading drowsiness detection model...")
        model = load_model(Config.MODEL_PATH)
        logger.info("✓ CNN model loaded successfully")
        
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye.xml"
        )
        
        if face_cascade.empty():
            logger.error("Failed to load face cascade")
            return False
        if eye_cascade.empty():
            logger.error("Failed to load eye cascade")
            return False
            
        logger.info("✓ Cascades loaded successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing models: {e}")
        return False

# ========== DETECTION LOGIC ==========

def detect_drowsiness(frame) -> Tuple[bool, float]:
    """
    Detect drowsiness from frame.
    Returns: (eyes_closed, confidence)
    Eyes closed = True if prediction indicates drowsiness
    """
    if model is None or face_cascade is None or eye_cascade is None:
        return False, 0.0
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    state_machine.face_detected = len(faces) > 0
    
    if len(faces) == 0:
        return False, 0.0
    
    eyes_found = False
    confidence = 0.0
    
    for (x, y, w, h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        eyes = eye_cascade.detectMultiScale(roi_gray)
        
        if len(eyes) >= 2:
            eyes_found = True
            
            # Prepare frame for model
            roi_color = frame[y:y+h, x:x+w]
            roi_resized = cv2.resize(roi_color, (24, 24))
            roi_normalized = roi_resized / 255.0
            roi_expanded = np.expand_dims(roi_normalized, axis=0)
            
            # Predict
            try:
                prediction = model.predict(roi_expanded, verbose=0)
                confidence = float(prediction[0][0])
                state_machine.confidence = confidence
                
                # confidence > threshold means SLEEPY (eyes closed)
                eyes_closed = confidence > Config.CONFIDENCE_THRESHOLD
                return eyes_closed, confidence
            except Exception as e:
                logger.error(f"Prediction error: {e}")
                return False, 0.0
    
    state_machine.eyes_detected = eyes_found
    return False, 0.0

# ========== FRAME PROCESSING THREAD ==========

def frame_processing_loop():
    """Continuous frame processing loop with state machine"""
    global current_frame
    
    cap = cv2.VideoCapture(Config.CAMERA_INDEX)
    
    if not cap.isOpened():
        logger.error("Failed to open camera")
        state_machine.is_running = False
        return
    
    logger.info("Camera opened successfully")
    state_machine.is_running = True
    state_machine.start_time = datetime.now()
    state_machine.current_state = "AWAKE"
    
    frame_time = time.time()
    last_alarm_beep = time.time()
    last_backend_update = time.time()
    
    try:
        while state_machine.is_running:
            ret, frame = cap.read()
            
            if not ret:
                logger.warning("Failed to read frame")
                break
            
            # Flip frame for selfie view
            frame = cv2.flip(frame, 1)
            
            # Process frame with detection
            eyes_closed, confidence = detect_drowsiness(frame)
            state_machine.update_state(eyes_closed, state_machine.face_detected, state_machine.eyes_detected)
            
            state_machine.frame_count += 1
            
            # ========== CONTINUOUS ALARM LOGIC ==========
            current_time = time.time()
            
            # Play alarm continuously while active (continuous beeping)
            if state_machine.alarm_active and (current_time - last_alarm_beep) >= 0.8:
                threading.Thread(
                    target=play_alarm_beep,
                    daemon=True
                ).start()
                last_alarm_beep = current_time
            
            # ========== SEND ALERTS TO BACKEND ==========
            if (current_time - last_backend_update) >= 0.5:  # Update every 500ms
                # Always send state update
                threading.Thread(
                    target=send_state_to_backend,
                    args=(state_machine.to_dict(),),
                    daemon=True
                ).start()
                
                # Send SMS on EMERGENCY and haven't sent yet
                if state_machine.current_state == "EMERGENCY" and not state_machine.sms_sent:
                    threading.Thread(
                        target=send_sms_alert,
                        args=(state_machine.to_dict(),),
                        daemon=True
                    ).start()
                    state_machine.sms_sent = True
                    logger.info("📱 SMS alert queued")
                
                # Send WhatsApp on EMERGENCY and haven't sent yet
                if state_machine.current_state == "EMERGENCY" and not state_machine.whatsapp_sent:
                    threading.Thread(
                        target=send_whatsapp_alert,
                        args=(state_machine.to_dict(),),
                        daemon=True
                    ).start()
                    state_machine.whatsapp_sent = True
                    logger.info("💬 WhatsApp alert queued")
                
                last_backend_update = current_time
            
            # ========== DRAW ANNOTATIONS ON FRAME ==========
            
            # State colors
            state_colors = {
                "AWAKE": (0, 255, 0),           # Green
                "SLEEPY": (0, 165, 255),       # Orange
                "EMERGENCY": (0, 0, 255),      # Red
                "RECOVERY": (0, 255, 255),     # Yellow
                "NO_FACE": (128, 128, 128),    # Gray
                "INSUFFICIENT_EYES": (128, 128, 128),
            }
            
            state_color = state_colors.get(state_machine.current_state, (255, 255, 255))
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.7
            
            # Draw state and metrics
            cv2.putText(frame, f"STATE: {state_machine.current_state}", (10, 30), font, 1.0, state_color, 2)
            cv2.putText(frame, f"Eyes Closed: {state_machine.eyes_closed_duration:.1f}s", (10, 70), font, font_scale, (255, 255, 255), 2)
            cv2.putText(frame, f"Confidence: {state_machine.confidence:.1%}", (10, 100), font, font_scale, (255, 255, 255), 2)
            cv2.putText(frame, f"Face: {'✓' if state_machine.face_detected else '✗'} | Eyes: {'✓' if state_machine.eyes_detected else '✗'}", (10, 130), font, font_scale, (255, 255, 255), 2)
            
            # Alarm indicator
            alarm_text = "🔔 ALARM ON" if state_machine.alarm_active else "ALARM OFF"
            alarm_color = (0, 0, 255) if state_machine.alarm_active else (0, 255, 0)
            cv2.putText(frame, alarm_text, (10, 160), font, font_scale, alarm_color, 2)
            
            # FPS counter
            current_time_fps = time.time()
            if current_time_fps - frame_time > 1.0:
                state_machine.fps = state_machine.frame_count / (current_time_fps - frame_time)
                state_machine.frame_count = 0
                frame_time = current_time_fps
            
            cv2.putText(frame, f"FPS: {state_machine.fps:.1f}", (frame.shape[1]-200, 30), font, font_scale, (255, 255, 255), 2)
            
            # Location info (if available)
            if state_machine.maps_url:
                cv2.putText(frame, f"Lat: {state_machine.latitude:.4f} | Lon: {state_machine.longitude:.4f}", (10, 190), font, 0.6, (255, 255, 255), 1)
            
            # Alert count
            cv2.putText(frame, f"Alert Count: {state_machine.alert_count}", (10, 220), font, font_scale, (255, 255, 255), 2)
            
            # Store annotated frame for streaming
            with frame_lock:
                current_frame = frame.copy()
            
            # Small delay to prevent CPU overload
            time.sleep(0.01)
    
    except Exception as e:
        logger.error(f"Frame processing error: {e}")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        state_machine.is_running = False
        logger.info("Camera released, detection stopped")

# ========== CONTINUOUS ALARM CONTROL ==========

def play_alarm_beep():
    """Play a single alarm beep - called repeatedly for continuous alarm"""
    try:
        import winsound
        winsound.Beep(2500, 300)  # Frequency: 2500 Hz, Duration: 300ms
    except Exception as e:
        logger.warning(f"Alarm beep error: {e}")

# ========== SMS AND WHATSAPP ALERTS ==========

def send_sms_alert(state: Dict):
    """Send SMS alert to vehicle owner when emergency detected"""
    try:
        import requests
        
        backend_url = f"{Config.BACKEND_URL}/api/v1/sms/alert"
        
        # Format SMS message
        sms_message = f"""🚨 DRIVER DROWSINESS ALERT 🚨

Driver appears to be sleeping while driving.

Driver ID: {state['driver_id']}

Location: {state['latitude']:.4f}, {state['longitude']:.4f}
Maps: {state['maps_url']}

Emergency Status Triggered.

Please contact the driver immediately."""
        
        payload = {
            'driverId': state['driver_id'],
            'status': state['current_state'],
            'latitude': state['latitude'],
            'longitude': state['longitude'],
            'mapsUrl': state['maps_url'],
            'message': sms_message,
            'timestamp': state['last_update']
        }
        
        response = requests.post(backend_url, json=payload, timeout=5)
        
        if response.status_code == 200:
            logger.info("✓ SMS alert sent to backend")
        else:
            logger.warning(f"SMS alert backend returned: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error sending SMS alert: {e}")

def send_whatsapp_alert(state: Dict):
    """Send WhatsApp alert to vehicle owner when emergency detected"""
    try:
        import requests
        
        backend_url = f"{Config.BACKEND_URL}/api/v1/whatsapp/alert"
        
        # Format WhatsApp message
        whatsapp_message = f"""🚨 DRIVER DROWSINESS ALERT 🚨

Driver appears to be sleeping while driving.

Driver ID: {state['driver_id']}

Location: {state['latitude']:.4f}, {state['longitude']:.4f}
Maps: {state['maps_url']}

Emergency Status Triggered.

Please contact the driver immediately."""
        
        payload = {
            'driverId': state['driver_id'],
            'status': state['current_state'],
            'latitude': state['latitude'],
            'longitude': state['longitude'],
            'mapsUrl': state['maps_url'],
            'message': whatsapp_message,
            'timestamp': state['last_update']
        }
        
        response = requests.post(backend_url, json=payload, timeout=5)
        
        if response.status_code == 200:
            logger.info("✓ WhatsApp alert sent to backend")
        else:
            logger.warning(f"WhatsApp alert backend returned: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error sending WhatsApp alert: {e}")

# ========== BACKEND COMMUNICATION ==========

def send_state_to_backend(state: Dict):
    """Send complete state update to Node.js backend"""
    try:
        import requests
        
        backend_url = f"{Config.BACKEND_URL}/api/v1/detection/update"
        
        response = requests.post(
            backend_url,
            json=state,
            timeout=5
        )
        
        if response.status_code != 200:
            logger.debug(f"Backend response: {response.status_code}")
    
    except Exception as e:
        logger.debug(f"Failed to send to backend: {e}")

# ========== FLASK ROUTES ==========

@app.route('/api/detection/status', methods=['GET'])
def get_status():
    """Get current detection state"""
    return jsonify(state_machine.to_dict()), 200

@app.route('/api/detection/video_feed', methods=['GET'])
def video_feed():
    """Stream video with OpenCV annotations as MJPEG"""
    def generate():
        while state_machine.is_running:
            frame_bytes = get_frame_bytes()
            if frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(frame_bytes)).encode() + b'\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.03)  # ~30 FPS
    
    return Response(
        generate(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@app.route('/api/detection/start', methods=['POST'])
def start_detection():
    """Start detection process"""
    if state_machine.is_running:
        return jsonify({'success': False, 'message': 'Detection already running'}), 400
    
    if not initialize_models():
        return jsonify({'success': False, 'message': 'Failed to initialize models'}), 500
    
    state_machine.is_running = True
    state_machine.session_id = str(uuid.uuid4())
    state_machine.current_state = "AWAKE"
    state_machine.eyes_closed_duration = 0
    state_machine.alarm_active = False
    state_machine.sms_sent = False
    state_machine.whatsapp_sent = False
    state_machine.alert_count = 0
    
    # Start frame processing in background thread
    thread = threading.Thread(target=frame_processing_loop, daemon=True)
    thread.start()
    
    logger.info(f"🎬 Detection started - Session: {state_machine.session_id}")
    
    return jsonify({
        'success': True,
        'message': 'Detection started',
        'session_id': state_machine.session_id,
        'driver_id': state_machine.driver_id,
        'initial_state': state_machine.current_state
    }), 200

@app.route('/api/detection/stop', methods=['POST'])
def stop_detection():
    """Stop detection process and disable alarm"""
    if not state_machine.is_running:
        return jsonify({'success': False, 'message': 'Detection not running'}), 400
    
    state_machine.is_running = False
    state_machine.alarm_active = False
    
    logger.info("🛑 Detection stopped - Alarm disabled")
    
    return jsonify({
        'success': True,
        'message': 'Detection stopped',
        'session_id': state_machine.session_id,
        'alerts_triggered': state_machine.alert_count,
        'final_state': state_machine.current_state
    }), 200

@app.route('/api/detection/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'detection_running': state_machine.is_running,
        'models_loaded': model is not None,
        'current_state': state_machine.current_state
    }), 200

@app.route('/api/detection/config', methods=['GET'])
def get_config():
    """Get detection configuration"""
    return jsonify({
        'sleepy_threshold': 2.0,
        'emergency_threshold': 10.0,
        'confidence_threshold': Config.CONFIDENCE_THRESHOLD,
        'camera_index': Config.CAMERA_INDEX,
    }), 200

# ========== MAIN ==========

if __name__ == '__main__':
    logger.info("═" * 60)
    logger.info("🚗 DRIVER DROWSINESS DETECTION - FINAL PRODUCTION WORKFLOW")
    logger.info("═" * 60)
    logger.info(f"Backend URL: {Config.BACKEND_URL}")
    logger.info(f"Driver ID: {Config.DRIVER_ID}")
    logger.info("States: AWAKE → SLEEPY (2s) → EMERGENCY (10s)")
    logger.info("Alarm: Continuous until eyes open")
    logger.info("═" * 60)
    
    # Run Flask app
    app.run(
        host='127.0.0.1',
        port=5001,
        debug=False,
        threaded=True
    )
