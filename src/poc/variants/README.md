# Design POC Variants Guide

Welcome to the POC variant workspace! This directory holds competing UI/UX design variants for the Spanish learning application. Each variant implements a distinct visual presentation and user experience for the exact same underlying cognitive-science learning flow.

---

## 🚀 Quick Start for Variant Developers

To create a new variant:

1. **Create a new folder** under `src/poc/variants/<id>/` (e.g., `src/poc/variants/minimal/`).
2. **Create the entry file** `src/poc/variants/<id>/index.jsx`.
3. **Default-export** an object with `{ id, name, description, Component }`.
4. **Never edit shared files!** Variants are automatically discovered at runtime via Vite's `import.meta.glob('./variants/*/index.jsx', { eager: true })` in `src/poc/registry.js`. You never need to touch `registry.js`, `PocShell.jsx`, or `App.jsx`.
5. Check `src/poc/variants/_template/` for a minimal reference implementation displaying all state and raw trigger buttons.

---

## 🎨 CSS Scoping Rules (CRITICAL)

To prevent stylesheet collisions between competing variants:
- Every variant **MUST** wrap its root JSX element in a container with class `variant-<id>`.
  ```jsx
  export default function MyVariantComponent() {
    const runner = useSessionRunner()
    return (
      <div className="variant-myvariant">
        {/* Your entire UI here */}
      </div>
    )
  }
  ```
- All CSS rules in your variant stylesheet **MUST** be scoped under `.variant-<id>`.
  ```css
  /* src/poc/variants/myvariant/styles.css */
  .variant-myvariant {
    /* styles */
  }
  .variant-myvariant .card {
    /* styles */
  }
  ```
- You may use design tokens defined in `src/theme.css` (e.g. `var(--primary)`, `var(--surface)`, `var(--text)`, `var(--radius)`, `var(--border)`, `var(--shadow)`), or introduce your own design system scoped strictly under `.variant-<id>`.

---

## ⚙️ Hook Contract: `useSessionRunner`

Each variant component receives **no props**. It calls `useSessionRunner({ autoStart })` to coordinate with the pedagogy engine, persistence layer, and misconception repair subsystem.

```javascript
import { useSessionRunner } from '../../useSessionRunner.js'

