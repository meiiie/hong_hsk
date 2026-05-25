# Implementation Plan After Mockup

1. Audit current `styles.css` tokens and split into design-token sections.
2. Rebuild mobile layout first:
   - bottom navigation
   - study card hierarchy
   - input and feedback states
   - collapsible stroke practice panel
3. Add adaptive tablet/desktop shell:
   - navigation rail
   - two-column content only when useful
   - no duplicate nav systems at the same breakpoint
4. Add accessibility pass:
   - visible focus
   - minimum target sizes
   - color contrast
   - reduced motion support
5. Verify with Playwright screenshots:
   - 390x844 phone
   - 768x1024 tablet
   - 1440x900 desktop

Definition of done: the app feels clear and comfortable on phone first, preserves all study/mock/data workflows, and `npm test` remains green.
