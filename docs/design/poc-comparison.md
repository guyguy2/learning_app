# Design POC comparison: Desk, Machine, Editorial

Three competing UI directions for the same pedagogy engine, shown side by side in a tabbed shell next to the current app. Every variant drives the same session through `src/poc/useSessionRunner.js`, so differences you see are presentation only: the drills, gates, ladder, and misconception matching are identical.

## How to run

```bash
npm install
npm run dev
```

- Vite serves the shell at http://localhost:5173 (if 5173 is taken, Vite picks the next free port and prints it).
- The Express server listens on http://localhost:3001 and writes `progress.json` at the repo root (gitignored).
- `npm test` runs the whole suite, including each variant's own tests in `src/poc/variants/<id>/`.

## Switching tabs

The top bar lists **Current**, **Template (raw)**, **Desk**, **Editorial**, **Machine**. Current is the production app (`src/App.jsx`); Template is the raw contract harness; the other three are the design variants. The active tab is remembered in `localStorage` (`poc_active_tab`). Switching tabs unmounts the previous variant, so each tab starts from the saved progress, not from where another tab left off.

Variants are discovered automatically from `src/poc/variants/*/index.jsx` (see `src/poc/variants/README.md` for the contract).

## Progress controls

The buttons on the right of the top bar replace `progress.json` through `/api/progress/reset` and `/api/progress/seed`, then remount the active tab.

| Button | Resulting state | What you see first |
| --- | --- | --- |
| Reset | Default progress, session 1, nothing mastered | Recognition drills on -ar verbs |
| Seed: fresh | Same as Reset | Recognition drills on -ar verbs |
| Seed: mid | Session 2, all -ar verbs mastered as words, -ar chunk in the `guided` production phase | Guided production on hablar (yo) |
| Seed: review-due | Session 3, -ar mastered and due yesterday (ladder step 0), -er verbs mastered as words and -er chunk `guided` | Review indicator, then production and role tagging on -ar; after the review gate clears, new -er content |

### Reaching screens the seeds do not cover

- **Worked example.** No seed puts a chunk in the `worked_example` phase with mastered verbs, so the I-do screen is unreachable from the buttons. After **Seed: mid**, run this and then switch to another tab and back:

  ```bash
  curl -s localhost:3001/api/progress \
    | jq '.chunks |= map(if .id=="ar" then .production_phase="worked_example" else . end)' \
    | curl -s -X POST -H 'Content-Type: application/json' -d @- localhost:3001/api/progress
  ```

- **Named misconception.** The production drill picks the verb as `mastered[streak % 27]` and the person as `PERSONS[streak % 6]`. To get trabajar / nosotros, set the -ar chunk's `streak_count` to 3 the same way (`.streak_count=3 | .types_in_streak=[]`), begin, and answer `trabajemos`. The panel names "Overgeneralizing -er endings onto -ar verbs". hablar with tú or él can never come up in the mid rotation (27 mastered verbs and 6 persons never align there); estudiar / ellos comes up at streak 29.

- **Generic miss.** Answer any production drill with a nonsense form such as `x`.

## The variants

### Desk

Warm paper index cards on a dotted desk, Playfair Display headings, and stem and ending shown as two physical paper slips. The worked example reveals the paradigm one row at a time while the ending slip swaps, then asks for an ungraded self-explanation. Feedback is a docked strip under the card after you commit. Role tagging uses a numbered role palette (keys 1 to 4), tappable subject and object cards, and a single verb token with a split line between every letter. The summary draws a wooden five-rung ladder with the current rung marked by a brass peg.

Known gaps: the technique badge is a collapsed control in the top bar and easy to miss. The role tagging heading says "Roles of Variables" while its badge says "Chunking". The "Mental model aligned" badge also appears after a retest that followed a generic miss, and it hides itself after 3.5 seconds. The paper background stops short of the bottom of tall windows.

Screenshots (`docs/design/screenshots/desk/`): [session start](screenshots/desk/01-session-start.png), [worked example](screenshots/desk/02-worked-example-start.png), [stepwise reveal](screenshots/desk/03-worked-example-stepwise.png), [self-explanation](screenshots/desk/04-worked-example-self-explanation.png), [guided](screenshots/desk/05-guided-attempt0.png), [independent](screenshots/desk/06-independent.png), [role tagging split](screenshots/desk/07-role-tagging-split.png), [generic miss](screenshots/desk/08-generic-miss.png), [misconception repair](screenshots/desk/10-misconception-repair.png), [mental model aligned](screenshots/desk/11-mental-model-aligned.png), [summary ladder](screenshots/desk/12-summary-ladder.png), [review start](screenshots/desk/13-review-session-start.png), [review drill](screenshots/desk/14-review-drill.png), [after review gate](screenshots/desk/15-after-review-gate.png), [summary after review](screenshots/desk/16-summary-after-review.png).

### Machine

A lab terminal: IBM Plex Mono, keycap hints on every action, and the notional machine as a stem block plus ending block that detach and swap. The worked example builds a full paradigm table row by row. In guided practice you type only the ending into a blank block next to the stem (typing the full form is also accepted). Misconception repair re-runs the machine with the wrong ending struck through, and a retest that passes prints a "Mental model aligned" confirmation that stays until the next answer. Review mode adds a banner across the top. The summary uses a horizontal five-stop track with "Step n of 5" and the next due date.

Known gaps: the most keyboard-heavy of the three, and dense for a first-time learner. Most screenshots come from the original worker session, several in dark mode, and some are near-duplicates (the 03 and 10 series). The generic-miss capture was retaken after the label fix.

