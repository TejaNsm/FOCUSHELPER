# Data Model: Daily Task Management

## Column

The existing fixed enumeration remains unchanged and defines the board grouping:

| ID | Label |
|----|-------|
| `tasks` | Tasks |
| `meetings` | Meetings |
| `backburner` | Backburner |

Each column owns a custom ordered sequence of its tasks. Reordering does not move a task to another column; cross-column movement continues to change the task's column.

## Task

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Unique and immutable. |
| `title` | string | Required; trimmed; non-empty; existing maximum of 120 characters. |
| `deadline` | string \| null | Optional local calendar date in `YYYY-MM-DD` format. |
| `description` | string | Optional plain text; existing maximum of 500 characters. |
| `column` | `tasks` \| `meetings` \| `backburner` | Required; one of the existing fixed columns. |
| `createdAt` | number | Creation time in epoch milliseconds; immutable; used for creation-date sort. |
| `priority` | `low` \| `medium` \| `high` \| null | Optional; null means no priority. |
| `labels` | string[] | Zero or more trimmed user-entered labels; duplicate matching is case-insensitive. |
| `completed` | boolean | Independent completion state; defaults to false. |
| `archived` | boolean | Active/archive state; defaults to false. |
| `position` | number | Stable non-negative order within the task's column. |

### Derived values

- Deadline state is `no-deadline` when `deadline` is null, `overdue` when deadline is before the user's local date, `due-today` when equal to the user's local date, and `upcoming` when after it.
- Active means `archived === false`; completed tasks may remain active.
- Filtered tasks are the intersection of all selected filters and text search results.
- A selected sort changes only display order. Without a selected sort, tasks use their custom column position.
- Deadline sorting places tasks without a deadline after dated tasks in both directions. Equal sort values retain custom order.

## Relationships

- A Task belongs to exactly one fixed Column.
- A Column contains zero or more Tasks in custom order.
- Board, Due today, and Upcoming are views over the same Tasks and Columns; they do not own task records.

## Validation and transitions

- A title must remain non-empty after trimming and must not exceed 120 characters.
- A priority is either null or one of the three allowed values.
- Labels are trimmed, non-empty when present, and unique within a task ignoring case and surrounding whitespace.
- Deadline is either null or a valid date-only value.
- Reordering updates the affected task positions in its column and persists them. Moving between columns appends to the destination custom order unless the user explicitly reorders afterward.
- Completion toggles without changing archive status.
- Archiving hides a task from default active views but preserves all its fields and order; restoration returns it to active status without changing completion state.
- Editing task details does not change task creation time or custom order.

## Stored document and migration

Persist a versioned document containing the task collection in the existing local-storage key, `focushelper.board.v1`. The new document format records all Task fields including position.

The loader must accept the existing version-1 document and migrate valid legacy tasks without changing their original fields. For each legacy column, assign positions based on the legacy `createdAt` order, retaining the legacy array order when creation times tie; initialize `priority` to null, `labels` to an empty list, and `completed` and `archived` to false. Invalid tasks continue to be excluded using repository-standard validation behavior. New documents are validated before use. The loader must not silently discard a supported document version.

Storage remains local to the current browser profile and is not encrypted, backed up, or synchronized. Failed writes must be communicated instead of implying that changes were persisted.
