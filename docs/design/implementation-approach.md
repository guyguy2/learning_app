# Implementation Approach: Learning-Aligned Delight and Engineering Plan

## 1. Pedagogical Delight vs Manipulative Gamification

Modern language learning software often conflates user engagement with casino game mechanics: XP counters, streak fire icons, daily loss-aversion notifications, competitive leagues, and punishing hearts or lives systems. Cognitive science shows that these extrinsic motivators increase anxiety, encourage guessing or gaming the mechanics, and clutter working memory with extraneous cognitive load.

In this application, fun is derived entirely from intrinsic, learning-aligned delight: the deep cognitive satisfaction of clear mental models, tactile understanding, predictable feedback, and perceptible competence. When a learner understands why a grammatical rule works, solves a challenge through unassisted retrieval, and watches their knowledge consolidate over spaced calendar intervals, the learning process itself becomes genuinely engaging.

### Concrete Delight Moments Grounded in Pedagogy

1. Animated Stem and Ending Swap (The Notional Machine in Motion)
   - Visual: The infinitive verb is presented as two physical joined tiles (for example, `[habl]` and `[ar]`). When conjugated, the `-ar` tile separates and slides away, and the person ending tile (for example, `[o]`) slides smoothly into place.
   - Pedagogical anchor: Mayer's signaling and multimedia principles, and the notional machine concept from *The Programmer's Brain*. Animating the morphological split makes the underlying mechanism visible, reinforcing schema formation in long-term memory.

2. Card and Desk Metaphor for Drills
   - Visual: Inspired by the Skola aesthetic, the user interface represents a physical index card resting on a clean, warm desk. Each exercise is an isolated, focused card without navigation bars, status counters, or cluttered side rails.
   - Pedagogical anchor: Working memory capacity (2 to 6 chunks) and Sweller's cognitive load theory. The card-on-a-desk metaphor bounds attention to one question, one input, and one action per screen. Advancing slides the finished card away and smoothly introduces the next card.

3. Satisfying Commit-Then-Reveal Feedback Strip
   - Visual: Inputs remain neutral while typing with no premature green checks or eager validation. Upon pressing Enter or clicking Submit, a full-width result strip docks snugly beneath the card.
   - Pedagogical anchor: Desirable difficulty and retrieval practice. Real learning requires cognitive retrieval effort before disclosure. Feedback is decisive: reassuring calm green for correct, and warm amber for misconceptions (never alarming red toast banners).

4. Ladder Progress Visual That Makes Spacing Tangible
   - Visual: Spaced repetition is visualized not as an anxiety-inducing streak count, but as a physical five-rung ladder representing the calendar intervals (1, 3, 7, 14, and 30 days).
   - Pedagogical anchor: Ebbinghaus forgetting curves and consolidation. Seeing a verb family ascend a rung on the ladder after a clean review connects the learner directly to the physical reality of memory stabilization.

5. Per-Family Color Identity
   - Visual: Consistent, muted accent colors dedicated to each verb family:
     - `-ar` family: Warm terracotta / clay
     - `-er` family: Deep sage / forest green
     - `-ir` family: Slate blue / indigo
   - Pedagogical anchor: Pre-attentive processing and chunk signaling. The learner instantly recognizes the active paradigm before reading the verb, reducing intrinsic processing friction.

6. The "Aha" Moment on Repair Retest Success
   - Visual: When an error matches a seeded misconception (such as confusing a false cognate or applying an `-ar` ending to an `-er` verb), the repair card explains the exact misconception and shows the notional machine with the mistaken ending struck through. Passing the immediate follow-up retest displays a subtle confirmation badge: "Mental model aligned."
   - Pedagogical anchor: Misconception remediation. Errors are treated as diagnostic learning events rather than failures, creating a positive emotional reward when the mental model is corrected.

7. Session Summary That Shows What Stuck
   - Visual: A calm end-of-session screen displaying: (1) chunks reviewed today, (2) ladder steps advanced, and (3) a clean mini-calendar strip showing upcoming due dates for each family.
   - Pedagogical anchor: Cognitive closure and meta-cognition. The learner closes the session confident that the spacing schedule is actively managing their retention without artificial urgency.

---

## 2. Tap-to-Tag Role-Tagging Interaction Design

### Current Problem
The existing role-tagging screen requires learners to manually type Spanish substrings into four separate text inputs: Subject, Stem, Ending, and Object. This creates substantial extraneous cognitive load, causes typing mistakes, and breaks the rhythm of sentence analysis.

