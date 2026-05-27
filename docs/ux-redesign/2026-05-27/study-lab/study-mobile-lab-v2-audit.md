# Mobile Study Lab V2 Audit

Date: 2026-05-27.

Scope: research only. No production implementation should be copied directly from Image Gen output.

## Generated Assets

- `assets/study-mobile-lab-v2-ideal-screen.png`
  - Best for overall mobile rhythm: compact header, daily progress card, pill row, large recall card, two-button action row, bottom nav.
  - Not acceptable as content logic: it leaks target Hanzi inside the example sentence.
- `assets/study-mobile-lab-v2-component-scale.png`
  - Best for component sizing: 48px input, 44px action buttons, 8px radius, 12/16px spacing rhythm, color token panel.
  - Not acceptable as content logic: some generated panels still show Hanzi before feedback.
- `assets/study-mobile-lab-v2-motion-storyboard.png`
  - Best for interaction timing: focus ring, wrong shake, card enter/next, stroke unlock.
  - Not acceptable as content logic: thumbnails still contain generated Hanzi and should be treated as illustrative only.

## What Looks Stronger Than The Current UI

- The top bar feels like a learning tool, not a brand banner. Keep it compact on mobile.
- The progress strip in the reference is clearer when it shows daily count such as `18 / 30 từ`, not only `Thẻ 1/30`.
- The recall prompt card should feel like the main task, but it should not be too tall. The current implementation can borrow the v2 board's tighter vertical rhythm.
- The action row should remain two columns on mobile: secondary reveal on the left, primary check/next on the right.
- The locked stroke helper should be a single compact row/card, not a large panel.

## Non-Negotiable Learning Logic

- Before feedback, the screen may show Vietnamese meaning, pinyin only if it is not answer-revealing for the task mode, and non-answer metadata.
- Before feedback, do not show:
  - target Hanzi;
  - example Hanzi;
  - a stroke grid for the target character;
  - any Chinese sentence containing the target word.
- After the learner checks or taps reveal, the app may show Hanzi, pinyin, example, stroke grid, and handwriting practice.

## Suggested Next Design Direction

- Make the first viewport contain: compact topbar, daily progress strip, chips, recall card, input, metadata, actions, and a small locked helper.
- Convert the current `session-strip` from queue-centric language to learner-centric language: `Tiến độ ngày`, `18 / 30 từ`, `60% hoàn thành`.
- Consider a small streak/calendar affordance in the header only if it does not add clutter.
- Keep red as a structural accent, not a background block.
- Use anime.js only for micro states:
  - card enter: 180ms translateY(16px) -> 0, opacity 0 -> 1;
  - focus ring: 140ms border/shadow;
  - wrong: 160ms x-shake;
  - unlock stroke: 220ms opacity/translateY;
  - next card: 180ms opacity/translateY.

## Open Questions Before Implementation

- Should the progress strip represent daily target progress or queue progress? The v2 lab favors daily target progress.
- Should `Luyện nét` unlock after any answer check, or only after correct/reveal? Current learning safety suggests correct/reveal.
- Should mobile show a calendar icon in the header, or keep date/time only on dashboard/settings?

