# Sidebar UX/Motion Lab

## Decision

Do not switch the whole product back to green. The issue was that the first coded sidebar used too much high-intensity red across a large surface. The corrected direction keeps the Hồng red seal identity, but moves the expanded sidebar body to warm paper/ivory and reserves red for the brand header, active state, CTA, and collapsed rail.

## Implementation Direction

- Expanded desktop: warm paper sidebar body, red brand header, blush active item, ink text.
- Collapsed desktop/tablet: narrow burgundy icon rail, tooltip/title labels, no text crowding.
- Mobile: keep bottom navigation light and thumb-friendly; it should not inherit collapsed desktop styling.
- Motion: 160-220ms, ease-out, opacity/width transitions only. No bounce, no 3D, no particle effects.
- Accessibility: honor `prefers-reduced-motion`, keep focus-visible rings, and keep labels available through `aria-label`/`title` when collapsed.

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
