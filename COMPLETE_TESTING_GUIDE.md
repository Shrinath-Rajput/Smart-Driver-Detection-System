# 🧪 COMPLETE TESTING GUIDE

## Prerequisites

✅ Python 3.8+ installed  
✅ Node.js 14+ installed  
✅ MySQL running  
✅ Virtual environment activated  
✅ Dependencies installed  

---

## Phase 1: Environment Setup

### 1.1 Activate Python Environment
```powershell
# Windows
cd "d:\e drive\Only_Project\Driver Drowness Detection"
.\.venv\Scripts\Activate.ps1

# Verify
python --version  # Should show 3.x.x
```

### 1.2 Verify Required Packages
```bash
pip list | grep -E "tensorflow|opencv|flask|flask-cors"
```

Expected output includes:
- tensorflow (or keras)
- opencv-python
- Flask
- Flask-CORS

### 1.3 Check Model File
```powershell
Test-Path -Path "artifacts/drowsiness_model.h5"
```

Expected: `True`

If missing, download from your model storage.

---

## Phase 2: Database Setup

### 2.1 Initialize MySQL Database
```bash
cd Backend
node db/setup.js
```

Expected output:
```
✓ Database initialized
✓ Tables created
```

### 2.2 Insert Test Driver
```bash
mysql -u root -p drowsiness_detection
```

```sql
INSERT INTO driver_status (driver_id, status, confidence)
VALUES ('DRIVER_001', 'AWAKE', 0.0);

INSERT INTO owner_contacts (driver_id, owner_name, phone_number)
VALUES ('DRIVER_001', 'Test Driver', '+91-9876543210');
```

---

## Phase 3: Flask Service Test

### 3.1 Start Detection Service (Separate Terminal)
```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run detection service
python src/Detection/detection_service.py
```

Expected output:
```
✓ Starting AI Detection Service...
✓ Backend URL: http://localhost:5000
✓ Driver ID: DRIVER_001
✓ Running on http://127.0.0.1:5001
```

### 3.2 Test Flask Health Check (New Terminal)
```powershell
curl http://127.0.0.1:5001/api/detection/health
```

Expected response:
```json
{
  "status": "healthy",
  "detection_running": false,
  "models_loaded": true
}
```

✅ If you see this, Flask is working!

### 3.3 Test Config Endpoint
```powershell
curl http://127.0.0.1:5001/api/detection/config
```

Expected:
```json
{
  "alarm_threshold": 150,
  "confidence_threshold": 0.5,
  "camera_index": 0,
  "frame_check_interval": 100
}
```

---

## Phase 4: Node.js Backend Test

### 4.1 Install Dependencies (If Not Done)
```bash
cd Backend
npm install
```

### 4.2 Start Node.js Server
```bash
npm start
```

Expected output:
```
✓ Server listening on port 5000
✓ Database connected
```

### 4.3 Test Backend Health
```powershell
curl http://localhost:5000/api/v1/health
```

Should return: `{ "status": "ok" }`

### 4.4 Test Detection Endpoint (Through Node)
```powershell
$response = curl -Method POST http://localhost:5000/api/v1/detection/start -ContentType "application/json" -Body '{"driverId":"DRIVER_001"}'
$response | ConvertFrom-Json | Format-Output
```

Expected:
```json
{
  "success": true,
  "message": "Detection started successfully",
  "sessionId": "session_xxx",
  "driverId": "DRIVER_001",
  "pid": 12345
}
```

---

## Phase 5: Full UI Test

### 5.1 Open Browser
```
http://localhost:5000/analyze
```

### 5.2 Verify Page Loads
- ✅ Should see "Live Detection" page
- ✅ Status shows "🔴 Disconnected"
- ✅ Detection shows "Not Running"
- ✅ "START AI DETECTION" button visible

### 5.3 Click "START AI DETECTION"
Watch the browser console (F12 → Console tab):

**Expected logs**:
```
✓ Starting detection...
✓ Detection started: {sessionId: "session_...", driverId: "DRIVER_001", pid: 12345}
✓ Detection loop started...
✓ Video feed stream started
📊 Status: AWAKE | Confidence: 0.1% | Sleep Counter: 0
```

### 5.4 Verify Video Feed
- ✅ Camera video should appear
- ✅ Face detection boxes (if face visible)
- ✅ Eye detection boxes
- ✅ Status text overlay
- ✅ FPS counter in top-right

### 5.5 Monitor Live Updates
The page should update every 500ms with:
- Current status (AWAKE/DETECTING_DROWSINESS/EMERGENCY)
- Confidence percentage (0-100%)
- Sleep counter (seconds eyes closed)
- FPS value
- Face detected: YES/NO
- Eyes detected: YES/NO

---

## Phase 6: Drowsiness Simulation Test

### 6.1 Test AWAKE State
- Look at camera
- Keep eyes **OPEN** for 5 seconds
- Expected: Status = "AWAKE", Sleep Counter = 0, Confidence = low (20-40%)

### 6.2 Test SLEEPY State
- Look at camera
- **BLINK SLOWLY** or partially close eyes for 2-3 seconds
- Expected: Status changes to "DETECTING_DROWSINESS"
- Sleep counter increments: 1s, 2s, 3s...

### 6.3 Test EMERGENCY State
- **CLOSE EYES COMPLETELY** for 5+ seconds
- Expected sequence:
  1. Status: "DETECTING_DROWSINESS"
  2. Sleep Counter: 1s, 2s, 3s, 4s, 5s
  3. 🔔 ALARM SOUND plays
  4. Status: "EMERGENCY"
  5. Confidence: HIGH (80-95%)
  6. Red alert box appears

