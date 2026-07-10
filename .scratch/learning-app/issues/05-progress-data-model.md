# 05 - Progress / mastery tracking data model

Type: grilling
Assignee: claude
Status: closed
Blocked by: (none)

## Question

What does the app need to persist to track a learner's state, given
[03 - Core learning loop / session mechanics](03-core-learning-loop.md)'s mechanics: per-word
vocab mastery status (for the vocab-gates-conjugation rule), per-chunk advancement-gate progress
(consecutive-correct count, which exercise types it spans), and whatever
[04 - Cross-session review scheduling](04-review-scheduling.md) ends up needing to decide when a
mastered chunk resurfaces. Decide the shape of this state (not the storage tech — that's the
tech-stack fog item) and what's the minimal set of facts that make both the gate and the review
scheduler correct.

## Resolution

Entities and rules, decided by grilling:

- **Chunk granularity**: one chunk = one whole verb family (-ar, -er, -ir — 3 chunks total for v1).
  Vocab words are tracked separately, not as chunks.
- **Word mastery**: 2-in-a-row correct, single exercise type sufficient (no cross-type
  requirement — vocab is atomic, unlike conjugation).
- **Vocab review**: no separate ladder for words. Once mastered, words are exercised implicitly as
  ingredients inside conjugation drills; no per-word decay/reminder mechanic in v1. Accepted risk:
  words that never recur in later chunk content have no forgetting check.
- **Miss behavior**: uniform across the app — any miss resets the relevant streak to 0 (never
  decrements, never partial-resets). Applies to word streaks and chunk streaks alike, both during
  initial learning and during review.
- **Chunk locking**: none. All 3 chunks are open in parallel from the start; 03's "session one =
  one family" is a session-content-selection rule, not a mastery-gate/prerequisite. No
  locked/unlocked field needed.
- **Review success grain**: reuses the exact advancement-gate mechanic (3-in-a-row correct
  spanning >=2 exercise types) for every re-review, not a lighter one-shot check. One live
  streak/types-seen pair per chunk does double duty: first gate-clear = initial mastery; every
  subsequent gate-clear (when due) = a review success that advances the ladder step.

Resulting shape (storage tech is separate fog, not decided here):

```
Word:
  id
  status: "learning" | "mastered"
  streak_count: 0-2          # resets to 0 on miss, mastered at 2

Chunk (3 total: -ar, -er, -ir):
  id
  mastered: bool             # false until first gate-clear
  mastered_date: date | null
  streak_count: 0-3          # resets to 0 on miss; live during both initial learning AND review
  types_in_streak: set<ExerciseType>   # cleared with streak_count; gate clears at count=3 AND |types|>=2
  ladder_step: 0-4 | null    # null until mastered_date set; index into [1,3,7,14,30] days
  last_reviewed_date: date | null
  next_due_date: date | null # = last_reviewed_date + ladder interval; set on mastery (day+1) and after each review clear
```

No separate event log, no per-word ladder, no chunk-lock/prereq field. Overdue ordering, the
review queue, and vocab-gates-conjugation are all queries over this state, not stored facts.

Flagged, not blocking: a review round can run long if the learner keeps missing (same open-ended-
until-clear behavior 03 already accepted for new-content sessions).
