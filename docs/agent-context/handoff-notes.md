# Handoff Notes

Last updated: 2026-08-28.

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

Cloudflare deploy secrets are configured and the production deploy workflow has succeeded. `CLOUDFLARE_API_TOKEN` still has its 2026-05-25 update timestamp after the exposure warning, so treat it as compromised and rotate it through an approved interactive flow before treating this as long-lived production infrastructure. It is a Pages deployment credential, not an AI credential; deleting it now would stop future automatic deploys. At the user's explicit request, the retired `NVIDIA_API_KEY` was permanently deleted from Pages Production on 2026-08-27; its secret list is now empty, and the Preview environment was inspected and was already empty. Until the cleanup PR deploys, the old production AI endpoint can return its missing-key `503` response.

The current technology decision is recorded in [Technology Review](../architecture/technology-review-2026-05-26.md): keep the static Vite/TypeScript PWA, IndexedDB, Hanzi Writer, Cloudflare Pages, and Playwright harness for now. Revisit a backend only when sync/accounts or multi-user workflows become real.

The legacy NVIDIA tutor has been removed from the PWA, Pages Functions, tests, and documentation. Startup performs a narrow cleanup of the retired tutor-session localStorage key so old chat content does not remain on the learner's device.

A stacked local-only branch, `codex/neko-local-pilot`, adds a post-answer Neko UX pilot without changing the cleanup PR. Vite launches the owner's installed ordinary `neko acp` on demand; same-origin loopback routes pass bounded card/attempt context and stop/close commands into an ACP session running in `plan` mode, low effort, one stable empty workspace, no configured MCP, no outside reads, and no extra verification loop. The locked Neko card is visible during recall, while questions appear only after check/reveal. Production builds omit the tutor dependency and Vite middleware, so this branch is for local product evaluation, not deployment.

The stacked branch `codex/bidirectional-ui-polish` adds the learner-requested Trung → Việt recognition mode and a full visual polish pass on top of the local pilot. Việt → Trung writing recall remains the default; each direction has its own SRS map, attempt direction, wrong/due queue, and per-word review detail. App data schema 2 migrates old attempts to Việt → Trung and initializes recognition progress without touching the IndexedDB object-store version. Vietnamese checking is accent/case/punctuation insensitive and accepts complete comma-separated glossary variants. Dashboard/lesson/wrong views follow the selected direction, Excel backups include `Recognition_State`, and Neko receives the direction plus the answer contract. Be Vietnam Pro is bundled under OFL for offline Latin/Vietnamese UI text; CJK content keeps the dedicated Han font stack.

The same branch now uses app data schema 4 for a transparent `Đổi chiều mỗi phiên` setting. The first session keeps the selected direction; every later re-entry into Học tập uses the opposite of the persisted last-session direction, even when no answer was submitted. It never changes direction during a live session or merely because the queue changes. A manual direction choice becomes the current session direction, and the next session alternates from it. The learner can disable alternation. The visual pass removes decorative elevation, inset highlights, and non-functional gradients while preserving the sidebar's soft hover/active surfaces; the red active rail is intentionally omitted because it made the selected item look raised. The desktop sidebar label is now the unambiguous `Luyện thi`.

The branch also upgrades the developer-local Neko surface to a continuous conversation. One ACP session ID is reused across cards and page reloads; the browser stores at most 40 recent exchanges for display while Neko remains the full durable-session authority. The learner can stop a pending answer, retry, turn AI off/on without affecting study, export JSON, or clear with a two-step confirmation. Clear forgets the browser transcript and calls ACP `session/close`; it does not claim to delete Neko's durable file because ACP v1 has no delete call. Mock desktop/mobile coverage passes for two turns and all controls. A real first turn against installed Neko `v1.2.1` passed; a later two-turn run was correctly reported as failed when the configured Grok provider returned HTTP 429 independently of Hồng HSK4. Re-run `npm run test:neko-local` after the provider throttle clears; do not weaken the two-turn assertion.

The future networked one-learner pilot still requires an official pinned Neko Core binary on one trusted computer, local Neko durable sessions, Cloudflare Tunnel/Access, a minimal browser-to-ACP bridge, the `hsk4-studio` authority profile with exact read-only HSK tools, and delayed-learning evaluation. See [Neko Core HSK4 AI Product RFC](../architecture/neko-core-hsk4-ai-product-rfc-2026-08-27.md) and [single-learner host runbook](../deployment/neko-single-learner-host.md).

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
- Do not add a general backend/SQLite for ordinary PWA state. The one-learner Neko pilot uses the trusted computer's local Neko sessions and does not need Worker/Durable Object/Container infrastructure.
- Do not reimplement Neko's agent loop in this repo. Product-specific work is limited to the HSK profile upstream, the browser-to-ACP bridge, verified HSK tools, tutor schema, and UI.
- Keep the ordinary-ACP tutor path developer-local. A networked pilot must replace that exception with the reviewed `hsk4-studio` host profile and packaged bridge.
- Do not use Cloudflare/GitHub secrets outside GitHub Secrets or approved interactive prompts.
- Version management now uses compile-time app metadata and `/version.json`; keep schema constants in `src/domain/app-version.ts` aligned with real data migrations.
- Keep writing and recognition review maps separate. A recognition answer must never advance the Việt → Trung writing schedule.
- Keep automatic direction alternation at the Học tập entry boundary. Do not turn it into per-card randomization or a change during queue switches/re-renders.
