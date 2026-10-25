# Feature Specification: Personal Finance Dashboard

**Feature Branch**: `main`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: Add a private, local-first personal finance workspace to FocusHelper.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record finances and review cash flow (Priority: P1)

As a single user, I want to manage accounts and record income, expenses, refunds, transfers, and loan payments so that I can see my current-month cash flow and account balances without connecting to a financial service.

**Why this priority**: Recording transactions and seeing an accurate overview are the minimum useful finance experience and the foundation for every later view.

**Independent Test**: Create accounts, record income and expenses, transfer money between accounts, reload, and verify the monthly totals and balances match the entered records.

**Acceptance Scenarios**:

1. **Given** the finance workspace has no data, **When** the user opens it, **Then** it shows clear empty states and does not create or infer accounts or transactions.
2. **Given** the user has accounts, **When** they record income or an expense with an amount, date, account, and category, **Then** the transaction appears in history and the relevant account balance and monthly totals update.
3. **Given** the user transfers money between two accounts, **When** the transfer is saved, **Then** the source and destination balances change by equal amounts and the transfer is not counted as income or expense.
4. **Given** the user records a refund, **When** it is saved, **Then** it is shown as a refund and reduces the applicable spending total rather than being treated as new income.
5. **Given** finance data has been saved, **When** the user reloads the app, **Then** finance data remains available and task-board data remains separate and unchanged.
6. **Given** the user selects Personal Finance, **When** the workspace opens, **Then** it appears in the current browser tab and the Task Board remains available through its own in-app tab.

### User Story 2 - Plan monthly spending and recurring items (Priority: P2)

As a single user, I want to record salary and other income, set monthly budgets, and track recurring bills so that I can plan how much money remains available.

**Why this priority**: Budgets and recurring items turn transaction history into a practical monthly spending plan.

**Independent Test**: Enter fixed and variable income, create overall and category budgets, add recurring bills, and verify actual spending, remaining budget, over-budget states, and upcoming payments.

**Acceptance Scenarios**:

1. **Given** income and expense categories exist, **When** the user records fixed or variable income and creates monthly budgets, **Then** income and budgets appear in the selected month.
2. **Given** a category budget has transactions, **When** the user views the budget, **Then** actual spending, remaining amount, and any over-budget amount are shown for that category and month.
3. **Given** a recurring bill or income item is configured, **When** the user views upcoming items, **Then** each item and its next due date are shown without silently creating a transaction.
4. **Given** recurring expenses and a next income date are recorded, **When** the user views the overview, **Then** recurring expenses due before that date are identified separately from other upcoming items.

### User Story 3 - Save toward goals (Priority: P3)

As a single user, I want to set savings goals and allocate amounts toward them so that I can track progress and understand the amount and monthly contribution still required.

**Why this priority**: Goals help the user plan savings using recorded amounts without changing account balances incorrectly.

**Independent Test**: Create a goal with a target, allocate savings, optionally set a target date, and verify progress, remaining amount, and required monthly contribution.

**Acceptance Scenarios**:

1. **Given** the user creates a goal with a target amount, **When** they allocate savings to it, **Then** the goal shows the allocated amount, progress, and amount remaining.
2. **Given** a goal has a future target date and an amount remaining, **When** the user views it, **Then** the required monthly contribution is shown based on the remaining amount and time remaining.
3. **Given** the user allocates or changes an allocation, **When** they review account balances, **Then** the allocation does not add to or subtract from the underlying account balance.
4. **Given** the target is reached or the target date has passed, **When** the user views the goal, **Then** the remaining amount and contribution estimate are shown without negative or misleading values.

### User Story 4 - Track loans and debt (Priority: P4)

As a single user, I want to record debts and payments so that I can see balances, due dates, progress, and an estimated payoff date.

**Why this priority**: Debt tracking completes the user's cash-flow picture and makes upcoming obligations easier to find.

**Independent Test**: Create a loan or credit-card debt, record a payment, and verify the remaining balance, progress, next due date, and any available payoff estimate.

**Acceptance Scenarios**:

