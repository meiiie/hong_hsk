# Sidebar UX/Motion Lab

## Decision

Do not switch the whole product back to green. The issue was that the first coded sidebar used too much high-intensity red across a large surface. The corrected direction keeps the Hồng red seal identity, but moves the expanded sidebar body to warm paper/ivory and reserves red for the brand header, active state, CTA, and collapsed rail.

## Implementation Direction

- Expanded desktop: warm paper sidebar body, red brand header, blush active item, ink text.
- Collapsed desktop/tablet: narrow burgundy icon rail, tooltip/title labels, no text crowding.
- Mobile: keep bottom navigation light and thumb-friendly; it should not inherit collapsed desktop styling.
- Motion: 160-220ms, ease-out, opacity/width transitions only. No bounce, no 3D, no particle effects.
- Accessibility: honor `prefers-reduced-motion`, keep focus-visible rings, and keep labels available through `aria-label`/`title` when collapsed.

## Micro Spec

- Expanded sidebar width: 248px.
- Collapsed rail width: 76px, with 48px icon-only hit targets.
- Sidebar radius: 8px for brand, nav items, rail controls, and progress card.
- Navigation item: 48px height, 14px label, 18px icon, 12px icon-label gap.
- Navigation weight: 500 by default, 600 when active.
- Active state: flat blush background, red text/icon, no full red border, no 3D shadow.
- CTA: 14px label, medium-bold weight, solid brand fill, restrained shadow.
- Brand lockup: `Hồng HSK4` as the title and `Studio 4A/4B` as the meta line to avoid wrapping or clipped text.

## Library Decision

No new animation or CSS framework was added for this pass. CSS variables and native transitions are enough for this interaction and keep the PWA light. Reconsider libraries only when the app needs a complex sequenced animation:

- Anime.js timeline: good fit for complex, authored UI/stroke sequences.
- GSAP matchMedia: good fit for large animation systems with responsive/reduced-motion branches.
- Tailwind CSS v4: useful if the whole project moves to a utility/token workflow, but not worth migrating just for the sidebar.

## References

- MDN `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- GSAP `matchMedia`: https://gsap.com/docs/v3/GSAP/gsap.matchMedia/
- Anime.js documentation: https://animejs.com/documentation/
- Tailwind CSS theme variables: https://tailwindcss.com/docs/theme
