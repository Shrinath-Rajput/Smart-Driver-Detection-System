# 🚀 Smart Driver Drowsiness Detection - Complete Startup Guide

## System Architecture Overview

```
📱 Web Dashboard (http://localhost:5000)
         ↑
         │ HTTP Requests (Real-time data)
         ↓
🖥️  Node.js Backend (Port 5000)
         ↑
         │ HTTP POST (Alerts)
         ↓
🐍 Python Detection System
    ├─ OpenCV Face Detection
    ├─ Eye Detection  
    ├─ CNN Prediction (98.55% accuracy)
    ├─ GPS Tracking
    └─ SMS Alert Handler
         ↓
💾 MySQL Database
```

---

## 📋 Pre-Flight Checklist

Before starting, ensure you have:

- [ ] Python 3.8+ installed (`python --version`)
- [ ] Node.js 14+ installed (`node --version`)
- [ ] MySQL Server installed and running
- [ ] Git installed
- [ ] Webcam connected (or USB camera)
- [ ] Internet connection (for SMS and Maps)
- [ ] All requirements installed (`pip install -r requirements.txt`)

---

## 🎯 Complete Startup Process

### **STEP 1: Verify Environment (5 minutes)**

#### 1.1 Open PowerShell as Administrator
```powershell
# Check Python
python --version
# Expected: Python 3.x.x

# Check Node.js  
node --version
# Expected: v14.x.x or higher

# Check npm
npm --version
# Expected: 6.x.x or higher
```

#### 1.2 Verify MySQL is Running
```powershell
# Test MySQL connection
mysql -u root -p
# Enter your password

# If successful, you should see mysql> prompt
# Type "exit" to quit
```

#### 1.3 Navigate to Project
```powershell
cd "d:\e drive\Only_Project\Driver Drowness Detection"
```

---

### **STEP 2: Configure Environment Files (3 minutes)**

#### 2.1 Backend Configuration (`Backend/.env`)
```env
# Backend/.env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=drowsiness_detection

# Twilio (OPTIONAL - for SMS alerts)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

#### 2.2 Python Configuration (`.env` in root)
```env
# Root .env
BACKEND_URL=http://localhost:5000
DRIVER_ID=DRIVER_001
DRIVER_NAME=Test Driver
ALARM_THRESHOLD=15
CONFIDENCE_THRESHOLD=0.5
GPS_UPDATE_INTERVAL=5000
USE_DUMMY_GPS=True
DISPLAY_ENABLED=True
GEMINI_API_KEY=AQ.Ab8RN6LwbJ63yF5_CPFga1270vIt3uazDxMv9vK0mh_uK7xyFA
```

---

### **STEP 3: Install Dependencies (5 minutes)**

#### 3.1 Python Dependencies
```powershell
# In root directory
pip install -r requirements.txt

# Wait for installation to complete
# You should see: "Successfully installed ..."
```

#### 3.2 Node Dependencies
```powershell
cd Backend
npm install

# Wait for npm to finish
# You should see: "added X packages"

# Go back to root
cd ..
```

---

### **STEP 4: Database Setup (3 minutes)**

#### 4.1 Start the Backend
```powershell
cd Backend
npm run dev
```

**Expected Output:**
```
✓ Database initialized
✓ Database schema initialized
✓ Server Running On Port 5000
✓ http://localhost:5000
```

**Note:** The database and tables are created automatically on first run.

#### 4.2 Verify Database Creation
```powershell
# Open new PowerShell window
mysql -u root -p

# Enter your MySQL password
# Then run:
USE drowsiness_detection;
SHOW TABLES;

# You should see:
# +--------------------------------+
# | Tables_in_drowsiness_detection |
# +--------------------------------+
# | alert_history                  |
# | alert_settings                 |
# | driver_status                  |
# | owner_contacts                 |
# +--------------------------------+

# Exit
EXIT;
```

---

### **STEP 5: Start Backend Server (Keep Running)**

#### 5.1 Terminal 1 - Backend Server
```powershell
# Navigate to project root
cd "d:\e drive\Only_Project\Driver Drowness Detection"

# Go to Backend folder
cd Backend

# Start development server
npm run dev
```

**Expected Output:**
```
> driver-drowsiness-detection-backend@1.0.0 dev
> nodemon app.js

[nodemon] 3.1.0
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,json

✓ Database initialized
✓ Database schema initialized
✓ Server Running On Port 5000
✓ Dashboard: http://localhost:5000/dashboard?driver_id=DRIVER_001
```

**✅ Keep this terminal running!**

---

### **STEP 6: Start Python Detection (Keep Running)**

#### 6.1 Terminal 2 - Python Detection System
```powershell
# Navigate to project root
cd "d:\e drive\Only_Project\Driver Drowness Detection"

