# Implementation Plan: Personal Finance Dashboard

**Branch**: `main` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-personal-finance-dashboard/spec.md`

## Summary

Add an in-app Personal Finance workspace next to the existing Task Board, without changing the board's behavior or storage. Deliver the feature in the specified priority order: account and transaction capture with a monthly overview; budgets and recurring items; savings goals; debt tracking; then reports and finance-only validated backup. Keep finance state browser-local and versioned, use integer minor currency units, derive every summary from user-entered records, and never create transactions from scheduled items without confirmation.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Node.js 20+ for tooling

**Primary Dependencies**: Existing Vite 8, React, Tailwind CSS 4, Radix UI, Vitest 5, React Testing Library, Playwright; no new dependency planned.

**Storage**: Browser `localStorage`, with a separate finance key and versioned document. Preserve `focushelper.board.v1` and its current data format untouched.

**Testing**: Vitest + React Testing Library for finance calculations, validation, storage, migration, components, and accessibility-relevant behaviors; Playwright for in-app navigation, primary finance journeys, persistence, responsive layout, keyboard access, and local-only requests.

**Target Platform**: Modern desktop and mobile browsers; offline after application assets are available; development and preview servers remain bound to `127.0.0.1`.

**Project Type**: Single-page web application (frontend only).

**Performance Goals**: Search, filter, sort, and render summaries for at least 1,000 transactions without the interface becoming unusable; target under one second for common transaction queries on the supported local browser.

**Constraints**: Single user; no remote services, bank connections, authentication, telemetry, or network-dependent finance behavior. Local dates govern transactions, months, and due dates. Indian Rupees are the default; money uses integer minor units and explicit currency codes. Clearly disclose local storage limitations. No professional advice. Maintain keyboard access, screen-reader labels and feedback, visible focus, 44×44 px primary controls, and mobile/desktop layouts.

**Scale/Scope**: One local browser profile; accounts, transaction history, recurring items, budgets, goals, debts, and snapshots. At least 1,000 transactions. No shared finance, sync, receipts, investments, tax filing, or notifications.

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Localhost-only | Pass | The feature uses local UI and browser storage. It adds no service endpoint or external connection. |
| II. Minimal scope | Pass | Reuse the current single-page app, dependencies, and test tools. Add feature-specific finance domain and UI modules without introducing a backend. |
| III. Accessible UI | Pass | Plan covers semantic in-app navigation, labelled forms, keyboard operation, announcements, visible focus, touch targets, and responsive verification. |
| IV. Privacy | Pass | Finance has a separate versioned local store and finance-only export/import. The UI and README disclose lack of encryption and automatic backup. |
| V. Verify behavior | Pass | Add domain, storage, component, migration, accessibility, and Playwright tests, then run available checks and local flows. |

No pre-design gate violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-personal-finance-dashboard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-interactions.md
├── checklists/
│   └── requirements.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── App.tsx                         # in-app Task Board / Personal Finance navigation
├── components/
│   ├── FinanceWorkspace.tsx         # finance view navigation and shared state/error feedback
│   ├── finance/
│   │   ├── Overview.tsx             # month totals, account balances, upcoming items
│   │   ├── Transactions.tsx          # search, filters, sorting, transaction dialogs
│   │   ├── TransactionDialog.tsx     # income, expense, refund, transfer and payment forms
│   │   ├── Accounts.tsx              # account management
│   │   ├── Budget.tsx                # monthly overall and category budgets
│   │   ├── Goals.tsx                 # goal management and allocations
│   │   ├── LoansDebt.tsx             # liabilities and debt payment flows
│   │   └── Reports.tsx               # reports, snapshots, backup controls
│   └── ui/                           # existing shared interface primitives
├── hooks/
│   └── useFinance.ts                 # finance state, domain actions and persistence feedback
└── lib/
    ├── finance.ts                    # finance types, validation, reducer and pure calculations
    └── finance-storage.ts             # separate versioned persistence and backup validation
tests/
├── unit/
│   ├── finance.test.ts                # validation, balances, cash flow and report calculations
│   ├── finance-storage.test.ts        # migration, corruption, persistence and backup validation
│   └── finance-*.test.tsx             # finance component and accessibility interactions
└── e2e/
    ├── finance-overview.spec.ts       # navigation, accounts, transactions and persistence
    ├── finance-planning.spec.ts       # budgets, recurring items and goals
    ├── finance-debt-reports.spec.ts   # debts, reports, snapshots, export and import
    └── finance-a11y.spec.ts           # keyboard, axe, mobile/desktop checks
```

**Structure Decision**: Continue the existing frontend-only project. Keep `Board` and its task storage separate; let `App` switch between the existing Board and a new finance workspace in the same page. Put pure finance rules in a domain module and persistence/backup validation in a dedicated module. Organize finance views under `components/finance/`, following the existing `components/`, `hooks/`, `lib/`, and `tests/` patterns.

## Constitution Check (Post-Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Localhost-only | Pass | No remote endpoint, bank integration, or network service is introduced. Finance remains usable from saved browser data without a connection. |
| II. Minimal scope | Pass | No new package or backend is required. Existing app shell, components, storage API, and test tools are sufficient. |
| III. Accessible UI | Pass | The UI contract defines same-tab navigation, labels, announcements, keyboard flows, focus, touch targets, and viewport checks. |
| IV. Privacy | Pass | The finance store uses an independent key and schema version; import/export is finance-only and explicit; disclosure is mandatory. |
| V. Verify behavior | Pass | Data model and quickstart specify validation for calculations, storage failure, migrations, backup, navigation, 1,000 transactions, accessibility, and local-only behavior. |

No post-design violations; no complexity exceptions.
