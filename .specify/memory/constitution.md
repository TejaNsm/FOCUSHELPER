<!--
Sync Impact Report
Version change: unratified scaffold -> 1.0.0
Modified principles: none; all five principles are established from the scaffold.
Added sections: Runtime & Privacy Constraints; Development & Quality Gates.
Removed sections: none.
Follow-up TODOs: none.
-->

# FocusHelper Constitution

## Core Principles

### I. Localhost-Only by Default
The application MUST run on the developer's machine and be reachable through
localhost. Development servers MUST bind to the loopback interface by default
and MUST NOT expose the application to a network unless the user explicitly
requests that behavior. Core functionality MUST NOT depend on a remote service.
This keeps setup simple and the project private by default.

### II. Focused, Minimal Scope
Each feature MUST directly support the project's stated purpose. Prefer the
smallest implementation and fewest dependencies that meet the requirement.
New frameworks, services, abstractions, or background processes MUST have a
clear, documented need. This keeps a simple local project understandable and
maintainable.

### III. Usable and Accessible Interface
Interactive features MUST work with keyboard input, use semantic interface
elements, and provide clear labels and feedback. Content and controls MUST
remain readable at common viewport sizes. Accessibility and responsive behavior
are part of feature completion, not optional polish.

### IV. Privacy and Safe Data Handling
The application MUST NOT send user data, telemetry, or analytics to external
services unless a feature explicitly requires it and the behavior is disclosed.
Secrets MUST NOT be committed to the project. Any local data storage MUST be
limited to what the feature needs, with its location and persistence behavior
made clear to users.

### V. Verify Behavior
New or changed behavior MUST have proportionate automated tests where practical.
Before considering a change complete, run relevant checks and verify the
application starts and the affected behavior works locally. Report checks that
could not be run instead of implying they passed.

## Runtime & Privacy Constraints

- The supported default environment is local development in a modern browser;
  no hosting provider or production deployment target is assumed.
- Setup and run instructions MUST identify required commands and prerequisites.
- External network access MUST be avoided unless an explicitly requested feature
  depends on it; such access and any data transmitted MUST be documented.
- Local persistence MUST NOT silently imply encryption, backup, or cross-device
  synchronization.

## Development & Quality Gates

- Preserve the existing project structure and toolchain where practical; avoid
  adding dependencies for functionality already available in the platform.
- Changes MUST pass the relevant available tests, linting, and type checks.
  If a check is unavailable or fails for an unrelated reason, record that
  limitation clearly.
- Feature acceptance MUST include a local startup check and a check of the
  affected user flow. Changes to keyboard interaction or layout MUST include
  corresponding accessibility or viewport verification.
- Documentation for setup or user-visible behavior MUST be updated when those
  instructions or behavior change.

## Governance

This constitution governs project specifications, implementation plans, and
code changes. Every feature proposal and review MUST check applicable principles
and constraints. A conflict MUST be resolved in favor of this constitution or
explicitly addressed by amending it before implementation.

Amendments MUST state their rationale and impact, be reviewed against existing
project behavior, and update this document. Use semantic versioning:

- **MAJOR** for removing or redefining a principle or making an incompatible
  governance change.
- **MINOR** for adding a principle or materially expanding governance.
- **PATCH** for clarifications and non-semantic wording corrections.

Reviews MUST verify relevant tests and quality gates, confirm localhost and
privacy defaults remain intact, and identify any new external dependencies or
network behavior. Work that cannot meet a constraint MUST document the reason
and obtain explicit approval before proceeding.

**Version**: 1.0.0 | **Ratified**: 2026-10-21 | **Last Amended**: 2026-10-21
