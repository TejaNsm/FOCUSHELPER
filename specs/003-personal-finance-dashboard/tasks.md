# Tasks: Personal Finance Dashboard

**Input**: Design documents from `/specs/003-personal-finance-dashboard/`

**Prerequisites**: plan.md and spec.md; data-model.md, research.md, contracts/ui-interactions.md, and quickstart.md

**Tests**: Unit, component, migration/storage, accessibility, and Playwright coverage are explicitly required by the feature specification. Write tests before the corresponding implementation and verify that they fail for the missing behavior.

**Organization**: Tasks are grouped by user story, in the MVP priority order from the specification. All implementation paths are relative to the repository root.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with another marked task because the files differ and neither task depends on the other's incomplete work.
- **[Story]**: User story identifier from `spec.md`; setup, foundational, and polish tasks have no story label.
- Each task names the target file or files.

## Phase 1: Setup

**Purpose**: Add shared test support for finance work without adding dependencies or changing the task board.

- [ ] T001 Create reusable valid account, category, transaction, recurring-item, budget, goal, debt, and finance-document builders in `tests/unit/finance-fixtures.ts`, with explicit INR minor-unit values and stable IDs.
- [ ] T002 Create Playwright finance helpers in `tests/e2e/finance-helpers.ts` for seeding/clearing only the finance storage key, creating transactions through the UI, and selecting finance views; do not clear or mutate task-board storage.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define safe, separate finance persistence and shared domain primitives used by all stories.

**⚠️ CRITICAL**: Complete this phase before implementing any user story.

- [ ] T003 [P] Write finance-storage tests in `tests/unit/finance-storage.test.ts` for empty storage, version-1 load/save, malformed data, missing required collections, duplicate IDs, unsupported older/newer versions, and preserving original stored bytes when loading is unsafe.
- [X] T004 Implement finance document validation and version-1 local persistence in `src/lib/finance-storage.ts` using a key separate from `focushelper.board.v1`; use the rule “Invalid or unsupported documents are not rewritten” from `specs/003-personal-finance-dashboard/data-model.md` and surface read/write failures.
- [ ] T005 [P] Write shared finance-domain tests in `tests/unit/finance.test.ts` for safe integer minor units, currency formatting/default INR, local date/month validation, and invalid zero/negative/unsafe amounts.
- [X] T006 Implement shared finance types, constants, INR/minor-unit helpers, local date/month helpers, and validation in `src/lib/finance.ts`; preserve the data-model rules “Monetary values use safe integer minor units and an explicit ISO currency code” and “Dates use local calendar values (`YYYY-MM-DD`); months use `YYYY-MM`.”

**Checkpoint**: Versioned finance persistence and shared domain primitives pass targeted unit tests; task-board storage remains unchanged.

---

## Phase 3: User Story 1 - Record finances and review cash flow (Priority: P1) 🎯 MVP

**Goal**: Switch between Task Board and Personal Finance in the same tab; manage accounts and core transactions; review correct monthly totals and balances after reload.

**Independent Test**: Create asset accounts and categories, record income, expense, refund, and transfer, reload, and verify account balances and monthly totals without changing task-board data.

### Tests for User Story 1

> Write these tests first and verify they fail before implementing the behavior.

- [ ] T007 [P] [US1] Test income, expense, refund, transfer, account balance, monthly cash-flow, and transaction validation rules in `tests/unit/finance-transactions.test.ts`; assert “Refund increases its account by `amountMinor` and reduces reported net spending; it is not income” and “A transfer between asset accounts decreases the source and increases the destination by the same amount; the transfer is neither income nor expense and does not change net worth.”
- [ ] T008 [P] [US1] Test same-tab workspace selection, account/category forms, transaction add/edit/delete/transfer flows, empty states, and overview totals in `tests/unit/FinanceWorkspace.test.tsx`.
- [X] T009 [P] [US1] Add Playwright coverage in `tests/e2e/finance-overview.spec.ts` for in-app navigation, account setup, income/expense/refund/transfer, reload persistence, and unchanged task-board records.

