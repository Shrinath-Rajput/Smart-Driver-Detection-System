# DEPLOYMENT GUIDE
# Smart Driver Drowsiness Detection System
# Production-Ready Deployment Instructions

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Configuration](#backend-configuration)
5. [Python Engine Setup](#python-engine-setup)
6. [Starting the Application](#starting-the-application)
7. [Production Deployment](#production-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** v16+ (https://nodejs.org/)
- **Python** 3.8+ (https://www.python.org/)
- **MySQL** 5.7+ (https://www.mysql.com/)
- **Git** (https://git-scm.com/)

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 5GB free space
- **Processor**: Multi-core processor
- **OS**: Windows, macOS, or Linux

### API Credentials (Optional but Recommended)
- **Twilio Account** (for SMS alerts): https://www.twilio.com/
- **Google Maps API Key**: https://developers.google.com/maps

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd "Driver Drowness Detection"
```

### 2. Install Node.js Dependencies
```bash
cd Backend
npm install
```

### 3. Install Python Dependencies
```bash
cd ..
pip install -r requirements.txt
```

Or with virtual environment (recommended):
```bash
python -m venv .venv

# On Windows
.venv\Scripts\activate

# On macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 4. Copy Environment Configuration
```bash
cd Backend
cp .env.example .env
# Edit .env with your configuration
```

---

## Database Configuration

### 1. Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE drowsiness_detection;
USE drowsiness_detection;
```

### 2. Run Schema
```bash
mysql -u root -p drowsiness_detection < Backend/db/schema.sql
```

### 3. Verify Tables
```sql
SHOW TABLES;
```

Expected tables:
- `driver_status`
- `alert_history`
- `owner_contacts`
- `alert_settings`

---

## Backend Configuration

### 1. Update .env File
Edit `Backend/.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=drowsiness_detection

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1234567890

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=your_api_key

# Detection
ALARM_THRESHOLD=5
CONFIDENCE_THRESHOLD=0.6

# Python Backend
PYTHON_BACKEND_URL=http://localhost:5001
```

### 2. Update Config File
Edit `Backend/config/config.js` if needed for custom settings

---

## Python Engine Setup

### 1. Verify Model
```bash
# Check if model exists
ls artifacts/drowsiness_model.h5
```

If model doesn't exist, train it:
```bash
python -m src.Pipeline.train_pipeline
```

### 2. Test Detection
```bash
python -c "from src.Detection.detect_drowsiness import load_drowsiness_model; model = load_drowsiness_model(); print('Model loaded successfully')"
```

### 3. Verify Configuration
Edit `src/Config/config.py` if needed:

```python
class Config:
    MODEL_PATH = "artifacts/drowsiness_model.h5"
    BACKEND_URL = "http://localhost:5000"
    DRIVER_ID = "DRIVER_001"
    ALARM_THRESHOLD = 5
    CONFIDENCE_THRESHOLD = 0.6
    DISPLAY_ENABLED = True
```

---

## Starting the Application

### Start MySQL (if not running)
```bash
# Windows
net start MySQL80

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### Start Backend Server
```bash
cd Backend
npm start
# or for development with auto-reload
npm run dev
```

Server will start on `http://localhost:5000`

### Start Python Detection Engine (Optional)
In a new terminal:
```bash
python -m src.Pipeline.detect_drowsiness
```

### Access Application
- **Home**: http://localhost:5000/
- **Dashboard**: http://localhost:5000/dashboard?driver_id=DRIVER_001
- **Analyze**: http://localhost:5000/analyze?driver_id=DRIVER_001
- **Alerts**: http://localhost:5000/alerts?driver_id=DRIVER_001
- **About**: http://localhost:5000/about

---

## Production Deployment

### 1. Environment Preparation
```bash
# Set production environment
export NODE_ENV=production

# Install production dependencies only
npm install --production
```

### 2. Build Optimization
```bash
# Minify assets (optional)
npm run build

# Clear node_modules and reinstall production dependencies
rm -rf node_modules
npm ci --production
```

### 3. Use Process Manager (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start app.js --name "DriveAlert" --env production

# Auto-restart on system reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# Logs
pm2 logs DriveAlert
```

### 4. Use Nginx Reverse Proxy
Create `/etc/nginx/sites-available/drivealert`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/drivealert /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL/HTTPS (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 6. Database Backup
```bash
# Backup
mysqldump -u root -p drowsiness_detection > backup.sql

# Restore
mysql -u root -p drowsiness_detection < backup.sql
```

---

## Monitoring and Maintenance

### 1. Check Application Health
```bash
curl http://localhost:5000/health
```

### 2. Monitor Logs
```bash
# Backend logs
pm2 logs DriveAlert

# System logs
journalctl -u nginx -f
```

### 3. Database Maintenance
```sql
-- Check database size
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) MB 
FROM information_schema.TABLES 
WHERE table_schema = 'drowsiness_detection';

-- Archive old alerts (optional)
DELETE FROM alert_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Optimize tables
OPTIMIZE TABLE driver_status;
OPTIMIZE TABLE alert_history;
```

### 4. Performance Optimization
- Enable MySQL query caching
- Implement database indexing
- Use CDN for static assets
- Enable compression on Nginx
- Implement rate limiting

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Database Connection Error
```bash
# Test connection
mysql -h localhost -u root -p -e "SELECT 1;"

# Check MySQL status
sudo systemctl status mysql
```

### Camera/Geolocation Permission Issues
- Check browser security permissions
- Enable HTTPS for geolocation to work
- Request camera permissions from user

### Model Loading Error
```bash
# Verify model file
file artifacts/drowsiness_model.h5

# Check TensorFlow installation
python -c "import tensorflow; print(tensorflow.__version__)"
```

### High CPU Usage
```bash
# Check running processes
top -b -n 1 | head -20

# Profile Node.js
node --prof app.js
```

### Memory Leaks
```bash
# Enable memory tracking
--expose-gc --max-old-space-size=2048
```

---

## Performance Tuning

### 1. Database Optimization
- Add indexes on frequently queried columns
- Implement query caching
- Regular table optimization

### 2. Node.js Optimization
- Use clustering for multiple cores
- Implement connection pooling
- Use compression middleware

### 3. Caching Strategy
- Redis for session caching
- Client-side caching for static assets
- API response caching

### 4. Scalability
- Load balancing with Nginx
- Horizontal scaling with multiple instances
- Database replication

---

## Security Considerations

### 1. Update Dependencies
```bash
npm audit
npm audit fix
npm update
```

### 2. Enable CORS Properly
```javascript
cors({
    origin: 'yourdomain.com',
    credentials: true
})
```

### 3. Use Environment Variables
- Never commit `.env` file
- Use `.env.example` as template
- Rotate secrets regularly

### 4. Database Security
```sql
-- Create application user
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON drowsiness_detection.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;
```

### 5. API Security
- Implement rate limiting
- Add request validation
- Use HTTPS only
- Implement authentication

---

## Backup Strategy

### Automated Backups (Cron)
```bash
0 2 * * * mysqldump -u root -p'password' drowsiness_detection > /backups/db_$(date +\%Y\%m\%d).sql
```

### File Backups
```bash
# Backup entire project
tar -czf project_backup_$(date +%Y%m%d).tar.gz /path/to/project/
```

---

## Version Control

### Tag Release
```bash
git tag -a v1.0.0 -m "Production Release v1.0.0"
git push origin v1.0.0
```

### Create Release Branch
```bash
git checkout -b release/v1.0.0
# Make release-specific changes
git commit -m "Release v1.0.0"
git merge --no-ff main
```

---

## Support & Documentation

For more information:
- GitHub Repository: [Link]
- Documentation: [Link]
- Issue Tracker: [Link]
- Email Support: support@drivealert.com

---

## License

This project is licensed under MIT License. See LICENSE file for details.
