/**
 * FocusFlow — Settings Module (settings.js)
 * Reads/writes user preferences, syncs theme, handles form submissions.
 */

const SettingsModule = (() => {

  // ─── Load all settings into the form ──────────────────────────────────────
  const _loadSettings = () => {
    const settings = StorageService.getSettings();
    const user = StorageService.getUser();

    const fields = {
      '#settings-name': user.name,
      '#settings-email': user.email,
      '#settings-goal-hours': user.goalHours,
      '#settings-focus-duration': settings.focusDuration,
      '#settings-break-duration': settings.breakDuration,
      '#settings-long-break': settings.longBreakDuration,
      '#settings-sessions-before-long': settings.sessionsBeforeLongBreak,
    };

    Object.entries(fields).forEach(([sel, val]) => {
      const el = Utils.el(sel);
      if (el) el.value = val;
    });

    const toggleFields = {
      '#settings-notifications': settings.notifications,
      '#settings-sound': settings.soundEnabled,
      '#settings-auto-break': settings.autoStartBreaks,
    };

    Object.entries(toggleFields).forEach(([sel, val]) => {
      const el = Utils.el(sel);
      if (el) el.checked = val;
    });

    // Theme selector
    const themeCards = Utils.els('[data-theme-select]');
    themeCards.forEach((card) => {
      card.classList.toggle('active', card.dataset.themeSelect === ThemeManager.getTheme());
    });
  };

  // ─── Profile form ─────────────────────────────────────────────────────────
  const _bindProfileForm = () => {
    const form = Utils.el('#profileForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = Utils.el('#settings-name')?.value.trim();
      const email = Utils.el('#settings-email')?.value.trim();
      const goalHours = parseFloat(Utils.el('#settings-goal-hours')?.value) || 4;

      if (!name) return _showToast('error', 'Name cannot be empty.');

      StorageService.saveUser({ name, email, goalHours });
      _showToast('success', 'Profile saved successfully!');

      // Update nav username if shown
      const navName = Utils.el('#navUserName');
      if (navName) navName.textContent = name;
    });
  };

  // ─── Timer preferences ────────────────────────────────────────────────────
  const _bindTimerForm = () => {
    const form = Utils.el('#timerForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const focusDuration = parseInt(Utils.el('#settings-focus-duration')?.value) || 25;
      const breakDuration = parseInt(Utils.el('#settings-break-duration')?.value) || 5;
      const longBreakDuration = parseInt(Utils.el('#settings-long-break')?.value) || 15;
      const sessionsBeforeLongBreak = parseInt(Utils.el('#settings-sessions-before-long')?.value) || 4;

      if (focusDuration < 1 || focusDuration > 120) return _showToast('error', 'Focus duration must be 1–120 minutes.');
      if (breakDuration < 1 || breakDuration > 60) return _showToast('error', 'Break duration must be 1–60 minutes.');

      StorageService.saveSettings({ focusDuration, breakDuration, longBreakDuration, sessionsBeforeLongBreak });
      _showToast('success', 'Timer settings saved!');
    });
  };

  // ─── Notification toggles ─────────────────────────────────────────────────
  const _bindNotificationToggles = () => {
    const toggleMap = {
      '#settings-notifications': 'notifications',
      '#settings-sound': 'soundEnabled',
      '#settings-auto-break': 'autoStartBreaks',
    };

    Object.entries(toggleMap).forEach(([sel, key]) => {
      const el = Utils.el(sel);
      if (!el) return;
      el.addEventListener('change', () => {
        StorageService.saveSettings({ [key]: el.checked });
        if (key === 'notifications' && el.checked) {
          Notification.requestPermission();
        }
      });
    });
  };

  // ─── Theme selection cards ─────────────────────────────────────────────────
  const _bindThemeCards = () => {
    Utils.els('[data-theme-select]').forEach((card) => {
      card.addEventListener('click', () => {
        const theme = card.dataset.themeSelect;
        ThemeManager.applyTheme(theme);
        StorageService.saveSettings({ theme });
        Utils.els('[data-theme-select]').forEach((c) =>
          c.classList.toggle('active', c.dataset.themeSelect === theme)
        );
      });
    });
  };

  // ─── Data management ──────────────────────────────────────────────────────
  const _bindDataActions = () => {
    const exportBtn = Utils.el('#exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = {
          user: StorageService.getUser(),
          sessions: StorageService.getSessions(),
          settings: StorageService.getSettings(),
          exportDate: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `focusflow-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        _showToast('success', 'Data exported successfully!');
      });
    }

    const clearBtn = Utils.el('#clearDataBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const confirmed = confirm('This will permanently delete all your FocusFlow data. Are you sure?');
        if (confirmed) {
          StorageService.clearAllData();
          _showToast('success', 'All data cleared. Reloading...');
          setTimeout(() => location.reload(), 1500);
        }
      });
    }
  };

  // ─── Settings nav (sidebar tabs) ──────────────────────────────────────────
  const _bindSettingsNav = () => {
    const navItems = Utils.els('[data-settings-section]');
    const sections = Utils.els('[data-section]');

    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const target = item.dataset.settingsSection;
        navItems.forEach((n) => n.classList.remove('active'));
        item.classList.add('active');

        sections.forEach((s) => {
          s.style.display = s.dataset.section === target ? 'block' : 'none';
        });
      });
    });

    // Show first section
    if (navItems[0]) navItems[0].classList.add('active');
    sections.forEach((s, i) => { s.style.display = i === 0 ? 'block' : 'none'; });
  };

  // ─── Toast helper ─────────────────────────────────────────────────────────
  const _showToast = (type, message) => {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    let container = Utils.el('#toastContainer');
    if (!container) {
      container = Utils.createElement('div', { class: 'toast-container', id: 'toastContainer' });
      document.body.appendChild(container);
    }

    const toast = Utils.createElement('div', { class: `toast toast-${type}` });
    toast.innerHTML = `<span style="font-size:18px">${icons[type] || 'ℹ️'}</span><span class="text-sm">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(24px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // ─── Public init ──────────────────────────────────────────────────────────
  const init = () => {
    _loadSettings();
    _bindProfileForm();
    _bindTimerForm();
    _bindNotificationToggles();
    _bindThemeCards();
    _bindDataActions();
    _bindSettingsNav();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', SettingsModule.init);
