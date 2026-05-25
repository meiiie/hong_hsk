# Cloudflare Final Step

The app is already public at:

- https://hsk4.holilihu.online/
- https://hong-hsk4-studio.pages.dev/

The remaining CI/CD step is to add a scoped Cloudflare API token to GitHub Secrets so the `Deploy Cloudflare Pages` workflow can deploy automatically after CI passes on `main`.

## Current State

- GitHub secret `CLOUDFLARE_ACCOUNT_ID` exists.
- GitHub secret `CLOUDFLARE_API_TOKEN` is still missing.
- Deploy workflow triggers after CI, but skips deploy until the API token exists.

Check from local:

```bash
gh secret list --repo meiiie/hong_hsk
gh run list --repo meiiie/hong_hsk --workflow "Deploy Cloudflare Pages" --limit 5
```

## Token Rule

Do not scrape, infer, or copy tokens from Chrome sessions, Cloudflare local config, logs, screenshots, or browser storage.

The user should create a fresh scoped token in Cloudflare and add it to GitHub Secrets. The token value is shown only once by Cloudflare.

## Create The Cloudflare Token

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

## Add Token To GitHub

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

## Verify Deploy

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

## Chrome Assistance Boundary

It is OK for an agent to use Chrome/browser automation to navigate the user to:

- Cloudflare API Tokens page.
- GitHub repository secrets page.

It is not OK for an agent to capture or store the API token. The user should paste it into GitHub Secrets or into an interactive `gh secret set` prompt.
