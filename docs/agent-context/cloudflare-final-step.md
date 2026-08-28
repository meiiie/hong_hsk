# Cloudflare Credential Rotation

The app is already public at:

- https://hsk4.holilihu.online/
- https://hong-hsk4-studio.pages.dev/

CI/CD is configured, but the deploy token used during setup was exposed in chat. The remaining security step is to replace it with a newly scoped token, verify deployment, and revoke the old token.

`CLOUDFLARE_API_TOKEN` is **not an AI credential**. It authorizes GitHub Actions to upload the static `dist` build to Cloudflare Pages. Deleting it would not remove Neko or the retired NVIDIA tutor; it would make future production deploy jobs skip.

## Current State

- GitHub secret `CLOUDFLARE_ACCOUNT_ID` exists.
- GitHub secret `CLOUDFLARE_API_TOKEN` exists; `gh secret list` reported its last update as `2026-05-25T14:35:40Z` on 2026-08-27.
- That timestamp predates the exposure warning, so the repository cannot claim the token was rotated.
- Deploy workflow triggers after successful CI on `main` and can use the configured token.
- GitHub has no `NVIDIA_API_KEY` repository secret. The old tutor used a Cloudflare Pages runtime secret instead.
- `NVIDIA_API_KEY` was permanently deleted from the Pages production environment on 2026-08-27 with Wrangler and the empty secret list was verified. The Preview environment was inspected in the Cloudflare dashboard and had no variable or secret to delete.
- Until the cleanup PR is merged and deployed, the old production Function still exists but now returns its missing-key response instead of calling NVIDIA.

Check from local:

```bash
gh secret list --repo meiiie/hong_hsk
gh run list --repo meiiie/hong_hsk --workflow "Deploy Cloudflare Pages" --limit 5
```

## Token Rule

Do not scrape, infer, or copy tokens from Chrome sessions, Cloudflare local config, logs, screenshots, or browser storage.

The user should create a fresh scoped token in Cloudflare and add it to GitHub Secrets. The token value is shown only once by Cloudflare.

Keep credential roles separate:

| Credential | Role | Action |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Static Pages deployment | Replace, verify, then revoke the exposed predecessor; do not delete merely because AI was removed. |
| `NVIDIA_API_KEY` | Retired AI provider | Deleted from production on 2026-08-27; Preview was already empty. |
| Future Neko provider credential | AI provider chosen by Neko | Store only on the trusted Neko host; never add it to Pages or this GitHub repository. |
| Future Cloudflare Tunnel credential | Outbound tunnel for the trusted host | Store only in the host's `cloudflared` service; it is not the Pages deploy token. |

## Create A Replacement Cloudflare Token

Use Cloudflare Dashboard:

1. Open Cloudflare dashboard.
2. Go to user profile/API Tokens.
3. Create a custom token.
4. Name it `hong_hsk_pages_deploy` or similar.
5. Permissions:
   - `Account`
   - `Cloudflare Pages`
   - `Edit`
6. Account resources:
   - Include the Cloudflare account that owns `hong-hsk4-studio`.
7. Create token.
8. Copy the token once.

Cloudflare's direct-upload CI guide documents the same required secret names:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Reference: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/

## Replace The GitHub Secret

Option A, GitHub UI:

1. Open https://github.com/meiiie/hong_hsk/settings/secrets/actions
2. Select `New repository secret`.
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: paste the Cloudflare token.
5. Save.

Option B, GitHub CLI:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo meiiie/hong_hsk
```

Paste the token when prompted. Do not put the token directly in a shell command.

GitHub secret docs: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets

## Verify Deploy And Revoke The Old Token

After the secret is added, trigger deploy with one of these:

```bash
gh workflow run "Deploy Cloudflare Pages" --repo meiiie/hong_hsk
```

Or merge/push a PR to `main`; CI will run first, then deploy.

Watch:

```bash
gh run list --repo meiiie/hong_hsk --workflow "Deploy Cloudflare Pages" --limit 3
gh run watch <RUN_ID> --repo meiiie/hong_hsk --exit-status
```

Verify production:

```powershell
Invoke-WebRequest -Uri 'https://hsk4.holilihu.online/' -UseBasicParsing -TimeoutSec 30
Invoke-WebRequest -Uri 'https://hsk4.holilihu.online/manifest.webmanifest' -UseBasicParsing -TimeoutSec 30
Invoke-WebRequest -Uri 'https://hsk4.holilihu.online/og-image.png' -UseBasicParsing -TimeoutSec 30
```

Expected result: HTTP `200` for all three.

After the new secret completes a successful deploy, return to Cloudflare API Tokens and revoke the previously exposed token. Do not revoke first: preserving one known-good deploy credential makes the rotation recoverable.

The legacy `NVIDIA_API_KEY` cleanup is complete. It was removed before the code cleanup reached production at the user's explicit request, so the retired AI endpoint may return `503` during this short transition. Merge and deploy the cleanup PR to remove the endpoint and UI themselves.

If the project later migrates Pages from direct upload to Cloudflare's native Git integration and validates a deployment without this workflow, `CLOUDFLARE_API_TOKEN` may then be deleted from GitHub. That migration is independent of Neko Core and is not required for the one-learner pilot.

## Chrome Assistance Boundary

It is OK for an agent to use Chrome/browser automation to navigate the user to:

- Cloudflare API Tokens page.
- GitHub repository secrets page.

It is not OK for an agent to capture or store the API token. The user should paste it into GitHub Secrets or into an interactive `gh secret set` prompt.
