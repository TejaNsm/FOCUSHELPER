# Feature Specification: Daily Task Management

**Feature Branch**: Not created

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "Add daily task-management capabilities to the FocusHelper board. Users must be able to search tasks by title and description; filter tasks by column, deadline state (overdue, due today, upcoming, no deadline), priority, label, and active versus archived status; sort visible tasks by deadline, creation date, or title in ascending or descending order; manually reorder tasks within each column through mouse, touch, and keyboard controls, with custom order persistence; set an optional low, medium, or high priority and zero or more labels on each task; mark tasks completed and archive them, with archived tasks hidden by default and recoverable; and use dedicated Due today and Upcoming views without losing the existing three-column board."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find tasks for today (Priority: P1)

The user needs to locate a task quickly or focus on work due now. They search by words in a title or description, combine filters to narrow results, or open a dedicated Due today or Upcoming view. The existing Tasks, Meetings, and Backburner board remains available.

**Why this priority**: Finding relevant work and seeing what needs attention today are the central daily-use improvements.

**Independent Test**: Create tasks across all three columns with varied descriptions and deadlines, then search, combine filters, and open both date-focused views. Verify that only matching tasks appear and that the original board remains accessible.

**Acceptance Scenarios**:

1. **Given** tasks have different titles and descriptions, **When** the user searches for text present in either field, **Then** matching tasks appear and nonmatching tasks are excluded.
2. **Given** tasks have different columns, deadlines, priorities, labels, and archive states, **When** the user applies multiple filters, **Then** only tasks satisfying every selected filter are shown.
3. **Given** tasks are due today, later, overdue, or have no deadline, **When** the user selects a deadline-state filter, **Then** only tasks in that state are shown.
4. **Given** the user opens Due today or Upcoming, **When** the view loads, **Then** it shows non-archived tasks due today or after today, respectively, across the existing columns.
5. **Given** the user is in a dedicated date view, **When** they return to the board, **Then** the three-column board is still available and task data is unchanged.

### User Story 2 - Organize and compare tasks (Priority: P2)

The user assigns optional priorities and labels, then sorts the visible tasks by deadline, creation date, or title in either direction to decide what to work on next.

**Why this priority**: Priority, labels, and sorting help users manage more tasks without changing the board's existing categories.

**Independent Test**: Assign and remove priorities and labels on tasks, filter by each value, and verify each supported sort field in both directions.

**Acceptance Scenarios**:

1. **Given** a task, **When** the user sets or changes its priority, **Then** the selected value is one of low, medium, or high and is shown on that task.
2. **Given** a task, **When** the user adds or removes labels, **Then** the task reflects the current set, including the valid case of no labels.
3. **Given** matching visible tasks, **When** the user sorts by deadline, creation date, or title in ascending or descending order, **Then** the tasks appear in the selected order.
4. **Given** the user changes search, filters, or sort settings, **When** tasks are hidden from the current results, **Then** their saved priority, labels, and custom column order remain unchanged.

### User Story 3 - Reorder tasks in a column (Priority: P2)

The user arranges tasks in a column to reflect their preferred sequence, using a mouse, touch interaction, or keyboard controls. The chosen order remains available when the app is reopened.

**Why this priority**: A personal task sequence complements the fixed board columns and supports users who prefer their own ordering over a sort.

**Independent Test**: Reorder multiple tasks in each column using each input method, reload or reopen the app, and verify that each column retains its order.

**Acceptance Scenarios**:

1. **Given** a column contains multiple tasks, **When** the user reorders them with a mouse or touch, **Then** the new order is shown within that column.
2. **Given** a column contains multiple tasks, **When** the user reorders them using keyboard controls, **Then** the new order is shown and the action is operable without a pointer.
3. **Given** the user has saved a custom order, **When** they reload or reopen the app, **Then** the order is preserved for each column.
4. **Given** a sorted view is active, **When** the user changes the sort, **Then** the saved custom order is not overwritten; returning to custom order displays the user's saved sequence.

### User Story 4 - Complete and archive tasks (Priority: P2)

The user marks finished tasks as completed and archives tasks they no longer want in their active work. Archived tasks are hidden by default but can be found and restored.

**Why this priority**: Completion and recoverable archiving keep active work focused without permanently losing task details.

**Independent Test**: Complete a task, archive another, verify default visibility, then show archived tasks and restore one with all of its details intact.

**Acceptance Scenarios**:

1. **Given** an active task, **When** the user marks it completed, **Then** it is visibly completed and remains distinct from archived tasks.
2. **Given** an active task, **When** the user archives it, **Then** it is hidden from default views.
3. **Given** archived tasks exist, **When** the user selects the archived status, **Then** those tasks can be found and restored to active status.
4. **Given** an archived task is restored, **When** the user returns to the board, **Then** its title, description, deadline, priority, labels, column, and custom order are retained.

### Edge Cases

