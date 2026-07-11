# 11 — Vocab recognition exercise + word mastery engine

**What to build:** the first tracer bullet through the full stack. A pure pedagogy-engine
function — `(progress state, attempt) -> (new progress state, next exercise stimulus)` — covering
word-level recognition per [SPEC.md](../../../SPEC.md)'s data model (ticket 05): 2-in-a-row
correct to master a word, any miss resets the streak to 0. A recognition exercise screen (word
shown, learner picks/enters the meaning) wired end to end through the Express endpoints from
ticket 09, persisting to `progress.json`.

**Blocked by:** 09 — Project scaffolding, 10 — Spanish v1 content

**Status:** done

- [x] Engine function is plain JS/TS with no DOM/HTTP/filesystem dependency, covered by Vitest
      unit tests (per SPEC's Testing Decisions seam)
- [x] Test: 2 consecutive correct answers on the same word flips it from "learning" to "mastered"
- [x] Test: any wrong answer resets `streak_count` to 0, regardless of prior streak length
- [x] Recognition screen presents a word from `content/spanish/vocab.json` and accepts an answer
- [x] Answering correctly/incorrectly updates state via the engine and persists through the
      ticket-09 endpoints
- [x] Reloading the app after closing the browser shows previously mastered words as already
      mastered (progress survives across sessions)
