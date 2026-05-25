# Handoff Notes

Last updated: 2026-05-25.

## Current Production

- App: https://hsk4.holilihu.online/
- Fallback: https://hong-hsk4-studio.pages.dev/
- Cloudflare Pages project: `hong-hsk4-studio`
- Custom domain: `hsk4.holilihu.online`

## Current GitHub State

- Repo: `meiiie/hong_hsk`
- Default branch: `main`
- Main history is linear as of commit `6cabd5b`.
- Known teammate/main commits preserved:
  - `a4f8291 Use Excel HSK4 meanings`
  - `cd0a746 Improve Cloudflare deploy workflow`
  - `6cabd5b Automate Pages deploy after CI`

## Open Operational Item

Add `CLOUDFLARE_API_TOKEN` to GitHub Secrets.

Until this exists, the deploy workflow will trigger after CI but skip the build/deploy steps.

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
- Do not claim mock exams are official HSK papers.
- Do not reveal stroke-practice answers during recall by default.
- Do not add backend/SQLite unless multi-device sync becomes an explicit requirement.
- Do not use Cloudflare/GitHub secrets outside GitHub Secrets or approved interactive prompts.
