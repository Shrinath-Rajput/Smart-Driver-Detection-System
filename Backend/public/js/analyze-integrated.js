/**
 * ANALYZE PAGE - INTEGRATED AI DETECTION
 * Manages real-time drowsiness detection with Python AI backend
 */

// ========== CONFIGURATION ==========

const AnalysisConfig = {
    API_URL: '/api/v1',
    WS_URL: window.location.origin,
    POLL_INTERVAL: 500, // 500ms
    ALERT_TIMEOUT: 5000  // 5 seconds
};

// ========== STATE MANAGEMENT ==========

let analysisState = {
    isDetecting: false,
    isConnected: false,
    sessionId: null,
    driverId: 'DRIVER_001',
    currentStatus: 'IDLE',
    confidence: 0.0,
    sleepCounter: 0,
    faceDetected: false,
    eyesDetected: false,
    alertActive: false,
    lastUpdate: null,
    fps: 0,
    latitude: null,
    longitude: null,
    statusHistory: []
};

let socket = null;
let statusUpdateInterval = null;

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ Analysis page loaded');
    
    // Get driver ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    analysisState.driverId = urlParams.get('driver_id') || 'DRIVER_001';
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize WebSocket connection
    initializeWebSocket();
    
    // Update UI
    updateUI();
    setInterval(updateTimestamp, 1000);
});

// ========== WEBSOCKET CONNECTION ==========

function initializeWebSocket() {
    try {
        socket = io(AnalysisConfig.WS_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        // Connection events
        socket.on('connect', () => {
            console.log('✓ WebSocket connected:', socket.id);
            analysisState.isConnected = true;
            updateConnectionStatus();
        });

        socket.on('disconnect', () => {
            console.log('⚠ WebSocket disconnected');
            analysisState.isConnected = false;
            analysisState.isDetecting = false;
            updateConnectionStatus();
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            showAlert('Connection Error: ' + error, 'error');
        });

        // Detection events
        socket.on('detection:status-update', (status) => {
            handleDetectionUpdate(status);
        });

        socket.on('detection:session-started', (data) => {
            console.log('✓ Detection session started:', data.sessionId);
            analysisState.sessionId = data.sessionId;
            showAlert('Detection started', 'success');
        });

        socket.on('detection:session-stopped', (data) => {
            console.log('✓ Detection session stopped');
            analysisState.isDetecting = false;
            showAlert('Detection stopped', 'info');
            updateUI();
        });

        socket.on('detection:alert', (alert) => {
            console.warn('🚨 Alert received:', alert);
            handleEmergencyAlert(alert);
        });

        socket.on('detection:error', (error) => {
            console.error('Detection error:', error);
            showAlert('Detection Error: ' + error.message, 'error');
        });

        socket.on('detection:crashed', (data) => {
            console.error('Detection process crashed');
            analysisState.isDetecting = false;
            showAlert('Detection service crashed', 'error');
        });

    } catch (error) {
        console.error('WebSocket initialization failed:', error);
        showAlert('Failed to initialize WebSocket connection', 'error');
    }
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
    // Start Detection Button
    const startBtn = document.getElementById('startDetectionBtn') || 
                     document.querySelector('[data-action="start"]');
    if (startBtn) {
        startBtn.addEventListener('click', startDetection);
    }

    // Stop Detection Button
    const stopBtn = document.getElementById('stopDetectionBtn') || 
                    document.querySelector('[data-action="stop"]');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopDetection);
    }

    // Restart Detection Button
    const restartBtn = document.getElementById('restartDetectionBtn') || 
                       document.querySelector('[data-action="restart"]');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartDetection);
    }

    // View Alerts Button
    const alertsBtn = document.getElementById('viewAlertsBtn');
    if (alertsBtn) {
        alertsBtn.addEventListener('click', () => {
            window.location.href = `/alerts?driver_id=${analysisState.driverId}`;
        });
    }
}

// ========== DETECTION CONTROL ==========