# Activate virtual environment (if using venv)
.\.venv\Scripts\Activate.ps1

# Start detection system
python -m src.Detection.detect_drowsiness
```

**Expected Output:**
```
✓ Model loaded from artifacts/drowsiness_model.h5
✓ GPS Tracker initialized
📍 GPS Tracker initialized
📱 SMS Alert Handler initialized
✓ Camera opened (Index: 0)
🚗 Smart Driver Drowsiness Detection Started

# Continuous output:
✓ Alert sent to backend - Status: AWAKE
✓ GPS location updated: 18.5204, 73.8567
```

**✅ Keep this terminal running!**

---

### **STEP 7: Access Dashboard**

#### 7.1 Open Browser
Open your web browser and go to:
```
http://localhost:5000
```

#### 7.2 Home Page
You should see the beautiful home page with:
- System title
- Feature cards
- "Launch Dashboard" button

#### 7.3 Dashboard
Click "Launch Dashboard" or go directly to:
```
http://localhost:5000/dashboard?driver_id=DRIVER_001
```

**Dashboard Features:**
- ✅ Real-time status (AWAKE/SLEEPY)
- ✅ Confidence percentage
- ✅ Alert history (last 5)
- ✅ Statistics (24h data)
- ✅ Location with Google Maps
- ✅ Auto-refresh every 3 seconds

---

## 🧪 Testing the System

### **Test 1: Verify API is Working**

```powershell
# Open another PowerShell window
# Test health check
curl http://localhost:5000/health

# Expected:
# {"success":true,"message":"Server is running","timestamp":"..."}
```

### **Test 2: Send Manual Alert**

```powershell
# Send a test alert
curl -X POST http://localhost:5000/api/alerts `
  -H "Content-Type: application/json" `
  -d @{
    driver_id = "DRIVER_001"
    status = "SLEEPY"
    confidence = 0.95
    latitude = 18.5204
    longitude = 73.8567
    alarm_triggered = $true
  } | ConvertTo-Json

# Check dashboard - alert should appear!
```

### **Test 3: Add Owner Contact (for SMS)**

```powershell
curl -X POST http://localhost:5000/api/sms/contact/add `
  -H "Content-Type: application/json" `
  -d @{
    driver_id = "DRIVER_001"
    owner_name = "John Doe"
    phone_number = "+1234567890"
    email = "john@example.com"
  } | ConvertTo-Json
```

### **Test 4: Get Dashboard Data**

```powershell
# Get all dashboard data
curl http://localhost:5000/api/dashboard/DRIVER_001

# Expected: Full driver data with alerts and stats
```

---

## 📊 Real System Behavior

### **When Drowsiness Detected:**

1. **Python System** 🐍
   - Detects closed eyes
   - Increases sleep_counter
   - If counter > 15 frames → triggers alarm
   - Sends POST to backend

2. **Node.js Backend** 🖥️
   - Receives alert
   - Stores in `alert_history` table
   - Updates `driver_status` table
   - Sends SMS (if configured)

3. **Database** 💾
   - Records alert with:
     - Driver ID
     - Status (SLEEPY)
     - Confidence level
     - GPS location
     - Timestamp

4. **Web Dashboard** 📱
   - Fetches data every 3 seconds
   - Updates status display
   - Shows alert in history
   - Displays location on map

---

## 🔄 Complete Data Flow Example

```
Time: 10:30:00

[Python Detection]
└─ Eye closed detected
└─ Confidence: 0.92
└─ Sleep counter: 15 (threshold reached!)
└─ Sends POST to http://localhost:5000/api/alerts

[Node.js Backend]
└─ Receives alert
└─ Queries GPS tracker data (18.5204, 73.8567)
└─ Stores in alert_history:
   - driver_id: DRIVER_001
   - status: SLEEPY
   - confidence: 0.92
   - latitude: 18.5204
   - longitude: 73.8567
   - created_at: 2026-06-02 10:30:00
└─ Returns: {"success": true, "alert_id": 1}

[GPS Tracker]
└─ Updates driver_status with location

[SMS Handler]
└─ Gets owner contacts from DB
└─ Sends SMS to +1234567890 with location link

[Web Dashboard]
└─ Auto-refreshes at 10:30:03 (3 second interval)
└─ Fetches /api/dashboard/DRIVER_001
└─ Updates display:
   - Status badge: SLEEPY (red)
   - Confidence: 92%
   - Alert history: Shows new alert
   - Location: Shows on map
   - Statistics: Updates counts
```

