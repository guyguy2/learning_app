# 12 — Conjugation production exercise + I-do/We-do/You-do worked example

**What to build:** the production exercise type and the worked-example sequencing per
[SPEC.md](../../../SPEC.md)'s core learning loop (ticket 03), for one verb family (-ar) first.
Worked example (I-do: notional machine shown explicitly — stem + ending swap) → guided practice
with hints (We-do) → independent recall with no hints (You-do). Conjugation drills draw only from
vocab already mastered per ticket 11 (vocab-gates-conjugation).

**Blocked by:** 11 — Vocab recognition exercise + word mastery engine

**Status:** done

- [x] Engine extended with a "production" attempt type and chunk state
      (`streak_count`, `types_in_streak` per SPEC's data model) — unit tested
- [x] Worked-example screen shows the stem + ending swap explicitly before any practice is asked
- [x] Guided-practice screen offers hints; independent-recall screen offers none
- [x] Production drills only draw verbs/vocab from words already at "mastered" status
      (verified: an unmastered word never appears as a drill ingredient)
- [x] Sequencing enforced: worked example always precedes guided practice, which always precedes
      independent recall, for a given chunk encounter
- [x] Test: a production attempt records into the same chunk state used later by the advancement
      gate (ticket 14)
