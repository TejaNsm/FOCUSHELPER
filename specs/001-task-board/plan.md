# Implementation Plan: Task Board

**Branch**: `001-task-board` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-task-board/spec.md`

## Summary

A localhost-only, single-page Kanban board with three fixed columns (Tasks, Meetings, Backburner). Users add, edit, remove and move tasks (title, optional deadline, optional description). Built with Vite + React + TypeScript, Tailwind CSS and shadcn/ui. Drag and drop uses `@dnd-kit` with pointer, touch and keyboard sensors; a "Move to…" menu is an additional non-drag path. Data persists in browser `localStorage`; there is no backend.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+, Node.js 20+ for tooling

**Primary Dependencies**: Vite, Tailwind CSS, shadcn/ui (Radix primitives), `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react`

**Storage**: Browser `localStorage` (versioned key `focushelper.board.v1`)

**Testing**: Vitest + React Testing Library (unit/component); Playwright + `@axe-core/playwright` (acceptance, keyboard, touch emulation, accessibility)

**Target Platform**: Modern desktop and touch browsers; Vite dev/preview server bound to `127.0.0.1`

**Project Type**: Single-page web application (frontend only)

**Performance Goals**: Actions reflected instantly (<100 ms perceived) with 100 tasks

**Constraints**: Offline-capable, no network calls, no telemetry; WCAG 2.2 AA; minimum 44×44 px touch targets

**Scale/Scope**: One user, ~100 tasks, one screen plus two dialogs

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Localhost-only | Pass | Dev and preview servers set `host: '127.0.0.1'`; no remote services. |
| II. Minimal scope | Pass | Each dependency has a need: Vite/React/Tailwind/shadcn requested by user; dnd-kit for accessible DnD; no state library, router or backend. |
| III. Accessible UI | Pass | Keyboard, touch and mouse paths, semantic elements, labels, announcements (see research.md). |
| IV. Privacy | Pass | Data stays in `localStorage`; README discloses location and that it is unencrypted, not backed up or synced. |
| V. Verify behavior | Pass | Unit tests, Playwright acceptance tests, axe checks, startup check in quickstart.md. |

Post-design re-check: still passing; no violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-board/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-interactions.md
├── checklists/requirements.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html
package.json
vite.config.ts           # host 127.0.0.1
components.json          # shadcn config
src/
├── main.tsx
├── App.tsx
├── index.css            # Tailwind + theme tokens
├── lib/
│   ├── utils.ts         # shadcn cn()
│   ├── board.ts         # types, reducer, date helpers
│   └── storage.ts       # load/save with validation
├── hooks/
│   └── useBoard.ts
└── components/
    ├── ui/              # shadcn generated components
    ├── Board.tsx        # DndContext, sensors, announcements
    ├── Column.tsx
    ├── TaskCard.tsx
    ├── TaskDialog.tsx   # add/edit form
    └── DeleteDialog.tsx
tests/
├── unit/                # Vitest
└── e2e/                 # Playwright
```

**Structure Decision**: Single frontend project at repository root; no backend because persistence is local and the constitution favours minimal scope.

## Complexity Tracking

No violations.