### Redesigned Interaction Flow
In the sentence view, the Spanish sentence is rendered as individual word tokens. Crucially, the verb is presented as ONE single token:

`[ Yo ]` `[ hablo ]` `[ español ]`

Pre-splitting the verb into `[habl]` and `[o]` during initial presentation is avoided because identifying the stem and ending boundary is the primary retrieval task in role-tagging. Pre-splitting would reveal the answer in advance. A pre-split view is only shown during misconception repair screens.

Above or below the sentence sits a Role Palette containing four distinct, color-coded role badges:
- Subject: Soft violet
- Stem: Calm sky blue
- Ending: Amber
- Object: Sea green

### Interaction Steps
1. Tagging Subject and Object:
   - Learner taps a role badge in the palette (for example, `Subject`), giving it an active highlight.
   - Learner taps the corresponding word token (`Yo`). The token receives the role color tint and role label.
   - Alternatively, learner taps the token directly to open an inline four-option role selector.
2. Splitting the Verb (Stem and Ending):
   - The learner taps the letter boundary inside the verb token (for example, tapping between 'l' and 'o' in `hablo`) or drags a boundary divider blade.
   - Tapping the boundary splits the single verb token into two halves: `[ habl ]` and `[ o ]`.
   - The learner then assigns the `Stem` role to `habl` and the `Ending` role to `o`.
   - Tapping the boundary seam again merges the two halves back into a single token if the learner wants to adjust the split point.
3. Quick Reset:
   - Tapping an already-tagged token clears its assignment.
4. Keyboard Accessibility:
   - Keys 1 to 4 select roles from the palette.
   - Tab and arrow keys navigate across tokens and letter boundaries.
   - Space or Enter splits a verb token or assigns the active role.
5. Mapping to Existing Attempt Shape (No Engine Changes):
   - The boundary split and role assignments map directly to the engine's expected attempt shape:
     `given: { subject: tags.subject, stem: tags.stem, ending: tags.ending, object: tags.object }`
   - If the learner splits `hablo` at the wrong boundary (for example, `hab` and `lo`), `given.stem` is `"hab"` and `given.ending` is `"lo"`. The validation evaluates `correct: false` against `stimulus.parts.stem` (`"habl"`) and `stimulus.parts.ending` (`"o"`).
   - The UI immediately pinpoints the error (for example: "Stem boundary incorrect: 'hab' is missing the 'l'"). No schema or engine changes are required.

---

## 3. State Boundaries: Engine State vs UI-Only State

Maintaining a pure, testable pedagogy engine requires clear boundaries between persistent learning state and ephemeral view state.

### 1. Hint Fading (Derived, Not Stored)
- Rationale for Rejection of Stored `hint_level`:
  - The chunk data model in SPEC already tracks `production_phase` (`'worked_example' -> 'guided' -> 'independent'`) and `streak_count`.
  - Adding a separate stored 4-level ladder creates an overlapping second fluency tracker on top of `streak_count`, and level 3 (unassisted retrieval) directly duplicates `production_phase === 'independent'`.
  - The SPEC data model remains completely untouched: no new fields in `progress.json`.
- Dynamic Derived Fading:
  - Guided-phase hint text is a pure function of existing state: `deriveHintText({ production_phase, streak_count, attemptCount, stimulus })`.
  - Level logic:
    - `streak_count === 0` and `attemptCount === 0`: Full prompt with stem-ending rule (for example: "hablar: drop -ar, attach yo ending -o").
    - `streak_count >= 1` and `attemptCount === 0`: Faded rule showing person and ending cue (for example: "yo ending for -ar").
    - `attemptCount >= 1` (local retry on the current stimulus): Re-presents the full rule to scaffold recovery.
    - `production_phase === 'independent'`: Hints are omitted entirely.
  - Handled cleanly in a small pure helper module with unit tests.

### 2. Stepwise Worked-Example Reveal
- UI-Only State (Ephemeral Component State):
  - `currentStep`: Integer index (0 to 6) tracking which paradigm row has been revealed in the worked example.
  - `isComplete`: Boolean indicating whether all paradigm rows have been displayed.
  - Why UI-only: This represents presentation pacing within a single session visit. If the page is reloaded, re-revealing the worked example step by step is pedagogically desirable to prime working memory.

