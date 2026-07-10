# 03 - Core learning loop / session mechanics

Type: grilling
Assignee: claude
Status: resolved

## Question

Design the core learning loop for the Spanish proof subject (vocab + regular present-tense
conjugation, per [02 - Choose proof subject](02-choose-proof-subject.md)): what exercise types
appear in a session, how misconceptions are detected and repaired, and how worked examples vs.
independent practice are sequenced. Ground each mechanic in the technique catalog from
[01 - Research: cognitive-science techniques](01-research-cognitive-techniques.md) — chunking
(verb families), notional machine (conjugation rule), roles (word/sentence-role tagging), and
misconception patterns (false cognates, regular-vs-irregular overgeneralization).

## Answer

**Exercise types (max 2-3 per session, working-memory limit):** recognition (word-meaning match),
production (fill-in conjugation), role-tagging (word/sentence role: subject, stem, ending, object).

**Sequencing:** I-do / We-do / You-do. One worked example with notional-machine explanation
(stem + ending swap shown explicitly) → guided practice with hints → independent recall.

**Misconception detection:** exercises are seeded with known-misconception distractors (false
cognates, regular-vs-irregular overgeneralization). Wrong answers are mapped to the specific
misconception they match, not scored as generic "wrong."

**Misconception repair:** immediate feedback names the misconception and re-shows the
notional-machine correction (not just the correct answer). A similar item is re-served
within-session shortly after, to check the repair actually stuck.

**Chunking order (verb families):** blocked within the first session — master -ar fully (all
persons, several verbs) before -er, then -ir. One notional machine at a time for a first-timer.
Interleaving across families starts from the second session onward, once each chunk is
independently established — better for long-term retention/discrimination per the technique
catalog, but too much too soon for session one.

**Advancement gate (chunk → chunk):** 3 consecutive correct spanning **at least 2 of the 2-3
exercise types** before advancing (e.g. -ar → -er). A single-type streak is gameable (rote
pattern-matching one exercise shape isn't evidence the chunk formed); cross-type correctness is a
closer proxy for the notional machine being internalized.

**Vocab/conjugation integration:** vocab-gates-conjugation. A small vocab pool (~10-15 words) is
mastered first via recognition; conjugation drills then draw only from the mastered pool, and the
pool grows alongside conjugation progress. Keeps each exercise testing exactly one new thing —
learning a new word and a new grammar rule simultaneously would double the intrinsic cognitive
load the technique catalog warns about.

**Session boundary:** gate-driven, not fixed-count or time-boxed. A session runs until the
current chunk's advancement gate is hit, or the user quits. Personal self-paced tool (per the
map's standing constraints) — padding past mastery wastes time, cutting off mid-mastery breaks
the loop's own logic.

Explicitly deferred, not part of this ticket: cross-session review/spaced-repetition scheduling
(how often a mastered chunk resurfaces later) and content-authoring workflow — both remain in the
map's Not yet specified, now sharper given the mechanics fixed here.