### Implementation for User Story 1

- [X] T010 [US1] Implement account, category, and transaction types, validators, create/edit/delete actions, selectors, and balance/month-total calculations in `src/lib/finance.ts`; enforce `type` values “cash`, `bank`, `wallet`, `savings`, `credit-card`, `other`”, category kinds “income` or `expense`”, and “A transfer must have two distinct asset accounts of the same currency.”
- [X] T011 [US1] Implement `useFinance` state, finance-only persistence, CRUD actions, save/read error feedback, and accessible action status in `src/hooks/useFinance.ts`; do not call or modify `src/lib/storage.ts`.
- [X] T012 [US1] Add same-page Task Board and Personal Finance navigation in `src/App.tsx`, preserving the existing `Board` component and making workspace selection keyboard-operable without opening a new browser tab.
- [X] T013 [US1] Create `src/components/FinanceWorkspace.tsx` with semantic navigation for Overview, Transactions, Budget, Goals, Loans & Debt, and Reports; show the P1 views and clear empty states while later story views display honest empty/pending states.
- [X] T014 [US1] Implement account and customizable income/expense category creation, edit, archive/delete reference safeguards, opening balances, and currency/classification controls in `src/components/finance/Accounts.tsx`; enforce “name is required”, “opening balance must be a non-negative safe integer”, and category “name is non-empty and unique within kind after case-insensitive trimming.”
- [X] T015 [US1] Implement labelled add/edit/delete forms and history for income, expense, refund, and asset-to-asset transfer in `src/components/finance/Transactions.tsx` and `src/components/finance/TransactionDialog.tsx`; enforce “amountMinor: positive safe integer total amount”, valid local date, compatible account/category references, and same-currency transfer.
- [X] T016 [US1] Implement transaction search by note/category/account, composable type/account/category/date/recurring filters, and date/amount/category sorting in `src/components/finance/Transactions.tsx`; retain stable ordering for equal sort values and support at least 1,000 records.
- [X] T017 [US1] Implement month selection and overview totals, net savings, savings rate (unavailable when income is zero), account balances, current empty states, and asset/liability-aware net worth in `src/components/finance/Overview.tsx` using calculations from `src/lib/finance.ts`.
- [X] T018 [US1] Integrate account, transaction, category, and overview views with `useFinance` in `src/components/FinanceWorkspace.tsx`; ensure all visible actions are labelled and announce success/errors.

**Checkpoint**: US1 works independently, survives reload, preserves task-board data, and its unit/component/Playwright tests pass.

---

## Phase 4: User Story 2 - Plan monthly spending and recurring items (Priority: P2)

**Goal**: Record fixed or variable salary/income, create monthly budgets, and preview recurring bills without silently creating transactions.

**Independent Test**: Enter income and recurring items, set overall/category budgets, and verify actual spending, remaining/over-budget amounts, upcoming due dates, and that balances change only after the user records an occurrence.

### Tests for User Story 2

- [ ] T019 [P] [US2] Test budget month/category uniqueness, exact/under/over-budget values, refunds in actual spend, recurrence projection and month-end clamping, variable income, occurrence confirmation, and schedule advancement in `tests/unit/finance-planning.test.ts`.
- [ ] T020 [P] [US2] Test monthly budget editing, recurring item creation/edit/archive, explicit record/skip actions, upcoming views, and due-before-income display in `tests/unit/FinancePlanning.test.tsx`.
- [ ] T021 [P] [US2] Add Playwright scenarios for budgets, salary, recurring rent/bills, confirmation without duplicate transactions, and due-before-next-income in `tests/e2e/finance-planning.spec.ts`.

### Implementation for User Story 2

