# Mobile Study Component Notes

Date: 2026-05-27.

Reference: `docs/ux-redesign/2026-05-26/assets/north-star-ui-board-v2-brand-red.png`, mobile study phone only.

## Decisions

- Header: use a compact white learning header on the `Học tập` route. The red brand header is useful for dashboard/navigation, but it costs too much vertical space during recall.
- Recall card: keep one card as the visual focus. The order is progress, metadata chips, prompt, input, facts, actions, then hint.
- Prompt: show Vietnamese meaning first. Do not reveal the Hanzi answer before check/reveal, even if a generated reference shows a character board. Example sentences also stay hidden before feedback because they can contain the target Hanzi.
- Input: mobile input should feel like a form field, not a display headline. Target height is about 50px with 16-17px typing text.
- Actions: use a two-column mobile action row. `Hiện đáp án` is secondary; `Chấm đáp án` is the primary action.
- Stroke practice: show a compact locked helper instead of hiding it entirely, so the learner understands why the stroke module is unavailable without seeing the answer.
- Queue switching: hide the mode panel from the first mobile viewport. Queue switching already lives in bottom navigation and the `Thêm` sheet.
- Progress color: use solid brand red for this screen. Avoid decorative red-to-green gradients because they read as generated rather than product-grade.

## Implementation Hooks

- `main.view-study` controls route-level mobile overrides.
- The former `study-facts` row is removed from the default study view; answer length and scoring details belong in contextual help or conditional feedback.
- `data-motion="study-card"`, `data-motion="study-input"`, `data-motion="study-feedback"`, and `data-motion="stroke-lab"` remain the animation hooks.
