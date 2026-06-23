/**
 * FocusFlow — Focus Session Module (focus.js)
 * Pomodoro timer engine: countdown, ring animation, session recording.
 */

const FocusModule = (() => {
  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    mode: 'focus',       // 'focus' | 'shortBreak' | 'longBreak'
    status: 'idle',      // 'idle' | 'running' | 'paused'
    totalSeconds: 0,
    remainingSeconds: 0,
    sessionCount: 0,
    currentSessionId: null,
    category: 'work',
    intervalId: null,
    circumference: 0,
  };

  // ─── Config (loaded from settings) ───────────────────────────────────────
  let config = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    sessionsBeforeLong: 4,
  };

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const refs = {};

  const _initRefs = () => {
    refs.timerDisplay = Utils.el('#timerDisplay');
    refs.modeLabel = Utils.el('#timerModeLabel');
    refs.ring = Utils.el('#timerRing');
    refs.ringGlow = Utils.el('#timerRingGlow');
    refs.startBtn = Utils.el('#startBtn');
    refs.startIcon = Utils.el('#startIcon');
    refs.resetBtn = Utils.el('#resetBtn');
    refs.skipBtn = Utils.el('#skipBtn');
    refs.sessionDots = Utils.el('#sessionDots');
    refs.statusIndicator = Utils.el('#statusIndicator');
    refs.historyList = Utils.el('#historyList');
    refs.historyCount = Utils.el('#historyCount');
    refs.focusProgressBar = Utils.el('#focusProgressBar');
    refs.quickFocusMins = Utils.el('#quickFocusMins');
    refs.quickSessions = Utils.el('#quickSessions');
    refs.modeButtons = Utils.els('[data-mode]');
    refs.categoryChips = Utils.els('[data-category]');
  };

  // ─── Timer Ring ───────────────────────────────────────────────────────────
  const _initRing = () => {
    const svg = Utils.el('#timerRingSvg');
    if (!svg) return;
    const radius = 130;
    state.circumference = 2 * Math.PI * radius;

    Utils.els('circle', svg).forEach((c) => {
      c.setAttribute('r', radius);
      c.setAttribute('cx', '150');
      c.setAttribute('cy', '150');
      c.style.strokeDasharray = state.circumference;
    });

    if (refs.ring) refs.ring.style.strokeDashoffset = '0';
    if (refs.ringGlow) refs.ringGlow.style.strokeDashoffset = '0';
  };

  const _updateRing = () => {
    const progress = state.remainingSeconds / state.totalSeconds;
    const offset = state.circumference * (1 - progress);
    if (refs.ring) refs.ring.style.strokeDashoffset = offset;
    if (refs.ringGlow) refs.ringGlow.style.strokeDashoffset = offset;
    if (refs.focusProgressBar) {
      refs.focusProgressBar.style.width = `${(1 - progress) * 100}%`;
    }
  };

  // ─── Display ──────────────────────────────────────────────────────────────
  const _updateDisplay = () => {
    if (refs.timerDisplay) {
      refs.timerDisplay.textContent = Utils.formatTime(state.remainingSeconds);
    }
    _updateRing();
    _updateSessionDots();
    _updateStatusIndicator();
  };

  const _updateSessionDots = () => {
    if (!refs.sessionDots) return;
    refs.sessionDots.innerHTML = '';
    for (let i = 0; i < config.sessionsBeforeLong; i++) {
      const dot = Utils.createElement('div', { class: 'session-dot' });
      if (i < state.sessionCount % config.sessionsBeforeLong) dot.classList.add('completed');
      if (i === state.sessionCount % config.sessionsBeforeLong && state.mode === 'focus') dot.classList.add('current');
      refs.sessionDots.appendChild(dot);
    }
  };

  const _updateStatusIndicator = () => {
    if (!refs.statusIndicator) return;
    if (state.status === 'running') {
      refs.statusIndicator.innerHTML = `
        <div class="running-indicator">
          <div class="running-dot"></div>
          Session in progress
        </div>`;
    } else if (state.status === 'paused') {
      refs.statusIndicator.innerHTML = `
        <div class="running-indicator paused-indicator">
          <div class="running-dot paused-dot"></div>
          Paused
        </div>`;
    } else {
      refs.statusIndicator.innerHTML = `<span class="text-muted text-sm">Ready to focus</span>`;
    }
  };

  // ─── Mode Management ──────────────────────────────────────────────────────
  const _setMode = (mode) => {
    _stopTimer();
    state.mode = mode;
    state.totalSeconds = config[mode === 'shortBreak' ? 'shortBreak' : mode === 'longBreak' ? 'longBreak' : 'focus'];
    state.remainingSeconds = state.totalSeconds;
    state.status = 'idle';

    const labels = { focus: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break' };
    if (refs.modeLabel) refs.modeLabel.textContent = labels[mode];

    refs.modeButtons?.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (refs.startIcon) refs.startIcon.innerHTML = _getPlayIcon();
    _updateDisplay();
  };

  // ─── Timer Engine ─────────────────────────────────────────────────────────
  const _tick = () => {
    if (state.remainingSeconds <= 0) {
      _onComplete();
      return;
    }
    state.remainingSeconds -= 1;
    _updateDisplay();

    // Update document title
    document.title = `${Utils.formatTime(state.remainingSeconds)} — FocusFlow`;
  };

  const _startTimer = () => {
    if (state.status === 'idle') {
      // Record new session start
      if (state.mode === 'focus') {
        state.currentSessionId = StorageService.addSession({
          type: 'focus',
          category: state.category,
          duration: config.focus / 60,
          completed: false,
          date: new Date().toISOString(),
        }).id;
      }
    }

    state.status = 'running';
    state.intervalId = setInterval(_tick, 1000);

    if (refs.startIcon) refs.startIcon.innerHTML = _getPauseIcon();
    _updateStatusIndicator();
  };

  const _pauseTimer = () => {
    state.status = 'paused';
    clearInterval(state.intervalId);
    if (refs.startIcon) refs.startIcon.innerHTML = _getPlayIcon();
    _updateStatusIndicator();
  };

  const _stopTimer = () => {
    clearInterval(state.intervalId);
    state.intervalId = null;
  };

  const _onComplete = () => {
    _stopTimer();
    state.status = 'idle';

    if (state.mode === 'focus') {
      state.sessionCount += 1;
      if (state.currentSessionId) {
        StorageService.updateSession(state.currentSessionId, { completed: true });
      }
      _addToHistory({ type: 'focus', duration: config.focus / 60, completed: true });

      // Update streak + score
      const user = StorageService.getUser();
      StorageService.saveUser({ streak: user.streak + (state.sessionCount === 1 ? 1 : 0) });

      // Auto-switch to break
      const isLongBreak = state.sessionCount % config.sessionsBeforeLong === 0;
      _showCompletionNotification(isLongBreak ? 'longBreak' : 'shortBreak');
      setTimeout(() => _setMode(isLongBreak ? 'longBreak' : 'shortBreak'), 1500);
    } else {
      _addToHistory({ type: 'break', duration: state.totalSeconds / 60, completed: true });
      _showCompletionNotification('focus');
      setTimeout(() => _setMode('focus'), 1500);
    }

    _updateQuickStats();
    document.title = 'FocusFlow — Session Complete!';
    setTimeout(() => { document.title = 'FocusFlow'; }, 3000);
  };

  const _showCompletionNotification = (nextMode) => {
    const messages = {
      shortBreak: { icon: '☕', text: 'Great job! Time for a 5-min break.' },
      longBreak: { icon: '🌿', text: 'Excellent! You earned a long break.' },
      focus: { icon: '🎯', text: 'Break over! Ready to focus again?' },
    };
    const msg = messages[nextMode];
    _showToast(msg.icon, msg.text, 'success');

    // Browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('FocusFlow', { body: msg.text, icon: '/assets/icons/icon-192.png' });
    }
  };

  const _showToast = (icon, text, type = 'info') => {
    const container = Utils.el('#toastContainer') || (() => {
      const c = Utils.createElement('div', { class: 'toast-container', id: 'toastContainer' });
      document.body.appendChild(c);
      return c;
    })();

    const toast = Utils.createElement('div', { class: `toast toast-${type}` }, [
      Utils.createElement('span', { text: icon, style: 'font-size:20px' }),
      Utils.createElement('span', { text, class: 'text-sm' }),
    ]);

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(24px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // ─── History ──────────────────────────────────────────────────────────────
  const _addToHistory = (session) => {
    if (!refs.historyList) return;

    const icons = { focus: '🎯', break: '☕' };
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const item = Utils.createElement('div', { class: 'history-item' });
    item.innerHTML = `
      <div class="history-item-icon ${session.type}">
        ${icons[session.type] || '⏱️'}
      </div>
      <div class="history-item-details">
        <div class="history-item-type">${session.type === 'focus' ? 'Focus Session' : 'Break'}</div>
        <div class="history-item-time">${time} · ${state.category}</div>
      </div>
      <span class="history-item-duration">${session.duration}m</span>
      <div class="history-item-status ${session.completed ? 'completed' : 'incomplete'}"></div>`;

    refs.historyList.prepend(item);

    if (refs.historyCount) {
      const current = parseInt(refs.historyCount.textContent) || 0;
      refs.historyCount.textContent = current + 1;
    }
  };

  const _loadHistory = () => {
    if (!refs.historyList) return;
    const sessions = StorageService.getSessions().slice(0, 10);
    if (!sessions.length) {
      refs.historyList.innerHTML = `<div class="empty-state" style="padding:var(--space-8)"><div class="empty-state-icon">📋</div><p class="text-sm">Complete a session to see history</p></div>`;
      return;
    }
    sessions.forEach((s) => _addToHistory(s));
    if (refs.historyCount) refs.historyCount.textContent = sessions.length;
  };

  const _updateQuickStats = () => {
    const today = StorageService.getSessionsToday().filter((s) => s.type === 'focus' && s.completed);
    const totalMins = today.reduce((a, s) => a + s.duration, 0);
    if (refs.quickFocusMins) refs.quickFocusMins.textContent = `${totalMins}m`;
    if (refs.quickSessions) refs.quickSessions.textContent = today.length;
  };

  // ─── Icon helpers ─────────────────────────────────────────────────────────
  const _getPlayIcon = () => `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>`;

  const _getPauseIcon = () => `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>`;

  // ─── Event Bindings ───────────────────────────────────────────────────────
  const _bindEvents = () => {
    // Start/Pause toggle
    refs.startBtn?.addEventListener('click', () => {
      if (state.status === 'running') _pauseTimer();
      else _startTimer();
    });

    // Reset
    refs.resetBtn?.addEventListener('click', () => {
      _stopTimer();
      const settings = StorageService.getSettings();
      if (state.currentSessionId) {
        StorageService.updateSession(state.currentSessionId, { completed: false });
      }
      state.currentSessionId = null;
      state.status = 'idle';
      _setMode(state.mode);
    });

    // Skip
    refs.skipBtn?.addEventListener('click', () => {
      _stopTimer();
      state.status = 'idle';
      const nextMode = state.mode === 'focus'
        ? (state.sessionCount % config.sessionsBeforeLong === 0 ? 'longBreak' : 'shortBreak')
        : 'focus';
      _setMode(nextMode);
    });

    // Mode buttons
    refs.modeButtons?.forEach((btn) => {
      btn.addEventListener('click', () => _setMode(btn.dataset.mode));
    });

    // Category chips
    refs.categoryChips?.forEach((chip) => {
      chip.addEventListener('click', () => {
        state.category = chip.dataset.category;
        refs.categoryChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (state.status === 'running') _pauseTimer();
        else _startTimer();
      }
      if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault();
        refs.resetBtn?.click();
      }
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // ─── Public init ──────────────────────────────────────────────────────────
  const init = () => {
    const settings = StorageService.getSettings();
    config = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.breakDuration * 60,
      longBreak: settings.longBreakDuration * 60,
      sessionsBeforeLong: settings.sessionsBeforeLongBreak,
    };

    _initRefs();
    _initRing();
    _setMode('focus');
    _bindEvents();
    _loadHistory();
    _updateQuickStats();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', FocusModule.init);
