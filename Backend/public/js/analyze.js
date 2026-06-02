/**
 * ANALYZE PAGE JAVASCRIPT
 * Live detection and monitoring
 */

const AnalysisConfig = {
    API_URL: '/api/v1',
    UPDATE_INTERVAL: 1000, // 1 second
};

let analysisState = {
    isMonitoring: false,
    videoStream: null,
    sleepCounter: 0,
    updateInterval: null,
    socket: null,
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Analysis page loaded');
    setupEventListeners();
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
    
    // Initialize Socket.io for real-time updates
    initializeSocketIO();
});

/**
 * Initialize Socket.io for Real-Time Updates
 */
function initializeSocketIO() {
    try {
        const socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('Socket.io connected - ID:', socket.id);
        });

        socket.on('detection:update', (data) => {
            console.log('Detection update received via Socket.io:', data);
            // Update analysis page with real-time data
            if (analysisState.isMonitoring) {
                updateAnalysisUI(data);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.io disconnected');
        });

        analysisState.socket = socket;
    } catch (error) {
        console.warn('Socket.io initialization failed:', error);
        // Fallback to polling if Socket.io fails
    }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Will be set up dynamically
}

/**
 * Start Detection
 */
async function startDetection() {
    try {
        analysisState.isMonitoring = true;
        console.log('Starting detection for driver:', analysisConfig.driverId);

        // Start video stream from Python service using MJPEG
        const video = document.getElementById('liveVideo');
        const placeholder = document.getElementById('videoPlaceholder');
        
        if (video && placeholder) {
            // Set the source to the MJPEG stream endpoint
            // Add timestamp to bust cache
            video.src = 'http://localhost:5001/api/detection/video_feed?t=' + Date.now();
            video.onerror = function() {
                console.error('Error loading video stream');
            };
            placeholder.style.display = 'none';
        }

        // Start polling for status updates
        startStatusPolling();
        
        // Show recording indicator
        document.getElementById('recordingIndicator').style.display = 'inline';

        // Update UI
        updateDetectionUI('MONITORING');

    } catch (error) {
        console.error('Error starting detection:', error);
        alert('Error starting detection: ' + error.message);
        analysisState.isMonitoring = false;
    }
}

/**
 * Stop Detection
 */
function stopDetection() {
    analysisState.isMonitoring = false;
    console.log('Stopping detection');

    // Stop video stream
    const video = document.getElementById('liveVideo');
    if (video) {
        video.src = '';
    }

    // Clear status polling
    if (analysisState.updateInterval) {
        clearInterval(analysisState.updateInterval);
        analysisState.updateInterval = null;
    }

    // Hide recording indicator
    document.getElementById('recordingIndicator').style.display = 'none';

    // Reset counter
    analysisState.sleepCounter = 0;
    updateSleepCounter();

    // Update UI
    updateDetectionUI('STOPPED');
}

/**
 * Start Status Polling
 */
function startStatusPolling() {
    // Poll for status updates every second
    if (analysisState.updateInterval) {
        clearInterval(analysisState.updateInterval);
    }

    analysisState.updateInterval = setInterval(async () => {
        if (!analysisState.isMonitoring) return;

        try {
            const response = await fetch('http://localhost:5001/api/detection/status', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const status = await response.json();
                updateAnalysisUI(status);
            }
        } catch (error) {
            console.warn('Error polling detection status:', error);
        }
    }, 1000); // Poll every 1 second
}

/**
 * Update Analysis UI
 */
