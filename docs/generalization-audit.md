# Generalization Audit: Spanish Coupling in the Learning Engine

> **Status:** July 2026 design document, superseded by the subject contract in
> [`src/subjects/README.md`](../src/subjects/README.md). Kept for history; it does not
> describe the current code.

Read-only audit. Goal: catalog every place the pedagogy engine assumes Spanish /
verb-conjugation content, so a second subject can be added. No code changed.

## Summary verdict

Engine splits cleanly into two groups:

- **Subject-agnostic core** (spaced repetition, gating, session assembly, mastery
  tracking, misconception matching): generic over `chunks`/`words`/`id`/`status`.
  Reusable as-is for any subject.
- **Conjugation-specific layer** (`conjugation.js`, `roleTagging.js`,
  `newContentSchedule.js`, `sessionPlan.js`, plus 3 screen components and content
  JSON): hardcodes verb/family/person/stem-ending model. This is the part a new
  subject must replace, not extend.

Content-shape assumption baked deep: a "chunk" == a conjugation family (`ar`/`er`/`ir`),
and a "unit of production practice" == stem + ending swap. A non-conjugation subject
(e.g. vocab-only, or a totally different skill domain) cannot reuse `production` or
`role-tagging` exercise types without rewriting their stimulus generators.

---

## File-by-file classification

### Subject-agnostic (reusable as-is)

| File | Notes |
|---|---|
| `src/engine/advancement.js` | Gate-clearing on chunk `streak_count`/`types_in_streak`. Generic. |
| `src/engine/review.js` | Fixed ladder intervals, date math on `chunk.ladder_step`. Generic. |
| `src/engine/reviewGate.js` | Alternates `production <-> role-tagging` by exercise-type string — see coupling below (soft dependency on those two type names existing). |
| `src/engine/session.js` | Orchestrates review/new phases from `chunk` state. Generic. |
| `src/engine/wordMastery.js` | Recognition-drill mastery via `words[].status`/`streak_count`. Fully generic (`pos`/`family` fields it touches live in caller-supplied `vocabPool`, not hardcoded here). |
| `src/engine/misconception.js` | Matches attempts to seeded distractors by field equality. Generic string-keyed matcher; `'false_cognate'`/`'overgeneralization'` are just data values passed in by the caller, not hardcoded here. |
| `server/progressStore.js` | Generic `chunks`/`words` progress shape — **except** its `defaultProgress()` seed hardcodes 3 chunks `ar`/`er`/`ir` (see coupling below). |
| `src/components/*` (TechniqueBadge, SessionSummary, MisconceptionRepair) | Render generic props (`misconception`, `correctForm`, `notionalMachine`, counts). No subject content. |

### Subject-coupled (must change per subject)

| File | Coupling |
|---|---|
| `src/engine/conjugation.js` | Verb/family/person/stem-ending model throughout. |
| `src/engine/roleTagging.js` | Builds Spanish sentences from verb+noun+pronoun; subject/stem/ending/object role model. |
| `src/engine/newContentSchedule.js` | Recognition pool gated on `pos === 'verb'` mastery within a `family`. |
| `src/engine/sessionPlan.js` | `CHUNK_ORDER = ['ar', 'er', 'ir']` hardcoded. |
| `src/misconceptionInput.js` | Spanish person-label mapping (`tú`, `él/ella/usted`, ...) tied to `distractors.json` string format. |
| `src/App.jsx` | Wires in `content/spanish/*.json`; hardcodes `'false_cognate'`/`'overgeneralization'` attempt-type mapping; builds role-tagging incorrect-message text with `subject/stem/ending/object`. |
| `src/ProductionScreen.jsx` | UI text "Conjugate ... for ...", paradigm table with `person`/`swap` columns. |
| `src/RoleTaggingScreen.jsx` | Hardcoded role set `['subject', 'stem', 'ending', 'object']` as both UI labels and form fields. |
| `src/RecognitionScreen.jsx` | Subject-agnostic *logic* (matches `stimulus.word.meaning`), but paired 1:1 with vocab-shaped content — fine as long as new subject's items have `word`/`meaning`. |
| `content/spanish/*.json` | All four files: `vocab.json` (`pos`/`family` fields), `worked_examples.json` (`family`, `endings` per person, `paradigm`), `distractors.json` (`type: false_cognate/overgeneralization`, Spanish-specific person-label strings), `misconceptions.json` (Spanish-language explanations). |
| `server/progressStore.js` (`defaultProgress`) | Seeds exactly 3 chunks named `ar`/`er`/`ir`. |

