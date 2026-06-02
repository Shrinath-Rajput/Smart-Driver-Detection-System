# 🔧 Complete Integration Guide - AI Detection System

## Overview

This guide explains how the Node.js backend, Python AI detection service, and frontend are now fully integrated into a single, cohesive system.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB BROWSER (Frontend)                    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Analyze Page (HTML/CSS/JavaScript)                      │   │
│  │  - Displays real-time detection status                   │   │
│  │  - Shows confidence, eye detection, sleep counter        │   │
│  │  - Control buttons (Start/Stop/Restart)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                      │               │
│           │ HTTP Requests                        │ WebSocket    │
│           │ /api/v1/detection/*                  │ Events       │
│           ▼                                      ▼               │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               NODE.JS BACKEND (Port 5000)                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Express Server with Routes                             │    │
│  │  - /api/v1/detection/start   → Spawn Python process    │    │
│  │  - /api/v1/detection/stop    → Kill Python process     │    │
│  │  - /api/v1/detection/status  → Get AI detection status │    │
│  │  - /api/v1/detection/update  → Receive from Python     │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Detection Manager                                      │    │
│  │  - Spawns/kills Python process (child_process)         │    │
│  │  - Manages process lifecycle                           │    │
│  │  - Handles process output/errors                       │    │
│  │  - Polls Python service for status                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  WebSocket (Socket.IO)                                 │    │
│  │  - Real-time status updates to frontend                │    │
│  │  - Detection start/stop events                         │    │
│  │  - Emergency alerts                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Database & Other Services                             │    │
│  │  - Save alerts to MySQL                                │    │
│  │  - SMS notifications (Twilio)                          │    │
│  │  - GPS location tracking                               │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           │
                HTTP (port 5001)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           PYTHON AI DETECTION SERVICE (Port 5001)                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Flask HTTP API Server                                 │    │
│  │  - /api/detection/start   → Start detection loop       │    │
│  │  - /api/detection/stop    → Stop detection             │    │
│  │  - /api/detection/status  → Get current status         │    │
│  │  - /api/detection/health  → Health check               │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Frame Processing Loop (Threaded)                      │    │
│  │  - Capture frames from camera                          │    │
│  │  - Face detection (Haar Cascade)                       │    │
│  │  - Eye detection (Haar Cascade)                        │    │
│  │  - CNN model prediction (drowsiness)                   │    │
│  │  - Sleep counter logic                                 │    │
│  │  - Emergency alert trigger                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  State Management                                       │    │
│  │  - Current detection status                            │    │
│  │  - Confidence score                                    │    │
│  │  - Face/Eye detection flags                            │    │
│  │  - GPS location (dummy)                                │    │
│  │  - Alert triggers                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  External Services                                      │    │
│  │  - Camera access (OpenCV)                              │    │
│  │  - Deep Learning (TensorFlow/Keras)                    │    │
│  │  - GPS service (dummy)                                 │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 New Files Created

### Backend (Node.js)

1. **`Backend/routes/detection.js`** - Detection control endpoints
   - Start/stop detection
   - Get detection status
   - Handle detection updates from Python

2. **`Backend/services/detection-manager.js`** - Process management
   - Spawn Python process
   - Manage process lifecycle
   - Poll for status updates
   - Emit events to WebSocket

3. **`Backend/utils/logging.js`** - Centralized logging
   - Console and file logging
   - Color-coded output

4. **`Backend/public/js/analyze-integrated.js`** - Frontend integration
   - WebSocket connection
   - Detection control (start/stop)
   - Real-time status updates
   - Emergency alert handling

### Python (AI Detection)

1. **`src/Detection/detection_service.py`** - Flask-based detection service
   - HTTP API server
   - Frame processing loop
   - Model loading and prediction
   - Status management
   - Backend communication

### Updated Files

1. **`Backend/app.js`** - Integrated WebSocket and detection routes
2. **`Backend/views/analyze.ejs`** - Updated HTML with new controls
3. **`Backend/.env`** - Added detection configuration
4. **`requirements.txt`** - Added Flask dependencies

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Python 3.7+ installed
- MySQL database running
- All packages installed

### Installation

1. **Install Node.js dependencies:**
   ```bash
   cd Backend
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   # Update Backend/.env with your settings
   - DB credentials
   - SMS settings (Twilio)
   - Detection parameters
   ```

4. **Initialize database:**
   ```bash
   cd Backend
   npm run init-db  # Or check db/setup.js
   ```

### Running the System

#### **Option 1: Run Everything with `nodemon app.js`** (Recommended)

```bash
cd Backend
npm run dev
```

This single command will:
1. Start the Node.js backend on port 5000
2. Serve the website at http://localhost:5000
3. Be ready to automatically start Python detection on demand

#### **Option 2: Run Services Separately**

**Terminal 1 - Start Node.js Backend:**
```bash
cd Backend
npm run dev
```

The backend is now ready and listening on port 5000.

**Terminal 2 - Python detection will start automatically**
When you click "Start AI Detection" on the website, the backend will automatically spawn the Python process.

---

## 📱 Using the System

### Step 1: Open the Analyze Page
```
http://localhost:5000/analyze?driver_id=DRIVER_001
```

### Step 2: Click "Start AI Detection"

This will:
1. Call `/api/v1/detection/start` on the backend
2. Backend spawns Python process
3. Python process connects to camera
4. Frontend receives WebSocket events
5. Real-time status updates begin

### Step 3: Monitor Detection

The dashboard shows:
- **Status Circle**: Current state (AWAKE, DROWSY, EMERGENCY)
- **Confidence**: Percentage drowsiness confidence
- **Sleep Counter**: Seconds eyes have been closed
- **Face/Eye Detected**: Boolean flags
- **FPS**: Frames per second
- **Location**: GPS coordinates (if available)

### Step 4: Emergency Alert

When eyes are closed for 5+ seconds:
1. 🔔 Alarm beeps
2. Status changes to "EMERGENCY"
3. Alert is saved to database
4. SMS is sent (if configured)
5. Location is captured
6. Dashboard updates in real-time

### Step 5: Stop Detection

Click "Stop Detection" to:
1. Stop the Python process
2. Release camera access
3. Stop real-time updates
4. Clear session

---

## 🔌 API Endpoints

### Detection Control

#### Start Detection
```
POST /api/v1/detection/start
Content-Type: application/json

{
  "driverId": "DRIVER_001"
}

Response: { success: true, sessionId: "...", pid: 12345 }
```

#### Stop Detection
```
POST /api/v1/detection/stop
Content-Type: application/json

Response: { success: true, message: "Detection stopped" }
```

#### Get Status
```
GET /api/v1/detection/status

Response: {
  success: true,
  data: {
    is_running: true,
    current_status: "AWAKE",
    confidence: 0.234,
    sleep_counter: 0,
    face_detected: true,
    eyes_detected: true,
    fps: 25.5,
    latitude: 40.7128,
    longitude: -74.0060,
    alert_triggered: false,
    last_update: "2024-01-01T12:00:00Z"
  }
}
```

#### Update Detection Data (from Python)
```
POST /api/v1/detection/update
Content-Type: application/json

{
  "driverId": "DRIVER_001",
  "sessionId": "...",
  "status": "AWAKE",
  "confidence": 0.234,
  "sleepCounter": 0,
  "faceDetected": true,
  "eyesDetected": true,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "alertTriggered": false,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## 🌐 WebSocket Events

### Client → Server

```javascript
// Start detection
socket.emit('detection:start', { driverId: 'DRIVER_001' });

// Stop detection
socket.emit('detection:stop');
```

### Server → Client

```javascript
// Status update
socket.on('detection:status-update', (status) => { ... });

// Session started
socket.on('detection:session-started', (data) => { ... });

// Session stopped
socket.on('detection:session-stopped', (data) => { ... });

// Emergency alert
socket.on('detection:alert', (alert) => { ... });

// Error
socket.on('detection:error', (error) => { ... });

// Process crashed
socket.on('detection:crashed', (data) => { ... });
```

---

## 🔄 Complete Workflow

```
User Opens Website
        ↓
Clicks "Start AI Detection" Button
        ↓
Frontend calls POST /api/v1/detection/start
        ↓
Node.js Detection Manager receives request
        ↓
Spawns Python process (detection_service.py)
        ↓
Python service starts Flask server (port 5001)
        ↓
Python service initializes:
  - Loads CNN model
  - Loads face/eye cascades
  - Starts frame capture from camera
        ↓
Frontend WebSocket receives 'detection:session-started'
        ↓
Python frame processing loop starts:
  - Capture frame from camera
  - Detect faces (Haar Cascade)
  - Detect eyes (Haar Cascade)
  - Run CNN prediction
  - Update status
  - Send to backend
        ↓
Node.js Detection Manager polls Python status every 500ms
        ↓
Python service returns current status via HTTP
        ↓
Detection Manager emits WebSocket 'detection:status-update' event
        ↓
Frontend receives update and refreshes UI
        ↓
If eyes closed for 5+ seconds:
  - Status changes to "EMERGENCY"
  - Play alarm sound
  - Capture GPS location
  - Save alert to database
  - Send SMS notification
  - Emit 'detection:alert' event
        ↓
Frontend displays emergency alert popup
        ↓
User clicks "Stop Detection"
        ↓
Frontend calls POST /api/v1/detection/stop
        ↓
Node.js kills Python process
        ↓
Python process cleans up and exits
        ↓
Frontend WebSocket receives 'detection:session-stopped'
        ↓
UI returns to idle state
```

---

## ⚙️ Configuration

All settings are in `.env` file:

```env
# Detection Parameters
ALARM_THRESHOLD=15                    # Seconds before emergency alert
CONFIDENCE_THRESHOLD=0.5              # Model confidence threshold (0-1)
CAMERA_INDEX=0                        # Webcam index (0 = default)
FRAME_CHECK_INTERVAL=100              # Check every N frames

# URLs
BACKEND_URL=http://localhost:5000     # Backend URL for Python to report
PORT=5000                             # Node.js port

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=drowsiness_detection

# Features
SEND_SMS=false                        # Enable/disable SMS alerts
USE_DUMMY_GPS=true                    # Use dummy GPS or real
```

---

## 🐛 Troubleshooting

### Python process not starting?

1. Check if port 5001 is available
2. Verify Python is installed: `python --version`
3. Check logs in `Backend/logs/app.log`

### Camera not detected?

1. Verify camera works in other apps
2. Check `CAMERA_INDEX` in `.env` (try 0, 1, 2)
3. Grant camera permissions to browser

### No real-time updates?

1. Check WebSocket connection (see browser console)
2. Verify Python service is running (check port 5001)
3. Check browser console for errors

### SMS not working?

1. Set `SEND_SMS=true` in `.env`
2. Configure Twilio credentials
3. Check phone number format

---

## 📊 Database Schema

The system creates these tables automatically:

- **driver_status** - Current driver status
- **alerts** - Alert history
- **alert_history** - All alerts with timestamps
- **gps_logs** - GPS location history

---

## 🎯 Key Features

✅ **Fully Automated** - No manual Python commands needed
✅ **Real-time Updates** - WebSocket for instant feedback
✅ **Robust Process Management** - Auto-restart on crash
✅ **Emergency Alerts** - Alarm + SMS + Database
✅ **GPS Integration** - Location capture on alert
✅ **Responsive UI** - Modern dashboard with live metrics
✅ **Production Ready** - Error handling and logging

---

## 📝 Notes

- The Python process runs on **port 5001** (Flask server)
- The Node.js server runs on **port 5000** (Express + WebSocket)
- Detection status is polled every **500ms**
- Sleep counter increments every frame (~25fps = ~40ms)
- Alarm triggers after **15 seconds** of consecutive eye closure (configurable)

---

## 🎓 Understanding the Flow

1. **Frontend** - User interface in browser
2. **Node.js Backend** - HTTP API + WebSocket + Process Management
3. **Python Service** - AI detection engine with HTTP endpoint
4. **Database** - Persistence layer
5. **External Services** - SMS, GPS, Maps

Everything is now connected and works seamlessly with a single command!

---

## Next Steps

1. Run `npm install` in Backend directory
2. Run `pip install -r requirements.txt`
3. Configure `.env` file
4. Run `npm run dev`
5. Open browser to http://localhost:5000/analyze
6. Click "Start AI Detection"
7. Watch the magic happen! 🎉

