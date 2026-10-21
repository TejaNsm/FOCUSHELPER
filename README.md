# FocusHelper Task Board

A simple task board with three columns: **Tasks**, **Meetings**, and **Backburner**. Add, edit, remove and move tasks (title, deadline, short description), then search, filter, prioritize, label, complete, archive, sort, and reorder them.

## Prerequisites

- Node.js 20 or newer and npm
- A modern browser

## Run

```bash
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. The dev server (and `npm run preview`, port 4173) binds to the loopback interface only, so it is not reachable from other machines.

## Using the board

- **Add**: the "Add" button in a column. Title is required (max 120 characters); deadline and description (max 500 characters) are optional.
- **Edit / Delete**: the pencil and trash buttons on a card. Deleting asks for confirmation.
- **Move**:
  - Mouse: drag the grip handle onto another column.
  - Touch: press and hold the grip handle briefly, then drag. Normal swipes still scroll the page.
  - Keyboard: focus the grip handle, press Space or Enter to pick up, Arrow keys to choose a column, Space or Enter to drop, Escape to cancel.
  - Any input: the "Move to…" button on a card opens a menu of the other columns.
- Tasks with a past deadline show an "Overdue" badge.
- **Find tasks**: Search task titles and descriptions, or combine the column, deadline-state, priority, label, and active/archive filters.
- **Daily views**: Open **Due today** or **Upcoming** to focus on tasks across the existing three columns.
- **Organize**: Set a low, medium, or high priority and add optional labels in the task editor. Sort by deadline, creation date, or title; custom order remains saved separately.
- **Complete / Archive**: Mark tasks complete independently of archiving. Archived tasks are hidden by default; select Archived in the status filter to restore them.
- **Reorder**: In Custom order, use the task grip to reorder within a column by mouse, touch long-press, or keyboard (Space/Enter, Up/Down, Space/Enter; Escape cancels). Reordering is preserved across reloads.

## Your data

Tasks are stored in your browser's `localStorage` (key `focushelper.board.v1`) on this machine only. Existing board data is migrated locally when the app is upgraded. The data is not encrypted, backed up, or synced across browsers or devices; clearing site data deletes it. The app makes no network requests and sends no telemetry.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server on 127.0.0.1 |
| `npm run build` | Type-check and build for production |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright): acceptance scenarios, keyboard, touch, axe accessibility. First run: `npx playwright install chromium` |

## Stack

Vite, React, TypeScript, Tailwind CSS, shadcn/ui, `@dnd-kit`.