### 3. Self-Explanation Prompt
- UI-Only State with Action Payload:
  - `selfExplanationText`: The learner's typed response to the reflective prompt (for example: "Why does yo take -o?").
  - Pedagogical basis: Germane cognitive load. The educational benefit comes from the mental effort of generating an explanation, not from automated grading.
  - State handling: Kept in local component state. When the learner clicks "Continue to guided practice", the text is submitted with the action `{ action: 'worked_example_ack', selfExplanation: text }`. The engine acknowledges the transition to guided practice without grading the free-text input.

---

## 4. Stack Decision: Extending `src/theme.css` Tokens vs Tailwind + shadcn

### Evaluation

| Criteria | Tailwind + shadcn (Base UI / Radix) | Extending `src/theme.css` Tokens |
|---|---|---|
| Dependency Overhead | High: Requires Tailwind, PostCSS, Autoprefixer, tailwind-merge, clsx, cva, and Radix packages. | Zero: Uses existing native CSS custom properties. |
| Build Pipeline Changes | High: Requires Vite PostCSS configuration and utility generation setup. | None: Already integrated and bundled cleanly by Vite. |
| Token Consistency | Excellent: Utility classes mapped to configuration. | Excellent: CSS variables directly accessible across all components. |
| Fit for Personal PoC | Overkill: Substantial boilerplate for an app with 6 focused screens. | Ideal: Lightweight, fully transparent, zero lock-in. |
| Animation Control | Good, but requires Tailwind animation plugins or custom CSS extensions. | Direct: Straightforward CSS transitions and keyframes for tile swaps. |

### Recommendation
**Extend the existing `src/theme.css` design tokens.**

For a personal, single-user proof of concept, adding a full Tailwind and shadcn toolchain introduces unnecessary dependency churn, configuration complexity, and large code diffs without improving the learning experience.

The existing `src/theme.css` already provides a clean foundation with dark-mode support, system font stacks, and responsive sizing tokens. Extending it with semantic tokens for verb families (`--family-ar`, `--family-er`, `--family-ir`), role-tagging colors (`--role-subject`, `--role-stem`, etc.), and card/desk elevations provides all necessary visual polish with minimal code and zero maintenance overhead.

---

## 5. Concrete Build Order as Tickets

### Ticket 1: Move Session State Machine from `App.jsx` into Pure Engine Module
- Goal: Extract all session lifecycle logic, phase transitions (review, new content, summary), drill routing, retry handling, and misconception wiring out of `App.jsx` into a pure, framework-free engine module (`src/engine/sessionRunner.js`), leaving `App.jsx` as a thin view coordinator.
- Motivation and Existing `App.jsx` Bugs to Resolve:
  1. Stale React State on Session Start and Drill Transitions: `startSession` sets `newChunkId` via React `useState` and synchronously invokes drill selection in the same event tick. Because React state setters are asynchronous, `newChunkId` reads stale `null`, causing fresh sessions to mistakenly fall through to `summary` (fixed by ad-hoc derivation in commit `0444138`, but closure state bugs persist in `advanceReviewQueue` and `setMasteredChunkId`).
  2. Blank Screen / Null Stimulus on Worked-Example Acknowledgment: After acknowledging a worked example (`worked_example_ack`), the production stimulus is null because no vocabulary has been mastered yet. In `App.jsx`, setting stimulus directly from engine output caused the UI to render a completely blank page instead of cycling through phase rotation back to recognition (addressed in commit `20ace31`, but still fragile in React state).
- Files touched:
  - `src/engine/sessionRunner.js` (new)
  - `src/engine/sessionRunner.test.js` (new)
  - `src/App.jsx` (refactored)
- Engine changes (with tests):
  - Implement `createSessionRunner({ progress, content, today })`.
  - Encapsulate `startSession()`, `submitAttempt(attempt)`, `acknowledgeWorkedExample(payload)`, `retryMisconception()`, and `advanceToNextSession()`.
  - Return deterministic session states: `{ mode, currentScreen, exerciseType, stimulus, feedback, repair, sessionSummary }`.
  - Comprehensive unit tests verifying: review-to-new phase progression, streak resets on misses, misconception branching, gate clearing, and summary transitions.
- UI changes:
  - `App.jsx` instantiates the runner upon fetching `/api/progress`, invokes runner actions, and passes resulting state to the active screen.
