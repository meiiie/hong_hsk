# Agent Context Index

Last updated: 2026-08-27.

This folder is the shared memory layer for Hồng HSK4 Studio. It exists so an AI agent or teammate can join the project without rediscovering the same facts, rules, and deployment caveats every session.

The design follows the practical lesson from Anthropic's large-codebase guidance: a model is only one part of the system; the surrounding harness, context files, checks, tools, and review process determine whether agent work stays reliable.

## Read Order

1. [Root AGENTS.md](../../AGENTS.md): critical rules and high-level commands.
2. [Collaboration Rules](collaboration-rules.md): safe branch/PR workflow for a shared GitHub account.
3. [Project Map](project-map.md): where product, data, review, mock exam, PWA, deploy, and tests live.
4. [Technology Review](../architecture/technology-review-2026-05-26.md): researched stack decision and comparable project notes.
5. [Neko Core HSK4 AI Product RFC](../architecture/neko-core-hsk4-ai-product-rfc-2026-08-27.md): learner needs, pedagogy, architecture, security, licensing, and evaluation gates for future AI work.
6. [Neko Single-Learner Host](../deployment/neko-single-learner-host.md): what a trusted friend can install now, the future bridge boundary, and where each credential belongs.
7. [Harness](harness.md): deterministic checks, CI/CD, and local verification matrix.
8. [Cloudflare Credential Rotation](cloudflare-final-step.md): how to replace the exposed production deploy token without leaking credentials.
9. [Handoff Notes](handoff-notes.md): current state, unresolved work, and things to re-check.

## Context Graph

```mermaid
flowchart TD
  A["AGENTS.md"] --> B["docs/agent-context/README.md"]
  B --> C["collaboration-rules.md"]
  B --> D["project-map.md"]
  B --> E["harness.md"]
  B --> F["cloudflare-final-step.md"]
  B --> G["handoff-notes.md"]
  B --> N["technology-review-2026-05-26.md"]
  B --> O["neko-core-hsk4-ai-product-rfc-2026-08-27.md"]
  O --> P["deployment/neko-single-learner-host.md"]
  E --> H["scripts/run_harness.mjs"]
  E --> I["tests/verify_hsk_pwa.py"]
  E --> J["tests/verify_hsk_mobile_mock.py"]
  E --> K[".github/workflows/ci.yml"]
  F --> L[".github/workflows/deploy-cloudflare-pages.yml"]
  D --> M["src/"]
```

## Maintenance Policy

- Keep the root `AGENTS.md` short. Put details here.
- Prefer links over duplicated instructions.
- Update this folder in the same PR as any change to CI/CD, deploy, HSK data policy, module boundaries, or team workflow.
- Run `npm run context:check` before opening a PR.
- Review these files every 3-6 months or after major model/tooling changes.

## Source Notes

- Anthropic Claude Code large-codebase guidance: https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start
- GitHub Actions secrets documentation: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
- Cloudflare Pages direct upload CI documentation: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- HSK4 technology review: ../architecture/technology-review-2026-05-26.md
