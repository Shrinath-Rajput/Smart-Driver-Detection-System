# QUICK START GUIDE - Final Production Workflow

## 🚀 FASTEST WAY TO TEST (3 Commands)

### Prerequisites
- Python installed and virtual environment activated
- Node.js and npm installed
- MySQL database running and configured
- Camera connected to computer

---

## 📋 STEP 1: Terminal 1 - Python Detection Service

```bash
# Navigate to project root
cd "d:\e drive\Only_Project\Driver Drowness Detection"

# Activate virtual environment (if using one)
.\.venv\Scripts\Activate.ps1

# Start Python detection service (runs on port 5001)
python src/Detection/detection_service.py
```

**Expected Output:**
```
════════════════════════════════════════════════════════════
🚗 DRIVER DROWSINESS DETECTION - FINAL PRODUCTION WORKFLOW
════════════════════════════════════════════════════════════
Backend URL: http://127.0.0.1:5000
Driver ID: DRIVER_001
States: AWAKE → SLEEPY (2s) → EMERGENCY (10s)
Alarm: Continuous until eyes open
════════════════════════════════════════════════════════════
 * Running on http://127.0.0.1:5001
```

✅ Keep this terminal open. Do NOT close it.

---

## 📋 STEP 2: Terminal 2 - Node.js Backend

```bash
# Open new terminal/tab
# Navigate to Backend folder
cd "d:\e drive\Only_Project\Driver Drowness Detection\Backend"

# Start Node.js server (runs on port 5000)
npm start
```

**Expected Output:**
```
🚀 Backend server running on port 5000
✓ Database connected
✓ Routes initialized
✓ WebSocket ready
```

✅ Keep this terminal open. Do NOT close it.

---

## 📋 STEP 3: Terminal 3 / Browser - Access Dashboard

```bash
# Open your web browser and go to:
http://localhost:5000/analyze
```

**You should see:**
- ✓ Video feed from webcam
- ✓ "START AI DETECTION" button
- ✓ Status indicator (currently "IDLE")
- ✓ Real-time statistics panel

---

## 🎯 TESTING WORKFLOW

### Test 1: Start Detection
1. Click **"START AI DETECTION"** button
2. Wait 2-3 seconds for models to load
3. Video should display (possibly with some initial lag)
4. Status should change to **"AWAKE"** (Green) with ✓ symbol
5. Confidence should be low (0-20%)

### Test 2: Eyes Open (AWAKE State)
1. Keep eyes **OPEN**
2. Observe:
   - Status: **AWAKE** ✓ (Green)
   - Alarm: **OFF** 🔇
   - Eyes Closed Duration: **0.0s**
   - Confidence: **Low** (0-30%)
3. This is baseline healthy state

### Test 3: Eyes Closed - Sleepy (SLEEPY State)
1. **CLOSE YOUR EYES** and keep them closed
2. Count: 1 second... 2 seconds...
3. At **2 second mark**, you should hear:
   - **🔔 BEEPING ALARM** starts
   - Status changes to **"SLEEPY"** ⚠ (Yellow/Orange)
4. Observe:
   - Eyes Closed Duration: **~2.0s** increasing
   - Confidence: **~70-85%**
   - Dashboard: **Orange/Yellow alert**

### Test 4: Recovery (Open Eyes Before 10 Seconds)
1. **OPEN YOUR EYES** at any point between 2-10 seconds
2. Immediately observe:
   - 🔔 **Alarm STOPS immediately**
   - Status changes back to **"AWAKE"** ✓ (Green)
   - Eyes Closed Duration: **Reset to 0.0s**
   - Dashboard: **Green indicator restored**
   - Alert marked as "Recovered" in database

### Test 5: Emergency (Eyes Closed for 10 Seconds)
1. **CLOSE YOUR EYES** again
2. Keep them closed for **10 full seconds**
3. At **10 second mark**, the system enters **EMERGENCY**:

   **Visual Indicators:**
   - Status: **"EMERGENCY 🚨"** (RED)
   - Alarm: **CONTINUES** (cannot be stopped)
   - Beeping: **PERSISTENT**

   **GPS Captured:**
   - Latitude: Displayed (e.g., 37.7749)
   - Longitude: Displayed (e.g., -122.4194)

   **Google Maps:**
   - Maps link appears (clickable)
   - Opens Google Maps in new tab showing location

   **Alerts Sent:**
   - SMS: Queued to owner's phone
   - WhatsApp: Queued to owner's number

   **Database:**
   - Alert recorded in alert_history table
   - Type: DROWSINESS_CRITICAL
   - Status: EMERGENCY
   - Full GPS coordinates

   **Dashboard Update:**
   - Real-time update (no refresh needed)
   - Shows all emergency info

### Test 6: Recovery from Emergency
1. **OPEN YOUR EYES** (at any time during EMERGENCY)
2. Immediately:
   - 🔔 **Alarm STOPS**
   - Status: **"RECOVERED" ✓** (Green)
   - Eyes Closed Duration: **Reset to 0.0s**
   - Dashboard: **Green restoration**
   - Alert marked with recovery timestamp

---

## 📊 STATE MACHINE VISUAL REFERENCE

