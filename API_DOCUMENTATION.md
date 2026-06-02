# API Documentation - Smart Driver Drowsiness Detection System

## Base URL
```
http://localhost:5000
```

---

## Alert Management APIs

### 1. POST `/api/alerts` - Receive Drowsiness Alert
Send drowsiness detection alert from Python backend.

**Request:**
```json
{
  "driver_id": "DRIVER_001",
  "status": "SLEEPY",
  "confidence": 0.92,
  "latitude": 18.5204,
  "longitude": 73.8567,
  "alarm_triggered": true,
  "timestamp": "2026-06-02T10:30:00Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Alert received and processed",
  "alert_id": 1,
  "driver_status": "SLEEPY"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Missing required fields: driver_id, status"
}
```

---

### 2. GET `/api/alerts/status/:driver_id` - Get Current Driver Status
Get the current status of a driver.

**URL:** `GET /api/alerts/status/DRIVER_001`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "driver_id": "DRIVER_001",
    "status": "AWAKE",
    "confidence": 0.15,
    "latitude": 18.5204,
    "longitude": 73.8567,
    "last_updated": "2026-06-02T10:35:45Z",
    "is_active": true
  }
}
```

---

### 3. GET `/api/alerts/history/:driver_id` - Get Alert History
Get all alerts for a driver with optional limit.

**URL:** `GET /api/alerts/history/DRIVER_001?limit=20`

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "driver_id": "DRIVER_001",
      "alert_type": "DROWSINESS",
      "status": "SLEEPY",
      "confidence": 0.95,
      "latitude": 18.5204,
      "longitude": 73.8567,
      "maps_link": "https://maps.google.com/?q=18.5204,73.8567",
      "sms_sent": true,
      "sms_sent_at": "2026-06-02T10:30:15Z",
      "created_at": "2026-06-02T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 4. GET `/api/alerts/recent/:driver_id` - Get Recent Alerts (24h)
Get alerts from the last 24 hours.

**URL:** `GET /api/alerts/recent/DRIVER_001`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "driver_id": "DRIVER_001",
      "alert_type": "DROWSINESS",
      "status": "SLEEPY",
      "confidence": 0.95,
      "created_at": "2026-06-02T10:30:00Z"
    }
  ],
  "count": 3
}
```

---

### 5. GET `/api/alerts/stats/:driver_id` - Get Statistics
Get alert statistics for a driver.

**URL:** `GET /api/alerts/stats/DRIVER_001?hours=24`

**Query Parameters:**
- `hours` (optional): Time period in hours (default: 24)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_alerts": 5,
    "drowsiness_alerts": 5,
    "avg_confidence": 0.92
  }
}
```

---

## Dashboard APIs

### 6. GET `/api/dashboard/:driver_id` - Get Complete Dashboard Data
Get driver status, recent alerts, and statistics in one call.

**URL:** `GET /api/dashboard/DRIVER_001`

**Response:**
```json
{
  "success": true,
  "data": {
    "driver": {
      "id": 1,
      "driver_id": "DRIVER_001",
      "status": "AWAKE",
      "confidence": 0.15,
      "latitude": 18.5204,
      "longitude": 73.8567,
      "last_updated": "2026-06-02T10:35:45Z"
    },
    "recentAlerts": [
      {
        "id": 5,
        "alert_type": "DROWSINESS",
        "status": "SLEEPY",
        "confidence": 0.95,
        "created_at": "2026-06-02T10:30:00Z"
      }
    ],
    "stats": {
      "total_alerts": 5,
      "drowsiness_alerts": 5,
      "avg_confidence": 0.92,
      "last_alert": "2026-06-02T10:30:00Z"
    }
  }
}
```

---

### 7. GET `/api/dashboard` - Get All Active Drivers
Get list of all currently active drivers.

**URL:** `GET /api/dashboard`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "driver_id": "DRIVER_001",
      "status": "AWAKE",
      "confidence": 0.15,
      "latitude": 18.5204,
      "longitude": 73.8567,
      "last_updated": "2026-06-02T10:35:45Z"
    }
  ],
  "count": 1
}
```

---

## GPS & Location APIs

### 8. POST `/api/gps/update` - Update GPS Location
Send current driver location to backend.