---

## Coupling inventory (file:line)

### Verb families / conjugation endings

- `src/engine/conjugation.js:4` — `PERSONS = ['yo', 'tu', 'el_ella_usted', 'nosotros', 'vosotros', 'ellos_ellas_ustedes']`. Spanish grammatical-person set, used as the rotation driving both production and role-tagging stimulus selection.
- `src/engine/conjugation.js:14-16` — `stemOf(verbWord, family)` does `verbWord.slice(0, -family.length)`, i.e. assumes a word's stem is "whole word minus a suffix equal to the family id" (`ar`/`er`/`ir`). Only valid for regular Spanish -ar/-er/-ir verbs; breaks for irregulars and for any subject without a suffix-stripping stem model.
- `src/engine/conjugation.js:18-22` — `masteredVerbsForFamily` filters vocab by `pos === 'verb' && family === chunkId`. Assumes vocab items carry a `pos`/`family` taxonomy specific to verb conjugation.
- `src/engine/conjugation.js:24-52` — `getNextProductionStimulus`: builds a stimulus from `workedExample.endings[person]` + `stem`, i.e. the entire production-drill content model is "stem + person ending".
- `src/engine/sessionPlan.js:1` — `CHUNK_ORDER = ['ar', 'er', 'ir']`. Session-chunk sequencing hardcodes the three regular Spanish verb families by name.
- `server/progressStore.js:12-46` — `defaultProgress()` seeds exactly chunks `ar`, `er`, `ir` with identical shape. New subject needs a different default chunk set (or a config-driven seed).
- `content/spanish/vocab.json` — every verb entry carries `"pos": "verb", "family": "ar"` (etc.), the taxonomy the above code filters on.
- `content/spanish/worked_examples.json` — keyed by `family`, each entry has `endings: {yo, tu, el_ella_usted, ...}` and a `paradigm` array of `{person, ending, form, swap}` — conjugation-paradigm-shaped content, not reusable for non-conjugation subjects.

### Role-tagging (subject/stem/ending/object model)

- `src/engine/roleTagging.js:4-11` — `PERSON_TO_PRONOUN` maps engine person keys to Spanish pronouns (`tú`, `él`, `ellos`, ...).
- `src/engine/roleTagging.js:13-15` — `nounsPool` filters vocab by `pos === 'noun'`, assuming a Spanish-style noun/verb part-of-speech split feeds sentence generation.
- `src/engine/roleTagging.js:17-41` — `getNextRoleTaggingStimulus` builds `sentence: "${subject} ${conjugated} ${object.word}"` and `parts: {subject, stem, ending, object}` — a fixed 4-slot subject-verb-object Spanish sentence template with conjugation as the thing being tagged.
- `src/RoleTaggingScreen.jsx:5` — `EMPTY_TAGS = { subject: '', stem: '', ending: '', object: '' }`.
- `src/RoleTaggingScreen.jsx:21-22,45` — hardcoded role array `['subject', 'stem', 'ending', 'object']` drives both the grading check and the rendered form fields/labels. A subject whose "chunking" unit isn't a 4-part sentence (e.g. music notation, chemistry formulas) needs a different role set and a different screen entirely.
- `src/App.jsx:79` — incorrect-answer message string interpolates `stimulus.parts.subject/stem/ending/object` directly.

### Content-pool / recognition scheduling assumptions

- `src/engine/newContentSchedule.js:16` — `vocab.filter((w) => w.pos === 'verb' && w.family === chunkId)`. Recognition pool is gated on "family verbs remaining", i.e. assumes the content pool's organizing unit is a verb family.
- `src/engine/newContentSchedule.js:36,38` — `pos === 'verb'` / `pos !== 'verb'` used to split "family-gating content" from "everything else". Any subject reusing this scheduler needs the same two-tier `pos` taxonomy (a gating item type + a general pool), even if not literally verbs/nouns.

### False-cognate / misconception-type coupling

