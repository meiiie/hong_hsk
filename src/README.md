# Source Architecture

Hong HSK4 Studio uses a DDD-lite / Clean Architecture layout. The goal is clear ownership without adding a heavy framework around a one-learner PWA.

## Layers

| Layer | Path | Owns |
| --- | --- | --- |
| Composition | `src/main.ts`, `src/app/` | App startup, app-level orchestration, and the current view controller. |
| Domain | `src/domain/` | Pure HSK/review/exam concepts: vocab types, review policy, review queue, mock exam generation and scoring. |
| Application | `src/application/` | Use-case glue that combines domain rules with project data, such as initial state and vocabulary enrichment. |
| Infrastructure | `src/infrastructure/` | Browser and third-party adapters: IndexedDB, Excel import/export, Hanzi Writer, bundled HSK4 data files. |
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

## Current Intentional Compromise

`src/app/hsk-app.ts` still contains a large view controller. That is intentional for this refactor: the first step is stable boundaries and import paths. Split this file later by workflow (`study`, `lessons`, `wrong-words`, `mock-exam`, `data`) after behavior tests are stronger.
