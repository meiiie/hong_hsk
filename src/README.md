# Source Architecture

Hong HSK4 Studio uses a DDD-lite / Clean Architecture layout. The goal is clear ownership without adding a heavy framework around a one-learner PWA.

## Layers

| Layer | Path | Owns |
| --- | --- | --- |
| Composition | `src/main.ts`, `src/app/` | App startup, app-level orchestration, event binding, and workflow view composition. |
| Domain | `src/domain/` | Pure HSK/review/exam concepts: vocab types, review policy, review queue, mock exam generation and scoring. |
| Application | `src/application/` | Use-case glue that combines domain rules with project data, such as initial state and vocabulary enrichment. |
| Infrastructure | `src/infrastructure/` | Browser and third-party adapters: IndexedDB, Excel import/export, Hanzi Writer. |
| Presentation | `src/presentation/` | UI-facing resources: CSS, icons, labels, and locale helpers. |
| Shared | `src/shared/` | Small dependency-free utilities used across layers. |

## Dependency Rule

Preferred dependency direction:

```txt
app -> application -> domain
app -> infrastructure -> application/domain
app -> presentation
application -> domain/shared
infrastructure -> domain/application/shared
presentation -> domain
domain -> shared only
```

Domain modules should not import infrastructure, browser storage, Hanzi Writer, or presentation code. When a future change needs sync/accounts/backend, add adapters under `infrastructure/` first and keep the domain model stable.

## App Layer Split

`src/app/hsk-app.ts` is now the stateful controller: it owns current view, study queue, mock exam session, event binding, persistence calls, and adapter orchestration.

Workflow rendering lives under `src/app/views/`:

- `app-shell-view.ts`: sidebar, topbar, language switcher, route title, and shared app chrome.
- `dashboard-view.ts`: daily overview, data readiness, queue preview.
- `study-view.ts`: recall card, answer feedback, stroke lab shell, per-card review detail.
- `lesson-views.ts`: lesson browser and wrong-word table.
- `mock-exam-view.ts`: exam intro, runner, question rendering, result rendering.
- `plan-view.ts`: 30-day plan and schedule settings.
- `data-view.ts`: import/export panels and data-health report.
- `view-helpers.ts`: small HTML helpers shared by the view modules.

This split keeps render functions mostly pure while the controller keeps side effects in one place.

## Test Boundaries

- Unit tests under `tests/unit/` cover pure domain behavior: spaced-review policy, answer matching, queue ordering, and mock-exam generation/scoring.
- Browser harness tests under `tests/` cover full user workflows: study, reveal/hide answer, stroke practice, data loading, mobile layout, and mock exam.
- When adding business rules, prefer a unit test in `tests/unit/` before relying on the browser harness.

## Current Intentional Compromise

`src/app/hsk-app.ts` still contains event binding and command handlers in one class. That is intentional for now: app shell rendering, workflow views, and core domain behavior have been separated first. The next low-risk split is extracting event binding/commands once those interactions have more browser-level coverage.
