// Application State
const appState = {
    mode: 'work',
    timeRemaining: 1500,
    workDuration: 1500,
    shortBreak: 300,
    longBreak: 900,
    sessionsCompleted: 0,
    isRunning: false,
    timerInterval: null,
    autoStart: false
};

// DOM Elements
const elements = {
    timerDisplay: document.getElementById('timerDisplay'),
    currentMode: document.getElementById('currentMode'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    skipBtn: document.getElementById('skipBtn'),
    sessionCount: document.getElementById('sessionCount'),
    sessionDots: document.getElementById('sessionDots'),
    settingsToggle: document.getElementById('settingsToggle'),
    settingsPanel: document.getElementById('settingsPanel'),
    workDuration: document.getElementById('workDuration'),
    shortBreak: document.getElementById('shortBreak'),
    longBreak: document.getElementById('longBreak'),
    autoStart: document.getElementById('autoStart'),
    saveSettings: document.getElementById('saveSettings'),
    progressCircle: document.querySelector('.progress-ring-circle')
};

// Initialize App
function initApp() {
    loadSettings();
    updateDisplay();
    updateProgressBar();
    attachEventListeners();
}

// Load Settings from LocalStorage
function loadSettings() {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        appState.workDuration = settings.workDuration || 1500;
        appState.shortBreak = settings.shortBreak || 300;
        appState.longBreak = settings.longBreak || 900;
        appState.autoStart = settings.autoStart || false;
        appState.timeRemaining = appState.workDuration;

        elements.workDuration.value = appState.workDuration / 60;
        elements.shortBreak.value = appState.shortBreak / 60;
        elements.longBreak.value = appState.longBreak / 60;
        elements.autoStart.checked = appState.autoStart;
    }
}

// Save Settings to LocalStorage
function saveSettings() {
    const settings = {
        workDuration: appState.workDuration,
        shortBreak: appState.shortBreak,
        longBreak: appState.longBreak,
        autoStart: appState.autoStart
    };
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

// Attach Event Listeners
function attachEventListeners() {
    elements.startBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    elements.skipBtn.addEventListener('click', skipSession);
    elements.settingsToggle.addEventListener('click', toggleSettings);
    elements.saveSettings.addEventListener('click', handleSaveSettings);
}

// Start Timer
function startTimer() {
    if (appState.isRunning) return;

    appState.isRunning = true;
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = false;

    appState.timerInterval = setInterval(() => {
        appState.timeRemaining--;
        updateDisplay();
        updateProgressBar();

        if (appState.timeRemaining <= 0) {
            clearInterval(appState.timerInterval);
            handleTimerComplete();
        }
    }, 1000);
}

// Pause Timer
function pauseTimer() {
    appState.isRunning = false;
    clearInterval(appState.timerInterval);
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
}

// Reset Timer
function resetTimer() {
    pauseTimer();
    appState.timeRemaining = getCurrentModeDuration();
    updateDisplay();
    updateProgressBar();
}

// Skip Session
function skipSession() {
    pauseTimer();
    handleTimerComplete();
}

// Handle Timer Complete
function handleTimerComplete() {
    appState.isRunning = false;
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;

    if (appState.mode === 'work') {
        appState.sessionsCompleted++;
        updateSessionTracker();
        switchMode(appState.sessionsCompleted % 4 === 0 ? 'longBreak' : 'shortBreak');
    } else {
        switchMode('work');
    }

    playNotification();

    if (appState.autoStart) {
        setTimeout(startTimer, 1000);
    }
}

// Switch Mode
function switchMode(newMode) {
    appState.mode = newMode;
    appState.timeRemaining = getCurrentModeDuration();
    updateDisplay();
    updateProgressBar();
    updateModeIndicator();
}

// Get Current Mode Duration
function getCurrentModeDuration() {
    switch (appState.mode) {
        case 'work':
            return appState.workDuration;
        case 'shortBreak':
            return appState.shortBreak;
        case 'longBreak':
            return appState.longBreak;
        default:
            return appState.workDuration;
    }
}

// Update Display
function updateDisplay() {
    const minutes = Math.floor(appState.timeRemaining / 60);
    const seconds = appState.timeRemaining % 60;
    elements.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update Progress Bar
function updateProgressBar() {
    const totalDuration = getCurrentModeDuration();
    const progress = appState.timeRemaining / totalDuration;
    const circumference = 2 * Math.PI * 130;
    const offset = circumference * (1 - progress);
    elements.progressCircle.style.strokeDashoffset = offset;

    // Change color based on mode
    if (appState.mode === 'work') {
        elements.progressCircle.style.stroke = '#e74c3c';
    } else if (appState.mode === 'shortBreak') {
        elements.progressCircle.style.stroke = '#3498db';
    } else {
        elements.progressCircle.style.stroke = '#27ae60';
    }
}

// Update Mode Indicator
function updateModeIndicator() {
    const modeText = {
        work: 'Work Session',
        shortBreak: 'Short Break',
        longBreak: 'Long Break'
    };
    elements.currentMode.textContent = modeText[appState.mode];
    elements.currentMode.style.color = appState.mode === 'work' ? '#e74c3c' : '#3498db';
}

// Update Session Tracker
function updateSessionTracker() {
    elements.sessionCount.textContent = appState.sessionsCompleted;
    const dot = document.createElement('div');
    dot.className = 'session-dot';
    elements.sessionDots.appendChild(dot);
}

// Toggle Settings Panel
function toggleSettings() {
    elements.settingsPanel.classList.toggle('hidden');
}

// Handle Save Settings
function handleSaveSettings() {
    appState.workDuration = parseInt(elements.workDuration.value) * 60;
    appState.shortBreak = parseInt(elements.shortBreak.value) * 60;
    appState.longBreak = parseInt(elements.longBreak.value) * 60;
    appState.autoStart = elements.autoStart.checked;

    if (!appState.isRunning) {
        appState.timeRemaining = getCurrentModeDuration();
        updateDisplay();
        updateProgressBar();
    }

    saveSettings();
    elements.settingsPanel.classList.add('hidden');
}

// Play Notification
function playNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
            body: appState.mode === 'work' ? 'Time for a break!' : 'Time to work!',
            icon: '🍅'
        });
    }
}

// Request Notification Permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', initApp);
