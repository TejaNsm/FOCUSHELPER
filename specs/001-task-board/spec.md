# Feature Specification: Task Board

**Feature Branch**: `001-task-board`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "build a simple webapp running on localhost. It's a taskmanager app with three columns: tasks, meetings, and backburner. The user can add tasks, edit tasks, remove tasks, move tasks between the columns, and for each task they can add a title, a deadline, and a short description."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View board and add tasks (Priority: P1)

The user opens the app in their browser on their own machine and sees a board with three columns: Tasks, Meetings, and Backburner. They add a new item to any column by providing a title, and optionally a deadline and short description. The item appears in that column.

**Why this priority**: A board where items can be added is the minimum useful product.

**Independent Test**: Open the app, add an item to each column, and confirm each appears in the correct column with its title, deadline, and description.

**Acceptance Scenarios**:

1. **Given** the app is opened for the first time, **When** the board loads, **Then** three empty columns labeled Tasks, Meetings, and Backburner are shown.
2. **Given** the board is shown, **When** the user submits a new task with a title, deadline, and description in a column, **Then** the task appears in that column showing all three details.
3. **Given** the add form is open, **When** the user submits without a title, **Then** the task is not created and a clear message asks for a title.
4. **Given** tasks exist, **When** the user closes and reopens the app, **Then** the tasks are still present in the same columns.

---

### User Story 2 - Edit and remove tasks (Priority: P2)

The user can change a task's title, deadline, or description, and can delete tasks they no longer need.

**Why this priority**: Tasks change; without editing and removal the board becomes cluttered and stale.

**Independent Test**: Edit an existing task's fields and confirm the changes show; delete a task and confirm it disappears.

**Acceptance Scenarios**:

1. **Given** an existing task, **When** the user edits its title, deadline, or description and saves, **Then** the updated values are shown.
2. **Given** an existing task being edited, **When** the user cancels, **Then** the task is unchanged.
3. **Given** an existing task, **When** the user chooses to remove it and confirms, **Then** it disappears from the board permanently.
4. **Given** the user chooses to remove a task, **When** they decline the confirmation, **Then** the task remains.

---

### User Story 3 - Move tasks between columns (Priority: P3)

The user moves a task from one column to another (e.g., a task to Backburner, or a meeting to Tasks) using drag and drop or a keyboard-accessible alternative.

**Why this priority**: Reorganizing work by category adds the board's core organizing value but depends on tasks existing.

**Independent Test**: Move a task to each of the other columns and confirm it appears only in the destination column, with details intact.

**Acceptance Scenarios**:

1. **Given** a task in one column, **When** the user moves it to another column, **Then** it appears in the destination column and no longer in the source column.
2. **Given** a moved task, **When** the app is reopened, **Then** the task is still in its new column.
3. **Given** a keyboard-only user, **When** they use the move control on a task, **Then** they can move it to any other column.

---

### Edge Cases

- Title consisting only of whitespace is treated as missing.
- Very long titles or descriptions are displayed without breaking the layout.
- Deadline in the past is allowed, and the task is visibly marked as overdue.
- Empty columns display a helpful empty state.
- Dropping a task back into its own column leaves it unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST be reachable in a web browser on the user's local machine and MUST NOT require internet access or an account.
- **FR-002**: The app MUST display three columns labeled Tasks, Meetings, and Backburner.
- **FR-003**: Users MUST be able to add a task to any column with a required title, an optional deadline, and an optional short description.
- **FR-004**: The app MUST reject tasks with an empty or whitespace-only title and show a clear message.
- **FR-005**: Users MUST be able to edit the title, deadline, and description of any task, and cancel without changes.
- **FR-006**: Users MUST be able to remove a task after confirming.
- **FR-007**: Users MUST be able to move a task to a different column, via drag and drop and via a keyboard-accessible control.
- **FR-008**: The app MUST persist tasks and their columns so they survive closing the browser and restarting the app.
- **FR-009**: The app MUST show each task's title, deadline, and description, and visibly mark tasks whose deadline has passed.
- **FR-010**: All interactions MUST be operable by keyboard with clear labels and feedback.

### Key Entities

- **Task**: A single item on the board. Attributes: title (required), deadline (optional date), short description (optional, brief text), and the column it belongs to.
- **Column**: One of three fixed categories: Tasks, Meetings, Backburner. Contains an ordered set of tasks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a task with title, deadline, and description in under 30 seconds.
- **SC-002**: A user can move a task to another column in under 5 seconds.
- **SC-003**: 100% of tasks and their column placement are preserved after closing and reopening the app.
- **SC-004**: 90% of first-time users complete add, edit, move, and remove without instructions.
- **SC-005**: A board with 100 tasks remains responsive, with actions reflected instantly.

## Assumptions

- Single user on a single machine; no accounts, sharing, or sync.
- Columns are fixed and cannot be renamed, added, or removed.
- Deadline is a date (no time of day); description is plain text of up to roughly 500 characters.
- Tasks within a column are shown in the order added; manual reordering within a column is out of scope.
- Mobile layouts, notifications, search, and filtering are out of scope.
- Data is stored locally on the user's machine.