async function startDetection() {
    try {
        if (analysisState.isDetecting) {
            showAlert('Detection already running', 'warning');
            return;
        }

        console.log('Starting detection...');
        showAlert('Starting AI detection engine...', 'info');

        // Call start endpoint
        const response = await fetch(`${AnalysisConfig.API_URL}/detection/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId: analysisState.driverId })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to start detection');
        }

        analysisState.isDetecting = true;
        analysisState.sessionId = result.sessionId;
        analysisState.statusHistory = [];

        console.log('✓ Detection started:', result);
        showAlert('✓ AI detection engine started', 'success');

        // Start streaming video from Flask backend
        const liveVideo = document.getElementById('liveVideo');
        if (liveVideo) {
            // Add timestamp to URL to prevent caching
            liveVideo.src = `http://127.0.0.1:5001/api/detection/video_feed?t=${Date.now()}`;
            liveVideo.onerror = () => {
                console.error('Failed to load video feed');
                showAlert('Failed to load video feed from detection service', 'error');
            };
            liveVideo.onload = () => {
                console.log('✓ Video feed stream started');
                const placeholder = document.getElementById('videoPlaceholder');
                if (placeholder) placeholder.style.display = 'none';
            };
        }

        // Start polling for status updates
        if (statusUpdateInterval) clearInterval(statusUpdateInterval);
        statusUpdateInterval = setInterval(pollDetectionStatus, AnalysisConfig.POLL_INTERVAL);

        updateUI();

    } catch (error) {
        console.error('Error starting detection:', error);
        showAlert(`Error: ${error.message}`, 'error');
        analysisState.isDetecting = false;
    }
}

async function stopDetection() {
    try {
        if (!analysisState.isDetecting) {
            showAlert('Detection not running', 'warning');
            return;
        }

        console.log('Stopping detection...');
        showAlert('Stopping detection...', 'info');

        // Call stop endpoint
        const response = await fetch(`${AnalysisConfig.API_URL}/detection/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to stop detection');
        }

        analysisState.isDetecting = false;
        if (statusUpdateInterval) clearInterval(statusUpdateInterval);

        // Stop video stream
        const liveVideo = document.getElementById('liveVideo');
        if (liveVideo) {
            liveVideo.src = '';
            const placeholder = document.getElementById('videoPlaceholder');
            if (placeholder) placeholder.style.display = 'block';
        }

        console.log('✓ Detection stopped');
        showAlert('✓ Detection stopped', 'success');
        updateUI();

    } catch (error) {
        console.error('Error stopping detection:', error);
        showAlert(`Error: ${error.message}`, 'error');
    }
}

async function restartDetection() {
    await stopDetection();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await startDetection();
}

// ========== STATUS POLLING ==========

async function pollDetectionStatus() {
    try {
        if (!analysisState.isDetecting) return;

        const response = await fetch(`${AnalysisConfig.API_URL}/detection/status`, {
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success && result.data) {
            handleDetectionUpdate(result.data);
        }

    } catch (error) {
        console.warn('Polling error:', error.message);
    }
}

// ========== DETECTION UPDATE HANDLER ==========

function handleDetectionUpdate(status) {
    if (!status) return;

    analysisState.currentStatus = status.current_state || status.status || 'UNKNOWN';
    analysisState.confidence = parseFloat(status.confidence || 0);
    analysisState.sleepCounter = status.eyes_closed_duration || 0;
    analysisState.faceDetected = Boolean(status.face_detected);
    analysisState.eyesDetected = Boolean(status.eyes_detected);
    analysisState.latitude = status.latitude;
    analysisState.longitude = status.longitude;
    analysisState.fps = parseFloat(status.fps || 0);
    analysisState.lastUpdate = status.last_update;
    analysisState.alertActive = status.alarm_active || false;

    // Add to history
    analysisState.statusHistory.push({
        timestamp: new Date(),
        status: analysisState.currentStatus,
        confidence: analysisState.confidence
    });

    // Keep only last 100 entries
    if (analysisState.statusHistory.length > 100) {
        analysisState.statusHistory.shift();
    }

    // Update UI
    updateUI();

    // Log updates
    console.log(`📊 State: ${analysisState.currentStatus} | Confidence: ${(analysisState.confidence * 100).toFixed(1)}% | Eyes Closed: ${analysisState.sleepCounter.toFixed(1)}s`);
}

// ========== EMERGENCY ALERT HANDLER ==========

function handleEmergencyAlert(alert) {
    console.error('🚨 EMERGENCY ALERT TRIGGERED');
    
    // Play alarm sound
    playAlarmSound();

    // Show emergency alert
    const alertDiv = document.getElementById('emergencyAlert');
    if (alertDiv) {
        alertDiv.style.display = 'block';
        alertDiv.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading"><i class="fas fa-exclamation-circle"></i> EMERGENCY!</h4>
                <p>Driver drowsiness detected!</p>
                <hr>
                <p class="mb-0">
                    <strong>Time:</strong> ${new Date(alert.timestamp).toLocaleTimeString()}<br>
                    <strong>Location:</strong> ${alert.latitude && alert.longitude ? `${alert.latitude}, ${alert.longitude}` : 'Unknown'}<br>
                    <strong>Session:</strong> ${alert.sessionId}
                </p>
            </div>
        `;

        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 10000); // Hide after 10 seconds
    }

    // Send to backend for SMS and location logging
    sendAlertToBackend(alert);
}

