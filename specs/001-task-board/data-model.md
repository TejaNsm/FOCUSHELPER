# Data Model: Task Board

## Column
Fixed enumeration (not user editable), in display order:

| id | Label |
|----|-------|
| `tasks` | Tasks |
| `meetings` | Meetings |
| `backburner` | Backburner |

## Task

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Unique, generated on creation, immutable |
| `title` | string | Required; trimmed; must not be empty or whitespace-only; max 120 characters |
| `deadline` | string \| null | Optional; `YYYY-MM-DD` date, no time of day; past dates allowed |
| `description` | string | Optional (empty allowed); plain text; max 500 characters |
| `column` | `tasks` \| `meetings` \| `backburner` | Required |
| `createdAt` | number | Epoch ms; used to order tasks within a column (oldest first) |

Derived: `isOverdue` = `deadline` is set and earlier than today's local date.

## Stored document

```json
{ "version": 1, "tasks": [ { "id": "...", "title": "...", "deadline": null, "description": "", "column": "tasks", "createdAt": 0 } ] }
```
Key: `focushelper.board.v1`. Invalid or unrecognised data yields an empty board without crashing.

## State transitions
- **add**: new Task appended to the chosen column.
- **edit**: title/deadline/description replaced; column and createdAt unchanged.
- **move**: `column` changed; moving to the same column is a no-op.
- **remove**: Task deleted after user confirmation.
