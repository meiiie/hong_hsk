# Mockup Review V1

Generated with the built-in Image Gen tool, then copied into this workspace.

## Files

- `assets/north-star-ui-board-v1.png`
- `assets/mobile-flow-v1.png`

## What To Keep

- Mobile screens feel like the primary product, not a shrunken desktop app.
- Bottom navigation is clearer than the previous permanent sidebar on small screens.
- The large Hanzi card has strong recall focus and gives HSK4 enough visual identity.
- The layout hierarchy is useful, but the teal/jade primary color is wrong for the existing Hồng brand. The logo and OG art are red-first: red seal, ink navy, warm paper, and jade only as a secondary accent.
- The mock exam screen feels stricter and less playful than daily study, which is correct.
- Desktop dashboard uses a rail and focused cards without turning into a marketing page.

## What To Avoid When Coding

- Do not copy generated text blindly; all real UI text must stay in HTML and be Vietnamese-correct.
- Do not add phone-frame chrome inside the actual app.
- Do not add dense charts unless they help Hồng decide what to study next.
- Avoid making stroke practice visible as the answer before recall.
- Keep red/amber states semantic: wrong/urgent/review, not decoration.

## Translation To Real UI

- Replace the desktop left sidebar with adaptive navigation:
  - bottom nav on phone
  - compact rail on tablet/desktop
- Rebuild the study page around one main card and one primary action.
- Move weak words and mock exam into clear mobile destination screens.
- Use off-white surfaces, ink navy text, Hồng/seal red primary actions, jade secondary accents, and restrained semantic status colors.
- Use CSS tokens rather than one-off colors.