- Verification in browser:
  - Run `npm test` to verify all engine transitions pass.
  - In browser: Walk through a complete session (review drills, worked example, guided drill, independent recall, and error repair). Verify state transitions behave identically with no regressions.

### Ticket 2: Design Tokens, Family Colors, and Card/Desk System
- Goal: Establish the visual foundation: card-on-a-desk layout, family color identity tokens, role colors, and typography hierarchy.
- Files touched:
  - `src/theme.css`
  - `index.html` (font preloading if external font used)
- Engine changes (with tests): None.
- UI changes:
  - Add design tokens to `:root`: family colors (`--color-ar`, `--color-er`, `--color-ir`), role tagging colors (`--role-subject`, `--role-stem`, `--role-ending`, `--role-object`), and desk background shades.
  - Implement `.desk` container and `.card` styling with subtle borders, border radius, and elevation shadows.
  - Define serif font styling for Spanish target words and humanist sans for UI labels.
- Verification in browser:
  - Toggle between light and dark mode in system settings. Verify background tone, card contrast, typography legibility, and family color tokens.

### Ticket 3: Session Start Screen and Enhanced Summary
- Goal: Implement the calm pre-session card and update the summary screen with the five-rung ladder and calendar schedule.
- Files touched:
  - `src/components/SessionStart.jsx` (new)
  - `src/components/SessionStart.css` (new)
  - `src/components/SessionSummary.jsx`
  - `src/components/SessionSummary.css`
  - `src/components/SessionSummary.test.jsx`
  - `src/engine/sessionRunner.js`
- Engine changes (with tests):
  - Expose due review chunk overview and upcoming due calendar dates in the runner's summary state.
  - Unit tests for session start and summary payload generation.
- UI changes:
  - Create `SessionStart` card displaying due review chunks, current family to study, and a single "Begin" action.
  - Update `SessionSummary` to show a visual 5-rung ladder for each mastered family and a calendar strip listing next review dates.
- Verification in browser:
  - Load the app: verify `SessionStart` card appears first. Click "Begin".
  - Complete the session: verify summary card displays ladder rungs and calendar dates cleanly.

### Ticket 4: Worked Example with Stepwise Reveal and Animated Stem-Ending Tiles
- Goal: Replace static paradigm table with step-by-step segmenting, animated stem-plus-ending tile swap, and self-explanation reflection.
- Files touched:
  - `src/components/WorkedExample.jsx` (new)
  - `src/components/WorkedExample.css` (new)
  - `src/components/StemEndingTile.jsx` (new)
  - `src/components/StemEndingTile.css` (new)
  - `src/ProductionScreen.jsx`
- Engine changes (with tests): None (presentation state is UI-only).
- UI changes:
  - Build `StemEndingTile` component supporting joined and separated states with CSS transition animations.
  - Build `WorkedExample` component with "Next step" reveal button, stepping through paradigm rows one by one.
  - Add self-explanation prompt and text area on table completion before continuing.
- Verification in browser:
  - Trigger a worked example (session 1 or new chunk). Click "Next step" through all persons. Verify tile animation executes smoothly. Enter reflection text and click continue.

### Ticket 5: Hint Fading in Guided Practice (Derived)
- Goal: Implement adaptive hint fading in guided practice as a derived pure function of chunk state and attempt count, leaving `progress.json` untouched.
- Files touched:
  - `src/engine/hintFading.js` (new)
  - `src/engine/hintFading.test.js` (new)
  - `src/ProductionScreen.jsx`
- Engine changes (with tests):
  - No schema changes to `progress.json`.
  - Implement pure helper function `deriveHintText({ production_phase, streak_count, attemptCount, stimulus })`.
  - Unit tests verifying: full rule on streak 0, person and family cue on streak 1+, recovery hint on retry, and null on independent phase.
- UI changes:
  - Guided practice calls `deriveHintText(...)` and displays the blank ending tile with the derived hint text.
- Verification in browser:
  - Complete guided practice drills: observe the hint text fading over successive correct answers, and restoring on a retry.

### Ticket 6: Independent Recall and Recognition with Docked Feedback Strip
- Goal: Re-skin independent recall and vocabulary recognition onto focused cards with a bottom-docked commit-then-reveal feedback strip.
- Files touched:
  - `src/components/FeedbackStrip.jsx` (new)
  - `src/components/FeedbackStrip.css` (new)
  - `src/RecognitionScreen.jsx`
  - `src/ProductionScreen.jsx`
