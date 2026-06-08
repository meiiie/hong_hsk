# Project Map

Hồng HSK4 Studio is a static PWA built with Vite and TypeScript. It is optimized for one learner on mobile, with browser-local storage and Cloudflare Pages deploy.

## Top-Level Files

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Canonical agent/human operating rules. |
| `CLAUDE.md` | Thin pointer for Claude Code users back to `AGENTS.md`. |
| `README.md` | Public-facing project overview. |
| `package.json` | Scripts, dependencies, and project metadata. |
| `vite.config.ts` | Vite build config, compile-time app metadata, and generated `version.json`. |
| `wrangler.jsonc` | Cloudflare Pages/Wrangler config. |
| `public/_headers` | Cloudflare Pages security headers. |
| `public/sw.js` | PWA service worker and cache/update behavior. |
| `functions/api/ai/tutor.js` | Cloudflare Pages Function that proxies AI tutor requests to NVIDIA with server-side secrets. |
| `docs/agent-context/` | Shared agent memory, harness, rules, and deploy notes. |
| `docs/architecture/technology-review-2026-05-26.md` | Researched technology decision record and comparable project notes. |
| `src/README.md` | Source-layer dependency map and DDD-lite boundaries. |

## Source Modules

| Module | Responsibility |
| --- | --- |
| `src/main.ts` | Thin composition entrypoint. |
| `src/app/hsk-app.ts` | Stateful app controller for render orchestration, command handlers, persistence calls, and adapter coordination. |
| `src/app/app-dependencies.ts` | App dependency contract for injected ports/adapters. |
| `src/app/app-types.ts` | App-only view/data-health/feedback types. |
| `src/app/events/app-event-binder.ts` | DOM event binding layer that maps data attributes to typed app handlers. |
| `src/app/service-worker.ts` | Service worker registration. |
| `src/app/workflows/study-workflow.ts` | Transient study session state: queue, current card, answer feedback, stroke selection. |
| `src/app/workflows/mock-exam-workflow.ts` | Mock exam session state: selected set, active paper, question index, answers, timing. |
| `src/app/workflows/settings-workflow.ts` | Applies typed settings changes from form controls. |
| `src/app/workflows/stroke-practice-workflow.ts` | Coordinates Hanzi Writer mounting and stroke actions after render. |
| `src/app/workflows/ai-tutor-workflow.ts` | Per-card AI tutor state and compact request building. |
| `src/app/webmcp/hsk-webmcp.ts` | Progressive WebMCP tool registration for model-context-aware browsers/agents. |
| `src/app/views/app-shell-view.ts` | Sidebar, topbar, language switcher, and route title shell rendering. |
| `src/app/views/dashboard-view.ts` | Daily overview, data readiness, and queue preview rendering. |
| `src/app/views/study-view.ts` | Study card, answer feedback, stroke lab shell, and review detail rendering. |
| `src/app/views/lesson-views.ts` | Lesson browser and wrong-word rendering. |
| `src/app/views/mock-exam-view.ts` | Mock exam intro, runner, question, and result rendering. |
| `src/app/views/plan-view.ts` | 30-day plan rendering. |
| `src/app/views/data-view.ts` | Import/export and data-health rendering. |
| `src/app/views/view-helpers.ts` | Shared HTML/view helpers for app views. |
| `src/domain/types.ts` | Domain types for vocab, review, attempts, settings. |
| `src/domain/app-version.ts` | App/build version metadata, schema constants, and version comparison helpers. |
| `src/domain/locale.ts` | Locale normalization shared by UI and persistence. |
| `src/domain/hsk4/hsk4-excel-vocab.ts` | Imported/curated HSK4 Excel vocabulary source. |
| `src/domain/hsk4/hsk4-vi-glossary.ts` | Vietnamese glossary fallback/enrichment. |
| `src/domain/review/review-policy.ts` | SRS constants and recall quality calculation. |
| `src/domain/review/review-service.ts` | Review queue, answer checking, attempts, stats. |
| `src/domain/exam/mock-exam.ts` | HSK4 mock exam generation and scoring. |
| `src/domain/hsk4/hsk4-targets.ts` | Target counts for HSK4 data quality messaging. |
| `src/application/bootstrap/initial-state.ts` | Lesson names and initial app state. |
| `src/application/ports/*.ts` | Clean architecture ports for state storage, import/export, speech playback, and version checks. |
| `src/application/ports/ai-tutor-client.ts` | Port for AI tutor explanations, examples, mistake repair, and learner questions. |
| `src/application/vocab/data-enrichment.ts` | Vietnamese meaning quality and draft detection. |
| `src/application/vocab/item-collection.ts` | Collection helpers for replacing starter/reference vocabulary safely. |
| `src/application/vocab/replace-vocabulary.ts` | Use case for replacing starter/reference vocabulary with imported data. |
| `src/application/review/submit-study-answer.ts` | Use case for trimming, checking, logging, and scheduling one typed answer. |
| `src/infrastructure/storage/indexeddb-state-store.ts` | IndexedDB/local persistence. |
| `src/infrastructure/import-export/workbook-io.ts` | Excel/CSV/JSON import and export. |
| `src/infrastructure/hanzi/hanzi-stroke-trainer.ts` | Hanzi Writer integration for stroke practice. |
| `src/infrastructure/speech/chinese-speech.ts` | Browser speech synthesis adapter for Chinese playback. |
| `src/infrastructure/version/http-version-checker.ts` | Fetches `/version.json` to detect deployed app updates. |
| `src/infrastructure/ai/hsk-ai-client.ts` | Browser-side adapter that calls the same-origin AI tutor gateway. |
| `src/presentation/styles.css` | Mobile-first UI, design tokens, layout, states. |
| `src/presentation/i18n.ts` | Vietnamese/English UI labels. |
| `src/presentation/icons.ts` | Lucide icon wrappers. |
| `src/shared/date-utils.ts` | Date-key and review-plan date helpers. |
| `src/shared/number-utils.ts` | Dependency-free numeric helpers. |

