# Study Mobile Lab V3 Prompts

Date: 2026-05-27.

Mode: built-in Image Gen through the `imagegen` skill.

## Rejected First Attempt

This prompt produced a visually useful layout but still leaked example content, so the image is kept only as a rejection reference.

```text
Use case: ui-mockup
Asset type: UX research board for Hồng HSK4 Studio mobile study page redesign v3
Primary request: Create a high-fidelity mobile app concept for a radically simplified, learner-centered “Học tập” recall screen. The design should remove unnecessary instructional microcopy and remove empty status panels.
Context: Current UI has clutter such as “So khớp tự động với đáp án...”, “Số chữ 2”, and empty status text. The redesign should decide these are not first-viewport essentials.
Critical UX constraints: Do not show target Hanzi answer before feedback. Do not show example Chinese before feedback. Do not show “Số chữ 2” as a prominent metric. Do not show “Trạng thái từ này: Chưa có log” anywhere in first viewport.
```

## Minimal Recall Screen

```text
Use case: ui-mockup
Asset type: strict mobile UX concept for Hồng HSK4 Studio study page
Primary request: Design a clean mobile “Học tập” recall screen that removes all non-essential helper text, removes the “Số chữ” metric, removes empty word status, and removes example sentence blocks from the first viewport.
Subject: a Vietnamese HSK4 learner sees only the essential recall task: progress, lesson chips, meaning prompt, input field, two actions, and a small collapsed learning aid row.
Exact visible text only: “Học tập”, “18 / 30”, “Bài 4”, “Quyển Thượng”, “Đang học”, “Gõ lại chữ Hán”, “nhắc tới; xách”, “Nhập chữ Hán”, “Gõ chữ Hán…”, “Hiện đáp án”, “Chấm đáp án”, “Luyện nét khóa”.
Critical constraints: Do not show any Chinese characters anywhere. Do not show examples. Do not show target answer. Do not show “So khớp tự động...” helper text. Do not show “Số chữ 2”. Do not show “Trạng thái từ này” or any empty log/status. Do not show pinyin before feedback. No answer leakage.
```

## Information Hierarchy Board

```text
Use case: ui-mockup
Asset type: UX information hierarchy design board for Hồng HSK4 Studio mobile study page
Primary request: Create a professional design-lab board that decides what belongs in the primary recall screen, what moves behind a help affordance, and what only appears after feedback.
UX decisions to visualize: The sentence “So khớp tự động...” becomes a tiny help tooltip, not always visible. “Số chữ 2” is removed from primary view and only used internally or in help. “Trạng thái từ này: Chưa có log” is hidden until there is real review history. Examples appear only after answer and only if curated, not generated placeholders. Stroke practice is collapsed/locked until answer.
```

## After-Answer State

```text
Use case: ui-mockup
Asset type: after-answer state UX concept for Hồng HSK4 Studio mobile study page
Primary request: Design the mobile study screen after the learner has checked an answer. This should show where feedback, answer, pinyin, curated example, stroke unlock, and word status belong without cluttering the pre-answer screen.
Subject: HSK4 recall after feedback. Wrong state shows clear but calm correction and a retry/next decision. Correct state shows answer reveal, pinyin, optional curated example, and stroke practice unlocked. Word status appears as a compact expandable row only if there is real history.
Critical constraints: Pre-answer elements must not appear here as clutter. Do not show empty log. Do not show status if there is no real review history. Example area should say curated/selected example, not placeholder generated example. If Chinese appears, it should only be in after-answer answer/example zones, never in pre-answer annotations.
```

