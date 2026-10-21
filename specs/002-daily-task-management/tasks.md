# Tasks: Daily Task Management

**Input**: Design documents from `/specs/002-daily-task-management/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui-interactions.md](./contracts/ui-interactions.md), [quickstart.md](./quickstart.md)

**Organization**: Tasks are grouped by user story. The project is already initialized; existing dependencies and npm scripts are reused.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable when no incomplete task in the same phase touches the same file.
- **[Story]**: User story from `spec.md` (US1–US4).
- All task descriptions identify the target file path.
- No standalone test-writing tasks are included because the feature spec does not explicitly request a TDD or test-writing workflow. The final validation task runs the existing project checks.

## Phase 1: Setup

**Purpose**: Project initialization and dependencies.

The existing React/Vite project, npm scripts, and `@dnd-kit/sortable` dependency are already present; no setup changes are required.

---

## Phase 2: Foundational

**Purpose**: Extend the shared task model and persistence before implementing user-facing stories.

- [x] T001 Extend task fields, validation, and reducer actions in `src/lib/board.ts`: id MUST be unique and immutable; title MUST be trimmed, non-empty, and at most 120 characters; deadline MUST be null or a valid local `YYYY-MM-DD` date; description MUST be plain text of at most 500 characters; column MUST be one of `tasks`, `meetings`, or `backburner`; createdAt MUST be immutable epoch milliseconds; priority MUST be `low`, `medium`, `high`, or `null`; labels MUST be trimmed, non-empty when present, and unique per task ignoring case and surrounding whitespace; completed and archived MUST default to false; position MUST be a stable non-negative order within its column.
- [x] T002 Update `src/lib/storage.ts` to read the current version-1 `focushelper.board.v1` document and migrate tasks without changing existing fields; assign positions by `createdAt` order within each column while retaining array order for timestamp ties; initialize priority to null, labels to an empty list, and completed/archived to false; save the migrated document as version 2 and validate version-2 documents without discarding supported versions.
- [x] T003 Update `src/hooks/useBoard.ts` and `src/lib/storage.ts` to report storage write failures clearly instead of silently treating failed persistence as successful, while preserving the existing in-memory board behavior.

**Checkpoint**: New task attributes and legacy local data are supported before any story-specific UI is added.

---

## Phase 3: User Story 1 - Find tasks for today (Priority: P1) 🎯 MVP

**Goal**: Search tasks, combine filters, and reach Due today and Upcoming without replacing the three-column board.

**Independent Test**: Create or seed tasks across all three columns with varied titles, descriptions, deadlines, priorities, labels, and archive states. Verify title/description search, each filter and combined filters, both dedicated date views, and return to the unchanged board.

### Implementation for User Story 1

- [x] T004 [US1] Add pure search and filter selectors in `src/lib/board.ts`: case-insensitive partial matching on trimmed title/description queries; intersection of column, deadline-state, priority, label, and active/archive filters; local-date boundaries for overdue, due-today, upcoming, and no-deadline states.
- [x] T005 [US1] Add Board, Due today, and Upcoming navigation plus labelled search, filter, clear-filter, and empty-result controls in `src/components/Board.tsx`; apply current search and filter state to whichever view is selected and default to active tasks.
- [x] T006 [US1] Render the filtered results grouped under the existing Tasks, Meetings, and Backburner headings in `src/components/Column.tsx`; preserve the three-column board in all views and show a clear empty state for empty columns or no matches.

**Checkpoint**: Search, all specified filters, and date-focused views work independently while retaining the original board.

---

## Phase 4: User Story 2 - Organize and compare tasks (Priority: P2)

**Goal**: Set optional priority and labels on tasks, filter by those values, and sort visible results without altering custom order.

**Independent Test**: Create or seed tasks with different metadata. Set/change/clear priorities and labels, verify case/whitespace-insensitive duplicate labels are prevented, and check deadline, creation-date, and title sorting in both directions. Return to custom order and verify it was not overwritten.

### Implementation for User Story 2

- [x] T007 [US2] Add priority and label inputs to `src/components/TaskDialog.tsx`; allow no priority or exactly low/medium/high, allow zero or more labels, trim labels, and reject empty or duplicate labels ignoring case and surrounding whitespace.
- [x] T008 [P] [US2] Show optional priority and labels on task cards in `src/components/TaskCard.tsx`, with clear text labels that remain readable at narrow widths.
- [x] T009 [P] [US2] Add stable task comparators in `src/lib/board.ts` for deadline, creation date, and title, each in ascending and descending order; keep tasks without deadlines last in both deadline directions and preserve saved custom order for equal values.
- [x] T010 [US2] Add sort-field, direction, and Custom order controls in `src/components/Board.tsx`; sort only the currently visible tasks within each column and never mutate saved task positions.

**Checkpoint**: Users can maintain task metadata and view sorted results without losing their saved order.

---

## Phase 5: User Story 3 - Reorder tasks in a column (Priority: P2)

**Goal**: Reorder tasks within each column using mouse, touch, or keyboard and retain custom ordering across reloads.

**Independent Test**: Reorder tasks within each column using mouse drag, touch long-press, and keyboard controls. Repeat with some tasks hidden by search/filters; verify hidden tasks retain relative order, reload, and confirm each column's custom order persists.

### Implementation for User Story 3

- [x] T011 [US3] Add a reorder action to `src/lib/board.ts` that updates stable positions within one column, preserves the relative order of hidden tasks when the visible subset is reordered, and treats moving a task to its current position as a no-op.
- [x] T012 [US3] Add sortable task-list behavior to `src/components/Column.tsx` and `src/components/TaskCard.tsx` using the existing `@dnd-kit` dependencies; support mouse drag and touch long-press within a column while preserving cross-column movement and ordinary touch scrolling.
- [x] T013 [US3] Add keyboard reordering to `src/components/Board.tsx` and `src/components/TaskCard.tsx`: Space/Enter picks up and drops, Up/Down changes the within-column position, Escape cancels, and a polite live region announces pickup, position changes, drop, and cancellation.
- [x] T014 [US3] Wire successful reorder actions through `src/hooks/useBoard.ts` to persist column positions and announce the resulting order; preserve custom order when a non-custom sort is active.

**Checkpoint**: All three input methods reorder within a column, filtered-out tasks keep their relative order, and custom order survives reload.

---

## Phase 6: User Story 4 - Complete and archive tasks (Priority: P2)

**Goal**: Keep completion distinct from archiving; hide archived tasks by default and allow recovery without losing task details or position.

**Independent Test**: Complete one task and archive another. Verify completion does not archive; archived tasks are hidden by default, can be found through Archived status, and can be restored with all fields, column, completion state, and custom order intact.

### Implementation for User Story 4

- [x] T015 [US4] Add complete/incomplete and archive/restore reducer actions in `src/lib/board.ts`; completion MUST change independently of archive state, while archive and restore preserve all task fields and position.
- [x] T016 [US4] Add labelled Mark complete/Mark incomplete and Archive/Restore controls and visible state indicators to `src/components/TaskCard.tsx`; ensure each accessible name identifies the task.
- [x] T017 [US4] Wire completion, archive, and restore actions through `src/hooks/useBoard.ts` and `src/components/Board.tsx`; exclude archived tasks from default board, Due today, and Upcoming results, and expose Restore for tasks shown by the Archived status filter.

**Checkpoint**: Completed tasks remain active unless archived; archived tasks are hidden by default and recoverable with their previous data intact.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Close accessibility, privacy-documentation, and verification gaps across all stories.

- [x] T018 [P] Update `README.md` with search, filters, sorting, date views, priority/labels, completion/archive, keyboard/touch reordering, and the existing local-storage privacy limitations.
- [ ] T019 [P] Verify all new controls and task actions in `src/components/Board.tsx`, `src/components/Column.tsx`, `src/components/TaskCard.tsx`, and `src/components/TaskDialog.tsx` are keyboard-operable, visibly labelled, announced where needed, have at least 44×44 px primary touch targets, and remain usable at 320 px and 1280 px widths.
- [ ] T020 Run the automated and manual scenarios in `specs/002-daily-task-management/quickstart.md`; confirm lint, typecheck, unit, browser, accessibility, migration, persistence, and localhost-only checks pass, and record any unavailable or failing checks.

---

## Dependencies

### Story completion order

- **US1 (P1)**: Depends on foundational task schema and storage migration.
- **US2 (P2)**: Depends on foundational task schema; otherwise independent of US1.
- **US3 (P2)**: Depends on foundational task position/storage support; otherwise independent of US1 and US2.
- **US4 (P2)**: Depends on foundational task schema; shares the status-filter surface from US1, so restoration UI is integrated with that existing filter.
- **Polish**: Depends on all four stories.

### Task dependency graph

```text
T001 -> T002 -> T003
T001 -> T004 -> T005 -> T006
T001 -> T007
T001 -> T008
T001 -> T009 -> T010
T001 -> T011 -> T012 -> T013 -> T014
T001 -> T015 -> T016 -> T017
T005 -> T017
T006, T010, T014, T017 -> T018, T019 -> T020
```

### Parallel opportunities

- **US1**: T004, T005, and T006 are sequential because selectors, controls, and grouped result rendering build on one another.
- **US2**: T007 (dialog editing), T008 (card display), and T009 (sort comparators) touch separate files and can proceed in parallel after the shared model is complete.
- **US3**: T012 and T013 share task-list and drag-handle behavior, so implement them sequentially after T011 and verify both input modes before T014.
- **US4**: T016 and T017 both update task actions and card integration; keep them sequential after T015 to avoid conflicting edits.
- **Polish**: T018 and T019 touch documentation and UI files respectively and can proceed in parallel.

## Implementation Strategy

1. Complete the shared data model and backward-compatible local-storage migration.
2. Deliver **US1 as the MVP**: search, all filters, Due today/Upcoming, and the existing board.
3. Add metadata editing and sorting (US2), then persistent accessible in-column reordering (US3), then independent completion/archive lifecycle actions (US4).
4. Complete cross-cutting documentation, accessibility, and quickstart validation.
5. Keep every story independently verifiable using the criteria in its phase; run the full quickstart at the end.
