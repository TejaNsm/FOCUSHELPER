# Research: Task Board

## Drag and drop library
- **Decision**: `@dnd-kit` (core + sortable).
- **Rationale**: Built-in PointerSensor, TouchSensor and KeyboardSensor, plus live-region announcements and customizable screen reader instructions; headless, so it works with shadcn/Tailwind styling.
- **Alternatives**: `react-beautiful-dnd` (deprecated); `@hello-pangea/dnd` (good keyboard support but weaker touch/customization); native HTML5 DnD (no touch, poor keyboard/AT support).

## Input modes and accessibility
- **Decision**: Three sensors: PointerSensor (small distance activation so clicks still work), TouchSensor (≈200 ms press delay with tolerance so scrolling still works), KeyboardSensor (Space/Enter to lift, arrows to move, Space/Enter to drop, Esc to cancel). Plus a "Move to…" dropdown on each card as a non-drag alternative (WCAG 2.5.7 Dragging Movements).
- **Rationale**: Meets WCAG 2.2 AA: 2.1.1 keyboard, 2.5.7 dragging alternative, 2.5.8 target size (use ≥44 px), 4.1.3 status messages (announcements), 1.4.1 (overdue indicated by text + icon, not colour alone), 2.3.3/reduced motion via `prefers-reduced-motion`.
- **Alternatives**: Drag-only (fails WCAG 2.5.7).

## Persistence
- **Decision**: `localStorage`, key `focushelper.board.v1`, JSON `{version, tasks}`; validate on load and fall back to an empty board if corrupt.
- **Rationale**: Constitution requires local-only, minimal; no backend needed for single user.
- **Alternatives**: IndexedDB (overkill); local JSON file server (extra process).

## UI components
- **Decision**: shadcn/ui Button, Card, Dialog, AlertDialog, Input, Textarea, Label, DropdownMenu, Badge.
- **Rationale**: Radix-based; focus trapping, labelled dialogs and menu keyboard handling come built in.

## State management
- **Decision**: `useReducer` plus a persistence effect; no external state library.
- **Rationale**: Four actions (add, edit, remove, move); minimal scope.

## Dates
- **Decision**: Deadline stored as `YYYY-MM-DD` string via native date input; overdue when deadline is before today's local date.
- **Rationale**: No time zone ambiguity; no date library needed.

## Testing
- **Decision**: Vitest + RTL for reducer/storage/forms; Playwright for acceptance scenarios across mouse, keyboard and touch-emulated contexts; axe for automated a11y checks.
- **Rationale**: Constitution V requires verifying flows and accessibility.

## Tooling
- Vite config `server.host` and `preview.host` set to `127.0.0.1`.
