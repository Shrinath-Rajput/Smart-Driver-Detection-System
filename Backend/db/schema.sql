USE `drowsiness_detection`;

-- Driver Status Table
CREATE TABLE IF NOT EXISTS driver_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AWAKE',
    confidence FLOAT NOT NULL DEFAULT 0.0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    alarm_active BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Alert History Table (Enhanced for state machine)
CREATE TABLE IF NOT EXISTS alert_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    confidence FLOAT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    maps_link TEXT,
    
    -- Alert trigger times
    alert_time TIMESTAMP NULL,
    timestamp TIMESTAMP NULL,
    
    -- Recovery tracking
    recovered_at TIMESTAMP NULL,
    recovery_notes TEXT,
    
    -- Notification tracking
    sms_sent BOOLEAN DEFAULT FALSE,
    sms_sent_at TIMESTAMP NULL,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    whatsapp_sent_at TIMESTAMP NULL,
    
    -- Metadata
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES driver_status(driver_id),
    INDEX idx_driver_time (driver_id, created_at DESC),
    INDEX idx_alert_status (status, created_at DESC)
);

-- Owner Contact Table
CREATE TABLE IF NOT EXISTS owner_contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id VARCHAR(100) NOT NULL UNIQUE,
    owner_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    whatsapp_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES driver_status(driver_id)
);

-- Alert Settings Table
CREATE TABLE IF NOT EXISTS alert_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id VARCHAR(100) NOT NULL UNIQUE,
    alarm_threshold INT DEFAULT 10,
    sleepy_threshold INT DEFAULT 2,
    sms_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    alert_enabled BOOLEAN DEFAULT TRUE,
    confidence_threshold FLOAT DEFAULT 0.5,
    auto_recovery BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES driver_status(driver_id)
);
