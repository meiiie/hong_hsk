# Design Resource Inventory

This folder now contains enough visual material to guide the next production UX/UI pass without inventing layout decisions directly in code.

## Public-Facing Assets

- `docs/assets/readme-hero.png`: GitHub README banner, red-first.
- `public/og-image.png`: production Open Graph image, resized to 1200x630.
- `docs/branding/hong-hsk4-studio-og-imagegen-source-v2.png`: high-resolution source for the current OG image.

## UX/UI Boards

- `assets/north-star-ui-board-v2-brand-red.png`: overall app direction across phone and desktop.
- `assets/mobile-flow-v2-brand-red.png`: main mobile learning flow.
- `assets/mobile-study-states-v1-brand-red.png`: daily study states from queue to correct/wrong feedback.
- `assets/mock-exam-mode-v1-brand-red.png`: strict HSK4 mock exam direction.
- `assets/component-system-v1-brand-red.png`: buttons, inputs, chips, navigation, alerts, cards, and typography references.
- `assets/data-operations-v1-brand-red.png`: import, data quality, lesson coverage, weak words, and planning views.

## Usage Rules

- Use generated layouts as visual guidance only; do not copy generated text blindly.
- Preserve the brand hierarchy: red seal and burgundy primary, warm paper background, ink navy text, jade only as a secondary accent.
- Translate the component board into CSS tokens and reusable presentation helpers before changing individual screens.
- Validate the final coded UI on mobile first, then tablet/desktop.
