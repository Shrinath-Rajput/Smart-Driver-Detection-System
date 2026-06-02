# 🚗 Smart Driver Drowsiness Detection & Alert System

A production-ready AI-powered full-stack system for real-time driver drowsiness detection with instant alerts, GPS tracking, and SMS notifications.

## 📊 **Project Features**

✅ **98.55% Accuracy** - CNN-based drowsiness detection model  
✅ **Real-time Detection** - OpenCV face & eye detection  
✅ **Instant Alerts** - SMS notifications to vehicle owner  
✅ **GPS Tracking** - Live location monitoring with Google Maps  
✅ **Professional Dashboard** - Beautiful real-time monitoring UI  
✅ **Alert History** - Complete audit trail of all drowsiness events  
✅ **Production Ready** - Error handling, logging, database integration  
✅ **Full-Stack** - Python backend + Node.js/Express + MySQL database  

## 🏗️ **Architecture**

```
┌─────────────────────────────────────┐
│   Python Detection System           │
│  (OpenCV + TensorFlow CNN)          │
│  - Face Detection                   │
│  - Eye Detection                    │
│  - Drowsiness Prediction (98.55%)   │
│  - GPS Tracking                     │
└────────────┬────────────────────────┘
             │
             │ HTTP POST /api/alerts
             ▼
┌─────────────────────────────────────┐
│   Node.js Express Backend           │
│  - Alert Management                 │
│  - GPS Location Storage             │
│  - SMS Alert Dispatch               │
│  - Dashboard API                    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   MySQL Database                    │
│  - driver_status                    │
│  - alert_history                    │
│  - owner_contacts                   │
│  - alert_settings                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Web Dashboard                     │
│  - Real-time Status Display         │
│  - Alert History                    │
│  - Location Mapping                 │
│  - Statistics                       │
└─────────────────────────────────────┘
```

---

## 🚀 **Quick Start Guide**

### **Prerequisites**
- Python 3.8+
- Node.js 14+
- MySQL Server
- Git

### **Step 1: Clone & Setup**

```bash
cd "d:\e drive\Only_Project\Driver Drowness Detection"

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
cd Backend
npm install
cd ..
```

### **Step 2: Database Setup**

