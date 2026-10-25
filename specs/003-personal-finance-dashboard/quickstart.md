# Quickstart: Validating Personal Finance

## Prerequisites

- Node.js 20+ and npm
- A modern desktop or mobile browser
- Project dependencies installed
- Chromium installed for Playwright browser tests

## Run locally

```bash
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. Confirm Task Board and Personal Finance are in-app views and switching does not open another browser tab. Finance workflows must not require network access or send external requests.

## Automated checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

Install Playwright Chromium if required by the local test setup:

```bash
npx playwright install chromium
```

## Acceptance scenarios

1. **Navigation and separation**: Add a task, switch to Personal Finance, add finance data, reload, and confirm both workspaces remain available and their records stay separate.
2. **Accounts and cash flow**: Create INR cash and bank accounts with opening balances. Record income, expense, refund, and transfer; check balances and monthly totals. Confirm transfers are not income or expense and refunds are not income.
3. **Transactions**: Create at least 1,000 mixed records. Search by note/category/account; combine type, account, category, date, and recurring filters; sort by date, amount, and category in both directions.
4. **Budgets and recurring items**: Create overall and category budgets; verify under, exact, and over-budget states. Set salary and bill schedules; confirm upcoming items do not change balances until recorded.
5. **Goals**: Create a goal with target and target date; allocate savings and verify progress, remaining amount, and required monthly contribution without account balance changes.
6. **Debt**: Create a debt with rate/payment/due date. Record a payment with principal and interest/fee portions; verify account outflow, remaining debt, next due date, progress, and only a supported payoff estimate.
7. **Reports and net worth**: Compare monthly categories, income/expense, budget, savings, and debt reports with entered data. Save a current snapshot and verify reports do not fabricate earlier history or double-count linked liabilities.
8. **Backup**: Export finance data and verify it contains no task records. Import a valid backup after confirmation. Try corrupt, unsupported, malformed, and reference-invalid data; verify current data remains unchanged.
9. **Storage migration and failure**: Seed a valid version-1 document and verify it loads. Seed corrupt, unversioned, and unsupported older/newer versions; verify errors are visible and the original bytes remain untouched. Verify failed storage writes are surfaced. Add migration tests only for explicitly supported future schema transitions.
10. **Privacy and accessibility**: Check no external network requests, keyboard-only operation, focus visibility, screen-reader labels/status messages, 44×44 px primary controls, axe results, and usable layout at 320 px and desktop widths.
11. **Performance**: With at least 1,000 mixed transactions, measure search, combined filters, sorting in both directions, and selected-month summaries in a desktop browser. Record the timings and any optimization here.

## Expected outcome

All relevant automated checks pass; finance records and task records survive reload independently; totals match only entered records; invalid stored/imported data is preserved; recurring plans do not generate transactions automatically; and the interface explains local data limitations.

See [data-model.md](./data-model.md) for entities and calculation rules, and [contracts/ui-interactions.md](./contracts/ui-interactions.md) for user-visible interaction requirements.

## Validation record

- TypeScript project check: passed with `tsc -b --pretty false`.
- `git diff --check`: passed.
- Unit tests, Oxlint, production build, and browser checks: not completed in this checkout. Vitest cannot load `@rolldown/binding-wasm32-wasi`; Oxlint's installed native binding is rejected by macOS because its code signature has a different Team ID; and Vite/Rolldown cannot load its native binding for the same code-signature reason (with the WASI fallback also missing). The `npm` executable is also unavailable in the current shell.
- The 1,000-transaction browser performance scenario has not been measured. Run the checks above in an environment with working project dependencies before release.
