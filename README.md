# ⚡ FocusFlow

A modern productivity app to help you reduce screen time and build focus habits.

## Pages

| Page | File | Description |
|------|------|-------------|
| Landing | `index.html` | Hero, features, testimonials |
| Dashboard | `dashboard.html` | Stats, charts, AI insights |
| Focus | `focus.html` | Pomodoro timer |
| Reports | `reports.html` | Analytics charts |
| Settings | `settings.html` | Preferences |
| About | `about.html` | Team & mission |

## Run Locally

Just open `index.html` in your browser — no build step needed.

```bash
# Or use a simple local server:
npx serve .
```

## Features

- ⏱️ Pomodoro timer (25/5/15 min)
- 📊 Chart.js analytics (line, bar, doughnut)
- 🤖 Simulated AI recommendations
- 🔥 Streak tracker
- 🌙 Dark / Light mode
- 💾 All data in localStorage — no backend

## Tech Stack

HTML5 · CSS3 · Vanilla JS (ES6+) · Chart.js · localStorage

## Data Storage

All data lives in the browser's `localStorage` under these keys:

- `ff_user` — profile & goals
- `ff_sessions` — focus sessions
- `ff_settings` — preferences
- `ff_theme` — dark/light

## Keyboard Shortcuts (Focus page)

| Key | Action |
|-----|--------|
| `Space` | Start / Pause |
| `Ctrl+R` | Reset timer |

---

© 2024 FocusFlow