1. **Start MySQL Server** (ensure it's running)

2. **Create the database** (automatic on first run, or manual):
```sql
CREATE DATABASE drowsiness_detection;
USE drowsiness_detection;
-- Schema will be created automatically
```

### **Step 3: Configure Environment**

#### **Backend Configuration** (`Backend/.env`)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=drowsiness_detection

# Optional: Twilio SMS
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1234567890
```

#### **Python Configuration** (`.env` in root)
```env
BACKEND_URL=http://localhost:5000
DRIVER_ID=DRIVER_001
ALARM_THRESHOLD=15
CONFIDENCE_THRESHOLD=0.5
GPS_UPDATE_INTERVAL=5000
USE_DUMMY_GPS=True
GEMINI_API_KEY=AQ.Ab8RN6LwbJ63yF5_CPFga1270vIt3uazDxMv9vK0mh_uK7xyFA
```

---

## 🎯 **Running the System**

### **Terminal 1: Start Node.js Backend**
```bash
cd Backend
npm run dev
# Server running on http://localhost:5000
```

### **Terminal 2: Start Python Detection**
```bash
# From root directory
python -m src.Detection.detect_drowsiness
# Detection system will start and connect to backend
```

### **Terminal 3: Access Dashboard**
```
http://localhost:5000/dashboard?driver_id=DRIVER_001
```

---

## 📁 **Project Structure**

```
Driver Drowness Detection/
│
├── Backend/
│   ├── app.js                 # Main Express server
│   ├── package.json           # Node dependencies
│   ├── .env                   # Backend configuration
│   │
│   ├── db/
│   │   ├── setup.js           # Database connection & init
│   │   └── schema.sql         # Database schema
│   │
│   ├── config/
│   │   └── config.js          # Configuration loader
│   │
│   ├── models/
│   │   ├── Driver.js          # Driver status model
│   │   ├── Alert.js           # Alert management model
│   │   └── SMSAlert.js        # SMS alert handler
│   │
│   ├── routes/
│   │   ├── alerts.js          # Alert API endpoints
│   │   ├── dashboard.js       # Dashboard API endpoints
│   │   ├── gps.js             # GPS/Location endpoints
│   │   └── sms.js             # SMS management endpoints
│   │
│   └── views/
│       ├── index.ejs          # Home page
│       ├── dashboard.ejs      # Main dashboard
│       └── location.ejs       # Location page
│
├── src/
│   ├── Config/
│   │   └── config.py          # Python configuration
│   │
│   ├── Detection/
│   │   ├── detect_drowsiness.py    # Main detection system
│   │   ├── gps_tracker.py          # GPS tracking module
│   │   └── sms_alert.py            # SMS alert module
│   │
│   ├── Components/
│   │   ├── data_ingestion.py
│   │   ├── data_transformation.py
│   │   └── model_trainer.py
│   │
│   ├── Pipeline/
│   │   ├── train_pipeline.py
│   │   └── predict_pipeline.py
│   │
│   ├── exception.py
│   ├── logger.py
│   └── utils.py
│
├── artifacts/
│   └── drowsiness_model.h5    # Trained CNN model (98.55% accuracy)
│
├── Dataset/
│   └── data/
│       ├── train/
│       ├── val/
│       └── test/
│
├── logs/
│   └── drowsiness_detection.log
│
├── requirements.txt           # Python dependencies
├── .env                       # Root configuration
└── README.md                  # This file
```

---

## 🔌 **API Endpoints**

### **Alert Management**
```
POST   /api/alerts              # Receive drowsiness alert from Python
GET    /api/alerts/status/{id}  # Get driver status
GET    /api/alerts/history/{id} # Get alert history
GET    /api/alerts/recent/{id}  # Get recent alerts (24h)
GET    /api/alerts/stats/{id}   # Get statistics
```

### **Dashboard**
```
GET    /api/dashboard/{id}      # Get complete dashboard data
GET    /api/dashboard           # Get all active drivers
```

### **GPS & Location**
```
POST   /api/gps/update          # Update driver location
GET    /api/gps/location/{id}   # Get last known location
```

### **SMS & Notifications**
```
POST   /api/sms/contact/add     # Add owner contact
GET    /api/sms/contacts/{id}   # Get contacts
POST   /api/sms/test            # Send test SMS
```

### **Web Pages**
```
GET    /                        # Home page
GET    /dashboard               # Dashboard page
GET    /location                # Location page
GET    /health                  # Health check
```

---

## 📊 **Database Schema**

### **driver_status**
Tracks current status of each driver
```sql
- id (INT, PK)
- driver_id (VARCHAR, UNIQUE)
- status (VARCHAR) - AWAKE/SLEEPY
- confidence (FLOAT)
- latitude (DECIMAL)
- longitude (DECIMAL)
- last_updated (TIMESTAMP)
- is_active (BOOLEAN)
```

### **alert_history**
Records all drowsiness alerts
```sql
- id (INT, PK)
- driver_id (VARCHAR, FK)
- alert_type (VARCHAR)
- status (VARCHAR)
- confidence (FLOAT)
- latitude (DECIMAL)
- longitude (DECIMAL)
- maps_link (TEXT)
- sms_sent (BOOLEAN)
- created_at (TIMESTAMP)
```

### **owner_contacts**
Vehicle owner contact information
```sql
- id (INT, PK)
- driver_id (VARCHAR, UNIQUE, FK)
- owner_name (VARCHAR)
- phone_number (VARCHAR)
- email (VARCHAR)
- created_at (TIMESTAMP)
```

### **alert_settings**
Driver-specific alert settings
```sql
- id (INT, PK)
- driver_id (VARCHAR, UNIQUE, FK)
- alarm_threshold (INT)
- sms_enabled (BOOLEAN)
- alert_enabled (BOOLEAN)
- confidence_threshold (FLOAT)
- created_at (TIMESTAMP)
```

---

## 🔑 **Key Configuration Options**

### **Detection Sensitivity**
```env
ALARM_THRESHOLD=15                    # Frames before alarm
CONFIDENCE_THRESHOLD=0.5              # Drowsiness detection threshold
FRAME_CHECK_INTERVAL=100              # Check every N frames
```

### **GPS Settings**
```env
GPS_UPDATE_INTERVAL=5000              # Update interval (ms)
USE_DUMMY_GPS=True                    # Use test data (change to False for real GPS)
```

### **Alert Management**
```env
SMS_ENABLED=True                      # Enable SMS alerts
ALERT_COOLDOWN=300                    # Min seconds between alerts
```

---

## 🎓 **Usage Examples**

### **Example 1: Send Alert to Backend**
```python
from src.Detection.detect_drowsiness import send_alert_to_backend

send_alert_to_backend(
    status="SLEEPY",
    confidence=0.92,
    latitude=18.5204,
    longitude=73.8567,
    alarm_triggered=True
)
```

### **Example 2: Add Owner Contact**
```bash
curl -X POST http://localhost:5000/api/sms/contact/add \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": "DRIVER_001",
    "owner_name": "John Doe",
    "phone_number": "+1234567890",
    "email": "john@example.com"
  }'
