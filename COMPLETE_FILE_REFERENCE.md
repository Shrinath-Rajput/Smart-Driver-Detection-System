# 📋 Complete File Structure & References

## 📁 New Files Created

### Backend Configuration Files

#### `Backend/.env`
**Purpose:** Database and Twilio configuration  
**Contains:**
- Database credentials (MySQL)
- Twilio SMS API keys
- Google Maps API key
- Detection thresholds

#### `Backend/config/config.js`
**Purpose:** Centralized configuration loader  
**Exports:** All config parameters used throughout backend

---

### Database Files

#### `Backend/db/setup.js`
**Purpose:** Database connection pool and initialization  
**Functions:**
- Creates MySQL connection pool
- Initializes database
- Executes schema

#### `Backend/db/schema.sql`
**Purpose:** Complete database schema  
**Tables Created:**
- `driver_status` - Current driver status
- `alert_history` - Drowsiness alert records
- `owner_contacts` - Vehicle owner contact info
- `alert_settings` - Driver-specific settings

---

### Model Files

#### `Backend/models/Driver.js`
**Purpose:** Driver status management  
**Methods:**
- `getStatus()` - Get driver's current status
- `updateStatus()` - Update driver status/location
- `getAllActive()` - Get all active drivers
- `deactivate()` - Mark driver as inactive

#### `Backend/models/Alert.js`
**Purpose:** Alert history management  
**Methods:**
- `create()` - Create new alert record
- `getHistory()` - Get alert history with limit
- `getRecentAlerts()` - Get 24-hour alerts
- `markSmsSent()` - Mark SMS as sent
- `getStats()` - Get statistics

#### `Backend/models/SMSAlert.js`
**Purpose:** SMS alert sending via Twilio  
**Methods:**
- `sendAlert()` - Send SMS to single contact
- `sendAlertToAllContacts()` - Send to all registered contacts
- `addContact()` - Add owner contact
- `getContacts()` - Get contacts for driver

---

### Route Files

#### `Backend/routes/alerts.js`
**Purpose:** Alert API endpoints  
**Endpoints:**
- `POST /api/alerts` - Receive alert from Python
- `GET /api/alerts/status/:id` - Get current status
- `GET /api/alerts/history/:id` - Get alert history
- `GET /api/alerts/recent/:id` - Get 24h alerts
- `GET /api/alerts/stats/:id` - Get statistics

#### `Backend/routes/dashboard.js`
**Purpose:** Dashboard data API  
**Endpoints:**
- `GET /api/dashboard/:id` - Complete dashboard data
- `GET /api/dashboard` - All active drivers

#### `Backend/routes/gps.js`
**Purpose:** GPS/Location API  
**Endpoints:**
- `POST /api/gps/update` - Update GPS location
- `GET /api/gps/location/:id` - Get last known location

#### `Backend/routes/sms.js`
**Purpose:** SMS management API  
**Endpoints:**
- `POST /api/sms/contact/add` - Add owner contact
- `GET /api/sms/contacts/:id` - Get contacts
- `POST /api/sms/test` - Send test SMS

---

### View Files

#### `Backend/views/dashboard.ejs`
**Purpose:** Main monitoring dashboard  
**Features:**
- Real-time status display (AWAKE/SLEEPY)
- Confidence percentage
- Alert history (last 5)
- 24-hour statistics
- Location with Google Maps
- Auto-refresh every 3 seconds
- Professional Bootstrap UI

#### `Backend/views/index.ejs`
**Purpose:** Landing/home page  
**Features:**
- Hero section with animation
- Feature cards
- Dashboard launch button
- Beautiful gradient background

#### `Backend/views/location.ejs`
**Purpose:** Location details page  
**Features:**
- Latitude/Longitude display
- Google Maps link
- Last update timestamp
- Back to dashboard button

---

### Updated Backend Files

#### `Backend/app.js` (UPDATED)
**Changes:**
- Added database initialization
- Integrated all route files
- Added health check endpoint
- Added error handling middleware
- Added CORS support
- Dynamic dashboard data from database

#### `Backend/package.json` (UPDATED)
**Added Dependencies:**
- `cors` - Enable cross-origin requests
- `dotenv` - Environment variable loading
- `twilio` - SMS service

---

### Python Configuration

#### `src/Config/config.py` (NEW)
**Purpose:** Centralized Python configuration  
**Contains:**
- Backend URL
- Driver settings
- Detection parameters
- GPS settings
- Logging configuration
- Model path
- API keys (including Gemini)

---

### Python Detection System

#### `src/Detection/detect_drowsiness.py` (UPDATED)
**Major Changes:**
- Backend HTTP POST integration
- GPS tracker initialization
- SMS alert handler integration
- Real-time alert sending
- Logging system
- Automatic status updates
- Alert cooldown mechanism
- Professional output formatting

**New Features:**
- Sends status to backend every 100 frames
- Sends drowsiness alerts with 5-minute cooldown
- Includes GPS location in alerts
- Integrates with SMS handler
- Better error handling

#### `src/Detection/gps_tracker.py` (NEW)
**Purpose:** GPS location tracking  
**Features:**
- Periodic GPS updates to backend
- Dummy GPS for testing (random coordinates around Pune)
- Real GPS integration support
- Background thread operation
- Google Maps link generation
- Configurable update interval

