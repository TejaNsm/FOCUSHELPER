# Quickstart: Validating Daily Task Management

## Prerequisites

- Node.js 20+ and npm
- A modern desktop or touch browser
- Existing project dependencies installed

## Run locally

```bash
npm run dev
```

Open <http://127.0.0.1:5173>. Confirm the application is served on localhost and makes no external network requests.

## Automated checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

Playwright's Chromium browser must be installed for browser tests. The existing test suite uses `npx playwright install chromium` when needed.

## End-to-end validation

1. **Search and filters**: Create tasks across Tasks, Meetings, and Backburner with unique titles/descriptions, varied deadlines, priorities, labels, and archive states. Verify title and description search, every filter dimension, and combinations of filters.
2. **Deadline states and views**: Add overdue, due-today, upcoming, and no-deadline tasks. Verify each deadline filter and the Due today and Upcoming views use the local calendar date and still group tasks under the three original columns.
3. **Sorting**: Sort visible tasks by each supported field ascending and descending. Confirm equal values retain custom order and undated tasks remain last in both deadline directions. Return to Custom order and confirm sorting did not overwrite it.
4. **Priority and labels**: Set, change, and clear priorities. Add/remove labels, and verify labels differing only by case or surrounding whitespace cannot be duplicated on a task.
5. **Reordering**: Reorder tasks within each column by mouse, long-press touch, and keyboard controls. Reorder while some tasks are filtered out and confirm hidden tasks retain relative order. Reload and verify the saved order.
6. **Completion and archive**: Complete a task and verify it remains distinct from archived state. Archive a task and confirm it is hidden by default; find and restore it, then verify all details, completion state, column, and order remain.
7. **Migration**: Seed the existing version-1 `focushelper.board.v1` document and load the updated app. Confirm existing task fields and per-column created-date order survive and new fields receive defaults.
8. **Accessibility and responsive layout**: Complete new flows using only the keyboard, test touch targets and screen-reader announcements, run axe checks, and verify the board at 320 px and 1280 px viewport widths.

## Expected outcome

All automated checks pass; legacy tasks remain available after migration; all new views and interactions behave as documented; task data remains local; and the existing three-column board remains usable.

See [data-model.md](./data-model.md) and [contracts/ui-interactions.md](./contracts/ui-interactions.md) for task state and interaction details.