- Engine changes (with tests): None.
- UI changes:
  - Render stimulus word in prominent serif display type.
  - Remove distraction elements from card body.
  - On submit, render `FeedbackStrip` docked at the bottom of the card with color-coded feedback (calm green for success, warm amber for miss) without layout jump.
- Verification in browser:
  - Test both correct and incorrect submissions on recognition and production screens; verify feedback strip appears cleanly beneath the card and Enter key submits without page reload.

### Ticket 7: Tap-to-Tag Role-Tagging Screen (Single Verb Token Split)
- Goal: Replace four text inputs with interactive sentence tokens where the verb is presented as one token that the learner splits at the letter boundary before tagging.
- Files touched:
  - `src/RoleTaggingScreen.jsx`
  - `src/RoleTaggingScreen.css`
  - `src/RoleTaggingScreen.test.jsx`
- Engine changes (with tests): None (boundary split maps directly to `{ subject, stem, ending, object }`).
- UI changes:
  - Render sentence with intact verb token `[ hablo ]`.
  - Interactive boundary tap or divider drag splits the verb token into stem and ending halves.
  - Role palette allows assigning Subject, Stem, Ending, and Object.
  - Highlight misidentified roles or incorrect split boundaries upon incorrect submission.
- Verification in browser:
  - Complete a role-tagging drill by splitting the verb and tagging tokens. Submit and verify correct detection. Test deliberate wrong boundaries (for example: `hab` / `lo`) to verify diagnostic error feedback.

### Ticket 8: Named Misconception Repair Panel Redesign
- Goal: Redesign repair panel to prominently name misconceptions, show stem-ending tiles with the wrong ending struck through, and offer immediate retest.
- Files touched:
  - `src/components/MisconceptionRepair.jsx`
  - `src/components/MisconceptionRepair.css`
  - `src/components/MisconceptionRepair.test.jsx`
- Engine changes (with tests): None.
- UI changes:
  - Header naming the specific misconception in warm amber.
  - Side-by-side comparison displaying the mistaken attempt struck through next to the correct notional machine tiles.
  - Single primary button: "Try a similar one" to immediately retest.
- Verification in browser:
  - Enter a known false cognate or cross-family ending. Verify repair screen appears with struck-through tile, clear rule explanation, and working retest button.

---

## 6. Risks and What to Explicitly Leave Out

### Identified Risks and Mitigations
1. Animation Distraction:
   - Risk: Gratuitous or bouncy animations increase extraneous cognitive load.
   - Mitigation: Restrict animations strictly to two purposeful transitions: (1) the stem-plus-ending tile swap (250ms ease-out) and (2) the card slide transition between drills (200ms ease-out).
2. Open-Ended Review Fatigue on Repeated Misses:
   - Risk: SPEC explicitly accepts open-ended review sessions until the gate clears as a known limitation, but consecutive misses on shaky material could cause learner frustration.
   - UI-Only Mitigation: Keep the engine review gate strictly compliant with SPEC (no arbitrary streak resets or ladder modifications). In the UI, after two consecutive misses on the same chunk in review, render a supportive pedagogical checkpoint card offering a focused worked-example refresher or an optional "Take a break" action that gracefully saves progress to `progress.json` without penalty, allowing the learner to rest working memory.
3. Sentence Tokenization Brittleness:
   - Risk: Splitting sentences into tokens could fail if punctuation or irregular word order appears.
   - Mitigation: The v1 content pool consists exclusively of regular present-tense sentences with standardized subject-verb-object structures. Tokens are generated from known stimulus keys (`stimulus.parts`).

### Explicit Non-Goals (What to Leave Out)
- No Duolingo-style gamification: No XP, no coin shop, no streak fire icons, no leaderboards, no hearts or lives.
- No automated NLP grading: Self-explanation text boxes are purely reflective for the learner; no AI or fuzzy grading logic.
- No Tailwind or shadcn installation: Avoid new dependencies and build pipeline bloat; rely on CSS tokens.
- No audio playback or microphone speech recognition: Keep scope tight for the v1 grammar and reading proof of concept.
- No irregular verbs, past tenses, or subjunctive forms: Strictly limited to regular present-tense `-ar`, `-er`, and `-ir` verbs.
- No user accounts, authentication, or cloud databases: Strictly a local personal tool reading and writing `progress.json`.
