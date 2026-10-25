# Finance Data Model

All entities below belong to the finance workspace and are persisted independently of task-board data. IDs are stable strings. Dates use local calendar values (`YYYY-MM-DD`); months use `YYYY-MM`. Monetary values use safe integer minor units and an explicit ISO currency code. For INR, one major unit is 100 paise.

## Entities

### FinanceDocument

- `version`: supported finance schema version; initial schema is version 1.
- `accounts`: financial accounts.
- `categories`: user-managed income and expense classifications.
- `transactions`: completed, user-entered financial activity.
- `recurringItems`: planned income or expenses; not completed transactions.
- `budgets`: overall and category limits by month.
- `goals`: savings targets.
- `goalAllocations`: informational earmarks linked to goals.
- `debts`: loan and liability records.
- `debtPayments`: confirmed payments and principal applied.
- `netWorthSnapshots`: dated records of known account assets and liabilities.

Validation: all required collections must be arrays; document version must be recognized. Every entity ID must be unique within its collection. Invalid or unsupported documents are not rewritten.

### Account

- `id`, `name`, `type`: user-defined account identity and type (`cash`, `bank`, `wallet`, `savings`, `credit-card`, `other`).
- `currency`: ISO code; default `INR`.
- `openingBalanceMinor`: user-entered opening amount in minor units.
- `classification`: `asset` or `liability`.
- `spendable`: whether this asset can be used in the available-money estimate.
- `archived`: whether it is omitted from new-entry choices; historical activity remains available.

Rules: name is required; opening balance must be a non-negative safe integer; currency must be supported by the formatter; type and classification must be explicit. Opening liability balance means the amount owed. A linked debt record is metadata for the liability account and is not counted twice in net worth.

### Category

- `id`, `name`
- `kind`: `income` or `expense`
- `archived`

Rules: name is non-empty and unique within kind after case-insensitive trimming. Existing history remains readable if a category is archived.

### Transaction

- `id`, `type`: `income`, `expense`, `refund`, `transfer`, or `loan-payment`.
- `amountMinor`: positive safe integer total amount.
- `date`: local calendar date.
- `accountId`: primary account; transfer uses `sourceAccountId` and `destinationAccountId`.
- `categoryId`: required for income, expense, and refund; optional/derived for transfer and debt payment.
- `note`: optional bounded text.
- `recurringItemId`: optional link to the plan that prompted the confirmed transaction.
- `debtId`: required for a loan payment.
- `principalMinor`: for loan payment, amount applied to principal; remainder is interest/fees.
- `createdAt` and `updatedAt`: record timestamps for stable editing and ordering.

Rules: referenced accounts/categories/debts must exist and be compatible. A transfer must have two distinct asset accounts of the same currency. A debt-payment total must be greater than zero; principal must be between zero and total, and cannot exceed current principal balance. An expense or refund charged to a liability account linked to a debt must update that debt balance by the same amount. No future transaction is generated solely from a schedule.

Balance effects:

- On an asset account, income and refund increase the balance; expense, transfer out, and debt-payment total decrease it.
- On a liability account, expense increases the amount owed; refund or income decreases it. For a linked debt, the debt remaining amount changes with those posted transactions.
- A transfer between asset accounts decreases the source and increases the destination by the same amount; the transfer is neither income nor expense and does not change net worth.
- Loan payment decreases the payment asset account by the total. Principal reduces the linked debt and, if the debt is linked to a liability account, reduces that account's amount owed by the same amount. Interest/fees (`amountMinor - principalMinor`) count as expense. The debt record and linked account are one liability for net worth.

### RecurringItem

- `id`, `name`, `kind`: income or expense.
- `amountMinor`: expected amount; a variable-income item may omit the amount.
- `currency`, `accountId`, `categoryId`
- `frequency`: supported schedule such as weekly, monthly, or yearly.
- `interval`: positive integer repeat interval.
- `nextDate`: next planned occurrence as local date.
- `note`, `active`

Rules: dates and schedule must be valid. An item without a known amount or next date can be shown as incomplete configuration, but cannot produce a dated upcoming amount. Occurrences are previews; user confirmation creates a transaction and advances the schedule. Monthly/yearly dates that do not exist in a target month are clamped to that month's final calendar day.

### Budget

- `id`, `month`: `YYYY-MM`.
- `categoryId`: null for overall budget, otherwise an expense category.
- `limitMinor`: non-negative safe integer.
- `currency`

