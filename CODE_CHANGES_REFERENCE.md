# Exact Code Changes Summary

## 1. Real Detection Service (Not Mock)

**File**: `Backend/services/detection-manager.js`

```javascript
// BEFORE (Line 35):
const scriptPath = path.join(
    __dirname,
    '../../src/Detection/detection_service_mock.py'
);

// AFTER (Line 35):
const scriptPath = path.join(
    __dirname,
    '../../src/Detection/detection_service.py'
);
```

## 2. Emergency Threshold Configuration

**File**: `.env` (Root)
```env
# BEFORE:
ALARM_THRESHOLD=15

# AFTER:
ALARM_THRESHOLD=150
BACKEND_URL=http://localhost:5002
```

**File**: `Backend/.env`
```env
# BEFORE:
ALARM_THRESHOLD=15

# AFTER:
ALARM_THRESHOLD=150
```

**File**: `src/Config/config.py`
```python
# BEFORE:
ALARM_THRESHOLD = int(os.getenv("ALARM_THRESHOLD", "15"))

# AFTER:
ALARM_THRESHOLD = int(os.getenv("ALARM_THRESHOLD", "150"))  # ~5 seconds at 30 FPS
```

## 3. Video Streaming Infrastructure

**File**: `src/Detection/detection_service.py`

### Added Imports
```python
from flask import Flask, jsonify, request, Response  # Added Response

# Added get_frame_bytes function
import threading

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
```

### Added Video Stream Endpoint
```python
@app.route('/api/detection/video_feed', methods=['GET'])
def video_feed():
    """Stream video with OpenCV annotations as MJPEG"""
    def generate():
        while detection_state.is_running:
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
```

### Frame Annotation in Loop
```python
# In frame_processing_loop(), after detect_drowsiness():
font = cv2.FONT_HERSHEY_SIMPLEX
font_scale = 0.8
font_color = (0, 255, 0) if detection_state.current_status == "AWAKE" else ...

cv2.putText(frame, f"Status: {detection_state.current_status}", (10, 30), font, font_scale, font_color, 2)
cv2.putText(frame, f"Confidence: {confidence:.2%}", (10, 70), font, font_scale, (255, 255, 255), 2)
cv2.putText(frame, f"Eyes Closed: {detection_state.sleep_counter}/{Config.ALARM_THRESHOLD}s", (10, 110), font, font_scale, (255, 255, 255), 2)
cv2.putText(frame, f"Face: {'YES' if face_detected else 'NO'} | Eyes: {'YES' if eyes_detected else 'NO'}", (10, 150), font, font_scale, (255, 255, 255), 2)
cv2.putText(frame, f"FPS: {detection_state.fps:.1f}", (frame.shape[1]-200, 30), font, font_scale, (255, 255, 255), 2)

# Store annotated frame for streaming
with frame_lock:
    current_frame = frame.copy()
```

## 4. SMS Alert Integration

**File**: `src/Detection/detection_service.py`

### Added SMS Alert Function
```python
def send_sms_alert(state: Dict):
    """Send SMS alert when emergency detected"""
    try:
        import requests
        backend_url = f"{Config.BACKEND_URL}/api/v1/sms/alert"
        payload = {
            'driverId': state['driver_id'],
            'status': state['current_status'],
            'confidence': state['confidence'],
            'latitude': state['latitude'],
            'longitude': state['longitude'],
            'timestamp': state['last_update']
        }
        
        response = requests.post(backend_url, json=payload, timeout=5)
        
        if response.status_code == 200:
            logger.info(f"✓ SMS alert sent to backend")
        else:
            logger.warning(f"SMS alert failed: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error sending SMS alert: {e}")
```

### Call SMS Alert on Emergency
```python
# In frame_processing_loop(), when emergency triggered:
if detection_state.sleep_counter >= Config.ALARM_THRESHOLD:
    if not detection_state.alert_triggered:
        # ... existing code ...
        
        # Send SMS alert
        if not sms_alerted:
            threading.Thread(
                target=send_sms_alert,
                args=(detection_state.to_dict(),),
                daemon=True
            ).start()
            sms_alerted = True
```

## 5. SMS Alert Endpoint

**File**: `Backend/routes/sms.js`

### Added Alert Endpoint
```javascript
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
```

## 6. Frontend Video Stream Integration

**File**: `Backend/views/analyze.ejs`

```html
<!-- BEFORE: -->
<video id="liveVideo" style="width: 100%; height: auto; display: block;" autoplay></video>
<canvas id="canvas" style="display: none;"></canvas>
<p style="text-align: center; padding: 3rem; color: var(--gray);">
    <i class="fas fa-video"></i> Camera feed will appear here
</p>

<!-- AFTER: -->
<img id="liveVideo" style="width: 100%; height: auto; display: block; background: #000;" />
<canvas id="canvas" style="display: none;"></canvas>
<p id="videoPlaceholder" style="text-align: center; padding: 3rem; color: var(--gray);">
    <i class="fas fa-video"></i> Camera feed will appear here
</p>
```

## 7. Frontend Analysis Page Updates