- [X] T022 [US2] Add budget and recurring-item types, validation, CRUD/reducer actions, month-end-clamped schedule projection, eligible expense/refund totals, and budget selectors in `src/lib/finance.ts`; enforce “limitMinor: non-negative safe integer”, “one budget per month/category/currency”, positive recurrence interval, valid local dates, and no scheduled transaction generation.
- [X] T023 [US2] Add recurring transaction confirmation and explicit skip actions in `src/hooks/useFinance.ts`; confirming must create one transaction and advance `nextDate`, while skipping advances only after explicit user action.
- [X] T024 [US2] Implement monthly overall/category budget editing, actual spend, remaining amount, and clear over-budget states in `src/components/finance/Budget.tsx`; overall actual spend must derive from eligible expense/refund activity, not the sum of category budgets.
- [ ] T025 [US2] Add recurring income/expense management to `src/components/finance/Budget.tsx` and confirmed occurrence entry to `src/components/finance/TransactionDialog.tsx`; support variable income with no expected amount and prevent balance/history changes before confirmation.
- [X] T026 [US2] Extend `src/components/finance/Overview.tsx` with upcoming recurrence previews and expenses due before the next recorded income date; when no next income date exists, show upcoming outflows without a false comparison or time-bounded remainder.
- [X] T027 [US2] Integrate the Budget view and recurring-item actions with `useFinance` in `src/components/FinanceWorkspace.tsx`; retain visible status announcements and local calendar month selection.

**Checkpoint**: US2 tests pass with the US1 account and transaction foundation intact.

---

## Phase 5: User Story 3 - Save toward goals (Priority: P3)

**Goal**: Create savings targets and allocate amounts without moving or changing account balances.

**Independent Test**: Create a goal, allocate savings, set a future target date, and verify allocated progress, remaining amount, and required monthly contribution while account balances remain unchanged.

### Tests for User Story 3

- [ ] T028 [P] [US3] Test goal target/allocation validation, remaining and capped progress, calendar-month contribution calculation, reached/past-date cases, and unchanged account balances in `tests/unit/finance-goals.test.ts`.
- [ ] T029 [P] [US3] Test goal create/edit/archive, allocation/deallocation, empty states, and accessible required-contribution display in `tests/unit/FinanceGoals.test.tsx`.
- [ ] T030 [P] [US3] Add Playwright goal creation, allocation, reload persistence, and account-balance invariance scenarios in `tests/e2e/finance-goals.spec.ts`.

### Implementation for User Story 3

- [X] T031 [US3] Add goal/allocation types, validation, actions, progress selectors, and required monthly contribution calculation in `src/lib/finance.ts`; enforce “target must be a positive safe integer”, positive allocation, matching currency, and `max(0, targetMinor - allocatedMinor)`.
- [X] T032 [US3] Add goal and allocation actions to `src/hooks/useFinance.ts`; allocations must update only goal state and never create transactions or modify accounts.
- [X] T033 [US3] Implement goal create/edit/archive, allocation/deallocation, target date and planned contribution fields, progress, remaining amount, and required monthly amount in `src/components/finance/Goals.tsx`.
- [X] T034 [US3] Integrate Goals view and overview goal summary in `src/components/FinanceWorkspace.tsx` and `src/components/finance/Overview.tsx`, preserving the calculation “divide by the number of calendar months from the current month through the target month (at least one), rounded up to the smallest minor unit.”

**Checkpoint**: US3 passes independently on top of the account/overview shell; allocations do not change any account balance.

---

## Phase 6: User Story 4 - Track loans and debt (Priority: P4)

**Goal**: Track liability balances, payments, upcoming due dates, progress, and only supported payoff estimates.

**Independent Test**: Create a debt, link it to a liability account where appropriate, record a payment with principal and interest/fees, reload, and verify account cash outflow, debt balance, due date, and net worth without double counting.

### Tests for User Story 4

