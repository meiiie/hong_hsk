# Collaboration Rules

This repository may be edited by multiple people using the same GitHub identity. The workflow must therefore protect teammate work even when GitHub does not show a different username.

## Default Rule

All work happens through a branch and PR.

Do not push directly to `main` unless the user explicitly requests direct main changes for that exact task.

## Before Editing

```bash
git fetch origin --prune
git checkout main
git pull --ff-only origin main
git status -sb
git log --oneline --decorate -8
git checkout -b codex/<short-task>
```

If there are local changes you did not make, stop and inspect them. Do not stash, reset, delete, or overwrite them unless the user explicitly approves.

## While Editing

- Keep changes scoped to the task.
- Avoid unrelated formatting churn.
- Preserve existing product/data decisions unless the task is to change them.
- Update docs and tests when behavior changes.
- Use `rg` for search and read nearby code before editing.

## Before Pushing

```bash
npm test
git fetch origin --prune
git status -sb
```

If `origin/main` moved:

```bash
git rebase origin/main
npm test
```

Resolve conflicts by preserving teammate intent first. If the conflict changes product behavior, mention it clearly in the PR body.

## PR Checklist

Open a draft PR first unless the user asks for ready-to-review.

The PR body should include:

- Scope of changes.
- User impact.
- Files or workflows affected.
- Verification commands.
- Cloudflare/deploy impact.
- Data-quality impact, if any.

## What Not To Do

- No `git push --force` to shared branches.
- No `git reset --hard` on shared work.
- No deleting branches or closing human PRs without explicit instruction.
- No silently closing Dependabot PRs unless the exact update is already merged and tested.
- No token scraping from Chrome, Cloudflare dashboard, local Wrangler config, logs, screenshots, or shell history.

## If You Already Touched Main

1. Fetch and inspect history.
2. Confirm no force push happened.
3. Confirm teammate commits are still present.
4. Report exact commit SHAs.
5. For further changes, branch from latest `origin/main` and open PR.