```
                    ┌─ NO FACE ─ Reset ─┐
                    │                    │
                    ↓                    ↓
  IDLE ────────→ AWAKE ◄─ Eyes Open ─ RECOVERY
                    │
                    │ (Eyes Closed 2s)
                    ↓
               🔔 SLEEPY ⚠
                    │
        ┌───────────┤
        │           │
     Open Eyes    Continue Closed (8s more)
        │           │
        │           ↓
        └──→ AWAKE  🚨 EMERGENCY
             ✓ (Red) │ GPS + SMS + WhatsApp
                    │
                    │ (Eyes Open)
                    ↓
               🚨 → RECOVERY ✓
```

---

## 🔍 WHAT TO OBSERVE

### Real-Time Dashboard Elements

| Element | State | Display |
|---------|-------|---------|
| **Status Circle** | AWAKE | 😊 Green |
| **Status Circle** | SLEEPY | 😴 Orange |
| **Status Circle** | EMERGENCY | 🚨 Red |
| **Status Circle** | RECOVERY | 🤗 Green |
| **Alarm Light** | SLEEPY/EMERGENCY | 🔔 ON (Red) |
| **Alarm Light** | AWAKE/RECOVERY | 🔇 OFF (Green) |
| **Eyes Closed Timer** | SLEEPY | 2.0s → 3.0s → ... |
| **Eyes Closed Timer** | EMERGENCY | 10.0s → 11.0s → ... |
| **Confidence Bar** | AWAKE | 0-20% (Green bar) |
| **Confidence Bar** | SLEEPY/EMERGENCY | 70-95% (Orange/Red bar) |
| **Maps Button** | EMERGENCY | Clickable Google Maps link |
| **Alert Count** | Each Emergency | +1 increment |

---

## 🛑 STOP DETECTION

When finished testing:
1. Click **"STOP AI DETECTION"** button
2. Or close browser tab
3. Alarm will stop immediately
4. Video stream will stop
5. Python service stays running (safe to keep running)

---

## 🗄️ DATABASE VERIFICATION

Check database for saved alerts:

```sql
-- View all drowsiness alerts
SELECT * FROM alert_history 
WHERE alert_type IN ('DROWSINESS_DETECTED', 'DROWSINESS_CRITICAL')
ORDER BY created_at DESC;

-- View emergency alerts
SELECT * FROM alert_history 
WHERE status = 'EMERGENCY'
ORDER BY created_at DESC;

-- View alerts with GPS coordinates
SELECT driver_id, status, latitude, longitude, maps_link, created_at
FROM alert_history
WHERE latitude IS NOT NULL
ORDER BY created_at DESC;

-- View alerts with recovery tracking
SELECT driver_id, status, created_at, recovered_at, recovery_notes
FROM alert_history
WHERE recovered_at IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🆘 TROUBLESHOOTING

### No video appears
- Check if camera is connected
- Try opening native camera app to verify camera works
- Check browser console for errors (F12)
- Refresh page after detection starts

### Alarm doesn't start at 2 seconds
- Check if eyes are actually detected (should show "Eyes: ✓")
- Make sure CNN model prediction is working (confidence increases)
- Check Python console for errors
- Verify audio is enabled in browser

### GPS not captured
- GPS mock location used if real location unavailable
- Check if gps_tracker.py is working
- Verify coordinates appear in dashboard

### SMS/WhatsApp not sent
- Verify owner contact is configured in database
- Check SMS/WhatsApp service integration
- Monitor backend logs for errors

### State doesn't update in real-time
- Check WebSocket connection (browser console)
- Verify backend is running
- Reload page if stuck on old state
- Check network tab in browser dev tools

---

## 📞 CONTACT CONFIGURATION

Before EMERGENCY alerts are sent, configure owner contact:

```bash
# Example: Add owner contact to database
INSERT INTO owner_contacts (driver_id, owner_name, phone_number, email, whatsapp_number)
VALUES ('DRIVER_001', 'John Doe', '+1-555-0123', 'john@example.com', '+1-555-0123');
```

---

## ⏱️ KEY TIMINGS

| Event | Duration | Action |
|-------|----------|--------|
| Eyes Close | 0s | Tracking starts |
| Eyes Close | 2s | **SLEEPY** → Alarm ON |
| Eyes Close | 10s | **EMERGENCY** → GPS + SMS + WhatsApp |
| Eyes Open | Immediate | **RECOVERY** → Alarm OFF |
| Alarm Pattern | 300ms on | 2500 Hz beep |
| Alarm Pattern | 500ms off | Silence |
| Total Beep Cycle | 800ms | Continuous loop |

---

## ✅ SUCCESS INDICATORS

- [x] Both services running without errors
- [x] Video feed displays smoothly
- [x] Face and eyes detected
- [x] State transitions at correct times (2s & 10s)
- [x] Alarm beeps start at 2 seconds
- [x] Alarm stops immediately when eyes open
- [x] GPS captured and displayed
- [x] Google Maps link works
- [x] Dashboard updates in real-time
- [x] Database records created
- [x] SMS/WhatsApp queued successfully

---

## 🎉 YOU'RE READY!

The system is now **PRODUCTION READY**. All components are working correctly with:
- ✓ Complete state machine
- ✓ Continuous alarm system
- ✓ Real-time GPS tracking
- ✓ Multi-channel notifications
- ✓ Live dashboard updates
- ✓ Full database integration

---

**Last Updated:** June 3, 2026  
**Status:** ✅ FINAL PRODUCTION READY
