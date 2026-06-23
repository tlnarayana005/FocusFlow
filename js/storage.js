/**
 * FocusFlow — StorageService
 * Centralized localStorage layer with schema versioning.
 * All reads/writes go through this module — no direct localStorage calls elsewhere.
 */

const StorageService = (() => {
  const SCHEMA_VERSION = '1.0.0';
  const KEYS = {
    USER: 'ff_user',
    SESSIONS: 'ff_sessions',
    SETTINGS: 'ff_settings',
    VERSION: 'ff_schema_version',
  };

  // ─── Default schemas ──────────────────────────────────────────────────────

  const DEFAULT_USER = {
    name: 'Focus User',
    email: '',
    goalHours: 4,
    focusScore: 72,
    screenTime: 5.5,
    streak: 3,
    joinDate: new Date().toISOString(),
    sessions: [],
  };

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    notifications: true,
    soundEnabled: true,
    autoStartBreaks: false,
    dailyGoalHours: 4,
  };

  // ─── Internal helpers ─────────────────────────────────────────────────────

  const _read = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const _write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[StorageService] Write failed for key "${key}":`, e);
      return false;
    }
  };

  // ─── Schema migration ─────────────────────────────────────────────────────

  const _migrate = () => {
    const storedVersion = _read(KEYS.VERSION);
    if (storedVersion !== SCHEMA_VERSION) {
      // Future: add migration steps here
      _write(KEYS.VERSION, SCHEMA_VERSION);
    }
  };

  // ─── Public API ───────────────────────────────────────────────────────────

  const getUser = () => {
    const stored = _read(KEYS.USER);
    return stored ? { ...DEFAULT_USER, ...stored } : { ...DEFAULT_USER };
  };

  const saveUser = (userData) => {
    const current = getUser();
    return _write(KEYS.USER, { ...current, ...userData });
  };

  const getSettings = () => {
    const stored = _read(KEYS.SETTINGS);
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS };
  };

  const saveSettings = (settingsData) => {
    const current = getSettings();
    return _write(KEYS.SETTINGS, { ...current, ...settingsData });
  };

  const getSessions = () => _read(KEYS.SESSIONS, []);

  const addSession = (session) => {
    const sessions = getSessions();
    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      duration: 0,
      type: 'focus',
      completed: false,
      category: 'work',
      ...session,
    };
    sessions.unshift(newSession); // newest first
    _write(KEYS.SESSIONS, sessions);
    return newSession;
  };

  const updateSession = (sessionId, updates) => {
    const sessions = getSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return false;
    sessions[idx] = { ...sessions[idx], ...updates };
    return _write(KEYS.SESSIONS, sessions);
  };

  const getSessionsByDateRange = (startDate, endDate) => {
    const sessions = getSessions();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return sessions.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start && t <= end;
    });
  };

  const getSessionsToday = () => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    return getSessionsByDateRange(start, end);
  };

  const clearAllData = () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    _write(KEYS.VERSION, SCHEMA_VERSION);
  };

  /** Seed realistic demo data for first-time visitors */
  const seedDemoData = () => {
    if (_read(KEYS.SESSIONS)) return; // already seeded

    const categories = ['work', 'study', 'personal'];
    const sessions = [];
    const now = Date.now();
    const DAY = 86400000;

    for (let d = 13; d >= 0; d--) {
      const dayOffset = now - d * DAY;
      const sessCount = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < sessCount; i++) {
        sessions.push({
          id: `demo_${d}_${i}`,
          date: new Date(dayOffset + i * 3600000).toISOString(),
          duration: [25, 50, 25, 90][Math.floor(Math.random() * 4)],
          type: i % 4 === 3 ? 'break' : 'focus',
          completed: Math.random() > 0.15,
          category: categories[Math.floor(Math.random() * categories.length)],
        });
      }
    }

    _write(KEYS.SESSIONS, sessions);
  };

  const init = () => {
    _migrate();
    seedDemoData();
  };

  return {
    init,
    getUser,
    saveUser,
    getSettings,
    saveSettings,
    getSessions,
    addSession,
    updateSession,
    getSessionsByDateRange,
    getSessionsToday,
    clearAllData,
    KEYS,
  };
})();
