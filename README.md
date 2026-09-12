# Spanish Learning App (Meta-Learning & Pedagogy Engine)

A personal, single-user web application designed for learning Spanish vocabulary and regular present-tense verb conjugation. Built on core cognitive-science principles, the application runs a subject-agnostic **pedagogy engine** that guides the learner through deliberate practice cycles (such as worked examples, scaffolded retrieval, and independent recall) and catches misconceptions by name. To keep the learning process transparent, every screen features a Technique Transparency Badge identifying and explaining the specific pedagogical method in play.

**Repository:** [github.com/guyguy2/learning_app](https://github.com/guyguy2/learning_app)

## Run Instructions

### Prerequisites
- **Node.js** (v18+ recommended)

### Installation
Install the project dependencies using npm:
```bash
npm install
```

### Development Server
Start both the Vite frontend and Express backend concurrently:
```bash
npm run dev
```
- **Vite Frontend**: [http://localhost:5173](http://localhost:5173) (automatically proxies `/api` calls to the backend). If 5173 is taken, Vite picks the next free port, so the URL printed in the terminal is the authoritative one.
- **Express Backend**: `http://localhost:3001`
- **Ports**: Both default to backend port 3001 and can be overridden with environment variables:
  - `server/index.js` listens on `SERVER_PORT`, else `PORT`, else 3001.
  - `vite.config.js` points the `/api` proxy at `SERVER_PORT`, else `BACKEND_PORT`, else 3001.
  - Setting `SERVER_PORT` moves both together, for example `SERVER_PORT=4001 npm run dev`.
- **User Progress**: The local file `progress.json` is generated at the project root to store runtime progress. This file is gitignored.

### Running Tests
Execute the Vitest test suite:
```bash
npm test
```
The suite has 27 test files and 237 tests covering the pedagogy engine (`src/engine/`, including the `sessionRunner` state machine), the subject plugins and a contract conformance suite every subject must pass (`src/subjects/`), the shared React components and screens, the production Desk UI (`src/desk/`), the `useSessionRunner` hook and POC variants (`src/poc/`), and the server seed scenarios and per-subject progress files (`server/`).

## UI

The production interface uses the **Desk** design, located in `src/desk/`. It adopts a tactile Skola-style physical index-card metaphor: warm paper cards on a dotted desk, serif display typography for target vocabulary, morphological paper slips for stem and ending, commit-then-reveal docked feedback strips, a tap-to-tag sentence interface with clickable verb boundaries for role tagging, and wooden five-rung spaced repetition ladders on the summary card.

The production UI incorporates two interactions borrowed from the Machine design:
1. In guided practice, the learner types the ending directly into the blank ending tile next to the stem (typing the full form is also accepted).
2. Primary action buttons display their keyboard shortcut as a small keycap (such as Enter).

## Design POC mode

The production app renders the Desk UI (`src/desk/DeskApp.jsx`) by default. To compare UI directions side by side, append `?poc=1` to the URL (for example, `http://localhost:5173/?poc=1`). This opens the tabbed comparison shell (`src/poc/PocShell.jsx`) where **Current** is the legacy app, and **Desk**, **Editorial**, and **Machine** are competing UI directions over the same pedagogy engine. The Progress buttons in the top bar reset or seed `progress.json` (fresh, mid, review-due) so every variant can be compared from the same starting point.

See [docs/design/poc-comparison.md](docs/design/poc-comparison.md) for what each variant does, how to reach every screen, screenshots, and a checklist for picking one. The variant contract is in [src/poc/variants/README.md](src/poc/variants/README.md).

## How a session works

Each session is assembled as **review first, then new content** (`buildSession` in `src/engine/session.js`).

### Review block
- Opens with chunks (verb families `-ar` / `-er` / `-ir`) whose calendar interval has elapsed: mastered chunks with `next_due_date <= today`.
- Intervals follow a fixed ladder of **1 / 3 / 7 / 14 / 30** days (`LADDER_DAYS` in `src/engine/review.js`).
- Due chunks are ordered **most-overdue-first** and capped (default 8).
- A review is cleared by re-passing the advancement gate: **3 correct in a row spanning at least 2 exercise types** (production and role-tagging alternate during review). Streak fields are reset on review entry so a prior mastery streak does not insta-clear.
- A clean clear advances the ladder one step; any miss during that review resets the ladder to day 1.

### New content
- **Session one** is blocked: one family fully before the next (`ar` then `er` then `ir`).
- **Session two onward** interleaves drills across introduced-but-unmastered families, favoring the lowest streak so attention rotates after progress or a miss.
- A family's chunk is mastered when it passes the gate: **3 correct in a row spanning >=2 of the three exercise types** (recognition, production, role-tagging). Any wrong answer resets the streak. Clearing the gate for the active chunk ends the new-content phase for that session (session summary).
- **Vocab recognition** builds the word mastery that unlocks conjugation drills (production/role-tagging need mastered family verbs). While family verbs remain unmastered, recognition draws from those verbs; once they are mastered, recognition pivots to other vocabulary (nouns/adjectives) so false-cognate words keep surfacing.

### Misconceptions
A wrong answer that matches a seeded distractor (false cognate, or overgeneralizing a conjugation ending) triggers a named repair panel: it explains the specific error, re-shows the correct form, then re-tests on a similar item.

### Technique transparency
Every screen can show a small badge naming the cognitive-science technique in play - Retrieval practice, Notional machine, Chunking, Spaced repetition, Misconception repair - see `src/screenTechniques.js`. Each subject declares its badges in its `techniques` map; the programming subject adds Faded worked example for its completion drills.

## Known limitations (v1 PoC)

- False-cognate recognition surfaces only after a family's verbs are mastered (verbs are prioritized first so conjugation can unlock).
- The review cap is expressed per chunk, and only three chunks (`ar`, `er`, `ir`) exist in v1, so the cap rarely bites.

## Architecture

The project maintains a strict separation between the user interface, backend state persistence, and pure pedagogical rules:

- **Frontend SPA (`src/`)**: A React application built with Vite that renders the interactive session flow screens. `src/main.jsx` mounts the production Desk UI (`src/desk/`, entry `DeskApp.jsx`) by default, or the design comparison shell and its variants (`src/poc/`, `PocShell.jsx` and `src/poc/variants/`) with `?poc=1`. `?subject=<id>` picks the subject the Desk UI teaches (for example `http://localhost:5173/?subject=programming`); a missing or unknown id means Spanish. All UIs, including the legacy `src/App.jsx`, drive sessions through the `useSessionRunner` hook (`src/poc/useSessionRunner.js`), a thin React wrapper over the pure `sessionRunner` engine that holds its state and loads and saves progress via `/api/progress`.
- **Backend Server (`server/`)**: An Express server that handles loading and persistence of user states to `progress.json` (`GET`/`POST /api/progress`), plus reset and seed endpoints (`POST /api/progress/reset`, `POST /api/progress/seed`) used by the POC shell. `?subject=<id>` on `/api/progress` stores any subject other than Spanish in its own `progress.<id>.json`.
- **Subjects (`src/subjects/`)**: Each subject is a plugin behind one contract: its exercise types and their rotation, its chunks, and per exercise type `nextStimulus`, `apply`, `grade`, `feedback`, `expectedAnswer`, and optional `repairFor` for named misconceptions, plus its content with a `validate` function, its technique badges, and its Desk cards (`ui`). Spanish (`src/subjects/spanish/`) is the default; a tiny JavaScript subject (`src/subjects/programming/`) proves the seam. See [src/subjects/README.md](src/subjects/README.md).
- **Static Content Pools (`content/<subject>/`)**: Static JSON data files per subject:
  - `content/spanish/`: `vocab.json`, `distractors.json`, `misconceptions.json`, `worked_examples.json`
  - `content/programming/`: `items.json`, `distractors.json`, `misconceptions.json`, `worked_examples.json`
- **Pedagogy Engine (`src/engine/`)**: A collection of pure, side-effect-free functions that calculate state transitions based on user attempts. They are decoupled from the DOM, HTTP requests, and the filesystem, and hold no subject knowledge. Each attempt goes through the state transition function in `wordMastery.js`, which dispatches to the subject's exercise for the attempt type:
  `applyAttempt(progressState, attempt, contentPool, today, subject) -> { progress, next }`

  The whole session loop lives in `sessionRunner.js`, a pure, framework-free state machine (`createRunnerState`, `begin`, `submitAttempt`, `commitProgress`, `retry`, `nextSession`). Each entry point takes the subject as its last parameter (default Spanish). It has no React, DOM, clock, or HTTP dependencies. React access goes through the thin `useSessionRunner` hook described above.

### Engine Modules
- **`sessionRunner.js`**: Pure session state machine: builds the session, asks the subject for each stimulus, applies attempts, routes wrong answers to misconception repair, and moves between review, new content, and the summary.
- **`session.js`**: `buildSession` assembles a session as a review block first, then new content.
- **`sessionPlan.js`**: `selectChunkForSession` picks the next chunk in the subject's order (blocked in session one, interleaved from session two).
- **`review.js`**: Spaced-repetition ladder (`LADDER_DAYS`), due-chunk selection, and ladder advance/reset.
- **`reviewGate.js`**: Cross-session review as a re-run of the advancement gate (streak reset on entry, clear check, cycling the subject's review types).
- **`advancement.js`**: `checkGate`, the mastery gate (3 correct in a row spanning at least 2 exercise types).
- **`chunkProgress.js`**: Shared chunk helpers: fresh progress, the gate streak update, and worked-example acknowledgement.
- **`itemMastery.js`**: Shared item mastery (2 correct in a row, any miss resets, no decay).
- **`wordMastery.js`**: `applyAttempt`, dispatching an attempt to the subject's exercise.
- **`misconception.js`**: `getMisconception`, the catalog lookup used by every subject's repair.

The Spanish modules that used to live here (`conjugation.js`, `roleTagging.js`, `newContentSchedule.js`, the distractor matcher) are now in `src/subjects/spanish/`.

## Exercise Types

The application implements three primary exercise patterns based on cognitive science:
1. **Recognition**: Simple retrieval and translation validation.
2. **Production (I-do/We-do/You-do)**: A scaffolded sequence starting with Worked Examples (I-do), progressing through Guided Practice/Scaffolded Retrieval (We-do), and concluding with Independent Recall (You-do).
3. **Role-Tagging**: Grammatical role identification directly in Spanish sentences.

## Content Scope

The curriculum is focused entirely on **regular present-tense conjugation** of verbs ending in `-ar`, `-er`, and `-ir` along with fundamental vocabulary.