- `src/App.jsx:82-96` — `misconceptionMatcherAttempt` hardcodes the mapping "recognition miss -> `false_cognate` attempt" and "production miss -> `overgeneralization` attempt". These two misconception *types* are Spanish-vocabulary-specific (English/Spanish false cognates) and conjugation-specific (overgeneralizing a regular ending); a new subject's wrong-answer taxonomy will likely need different type names and different matcher fields, requiring this function to be rewritten (though `matchMisconception` itself, `src/engine/misconception.js`, is generic and doesn't need to change).
- `src/misconceptionInput.js:6-13` — `PERSON_TO_DISTRACTOR_KEY` re-maps engine person keys to the exact Spanish string labels (`tú`, `él/ella/usted`, ...) used in `distractors.json`'s `person` field. Pure content-format glue, Spanish-specific, and fragile by the file's own comment ("must stay in sync with content/spanish/distractors.json's person values").
- `content/spanish/distractors.json` — `type: "false_cognate" | "overgeneralization"` plus Spanish-only fields (`word_id` for cognate pairs, `verb_id`/`person`/`distractor_form` for overgeneralization).
- `content/spanish/misconceptions.json` — explanation text is written in English-about-Spanish prose (e.g. "Embarazada means pregnant, not embarrassed").

### UI/copy coupling

- `src/ProductionScreen.jsx:58` — prompt text `Conjugate <verb> (<meaning>) for <person>`. Wording assumes a conjugation task.
- `src/ProductionScreen.jsx:67` — placeholder `"Enter conjugated form"`.
- `src/ProductionScreen.jsx:23-24` — worked-example table headers `Person` / `Form`, row field `row.swap` (verb-paradigm-specific).
- `src/RoleTaggingScreen.jsx:40-42` — heading "Role tagging", prompt "Tag the subject, stem, ending, and object in...".
- `src/screenTechniques.js:15-19` — technique explanations reference "the conjugation rule" and "sentence parts" by name (would need rewriting per exercise type if new subject's `production`/`role-tagging` analogues differ, though this is copy, not logic).
- `App.jsx:2-5` — content imports hardcode path `../content/spanish/*.json`; there is no subject-selection indirection (e.g. `content/<subject>/...`) anywhere in the app.

---

## What a new subject needs to change

To add a second subject under this engine as-is, minimum required work:

1. **New content directory** (`content/<subject>/...`) matching the vocab/worked-example/distractor/misconception JSON shapes, or new shapes entirely if the subject has no conjugation concept.
2. **`App.jsx` content wiring** (`src/App.jsx:2-5`, `:24`) — parametrize the `content/spanish/...` imports.
3. **A decision on `production`/`role-tagging` exercise types**: reuse them only if the new subject also has a "transform input by rule" task (stem+ending) and a "sentence built from tagged slots" task with exactly `subject/stem/ending/object` roles. Otherwise:
   - Replace `src/engine/conjugation.js` and `src/engine/roleTagging.js` with subject-appropriate stimulus generators.
   - Replace `src/ProductionScreen.jsx` / `src/RoleTaggingScreen.jsx` with subject-appropriate screens (or generalize the role set beyond the hardcoded 4).
   - Replace `PERSONS` (`src/engine/conjugation.js:4`) with whatever parameter space the new subject rotates through (may not be "grammatical person" at all).
4. **`sessionPlan.js:1`** — replace `CHUNK_ORDER = ['ar','er','ir']` with the new subject's chunk id list (or make it config/content-driven instead of a literal).
5. **`server/progressStore.js:12-46`** — replace the hardcoded `ar`/`er`/`ir` default-seed chunks (or derive the seed from content instead of hardcoding).
6. **Misconception typing** — `src/App.jsx:82-96` and `src/misconceptionInput.js` are Spanish/conjugation-specific glue over an otherwise generic matcher (`src/engine/misconception.js`); rewrite the attempt-to-matcher mapping and any content-format label mapping for the new subject's wrong-answer taxonomy.
7. **`newContentSchedule.js`** — either keep the `pos`-based two-tier gating (family-locked item type vs. free pool) if the new subject has an analogous structure, or replace `familyVerbsRemaining`/`recognitionPool` if it doesn't.
8. **Copy** — `screenTechniques.js` explanations and inline screen prompt strings reference conjugation/sentence-part concepts; rewrite per subject even where the underlying logic is reused.

Everything else (`advancement.js`, `review.js`, `reviewGate.js`, `session.js`,
`wordMastery.js`, the misconception *matcher* itself, and all UI feedback/summary
components) needs no changes to support a second subject.