**Request:**
```json
{
  "driver_id": "DRIVER_001",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "accuracy": 10,
  "timestamp": "2026-06-02T10:35:45Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "GPS location updated",
  "mapsLink": "https://maps.google.com/?q=18.5204,73.8567"
}
```

---

### 9. GET `/api/gps/location/:driver_id` - Get Last Known Location
Get the last recorded location for a driver.

**URL:** `GET /api/gps/location/DRIVER_001`

**Response:**
```json
{
  "success": true,
  "data": {
    "latitude": 18.5204,
    "longitude": 73.8567,
    "last_updated": "2026-06-02T10:35:45Z",
    "mapsLink": "https://maps.google.com/?q=18.5204,73.8567"
  }
}
```

---

## SMS & Notification APIs

### 10. POST `/api/sms/contact/add` - Add Owner Contact
Add or update vehicle owner contact information.

**Request:**
```json
{
  "driver_id": "DRIVER_001",
  "owner_name": "John Doe",
  "phone_number": "+1234567890",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact added successfully"
}
```

---

### 11. GET `/api/sms/contacts/:driver_id` - Get Owner Contacts
Get all registered contacts for a driver.

**URL:** `GET /api/sms/contacts/DRIVER_001`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "driver_id": "DRIVER_001",
      "owner_name": "John Doe",
      "phone_number": "+1234567890",
      "email": "john@example.com",
      "created_at": "2026-06-02T09:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 12. POST `/api/sms/test` - Send Test SMS
Send a test SMS to verify Twilio configuration.

**Request:**
```json
{
  "driver_id": "DRIVER_001",
  "phone_number": "+1234567890"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Test SMS sent",
  "result": {
    "success": true,
    "messageSid": "SM1234567890abcdef"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to send test SMS",
  "result": {
    "success": false,
    "reason": "Twilio not configured"
  }
}
```

---

## Web Pages

### 13. GET `/` - Home Page
Landing page with features and dashboard launch button.

---

### 14. GET `/dashboard?driver_id=DRIVER_001` - Dashboard Page
Real-time driver monitoring dashboard with:
- Current status display
- Confidence level
- Alert history
- Statistics
- Location information

---

### 15. GET `/location?driver_id=DRIVER_001` - Location Page
Displays driver's last known location with Google Maps integration.

---

### 16. GET `/health` - Health Check
Check if backend is running.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-06-02T10:35:45Z"
}
```

---

## Error Responses

### Common Error Codes

**400 Bad Request**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Driver not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Error retrieving data",
  "error": "database connection error"
}
```

---

## Testing with cURL

### Test 1: Send Alert
```bash
curl -X POST http://localhost:5000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": "DRIVER_001",
    "status": "SLEEPY",
    "confidence": 0.92,
    "latitude": 18.5204,
    "longitude": 73.8567,
    "alarm_triggered": true
  }'
```

### Test 2: Get Dashboard
```bash
curl http://localhost:5000/api/dashboard/DRIVER_001
```

### Test 3: Add Contact
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

### Test 4: Get Location
```bash
curl http://localhost:5000/api/gps/location/DRIVER_001
```

### Test 5: Health Check
```bash
curl http://localhost:5000/health
```

---

## Rate Limiting & Best Practices

⚠️ **Alert Cooldown:** 5 minutes between duplicate alerts (prevents alert spam)  
📊 **Dashboard Refresh:** 3 seconds (configurable)  
📍 **GPS Update:** Every 5 seconds (configurable)  
🔔 **SMS Limit:** Check Twilio rate limits and costs  

---

## Data Types Reference

```
driver_id: VARCHAR - Unique driver identifier (e.g., "DRIVER_001")
status: VARCHAR - "AWAKE" or "SLEEPY"
confidence: FLOAT - Value between 0-1 (0.92 = 92%)
latitude/longitude: DECIMAL - GPS coordinates
timestamp: ISO 8601 - "2026-06-02T10:35:45Z"
phone_number: VARCHAR - "+1234567890" format
```

---

## Integration Notes

### Python → Node.js Communication
The Python detection system sends HTTP POST requests to `http://localhost:5000/api/alerts` whenever drowsiness is detected.

### Frontend → Backend Communication
The dashboard fetches data every 3 seconds from `/api/dashboard/{driver_id}` endpoint.

### SMS Notifications
When alarm is triggered, backend sends SMS via Twilio (if configured) to all registered owner contacts.

---

End of API Documentation
