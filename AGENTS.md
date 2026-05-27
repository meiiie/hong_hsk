# AGENTS.md

This is the shared operating guide for AI agents and human contributors working on Hồng HSK4 Studio.

Read this file first, then use the linked context files only when relevant. Keep this root file lean: it is for critical rules and pointers, not long explanations.

## Project Snapshot

- Product: Hồng HSK4 Studio, a mobile-first Vietnamese PWA for HSK4 4A/4B review.
- Production: https://hsk4.holilihu.online/
- Repository: https://github.com/meiiie/hong_hsk
- Runtime: static Vite/TypeScript PWA, deployed to Cloudflare Pages.
- User data: IndexedDB in the learner's browser; no backend database yet.

## First Context To Read

- [Agent Context Index](docs/agent-context/README.md)
- [Collaboration Rules](docs/agent-context/collaboration-rules.md)
- [Project Map](docs/agent-context/project-map.md)
- [Technology Review](docs/architecture/technology-review-2026-05-26.md)
- [Harness](docs/agent-context/harness.md)
- [Cloudflare Final Step](docs/agent-context/cloudflare-final-step.md)
- [Current Handoff Notes](docs/agent-context/handoff-notes.md)

## Non-Negotiable Collaboration Rules

1. Do not push directly to `main` unless the user explicitly says to do so for this exact change.
2. Before editing, run `git fetch origin --prune` and base work on the latest `origin/main`.
3. Use a feature branch named like `codex/<short-task>` and open a PR.
4. Never force-push, reset, or rewrite shared history without explicit approval.
5. If remote `main` moves while working, rebase or merge carefully and preserve teammate commits.
6. Do not close teammate PRs. Dependabot PRs may be closed only after the same change is already validated on `main`.
7. Do not extract Cloudflare/GitHub tokens from browser sessions, logs, local config, or screenshots. Ask the user to create or provide scoped secrets through approved UI/CLI flows.
8. Treat HSK data as learning content: source, status, and review quality matter. Do not present draft translations as final verified data.

## Standard Local Commands

```bash
npm ci
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm test
```

Useful targeted commands:

```bash
npm run context:check
npm run architecture:check
npm run check
npm run build
npm run test:harness
```

## Safe Git Flow

```bash
git fetch origin --prune
git checkout main
git pull --ff-only origin main
git checkout -b codex/<short-task>
npm test
git push -u origin codex/<short-task>
gh pr create --draft --base main --head codex/<short-task>
```

## PR Expectations

Every PR should state:

- What changed.
- Why it changed.
- Which user learning workflow is affected.
- Which checks were run.
- Whether Cloudflare deploy, data quality, or mobile UX need special review.

## Context Maintenance

When a change alters architecture, workflows, data policy, CI/CD, deployment, or major UX assumptions, update the matching file under `docs/agent-context/` in the same PR. Run `npm run context:check` before pushing.