- [ ] T035 [P] [US4] Test debt validation, payment principal/interest split, linked liability account synchronization, payment edit/delete consistency, zero-interest and insufficient-payment payoff estimates, and no negative balances in `tests/unit/finance-debt.test.ts`.
- [ ] T036 [P] [US4] Test debt form fields, payment flow, due-date display, progress, estimate assumptions/unavailable state, and empty state in `tests/unit/FinanceDebt.test.tsx`.
- [ ] T037 [P] [US4] Add Playwright debt creation, payment, reload, payoff estimate, due-date, and linked-account no-double-count scenarios in `tests/e2e/finance-debt-reports.spec.ts`.

### Implementation for User Story 4

- [X] T038 [US4] Add debt/debt-payment types, CRUD and payment actions, liability-account synchronization, progress, and constrained payoff calculation in `src/lib/finance.ts`; enforce “original amount is positive”, “remaining amount is between zero and original amount”, positive payment, principal `no greater than total or debt remaining`, and assumptions “constant annual rate, monthly compounding, and a fixed payment at each month's end.”
- [X] T039 [US4] Implement atomic debt payment, edit, delete, and linked transaction/account updates in `src/hooks/useFinance.ts`; total payment reduces the payment asset, principal reduces debt, and only interest/fees count as expense.
- [X] T040 [US4] Implement debt/loan/EMI/credit-card management, lender and terms, due date, linked liability account, progress, and explicit estimate/unavailable messaging in `src/components/finance/LoansDebt.tsx`.
- [X] T041 [US4] Implement debt payment entry with total paid and principal applied in `src/components/finance/LoansDebt.tsx`; validate payment account and prevent a payment from reducing the debt below zero.
- [X] T042 [US4] Integrate Loans & Debt and overview debt/upcoming-payment summaries in `src/components/FinanceWorkspace.tsx` and `src/components/finance/Overview.tsx`, ensuring a linked debt/liability account contributes only once to net worth.

**Checkpoint**: US4 tests pass; debt, payment transaction, account balance, and linked liability stay consistent after edits, deletes, and reload.

---

## Phase 7: User Story 5 - Review reports and back up finance data (Priority: P5)

**Goal**: Review finance reports and net-worth history and use a validated finance-only backup without affecting task data.

**Independent Test**: Enter data across months, review every report, save a current snapshot, export finance records, then import valid and invalid backups and verify that invalid input never changes existing records or task data.

### Tests for User Story 5

- [ ] T043 [P] [US5] Test monthly category, income/expense, savings, budget, debt, currency-scope and net-worth snapshot calculations in `tests/unit/finance-reports.test.ts`; verify no past snapshot is inferred and linked liabilities are counted once.
- [ ] T044 [P] [US5] Test finance-only export shape, full backup validation, explicit replacement import, malformed/unsupported/reference-invalid backups, and unchanged saved bytes on rejection in `tests/unit/finance-storage.test.ts`.
- [ ] T045 [P] [US5] Test report empty states, snapshot confirmation, export action, import validation errors, and replace confirmation in `tests/unit/FinanceReports.test.tsx`.
- [ ] T046 [US5] Add Playwright report, snapshot, export/import, invalid backup preservation, and task-board separation scenarios in `tests/e2e/finance-debt-reports.spec.ts`.

### Implementation for User Story 5

- [X] T047 [US5] Implement monthly spending, income/expense, savings, budget, debt, and net-worth selectors plus explicit current snapshot creation in `src/lib/finance.ts`; support one currency per aggregate and do not reconstruct unrecorded history.
- [X] T048 [US5] Implement finance-only export serialization and complete import-document validation in `src/lib/finance-storage.ts`; reject unknown versions, invalid IDs/references, dates, currencies, amounts, and collection shapes before changing storage.
- [X] T049 [US5] Implement confirmed finance-only replacement import and downloadable export actions in `src/hooks/useFinance.ts`; keep the task-board storage key and contents unchanged on every path.
- [X] T050 [US5] Implement report period/currency selection, category spending, income versus expense, savings, budget, debt, net-worth history, and explicit snapshot controls in `src/components/finance/Reports.tsx`; expose textual summaries for charts and never present invented historical values.
- [X] T051 [US5] Add finance-only backup import/export actions, file validation feedback, and replace confirmation in `src/components/finance/Reports.tsx`; invalid files must leave finance state unchanged.
- [X] T052 [US5] Integrate Reports and snapshot/export/import actions in `src/components/FinanceWorkspace.tsx` and ensure completion/error announcements remain accessible.