---

## 🛠️ Troubleshooting

### **Problem: "Camera not found"**
```
Solution:
1. Check if webcam is connected
2. Try another camera index in .env (CAMERA_INDEX=0,1,2)
3. Ensure no other app is using the camera
```

### **Problem: "Cannot connect to MySQL"**
```
Solution:
1. Start MySQL: Services → MySQL80 → Start
2. Check credentials in Backend/.env
3. Test: mysql -u root -p
4. Restart npm backend after fixing
```

### **Problem: "Backend not responding"**
```
Solution:
1. Kill any process on port 5000: netstat -ano | findstr :5000
2. Delete node_modules and reinstall: npm install
3. Check npm run dev output for errors
4. Ensure .env variables are correct
```

### **Problem: "Dashboard shows 'ERROR'"**
```
Solution:
1. Check browser console (F12 → Console tab)
2. Verify backend is running (check Terminal 1)
3. Verify driver_id matches in URL
4. Check API response: curl http://localhost:5000/api/dashboard/DRIVER_001
```

### **Problem: "Detection script crashes"**
```
Solution:
1. Ensure model file exists: artifacts/drowsiness_model.h5
2. Check all dependencies: pip install -r requirements.txt
3. Verify Python environment
4. Check logs in logs/drowsiness_detection.log
```

---

## 📈 Performance Optimization

### **For Better Performance:**

1. **Close unnecessary applications** (to reduce CPU usage)
2. **Use dedicated GPU** (if available) - edit config for GPU support
3. **Adjust frame rate** - decrease FRAME_CHECK_INTERVAL for faster detection
4. **Reduce GPS update interval** - for more frequent location updates

### **Database Optimization:**

```sql
-- Add indexes for faster queries
CREATE INDEX idx_driver_id ON driver_status(driver_id);
CREATE INDEX idx_created_at ON alert_history(created_at DESC);
```

---

## 📱 SMS Configuration (Optional)

To enable SMS alerts:

1. **Create Twilio Account:** https://www.twilio.com
2. **Get Credentials:**
   - ACCOUNT_SID
   - AUTH_TOKEN
   - PHONE_NUMBER (your Twilio number)

3. **Update Backend/.env:**
```env
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_FROM_NUMBER=+1234567890
```

4. **Add Owner Contact:**
```powershell
curl -X POST http://localhost:5000/api/sms/contact/add `
  -H "Content-Type: application/json" `
  -d '{"driver_id":"DRIVER_001","owner_name":"John","phone_number":"+1234567890"}'
```

5. **Restart Backend** (npm run dev)

---

## 🎓 Key Configuration Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| ALARM_THRESHOLD | 15 | Frames before alarm triggers |
| CONFIDENCE_THRESHOLD | 0.5 | Drowsiness detection confidence (0-1) |
| GPS_UPDATE_INTERVAL | 5000 | GPS update frequency (ms) |
| REFRESH_INTERVAL | 3000 | Dashboard refresh rate (ms) |
| ALERT_COOLDOWN | 300 | Min seconds between alerts |

---

## ✅ Verification Checklist

After startup, verify:

- [ ] Terminal 1: Backend running ("✓ Server Running On Port 5000")
- [ ] Terminal 2: Detection running ("🚗 Smart Driver Drowsiness Detection Started")
- [ ] Browser: Dashboard accessible (http://localhost:5000/dashboard)
- [ ] Dashboard shows current status
- [ ] Camera displays in detection window
- [ ] Database has tables (check MySQL)
- [ ] No errors in browser console (F12)
- [ ] Auto-refresh working (timestamp updates)

---

## 🚀 Ready to Run!

Your system is now ready. All components should be:
- ✅ Python detection connected to Node.js
- ✅ Node.js communicating with MySQL
- ✅ Dashboard fetching real-time data
- ✅ GPS tracker sending updates
- ✅ SMS alerts ready (if configured)

**To stop the system:**
1. Terminal 1: Press `Ctrl+C` (Backend)
2. Terminal 2: Press `Ctrl+C` (Detection)
3. Close browser tabs

**To start again:** Simply repeat STEP 5 & 6

---

## 📞 Support Resources

- **API Documentation:** See `API_DOCUMENTATION.md`
- **README:** See `README.md` for detailed info
- **Logs:** Check `logs/drowsiness_detection.log`
- **Database:** Check tables with MySQL Workbench

---

**Happy Monitoring! 🎉**
