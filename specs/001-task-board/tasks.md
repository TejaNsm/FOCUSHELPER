# Tasks: Task Board

**Input**: Design documents from `/specs/001-task-board/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-interactions.md, quickstart.md

**Tests**: Included, because the constitution (Principle V) and plan require automated tests, accessibility checks and acceptance coverage.

**Organization**: Grouped by user story so each can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2, US3

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization

- [X] T001 Scaffold a Vite React + TypeScript project at the repository root (`package.json`, `index.html`, `tsconfig*.json`, `src/main.tsx`, `src/App.tsx`), preserving `.github/`, `.specify/`, `specs/`
- [X] T002 Configure `vite.config.ts` with `server.host` and `preview.host` set to `127.0.0.1`, and a `@` alias to `src/`; add matching paths to `tsconfig.app.json`
- [X] T003 Install and configure Tailwind CSS in `src/index.css` and the Vite config per current Tailwind docs
- [X] T004 Initialize shadcn/ui (`components.json`, `src/lib/utils.ts`) and add components into `src/components/ui/`: button, card, dialog, alert-dialog, input, textarea, label, dropdown-menu, badge
- [X] T005 [P] Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, and `lucide-react` (if not added by shadcn)
- [X] T006 [P] Configure ESLint, and add `lint` and `typecheck` scripts in `package.json`
- [X] T007 [P] Configure Vitest + React Testing Library (jsdom, setup file `tests/unit/setup.ts`) and add `test` script
- [X] T008 [P] Configure Playwright with `@axe-core/playwright` in `playwright.config.ts`: `webServer` runs the dev server on `127.0.0.1:5173`; projects for desktop Chromium and a touch-enabled mobile profile; add `test:e2e` script

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model, persistence and the board shell used by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Define types in `src/lib/board.ts` per data-model.md: `ColumnId` = `tasks` | `meetings` | `backburner` with labels Tasks, Meetings, Backburner; `Task` with `id`, `title` (required; trimmed; must not be empty or whitespace-only; max 120 characters), `deadline` (`YYYY-MM-DD` or null; past dates allowed), `description` (optional; plain text; max 500 characters), `column`, `createdAt`
- [X] T010 Implement in `src/lib/board.ts`: reducer with `add`, `edit`, `remove`, `move` actions (move to same column is a no-op; edit keeps `column` and `createdAt`), title validation helper, `isOverdue(deadline, today)` using local date, and selector returning a column's tasks ordered by `createdAt` ascending
- [X] T011 [P] Implement `src/lib/storage.ts`: load/save `{version: 1, tasks}` under key `focushelper.board.v1`; validate shape on load; return an empty board on missing or corrupt data without throwing
- [X] T012 Implement `src/hooks/useBoard.ts`: `useReducer` initialised from storage, persisting on every change, exposing the actions and a polite status message string
- [X] T013 [P] Unit tests for reducer, validation, overdue logic and ordering in `tests/unit/board.test.ts`
- [X] T014 [P] Unit tests for storage (round-trip, corrupt JSON, wrong version/shape) in `tests/unit/storage.test.ts`
- [X] T015 Build the page shell in `src/App.tsx` and `src/components/Board.tsx`: one `h1`, three `Column` regions in a responsive layout (stacked at narrow widths, three columns on wide), and a visually hidden polite `aria-live` status region fed by `useBoard`
- [X] T016 Implement `src/components/Column.tsx`: `section` with `aria-labelledby` heading showing label and task count, `ul` of cards, empty-state message, per-column "Add task" button (≥44×44 px) that calls a handler prop

**Checkpoint**: App starts on `http://127.0.0.1:5173` showing three empty columns.

---

## Phase 3: User Story 1 - View board and add tasks (Priority: P1) 🎯 MVP

**Goal**: See the three columns and add tasks with title, deadline and description that persist.

**Independent Test**: Add a task to each column and confirm details show, a blank title is rejected, and tasks survive a reload.

### Tests for User Story 1

- [X] T017 [P] [US1] Component test for the add dialog in `tests/unit/TaskDialog.test.tsx`: blank and whitespace-only titles show an error and do not submit; valid input submits trimmed values
- [X] T018 [P] [US1] Playwright test `tests/e2e/add-task.spec.ts` covering US1 acceptance scenarios 1–4 (empty columns at first load, add with all fields, blank title rejected, persistence after reload)

### Implementation for User Story 1

- [X] T019 [US1] Implement `src/components/TaskDialog.tsx` (shadcn Dialog) in add mode: labelled Title (required), Deadline (`type="date"`), Description (`maxLength` 500, multi-line); inline error linked by `aria-describedby` with focus returned to Title on invalid submit; Cancel and Esc close with no change; focus returns to the triggering button
- [X] T020 [US1] Implement `src/components/TaskCard.tsx`: shows title, formatted deadline, description, and an "Overdue" text badge with icon when past (not colour alone); long text wraps without breaking layout (`break-words`)
- [X] T021 [US1] Wire add flow in `src/components/Board.tsx`: column "Add task" opens the dialog for that column, submit dispatches `add`, announces "Added '<title>' to <column>"
- [X] T022 [US1] Ensure 44×44 px minimum targets and visible focus styles on the add controls in `src/components/Column.tsx` and `src/components/TaskDialog.tsx`

**Checkpoint**: US1 is fully functional and testable on its own (MVP).

---

