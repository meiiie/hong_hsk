# AI Tutor Speed And UX Notes

Date: 2026-06-09

## Why This Pass Exists

Production showed fast status events but slow full answers for prompts such as "Cho ví dụ đặt câu với 弹钢琴". A diagnostic stream against production showed:

- Headers/status: about 0.5s.
- Ultra timeout before first token: about 7s.
- Fallback Super first token: about 16s total.
- Full answer: about 49s total.

The issue was not the API key. It was the default model plan trying Ultra first and allowing long answers for a quick study-card tutor.

## Model Decision

Default study-card tutor model:

- `mistralai/mistral-nemotron`

Fallback:

- `nvidia/nemotron-3-super-120b-a12b`

Rationale:

- `mistralai/mistral-nemotron` was much faster in local benchmark for short HSK4 examples.
- `nvidia/nemotron-3-super-120b-a12b` remains a strong fallback for accuracy.
- `nvidia/nemotron-3-ultra-550b-a55b` is too slow for default daily learning turns; use only by explicit environment override for deep-reasoning experiments.

## UX Direction

Reference mockup:

- `docs/ux-redesign/2026-06-09/assets/ai-tutor-sidebar-lab-v1.png`

Keep the tutor panel calm and compact:

- Show streaming status as a small state row, not a large blocking card.
- If the provider slows down, show a recovery card with short retry options.
- Keep model status visible but secondary.
- Do not make AI errors visually louder than the learning card.
- Prefer short answer budgets over long-form explanations inside the study flow.