1. **Given** the user enters a debt and its lender, original amount, balance, interest rate, payment amount, and due date, **When** they save it, **Then** the debt summary shows the entered details and progress.
2. **Given** a debt has a payment due, **When** the user records a payment, **Then** the payment is associated with the debt and account and the remaining balance is updated without exceeding zero.
3. **Given** payment details are insufficient to estimate payoff, **When** the user views the debt, **Then** the app indicates that no estimate is available rather than inventing one.
4. **Given** debt records exist, **When** the user views net worth, **Then** recorded liabilities are subtracted from recorded assets.

### User Story 5 - Review reports and back up finance data (Priority: P5)

As a single user, I want to review reports and export or import a validated backup so that I can understand trends and preserve or restore my finance records.

**Why this priority**: Reports and backups provide longer-term insight and user-controlled portability after core recording and planning are available.

**Independent Test**: Enter records across months, review each report, export the finance data, import a valid backup, and confirm invalid input is rejected without changing existing data.

**Acceptance Scenarios**:

1. **Given** the user has records for one or more months, **When** they view Reports, **Then** spending by category, income versus expenses, savings progress, budget performance, debt progress, and net-worth history are based only on recorded data.
2. **Given** the user exports finance data, **When** the export completes, **Then** it contains finance records and does not include task-board data.
3. **Given** the user selects an invalid, corrupt, or unsupported backup, **When** they attempt to import it, **Then** the app explains the error and leaves current finance data unchanged.
4. **Given** the user selects a valid finance backup, **When** they confirm import, **Then** the app validates it, explains that existing finance data will be replaced, and applies it only after confirmation.

### Edge Cases