#### `src/Detection/sms_alert.py` (NEW)
**Purpose:** SMS alert handling  
**Features:**
- Send SMS via backend Twilio integration
- Alert cooldown to prevent spam
- Includes location and timestamp
- Request error handling
- Graceful fallback if requests unavailable

---

### Environment Files

#### `.env` (ROOT - NEW)
**Purpose:** Python system configuration  
**Contains:**
- Backend URL
- Driver ID and name
- Detection thresholds
- GPS settings
- Logging paths
- Gemini API key
- Owner phone number

#### `requirements.txt` (UPDATED)
**Added:**
- `requests` - HTTP library for API calls
- `python-dotenv` - Environment variable loading

---

### Documentation Files

#### `README.md` (UPDATED)
**Includes:**
- Complete feature list
- Architecture diagram
- Quick start guide
- Database schema details
- API endpoint overview
- Troubleshooting guide
- Deployment instructions

#### `STARTUP_GUIDE.md` (NEW)
**Includes:**
- Step-by-step startup process
- Pre-flight checklist
- Configuration setup
- Database verification
- Testing procedures
- Troubleshooting solutions
- Data flow examples
- Performance optimization

#### `API_DOCUMENTATION.md` (NEW)
**Includes:**
- Complete API reference
- Request/response examples
- All 16 endpoints documented
- Error codes
- cURL testing examples
- Integration notes
- Data types reference

#### `COMPLETE_FILE_REFERENCE.md` (THIS FILE)
**Includes:**
- All file locations
- Purpose of each file
- Key functions/endpoints
- Integration points
- Quick lookup guide

---

## 🔗 Integration Points

### Python → Node.js Backend
```
detect_drowsiness.py
├─ send_alert_to_backend()
│  └─ POST http://localhost:5000/api/alerts
│
├─ get_gps_tracker()
│  └─ GPS location updates to /api/gps/update
│
└─ get_sms_handler()
   └─ SMS requests to /api/sms/test
```

### Frontend → Backend
```
dashboard.ejs
├─ refreshData()
│  └─ GET /api/dashboard/{driver_id}
│
└─ Auto-refresh every 3 seconds
```

### Database Flow
```
Python sends alert
→ Backend receives at /api/alerts
→ Stores in alert_history table
→ Updates driver_status table
→ Dashboard queries both tables
→ Displays real-time data
```

---

## 📊 Database Schema Quick Reference

### driver_status (Current)
```
id | driver_id | status | confidence | latitude | longitude | last_updated | is_active
```

### alert_history (Log)
```
id | driver_id | alert_type | status | confidence | latitude | longitude | maps_link | sms_sent | created_at
```

### owner_contacts (Contacts)
```
id | driver_id | owner_name | phone_number | email | created_at
```

### alert_settings (Config)
```
id | driver_id | alarm_threshold | sms_enabled | alert_enabled | confidence_threshold | created_at
```

---

## 🚀 Quick File Navigation

### To modify detection sensitivity:
→ `.env` file, update `ALARM_THRESHOLD` and `CONFIDENCE_THRESHOLD`

### To change dashboard refresh rate:
→ `Backend/views/dashboard.ejs`, line ~270: `REFRESH_INTERVAL = 3000`

### To add API endpoint:
→ Create new file in `Backend/routes/` and import in `Backend/app.js`

### To modify database:
→ Update `Backend/db/schema.sql` and restart backend

### To change GPS update frequency:
→ `.env` file, update `GPS_UPDATE_INTERVAL`

### To enable SMS:
→ Set Twilio credentials in `Backend/.env`

### To adjust model path:
→ `.env` file, update `MODEL_PATH`

---

## ✨ Key Features by File

| Feature | File | Key Function |
|---------|------|--------------|
| Real-time detection | `detect_drowsiness.py` | `start_detection()` |
| Database management | `Backend/db/setup.js` | `initializeDatabase()` |
| Alert storage | `Backend/models/Alert.js` | `create()` |
| Dashboard API | `Backend/routes/dashboard.js` | `GET /api/dashboard` |
| GPS tracking | `gps_tracker.py` | `start_tracking()` |
| SMS alerts | `sms_alert.py` | `send_alert()` |
| Beautiful UI | `Backend/views/dashboard.ejs` | Bootstrap styling |

---

## 📦 Complete Deployment Checklist

Files required for deployment:
- ✅ Backend/ (entire folder)
- ✅ src/ (entire folder)
- ✅ artifacts/ (drowsiness_model.h5)
- ✅ requirements.txt
- ✅ .env
- ✅ README.md
- ✅ STARTUP_GUIDE.md
- ✅ API_DOCUMENTATION.md

Ensure NOT included:
- ❌ .venv/ (recreate with pip install)
- ❌ node_modules/ (recreate with npm install)
- ❌ __pycache__/ (auto-generated)
- ❌ logs/ (will be created)

---

## 🎓 Learning Path

1. **Start with:** README.md (overview)
2. **Then read:** STARTUP_GUIDE.md (setup)
3. **Understand:** API_DOCUMENTATION.md (endpoints)
4. **Study:** Backend/app.js (main flow)
5. **Explore:** src/Detection/detect_drowsiness.py (detection logic)
6. **Reference:** Backend/models/ (data handling)

---

**This completes the production-ready Smart Driver Drowsiness Detection System!**