**File**: `Backend/public/js/analyze.js`

### Updated startDetection()
```javascript
async function startDetection() {
    try {
        analysisState.isMonitoring = true;
        console.log('Starting detection for driver:', analysisConfig.driverId);

        // Start video stream from Python service using MJPEG
        const video = document.getElementById('liveVideo');
        const placeholder = document.getElementById('videoPlaceholder');
        
        if (video && placeholder) {
            // Set the source to the MJPEG stream endpoint
            video.src = 'http://localhost:5001/api/detection/video_feed?t=' + Date.now();
            video.onerror = function() {
                console.error('Error loading video stream');
            };
            placeholder.style.display = 'none';
        }

        // Start polling for status updates
        startStatusPolling();
        
        // Show recording indicator
        document.getElementById('recordingIndicator').style.display = 'inline';

        // Update UI
        updateDetectionUI('MONITORING');

    } catch (error) {
        console.error('Error starting detection:', error);
        alert('Error starting detection: ' + error.message);
        analysisState.isMonitoring = false;
    }
}
```

### Added Status Polling and Socket.io
```javascript
function startStatusPolling() {
    // Poll for status updates every second
    if (analysisState.updateInterval) {
        clearInterval(analysisState.updateInterval);
    }

    analysisState.updateInterval = setInterval(async () => {
        if (!analysisState.isMonitoring) return;

        try {
            const response = await fetch('http://localhost:5001/api/detection/status', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const status = await response.json();
                updateAnalysisUI(status);
            }
        } catch (error) {
            console.warn('Error polling detection status:', error);
        }
    }, 1000); // Poll every 1 second
}

// Added Socket.io initialization
function initializeSocketIO() {
    try {
        const socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('Socket.io connected - ID:', socket.id);
        });

        socket.on('detection:update', (data) => {
            console.log('Detection update received via Socket.io:', data);
            if (analysisState.isMonitoring) {
                updateAnalysisUI(data);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.io disconnected');
        });

        analysisState.socket = socket;
    } catch (error) {
        console.warn('Socket.io initialization failed:', error);
    }
}
```

### Updated updateAnalysisUI()
```javascript
function updateAnalysisUI(result) {
    if (!result) return;

    // Map Python service status to UI status
    let uiStatus = result.current_status || 'MONITORING';
    
    if (uiStatus === 'DETECTING_DROWSINESS') {
        uiStatus = 'SLEEPY';
    } else if (uiStatus === 'DETECTING') {
        uiStatus = 'SLEEPY';
    }

    // Update status
    updateDetectionUI(uiStatus);

    // Update confidence
    const confidence = (result.confidence * 100 || 0).toFixed(1);
    document.getElementById('liveConfidence').textContent = confidence;

    // Update gauge
    updateLiveGauge(confidence);

    // Update sleep counter display
    const sleepCounter = result.sleep_counter || 0;
    document.getElementById('sleepCounter').textContent = sleepCounter;

    // Update face and eyes detection indicators
    const faceElement = document.getElementById('faceDetected');
    const eyesElement = document.getElementById('eyesDetected');
    
    if (faceElement) {
        faceElement.textContent = result.face_detected ? '✓ YES' : '✗ NO';
        faceElement.style.color = result.face_detected ? '#00ff00' : '#ff0000';
    }
    if (eyesElement) {
        eyesElement.textContent = result.eyes_detected ? '✓ YES' : '✗ NO';
        eyesElement.style.color = result.eyes_detected ? '#00ff00' : '#ff0000';
    }

    // Log detection
    logDetection(uiStatus, confidence);

    // Trigger alarm if emergency
    if (uiStatus === 'EMERGENCY') {
        triggerEmergencyAlert(result);
    }
}
```

## 8. Dashboard Socket.io Integration

**File**: `Backend/public/js/dashboard.js`

### Added Socket.io Initialization
```javascript
function initializeSocketIO() {
    try {
        const socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('Socket.io connected - ID:', socket.id);
        });

        socket.on('detection:update', (data) => {
            console.log('Detection update received via Socket.io:', data);
            if (data.driverId === dashboardState.driverId) {
                updateDashboardWithDetectionData(data);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.io disconnected');
        });

        dashboardState.socket = socket;
    } catch (error) {
        console.warn('Socket.io initialization failed:', error);
    }
}
```

## Summary of Key Changes

| Component | Old Value | New Value | Reason |
|-----------|-----------|-----------|--------|
| Detection Service | `detection_service_mock.py` | `detection_service.py` | Real CNN predictions |
| ALARM_THRESHOLD | 15 frames | 150 frames | 5-second emergency window |
| BACKEND_URL | localhost:5000 | localhost:5002 | Correct Node backend port |
| Video Stream | Browser getUserMedia | Python MJPEG endpoint | OpenCV annotations |
| SMS Trigger | Never called | On emergency status | Alert notifications |
| Dashboard Updates | Polling 3s | Socket.io + polling 1s | Real-time updates |
| Video Element | `<video>` tag | `<img>` tag | MJPEG stream compatibility |

All changes maintain backward compatibility and don't break existing functionality.
