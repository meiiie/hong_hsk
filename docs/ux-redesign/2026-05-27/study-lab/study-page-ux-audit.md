# Học Tập UX Audit

## Current Problems

- The navigation label `Học hôm nay` is too narrow; the page also supports lesson, wrong-word, and all-word queues.
- The study page hides its topbar, so the nav label carries more responsibility.
- Stroke practice is correctly locked before checking, but the locked panel can feel like dead space on mobile.
- Feedback exists, but the transition from typing to correct/wrong state needs a clearer tactile response.

## Target UX

- Rename the destination to `Học tập`.
- Keep bottom nav short label `Học`.
- Keep mode-specific language inside the page: `Hôm nay`, `Theo bài`, `Từ sai`, `Trộn tất cả`.
- Add micro-interactions for:
  - entering a card;
  - checking an answer;
  - moving to the next card;
  - unlocking stroke practice.

## Implementation Notes

- Use `data-motion="study-card"`, `data-motion="study-feedback"`, `data-motion="study-input"`, and `data-motion="stroke-lab"` as hooks.
- Add `hydrateStudyMotion` beside the existing sidebar motion module.
- Keep the motion state small and view-derived; no animation state should enter domain logic.