### 6.4 Verify Emergency Details
Alert box should show:
- "🚨 EMERGENCY!"
- "Driver drowsiness detected!"
- Location: "18.5204, 73.8567" (dummy GPS)
- Session ID
- Time triggered

### 6.5 Test Recovery
- **OPEN EYES**
- Expected:
  - Status: "AWAKE"
  - Sleep counter decrements
  - Alert clears
  - "✓ Eyes opened - Alert cleared" in logs

---

## Phase 7: Database Verification

### 7.1 Check Alert Was Saved
```bash
mysql -u root -p drowsiness_detection
```

```sql
SELECT * FROM alert_history 
WHERE driver_id = 'DRIVER_001' 
ORDER BY created_at DESC 
LIMIT 1;
```

Expected columns filled:
- `alert_type`: DROWSINESS_DETECTED
- `status`: EMERGENCY
- `confidence`: 0.85 (approx)
- `latitude`: 18.5204
- `longitude`: 73.8567
- `maps_link`: https://maps.google.com/?q=18.5204,73.8567
- `created_at`: Current timestamp

### 7.2 Check Driver Status Updated
```sql
SELECT * FROM driver_status 
WHERE driver_id = 'DRIVER_001';
```

Should show:
- `status`: AWAKE or EMERGENCY
- `confidence`: Last recorded value
- `latitude`, `longitude`: Updated
- `last_updated`: Recent timestamp

---

## Phase 8: Dashboard Verification

### 8.1 Navigate to Dashboard
```
http://localhost:5000/dashboard
```

### 8.2 Verify Real-Time Updates
Should see:
- ✅ Live stats for DRIVER_001
- ✅ Current status
- ✅ Confidence level
- ✅ Recent alerts
- ✅ Location map (if available)

### 8.3 View Alert History
```
http://localhost:5000/alerts
```

Should list:
- All emergency alerts
- Timestamps
- GPS locations
- Confidence scores
- Maps links

---

## Phase 9: Advanced Tests

### 9.1 Test Process Recovery
1. Start detection
2. Cause emergency (close eyes)
3. In system terminal, press CTRL+C on Flask service
4. Expected: Browser shows error, Node.js detects crash
5. Try to restart → Should work

### 9.2 Test Multiple Drivers
```powershell
# Add another driver
$body = '{"driver_id":"DRIVER_002","owner_name":"Test Driver 2","phone_number":"+919876543211"}'
curl -Method POST http://localhost:5000/api/v1/drivers -ContentType "application/json" -Body $body
```

### 9.3 Test SMS Alert (If Configured)
Set environment variable:
```powershell
$env:SEND_SMS = "true"
$env:TWILIO_ACCOUNT_SID = "your_sid"
$env:TWILIO_AUTH_TOKEN = "your_token"
$env:TWILIO_PHONE = "+1234567890"
```

Trigger emergency → SMS should be sent to driver contact

---

## Phase 10: Performance Monitoring

### 10.1 Monitor Flask Console
Watch for:
- ✅ Frame processing speed (FPS: 25-30)
- ✅ No import errors
- ✅ No TensorFlow crashes
- ✅ Memory usage stable

### 10.2 Monitor Node.js Console
Watch for:
- ✅ Detection status polls (every 500ms)
- ✅ No connection errors
- ✅ WebSocket broadcasts working
- ✅ Database queries successful

### 10.3 Check Resource Usage
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"} | Select-Object ProcessName, WorkingSet, CPU
```

---

## Troubleshooting Checklist

### If Video Feed Shows Black Screen
- [ ] Check: `http://127.0.0.1:5001/api/detection/health` responds
- [ ] Check: Camera is connected
- [ ] Check: No other app using camera
- [ ] Check: CAMERA_INDEX = 0 in config
- [ ] Fix: Restart Flask service

### If No Audio Alert
- [ ] Check: Browser console for errors
- [ ] Check: Speaker volume is on
- [ ] Check: Browser permissions allow audio
- [ ] Fix: Try Web Audio API alternatively

### If Database Not Updating
- [ ] Check: MySQL is running
- [ ] Check: Tables exist: `show tables;`
- [ ] Check: Driver exists: `SELECT * FROM driver_status;`
- [ ] Fix: Run `node db/setup.js` to reinitialize

### If Detection Won't Start
- [ ] Check: Python process started
- [ ] Check: Flask service is healthy (health endpoint)
- [ ] Check: No other app on port 5001
- [ ] Check: Virtual environment activated
- [ ] Check: Model file exists
- [ ] Fix: Kill existing processes: `taskkill /F /IM python.exe`

### If GPS Not Captured
- [ ] Check: `USE_DUMMY_GPS = True` in config
- [ ] Check: get_current_location() function exists
- [ ] Check: Backend received update
- [ ] Expected: GPS always available (dummy location: Pune)

---

## Success Criteria

✅ **Phase 1**: Flask service starts without import errors  
✅ **Phase 2**: Health check returns healthy  
✅ **Phase 3**: Node.js server running on port 5000  
✅ **Phase 4**: UI loads and shows "START AI DETECTION"  
✅ **Phase 5**: Video feed appears when detection starts  
✅ **Phase 6**: Alarm triggers on eye closure  
✅ **Phase 7**: Alert saved to database  
✅ **Phase 8**: Dashboard updates in real-time  
✅ **Phase 9**: Recovery works properly  
✅ **Phase 10**: No crashes or warnings  

---

## Quick Start Command Reference

```powershell
# Terminal 1: Flask Service
cd "d:\e drive\Only_Project\Driver Drowness Detection"
.\.venv\Scripts\Activate.ps1
python src/Detection/detection_service.py

# Terminal 2: Node.js Backend
cd Backend
npm start

# Terminal 3: Browser
Start-Process "http://localhost:5000/analyze"
```

That's it! Everything else is automatic! 🚀
