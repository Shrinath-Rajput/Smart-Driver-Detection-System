# -*- coding: utf-8 -*-
"""
Drowsiness Detection Service - Ultra-Minimal Mock
Uses ONLY Python 3 standard library - no external dependencies needed
"""

import os
import sys
import json
import time
import threading
import random
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request
import io

# Force UTF-8 output on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

class DetectionState:
    """Manages detection state"""
    def __init__(self):
        self.is_running = False
        self.current_status = "IDLE"
        self.confidence = 0.0
        self.sleep_counter = 0
        self.face_detected = False
        self.eyes_detected = False
        self.latitude = None
        self.longitude = None
        self.fps = 0.0
        self.last_update = None

state = DetectionState()

def get_status_dict():
    """Return current detection state as dict"""
    return {
        "is_running": state.is_running,
        "status": state.current_status,
        "confidence": round(state.confidence, 3),
        "sleep_counter": state.sleep_counter,
        "face_detected": state.face_detected,
        "eyes_detected": state.eyes_detected,
        "latitude": round(state.latitude, 6) if state.latitude else None,
        "longitude": round(state.longitude, 6) if state.longitude else None,
        "fps": round(state.fps, 1),
        "last_update": state.last_update
    }

def send_status_to_backend():
    """Send status to backend via HTTP POST"""
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:5002")
        url = f"{backend_url}/api/v1/detection/update"
        
        data = {
            "driverId": os.getenv("DRIVER_ID", "DRIVER_001"),
            "status": state.current_status,
            "confidence": state.confidence,
            "faceDetected": state.face_detected,
            "eyesDetected": state.eyes_detected,
            "latitude": state.latitude,
            "longitude": state.longitude,
            "fps": state.fps,
            "timestamp": state.last_update
        }
        
        json_data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=json_data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=2) as resp:
            pass
    except Exception as e:
        print(f"[HTTP Error] Failed to send status to {backend_url}: {str(e)}", file=sys.stderr)
        sys.stderr.flush()

def simulate_detection_loop():
    """Simulate detection with realistic mock data"""
    print("[Detection] Starting mock detection loop...")
    sys.stdout.flush()
    
    frame_count = 0
    start_time = time.time()
    closed_eyes_counter = 0
    
    while state.is_running:
        try:
            frame_count += 1
            elapsed = time.time() - start_time
            
            state.fps = frame_count / elapsed if elapsed > 0 else 0
            state.face_detected = random.random() > 0.05  # 95% of time
            
            if state.face_detected:
                state.eyes_detected = random.random() > 0.1  # 90% when face detected
                
                if state.eyes_detected:
                    rand = random.random()
                    if rand < 0.65:
                        state.current_status = "AWAKE"
                        state.confidence = random.uniform(0.0, 0.3)
                        closed_eyes_counter = 0
                    elif rand < 0.90:
                        state.current_status = "DETECTING"
                        state.confidence = random.uniform(0.3, 0.7)
                        closed_eyes_counter += 1
                    else:
                        state.current_status = "EMERGENCY"
                        state.confidence = random.uniform(0.7, 1.0)
                        closed_eyes_counter += 1
                    
                    state.sleep_counter = closed_eyes_counter
                else:
                    state.current_status = "NO_EYES"
                    state.confidence = 0.0
                    closed_eyes_counter = 0
            else:
                state.current_status = "NO_FACE"
                state.confidence = 0.0
                closed_eyes_counter = 0
            
            state.latitude = 40.7128 + random.uniform(-0.01, 0.01)
            state.longitude = -74.0060 + random.uniform(-0.01, 0.01)
            state.last_update = datetime.now().isoformat()
            
            send_status_to_backend()
            time.sleep(0.033)
            
        except Exception as e:
            print(f"[Detection] Error: {e}", file=sys.stderr)
            time.sleep(0.1)

def start_detection():
    """Start detection"""
    if state.is_running:
        return {"status": "error", "message": "Detection already running"}
    
    state.is_running = True
    state.current_status = "AWAKE"
    state.sleep_counter = 0
    
    thread = threading.Thread(target=simulate_detection_loop, daemon=True)
    thread.start()
    
    return {"status": "success", "message": "Detection started"}

def stop_detection():
    """Stop detection"""
    state.is_running = False
    state.current_status = "IDLE"
    state.sleep_counter = 0
    return {"status": "success", "message": "Detection stopped"}

class DetectionHandler(BaseHTTPRequestHandler):
    """HTTP request handler"""
    
    def do_GET(self):
        """Handle GET requests"""
        path = urlparse(self.path).path
        
        if path == '/api/detection/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({"status": "healthy", "service": "detection_mock"})
            self.wfile.write(response.encode())
            
        elif path == '/api/detection/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps(get_status_dict())
            self.wfile.write(response.encode())
            
        elif path == '/api/detection/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            config = {
                "alarm_threshold": int(os.getenv("ALARM_THRESHOLD", 15)),
                "confidence_threshold": float(os.getenv("CONFIDENCE_THRESHOLD", 0.5)),
                "mode": "MOCK - No real camera or AI"
            }
            response = json.dumps(config)
            self.wfile.write(response.encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle POST requests"""
        path = urlparse(self.path).path
        
        if path == '/api/detection/start':
            result = start_detection()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps(result)
            self.wfile.write(response.encode())
            
        elif path == '/api/detection/stop':
            result = stop_detection()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps(result)
            self.wfile.write(response.encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Suppress logging"""
        pass

def run_server(port=5001):
    """Run the HTTP server"""
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, DetectionHandler)
    
    print("\n" + "="*60)
    print("[DETECTION] DROWSINESS DETECTION SERVICE - MOCK")
    print("="*60)
    print(f"[OK] Service on port: {port}")
    print(f"[OK] Mode: Mock with standard library only")
    print(f"[OK] No external dependencies required")
    print("="*60 + "\n")
    sys.stdout.flush()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[DETECTION] Server shutdown")
        httpd.server_close()

if __name__ == '__main__':
    port = int(os.getenv("DETECTION_SERVICE_PORT", 5001))
    run_server(port)

