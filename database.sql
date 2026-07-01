SHOW DATABASES;
USE drowsiness_detection;

CREATE TABLE driver_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'AWAKE',
    sleep_duration INT DEFAULT 0,
    latitude DOUBLE,
    longitude DOUBLE,
    maps_link TEXT,
    sms_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE alert_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(50),
    status VARCHAR(20),
    latitude DOUBLE,
    longitude DOUBLE,
    maps_link TEXT,
    alert_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO driver_status
(driver_id,status)
VALUES
('DRIVER_001','AWAKE');


USE drowsiness_detection;

ALTER TABLE driver_status
ADD COLUMN confidence FLOAT DEFAULT 0;

ALTER TABLE driver_status
ADD COLUMN last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
ON UPDATE CURRENT_TIMESTAMP;

DESCRIBE driver_status;