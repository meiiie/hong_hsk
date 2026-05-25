# Harness

The project harness is the set of context, scripts, workflows, browser tests, deployment checks, and review rules that keep agent-assisted work reliable.

This follows the idea that the harness matters as much as the model: context files help navigation, deterministic scripts catch regressions, and PR review keeps shared work safe.

## Harness Layers

| Layer | Files | Purpose |
| --- | --- | --- |
| Context | `AGENTS.md`, `CLAUDE.md`, `docs/agent-context/*` | Give agents and teammates the same project map and rules. |
| Static checks | `npm run context:check`, `npm run check` | Validate context files and TypeScript. |
| Build | `npm run build` | Ensure Vite production output compiles. |
| Browser harness | `npm run test:harness` | Verify desktop/mobile learning and mock-exam workflows. |
| CI | `.github/workflows/ci.yml` | Run the full test stack on PRs and `main`. |
| CD | `.github/workflows/deploy-cloudflare-pages.yml` | Deploy only after successful CI on `main`, and only if Cloudflare secrets exist. |
| Review | PR checklist and branch rules | Prevent accidental main churn and teammate overwrite. |

## Local Verification Matrix

Run the full suite before pushing:

```bash
npm test
```

This expands to:

```bash
npm run context:check
npm run check
npm run build
npm run test:harness
```

Install browser-test prerequisites when needed:

```bash
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
```

## What The Browser Harness Covers

Desktop:

- App loads with Hồng HSK4 Studio visible.
- Removed stale headers stay absent.
- Study input exists.
- Stroke practice starts hidden during recall.
- Reveal and hide answer controls work.
- Wrong answer creates a wrong-list item.
- Correct answer is recognized.
- Data screen renders.

Mobile/mock:

- Reference dataset loads.
- Data count reaches the expected current course count.
- Mock exam set selection works.
- Mock runner starts with clock and 100-question flow.
- Mobile study and mock screens render in a narrow viewport.

## What The Harness Does Not Prove

- It does not prove every Vietnamese meaning is final-quality.
- It does not validate official HSK licensing.
- It does not guarantee Cloudflare deploy unless `CLOUDFLARE_API_TOKEN` is configured.
- It does not replace human mobile UX review on a real phone.

## CI/CD Contract

CI runs on:

- Pull requests.
- Pushes to `main`.
- Manual dispatch.

Deploy runs on:

- Successful `CI` workflow on `main`.
- Manual dispatch.

Deploy will skip build/deploy steps if either Cloudflare secret is missing:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

This prevents noisy red deploy runs while the token is not configured, but still shows that the workflow was triggered.

## PR Harness Checklist

For every PR, include:

- `npm test` result.
- Screenshots/artifacts if UX changed.
- Whether Cloudflare workflow changed.
- Whether data import/translation changed.
- Whether `docs/agent-context/` was updated.

## Maintenance

Update `docs/agent-context/harness-manifest.json` when:

- A required context file is added or removed.
- A test command changes.
- A workflow name changes.
- A critical source module moves.
