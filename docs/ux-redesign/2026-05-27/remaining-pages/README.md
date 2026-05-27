# Remaining Pages UX Lab

Date: 2026-05-27

Scope: polish the four secondary learning surfaces after the Study page: Theo bài, Từ sai, Lịch 30 ngày, and Dữ liệu.

## North Star

- Keep the learner oriented with one short hero per page.
- Make the first action match the page intent: study a lesson, recover mistakes, follow the schedule, or manage data.
- Avoid disabled primary actions in empty states; show the next useful action instead.
- Keep desktop dense enough for scanning, but transform tables into labeled cards on mobile.
- Use the same soft red, paper background, 8px radius, restrained shadow, and no decorative clutter.

## Page Decisions

### Theo bài

- Lesson selection is the primary workflow, so the 20 lesson grid appears before the vocabulary table on narrow layouts.
- Each lesson button shows book, progress, and a small progress track.
- The selected lesson detail keeps progress and key stats close to the table.

### Từ sai

- Empty state should not show a disabled "Ôn nhóm này" button.
- If there are no wrong words, the primary action becomes "Ôn hôm nay".
- When words exist, show summary metrics, top recovery items, then the detailed list.

### Lịch 30 ngày

- Wide desktop keeps settings next to the timeline.
- Narrow desktop/mobile prioritizes the actual timeline before settings.
- Phase pills stay short: Học bài, Ôn vòng 2, Tổng ôn, Thi thử.

### Dữ liệu

- Data import/export are task panels.
- Quality stats are grouped under one quality section.
- Copy should be clear that user data is local browser data.

## Verification Images

Saved in `docs/ux-redesign/2026-05-27/remaining-pages/verification/`.
