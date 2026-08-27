# Handoff Notes

Last updated: 2026-08-27.

## Current Production

- App: https://hsk4.holilihu.online/
- Fallback: https://hong-hsk4-studio.pages.dev/
- Cloudflare Pages project: `hong-hsk4-studio`
- Custom domain: `hsk4.holilihu.online`

## Current GitHub State

- Repo: `meiiie/hong_hsk`
- Default branch: `main`
- Baseline for the current Neko preparation work: `c01d793 Tune AI tutor fallback timeout (#25)`.
- Work must remain PR-based; do not push directly to `main`.
- `main` protection requires an up-to-date PR and the GitHub Actions check `Typecheck, build, and browser harness`; review conversations must be resolved, force-push and branch deletion are disabled.
- Required approvals are intentionally `0` for the current single-maintainer repository, and admin enforcement is off to preserve an emergency recovery path.
- Dependabot vulnerability alerts/security updates and GitHub secret scanning/push protection are enabled.

## Current Operational State

Cloudflare deploy secrets are configured and the production deploy workflow has succeeded. `CLOUDFLARE_API_TOKEN` still has its 2026-05-25 update timestamp after the exposure warning, so treat it as compromised and rotate it through an approved interactive flow before treating this as long-lived production infrastructure.

The current technology decision is recorded in [Technology Review](../architecture/technology-review-2026-05-26.md): keep the static Vite/TypeScript PWA, IndexedDB, Hanzi Writer, Cloudflare Pages, and Playwright harness for now. Revisit a backend only when sync/accounts or multi-user workflows become real.

The legacy NVIDIA tutor has been removed from the PWA, Pages Functions, tests, and documentation. Startup performs a narrow cleanup of the retired tutor-session localStorage key so old chat content does not remain on the learner's device. There is no AI runtime or tutor UI in the current application. Future AI work must start from [Neko Core HSK4 AI Product RFC](../architecture/neko-core-hsk4-ai-product-rfc-2026-08-27.md): a separate ACP host, exact read-only HSK tools, delayed-learning evaluation, durable-session design, and an explicit AGPL/commercial-license decision are required before implementation.

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
- Do not add a general backend/SQLite for ordinary PWA state. The future Neko pilot may add a narrowly scoped Worker/Durable Object/Container path only after its RFC gates are resolved.
- Do not use Cloudflare/GitHub secrets outside GitHub Secrets or approved interactive prompts.
- Version management now uses compile-time app metadata and `/version.json`; keep schema constants in `src/domain/app-version.ts` aligned with real data migrations.
