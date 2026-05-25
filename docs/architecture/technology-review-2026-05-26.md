# Technology Review - 2026-05-26

This note records the current technology decision for Hong HSK4 Studio after checking official documentation, established learning tools, and comparable open-source projects.

## Scope

- Product: one-learner, Vietnamese-first HSK4 review PWA for Hong.
- Main workflow: lesson-based vocabulary review, Hanzi recall, stroke practice, wrong-word review, and HSK4-style mock exam practice.
- Deployment: public static app on Cloudflare Pages at `hsk4.holilihu.online`.
- Constraint: do not copy copyrighted textbook passages, official exam papers, or official audio into the repository.

## Short Decision

Keep the current stack for now:

- Vite plus TypeScript static PWA.
- Browser-local IndexedDB for learner state.
- Hanzi Writer for stroke animation and stroke-order quiz logic.
- Cloudflare Pages direct upload through GitHub Actions.
- Python Playwright harness for mobile and desktop end-to-end verification.

Do not reset the project to a backend, SQLite/D1, Next.js, Unity, or native app yet. The current product is used by one learner, mostly on mobile, and the hard problems are data quality, review logic, mobile UX, and exam realism, not server scale.

## Source Review

| Domain | Sources checked | What matters for this project |
| --- | --- | --- |
| HSK4 exam structure | ChineseTest HSK4 page | HSK4 is 100 questions, about 105 minutes, with Listening 45, Reading 40, Writing 15. Mock exams must preserve this shape and must not claim to be official papers. |
| Spaced repetition | Anki Manual, Anki deck options, open-spaced-repetition `ts-fsrs` | Active recall plus spaced repetition is the correct learning model. FSRS is strong, but parameter optimization needs enough review history. Start with simple transparent scheduling, then evaluate FSRS after real logs exist. |
| Hanzi stroke practice | Hanzi Writer docs, `chanind/hanzi-writer`, `skishore/makemeahanzi` | Do not hand-roll stroke-order grading. Hanzi Writer already supports animation, quizzes, mistake callbacks, hints, leniency, and data derived from Make Me a Hanzi. |
| Offline/mobile app | MDN IndexedDB, web.dev PWA offline data | IndexedDB is appropriate for significant structured local data. Cache Storage plus service worker should handle the app shell, while review state remains in IndexedDB. |
| Deployment | Cloudflare Pages Direct Upload docs, GitHub Actions secrets docs | Direct upload with Wrangler is a good fit for a static PWA. Keep token in GitHub Secrets, keep permissions minimal, and rotate any exposed token before long-lived production use. |
| Comparable HSK apps/data | `tnm/hsk`, `louispy/clmandarin`, `drkameleon/complete-hsk-vocabulary`, `joelypoley/hsk_standard_course_vocab`, GitHub HSK vocabulary topic | Most open HSK apps are lightweight flashcard PWAs. Stronger data projects preserve source/provenance and generate derived files automatically. Our project needs the learning UX of the apps plus the provenance discipline of the data repos. |

## Comparable Projects

| Project | Signal | Lesson for Hong HSK4 Studio |
| --- | --- | --- |
| `ankitects/anki` | Mature open-source spaced-repetition app, large ecosystem, FSRS support. | Use active recall and spaced repetition as product principles. Avoid hiding scheduling behavior from the learner. |
| `ankidroid/Anki-Android` | Mobile-first Anki client with a large Android user base. | Mobile review speed matters more than dashboard density. Touch targets and short feedback loops are not optional. |
| `open-spaced-repetition/ts-fsrs` | TypeScript FSRS toolkit with scheduler and optional parameter training. | Candidate future dependency if we collect enough attempts and want a more formal memory model. |
| `chanind/hanzi-writer` | Dedicated Chinese stroke animation and quiz library. | Keep this dependency. Use quiz callbacks to record stroke mistakes instead of building custom stroke recognition. |
| `skishore/makemeahanzi` | Open Chinese character data split into dictionary and graphics JSON-lines files. | Stroke data has licensing and provenance complexity; reuse curated libraries and document source boundaries. |
| `tnm/hsk` | TypeScript/Vite/React/Tailwind flashcard web app with touch, keyboard, dark mode, and simple local persistence. | For HSK tools, simple local-first web UX is credible. The missing pieces in generic flashcard apps are lesson alignment, Vietnamese meanings, stroke recall, and mock exam mode. |
| `drkameleon/complete-hsk-vocabulary` | HSK 2.0/3.0 JSON dataset with generated derived files and source notes. | Keep a canonical editable source and generate/check derived artifacts. Do not manually patch many generated copies. |
| `joelypoley/hsk_standard_course_vocab` | HSK Standard Course word lists created with OCR plus manual correction, with explicit error caveats. | Treat coursebook word lists as reviewable data, not unquestionable truth. Keep correction workflow visible. |

