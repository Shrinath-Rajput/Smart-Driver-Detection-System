/**
 * DASHBOARD JAVASCRIPT
 * Real-time monitoring and updates
 */

// Configuration
const CONFIG = {
    API_URL: '/api/v1',
    REFRESH_INTERVAL: 3000, // 3 seconds
    AUTO_REFRESH_ENABLED: true,
};

// State
let dashboardState = {
    driverId: initialData.driverId,
    autoRefresh: true,
    refreshInterval: null,
    lastUpdate: new Date(),
    socket: null,
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized for driver:', dashboardState.driverId);
    
    // Initialize Socket.io for real-time updates
    initializeSocketIO();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial data load
    refreshDashboard();
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
            // Update dashboard with real-time data
            if (data.driverId === dashboardState.driverId) {
                updateDashboardWithDetectionData(data);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.io disconnected');
        });

        dashboardState.socket = socket;
    } catch (error) {
        console.warn('Socket.io initialization failed:', error);
        // Fallback to polling if Socket.io fails
    }
}

/**
 * Update Dashboard with Detection Data
 */
function updateDashboardWithDetectionData(data) {
    // Update status
    const statusElement = document.getElementById('liveStatus');
    if (statusElement && data.status) {
        statusElement.textContent = data.status;
        statusElement.className = `status status-${data.status.toLowerCase()}`;
    }

    // Update confidence
    const confidenceElement = document.getElementById('liveConfidence');
    if (confidenceElement && data.confidence !== undefined) {
        confidenceElement.textContent = (data.confidence * 100).toFixed(1) + '%';
    }

    // Update face/eyes detection
    const faceElement = document.getElementById('faceDetected');
    const eyesElement = document.getElementById('eyesDetected');
    
    if (faceElement && data.face_detected !== undefined) {
        faceElement.textContent = data.face_detected ? '✓ YES' : '✗ NO';
        faceElement.style.color = data.face_detected ? '#00ff00' : '#ff0000';
    }
    if (eyesElement && data.eyes_detected !== undefined) {
        eyesElement.textContent = data.eyes_detected ? '✓ YES' : '✗ NO';
        eyesElement.style.color = data.eyes_detected ? '#00ff00' : '#ff0000';
    }

    // Update sleep counter
    const sleepCounterElement = document.getElementById('sleepCounter');
    if (sleepCounterElement && data.sleep_counter !== undefined) {
        sleepCounterElement.textContent = data.sleep_counter;
    }

    // Update location
    if (data.latitude && data.longitude) {
        updateLocationDisplay(data.latitude, data.longitude);
    }

    dashboardState.lastUpdate = new Date();
}

/**
 * Trigger Alert UI
 */
function triggerAlertUI(data) {
    console.log('Triggering alert UI for:', data);
    // Show emergency alert
    const alertContainer = document.getElementById('emergencyAlertContainer');
    if (alertContainer) {
        alertContainer.style.display = 'block';
        alertContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>🚨 EMERGENCY ALERT!</strong> Driver drowsiness detected!
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    const autoRefreshBtn = document.getElementById('autoRefreshBtn');
    if (autoRefreshBtn) {
        autoRefreshBtn.addEventListener('click', toggleAutoRefresh);
    }

    // Refresh on visibility change (when tab comes into focus)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && dashboardState.autoRefresh) {
            refreshDashboard();
        }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
    });
}

/**
 * Toggle Auto Refresh
 */
function toggleAutoRefresh() {
    dashboardState.autoRefresh = !dashboardState.autoRefresh;
    
    const btn = document.getElementById('autoRefreshBtn');
    if (dashboardState.autoRefresh) {
        btn.innerHTML = '<i class="fas fa-pause-circle"></i> Auto Refresh: ON';
        startAutoRefresh();
    } else {
        btn.innerHTML = '<i class="fas fa-play-circle"></i> Auto Refresh: OFF';
        stopAutoRefresh();
    }
}

/**
 * Start Auto Refresh
 */
function startAutoRefresh() {
    if (dashboardState.refreshInterval) return;
    
    dashboardState.refreshInterval = setInterval(() => {
        if (dashboardState.autoRefresh && !document.hidden) {
            refreshDashboard();
        }
    }, CONFIG.REFRESH_INTERVAL);
}

/**
 * Stop Auto Refresh
 */
function stopAutoRefresh() {
    if (dashboardState.refreshInterval) {
        clearInterval(dashboardState.refreshInterval);
        dashboardState.refreshInterval = null;
    }
}

/**
 * Main Refresh Function
 */
