# Mobile Bottom Navigation Lab

## Decision

Do not show all seven destinations in the mobile bottom bar. The mobile IA uses four primary destinations plus a visible `Thêm` entry that opens a bottom sheet for secondary tools.

## Primary Mobile Tabs

- `Học`: active review/input flow, first because it is the main daily task.
- `Ôn`: today overview and readiness status.
- `Bài`: lesson-based vocabulary.
- `Thi`: mock exam mode.
- `Thêm`: opens the tool sheet.

## Mobile Header

Mobile keeps a dedicated red brand header above the content, matching the lab board. It is separate from the desktop sidebar so bottom navigation can stay focused on movement between learning surfaces.

- Red cap with the `红` seal.
- `Hồng HSK4 Studio` as the primary label.
- `HSK4 4A/4B` as the secondary label.
- A small right-side shortcut returns to the overview.

## Tool Sheet

- `Từ sai`
- `Lịch 30 ngày`
- `Dữ liệu`

The sheet uses a scrim, a drag handle, clear title, 54px rows, leading icons, and chevrons. It is intentionally a tap target, not a gesture-only hidden menu.

## Rationale

- Mobile tab bars work best with a small number of high-priority destinations.
- More than five visible options makes labels and touch targets compete with learning content.
- Hidden navigation needs a visible signifier; `Thêm` is clearer than an unlabeled icon-only overflow.

## Assets

- `mobile-bottom-nav-lab-v1.png`: imagegen concept board used as the implementation reference.

## References

- Material Design 3 Navigation bar guidelines: https://m3.material.io/components/navigation-bar/guidelines
- Apple Human Interface Guidelines, Tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Nielsen Norman Group, Basic Patterns for Mobile Navigation: https://www.nngroup.com/articles/mobile-navigation-patterns/