Rules: one budget per month/category/currency. Actual category spend includes expense transactions less refunds for that category. Transfers are excluded. Overall spending is derived from eligible expense/refund activity, not by adding category budgets.

### Goal

- `id`, `name`, `targetMinor`, `currency`
- `targetDate`: optional local date.
- `plannedMonthlyMinor`: optional user-entered target contribution.
- `createdAt`, `archived`

Rules: target must be a positive safe integer. Allocations are separate from account balance. Amount remaining is `max(0, targetMinor - allocatedMinor)`. Required monthly contribution is available only for a future target date and positive remaining amount; divide by the number of calendar months from the current month through the target month (at least one), rounded up to the smallest minor unit.

### GoalAllocation

- `id`, `goalId`, `amountMinor`, `date`, optional `note`

Rules: positive safe integer; goal must exist; allocation currency matches goal currency. Allocation/deallocation changes the goal total only and does not modify an account or transaction.

### Debt

- `id`, `name`, `lender`, `kind`: loan, EMI, credit-card, or other.
- `originalMinor`, `remainingMinor`, `currency`
- `annualInterestBasisPoints`: optional non-negative integer (for example, 1200 = 12%).
- `paymentMinor`: expected installment amount.
- `nextDueDate`: local date.
- `termMonths`: optional positive integer.
- `liabilityAccountId`: optional account link to avoid counting a liability twice.
- `active`

Rules: original amount is positive; remaining amount is between zero and original amount. Payment is positive. Payoff estimate is omitted if rate/payment details are insufficient or the payment does not exceed estimated periodic interest. An estimate assumes a constant annual rate, monthly compounding, and a fixed payment at each month's end; display these assumptions with the estimate.

### DebtPayment

- `id`, `debtId`, `transactionId`, `date`
- `totalMinor`, `principalMinor`
- `paymentAccountId`

Rules: total is a positive safe integer; principal is a non-negative safe integer no greater than total or debt remaining. Interest/fees are `totalMinor - principalMinor`. One payment creates one linked transaction so account cash flow and debt balance remain consistent; edits and deletes update both atomically.

### NetWorthSnapshot

- `id`, `date`, `currency`
- `assetTotalMinor`, `liabilityTotalMinor`, `netWorthMinor`
- `accountBalances`: explicit account IDs and amounts included in the snapshot.
- `debtBalances`: explicit debt IDs and amounts included, excluding debts already represented by linked liability accounts.

Rules: saved only from currently entered balances on explicit user action. No backdated snapshot is inferred. Multi-currency values are kept separate; a combined net worth is shown only when all included balances share a currency or the user supplies a comparable snapshot.

## Derived Values

- **Asset account balance**: opening balance plus income, refunds, and transfers in, less expenses, transfers out, and debt-payment totals.
- **Liability account balance**: opening amount owed plus expenses charged to the account, less refunds, income credits, and principal repayments.
- **Monthly income**: sum of income transactions in the selected local month and currency.
- **Monthly expense**: sum of expenses plus debt-payment interest/fees less refunds in the selected month and currency.
- **Net savings**: monthly income minus monthly expense.
- **Savings rate**: net savings divided by income; unavailable when income is zero.
- **Category budget actual**: category expenses less refunds for the month.
- **Remaining budget**: limit minus actual; an amount below zero is shown as an over-budget amount.
- **Goal progress**: allocated amount, target amount, remaining amount, and percent capped for display.
- **Net worth**: recorded asset balances minus recorded liability balances for a single currency. A debt linked to a liability account is counted once, through that account; an unlinked debt is counted directly.
- **Available money estimate**: balances in spendable asset accounts, less goal allocations and recurring expense amounts due before the next recorded income date. If no next income date is known, show upcoming outflows without estimating a time-bounded remainder.
- **Upcoming item**: active recurring item projected from its next date; it does not affect any balance until recorded as a transaction.

## State Changes

- Creating, editing, or deleting transactions updates account balances and all derived totals on the next view calculation.
- Confirming a recurring occurrence creates a transaction and advances `nextDate`; skipping an occurrence advances the schedule only after explicit user action.
- A debt payment updates its transaction, debt principal, linked liability account if present, payment account, and due-date schedule as one state change.
- An expense or refund recorded against a linked liability account updates both the account amount owed and linked debt remaining amount as one state change.
- Archiving a category, account, goal, or debt hides it from new-entry choices where applicable but preserves historical references.
- Finance backup import validates the full document before an explicit confirmed replacement. It never changes task-board storage.