## Test And Harness Files

| Path | Purpose |
| --- | --- |
| `scripts/run_harness.mjs` | Starts/reuses Vite dev server and runs browser checks. |
| `scripts/check_agent_context.mjs` | Validates the agent context map and key workflow assumptions. |
| `scripts/check_architecture.mjs` | Enforces DDD-lite source-layer dependency rules. |
| `tests/unit/*.test.ts` | Vitest unit coverage for review policy/service and mock exam domain behavior. |
| `tests/unit/ai-tutor-workflow.test.ts` | Unit coverage for per-card AI tutor state and request context. |
| `tests/unit/factories.ts` | Typed factories for deterministic unit tests. |
| `tests/verify_hsk_pwa.py` | Desktop learning flow, answer reveal/hide, stroke trainer, wrong-list check. |
| `tests/verify_hsk_mobile_mock.py` | Data load, mock exam, and mobile viewport checks. |
| `tests/requirements.txt` | Python browser-test dependency pin range. |

## Deployment Files

| Path | Purpose |
| --- | --- |
| `.github/workflows/ci.yml` | PR/main CI: context check, typecheck, build, Playwright harness, audit. |
| `.github/workflows/deploy-cloudflare-pages.yml` | Runs after successful CI on `main`; deploys if Cloudflare secrets exist. |
| `Dockerfile`, `docker-compose.yml`, `nginx.conf` | Optional static hosting fallback. |
| `docs/deployment/README.md` | Human deployment runbook. |

## Data Policy

- Treat `621` current course items as a curated project data count, not a universal HSK4 truth.
- Treat `1,200` words as the old HSK4 cumulative target.
- Distinguish verified Vietnamese meanings from draft/enriched meanings.
- Do not copy long copyrighted textbook passages or official exam/audio content into the repo.

## UX Priorities

1. Mobile-first study flow.
2. One primary action per screen.
3. Stroke practice must not reveal the answer during recall unless the learner explicitly asks.
4. Mock exam should train format and timing, while clearly stating it is simulated content.
5. UI text defaults to Vietnamese.