**Checkpoint**: US5 reports and backups pass with all prior story records; task-board data remains separate.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify privacy, accessibility, responsive use, performance, and documentation across all stories.

- [ ] T053 [P] Add axe, keyboard-only, visible-focus, screen-reader status, 44×44 px primary control, and 320 px/desktop viewport checks for finance navigation and forms in `tests/e2e/finance-a11y.spec.ts`.
- [X] T054 [P] Update `README.md` with finance navigation, views, INR/account behavior, recurring-item confirmation, reports, and the exact disclosure that finance data is local, not encrypted, not automatically backed up, and may be lost if browser data is cleared.
- [ ] T055 Verify finance-only network privacy, independent versioned persistence, malformed/unsupported-data preservation, write-error visibility, and no task-board storage changes in `tests/e2e/finance-a11y.spec.ts` and `tests/e2e/finance-overview.spec.ts`.
- [ ] T056 Measure transaction search, filters, sorting, and selected-month summaries with at least 1,000 records; optimize only the measured bottleneck in `src/lib/finance.ts` or `src/components/finance/Transactions.tsx` and record the verified result in `specs/003-personal-finance-dashboard/quickstart.md`.
- [ ] T057 Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:e2e`; complete all scenarios in `specs/003-personal-finance-dashboard/quickstart.md` and record any unavailable or failing checks in that file.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No implementation dependencies. Shared test builders should be available before story-specific tests.
- **Foundational (Phase 2)**: Depends on setup and blocks every story. It establishes safe finance document handling and common types/calculations without touching task-board storage.
- **US1 (Phase 3)**: Depends on foundational work; produces the independently useful finance shell, accounts, transactions, and overview.
- **US2 (Phase 4)**: Depends on US1 accounts/categories/transactions and overview; adds budgets and recurrence.
- **US3 (Phase 5)**: Depends on US1 finance shell, account balances, and overview; does not require US2.
- **US4 (Phase 6)**: Depends on US1 accounts, transactions, and net-worth base; integrates with US2 recurrence only for upcoming scheduled EMI display.
- **US5 (Phase 7)**: Depends on the models and calculations from US1–US4 so reports include all supported finance records.
- **Polish (Phase 8)**: Depends on the stories selected for release; full acceptance requires US1–US5.

### User Story Dependencies

- **US1 (P1)**: After foundational phase; no other story dependency. MVP.
- **US2 (P2)**: After US1, because budgets and recurring items use its transaction, category, account, and overview surfaces.
- **US3 (P3)**: After US1; logically independent of US2, but sequenced after it to follow the requested MVP delivery order.
- **US4 (P4)**: After US1; recurring EMI previews can use US2 schedules. The implementation is sequenced after US3 to follow priority and avoid concurrent edits to shared finance state.
- **US5 (P5)**: After US1–US4; reports and exports cover all finance entities, and snapshots require established account/debt calculations.

### Task Dependency Graph

```text
T001, T002
  -> T003 -> T004
  -> T005 -> T006
  -> US1: T007, T008, T009 -> T010 -> T011 -> T012 -> T013 -> T014, T015 -> T016, T017 -> T018
  -> US2: T019, T020, T021 -> T022 -> T023 -> T024, T025 -> T026 -> T027
  -> US3: T028, T029, T030 -> T031 -> T032 -> T033 -> T034
  -> US4: T035, T036, T037 -> T038 -> T039 -> T040, T041 -> T042
  -> US5: T043, T044, T045, T046 -> T047, T048 -> T049 -> T050, T051 -> T052
  -> Polish: T053, T054 -> T055 -> T056 -> T057
