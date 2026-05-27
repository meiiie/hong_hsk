# Mobile Study Lab V3 Audit

Date: 2026-05-27.

Scope: redesign the `Học tập` mobile screen around learner attention. This is research/design only; no implementation in this pass.

## User Questions

### `So khớp tự động với đáp án...` copy

Decision: remove from the always-visible recall card.

Reason: it explains implementation mechanics, not the learning task. It is only useful when the learner is confused about why an answer passed/failed.

Better placement:

- small `Cách chấm` help affordance;
- tooltip/bottom sheet;
- only shown after focus or failed answer if needed.

### `Số chữ 2`

Decision: remove from the primary screen.

Reason: the learner usually knows the requested answer length from the meaning, pinyin, and answer context. As a permanent metric it adds visual noise.

Better placement:

- optional help text inside `Cách chấm`;
- validation hint only after a wrong answer caused by length mismatch;
- internal scoring logic, not a visible KPI.

### Empty `Trạng thái từ này`

Decision: hide until the word has real review history.

Reason: `Chưa có log` teaches nothing and makes the page feel like an admin dashboard. Empty analytics should not interrupt recall.

Better placement:

- after at least one attempt;
- compact expandable row after feedback;
- deeper stats/detail page if the learner explicitly opens it.

## Best Generated Assets

- `assets/study-mobile-lab-v3-minimal-recall.png`
  - Best direction for the pre-answer state.
  - Keeps the page focused: progress, chips, prompt, input, primary/secondary actions, compact locked stroke row.
  - Does not show the technical helper copy, character-count fact row, or empty status panel.
- `assets/study-mobile-lab-v3-information-hierarchy.png`
  - Best for information architecture decisions.
  - Confirms the split between primary, secondary/help, after-answer, and hidden-until-useful information.
- `assets/study-mobile-lab-v3-after-answer.png`
  - Best for post-answer rules.
  - Confirms that answer, curated examples, stroke practice, and review status belong after feedback, not before.
- `assets/study-mobile-lab-v3-rejected-example-leak.png`
  - Kept as a rejection example.
  - It still leaks answer/example content, which violates the recall workflow.

## Target Pre-Answer Hierarchy

1. Compact topbar: `Học tập`, streak/date affordance if truly useful.
2. Progress strip: daily or queue progress.
3. Chips: lesson, book, queue position, status.
4. Recall task: `Gõ lại chữ Hán` + Vietnamese meaning/prompt.
5. Input: `Gõ chữ Hán...`.
6. Action row: `Hiện đáp án` secondary, `Chấm đáp án` primary.
7. Compact locked helper: `Luyện nét khóa` as one row.

Do not show in pre-answer state:

- target Hanzi;
- example Chinese;
- generated placeholder examples;
- `So khớp tự động...`;
- `Số chữ`;
- empty review/status/log panel;
- stroke grid.

## Target After-Answer Hierarchy

Wrong answer:

- show wrong state and correct answer;
- show pinyin;
- offer `Thử lại` or `Thẻ tiếp`;
- show a short length/format hint only if it explains the mistake.

Correct answer:

- show correct state;
- reveal Hanzi and pinyin;
- show curated example only if verified;
- unlock stroke practice;
- show next-review info only if a real schedule/log exists.

## Implementation Notes

- Add a `renderAnswerHelp()` tooltip/sheet rather than visible helper paragraph.
- Remove `study-facts` from default mobile view; keep data available for conditional feedback.
- Hide `.review-panel.review-panel-empty` on all study layouts, not just mobile.
- Keep placeholder-generated examples filtered out.
- If a future curated example exists, render it only after feedback/reveal.
