# UI Redesign Plan

## Principles to Design Rules

| Book Principle | UI Rule |
|---|---|
| Working memory holds 2-6 chunks | One question, one input, one action per screen. No sidebars, no navigation during a drill. |
| Chunking | Show the verb family as a visual unit: stem block plus ending block, same shape every time. |
| Notional machine | Animate the stem-plus-ending swap in the worked example, and re-show that same visual in every repair panel. |
| Cognitive load types | Strip decoration (extraneous), fade hints step by step (intrinsic), add self-explanation prompts (germane). |
| Misconceptions by name | A repair panel is a distinct screen, not a red toast. It names the error, shows the correct machine, then retests. |
| Spaced repetition and desirable difficulty | Free-text recall over multiple choice. Feedback is guaranteed but shown after commit, never while typing. |
| Roles of variables | Role-tagging becomes a tap-to-tag sentence with colored role pills instead of four text inputs. |

These map onto Mayer's coherence, signaling, segmenting, and pre-training principles, and onto faded-worked-example research (stepwise reveal plus self-explanation prompts helps low prior knowledge learners; faster fading suits experienced ones).

## Screen Plan

- Session start: A single card showing what is due for review, which family is up, and one "Begin" button. Replaces jumping straight into a drill.
- Worked example (I-do): Stem and ending rendered as two joined tiles. "Next step" reveals one paradigm row at a time. After the table completes, one prompt ("Why does yo take -o?") with a free-text box, not graded. Adds segmenting and self-explanation.
- Guided practice (We-do): Same tile layout with the ending tile blank. Hint fades over attempts: full hint, then person only, then nothing, derived from chunk streak and attempt count without altering engine schema.
- Independent recall (You-do): Verb, person, input. Submit shows a full-width result strip: green with the form, or amber leading into repair.
- Recognition: Word large, input below, accepted synonyms shown after submit. Small "false friend" tag on repair for seeded cognates.
- Role tagging: Sentence rendered as word tokens. The verb is a single token that the learner splits at the letter boundary before tagging stem and ending. Learner taps role pills to tag subject, stem, ending, and object. Wrong boundary or tags show which role was confused.
- Misconception repair: Named title, one-sentence explanation, notional machine tiles re-shown with the wrong ending struck through, one "Try a similar one" button.
- Session summary: Chunks reviewed, ladder steps advanced, next due dates as a small calendar strip. No XP, streak fire, or leaderboards.
- Technique badge: Keep the corner pill, consistent icon per technique, keyboard shortcut.

## Visual System and Stack

- Type: One serif display face for the Spanish target word, one humanist sans for UI, large sizes, generous line height. Feedback sits directly under the answer (spatial contiguity).
- Color: Neutral warm background, one accent hue per family (ar, er, ir), semantic green and amber for feedback only. Fixed role colors for subject, stem, ending, object across screens.
- Motion: Only two animations: stem-ending swap in the worked example, short slide when a new drill arrives.
- Texture: Skola-style index-card metaphor: drills are cards on a desk, not form fields on a page.
- Stack: Keep Vite + React. Reject Tailwind and shadcn; extend existing src/theme.css design tokens. Zero new dependencies, zero build config churn, lightweight for a personal PoC.

## Proposed Tickets

1. Move session state machine from App.jsx into pure engine module (src/engine/sessionRunner.js) with tests, resolving React async state bugs.
2. Design tokens, family colors, and card/desk layout system in src/theme.css.
3. Session start card and enhanced session summary (calendar strip and ladder rungs).
4. Worked example with stepwise reveal, stem-ending tiles, self-explanation prompt.
5. Hint fading in guided practice, derived from production_phase, streak_count, and attempt count.
6. Independent recall and recognition redesign with bottom-docked feedback strip.
7. Tap-to-tag role-tagging screen with single verb token split interaction.
8. Named misconception repair panel redesign with notional machine strike-through.

## Sources

- The Programmer's Brain (Manning): https://www.manning.com/books/the-programmers-brain
- Book review, Happy Coders: https://www.happycoders.eu/books/the-programmer-s-brain/
- Exploring the Design and Impact of Interactive Worked Examples (arXiv): https://arxiv.org/pdf/2602.16806
- Cognitive Load Theory in UI Design (Aufait UX): https://www.aufaitux.com/blog/cognitive-load-theory-ui-design/
- Mayer's 12 Principles of Multimedia Learning (DLI): https://www.digitallearninginstitute.com/blog/mayers-principles-multimedia-learning
- Skola local-first spaced-repetition PWA: https://github.com/h16nning/skola
- Duolingo UX breakdown (925 Studios): https://www.925studios.co/blog/duolingo-design-breakdown
- The good, the bad and the ugly of Duolingo gamification (UX Collective): https://uxdesign.cc/the-good-the-bad-and-the-ugly-of-duolingo-gamification-3a12f0e80dc7
- Desirable difficulty (Wikipedia): https://en.wikipedia.org/wiki/Desirable_difficulty
- Difficulty Is Not A UX Dirty Word (Usability Geek): https://usabilitygeek.com/difficulty-not-ux-dirty-word/
- Execute Program spaced repetition: https://www.executeprogram.com/spaced-repetition
- A Spaced, Interleaved Retrieval Practice Tool (ICER 2019): https://dl.acm.org/doi/10.1145/3291279.3339411
- Shadcn/ui vs Radix UI (Vercel): https://vercel.com/i/shadcn-vs-radix
- Best React UI Component Libraries 2026 (Untitled UI): https://www.untitledui.com/blog/react-component-libraries
