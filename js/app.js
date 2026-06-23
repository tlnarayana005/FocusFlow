/**
 * FocusFlow — AppCore (app.js)
 * Bootstraps the application: theme, navigation, shared utilities,
 * and the simulated AI productivity engine.
 * Exposes: Utils, ThemeManager, NavManager, ProductivityAI
 */

// ─── Utility Functions ────────────────────────────────────────────────────────

const Utils = (() => {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatHours = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const lerp = (a, b, t) => a + (b - a) * t;

  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const generateId = () =>
    `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;

  const el = (selector, parent = document) => parent.querySelector(selector);

  const els = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const createElement = (tag, attrs = {}, children = []) => {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') element.className = v;
      else if (k === 'html') element.innerHTML = v;
      else if (k === 'text') element.textContent = v;
      else element.setAttribute(k, v);
    });
    children.forEach((child) => {
      if (typeof child === 'string') element.appendChild(document.createTextNode(child));
      else if (child) element.appendChild(child);
    });
    return element;
  };

  const animateNumber = (element, from, to, duration = 800, suffix = '') => {
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = from + (to - from) * eased;
      element.textContent = Math.round(current) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  return {
    formatTime,
    formatHours,
    formatDate,
    getDayName,
    clamp,
    lerp,
    debounce,
    generateId,
    el,
    els,
    createElement,
    animateNumber,
  };
})();

// ─── Theme Manager ────────────────────────────────────────────────────────────

const ThemeManager = (() => {
  const THEME_KEY = 'ff_theme';

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    const toggles = Utils.els('[data-theme-toggle]');
    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
      toggle.classList.toggle('active', theme === 'dark');
    });
  };

  const getTheme = () => localStorage.getItem(THEME_KEY) || 'dark';

  const toggle = () => {
    const current = getTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
  };

  const init = () => {
    applyTheme(getTheme());
  };

  return { init, toggle, getTheme, applyTheme };
})();

// ─── Navigation Manager ───────────────────────────────────────────────────────

const NavManager = (() => {
  const init = () => {
    // Highlight active nav link
    const path = window.location.pathname.split('/').pop() || 'index.html';
    Utils.els('[data-nav-link]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    // Mobile hamburger
    const hamburger = Utils.el('#hamburger');
    const mobileNav = Utils.el('#mobile-nav');
    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', () => {
        const isOpen = mobileNav.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
        hamburger.classList.toggle('active', isOpen);
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
          mobileNav.classList.remove('open');
          hamburger.setAttribute('aria-expanded', false);
          hamburger.classList.remove('active');
        }
      });
    }

    // Theme toggle buttons
    Utils.els('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => ThemeManager.toggle());
    });
  };

  return { init };
})();

// ─── Productivity AI Engine ───────────────────────────────────────────────────

const ProductivityAI = (() => {
  const CATEGORIES = {
    work: { label: 'Work', color: '#6C5CE7', icon: '💼' },
    study: { label: 'Study', color: '#00CEC9', icon: '📚' },
    personal: { label: 'Personal', color: '#FDCB6E', icon: '🌿' },
    break: { label: 'Break', color: '#74B9FF', icon: '☕' },
  };

  const _computeScore = (sessions, goalHours) => {
    if (!sessions.length) return 0;
    const todaySessions = sessions.filter((s) => {
      const d = new Date(s.date);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    });
    const completedToday = todaySessions.filter((s) => s.completed);
    const totalMinutesToday = completedToday.reduce((a, s) => a + s.duration, 0);
    const goalMinutes = goalHours * 60;
    const completionRate = Math.min(totalMinutesToday / goalMinutes, 1);
    const sessionBonus = Math.min(completedToday.length * 5, 20);
    const streakBonus = 0; // handled externally
    return Math.round(completionRate * 80 + sessionBonus);
  };

  const _getCategoryBreakdown = (sessions) => {
    const map = {};
    sessions.forEach((s) => {
      const cat = s.type === 'break' ? 'break' : s.category || 'work';
      if (!map[cat]) map[cat] = { minutes: 0, count: 0 };
      if (s.completed) {
        map[cat].minutes += s.duration;
        map[cat].count += 1;
      }
    });
    return Object.entries(map).map(([key, val]) => ({
      key,
      label: CATEGORIES[key]?.label || key,
      color: CATEGORIES[key]?.color || '#888',
      icon: CATEGORIES[key]?.icon || '📌',
      minutes: val.minutes,
      count: val.count,
      hours: +(val.minutes / 60).toFixed(1),
    }));
  };

  const _getTrend = (sessions) => {
    const weekAgo = Date.now() - 7 * 86400000;
    const twoWeeksAgo = Date.now() - 14 * 86400000;
    const thisWeek = sessions.filter(
      (s) => new Date(s.date).getTime() > weekAgo && s.completed
    );
    const lastWeek = sessions.filter((s) => {
      const t = new Date(s.date).getTime();
      return t > twoWeeksAgo && t <= weekAgo && s.completed;
    });
    const thisTotal = thisWeek.reduce((a, s) => a + s.duration, 0);
    const lastTotal = lastWeek.reduce((a, s) => a + s.duration, 0);
    if (lastTotal === 0) return 'improving';
    const delta = (thisTotal - lastTotal) / lastTotal;
    if (delta > 0.1) return 'improving';
    if (delta < -0.1) return 'declining';
    return 'stable';
  };

  const _getRecommendations = (sessions, user, settings) => {
    const recs = [];
    const todaySessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d.toDateString() === new Date().toDateString();
    });
    const completedToday = todaySessions.filter((s) => s.completed && s.type === 'focus');
    const totalMinsToday = completedToday.reduce((a, s) => a + s.duration, 0);
    const screenTime = user.screenTime || 0;
    const trend = _getTrend(sessions);

    if (completedToday.length === 0) {
      recs.push({ icon: '🚀', text: 'Start your first focus session to build momentum today.' });
    }

    if (screenTime > 8) {
      recs.push({ icon: '📵', text: 'Your screen time is high. Try reducing social media by 30 minutes.' });
    }

    if (totalMinsToday < 60 && completedToday.length > 0) {
      recs.push({ icon: '⏱️', text: 'You\'re on track! Aim for 2 more sessions to hit your daily goal.' });
    }

    if (user.streak >= 7) {
      recs.push({ icon: '🔥', text: `${user.streak}-day streak! Challenge yourself with a 90-minute deep work session.` });
    }

    if (trend === 'declining') {
      recs.push({ icon: '📉', text: 'Productivity dipped this week. Try time-blocking your mornings.' });
    }

    if (trend === 'improving') {
      recs.push({ icon: '📈', text: 'Great progress this week! You\'re building a strong focus habit.' });
    }

    if (totalMinsToday >= (user.goalHours || 4) * 60) {
      recs.push({ icon: '🏆', text: 'Daily goal achieved! Rest well — consistency beats intensity.' });
    }

    return recs.slice(0, 3); // max 3 recommendations
  };

  const _getWeeklyData = (sessions) => {
    const labels = [];
    const focusData = [];
    const breakData = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      labels.push(Utils.getDayName(d));
      const dayStr = date.toDateString();
      const daySessions = sessions.filter(
        (s) => new Date(s.date).toDateString() === dayStr && s.completed
      );
      const focusMins = daySessions
        .filter((s) => s.type === 'focus')
        .reduce((a, s) => a + s.duration, 0);
      const breakMins = daySessions
        .filter((s) => s.type === 'break')
        .reduce((a, s) => a + s.duration, 0);
      focusData.push(+(focusMins / 60).toFixed(2));
      breakData.push(+(breakMins / 60).toFixed(2));
    }
    return { labels, focusData, breakData };
  };

  const analyze = (sessions = [], user = {}, settings = {}) => {
    const score = _computeScore(sessions, user.goalHours || 4);
    const categories = _getCategoryBreakdown(sessions);
    const trend = _getTrend(sessions);
    const recommendations = _getRecommendations(sessions, user, settings);
    const weeklyData = _getWeeklyData(sessions);
    return { score, categories, trend, recommendations, weeklyData, CATEGORIES };
  };

  return { analyze, CATEGORIES };
})();

// ─── App Bootstrap ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  StorageService.init();
  ThemeManager.init();
  NavManager.init();

  // Animate elements on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  Utils.els('[data-animate]').forEach((el) => observer.observe(el));
});
