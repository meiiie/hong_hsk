# Neko Core Host Runbook for One Learner

- Date: 2026-08-27
- Status: developer-local ACP pilot available; networked learner pilot still waits for the `hsk4-studio` profile and bridge releases

## Decision

Use the official Neko Core binary on one trusted computer. Do not rebuild or copy Neko's agent loop into Hồng HSK4.

The trusted operator may be the project owner or a trusted friend. The computer must be awake and online only while AI tutoring is needed. If it is offline, the static HSK4 PWA, IndexedDB learning state, review scheduler, stroke practice, and mock exams continue to work normally.

## What Can Be Installed Now

Neko Core `v1.2.2` publishes checksummed standalone binaries for Windows x64, Linux x64/arm64, and macOS x64/arm64. Bun and Node.js are not required on the learner's machine.

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

Direct binaries and their `.sha256` sidecars are available from the [Neko Core v1.2.2 release](https://github.com/meiiie/neko-core/releases/tag/v1.2.2). For the integrated pilot, install the exact release named by Hồng HSK4 rather than silently tracking `latest`. The developer machine used for the 2026-08-28 local smoke still had `v1.2.1`; `v1.2.2` states that ordinary ACP and durable sessions are unchanged, so updating that machine is not required to review this UI branch.

Installing Neko enables its normal terminal interface. On the developer-local pilot branch, Vite also shows a Neko control in the study view after the learner checks or reveals an answer. The production build still contains no active Neko endpoint or control.

## Developer-Local Pilot

The local UX pilot deliberately uses ordinary `neko acp`, as requested by the owner, without copying Neko's runtime. It is a bounded exception for evaluating the learning flow on one trusted machine:

- Vite launches the installed `neko acp` binary on demand and communicates through ACP v1 over `stdio`.
- The browser can call only the same-origin tutor, cancel, and session-close routes on loopback.
- The ACP session uses `plan` mode, low reasoning effort, one stable empty workspace, no configured MCP servers, no reads outside that workspace, and no extra verification loop.
- The Vite launcher removes `NVIDIA_API_KEY`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID` from the Neko child environment; Neko uses its own selected provider login instead.
- The learner sees a locked Neko card during recall; questions are enabled only after checking or explicitly revealing the answer.
- One direct ACP session ID is reused across cards and browser reloads. Hồng HSK4 keeps at most 40 recent exchanges for display; Neko owns the full durable conversation and can resume it after the Vite ACP process restarts.
- The learner can stop a pending turn, retry, disable AI without affecting study, export the visible transcript, or clear with confirmation. Clear calls ACP `session/close` and forgets the ID in Hồng HSK4; it does not physically delete Neko's durable session file because ACP v1 has no delete method.
- Provider credentials remain inside Neko. They are never returned to the browser or added to Cloudflare.

Run `npm run dev`, open `http://127.0.0.1:5173/`, then use `npm run test:neko-local` for a real two-turn browser/ACP smoke test that asserts the same durable session ID is retained. This path exists to judge tutoring usefulness and UI placement before a merge. It is not a deployable bridge and must never be exposed with a router port or Tunnel. Provider HTTP 429 or account/model outages are legitimate smoke failures; wait and retry rather than weakening the assertion.

## What Must Exist Before In-App AI

Two small product-specific releases are still required:

1. An official Neko Core release containing the reviewed `hsk4-studio` host profile and its ACP isolation tests.
2. A checksummed `hsk-neko-bridge` release that translates browser HTTPS/WebSocket traffic into ACP v1 over local `stdio` and supplies only the exact HSK MCP tools.

The bridge is not an AI core. Neko still owns provider authentication, model calls, planning, tool dispatch, streaming, cancellation, permissions, checkpoints, and durable sessions.

Do not use ordinary `neko acp` for the networked or production PWA pilot. The developer-local exception above reduces its effective surface for one trusted machine, but only the launch-authorized HSK host profile can make the exact tutor tool surface a Neko-enforced authority ceiling. Do not expose ACP or a generic terminal session directly to the internet.

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

- [Neko Core installation and provider routes](https://github.com/meiiie/neko-core/blob/v1.2.2/README.md)
- [Neko ACP and embedded host profiles](https://github.com/meiiie/neko-core/blob/v1.2.2/docs/process/ACP.md)
- [ACP v1 session lifecycle](https://agentclientprotocol.com/protocol/v1/session-setup)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- [Cloudflare Access applications](https://developers.cloudflare.com/cloudflare-one/applications/)
