# Source Architecture

Hong HSK4 Studio uses a DDD-lite / Clean Architecture layout. The goal is clear ownership without adding a heavy framework around a one-learner PWA.

## Layers

| Layer | Path | Owns |
| --- | --- | --- |
| Composition | `src/main.ts`, `src/app/` | App startup, app-level orchestration, event binding, and workflow view composition. |
| Domain | `src/domain/` | Pure HSK/review/exam concepts: vocab types, review policy, review queue, mock exam generation and scoring. |
| Application | `src/application/` | Use cases and ports that combine domain rules with project data, such as initial state, answer submission, vocabulary replacement, and adapter contracts. |
| Infrastructure | `src/infrastructure/` | Browser and third-party adapters: IndexedDB, Excel import/export, Hanzi Writer. |
| Presentation | `src/presentation/` | UI-facing resources: CSS, icons, labels, locale helpers, and scoped motion helpers. |
| Shared | `src/shared/` | Small dependency-free utilities used across layers. |

## Dependency Rule

Preferred dependency direction:

```txt
app -> application -> domain
app -> presentation
application -> domain/shared
infrastructure -> domain/application/shared
presentation -> domain
domain -> shared only
```

Domain modules should not import infrastructure, browser storage, Hanzi Writer, or presentation code. App modules should not import infrastructure directly; `src/main.ts` is the composition root that injects infrastructure through application ports. When a future change needs sync/accounts/backend, add adapters under `infrastructure/` first and keep the domain model stable.

## Ports And Adapters

Ports live in `src/application/ports/`:

- `AppStateStore`: load/save/reset local learning state.
- `VocabularyImporter`: import uploaded vocab and load the bundled 4A/4B reference.
- `StudyDataExporter`: export backup/template files.
- `ChineseSpeechPlayer`: play Mandarin audio through a browser adapter.

`src/main.ts` wires those ports to browser adapters in `src/infrastructure/`. This keeps the app controller testable and prevents accidental direct coupling to IndexedDB, Excel libraries, or speech synthesis.

## App Layer Split

`src/app/hsk-app.ts` is now the stateful controller: it owns current view, render orchestration, persistence calls, and adapter coordination.

App workflow code is split by responsibility:

- `events/app-event-binder.ts`: DOM event binding only; it translates data attributes into typed handlers.
- `workflows/study-workflow.ts`: transient study queue, current card, answer feedback, and stroke-character selection.
- `workflows/mock-exam-workflow.ts`: selected mock set, active exam session, question index, answer storage, submit/reset, and clock state.
- `workflows/settings-workflow.ts`: settings form normalization and bounds.
- `workflows/stroke-practice-workflow.ts`: Hanzi Writer mounting and stroke actions after render.

Workflow rendering lives under `src/app/views/`:

- `app-shell-view.ts`: sidebar, topbar, language switcher, route title, and shared app chrome.
- `dashboard-view.ts`: daily overview, data readiness, queue preview.
- `study-view.ts`: recall card, answer feedback, stroke lab shell, per-card review detail.
- `lesson-views.ts`: lesson browser and wrong-word table.
- `mock-exam-view.ts`: exam intro, runner, question rendering, result rendering.
- `plan-view.ts`: 30-day plan and schedule settings.
- `data-view.ts`: import/export panels and data-health report.
- `view-helpers.ts`: small HTML helpers shared by the view modules.
- `src/presentation/motion/`: lazy-loaded Anime.js micro-interaction helpers called after render through `data-motion` hooks. Layout transitions stay in CSS.

This split keeps render functions mostly pure while the controller keeps side effects in one place.

## Test Boundaries

- Unit tests under `tests/unit/` cover pure domain behavior: spaced-review policy, answer matching, queue ordering, and mock-exam generation/scoring.
- Application use-case tests cover answer submission and vocabulary replacement.
- Browser harness tests under `tests/` cover full user workflows: study, reveal/hide answer, stroke practice, data loading, mobile layout, and mock exam.
- When adding business rules, prefer a unit test in `tests/unit/` before relying on the browser harness.

## Current Intentional Compromise

`src/app/hsk-app.ts` still contains the command handlers that mutate app state and call persistence/export adapters. That is intentional for now: keeping commands near `render()` makes the no-framework PWA easier to trace. If commands grow again, split them into workflow-specific command modules after adding browser coverage for the affected interactions.
