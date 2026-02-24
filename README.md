# לוח משמרות יח"ס — Shift Schedule App

A React web application that calculates and displays which יח"ס (unit) is on duty for any given date and shift, 
based on a rotating 3-week cycle.

## Features

- **Daily view** — pick a date and shift to instantly see which unit is on duty
- **Weekly view** — see the full week's schedule for all three shifts in a single table
- **Israel time-zone aware** — all date calculations use `Asia/Jerusalem`
- **Configurable baseline** — the cycle start date is read from an external config file at runtime, no rebuild required
- **Deployed to GitHub Pages** automatically on every push to `main`

## Shift Schedule

| Shift | Briefing | Start |
|-------|----------|-------|
| 🌅 Morning | 06:30 | 07:00 |
| ☀️ Noon (Sun / Tue / Thu) | 14:30 | 15:00 |
| ☀️ Noon (Mon / Wed / Fri / Sat) | 13:30 | 14:00 |
| 🌙 Night | 20:30 | 21:00 |

Three units (יח"ס 1, 2, 3) rotate across all shifts on a 21-day (3-week) cycle.

## Project Structure

```
ShiftsApp/
├── public/
│   └── config.json          # Runtime configuration (cycle start date)
├── src/
│   ├── main.jsx             # React entry point
│   └── shift-schedule.jsx   # Main application component
├── .github/
│   └── workflows/
│       └── deploy.yaml      # GitHub Actions — deploy to GitHub Pages
├── index.html
├── package.json
└── vite.config.js
```

## Configuration

The schedule baseline is controlled by `public/config.json`:

```json
{
  "_comment": "cycleStartDate must be an ISO 8601 date string (YYYY-MM-DD) and must be a Sunday that unit 1 works the noon shift on Sunday and Monday.",
  "cycleStartDate": "2026-02-22"
}
```

To reset the schedule:

1. Identify the new baseline Sunday that corresponds to the start of Week 0 in the cycle.
2. Update `cycleStartDate` in `public/config.json` using the format `YYYY-MM-DD`.
3. Commit and push — the change is live after the GitHub Pages deployment completes (no rebuild of the app code is needed).

> **Important:** `cycleStartDate` must always be a **Sunday** where unit 1 works noon and Sunday-Monday block. Choosing a non-Sunday date will produce incorrect unit assignments for every day of the week.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | lucide-react |
| Deployment | GitHub Pages via GitHub Actions |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

The production output is written to `dist/`.

### Preview production build locally

```bash
npm run preview
```

## Deployment

Every push to the `main` branch triggers the GitHub Actions workflow in `.github/workflows/deploy.yaml`, which:

1. Checks out the repository
2. Runs `npm install && npm run build`
3. Uploads the `dist/` folder as a Pages artifact
4. Deploys it to GitHub Pages

The live URL is configured in the repository's **Settings → Pages** section.

## Cycle Logic

The 3-week rotation is calculated as follows:

1. Compute the number of days elapsed since `cycleStartDate`.
2. Determine the week index `W = floor(totalDays / 7) % 3` (values 0, 1, 2).
3. Map the day-of-week block (Sun–Mon, Tue–Wed, Thu–Fri, Sat) to an offset using `W`.
4. Derive the unit number from the offset and the shift position within the day.
