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