- A task with no deadline is never included in overdue, due-today, or upcoming deadline states.
- Deadline states use the user's local calendar date: a deadline before today is overdue, today is due today, and a later date is upcoming.
- Tasks without a deadline sort after dated tasks in either deadline-sort direction.
- Searches with no matches and filter combinations with no matches show a clear empty state without changing task data.
- Search matching is case-insensitive and ignores leading or trailing whitespace in the search text.
- A task with no priority is omitted when filtering for a specific priority.
- Labels are user-entered text; a task cannot contain duplicate labels that differ only by capitalization or surrounding whitespace.
- Archived tasks are excluded by default from the board and dedicated date views; explicitly filtering for archived tasks makes them findable.
- Sorting changes only the displayed order; it does not replace the saved custom order.
- Reordering a task within its current position leaves the column order unchanged.
- Completion and archive state are independent: completing a task does not archive it, and restoring an archived task does not change whether it is completed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The existing board MUST remain available with its three columns: Tasks, Meetings, and Backburner.
- **FR-002**: Users MUST be able to search task titles and descriptions using case-insensitive partial text matching.
- **FR-003**: Users MUST be able to filter tasks by column, deadline state (overdue, due today, upcoming, or no deadline), priority, label, and status (active or archived).
- **FR-004**: When multiple filters are selected, the app MUST show only tasks that match every selected filter.
- **FR-005**: The app MUST determine deadline state by the user's local calendar date: before today is overdue, today is due today, after today is upcoming, and a missing deadline is no deadline.
- **FR-006**: The app MUST provide dedicated Due today and Upcoming views that show tasks across the existing columns without replacing the board.
- **FR-007**: The app MUST exclude archived tasks from views by default and MUST let users explicitly find archived tasks and restore them to active status.
- **FR-008**: Users MUST be able to sort visible tasks by deadline, creation date, or title, in ascending or descending order.
- **FR-009**: Tasks without deadlines MUST appear after dated tasks in either direction of deadline sorting. When sort values are equal, the relative custom order MUST be preserved.
- **FR-010**: Users MUST be able to manually reorder tasks within each column using mouse, touch, and keyboard controls.
- **FR-011**: The app MUST preserve each column's custom task order when the user reloads or reopens the app.
- **FR-012**: Sorting MUST affect only the displayed order and MUST NOT overwrite the saved custom order.
- **FR-013**: Users MUST be able to assign no priority or one priority (low, medium, or high) to each task.
- **FR-014**: Users MUST be able to assign zero or more user-entered labels to each task, and duplicate labels differing only by capitalization or surrounding whitespace MUST be treated as the same label on that task.
- **FR-015**: Users MUST be able to mark a task completed and later change its completion state without archiving it.
- **FR-016**: Users MUST be able to archive and restore tasks without losing their task details, column, or custom order.
- **FR-017**: Task details, creation date, priority, labels, completion and archive state, and custom column order MUST persist across app reloads.
- **FR-018**: All new task-management actions MUST be accessible using keyboard controls and have clear labels and feedback.

### Key Entities

- **Task**: An item in one of the existing board columns. In addition to its existing title, optional deadline, and description, it has a creation date, optional priority, zero or more labels, completion state, archive state, and position within its column.
- **Column**: One of the fixed Tasks, Meetings, or Backburner categories, containing tasks with a saved custom order.
- **Task view**: A presentation of tasks, including the existing board and the Due today and Upcoming views, that can be narrowed by search and filters and displayed using a selected sort order.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a board containing up to 500 tasks, a user can search or apply a filter and see matching results within one second.
- **SC-002**: In a task set of up to 500 tasks, every selected column, deadline-state, priority, label, and archive-status filter returns only tasks meeting that criterion; combined filters return only tasks meeting all selected criteria.
- **SC-003**: Users can reach tasks due today or upcoming from their dedicated views in no more than two actions from the board.
- **SC-004**: All tasks retain their priority, labels, completion and archive state, and custom column position after the app is closed and reopened.
- **SC-005**: Users can change a task's custom position using mouse, touch, or keyboard, and complete each interaction without using another input method.
- **SC-006**: At least 90% of first-time users can search, find a due-today task, change a task's priority, and archive and restore a task without instructions.

## Assumptions

- This feature extends the existing single-user, local FocusHelper app and does not add accounts, sharing, or cross-device synchronization.
- The existing three columns remain fixed; this feature does not add, remove, or rename columns.
- Task creation date is recorded when a task is first created and does not change when its other details are edited.
- Search and filters apply to the current task view and combine with one another; the default status is active.
- Dedicated Due today and Upcoming views include non-archived tasks from all columns by default.
- Priority is optional and has exactly the three requested values. Labels are short, user-entered text, and no central label catalog is required.
- Completion is a distinct state from archiving; completed tasks remain active unless separately archived.
- Sorting is temporary presentation behavior; manual custom order is the saved order used when no sort is selected.
- Local date boundaries determine due states. Notifications, recurring tasks, bulk editing, and cross-device synchronization are outside this feature's scope.
