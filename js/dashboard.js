/**
 * FocusFlow — Dashboard Module (dashboard.js)
 * Reads data from StorageService + ProductivityAI, renders all dashboard UI.
 */

const DashboardModule = (() => {
  let weeklyChart = null;
  let scoreChart = null;

  // ─── Chart.js global defaults ─────────────────────────────────────────────
  const _applyChartDefaults = () => {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    Chart.defaults.color = isDark ? 'rgba(240,240,255,0.5)' : 'rgba(26,26,46,0.5)';
    Chart.defaults.borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
  };

  // ─── Stat Cards ───────────────────────────────────────────────────────────
  const _renderStatCards = (user, sessions, analysis) => {
    const todaySessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d.toDateString() === new Date().toDateString() && s.completed;
    });
    const totalMinsToday = todaySessions
      .filter((s) => s.type === 'focus')
      .reduce((a, s) => a + s.duration, 0);

    const statsMap = {
      '#stat-focus-score': { value: analysis.score, suffix: '', prev: analysis.score - 5 },
      '#stat-screen-time': { value: user.screenTime, suffix: 'h', prev: user.screenTime + 0.5, format: (v) => v.toFixed(1) },
      '#stat-sessions': { value: todaySessions.filter((s) => s.type === 'focus').length, suffix: '', prev: 0 },
      '#stat-streak': { value: user.streak, suffix: '', prev: user.streak - 1 },
    };

    Object.entries(statsMap).forEach(([selector, data]) => {
      const el = Utils.el(selector);
      if (!el) return;
      const display = data.format ? data.format(data.value) : Math.round(data.value);
      Utils.animateNumber(el, data.prev || 0, typeof data.value === 'number' ? data.value : 0, 900, data.suffix);
      if (data.format) el.textContent = display + data.suffix;
    });

    const totalFocusHoursEl = Utils.el('#stat-focus-hours');
    if (totalFocusHoursEl) {
      Utils.animateNumber(totalFocusHoursEl, 0, +(totalMinsToday / 60).toFixed(1) * 10, 900);
      setTimeout(() => {
        totalFocusHoursEl.textContent = Utils.formatHours(totalMinsToday / 60);
      }, 920);
    }
  };

  // ─── Weekly Bar Chart ──────────────────────────────────────────────────────
  const _renderWeeklyChart = (weeklyData) => {
    const ctx = Utils.el('#weeklyChart');
    if (!ctx) return;

    if (weeklyChart) weeklyChart.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeklyData.labels,
        datasets: [
          {
            label: 'Focus',
            data: weeklyData.focusData,
            backgroundColor: 'rgba(108,92,231,0.80)',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Break',
            data: weeklyData.breakData,
            backgroundColor: 'rgba(0,206,201,0.40)',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2.2,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1A1A2E' : '#fff',
            titleColor: isDark ? '#F0F0FF' : '#1A1A2E',
            bodyColor: isDark ? 'rgba(240,240,255,0.65)' : 'rgba(26,26,46,0.65)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}h`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: isDark ? 'rgba(240,240,255,0.4)' : 'rgba(26,26,46,0.4)' },
          },
          y: {
            grid: { color: gridColor, drawBorder: false },
            border: { display: false },
            ticks: {
              color: isDark ? 'rgba(240,240,255,0.4)' : 'rgba(26,26,46,0.4)',
              callback: (v) => `${v}h`,
            },
            beginAtZero: true,
          },
        },
      },
    });
  };

  // ─── Focus Score Ring ──────────────────────────────────────────────────────
  const _renderScoreRing = (score) => {
    const ring = Utils.el('#scoreRing');
    const scoreText = Utils.el('#scoreValue');
    const scoreDesc = Utils.el('#scoreDesc');
    if (!ring) return;

    const circumference = 2 * Math.PI * 70;
    ring.style.strokeDasharray = circumference;

    const animateTo = Math.round(Utils.clamp(score, 0, 100));
    let current = 0;
    const step = () => {
      current = Math.min(current + 2, animateTo);
      const offset = circumference - (current / 100) * circumference;
      ring.style.strokeDashoffset = offset;
      if (scoreText) scoreText.textContent = current;
      if (current < animateTo) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    if (scoreDesc) {
      if (score >= 80) scoreDesc.textContent = 'Excellent';
      else if (score >= 60) scoreDesc.textContent = 'Good';
      else if (score >= 40) scoreDesc.textContent = 'Fair';
      else scoreDesc.textContent = 'Needs Work';
    }
  };

  // ─── Streak Display ────────────────────────────────────────────────────────
  const _renderStreak = (streak) => {
    const numberEl = Utils.el('#streakNumber');
    const dotsEl = Utils.el('#streakDots');
    if (numberEl) Utils.animateNumber(numberEl, 0, streak, 800);

    if (dotsEl) {
      dotsEl.innerHTML = '';
      const emojis = ['😴', '🌱', '🌿', '🔥', '⚡', '🚀', '💎', '👑'];
      for (let i = 0; i < 7; i++) {
        const dot = Utils.createElement('div', { class: 'streak-dot' });
        if (i < streak % 7) dot.classList.add('active');
        if (i === (streak - 1) % 7) {
          dot.classList.add('today');
          dot.textContent = '🔥';
        } else if (i < streak % 7) {
          dot.textContent = '✓';
        }
        dotsEl.appendChild(dot);
      }
    }
  };

  // ─── Goal Progress ─────────────────────────────────────────────────────────
  const _renderGoals = (user, sessions) => {
    const goalList = Utils.el('#goalList');
    if (!goalList) return;

    const todayFocusMins = sessions
      .filter((s) => {
        const d = new Date(s.date);
        return d.toDateString() === new Date().toDateString() && s.completed && s.type === 'focus';
      })
      .reduce((a, s) => a + s.duration, 0);

    const goals = [
      {
        icon: '⏱️',
        name: 'Daily Focus Goal',
        current: todayFocusMins / 60,
        target: user.goalHours,
        unit: 'h',
        color: 'var(--brand-primary)',
      },
      {
        icon: '📵',
        name: 'Screen Time Limit',
        current: Math.max(0, 8 - user.screenTime),
        target: 8,
        unit: 'h under limit',
        color: 'var(--brand-accent)',
        invertProgress: true,
      },
      {
        icon: '🔥',
        name: 'Weekly Streak',
        current: user.streak,
        target: 7,
        unit: 'days',
        color: 'var(--brand-warning)',
      },
    ];

    goalList.innerHTML = goals
      .map((g) => {
        const progress = Math.min((g.current / g.target) * 100, 100);
        return `
        <div class="goal-item">
          <div class="goal-item-header">
            <span class="goal-item-name">${g.icon} ${g.name}</span>
            <span class="goal-item-value">${g.current.toFixed(1)} / ${g.target}${g.unit}</span>
          </div>
          <div class="progress">
            <div class="progress-bar" style="width:${progress}%; background:${g.color};"></div>
          </div>
        </div>`;
      })
      .join('');
  };

  // ─── AI Recommendations ────────────────────────────────────────────────────
  const _renderRecommendations = (recommendations) => {
    const list = Utils.el('#recommendationsList');
    if (!list) return;

    if (!recommendations.length) {
      list.innerHTML = `<div class="rec-item"><span class="rec-icon">✨</span><span class="rec-text">All caught up! Keep up the great work.</span></div>`;
      return;
    }

    list.innerHTML = recommendations
      .map(
        (r) => `
      <div class="rec-item">
        <span class="rec-icon">${r.icon}</span>
        <span class="rec-text">${r.text}</span>
      </div>`
      )
      .join('');
  };

  // ─── Recent Sessions ───────────────────────────────────────────────────────
  const _renderRecentSessions = (sessions) => {
    const list = Utils.el('#recentSessionsList');
    if (!list) return;

    const recent = sessions.filter((s) => s.type === 'focus').slice(0, 5);

    if (!recent.length) {
      list.innerHTML = `<div class="empty-state" style="padding:var(--space-8)"><div class="empty-state-icon">⏱️</div><p>No sessions yet. Start your first focus session!</p></div>`;
      return;
    }

    const catColors = {
      work: 'var(--brand-primary)',
      study: 'var(--brand-accent)',
      personal: 'var(--brand-warning)',
      break: 'var(--brand-success)',
    };

    list.innerHTML = recent
      .map((s) => {
        const color = catColors[s.category] || 'var(--text-muted)';
        const time = new Date(s.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `
        <div class="session-mini-item">
          <div class="session-mini-dot" style="background:${color}"></div>
          <span class="text-sm font-medium">${s.category || 'Work'}</span>
          <span class="badge badge-primary" style="font-size:10px">${s.duration}m</span>
          ${s.completed ? '<span class="text-success" style="font-size:12px">✓</span>' : ''}
          <span class="session-mini-time">${time}</span>
        </div>`;
      })
      .join('');
  };

  // ─── Trend Indicator ──────────────────────────────────────────────────────
  const _renderTrend = (trend) => {
    const el = Utils.el('#trendIndicator');
    if (!el) return;
    const icons = { improving: '↑', stable: '→', declining: '↓' };
    const classes = { improving: 'positive', stable: '', declining: 'negative' };
    el.className = `stat-change ${classes[trend]}`;
    el.innerHTML = `${icons[trend]} ${trend.charAt(0).toUpperCase() + trend.slice(1)} vs last week`;
  };

  // ─── Public init ──────────────────────────────────────────────────────────
  const init = () => {
    _applyChartDefaults();

    const user = StorageService.getUser();
    const sessions = StorageService.getSessions();
    const settings = StorageService.getSettings();
    const analysis = ProductivityAI.analyze(sessions, user, settings);

    // Greeting
    const greetingEl = Utils.el('#dashboardGreeting');
    if (greetingEl) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      greetingEl.textContent = `${greeting}, ${user.name.split(' ')[0]} 👋`;
    }

    const dateEl = Utils.el('#dashboardDate');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    }

    _renderStatCards(user, sessions, analysis);
    _renderWeeklyChart(analysis.weeklyData);
    _renderScoreRing(analysis.score);
    _renderStreak(user.streak);
    _renderGoals(user, sessions);
    _renderRecommendations(analysis.recommendations);
    _renderRecentSessions(sessions);
    _renderTrend(analysis.trend);

    // Theme change re-renders chart
    const themeObserver = new MutationObserver(() => {
      _applyChartDefaults();
      _renderWeeklyChart(analysis.weeklyData);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', DashboardModule.init);