```

### **Example 3: Get Dashboard Data**
```bash
curl http://localhost:5000/api/dashboard/DRIVER_001
```

---

## 📈 **Model Performance**

- **Validation Accuracy**: 98.49%
- **Test Accuracy**: 98.55%
- **Architecture**: Custom CNN
- **Input Size**: 64×64 pixel eye images
- **Classes**: 2 (Awake/Sleepy)

---

## 🔒 **Security Best Practices**

✅ **Environment Variables**: Sensitive data in `.env`  
✅ **Database**: SQL prepared statements (protection from injection)  
✅ **CORS**: Enabled for development  
✅ **Error Handling**: Comprehensive try-catch blocks  
✅ **Logging**: All actions logged for audit trail  
✅ **API Validation**: Input validation on all endpoints  

---

## 🐛 **Troubleshooting**

### **Camera Not Found**
```
Error: Camera not found
→ Check if camera is connected and not in use by another app
→ Change CAMERA_INDEX in .env (try 0, 1, 2...)
```

### **Database Connection Error**
```
Error: Cannot connect to MySQL
→ Ensure MySQL Server is running
→ Check credentials in Backend/.env
→ Verify database exists
```

### **Backend Not Responding**
```
Error: Cannot reach http://localhost:5000
→ Ensure Node.js backend is running
→ Check if port 5000 is available
→ npm run dev should show "✓ Server Running On Port 5000"
```

### **SMS Not Sending**
```
⚠️ Twilio not configured
→ Add TWILIO credentials in Backend/.env
→ Restart Node.js backend after configuration
```

---

## 📱 **Deployment**

### **Production Deployment**
1. Set `NODE_ENV=production` in `.env`
2. Use production database credentials
3. Configure HTTPS
4. Set up PM2 process manager
5. Configure Nginx reverse proxy
6. Set up proper logging and monitoring

### **Docker Deployment**
```dockerfile
# Create Dockerfile for containerization
# Deploy using Docker Compose
```

---

## 🤝 **Integration Points**

### **With Gemini AI** (Optional)
```python
# For AI-powered alert analysis
GEMINI_API_KEY=AQ.Ab8RN6LwbJ63yF5_CPFga1270vIt3uazDxMv9vK0mh_uK7xyFA
```

### **With Twilio** (SMS Alerts)
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token  
TWILIO_FROM_NUMBER=+1234567890
```

---

## 📄 **License**

This project is provided as-is for educational and commercial use.

---

## 👨‍💻 **Support**

For issues or questions, refer to:
- Check logs in `logs/drowsiness_detection.log`
- Review database connections
- Ensure all environment variables are set
- Verify API endpoints using Postman

---

## 🎉 **Summary**

This is a complete, production-ready system for driver safety monitoring. All components are integrated and ready to deploy:

✅ Python detection system connected to Node.js backend  
✅ Real-time dashboard with auto-refresh  
✅ Alert history and statistics  
✅ GPS tracking with Google Maps  
✅ SMS notifications (when configured)  
✅ Professional UI with Bootstrap  
✅ Complete error handling and logging  
✅ Database persistence  

**Ready to run! Start with:** `npm run dev` (Backend) + `python -m src.Detection.detect_drowsiness` (Detection)