- An amount is zero, negative, too precise for the selected currency, or too large for supported entry; the app rejects it with a clear explanation and does not alter balances.
- A transaction date, budget month, or due date is at a month or year boundary; monthly totals use the user's local calendar date.
- A transfer uses the same account as both source and destination, references a missing account, or exceeds the source balance; invalid transfers are not saved.
- A refund is larger than the original expense or is not linked to a known expense; the app preserves the entered record while identifying it as a refund and does not silently invent a matching expense.
- A recurring item has a past due date, an invalid schedule, or no next date; it remains visible as configured but does not generate unconfirmed transactions.
- A budget has no spending, spending equals its limit, or spending exceeds it; the app shows accurate zero, remaining, or over-budget amounts.
- A goal has no target date, a past target date, a zero target, or is already funded; the app avoids division errors and misleading contribution estimates.
- A debt has missing interest or term details, a zero interest rate, an invalid payment or principal portion, or a payment greater than the balance; estimates are shown only when supported by entered data, and payments do not create negative balances.
- There is no income date from which to compare upcoming bills; the app shows upcoming payments without claiming which are due before income.
- Finance data is malformed, from an unsupported version, or cannot be saved; the app reports the problem and does not silently replace or discard existing data.
- A user has at least 1,000 transactions; searching, filtering, and opening monthly summaries remain usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home screen MUST provide an in-app Personal Finance tab beside the Task Board tab; selecting it MUST show the finance workspace in the same browser tab.
- **FR-002**: The finance workspace MUST NOT remove or change existing task-management behavior or task data.
- **FR-003**: The system MUST support a single user's finance records without bank connections, authentication, shared access, telemetry, or external financial services.
- **FR-004**: Users MUST be able to create, edit, and delete cash, bank, wallet, savings, credit-card, and other clearly identified financial accounts, including an opening balance and whether the account is an asset or liability.
- **FR-005**: Users MUST be able to create, view, edit, and delete income, expense, transfer, refund, and loan-payment records with amount, local calendar date, account, category, optional note, and optional recurring schedule where applicable.
- **FR-006**: The system MUST validate transaction amounts and required account, date, and category data before saving.
- **FR-007**: Transfers MUST identify source and destination accounts, adjust their balances without changing total net worth, and not count as income or expense.
- **FR-008**: Refunds MUST be identifiable separately from income and MUST be reflected in spending reports without inventing a related transaction.
- **FR-009**: Users MUST be able to create and manage customizable income and expense categories.
- **FR-010**: Users MUST be able to record salary and other fixed or variable income, including recurring income schedules.
- **FR-011**: The monthly overview MUST show selected-month income, expenses, net savings, savings rate, account balances, and remaining available money using only saved records and budgets.
- **FR-012**: Users MUST be able to create an overall monthly budget and monthly budgets by category, and see actual spending, remaining amount, and a clear over-budget state.
- **FR-013**: Users MUST be able to create and manage savings goals with target amount, allocated amount, optional target date, and optional planned monthly contribution.
- **FR-014**: Each goal MUST show its amount remaining and, when a valid future target date is present, the monthly contribution required to reach the target based on the remaining amount and time remaining.
- **FR-015**: Goal allocations MUST be recorded separately from account balances and MUST NOT alter the user's underlying balance by themselves.
- **FR-016**: Users MUST be able to create and manage loans, EMIs, credit-card debts, and other liabilities with lender, original amount, remaining balance, interest rate, payment amount, next due date, and optional term; a debt MAY be linked to its liability account.
- **FR-017**: Users MUST be able to record debt payments associated with a debt and a payment account, including total paid and principal applied; the total paid MUST reduce the payment account and the principal applied MUST reduce the debt balance. The debt view MUST show remaining balance, progress, upcoming payment, and estimated payoff date only when entered details support an estimate.
- **FR-018**: Users MUST be able to define recurring income and expense items, including salary, rent, subscriptions, insurance, utilities, EMIs, and other bills.
- **FR-019**: Recurring items MUST appear as upcoming obligations or income based on their schedule and MUST NOT create transaction history or change balances until the user records or confirms a transaction.
- **FR-020**: The overview MUST show upcoming bills and recurring expenses due before the next income date when the relevant dates have been recorded; otherwise it MUST clearly indicate that the comparison cannot be made.
- **FR-021**: Users MUST be able to search transactions by note, category, and account; filter by type, account, category, date range, and recurring status; and sort by date, amount, or category in either direction.
- **FR-022**: Reports MUST show monthly spending by category, income versus expenses, savings progress, budget performance, debt progress, and net-worth history, using only entered transactions and recorded snapshots. A snapshot may be recorded from the user's current account and debt data; the system MUST NOT fabricate past snapshots.
- **FR-023**: The system MUST show estimated net worth as recorded assets minus recorded liabilities and MUST distinguish estimates from confirmed balances. A debt linked to a liability account MUST NOT be counted twice. Monthly net savings MUST equal recorded income less recorded expenses; savings rate MUST be unavailable when income is zero.
- **FR-024**: Each finance view MUST show a clear empty state when there is no relevant saved data and MUST NOT invent, infer, or silently generate financial transactions.
- **FR-025**: Finance data MUST be saved across reloads in browser-local storage, separate from task-board data, and handled with versioning and safe validation.
- **FR-026**: Corrupt, unsupported, or old finance data MUST be reported clearly; loading it MUST NOT silently overwrite it with empty or default data.
- **FR-027**: Users MUST be able to export a finance backup and import a backup only after validation; invalid input MUST leave existing finance data unchanged.
- **FR-028**: The interface and README MUST explain that finance data is browser-local, is not encrypted, is not backed up automatically, and may be lost if browser data is cleared.
- **FR-029**: Amounts MUST default to Indian Rupees and format consistently; the finance experience MUST identify the currency used in entries and summaries.
- **FR-030**: Financial calculations and reporting periods MUST use local calendar dates and the selected month.
- **FR-031**: The interface MUST support keyboard-only operation, semantic labels, screen-reader announcements where needed, visible focus, primary touch controls of at least 44 by 44 pixels, and mobile and desktop layouts.
- **FR-032**: The system MUST NOT provide investment, tax, lending, or other professional financial advice.
- **FR-033**: The feature MUST NOT include bank synchronization, user authentication, shared finances, receipt uploads, investment tracking, tax filing, or notifications.

### Key Entities *(include if feature involves data)*

