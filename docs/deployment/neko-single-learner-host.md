# Neko Core Host Runbook for One Learner

- Date: 2026-08-27
- Status: Neko can be installed now; HSK4-in-app integration waits for the `hsk4-studio` profile and bridge releases

## Decision

Use the official Neko Core binary on one trusted computer. Do not rebuild or copy Neko's agent loop into Hồng HSK4.

The trusted operator may be the project owner or a trusted friend. The computer must be awake and online only while AI tutoring is needed. If it is offline, the static HSK4 PWA, IndexedDB learning state, review scheduler, stroke practice, and mock exams continue to work normally.

## What Can Be Installed Now

Neko Core `v1.2.1` publishes checksummed standalone binaries for Windows x64, Linux x64/arm64, and macOS x64/arm64. Bun and Node.js are not required on the learner's machine.

Windows PowerShell:

```powershell
irm https://neko.holilihu.online/install.ps1 | iex
neko version
neko doctor
neko
```

macOS or Linux:

```bash
curl -fsSL https://neko.holilihu.online/install.sh | sh
neko version
neko doctor
neko
```

Inside Neko, use `/login` to choose a supported provider route and `/model` to choose a model. This credential setup must be performed interactively on the trusted computer. Do not send API keys through chat or add them to this repository.

Direct binaries and their `.sha256` sidecars are available from the [Neko Core v1.2.1 release](https://github.com/meiiie/neko-core/releases/tag/v1.2.1). For the integrated pilot, install the exact release named by Hồng HSK4 rather than silently tracking `latest`.

Installing Neko now enables its normal terminal interface. It does **not** yet add AI buttons to the HSK4 PWA.

## What Must Exist Before In-App AI

Two small product-specific releases are still required:

1. An official Neko Core release containing the reviewed `hsk4-studio` host profile and its ACP isolation tests.
2. A checksummed `hsk-neko-bridge` release that translates browser HTTPS/WebSocket traffic into ACP v1 over local `stdio` and supplies only the exact HSK MCP tools.

The bridge is not an AI core. Neko still owns provider authentication, model calls, planning, tool dispatch, streaming, cancellation, permissions, checkpoints, and durable sessions.

Do not use ordinary `neko acp` for the PWA pilot. Without the launch-authorized HSK host profile it includes Neko's normal tool environment, which is broader than a language tutor needs. Do not expose ACP or a generic terminal session directly to the internet.

## Target Host Layout

```text
Hồng HSK4 PWA
    -> Cloudflare Access (one allowlisted learner)
    -> named Cloudflare Tunnel (outbound from trusted computer)
    -> hsk-neko-bridge bound to 127.0.0.1
    -> neko acp --host-profile hsk4-studio
    -> Neko provider + durable local sessions
```

The production bridge release must provide its own exact install and service commands. Until that artifact exists, do not invent a background-service command or open a router port manually.

## Credential Boundaries

| Credential | Purpose | Correct location | AI credential? |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deploy the static PWA to Cloudflare Pages from GitHub Actions | GitHub Actions secret; rotate after exposure | No |
| `CLOUDFLARE_ACCOUNT_ID` | Select the Cloudflare account during Pages deploy | GitHub Actions secret/config | No |
| Neko provider login/API key | Let Neko call the selected model | Neko credential store on the trusted computer | Yes |
| Cloudflare Tunnel credential | Connect the trusted computer to the named tunnel | `cloudflared` service on that computer | No |
| Legacy `NVIDIA_API_KEY` | Old removed tutor | Delete from Cloudflare Pages after the cleanup PR is deployed | Retired AI credential |

Never reuse `CLOUDFLARE_API_TOKEN` as a provider key or a Tunnel credential. Removing it does not remove AI; it only stops future GitHub Actions deployments. The exposed token should be replaced and revoked using the [Cloudflare credential rotation runbook](../agent-context/cloudflare-final-step.md).

## Pilot Readiness Checklist

- [ ] Legacy-AI cleanup PR is merged and the clean static build is deployed.
- [x] Legacy `NVIDIA_API_KEY` is deleted from Production; Preview was verified empty on 2026-08-27.
- [ ] `CLOUDFLARE_API_TOKEN` is rotated and a post-rotation Pages deploy succeeds.
- [ ] Neko `hsk4-studio` profile tests prove native/global tools are absent.
- [ ] Exact Neko and bridge releases plus SHA-256 checksums are recorded.
- [ ] The bridge binds only to loopback, validates the production Origin and Access identity, and redacts logs.
- [ ] Cloudflare Access allowlists only the learner's email.
- [ ] Provider credentials and Tunnel credentials exist only on the trusted computer.
- [ ] P0 post-answer repair passes the offline safety and pedagogy gates.
- [ ] Turning off or disconnecting the host leaves all non-AI PWA workflows usable.

## Primary References

- [Neko Core installation and provider routes](https://github.com/meiiie/neko-core/blob/901bce800b3e28c7f3f7d6b2e47d4cd3fa2dea13/README.md)
- [Neko ACP and embedded host profiles](https://github.com/meiiie/neko-core/blob/901bce800b3e28c7f3f7d6b2e47d4cd3fa2dea13/docs/process/ACP.md)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- [Cloudflare Access applications](https://developers.cloudflare.com/cloudflare-one/applications/)
