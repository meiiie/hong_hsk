# Project Map

Hồng HSK4 Studio is a static PWA built with Vite and TypeScript. It is optimized for one learner on mobile, with browser-local storage and Cloudflare Pages deploy.

## Top-Level Files

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Canonical agent/human operating rules. |
| `CLAUDE.md` | Thin pointer for Claude Code users back to `AGENTS.md`. |
| `README.md` | Public-facing project overview. |
| `package.json` | Scripts, dependencies, and project metadata. |
| `wrangler.jsonc` | Cloudflare Pages/Wrangler config. |
| `public/_headers` | Cloudflare Pages security headers. |
| `docs/agent-context/` | Shared agent memory, harness, rules, and deploy notes. |

## Source Modules

| Module | Responsibility |
| --- | --- |
| `src/main.ts` | App shell, views, UI state, event wiring. |
| `src/styles.css` | Mobile-first UI, design tokens, layout, states. |
| `src/types.ts` | Domain types for vocab, review, attempts, settings. |
| `src/seed.ts` | Lesson names and seed data fallback. |
| `src/hsk4-excel-vocab.ts` | Imported/curated HSK4 Excel vocabulary source. |
| `src/hsk4-targets.ts` | Target counts for HSK4 data quality messaging. |
| `src/hsk4-vi-glossary.ts` | Vietnamese glossary fallback/enrichment. |
| `src/data-enrichment.ts` | Vietnamese meaning quality and draft detection. |
| `src/import-export.ts` | Excel/CSV/JSON import and export. |
| `src/storage.ts` | IndexedDB/local persistence. |
| `src/review-policy.ts` | SRS constants and recall quality calculation. |
| `src/review.ts` | Review queue, answer checking, attempts, stats. |
| `src/hanzi-trainer.ts` | Hanzi Writer integration for stroke practice. |
| `src/mock-exam.ts` | HSK4 mock exam generation and scoring. |
| `src/i18n.ts` | Vietnamese/English UI labels. |
| `src/icons.ts` | Lucide icon wrappers. |

## Test And Harness Files

| Path | Purpose |
| --- | --- |
| `scripts/run_harness.mjs` | Starts/reuses Vite dev server and runs browser checks. |
| `scripts/check_agent_context.mjs` | Validates the agent context map and key workflow assumptions. |
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