Screenshots (`docs/design/screenshots/machine/`): [session start](screenshots/machine/01-session-start.png), [recognition](screenshots/machine/02-recognition.png), [worked example](screenshots/machine/03-worked-example.png), [reflection](screenshots/machine/04-worked-example-reflection.png), [guided](screenshots/machine/05-guided-practice.png), [independent](screenshots/machine/06-independent-practice.png), [role tagging](screenshots/machine/07-role-tagging.png), [role tagging tagged](screenshots/machine/07-role-tagging-tagged.png), [misconception repair](screenshots/machine/08-misconception-repair-named.png), [mental model aligned](screenshots/machine/08-mental-model-aligned.png), [generic miss](screenshots/machine/09-misconception-repair-generic.png), [review mode](screenshots/machine/10-review-mode.png), [summary](screenshots/machine/11-session-summary.png).

### Editorial

Near-monochrome, reading-first: Source Serif headings, generous whitespace, and one ink accent per verb family. The worked example lays the paradigm out as typeset rows before a reflection box. Drills are single centred cards with a hairline stem and blank tile. Repair reads like a margin note: the diagnosed misconception is set as a headline over the struck ending. The summary is a "Printed Dispatch" with rung boxes marked Done / Current / Pending, a mini review calendar, and the next due date for each family.

Known gaps: the calmest direction, but the notional machine is the least visual of the three (text rows rather than moving parts). The dark-mode summary capture predates the fixes. The "Mental model aligned" note appears under the next drill card and auto-hides after 4 seconds.

Screenshots (`docs/design/screenshots/editorial/`): [session start](screenshots/editorial/01_session_start.png), [recognition](screenshots/editorial/02_recognition.png), [worked example](screenshots/editorial/03_worked_example.png), [guided](screenshots/editorial/04_guided_practice.png), [independent](screenshots/editorial/05_independent_recall.png), [role tagging](screenshots/editorial/06_role_tagging.png), [misconception repair](screenshots/editorial/07_repair_panel.png), [review mode](screenshots/editorial/08_review_mode.png), [summary](screenshots/editorial/09_session_summary.png), [summary dark](screenshots/editorial/10_session_summary_dark.png), [generic miss](screenshots/editorial/11_generic_miss.png), [mental model aligned](screenshots/editorial/12_mental_model_aligned.png).

## Verification (2026-09-11)

Each variant was walked in the browser against its own server state: session start, Begin, worked example (stepwise reveal, self-explanation, Continue), guided, independent, role tagging, summary; a named misconception (trabajar / nosotros answered `trabajemos`) with retest; a generic miss; and a full review-due session. For all three, after the review the summary showed -ar at rung index 1 (3 days) with next due 2026-09-14 and -er at rung index 0 with 2026-09-12, identical to `progress.json`. The off-by-one date in an earlier Editorial capture did not reproduce; that capture was replaced.

Fixes made during integration:

- Desk: unit test fixtures now match the real stimulus shape; named repairs are labelled "Misconception Repair"; the role-tagging success strip no longer prints `[object Object]`; person keys such as `el_ella_usted` show as "él/ella/usted"; generic misses no longer show the misconception technique badge.
- Editorial: the review success strip no longer shows the answer to the drill now on screen; "Mental model aligned" now appears in new-content sessions; generic misses no longer show the misconception technique pill.
- Machine: generic misses are labelled "Correction" instead of "Misconception Repair".

## How to pick

Tie each question to the pedagogy the engine is built on:

- [ ] **Does the notional machine read at a glance?** In the worked example and the repair panel, can you see "stem stays, ending swaps" without reading a sentence? (Desk: paper slips; Machine: detaching blocks and table; Editorial: typeset rows.)
- [ ] **Is feedback commit-then-reveal?** The answer must not be visible before you submit, and after a miss the correction must come in its own panel rather than a toast. Check the review strip on the second and third review drills.
- [ ] **Is role tagging a real split task?** The verb must arrive as one token and you must choose the letter boundary yourself. All three pass today; judge which makes the boundary easiest to find without giving it away.
- [ ] **Does the misconception repair name the error?** Named repair should show the misconception name, the explanation, the struck wrong ending, and "Try a similar one"; a generic miss should read as a plain correction.
- [ ] **Is the ladder legible?** On the summary, can you tell which rung you are on and when the family is next due, without doing arithmetic?
- [ ] **Does it stay calm over a long session?** Walk a full review-due session in each tab and note which one you would open again tomorrow.

## Runner contract gaps

Things the shared `useSessionRunner` contract does not give variants today. None of them block a walkthrough; each variant works around them.

1. **Hint fading by `attemptCount` never shows its second stage.** Any miss opens the repair panel, `onRetry()` resets `attemptCount` to 0, and after a guided miss the engine hands back an independent-phase stimulus with no hint. The "attempt 1 or more" hint only exists while the repair panel covers the drill.
2. **`feedback === 'correct'` behaves differently by mode.** In new-content mode the runner clears it as soon as it advances; in review mode it stays set while the next drill is shown. Variants that key UI off it either never show it (new mode) or show it on the wrong card (review mode). Variants should track their own last attempt.
3. **The worked example is unreachable from the seeds** (see above). The session-2 branch that introduces a worked example needs a chunk in `worked_example` with mastered verbs, and no seed produces that.
4. **Two of the four seeded -ar distractors cannot be triggered** from the mid rotation (hablar / tú and hablar / él).
5. **`today` is the UTC date** (`toISOString().slice(0, 10)`) while the review-due seed computes "yesterday" from local time. No mismatch showed up in this run, but near midnight outside UTC the two can disagree by a day.
6. **Role-tagging repairs carry `correctForm: null`,** so variants build their own "expected parts" text from the stimulus.