## Architecture Implications

### Keep Static PWA

A static PWA is the best current fit because:

- Hong is one primary learner.
- Offline use on phone is important.
- There is no multi-user teacher/admin workflow yet.
- The app already needs no private server data.
- Cloudflare Pages is cheap, simple, and already working.

Backend triggers that would justify Workers plus D1 or another server:

- multi-device sync with login,
- teacher reviewing Hong's progress remotely,
- shared class/group data,
- paid/public multi-user launch,
- server-side audio generation or licensed media access control.

Until one of those triggers is real, backend work would add operational cost without improving Hong's daily review.

### Keep IndexedDB

IndexedDB remains the right storage layer for:

- vocabulary items,
- attempts,
- due dates,
- settings,
- imported Excel backups,
- mock exam sessions.

It should not be used as an invisible trap. The app should keep export/import backup prominent enough that Hong can move data if the phone changes.

### Review Logic

The current scheduler should stay transparent and deterministic for the next iteration:

- wrong answers come back soon,
- repeated correct answers space out,
- overdue items rise above new items,
- daily load is bounded for phone use.

Next technical step is not "install FSRS immediately"; it is to add stronger domain tests around due-date behavior and collect realistic attempt logs. Evaluate `ts-fsrs` only after there are enough review events to compare workload and retention.

### Mock Exam

The exam simulator should be HSK4-shaped, not just a random vocabulary quiz:

- 45 listening items,
- 40 reading items,
- 15 writing items,
- 105-minute total practice shell,
- separate Listening, Reading, Writing scores,
- clear disclaimer that generated questions are simulated practice.

Because official HSK papers/audio are copyrighted or controlled by the test provider, the app should use original/generated practice content and route the learner to official practice resources when needed.

### Data Quality

The main product risk is not the UI framework. It is inaccurate or weak Vietnamese learning data.

Recommended data policy:

- keep the lesson number, book side, Chinese, pinyin, Vietnamese meaning, examples, and source status per item;
- mark machine-assisted or draft Vietnamese meanings explicitly;
- add review states like `verified`, `needs_review`, and `draft`;
- prefer one canonical data source plus generated artifacts;
- add checks for duplicate Hanzi within a lesson, missing Vietnamese meanings, missing pinyin, and mock-exam over-repetition.

### UX Direction

Borrow from strong flashcard products, but specialize for Hong:

- mobile first,
- one primary action per study screen,
- no answer leak during recall,
- quick correction after checking,
- wrong words available immediately,
- lesson context visible but not noisy,
- exam mode visually and behaviorally distinct from study mode.

The previous issue where stroke practice revealed the current answer is exactly the kind of UX leak this review argues against.

## What Not To Copy

- Do not copy official HSK exam text/audio.
- Do not copy long textbook lesson text.
- Do not blindly import public GitHub vocab data without checking license and quality.
- Do not migrate to React/Next.js only because similar apps use them. The current TypeScript modules are small enough, and a framework migration would mostly create churn.
- Do not add a database just to look more "production". Production quality here means reliable daily learning, backups, tests, and deploy discipline.

## Recommended Roadmap

1. Add domain unit tests for `review-policy.ts`, `review.ts`, and `mock-exam.ts`.
2. Add a data-quality report command for missing Vietnamese, repeated exam items, duplicate lesson entries, and draft meanings.
3. Improve mobile UX around study, wrong words, and exam mode using Playwright mobile screenshots as acceptance artifacts.
4. Add attempt-log export so future FSRS evaluation has real data.
5. Revisit `ts-fsrs` after Hong has a meaningful number of reviews, especially if daily load feels too high or too low.
6. Consider Cloudflare Workers plus D1 only when sync/account features become a real user need.

## Primary References

- ChineseTest HSK4 structure: https://www.chinesetest.cn/HSK/4
- Anki learning background: https://docs.ankiweb.net/background.html
- Anki deck options and FSRS guidance: https://docs.ankiweb.net/deck-options.html
- Open Spaced Repetition `ts-fsrs`: https://github.com/open-spaced-repetition/ts-fsrs
- Hanzi Writer docs: https://hanziwriter.org/docs.html
- Hanzi Writer repository: https://github.com/chanind/hanzi-writer
- Make Me a Hanzi: https://github.com/skishore/makemeahanzi
- MDN IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- web.dev PWA offline data: https://web.dev/learn/pwa/offline-data
- Cloudflare Pages direct upload: https://developers.cloudflare.com/pages/get-started/direct-upload/
- GitHub Actions secrets: https://docs.github.com/en/actions/concepts/security/secrets
- HSK Cards example app: https://github.com/tnm/hsk
- HSK Standard Course vocab data: https://github.com/joelypoley/hsk_standard_course_vocab
- Complete HSK vocabulary data: https://github.com/drkameleon/complete-hsk-vocabulary
