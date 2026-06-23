/**
 * FocusFlow — Reports Module (reports.js)
 * Aggregates session data, renders 3 Chart.js visualizations.
 */

const ReportsModule = (() => {
  let lineChart = null;
  let doughnutChart = null;
  let monthlyChart = null;

  const _isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  const _chartTooltipDefaults = () => ({
    backgroundColor: _isDark() ? '#1A1A2E' : '#fff',
    titleColor: _isDark() ? '#F0F0FF' : '#1A1A2E',
    bodyColor: _isDark() ? 'rgba(240,240,255,0.65)' : 'rgba(26,26,46,0.65)',
    borderColor: _isDark() ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 10,
  });

  const _gridColor = () => _isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const _tickColor = () => _isDark() ? 'rgba(240,240,255,0.4)' : 'rgba(26,26,46,0.4)';

  // ─── Data aggregation ──────────────────────────────────────────────────────

  const _getWeeklyTrend = (sessions, weeks = 8) => {
    const labels = [];
    const data = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - w * 7);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);

      const weekSessions = sessions.filter((s) => {
        const t = new Date(s.date).getTime();
        return t >= startDate.getTime() && t <= endDate.getTime() && s.completed && s.type === 'focus';
      });

      const totalHours = weekSessions.reduce((a, s) => a + s.duration, 0) / 60;
      labels.push(`W${weeks - w}`);
      data.push(+totalHours.toFixed(1));
    }
    return { labels, data };
  };

  const _getMonthlyData = (sessions) => {
    const months = [];
    const data = [];
    for (let m = 5; m >= 0; m--) {
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthStr);

      const monthSessions = sessions.filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear() &&
          s.completed && s.type === 'focus';
      });
      data.push(+(monthSessions.reduce((a, s) => a + s.duration, 0) / 60).toFixed(1));
    }
    return { labels: months, data };
  };

  const _getCategoryData = (sessions) => {
    const map = { work: 0, study: 0, personal: 0 };
    sessions.filter((s) => s.completed && s.type === 'focus').forEach((s) => {
      const cat = s.category || 'work';
      map[cat] = (map[cat] || 0) + s.duration;
    });
    return {
      labels: ['Work', 'Study', 'Personal'],
      data: [+(map.work / 60).toFixed(1), +(map.study / 60).toFixed(1), +(map.personal / 60).toFixed(1)],
      colors: ['#6C5CE7', '#00CEC9', '#FDCB6E'],
    };
  };

  // ─── Chart renderers ──────────────────────────────────────────────────────

  const _renderLineChart = (sessions) => {
    const ctx = Utils.el('#weeklyTrendChart');
    if (!ctx) return;
    if (lineChart) lineChart.destroy();

    const { labels, data } = _getWeeklyTrend(sessions);

    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Focus Hours',
          data,
          borderColor: '#6C5CE7',
          backgroundColor: 'rgba(108,92,231,0.10)',
          borderWidth: 2.5,
          pointBackgroundColor: '#6C5CE7',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2.5,
        plugins: {
          legend: { display: false },
          tooltip: {
            ..._chartTooltipDefaults(),
            callbacks: { label: (c) => ` ${c.raw}h focused` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: _tickColor() },
          },
          y: {
            grid: { color: _gridColor() },
            border: { display: false },
            ticks: { color: _tickColor(), callback: (v) => `${v}h` },
            beginAtZero: true,
          },
        },
      },
    });
  };

  const _renderDoughnutChart = (sessions) => {
    const ctx = Utils.el('#categoryChart');
    if (!ctx) return;
    if (doughnutChart) doughnutChart.destroy();

    const { labels, data, colors } = _getCategoryData(sessions);

    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.map((c) => c + 'CC'),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.3,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: _isDark() ? 'rgba(240,240,255,0.65)' : 'rgba(26,26,46,0.65)',
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            ..._chartTooltipDefaults(),
            callbacks: { label: (c) => ` ${c.label}: ${c.raw}h` },
          },
        },
      },
    });
  };

  const _renderMonthlyChart = (sessions) => {
    const ctx = Utils.el('#monthlyChart');
    if (!ctx) return;
    if (monthlyChart) monthlyChart.destroy();

    const { labels, data } = _getMonthlyData(sessions);

    monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Focus Hours',
          data,
          backgroundColor: labels.map((_, i) =>
            i === labels.length - 1 ? '#6C5CE7' : 'rgba(108,92,231,0.35)'
          ),
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          legend: { display: false },
          tooltip: {
            ..._chartTooltipDefaults(),
            callbacks: { label: (c) => ` ${c.raw}h this month` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: _tickColor() },
          },
          y: {
            grid: { color: _gridColor() },
            border: { display: false },
            ticks: { color: _tickColor(), callback: (v) => `${v}h` },
            beginAtZero: true,
          },
        },
      },
    });
  };

  // ─── Summary Stats ─────────────────────────────────────────────────────────

  const _renderSummaryStats = (sessions) => {
    const completedFocus = sessions.filter((s) => s.completed && s.type === 'focus');
    const totalHours = (completedFocus.reduce((a, s) => a + s.duration, 0) / 60).toFixed(1);
    const totalSessions = completedFocus.length;
    const avgSession = totalSessions > 0
      ? Math.round(completedFocus.reduce((a, s) => a + s.duration, 0) / totalSessions)
      : 0;

    const thisWeek = completedFocus.filter((s) => {
      return new Date(s.date).getTime() > Date.now() - 7 * 86400000;
    });
    const weeklyHours = (thisWeek.reduce((a, s) => a + s.duration, 0) / 60).toFixed(1);

    const statsMap = {
      '#report-total-hours': totalHours + 'h',
      '#report-total-sessions': totalSessions,
      '#report-avg-session': avgSession + 'm',
      '#report-weekly-hours': weeklyHours + 'h',
    };

    Object.entries(statsMap).forEach(([sel, val]) => {
      const el = Utils.el(sel);
      if (el) el.textContent = val;
    });
  };

  // ─── Category Breakdown Table ──────────────────────────────────────────────

  const _renderCategoryTable = (sessions) => {
    const table = Utils.el('#categoryTable');
    if (!table) return;

    const cats = { work: { label: 'Work', icon: '💼', color: '#6C5CE7' },
                   study: { label: 'Study', icon: '📚', color: '#00CEC9' },
                   personal: { label: 'Personal', icon: '🌿', color: '#FDCB6E' } };

    const completedFocus = sessions.filter((s) => s.completed && s.type === 'focus');
    const totalMins = completedFocus.reduce((a, s) => a + s.duration, 0);

    const rows = Object.entries(cats).map(([key, meta]) => {
      const catSessions = completedFocus.filter((s) => (s.category || 'work') === key);
      const mins = catSessions.reduce((a, s) => a + s.duration, 0);
      const pct = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
      return { ...meta, mins, pct, count: catSessions.length };
    });

    table.innerHTML = rows
      .map(
        (r) => `
      <tr>
        <td>
          <span style="display:flex;align-items:center;gap:8px">
            <span>${r.icon}</span>
            <span class="font-medium">${r.label}</span>
          </span>
        </td>
        <td class="text-secondary">${r.count} sessions</td>
        <td class="text-secondary">${Utils.formatHours(r.mins / 60)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress" style="flex:1;height:6px">
              <div class="progress-bar" style="width:${r.pct}%;background:${r.color}"></div>
            </div>
            <span class="text-xs text-muted" style="min-width:32px">${r.pct}%</span>
          </div>
        </td>
      </tr>`
      )
      .join('');
  };

  // ─── Productivity Insights ─────────────────────────────────────────────────

  const _renderInsights = (sessions) => {
    const container = Utils.el('#insightsList');
    if (!container) return;

    const user = StorageService.getUser();
    const analysis = ProductivityAI.analyze(sessions, user, StorageService.getSettings());

    const insights = [
      {
        icon: analysis.trend === 'improving' ? '📈' : analysis.trend === 'declining' ? '📉' : '📊',
        title: `Productivity is ${analysis.trend}`,
        desc: analysis.trend === 'improving'
          ? 'Your focus time increased compared to last week. Keep it up!'
          : analysis.trend === 'declining'
          ? 'Focus time dipped this week. Consider scheduling dedicated blocks.'
          : 'Your productivity is consistent. Try pushing for a new record!',
      },
      ...analysis.recommendations.map((r) => ({ icon: r.icon, title: 'Insight', desc: r.text })),
    ];

    container.innerHTML = insights
      .map(
        (ins) => `
      <div class="rec-item">
        <span class="rec-icon">${ins.icon}</span>
        <div>
          <div class="font-semibold text-sm">${ins.title}</div>
          <div class="rec-text">${ins.desc}</div>
        </div>
      </div>`
      )
      .join('');
  };

  // ─── Public init ──────────────────────────────────────────────────────────

  const init = () => {
    Chart.defaults.font.family = "'Inter', sans-serif";
    const sessions = StorageService.getSessions();

    _renderSummaryStats(sessions);
    _renderLineChart(sessions);
    _renderDoughnutChart(sessions);
    _renderMonthlyChart(sessions);
    _renderCategoryTable(sessions);
    _renderInsights(sessions);

    // Re-render on theme change
    const observer = new MutationObserver(() => {
      Chart.defaults.color = _isDark() ? 'rgba(240,240,255,0.5)' : 'rgba(26,26,46,0.5)';
      _renderLineChart(sessions);
      _renderDoughnutChart(sessions);
      _renderMonthlyChart(sessions);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', ReportsModule.init);