function MyVariant() {
  const {
    status,             // 'loading' | 'error' | 'ready' | 'running' | 'summary'
    error,              // string | null
    today,              // string YYYY-MM-DD
    progress,           // full progress state object from /api/progress
    plan,               // { reviewChunkIds, newChunkId, phase } | null
    begin,              // () => void - starts session when autoStart=false
    mode,               // 'review' | 'new' | null
    exerciseType,       // 'recognition' | 'production' | 'role-tagging' | null
    stimulus,           // current drill stimulus object | null
    feedback,           // 'correct' | error string | null
    repair,             // { misconception, correctForm, notionalMachine, pendingStimulus, pendingType } | null
    reviewQueue,        // string[] - array of chunk IDs pending review
    reviewedCount,      // number of review chunks completed in this session
    masteredChunkId,    // string | null - chunk newly mastered this session (e.g. 'ar')
    attemptCount,       // number of attempts on the CURRENT stimulus (resets to 0 when stimulus changes)
    onAttempt,          // (attempt) => Promise<void> - submit user attempt
    onRetry,            // () => void - dismiss repair screen and retry pending stimulus
    onStartNext,        // () => Promise<void> - advance to next session
  } = useSessionRunner({ autoStart: true })
  ...
}
```

### Hook Parameters
- `autoStart` (boolean, default: `true`):
  - When `true`: The runner automatically begins the session once `/api/progress` loads (`status` transitions from `'loading'` directly to `'running'` or `'summary'`).
  - When `false`: Once `/api/progress` loads, `status` becomes `'ready'`. `plan` is populated with `{ reviewChunkIds, newChunkId, phase }`. This allows variants to render a custom **Session Start / Overview Card** before the learner begins. The variant starts drilling by calling `begin()`.

### Lifecycle Statuses (`status`)
1. `'loading'`: Fetching `/api/progress`. Render a loading indicator.
2. `'error'`: An error occurred loading progress. `error` contains the message.
3. `'ready'`: Progress loaded and `autoStart: false`. Render session plan card with `begin()` action.
4. `'running'`: Session is actively in progress. Render the active exercise or misconception repair panel.
5. `'summary'`: Session is complete. Render summary card with `reviewedCount`, `masteredChunkId`, and call `onStartNext()`.

### Attempt Counter (`attemptCount`)
`attemptCount` tracks how many attempts have been made on the **current** stimulus:
- Resets to `0` whenever a new stimulus is loaded or retried.
- Increments by `1` on each call to `onAttempt(attempt)`.
- Variants can use `attemptCount` for **scaffolded hint fading**:
  - `attemptCount === 0`: Hints hidden or collapsed.
  - `attemptCount >= 1`: Progressive hints revealed to scaffold struggling learners.

---

## 📦 Stimulus Shapes

The `stimulus` object returned by the hook takes one of the following shapes depending on `exerciseType` and drill phase:

### 1. Recognition (`exerciseType === 'recognition'`)
Vocabulary retrieval drill.
```json
{
  "type": "recognition",
  "word": {
    "id": "hablar",
    "word": "hablar",
    "meaning": "to speak; to talk",
    "pos": "verb",
    "family": "ar"
  }
}
```

### 2. Production - Worked Example (`exerciseType === 'production'`, `stimulus.phase === 'worked_example'`)
Initial "I do" screen presenting the notional machine and paradigm table.
```json
{
  "type": "production",
  "phase": "worked_example",
  "chunkId": "ar",
  "workedExample": {
    "family": "ar",
    "notional_machine": "Regular -ar verbs swap the infinitive ending -ar for person endings: -o, -as, -a, -amos, -áis, -an.",
    "paradigm": [
      { "person": "yo", "swap": "-o" },
      { "person": "tú", "swap": "-as" },
      { "person": "él/ella/usted", "swap": "-a" },
      { "person": "nosotros/nosotras", "swap": "-amos" },
      { "person": "vosotros/vosotras", "swap": "-áis" },
      { "person": "ellos/ellas/ustedes", "swap": "-an" }
    ],
    "endings": {
      "yo": "o",
      "tu": "as",
      "el_ella_usted": "a",
      "nosotros": "amos",
      "vosotros": "ais",
      "ellos_ellas_ustedes": "an"
    }
  }
}
```

### 3. Production - Guided Practice (`exerciseType === 'production'`, `stimulus.phase === 'guided'`)
"We do" scaffolded retrieval drill with stem/ending hints.
```json
{
  "type": "production",
  "phase": "guided",
  "chunkId": "ar",
  "verb": {
    "id": "hablar",
    "word": "hablar",
    "meaning": "to speak; to talk"
  },
  "person": "yo",
  "expectedForm": "hablo",
  "hint": "Stem: \"habl-\", ending for yo: \"-o\""
}
```

### 4. Production - Independent Recall (`exerciseType === 'production'`, `stimulus.phase === 'independent'`)
"You do" retrieval drill with hints removed (`hint: null`).
```json
{
  "type": "production",
  "phase": "independent",
  "chunkId": "ar",
  "verb": {
    "id": "hablar",
    "word": "hablar",
    "meaning": "to speak; to talk"
  },
  "person": "yo",
  "expectedForm": "hablo",
  "hint": null
}
```

### 5. Role Tagging (`exerciseType === 'role-tagging'`)
Grammatical sentence analysis drill.
```json
{
  "type": "role-tagging",
  "chunkId": "ar",
  "verb": {
    "id": "hablar",
    "word": "hablar",
    "meaning": "to speak; to talk"
  },
  "person": "yo",
  "sentence": "yo hablo el libro",
  "parts": {
    "subject": "yo",
    "stem": "habl",
    "ending": "o",
    "object": "el libro"
  }
}
```

---

## 🎯 Attempt Shapes (`onAttempt(attempt)`)

Pass the following payload shapes to `onAttempt`:

### 1. Recognition Attempt
```javascript
onAttempt({
  type: 'recognition',
  wordId: stimulus.word.id,
  correct: boolean,         // evaluate against stimulus.word.meaning
  given: string             // learner's input string
})
```
*Note on grading:* You may accept any synonym separated by `;` or `,` in `stimulus.word.meaning`.

### 2. Production - Worked Example Acknowledgment
To advance from worked example to guided practice:
```javascript
onAttempt({
  type: 'production',
  chunkId: stimulus.chunkId,
  action: 'worked_example_ack'
})
```

### 3. Production - Conjugation Drill Attempt
```javascript
onAttempt({
  type: 'production',
  chunkId: stimulus.chunkId,
  wordId: stimulus.verb.id,
  person: stimulus.person,
  correct: boolean,         // learner's input === stimulus.expectedForm
  given: string             // learner's input string
})
```

### 4. Role Tagging Attempt
```javascript
onAttempt({
  type: 'role-tagging',
  chunkId: stimulus.chunkId,
  wordId: stimulus.verb.id,
  person: stimulus.person,
  correct: boolean,         // all 4 roles match stimulus.parts
  given: {
    subject: string,
    stem: string,
    ending: string,
    object: string
  }
})
```

---

## 🛠️ Misconception Repair Shape (`repair`)

When a learner misses an item, `repair` is non-null. If the wrong answer matches a seeded distractor, `repair.misconception` contains the diagnosed error:

```json
{
  "misconception": {
    "id": "false_cognate_embarazada",
    "name": "False cognate: embarazada",
    "explanation": "Embarazada looks like 'embarrassed', but in Spanish it actually means 'pregnant'. To express embarrassed, use 'avergonzado' or 'avergonzada'."
  },
  "correctForm": "pregnant",
  "notionalMachine": "Regular -ar verbs swap ...",
  "pendingStimulus": { "...new re-test stimulus object..." },
  "pendingType": "recognition"
}
```

If the miss did **not** match a named misconception, `repair.misconception` is `null` (generic miss), while `correctForm`, `pendingStimulus`, and `pendingType` are still populated.

When the learner acknowledges the repair or clicks "Try again", call `onRetry()`. The runner will activate `pendingStimulus` and reset `attemptCount` to `0`.

---

## 🔍 Technique Badges

To maintain cognitive transparency, you can import and show technique metadata:
```javascript
import { techniqueFor } from '../../screenTechniques.js'
// techniqueFor('recognition') -> { techniqueName: 'Retrieval practice', explanation: '...' }
// techniqueFor('production')  -> { techniqueName: 'Notional machine', explanation: '...' }
// techniqueFor('role-tagging') -> { techniqueName: 'Roles of variables', explanation: '...' }
// techniqueFor('repair')       -> { techniqueName: 'Misconception repair', explanation: '...' }
// techniqueFor('review')       -> { techniqueName: 'Spaced repetition', explanation: '...' }
```
