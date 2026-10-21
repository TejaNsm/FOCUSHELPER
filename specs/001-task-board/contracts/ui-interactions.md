# UI Interaction Contract

## Structure
- Page has one `h1`; each column is a labelled region (`section` with `aria-labelledby`) containing a list (`ul`) of task cards (`li`) and a per-column "Add task" button.
- Each column heading shows its task count.
- Empty column shows an empty-state message.

## Task card
Shows title, deadline (formatted, with an "Overdue" text badge and icon when past), and description. Controls (each ≥44×44 px, with accessible names including the task title): Edit, Delete, Move to… (menu listing the other two columns), and a drag handle.

## Add / edit dialog
- Fields with visible labels: Title (required), Deadline (date), Description (multi-line, max 500).
- Submit with empty/whitespace title: no save; inline error linked via `aria-describedby`; focus returns to the Title field.
- Cancel or Esc closes without changes; focus returns to the triggering control.

## Delete confirmation
Alert dialog naming the task; Confirm removes it, Cancel keeps it; focus returns sensibly.

## Drag and drop
| Mode | Gesture |
|------|---------|
| Mouse | Press and drag past a small threshold; drop on a column |
| Touch | Long-press (~200 ms) then drag; normal swipe scrolls |
| Keyboard | Focus handle; Space/Enter lifts; arrow keys change target column; Space/Enter drops; Esc cancels |

Live-region announcements on pickup, move over a column, drop and cancel (e.g. "Moved 'Pay rent' to Backburner"). Same-column drop changes nothing. Any move is also possible through "Move to…".

## Feedback
A polite live region announces add, edit, remove and move results. Motion is reduced under `prefers-reduced-motion`.
