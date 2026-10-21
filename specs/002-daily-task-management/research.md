# Research: Daily Task Management

## Existing application baseline

- **Decision**: Extend the existing Vite, React, and TypeScript single-page app and its board domain helpers rather than introducing a backend or a new state framework.
- **Rationale**: The app already implements the fixed three-column board, local persistence, accessible dialogs, cross-column drag movement, and keyboard/touch sensors. This matches the feature's local single-user scope and the constitution's minimal-scope and localhost-only principles.
- **Alternatives considered**: Replace the board or add a server/database. Rejected because neither is needed for the requested local workflows and both expand scope and data exposure.

## Persistence and existing user data

- **Decision**: Keep the existing `focushelper.board.v1` storage key and introduce an explicitly versioned document format that reads version-1 documents. Convert existing tasks in memory using their existing `createdAt` ordering, empty labels, no priority, incomplete and active states, and column order derived from the legacy order. Save the upgraded document in the new format after state changes.
- **Rationale**: Existing browser data must retain task details and ordering. An explicit migration is safer than treating new fields as optional indefinitely or ignoring the currently saved version.
- **Alternatives considered**: Create a new storage key without migration (would strand existing tasks); retain an unchanged document version (would make the changed contract ambiguous).
- **Constraint**: Keep persistence local and disclose that browser storage is not encrypted, backed up, or synchronized. Storage write failures must be surfaced to the user rather than presented as successful persistence.

## Search, filtering, and sorting

- **Decision**: Compute search, filters, and sort as derived views of task state. Search title and description using case-insensitive partial matching after trimming the query. Apply all selected filter dimensions together. Sort within each fixed column so the board grouping remains intact; when no explicit sort is selected, use the saved manual column order. Keep undated tasks last for deadline sorts in both directions and use saved manual order to stabilize equal values.
- **Rationale**: Derived presentation state keeps filtering and sorting from mutating saved tasks or user-defined order. Column-local sorting preserves the three-column board and the spec's explicit no-deadline behavior.
- **Alternatives considered**: Persist the filtered/sorted result or globally flatten and reorder the board. Rejected because view operations should not overwrite custom order or discard the existing board structure.

## Date-focused views and local date handling

- **Decision**: Treat Due today and Upcoming as named views over the same three columns. Determine date states from the user's local calendar date and the task's date-only deadline (`YYYY-MM-DD`).
- **Rationale**: This provides quick access without replacing or renaming any existing column and avoids time-zone conversion ambiguities for date-only deadlines.
- **Alternatives considered**: Convert date-only deadlines to UTC timestamps or replace the board with one unified list. Rejected because UTC conversion can shift a calendar date and replacing the board conflicts with the feature requirement.

## Manual reordering and accessibility

- **Decision**: Reuse the installed `@dnd-kit/core` and `@dnd-kit/sortable` packages for in-column ordering, preserving current cross-column movement. Provide keyboard reordering via the task drag handle and retain touch long-press behavior. Reorder only the currently visible matching tasks while keeping hidden tasks' relative order and saved position stable.
- **Rationale**: The app already uses dnd-kit sensors and announcements for mouse, touch, and keyboard movement. Using the installed sortable package avoids a duplicate drag implementation or added dependency.
- **Alternatives considered**: Add another drag library or support pointer-only sorting. Rejected as unnecessary dependency duplication and inaccessible to keyboard-only users.

## Testing and validation

- **Decision**: Add unit tests for migration, selectors, local-date boundaries, sorting stability, and reducer actions; component tests for input and status behavior; Playwright flows for the end-to-end views and keyboard/touch reordering; retain axe and localhost startup checks.
- **Rationale**: Each major behavior has a directly testable pure domain or user-facing flow, and the constitution requires proportionate automated validation and interaction accessibility checks.
- **Alternatives considered**: Rely on manual verification alone. Rejected because persisted migration and input-method behavior are regression-prone and can be automated with the existing test setup.