function updateAnalysisUI(result) {
    if (!result) return;

    // Map Python service status to UI status
    let uiStatus = result.current_status || 'MONITORING';
    
    // Convert Python status names to UI names if needed
    if (uiStatus === 'DETECTING_DROWSINESS') {
        uiStatus = 'SLEEPY';
    } else if (uiStatus === 'DETECTING') {
        uiStatus = 'SLEEPY';
    }

    // Update status
    updateDetectionUI(uiStatus);

    // Update confidence
    const confidence = (result.confidence * 100 || 0).toFixed(1);
    document.getElementById('liveConfidence').textContent = confidence;

    // Update gauge
    updateLiveGauge(confidence);

    // Update sleep counter display
    const sleepCounter = result.sleep_counter || 0;
    document.getElementById('sleepCounter').textContent = sleepCounter;

    // Update face and eyes detection indicators
    const faceElement = document.getElementById('faceDetected');
    const eyesElement = document.getElementById('eyesDetected');
    
    if (faceElement) {
        faceElement.textContent = result.face_detected ? '✓ YES' : '✗ NO';
        faceElement.style.color = result.face_detected ? '#00ff00' : '#ff0000';
    }
    if (eyesElement) {
        eyesElement.textContent = result.eyes_detected ? '✓ YES' : '✗ NO';
        eyesElement.style.color = result.eyes_detected ? '#00ff00' : '#ff0000';
    }

    // Log detection
    logDetection(uiStatus, confidence);

    // Trigger alarm if emergency
    if (uiStatus === 'EMERGENCY') {
        triggerEmergencyAlert(result);
    }
}

/**
 * Update Detection UI Status
 */
function updateDetectionUI(status) {
    const statusCircle = document.getElementById('liveStatusCircle');
    const statusText = document.getElementById('liveStatus');

    if (statusCircle) {
        statusCircle.setAttribute('data-status', status);
        let iconClass = 'smile';
        if (status === 'SLEEPY') iconClass = 'tired';
        else if (status === 'EMERGENCY') iconClass = 'exclamation-triangle';
        statusCircle.innerHTML = `<i class="fas fa-${iconClass}"></i>`;
    }

    if (statusText) {
        statusText.textContent = status;
    }
}

/**
 * Update Sleep Counter
 */
function updateSleepCounter() {
    const counter = document.getElementById('sleepCounter');
    if (counter) {
        counter.textContent = analysisState.sleepCounter;
    }
}

/**
 * Update Live Gauge
 */
function updateLiveGauge(percentage) {
    const gaugeValue = document.getElementById('liveGaugeValue');
    if (gaugeValue) {
        const circumference = 314;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        gaugeValue.style.strokeDasharray = circumference;
        gaugeValue.style.strokeDashoffset = strokeDashoffset;
    }
}

/**
 * Log Detection
 */
function logDetection(status, confidence) {
    const logsDiv = document.getElementById('detectionLogs');
    if (!logsDiv) return;

    const now = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.style.cssText = 'padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;';
    
    let statusBadgeClass = 'badge-awake';
    if (status === 'SLEEPY') statusBadgeClass = 'badge-drowsiness';
    else if (status === 'EMERGENCY') statusBadgeClass = 'badge-emergency';

    logEntry.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${now}</strong> - 
                <span class="badge ${statusBadgeClass}">${status}</span>
            </div>
            <div style="opacity: 0.7;">${confidence}%</div>
        </div>
    `;

    logsDiv.insertBefore(logEntry, logsDiv.firstChild);

    // Keep only last 50 logs
    while (logsDiv.children.length > 50) {
        logsDiv.removeChild(logsDiv.lastChild);
    }
}

/**
 * Trigger Emergency Alert
 */
async function triggerEmergencyAlert(detectionData) {
    try {
        console.log('Triggering emergency alert');

        // Get current location if available
        const location = await getCurrentLocation();

        const alertPayload = {
            driverId: analysisConfig.driverId,
            status: 'EMERGENCY',
            sleepDuration: analysisState.sleepCounter,
            confidence: detectionData.confidence,
            latitude: location?.latitude,
            longitude: location?.longitude,
        };

        // Send to backend
        const response = await fetch(`${AnalysisConfig.API_URL}/emergency`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alertPayload),
        });

        if (response.ok) {
            console.log('Emergency alert sent successfully');
        }
    } catch (error) {
        console.error('Error triggering emergency alert:', error);
    }
}

/**
 * Get Current Location
 */
async function getCurrentLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    resolve(null);
                }
            );
        } else {
            resolve(null);
        }
    });
}

/**
 * Update Timestamp
 */
function updateTimestamp() {
    const timestamp = document.getElementById('timestamp');
    if (timestamp) {
        timestamp.textContent = new Date().toLocaleString();
    }
}

// Export functions for onclick handlers
window.startDetection = startDetection;
window.stopDetection = stopDetection;