- **Financial account**: A user's cash or financial holding, with a name, type, currency, opening balance, asset or liability classification, and balance derived from recorded activity.
- **Transaction**: A dated income, expense, transfer, refund, or loan payment with amount, participating account or accounts, category, optional note, and optional recurring-item reference.
- **Category**: A user-managed classification for income or expense records.
- **Recurring item**: A planned income or expense with a schedule and next due date; it is not itself a completed transaction.
- **Monthly budget**: A spending limit for a month, either overall or for a category, compared with eligible expense records.
- **Savings goal**: A target amount and optional target date, with allocations tracked separately from account balances.
- **Debt**: A liability with lender, original and remaining amounts, payment terms, due date, related payments, and an optional linked liability account.
- **Report period**: A local-calendar month used to summarize recorded transactions, budgets, goals, debts, and net worth.
- **Net-worth snapshot**: A dated estimate based on recorded assets and liabilities; the system may save a current snapshot from entered data, but past values are not inferred when no snapshot exists.
- **Finance backup**: An exported finance-only representation that is validated before it can replace or merge saved finance records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with an account and category can record a standard income or expense in under 30 seconds.
- **SC-002**: From the home screen, a user can find current-month income, expenses, savings, and remaining budget in no more than two actions.
- **SC-003**: For a goal with a target amount and valid target date, a user can identify the remaining amount and required monthly contribution without manual calculation.
- **SC-004**: For a debt with sufficient payment details, a user can identify the remaining balance and next payment; unsupported payoff estimates are clearly marked unavailable.
- **SC-005**: After reload, all valid finance accounts, transactions, budgets, goals, recurring items, debts, and snapshots remain available, while task-board data is unchanged.
- **SC-006**: At least 1,000 transactions can be searched, filtered, sorted, and summarized without the interface becoming unusable.
- **SC-007**: Invalid backup data and corrupt stored finance data never silently replace valid saved finance records.
- **SC-008**: A user can complete primary finance flows by keyboard and use the workspace at mobile and desktop viewport widths with clearly labelled controls.
- **SC-009**: Every displayed total, chart, balance, and estimate can be traced to a user-entered record, budget, allocation, or snapshot; empty data is shown as empty rather than fabricated.

## Assumptions

- The finance workspace is for one user on one browser profile; accounts do not connect to banks and balances are estimates based on user-entered data.
- Indian Rupees are the default currency. A transaction uses the currency of its account; currency conversion is not included, and totals across different currencies are not combined as if they were equivalent.
- A transfer is a movement between two user-owned accounts. It changes the displayed account balances but is excluded from income and expenses.
- A refund is recorded as a distinct refund transaction and reduces applicable spending totals; it does not require the app to find or create an original expense.
- Accounts have a user-entered opening balance. Account balances are estimates that change only from the opening balance and recorded transactions or debt payments.
- A debt payment reduces the payment account by the total amount paid and reduces the debt by the user-entered principal portion. The difference is treated as interest or fees; a debt payment is shown as a cash-flow outflow, and only its interest or fee portion counts as an expense.
- A debt linked to a credit-card or other liability account is counted once in net-worth calculations; an unlinked debt is counted as a separate liability.
- A recurring item describes a planned future occurrence. It appears in due lists but changes balances and transaction reports only when the user records or confirms the actual transaction.
- Goal allocations are informational earmarks, not account transfers. They do not move money or change an account balance.
- Current-month net savings is recorded income less recorded expenses. Savings rate is unavailable when current-month income is zero. Remaining available money is estimated from balances of accounts marked as spendable, less goal allocations and recurring outflows due before the next recorded income date; without a next income date, show upcoming outflows separately rather than subtracting an unknown period.
- Payoff estimates use only available debt terms and make any assumptions visible; when required information is missing or variable, the estimate is omitted.
- Net-worth history starts when the user has recorded sufficient account and liability data or a snapshot; the app does not reconstruct unrecorded historical values. A current snapshot may be saved from entered data when the user reviews reports.
- A validated import replaces finance data only after confirmation and never affects task data.
- Finance data is local to the browser profile and is not encrypted, automatically backed up, or synchronized. The user is responsible for exporting a backup.
- Reports and calculations are informational summaries, not professional financial advice.
- The Task Board remains the existing default workspace and continues to function independently.
