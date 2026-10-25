# Research: Personal Finance Dashboard

## Decisions

### Keep finance independent from the task board

- **Decision**: Keep the Task Board component, reducer, and storage key unchanged. Add same-page workspace navigation in the application shell and give finance its own state, domain module, and storage key (`focushelper.finance.v1`) with a schema version inside the stored document.
- **Rationale**: The specification requires the task board to remain available and unchanged, and finance storage must be logically separate and versioned. The current app already has one shell and local-storage patterns that can be reused without coupling the two data models.
- **Alternatives considered**: Put finance objects in the task-board document; rejected because changes or corruption in one feature could affect the other. Open a new tab or add a remote finance service; rejected by the same-tab, local-only requirements.

### Represent money as integer minor units with an explicit currency

- **Decision**: Store money as safe integer minor units (for INR, paise) with an ISO currency code on each account and currency-aware display formatting. Validate positive amounts for transactions, allowing direction/type to determine the effect. Do not aggregate different currencies into one total or convert them.
- **Rationale**: Integer minor units avoid binary floating-point rounding in balance and budget arithmetic. Explicit currency makes the default INR clear and avoids incorrect cross-currency totals while leaving a path for additional currencies.
- **Alternatives considered**: Store decimal rupee values as floating-point numbers; rejected due to rounding errors. Add currency conversion; rejected because no exchange-rate source or conversion behavior is in scope.

### Derive balances and reports from explicit opening balances and entries

- **Decision**: Each account starts from a user-entered opening balance. Asset and liability account balances use explicit opposite effects. Ordinary transfers are limited to distinct asset accounts in the same currency; paying a debt uses the debt-payment flow, which separates principal from interest/fees. Income, expenses, and refunds have explicit reporting effects.
- **Rationale**: A visible, auditable calculation is necessary for accurate cash flow, account balances, and net worth. Distinguishing principal from interest avoids reducing debt by an entire payment amount while treating the full payment as expense.
- **Alternatives considered**: Store balances as independently editable values; rejected because they can drift from transaction history. Count transfers as expenses/income; rejected because this double-counts internal movement. Use generic transfers to pay liabilities; rejected because liability reduction needs explicit principal and interest/fee treatment.

### Keep recurring schedules as plans, not transactions

- **Decision**: Recurrence rules produce due-date previews only. They never create a transaction or change an account balance unless the user records or confirms the actual occurrence. Support the schedule frequencies needed for common salary and bills, with an explicit next date.
- **Rationale**: This meets recurring-item and upcoming-payment needs while honoring the requirement not to generate inferred financial activity.
- **Alternatives considered**: Automatically materialize future or due transactions; rejected because scheduled obligations are not proof of payment or receipt.

### Treat goal allocations as earmarks

- **Decision**: Store goal allocations separately from account movements and transactions. Show allocations in goal progress and subtract them only in the overview's estimate of available money.
- **Rationale**: This satisfies the requirement that allocations not alter account balances incorrectly while still showing a meaningful amount reserved toward goals.
- **Alternatives considered**: Create a transfer to a goal account on allocation; rejected because a goal is not necessarily a financial account and allocations are explicitly non-cash movements in the specification.

### Show debt estimates only when inputs support them

- **Decision**: Calculate payoff estimates only for a positive balance with a known periodic interest rate and a fixed payment greater than the interest due for that period. Make the fixed-payment and rate assumptions visible. Otherwise show that an estimate is unavailable. Keep account cash outflow equal to the full payment; reduce debt by the principal portion and classify the remainder as interest or fees.
- **Rationale**: Payoff dates depend on payment timing and changing rates. A constrained formula and explicit assumptions are safer than an unsupported prediction.
- **Alternatives considered**: Always divide balance by payment; rejected because it ignores interest and can claim payoff for an insufficient payment.

### Record net-worth history only from known dates

- **Decision**: Permit a user-requested current snapshot of account assets and debts. Never backfill older points from current balances. Derive historical periods only from complete dated data where available and label estimates; otherwise show history from the first actual snapshot onward.
- **Rationale**: This allows an honest history while avoiding fabricated past net worth.
- **Alternatives considered**: Reconstruct past account balances from current balance and partial transactions; rejected because opening balances and older transaction history may be incomplete.

### Validate finance storage and imports before applying

- **Decision**: Validate the entire stored document before exposing it for edits. Keep unrecognized or invalid data unchanged and disable writes when the current document cannot be safely understood. Export only finance data. Validate an import fully and require confirmation before replacing current finance data.
- **Rationale**: Local storage is user data and must not be silently cleared by a parse failure, schema mismatch, or invalid backup.
- **Alternatives considered**: Load an empty state on error and save it; rejected because this destroys recoverable data. Merge imported state automatically; rejected because ID collisions and duplicate transactions make silent merge ambiguous.

### Use pure calculations and derived views for transaction volume

- **Decision**: Keep transaction filtering, sorting, and monthly calculations as pure selectors over the finance state. Calculate only the active view/month and avoid storing derived totals. Optimize or introduce list virtualization only if measurement shows 1,000 records cannot meet the usability target.
- **Rationale**: A 1,000-record local dataset is modest; derived values avoid stale aggregates and preserve consistency after edit/delete/import.
- **Alternatives considered**: Persist aggregates or immediately add a database dependency; rejected as unnecessary complexity absent measurement.

### Use accessible, same-page finance navigation

- **Decision**: Add a semantic tab-like navigation control in the app shell and render one selected workspace at a time in the current document. Finance has primary views for Overview, Transactions, Budget, Goals, Loans & Debt, and Reports.
- **Rationale**: The existing app renders one board from its shell. Replacing the shell with two selectable workspaces is the smallest change that satisfies same-tab navigation and preserves Board behavior.
- **Alternatives considered**: Route to a new browser page or use another browser tab; rejected because the user explicitly requires in-app navigation without a separate tab.

## Implementation Constraints

- No new package is required by the current project dependencies.
- Use local calendar date strings (`YYYY-MM-DD`) for transactions and due dates, and year-month strings (`YYYY-MM`) for budget/report periods.
- Keep the finance store key separate from `focushelper.board.v1`.
- In the default INR currency, user-facing amounts use standard Indian Rupee formatting; persisted amounts use integer paise.
- Saved finance data is not encrypted, automatically backed up, or synced. The UI must not imply otherwise.
