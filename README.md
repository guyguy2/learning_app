# Spanish Learning App (Meta-Learning & Pedagogy Engine)

A personal, single-user web application designed for learning Spanish vocabulary and regular present-tense verb conjugation. Built on core cognitive-science principles, the application runs a subject-agnostic **pedagogy engine** that guides the learner through deliberate practice cycles (such as worked examples, scaffolded retrieval, and independent recall) and catches misconceptions by name. To keep the learning process transparent, every screen features a Technique Transparency Badge identifying and explaining the specific pedagogical method in play.

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
- **Vite Frontend**: [http://localhost:5173](http://localhost:5173) (automatically proxies `/api` calls to the backend)
- **Express Backend**: `http://localhost:3001`
- **User Progress**: The local file `progress.json` is generated at the project root to store runtime progress. This file is gitignored.

### Running Tests
Execute the Vitest test suite:
```bash
npm test
```

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
Every screen can show a small badge naming the cognitive-science technique in play - Retrieval practice, Notional machine, Chunking, Spaced repetition, Misconception repair - see `src/screenTechniques.js`.

## Known limitations (v1 PoC)

- False-cognate recognition surfaces only after a family's verbs are mastered (verbs are prioritized first so conjugation can unlock).
- The review cap is expressed per chunk, and only three chunks (`ar`, `er`, `ir`) exist in v1, so the cap rarely bites.

## Architecture

The project maintains a strict separation between the user interface, backend state persistence, and pure pedagogical rules:

- **Frontend SPA (`src/`)**: A React application built with Vite that renders the interactive session flow screens.
- **Backend Server (`server/`)**: An Express server that handles loading and persistence of user states to `progress.json`.
- **Static Content Pool (`content/spanish/`)**: Static JSON data files containing vocabularies, distractors, misconceptions, and worked examples:
  - `vocab.json`
  - `distractors.json`
  - `misconceptions.json`
  - `worked_examples.json`
- **Pedagogy Engine (`src/engine/`)**: A collection of pure, side-effect-free functions that calculate state transitions based on user attempts. They are decoupled from the DOM, HTTP requests, and the filesystem. The core lifecycle is driven by the state transition function:
  `applyAttempt(state, attempt, contentPool) -> { progress, next }`

### Engine Modules
- **`wordMastery.js`**: Manages spaced retrieval and progression of vocabulary words through mastery thresholds.
- **`conjugation.js`**: Drives the scaffolded stages of conjugation production.
- **`roleTagging.js`**: Orchestrates sentence analysis and grammatical role-tagging exercises.
- **`misconception.js`**: Diagnoses user mistakes against known misconception profiles and guides targeted repairs.

## Exercise Types

The application implements three primary exercise patterns based on cognitive science:
1. **Recognition**: Simple retrieval and translation validation.
2. **Production (I-do/We-do/You-do)**: A scaffolded sequence starting with Worked Examples (I-do), progressing through Guided Practice/Scaffolded Retrieval (We-do), and concluding with Independent Recall (You-do).
3. **Role-Tagging**: Grammatical role identification directly in Spanish sentences.

## Content Scope

The curriculum is focused entirely on **regular present-tense conjugation** of verbs ending in `-ar`, `-er`, and `-ir` along with fundamental vocabulary.
