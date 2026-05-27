# Handoff Notes

Last updated: 2026-05-27.

## Current Production

- App: https://hsk4.holilihu.online/
- Fallback: https://hong-hsk4-studio.pages.dev/
- Cloudflare Pages project: `hong-hsk4-studio`
- Custom domain: `hsk4.holilihu.online`

## Current GitHub State

- Repo: `meiiie/hong_hsk`
- Default branch: `main`
- Main history includes production commit `01fa604 Polish HSK4 learning UX and modular app`.
- Known teammate/main commits preserved:
  - `a4f8291 Use Excel HSK4 meanings`
  - `cd0a746 Improve Cloudflare deploy workflow`
  - `6cabd5b Automate Pages deploy after CI`
  - `bab8d5b Add lesson listening practice`

## Current Operational State

Cloudflare deploy secrets are configured and the production deploy workflow has succeeded. The API token used during setup was exposed in chat, so rotate it before treating this as long-lived production infrastructure.

The current technology decision is recorded in [Technology Review](../architecture/technology-review-2026-05-26.md): keep the static Vite/TypeScript PWA, IndexedDB, Hanzi Writer, Cloudflare Pages, and Playwright harness for now. Revisit a backend only when sync/accounts or multi-user workflows become real.

## Preferred Next Workflow

All future changes should be PR-based:

```bash
git fetch origin --prune
git checkout main
git pull --ff-only origin main
git checkout -b codex/<task>
npm test
git push -u origin codex/<task>
gh pr create --draft --base main --head codex/<task>
```

## Things To Watch

- HSK data count currently documented as `621`; tests and target copy should stay aligned.
- Keep the 2026-05-26 technology review aligned with major stack, storage, HSK data, exam, or deploy decisions.
- Do not claim mock exams are official HSK papers.
- Do not reveal stroke-practice answers during recall by default.
- Do not add backend/SQLite unless multi-device sync becomes an explicit requirement.
- Do not use Cloudflare/GitHub secrets outside GitHub Secrets or approved interactive prompts.
- Version management now uses compile-time app metadata and `/version.json`; keep schema constants in `src/domain/app-version.ts` aligned with real data migrations.