```

### Parallel Opportunities

- T001 and T002 touch separate test-helper files.
- In foundational work, T003 and T005 cover separate test files; after those tests exist, T004 and T006 can be implemented in separate modules.
- Within each story, unit, component, and Playwright tests target separate files and can be authored in parallel after shared fixtures and foundation exist.
- In US1, account UI (`src/components/finance/Accounts.tsx`) and transaction UI (`src/components/finance/Transactions.tsx` / `TransactionDialog.tsx`) can be built in parallel after domain actions and `useFinance` APIs are stable. Overview integration follows both.
- Story-level parallelism is intentionally limited: US2, US3, and US4 extend shared finance domain state and have ordered user-facing dependencies. The recommended delivery remains sequential by priority.
- T053 and T054 target distinct test/documentation files and can be completed in parallel.

---

## Parallel Example: User Story 1

```text
After T001-T006 are complete, author these independent tests together:
Task: T007 tests/unit/finance-transactions.test.ts
Task: T008 tests/unit/FinanceWorkspace.test.tsx
Task: T009 tests/e2e/finance-overview.spec.ts

After domain actions and useFinance APIs stabilize, implement separate UI surfaces:
Task: T014 src/components/finance/Accounts.tsx
Task: T015 src/components/finance/Transactions.tsx and src/components/finance/TransactionDialog.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup and Phase 2 Foundational.
2. Complete Phase 3 US1: in-app finance navigation, accounts/categories, transactions, monthly overview, and persistence.
3. Validate US1 with unit, component, and Playwright tests, including reload and unchanged task-board storage.
4. Stop for review/demo if desired; US1 provides a useful standalone local finance MVP.

### Incremental Delivery

1. Setup + Foundation, then US1 account and cash-flow MVP.
2. Add US2 budgets and recurring income/expenses.
3. Add US3 savings goals and allocations.
4. Add US4 debt tracking and payment estimates.
5. Add US5 reports, net-worth history, and validated finance-only backup.
6. Complete cross-cutting accessibility, privacy, performance, documentation, and quickstart validation.

### Parallel Team Strategy

Complete shared setup and foundation as one coordinated change. Within a story, parallelize independent test files first and separate UI modules after shared domain APIs stabilize. Keep story phases in priority order because their calculations and user surfaces build on earlier finance primitives.

---

## Notes

- [P] means separate files and no dependency on unfinished work, not merely that two tasks are conceptually related.
- Every user-story task maps to its corresponding section in `spec.md`; exact field constraints and state rules are referenced from `data-model.md`.
- Tests are explicitly requested by the specification and must be written before their corresponding implementation.
- Do not add a financial service, bank connection, telemetry, or new dependency.
- A debt estimate is informational and must display its assumptions; do not present investment, tax, lending, or other professional advice.

## Phase 9: Convergence

- [X] T058 CRITICAL Add component and browser regression tests for recurring occurrence confirmation, goal allocation balance invariance, and debt-payment edit/delete consistency per Constitution V, SC-008, US2/AC3, US3/AC1-4, US4/AC2 (missing)
- [X] T059 Synchronize linked debt balances with their liability accounts when debts are created or edited, while preserving single-count net worth per FR-016, FR-023, US4/AC4, T038 (partial)
- [X] T060 Complete validated debt-payment editing and deletion, keeping payment transactions, account balances, debt balances, and due dates consistent across payment order per FR-005, FR-017, US4/AC2, T039 (partial)
- [X] T061 Reject orphan or internally inconsistent loan-payment records, including principal exceeding total paid, during storage and backup validation per FR-026, FR-027, T048 (partial)
- [ ] T062 Measure search, combined filters, sorting, and selected-month summaries with at least 1,000 transactions, then record browser timings and any measured optimization in quickstart.md per SC-006, plan: performance goal, T056 (partial)