async function refreshDashboard() {
    try {
        // Fetch status data
        const statusResponse = await fetch(
            `${CONFIG.API_URL}/status?driver_id=${dashboardState.driverId}`
        );
        
        if (!statusResponse.ok) throw new Error('Failed to fetch status');
        
        const statusData = await statusResponse.json();
        
        if (statusData.success) {
            updateStatusDisplay(statusData.data);
        }

        // Fetch analytics data
        const analyticsResponse = await fetch(
            `${CONFIG.API_URL}/analytics?driver_id=${dashboardState.driverId}`
        );
        
        if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            if (analyticsData.success) {
                updateAnalyticsDisplay(analyticsData.data);
            }
        }

        // Update timestamp
        updateTimestamp();
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showError('Failed to refresh dashboard data');
    }
}

/**
 * Update Status Display
 */
function updateStatusDisplay(statusData) {
    // Update status circle and value
    const statusCircle = document.getElementById('statusCircle');
    const statusValue = document.getElementById('statusValue');
    
    if (statusCircle) {
        statusCircle.setAttribute('data-status', statusData.status);
        // Update icon
        let iconClass = 'smile';
        if (statusData.status === 'SLEEPY') iconClass = 'tired';
        else if (statusData.status === 'EMERGENCY') iconClass = 'exclamation-triangle';
        statusCircle.innerHTML = `<i class="fas fa-${iconClass}"></i>`;
    }
    
    if (statusValue) {
        statusValue.textContent = statusData.status;
    }

    // Update confidence
    const confidenceValue = document.getElementById('confidenceValue');
    if (confidenceValue) {
        const confidencePercent = (statusData.confidence * 100).toFixed(2);
        confidenceValue.textContent = confidencePercent + '%';
        
        // Update gauge
        updateGauge(confidencePercent);
    }

    // Update location
    if (statusData.latitude && statusData.longitude) {
        updateLocationDisplay(statusData);
    }

    // Update last updated
    const updatedValue = document.getElementById('updatedValue');
    if (updatedValue) {
        const lastUpdate = new Date(statusData.lastUpdated);
        const timeAgo = getTimeAgo(lastUpdate);
        updatedValue.textContent = timeAgo;
    }
}

/**
 * Update Gauge
 */
function updateGauge(percentage) {
    const gaugeValue = document.getElementById('gaugeValue');
    const gaugeDisplay = document.getElementById('gaugeDisplay');
    
    if (gaugeValue && gaugeDisplay) {
        const circumference = 314; // 2 * π * 50
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        gaugeValue.style.strokeDasharray = `${circumference}`;
        gaugeValue.style.strokeDashoffset = `${strokeDashoffset}`;
        gaugeDisplay.textContent = percentage.toFixed(0);
    }
}

/**
 * Update Location Display
 */
function updateLocationDisplay(statusData) {
    const locationDiv = document.querySelector('.location-info');
    if (!locationDiv) return;

    const mapsLink = `https://maps.google.com/?q=${statusData.latitude},${statusData.longitude}`;
    
    locationDiv.innerHTML = `
        <div class="coordinates">
            <p><strong>Latitude:</strong> ${statusData.latitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${statusData.longitude.toFixed(6)}</p>
        </div>
        <a href="${mapsLink}" target="_blank" class="btn btn-sm btn-primary">
            <i class="fas fa-map"></i> View on Maps
        </a>
    `;
}

/**
 * Update Analytics Display
 */
function updateAnalyticsDisplay(analyticsData) {
    // Update statistics
    const totalAlerts = document.getElementById('totalAlerts');
    if (totalAlerts) {
        totalAlerts.textContent = analyticsData.totalDrowsinessEvents || 0;
    }

    const drowsinessCount = document.getElementById('drowsinessCount');
    if (drowsinessCount) {
        drowsinessCount.textContent = analyticsData.totalDrowsinessEvents || 0;
    }
}

/**
 * Update Timestamp
 */
function updateTimestamp() {
    const timestamp = document.getElementById('timestamp');
    if (timestamp) {
        const now = new Date();
        timestamp.textContent = now.toLocaleString();
    }

    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = now.toLocaleTimeString();
    }
}

/**
 * Get Time Ago String
 */
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    
    return Math.floor(seconds / 86400) + 'd ago';
}

/**
 * Show Error
 */
function showError(message) {
    console.error(message);
    // Could add toast notification here
}

/**
 * Manual Refresh Button
 */
function manualRefresh() {
    console.log('Manual refresh triggered');
    refreshDashboard();
}

// Export functions for inline onclick handlers
window.refreshDashboard = refreshDashboard;
window.toggleAutoRefresh = toggleAutoRefresh;
window.manualRefresh = manualRefresh;
