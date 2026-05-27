# Study Page Lab - Học tập

Date: 2026-05-27.

This lab covers the primary learning screen now labeled `Học tập`. It uses Image Gen as a visual research aid, then translates the useful parts into deterministic HTML/CSS/TypeScript.

## Assets

- `assets/study-page-lab-v1.png`: Image Gen board for mobile-first and desktop study layouts.
- `assets/study-mobile-lab-v2-ideal-screen.png`: mobile-only study screen concept based on the north-star red board.
- `assets/study-mobile-lab-v2-component-scale.png`: component, spacing, color, and typography board for mobile study.
- `assets/study-mobile-lab-v2-motion-storyboard.png`: interaction storyboard for card, focus, answer, unlock, and next-card motion.
- `assets/study-mobile-lab-v3-minimal-recall.png`: strict pre-answer mobile concept with helper copy, character-count metric, examples, and empty status removed.
- `assets/study-mobile-lab-v3-information-hierarchy.png`: information hierarchy board for deciding what is primary, help-only, after-answer, or hidden until useful.
- `assets/study-mobile-lab-v3-after-answer.png`: post-answer state board for feedback, curated examples, stroke unlock, and next-review detail.
- `assets/study-mobile-lab-v3-rejected-example-leak.png`: rejected generated concept kept as a cautionary example because it leaks answer/example content.
- `prompts/study-page-lab-v1.md`: Prompt used to create the board.
- `prompts/study-mobile-lab-v2.md`: Prompt set used for the second mobile-only lab pass.
- `prompts/study-mobile-lab-v3.md`: Prompt set for the learner-centered clutter-reduction pass.
- `mobile-component-notes.md`: component-level decisions for matching the v2 north-star mobile study screen without leaking answers.
- `study-mobile-lab-v2-audit.md`: review of what to keep, what to reject, and which questions remain open before implementation.
- `study-mobile-lab-v3-audit.md`: decisions about removing technical helper copy, `Số chữ`, and empty word status from the primary study screen.

## What To Keep

- One main recall card per screen.
- The learner sees meaning/prompt first, types Hanzi, then checks.
- Stroke practice stays locked until the learner checks or explicitly reveals the answer.
- Primary action is `Chấm đáp án`; answer reveal/hide is secondary.
- Motion should be subtle: card enter, feedback response, next-card transition, stroke panel unlock.

## What Not To Copy

- Do not copy generated text exactly; Image Gen can distort Vietnamese and Hanzi.
- Do not use the generated desktop nav state literally; the real app must keep `Học tập` active.
- Do not add phone-frame chrome or decorative mockup-only labels to production UI.
- Do not make stroke practice visible before recall.

## Motion Rules

- Duration target: 140-240ms.
- Use `anime.js` only through `src/presentation/motion/`.
- Respect `prefers-reduced-motion`.
- Animate after render via stable `data-motion` attributes.
- Avoid layout-shifting animation; prefer opacity, translate, and small scale.
