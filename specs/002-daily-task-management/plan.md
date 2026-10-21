# Implementation Plan: Daily Task Management

**Branch**: `main` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-daily-task-management/spec.md`

## Summary

Extend the existing three-column FocusHelper board with search, composable filters, priority and labels, completion and recoverable archiving, sortable task views, dedicated Due today and Upcoming views, and persistent custom ordering within each column. Keep the existing local-first React/TypeScript application and its browser storage; extend its task model and migrate existing saved tasks without losing their details or created-date ordering. Build upon the existing accessible task controls and drag sensors, adding keyboard-, mouse-, and touch-accessible within-column sorting without changing the fixed columns.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Node.js 20+ for tooling

**Primary Dependencies**: Vite 8, React, Tailwind CSS 4, Radix UI, `@dnd-kit/core` 6, `@dnd-kit/sortable` 10, Vitest 5, React Testing Library, Playwright

**Storage**: Browser `localStorage`, existing key `focushelper.board.v1`; extend the stored document with a schema version and migrate existing version-1 tasks with safe defaults.

**Testing**: Vitest + React Testing Library for domain, storage, and component behavior; Playwright for user flows, keyboard/touch interactions, and accessibility.

**Target Platform**: Modern desktop and touch browsers; Vite development and preview servers bound to `127.0.0.1`.

**Project Type**: Single-page web application (frontend only).

**Performance Goals**: Search, filters, sorting, and updates remain responsive for up to 500 tasks; filtered results appear within one second.

**Constraints**: Offline-capable, no remote services or telemetry; preserve localhost-only and local privacy defaults; keep all new interactions keyboard accessible and responsive; avoid new dependencies where existing packages suffice.

**Scale/Scope**: One local user, existing three-column board, up to 500 tasks; no accounts, sharing, sync, notifications, or recurring tasks.

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Localhost-only | Pass | Feature remains client-side and local; no server exposure or external service is needed. |
| II. Minimal scope | Pass | Reuse React, existing board state/storage, and installed dnd-kit packages; no new framework, backend, or dependency is needed. |
| III. Accessible UI | Pass | Search and filter controls will be labelled; sorting, completion, archive, restoration, and reordering will support keyboard interaction and clear feedback; preserve responsive three-column board behavior. |
| IV. Privacy | Pass | Task data stays in the existing browser-local storage; disclose storage and its limitations without adding telemetry or network calls. |
| V. Verify behavior | Pass | Add unit/component coverage for task transformations, filters, sorting, migration, and UI actions; extend Playwright keyboard, touch, and accessibility flows and validate local startup. |

No pre-design gate violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-daily-task-management/
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
├── App.tsx
├── components/
│   ├── Board.tsx            # board views, search/filter/sort state, shared actions
│   ├── Column.tsx           # filtered/sorted column and sortable task list
│   ├── TaskCard.tsx         # priority, labels, completion and archive controls
│   ├── TaskDialog.tsx       # add/edit task details, priority and labels
│   └── ui/                  # existing shared interface primitives
├── hooks/
│   └── useBoard.ts          # task actions, completion/archive/reorder, persistence status
└── lib/
    ├── board.ts             # task types, reducer, selectors, filter/sort/date helpers
    └── storage.ts           # document validation, v1 migration, persistence
tests/
├── unit/
│   ├── board.test.ts
│   ├── storage.test.ts
│   └── *.test.tsx            # new focused interaction/component coverage
└── e2e/
    ├── a11y.spec.ts
    ├── move-touch.spec.ts
    └── *.spec.ts             # new search, filter, archive, sort and reorder flows
```

**Structure Decision**: Continue the existing single frontend project. Extend the board domain functions and `useBoard` state in place; keep presentation changes within the existing board, column, and task components, adding a focused component only if implementation requires it. Preserve existing test organization and cover the new flows at unit/component and browser levels.

## Constitution Check (Post-Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Localhost-only | Pass | The design introduces no network interfaces or services. |
| II. Minimal scope | Pass | Existing dependencies and project structure are sufficient. |
| III. Accessible UI | Pass | The interaction contract specifies keyboard-operable controls, status announcements, touch targets, and responsive views. |
| IV. Privacy | Pass | Existing local storage remains the only persistence; migration is local and no sync or telemetry is introduced. |
| V. Verify behavior | Pass | Quickstart defines automated and manual checks for acceptance, migration, keyboard/touch, responsive behavior, and local-only operation. |

No post-design violations; no complexity exceptions.