## Phase 4: User Story 2 - Edit and remove tasks (Priority: P2)

**Goal**: Change a task's details and delete tasks with confirmation.

**Independent Test**: Edit and cancel edit; delete and decline; delete and confirm.

### Tests for User Story 2

- [X] T023 [P] [US2] Component test `tests/unit/DeleteDialog.test.tsx`: confirm calls the handler, cancel does not
- [X] T024 [P] [US2] Playwright test `tests/e2e/edit-remove.spec.ts` covering US2 acceptance scenarios 1–4, plus the overdue badge for a past deadline

### Implementation for User Story 2

- [X] T025 [US2] Extend `src/components/TaskDialog.tsx` with edit mode: prefilled fields, saves via `edit` action, cancel leaves the task unchanged
- [X] T026 [P] [US2] Implement `src/components/DeleteDialog.tsx` (shadcn AlertDialog) naming the task, with Confirm and Cancel
- [X] T027 [US2] Add Edit and Delete icon buttons to `src/components/TaskCard.tsx`, each ≥44×44 px with accessible names including the task title (for example "Edit Pay rent")
- [X] T028 [US2] Wire edit and remove flows in `src/components/Board.tsx`, including announcements ("Updated…", "Removed…") and focus returned to a sensible element after close or deletion (the column's Add button when the deleted card was last)

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Move tasks between columns (Priority: P3)

**Goal**: Move tasks across columns by mouse, touch or keyboard, plus a non-drag alternative.

**Independent Test**: Move a task to each other column using each input mode and confirm it persists.

### Tests for User Story 3

- [X] T029 [P] [US3] Playwright test `tests/e2e/move-task.spec.ts` covering US3 acceptance scenarios 1–3: mouse drag, keyboard (Space, arrow keys, Space), "Move to…" menu, and persistence after reload; same-column drop leaves the task unchanged
- [X] T030 [P] [US3] Playwright touch test `tests/e2e/move-touch.spec.ts` using the touch-enabled project: long-press then drag moves a task, and normal vertical swipe still scrolls without moving it

### Implementation for User Story 3

- [X] T031 [US3] In `src/components/Board.tsx` add `DndContext` with `PointerSensor` (activation distance ~5 px), `TouchSensor` (delay ~200 ms, tolerance ~8 px) and `KeyboardSensor`; `onDragEnd` dispatches `move`, ignoring drops on the same column or no target; render `DragOverlay`
- [X] T032 [US3] Make each `Column` in `src/components/Column.tsx` a droppable (highlighting while hovered, using more than colour) and each `TaskCard` in `src/components/TaskCard.tsx` a draggable with a dedicated drag handle button (≥44×44 px, accessible name "Drag <title>")
- [X] T033 [US3] Provide dnd-kit `announcements` and `screenReaderInstructions` in `src/components/Board.tsx` using human labels (for example "Picked up 'Pay rent'", "Moved over Backburner", "Dropped in Backburner", "Cancelled")
- [X] T034 [US3] Add a "Move to…" DropdownMenu to `src/components/TaskCard.tsx` listing the two other columns; selecting dispatches `move` and announces the result (WCAG 2.5.7 non-drag alternative)
- [X] T035 [US3] Apply `touch-action` handling on the drag handle in `src/components/TaskCard.tsx` so page scrolling works on the rest of the card

**Checkpoint**: All three stories work independently and together.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T036 [P] Playwright accessibility test `tests/e2e/a11y.spec.ts`: axe scan with zero violations on empty board, populated board, open add/edit dialog and delete dialog; full keyboard-only walkthrough; check no horizontal scroll at 320 px and 1280 px widths
- [X] T037 [P] Respect `prefers-reduced-motion` and verify colour contrast (WCAG AA) for text, badges and focus rings in `src/index.css`
- [X] T038 [P] Write `README.md`: prerequisites (Node 20+), `npm install`, `npm run dev`, test commands, that data lives unencrypted in the browser's `localStorage` on this machine only (no backup or sync), and that the server binds to localhost only
- [X] T039 Verify the app makes no external network requests (check network log in Playwright or devtools) and the dev server is not reachable on a non-loopback address
- [X] T040 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, then walk through `specs/001-task-board/quickstart.md`; fix any failures and report any check that could not be run

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → Stories**: Setup, then Foundational, which blocks all stories.
- **US1 (P1)** starts after Phase 2; no other story dependencies. **MVP.**
- **US2 (P2)** extends `TaskDialog.tsx` and `TaskCard.tsx` from US1, so start it after US1's T019–T020.
- **US3 (P3)** needs `TaskCard.tsx` and `Column.tsx` from US1; independent of US2 except that both edit `TaskCard.tsx`, so avoid editing it concurrently.
- **Polish** runs after all stories.
- Within a story: tests first (should fail), then implementation.

## Parallel Opportunities

- Setup: T005, T006, T007, T008 together after T001–T004.
- Foundational: T011 alongside T009–T010; T013 and T014 together.
- US1: T017 and T018 together. US2: T023, T024, T026 together. US3: T029 and T030 together.
- Polish: T036, T037, T038 together.

## Implementation Strategy

1. **MVP**: Phases 1, 2 and 3 (T001–T022); validate on localhost.
2. Add US2 (editing and removal), validate; then US3 (drag and drop, keyboard, touch, "Move to…"), validate.
3. Finish with Polish (a11y, docs, network check, full test run).
