# Study Mobile Lab V2 Prompts

Date: 2026-05-27.

Mode: built-in Image Gen through the `imagegen` skill.

## Ideal Mobile Screen

```text
Use case: ui-mockup
Asset type: UX research board for a Vietnamese HSK4 mobile-first PWA
Primary request: Create a polished mobile app screen concept for the Hồng HSK4 Studio “Học tập” study page, inspired by the provided north-star red UI board but improved for a real learner typing Chinese characters. Focus only on the mobile study screen, not desktop.
Input images: Use the visible north-star UI board as style reference; use the visible current mobile screenshot as the current-state reference to improve.
Scene/backdrop: single iPhone-like mobile app screen on a warm paper background, no marketing hero, no desktop panels.
Subject: a focused recall card for HSK4 vocabulary study. Show progress, lesson chips, Vietnamese meaning prompt, compact Hanzi input, metadata row, two action buttons, and a locked stroke-practice helper below.
Style/medium: high-fidelity product UI mockup, modern Vietnamese education app, clean Figma-like design, subtle red brand system, warm white paper surfaces, professional spacing.
Composition/framing: portrait mobile screen, 390px-ish layout, first viewport only, top learning header is compact white not a tall red brand block. Main card centered with balanced padding. Bottom navigation visible and polished.
Color palette: brand red #9F2734, burgundy #7F1D2A, warm paper #F8F3EF, blush #FFF0F1, ink navy #1F2230, muted gray #697085, success teal #0F766E. Avoid blue/purple dominance.
Typography: Inter-like UI text, high readability, no oversized placeholder text, no negative letter spacing. Hanzi font only for actual Hanzi examples after feedback, not before.
Text guidance: Vietnamese labels may be approximate; keep text short and readable. Include visible labels similar to “Học tập”, “Tiến độ ngày”, “Bài 3”, “Gõ lại chữ Hán”, “pháp luật”, “Gõ chữ Hán…”, “Hiện đáp án”, “Chấm đáp án”, “Luyện nét”.
Critical UX constraints: Do not show the target Hanzi answer before checking. Do not show a large stroke grid before answer. Do not reveal example Hanzi before answer. The screen should feel calm, efficient, and suitable for daily study on a phone.
Avoid: clutter, huge red header, huge input, decorative gradients, slop AI glow, fake unreadable paragraphs, excessive shadows, rounded cards over 8px if avoidable, answer leakage, stock illustration, phone frame taking over the design.
```

## Component Scale Board

```text
Use case: ui-mockup
Asset type: component and spacing board for Hồng HSK4 Studio mobile study page
Primary request: Create a detailed UX/UI lab board that breaks down the mobile “Học tập” screen into reusable components and exact visual rhythm. The board should feel like a senior product designer's Figma design spec, not a marketing poster.
Input images: Use the visible north-star UI board as brand/style reference and the visible generated/mobile screen concept as a rough direction, but fix its answer-leak problem.
Scene/backdrop: warm paper canvas with 4-6 component panels, each showing one component at realistic mobile scale.
Subject components: compact white learning header; daily progress strip; lesson/status chips; recall prompt card; Hanzi input field; metadata row; two-button action row; locked stroke-practice helper; bottom navigation.
Style/medium: high-fidelity UI component spec board, precise spacing annotations, red brand token labels, professional app design, calm and minimal.
Composition/framing: landscape design board, show one narrow mobile screen slice on the left and component anatomy panels on the right. Use thin red measurement markers and simple labels.
Color palette: brand red #9F2734, burgundy #7F1D2A, lifted red #D95D67, blush #FFF0F1, paper #F8F3EF, ink #1F2230, muted #697085, border #E2D9D6, teal #0F766E.
Typography guidance: Inter-like 14px body, 12px labels, 24-32px prompt meaning, 16px input text, button 15-16px semibold. Use 8px card radius and restrained shadow.
Text guidance: Short labels only. Include “Không lộ đáp án”, “Ví dụ khóa”, “Luyện nét khóa”, “Chấm đáp án”, “Hiện đáp án”, “Số chữ”, “Quyển”, “Cấp độ”. Text may be approximate but should be legible.
Critical UX constraints: The target Hanzi answer must not appear anywhere before feedback. Example sentence area must be represented as locked/hidden before answer, not as actual Chinese text. Stroke grid is locked before feedback. The first viewport should contain the entire recall task and the locked helper start.
Avoid: giant phone frame, blue/purple palette, decorative gradients, heavy shadows, huge header, huge input, answer leakage, random Chinese characters, noisy annotations, excessive rounded corners.
```

## Motion Storyboard

```text
Use case: ui-mockup
Asset type: mobile UX motion storyboard for Hồng HSK4 Studio study page
Primary request: Create a professional motion storyboard board for micro-interactions on the mobile “Học tập” page. It should show 5 states of the same study screen: card enters, typing focus, wrong feedback shake, correct feedback unlocks stroke practice, next card transition.
Scene/backdrop: warm paper design lab canvas, not a marketing poster.
Subject: five compact mobile screen thumbnails arranged left to right, each with concise annotation arrows. The screen is a Vietnamese HSK4 recall workflow.
Style/medium: Figma-style interaction storyboard, product design spec, clean red brand system, subtle motion trails, practical developer handoff.
Composition/framing: landscape board with 5 mobile thumbnails and a right-side motion token panel. Thumbnails should be simple enough to read; annotations should focus on duration/easing, not decorative effects.
Color palette: brand red #9F2734, burgundy #7F1D2A, blush #FFF0F1, paper #F8F3EF, ink #1F2230, muted #697085, teal success #0F766E, orange wrong #D95D2F.
Typography and motion notes: 140ms focus ring, 180ms card enter, 160ms wrong shake, 220ms stroke unlock fade/slide, reduced motion fallback instant. Use anime.js compatible transform/opacity only.
Text guidance: Use short Vietnamese labels only: “Vào thẻ”, “Đang gõ”, “Sai”, “Đúng”, “Thẻ tiếp”. For the prompt meaning, use “pháp luật”. For answer-sensitive areas, write “Ví dụ khóa” or “Đáp án ẩn” instead of any Chinese characters.
Critical UX constraints: Do not show any real Hanzi characters anywhere in pre-feedback states. Do not show target answer before feedback. Stroke grid is hidden/locked until correct or reveal. Avoid copying generated distorted Vietnamese text.
Avoid: unreadable dense text, giant phone bezels, heavy glow, decorative particles, 3D, blue/purple palette, answer leakage, random Chinese characters, complex animations that would require layout animation.
```