async function sendAlertToBackend(alert) {
    try {
        const response = await fetch(`${AnalysisConfig.API_URL}/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driverId: analysisState.driverId,
                sessionId: alert.sessionId,
                alertType: alert.type,
                latitude: alert.latitude,
                longitude: alert.longitude,
                timestamp: alert.timestamp
            })
        });

        if (response.ok) {
            console.log('✓ Alert sent to backend');
        }
    } catch (error) {
        console.error('Failed to send alert to backend:', error);
    }
}

// ========== ALARM SOUND ==========

function playAlarmSound() {
    try {
        // Use Web Audio API to create a beeping sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 2500;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }, i * 600);
        }
    } catch (error) {
        console.warn('Could not play alarm:', error);
    }
}

// ========== UI UPDATE ==========

function updateUI() {
    updateStatusIndicator();
    updateConfidenceDisplay();
    updateControlButtons();
    updateStats();
    updateLocationDisplay();
}

function updateStatusIndicator() {
    const statusCircle = document.getElementById('liveStatusCircle');
    const statusValue = document.getElementById('liveStatus');
    const statusLabel = document.getElementById('statusLabel');

    if (statusCircle) {
        statusCircle.setAttribute('data-status', analysisState.currentStatus);
        statusCircle.className = `status-circle status-${analysisState.currentStatus.toLowerCase()}`;
        
        // Add appropriate icon for each state
        let icon = 'fas fa-circle';
        switch (analysisState.currentStatus) {
            case 'AWAKE': icon = 'fas fa-smile'; break;
            case 'SLEEPY': icon = 'fas fa-tired'; break;
            case 'EMERGENCY': icon = 'fas fa-exclamation-circle'; break;
            case 'RECOVERY': icon = 'fas fa-smile-wink'; break;
            case 'NO_FACE': icon = 'fas fa-ban'; break;
            case 'INSUFFICIENT_EYES': icon = 'fas fa-eye-slash'; break;
            case 'IDLE': icon = 'fas fa-pause'; break;
        }
        statusCircle.innerHTML = `<i class="${icon}"></i>`;
    }

    if (statusValue) {
        statusValue.textContent = analysisState.currentStatus;
    }

    if (statusLabel) {
        let label = 'System Idle';
        let color = 'dark';
        
        switch (analysisState.currentStatus) {
            case 'AWAKE': 
                label = '✓ Eyes Open - Alert'; 
                color = 'success';
                break;
            case 'SLEEPY': 
                label = '⚠ Drowsiness Detected'; 
                color = 'warning';
                break;
            case 'EMERGENCY': 
                label = '🚨 EMERGENCY - ALARM ON'; 
                color = 'danger';
                break;
            case 'RECOVERY': 
                label = '✓ Recovered - Eyes Open'; 
                color = 'success';
                break;
            case 'NO_FACE': 
                label = 'No Face Detected'; 
                color = 'secondary';
                break;
            case 'INSUFFICIENT_EYES': 
                label = 'Insufficient Eyes Detected'; 
                color = 'secondary';
                break;
        }
        
        statusLabel.textContent = label;
        statusLabel.className = `badge badge-${color}`;
    }
    
    // Update alarm indicator
    const alarmIndicator = document.getElementById('alarmIndicator');
    if (alarmIndicator) {
        if (analysisState.alertActive) {
            alarmIndicator.classList.add('alarm-active');
            alarmIndicator.innerHTML = '<i class="fas fa-bell"></i> ALARM ON';
        } else {
            alarmIndicator.classList.remove('alarm-active');
            alarmIndicator.innerHTML = '<i class="fas fa-bell-slash"></i> ALARM OFF';
        }
    }
}

function updateConfidenceDisplay() {
    const confidencePercent = (analysisState.confidence * 100).toFixed(1);
    const eyesClosedDuration = analysisState.sleepCounter.toFixed(1);
    
    const confidenceValue = document.getElementById('confidenceValue');
    if (confidenceValue) {
        confidenceValue.textContent = confidencePercent + '%';
    }

    const confidenceBar = document.getElementById('confidenceBar');
    if (confidenceBar) {
        confidenceBar.style.width = confidencePercent + '%';
        // Change color based on state
        switch (analysisState.currentStatus) {
            case 'AWAKE':
                confidenceBar.style.backgroundColor = '#28a745'; // Green
                break;
            case 'SLEEPY':
                confidenceBar.style.backgroundColor = '#ffc107'; // Yellow/Orange
                break;
            case 'EMERGENCY':
                confidenceBar.style.backgroundColor = '#dc3545'; // Red
                break;
            case 'RECOVERY':
                confidenceBar.style.backgroundColor = '#28a745'; // Green
                break;
            default:
                confidenceBar.style.backgroundColor = '#6c757d'; // Gray
        }
    }

    // Display eyes closed duration
    const eyesClosedDisplay = document.getElementById('eyesClosedDuration');
    if (eyesClosedDisplay) {
        eyesClosedDisplay.textContent = eyesClosedDuration + 's';
    }
    
    // Display threshold indicator
    const thresholdIndicator = document.getElementById('thresholdIndicator');
    if (thresholdIndicator) {
        let thresholdText = '';
        if (eyesClosedDuration < 2) {
            thresholdText = `${eyesClosedDuration}s (SLEEPY: 2s)`;
        } else if (eyesClosedDuration < 10) {
            thresholdText = `${eyesClosedDuration}s (EMERGENCY: 10s)`;
        } else {
            thresholdText = `${eyesClosedDuration}s (CRITICAL!)`;
        }
        thresholdIndicator.textContent = thresholdText;
    }
}

function updateControlButtons() {
    const startBtn = document.getElementById('startDetectionBtn') || 
                     document.querySelector('[data-action="start"]');
    const stopBtn = document.getElementById('stopDetectionBtn') || 
                    document.querySelector('[data-action="stop"]');

    if (analysisState.isDetecting) {
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
    } else {
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
    }
}

function updateStats() {
    const statsHtml = `
        <div class="stat-row">
            <span>Face Detected:</span>
            <span>${analysisState.faceDetected ? '✓ Yes' : '✗ No'}</span>
        </div>
        <div class="stat-row">
            <span>Eyes Detected:</span>
            <span>${analysisState.eyesDetected ? '✓ Yes' : '✗ No'}</span>
        </div>
        <div class="stat-row">
            <span>FPS:</span>
            <span>${analysisState.fps.toFixed(1)}</span>
        </div>
        <div class="stat-row">
            <span>Driver ID:</span>
            <span>${analysisState.driverId}</span>
        </div>
        <div class="stat-row">
            <span>Session ID:</span>
            <span style="font-size: 0.8em; word-break: break-all;">${analysisState.sessionId || 'Not started'}</span>
        </div>
        <div class="stat-row">
            <span>Last Update:</span>
            <span>${analysisState.lastUpdate ? new Date(analysisState.lastUpdate).toLocaleTimeString() : 'N/A'}</span>
        </div>
    `;

    const statsContainer = document.getElementById('detectionStats');
    if (statsContainer) {
        statsContainer.innerHTML = statsHtml;
    }
}

function updateLocationDisplay() {
    const locationDiv = document.getElementById('locationDisplay');
    if (locationDiv && analysisState.latitude && analysisState.longitude) {
        const mapsLink = `https://maps.google.com/?q=${analysisState.latitude},${analysisState.longitude}`;
        locationDiv.innerHTML = `
            <p><strong>Location:</strong> ${analysisState.latitude.toFixed(6)}, ${analysisState.longitude.toFixed(6)}</p>
            <a href="${mapsLink}" target="_blank" class="btn btn-sm btn-primary">
                <i class="fas fa-map-marker-alt"></i> View on Google Maps
            </a>
        `;
        locationDiv.style.display = 'block';
    }
}

function updateConnectionStatus() {
    const status = document.getElementById('connectionStatus');
    if (status) {
        if (analysisState.isConnected) {
            status.className = 'connection-status connected';
            status.textContent = '🟢 Connected';
        } else {
            status.className = 'connection-status disconnected';
            status.textContent = '🔴 Disconnected';
        }
    }
}

function updateTimestamp() {
    const timestamp = document.getElementById('timestamp');
    if (timestamp) {
        timestamp.textContent = new Date().toLocaleTimeString();
    }
}

// ========== ALERT NOTIFICATIONS ==========

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    
    if (!alertContainer) {
        // Create container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; max-width: 400px; z-index: 9999;';
        document.body.appendChild(container);
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.getElementById('alertContainer').appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// ========== UTILITY FUNCTIONS ==========

function boolean(val) {
    return val === true || val === 'true' || val === 1;
}
