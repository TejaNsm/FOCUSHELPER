# Quickstart: Validating the Task Board

## Prerequisites
- Node.js 20+ and npm
- A modern browser

## Run
```bash
npm install
npm run dev        # serves on http://127.0.0.1:5173 only
```
Confirm the URL is reachable and that the app is not exposed on the network interface.

## Automated checks
```bash
npm run lint
npm run typecheck
npm test           # Vitest unit/component tests
npm run test:e2e   # Playwright acceptance, keyboard, touch and axe checks
```

## Manual validation (maps to spec acceptance scenarios)
1. **US1**: First load shows empty Tasks, Meetings, Backburner columns. Add a task with title, deadline and description to each column; confirm details show. Submit with a blank title and confirm the error. Reload; tasks persist.
2. **US2**: Edit a task and save; edit and cancel; delete and confirm; delete and decline. Add a past deadline and confirm the "Overdue" text badge.
3. **US3**: Move a task to each other column by mouse drag; repeat with keyboard (Space, arrows, Space) and with the "Move to…" menu; repeat with a touch device or emulation (long-press then drag). Reload; the new column persists.
4. **Accessibility**: Tab through the whole app without a mouse; verify visible focus, dialog focus trapping and announcements with a screen reader; check at 320 px and 1280 px widths; axe reports no violations.

## Expected outcome
All 11 acceptance scenarios pass; no network requests other than loading the app from localhost.
