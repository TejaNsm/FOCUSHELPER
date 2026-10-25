# Personal Finance UI Interaction Contract

This application exposes a user interface, not a public network API. The contract describes visible navigation, user actions, data effects, and accessibility requirements.

## Workspace Navigation

- The home shell presents **Task Board** and **Personal Finance** controls.
- Selecting either control changes the workspace in the current browser tab; it does not open a new window or tab.
- Task Board continues to render its existing board and use only its existing storage.
- Personal Finance provides **Overview**, **Transactions**, **Budget**, **Goals**, **Loans & Debt**, and **Reports** views.
- A selected view is indicated semantically and visually. Navigation works by keyboard and returns focus predictably.

## Transactions

- A user can add income, expense, refund, transfer, and debt payment using a labelled form.
- Income, expense, and refund require amount, date, account, and compatible category. Transfer requires distinct asset accounts with matching currencies. Debt payment requires an associated debt and payment account.
- An expense or refund recorded against a liability account linked to a debt updates both the account amount owed and debt balance.
- Amounts are entered in the selected account currency and stored/processed as integer minor units. Invalid or zero/negative amounts are rejected with an explanation.
- The user can edit or delete saved transactions with confirmation for destructive actions where appropriate.
- Search matches note, category, and account. Filters compose across type, account, category, local date range, and recurring status. Sort supports date, amount, and category in ascending or descending order.
- Every completed action is announced through accessible status feedback. No schedule creates a transaction without user action.

## Accounts and Categories

- The user can create, edit, archive, and delete accounts and categories, subject to safe reference handling.
- Account forms identify type, currency, opening balance (amount held for assets or amount owed for liabilities), asset/liability classification, and spendable status.
- Category forms identify income or expense kind. Existing transactions remain readable if their category is archived.
- Removing referenced records must either be blocked with an explanation or require an explicit reassignment; history must not silently lose its meaning.

## Overview and Budget

- The Overview opens to the current local calendar month and shows income, expenses, net savings, savings rate (or unavailable when income is zero), account balances, available-money estimate, upcoming payments, goal summary, debt summary, and net worth when data exists.
- The user can select another month. Empty values use clear zero/empty states; the app does not generate sample records.
- Overall and category budgets show limit, actual spending, remaining amount, and over-budget status.
- Recurring bills due before a recorded next income date are identified. Without a next income date, upcoming obligations are listed without a false comparison.

## Recurring Items

- Recurring items show schedule, next local date, expected amount if known, account, category, and active status.
- A due item can be recorded as a transaction only after explicit confirmation. Confirming advances the next date. Skipping also requires explicit action.
- A variable-income recurring item may have no expected amount; the user enters the actual amount when recording income.

## Goals

- A goal displays target, allocated amount, progress, remaining amount, optional target date, optional planned contribution, and required monthly contribution when calculable. The estimate divides remaining money across calendar months from the current month through the target month, including both months.
- Creating or changing an allocation updates the goal only, not account balances or transactions.
- Completed or past-date goals show non-negative remaining values and no misleading negative contribution estimate.

## Loans and Debt

- A debt displays lender, original and remaining balances, rate, payment, next due date, optional term, linked payment account when configured, progress, and payoff estimate when supported.
- A payment form collects total paid and principal applied. Saving changes the payment account by total paid and the debt by principal applied; if the debt is linked to a liability account, that account is reduced by the same principal. Interest/fees are treated as expense.
- A payment cannot reduce debt below zero. Edits/deletions preserve agreement between debt balance, payment transaction, and account balance.
- When rate or payment details do not support a reliable estimate, the UI says it is unavailable and does not present an invented payoff date. A displayed estimate identifies its assumptions: constant annual rate, monthly compounding, and fixed month-end payments.

## Reports and Net Worth

- Reports use only saved transactions, budgets, goals, debts, and snapshots to show spending by category, income versus expenses, savings progress, budget performance, debt progress, and net-worth history.
- Reports are scoped to selected local-calendar months and a single currency. Mixed currencies are not silently added together.
- The user can explicitly save a current net-worth snapshot. The app never invents historical snapshots.
- Informational reports do not provide professional financial recommendations.

## Finance Backup and Storage Errors

- Export downloads finance records only; task-board records are excluded.
- Import validates file type, schema version, required fields, identifiers, references, dates, currency, and amounts before changing saved data.
- Invalid imports leave existing finance data unchanged and explain the problem.
- A valid import requires explicit confirmation that existing finance data will be replaced. Task-board data is never changed.
- The initial finance document uses schema version 1. Corrupt, unsupported, or unreadable finance storage is reported; the app does not write an empty default document over it. Any later migration must be explicit and tested; unknown older and newer versions remain unchanged.
- The UI explains that finance data is browser-local, not encrypted, not backed up automatically, and may be lost if browser data is cleared.

## Accessibility and Responsive Behavior

- Every input has a programmatic label; buttons have descriptive names; validation and save errors are announced.
- All workflows are operable by keyboard with visible focus and logical focus restoration.
- Primary controls have at least 44×44 px hit areas. Layout remains usable at 320 px and desktop widths, with no unintended horizontal overflow.
- Tables and charts expose equivalent textual values and summaries to assistive technology.
