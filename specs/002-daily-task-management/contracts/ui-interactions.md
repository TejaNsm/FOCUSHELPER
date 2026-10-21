# UI Interaction Contract: Daily Task Management

## Navigation and views

- Keep the existing three-column board and its Tasks, Meetings, and Backburner labels.
- Provide distinct Board, Due today, and Upcoming view controls with accessible names and a visible selected state.
- Due today and Upcoming show tasks from the fixed columns, grouped by their existing column.
- Search and filters are available in the views and combine by intersection. The default status is Active; an Archived selection exposes archived tasks for restoration.
- Search has an accessible label and searches title and description. Clearing the query restores the remaining filtered results.
- Column, deadline state, priority, label, and active/archive status filters have clear labels and a keyboard-operable reset/clear action.
- Empty search or filter results display a helpful empty state; changing views or filters does not modify task data.

## Sorting

- Provide sort choices for deadline, creation date, title, and custom order, with ascending/descending direction for the three explicit sort fields.
- Sort within each fixed column to preserve the board layout.
- Deadline sort keeps undated tasks last for both directions. Equal values retain custom order.
- Sorting affects only presentation. Selecting Custom order returns to the persisted order.

## Task details and controls

- Task cards continue to expose the task title, deadline, and description, and also display optional priority, labels, and completion state.
- Each action has a visible or accessible name associated with the task title: Edit, Mark complete/Mark incomplete, Archive/Restore, and existing Move to… control.
- Add/edit forms retain existing title, deadline, and description validation and add a priority selection (including no priority) and a label editor that supports zero or more labels.
- Invalid or duplicate labels are explained at the label input; labels differing only by capitalization or surrounding whitespace are duplicates on the same task.
- Completion and archive are separate actions and states.
- Archived tasks stay hidden in default views. When Archived status is selected, Restore returns a task to active status without losing its details, completion state, column, or custom order.

## Reordering

- Preserve existing cross-column drag/drop behavior and the accessible Move to… alternative.
- Within a column, users can drag a task to reorder it using a mouse or touch. A short press on touch must not interfere with ordinary page scrolling.
- Keyboard users focus the task's reorder handle, press Space or Enter to pick it up, use Up/Down to select a position within the column, press Space or Enter to drop, and Escape to cancel.
- Announce pickup, position changes, drop, and cancellation using a polite live region.
- Persist the resulting order. Reordering a task to its current position is a no-op.
- If search or filters hide tasks, reordering visible tasks must not change the relative order of hidden tasks.

## Accessibility, layout, and persistence feedback

- Every new control is keyboard operable, visibly focusable, semantically labelled, and usable with a screen reader.
- Preserve minimum 44 by 44 pixel targets for primary touch controls and respect reduced-motion preferences.
- Board and task views remain usable at narrow mobile and common desktop widths.
- Announce successful task changes and storage errors. If the app cannot persist a change, do not report successful persistence; provide a clear error and retain in-memory behavior only if consistent with existing app interaction.
- Explain in user-facing data documentation that task data is stored locally in the browser and is not encrypted, backed up, or synced.
