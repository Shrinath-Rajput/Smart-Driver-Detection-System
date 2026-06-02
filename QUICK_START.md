# 🚀 QUICK START - RUN THE SYSTEM NOW

## One-Time Setup

### 1. Install Node.js Dependencies
```bash
cd Backend
npm install
cd ..
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Update Configuration
Edit `Backend/.env` and update:
- Database credentials (DB_USER, DB_PASSWORD)
- Detection settings (ALARM_THRESHOLD, etc.)

---

## Run Everything

```bash
cd Backend
npm run dev
```

That's it! 🎉

The system will:
- ✓ Start Node.js backend (port 5000)
- ✓ Initialize database
- ✓ Enable WebSocket
- ✓ Ready to spawn Python AI on demand

---

## Access the Website

Open in browser:
```
http://localhost:5000/analyze
```

Or:
```
Home:      http://localhost:5000
Dashboard: http://localhost:5000/dashboard
Analyze:   http://localhost:5000/analyze
Alerts:    http://localhost:5000/alerts
```

---

## Use the System

1. **Click "Start AI Detection"** button
2. **Watch** real-time status updates
3. **Close your eyes** for 5+ seconds
4. **See** the alarm trigger and alert

---

## Logs & Troubleshooting

### View Logs
```bash
# Real-time logs
tail -f logs/app.log

# Or check console output from the running terminal
```

### Check if Python is Running
```bash
# Windows
tasklist | findstr python

# Linux/Mac
ps aux | grep detection_service
```

### Common Issues

| Issue | Fix |
|-------|-----|
| Port already in use | Change PORT in `.env` |
| Camera not found | Try CAMERA_INDEX=1 in `.env` |
| Python crashes | `pip install -r requirements.txt` |
| Database error | Check DB credentials in `.env` |

---

## System Architecture

```
Browser (Frontend)
    ↓
Node.js Backend (port 5000)
    ├─ Detection Manager
    ├─ WebSocket
    └─ Routes
        ↓
Python AI Service (port 5001)
    ├─ Frame Processing
    ├─ Face Detection
    ├─ Eye Detection
    ├─ CNN Model
    └─ Alert Logic
        ↓
Database
    ├─ Save alerts
    ├─ Driver status
    └─ History
```

---

## Key Files Modified/Created

**New Files:**
- `Backend/routes/detection.js` - Detection API
- `Backend/services/detection-manager.js` - Process manager
- `Backend/utils/logging.js` - Logging utility
- `Backend/public/js/analyze-integrated.js` - Frontend integration
- `src/Detection/detection_service.py` - Python AI service

**Updated Files:**
- `Backend/app.js` - WebSocket & detection routes
- `Backend/views/analyze.ejs` - New HTML controls
- `Backend/.env` - Detection configuration
- `requirements.txt` - Python dependencies

---

## Features Now Working

✅ **AI Detection** - Eyes closed detection via CNN model
✅ **Real-time Updates** - WebSocket live status
✅ **Automatic** - No manual Python commands
✅ **Alarm** - Sound alert on drowsiness
✅ **GPS** - Location capture on emergency
✅ **SMS** - Notifications (if configured)
✅ **Database** - Alert history logging
✅ **Dashboard** - Real-time metrics display

---

## Next Steps

1. Run: `cd Backend && npm run dev`
2. Open: `http://localhost:5000/analyze`
3. Click: "Start AI Detection"
4. Watch: Real-time status updates
5. Test: Close eyes for 5+ seconds

---

## Documentation

- **Complete Guide**: Read `INTEGRATION_GUIDE.md`
- **Startup Guide**: Read `COMPLETE_STARTUP_GUIDE.md`
- **API Docs**: In `INTEGRATION_GUIDE.md` > API Endpoints section

---

**You're all set! Everything is integrated and ready to go! 🎉**

Questions? Check the logs!
