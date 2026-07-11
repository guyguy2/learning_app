# 17 — Cross-session review scheduling

**What to build:** the calendar-driven review ladder from [SPEC.md](../../../SPEC.md)'s review
scheduling decision (ticket 04): every session opens with a review block; which chunks are due is
decided by real elapsed calendar time, not session count. Fixed interval ladder
(1 -> 3 -> 7 -> 14 -> 30 days); one success advances a step, a miss resets fully to step 1.
All-due review, capped at 5-8 items per session, overflow rolls to next session
most-overdue-first. Review runs before new-chunk work, reuses ticket 15's misconception-repair
flow on a miss, and draws from the same exercise-type mix as the chunk (not recognition-only).

**Blocked by:** 14 — Chunk advancement gate + session chunk ordering, 15 — Misconception
detection and repair

**Status:** ready-for-agent

- [ ] Test: given chunks with varying `last_reviewed_date`/`ladder_step`, the due-set query
      returns exactly the chunks whose interval has elapsed, ordered most-overdue-first
- [ ] Test: a successful review clear (reusing the ticket-14 gate mechanic) advances
      `ladder_step` by exactly one
- [ ] Test: a missed review resets `ladder_step` to 0 (interval back to 1 day), not one step back
- [ ] Review queue is capped at 5-8 items per session; anything beyond the cap is deferred to the
      next session and re-queued most-overdue-first
- [ ] A review miss triggers ticket 15's named-misconception feedback and within-session recheck,
      not a separate pass/fail path
- [ ] Review items are drawn from the same 2-3 exercise types as the chunk's normal content, not
      restricted to recognition
- [ ] Session ordering: the review block is presented before new-chunk work begins
