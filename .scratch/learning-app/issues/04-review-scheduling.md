# 04 - Cross-session review / spaced-repetition scheduling

Type: grilling
Assignee: claude
Status: resolved
Blocked by: (none)

## Question

Once a chunk is mastered (per [03 - Core learning loop / session mechanics](03-core-learning-loop.md)'s
advancement gate — 3-in-a-row correct spanning ≥2 exercise types), how and when does it resurface
in later sessions? Ground the answer in the spaced-repetition research flagged in
[01 - Research: cognitive-science techniques](01-research-cognitive-techniques.md) (numeric
specifics there — chunk capacity, retention %, review cadence — were flagged unverified defaults;
confirm or replace them here). Decide: review trigger (time-based decay, next-session-always,
accuracy-triggered), and how a review item competes with new-chunk learning within a session.

## Answer

**Trigger:** hybrid of next-session-always + calendar-time decay. Every session opens with a
review block (not gated by wall-clock scheduling outside the app), but *which* chunks are due is
determined by real elapsed calendar time since last review, not session count — a chunk reviewed
twice in one day and one left for two weeks decay very differently, and session cadence alone
doesn't capture that.

**Interval ladder:** fixed schedule, not adaptive (SM-2-style per-item easiness factors ruled out
as unneeded complexity for a proof-the-engine effort). Ladder: 1 day -> 3 days -> 7 days ->
14 days -> 30 days. One successful review advances one step; a miss resets to step 1 (full
reset, not back-one-step) — a wrong answer means the chunk decayed further than the ladder
predicted, so re-anchor rather than give partial credit.

**Review vs. new-chunk competition:** all-due review, capped. Every chunk whose interval has
elapsed is eligible, but the review block is capped at roughly 5-8 items per session so a big
backlog day doesn't crowd out new-chunk work (consistent with ticket 03's gate-driven, no-fixed-
count session boundary). Overflow beyond the cap rolls to the next session, prioritized
most-overdue-first. The review block runs before new-chunk work in session ordering.

**Review miss handling:** reuses ticket 03's misconception-repair mechanic wholesale — a review
miss triggers the same named-misconception feedback and within-session recheck as a first-time
miss, since a review miss may be the original misconception resurfacing rather than simple
forgetting, and this avoids building a second, simpler pass/fail path alongside it.

**Review exercise-type sourcing:** review items are drawn from the same 2-3 exercise types
established for that chunk (recognition/production/role-tagging), not exempt or restricted to a
single type. Recognition-only review would risk false confidence — recognizing a form isn't
evidence the notional machine (production) still holds.

Numeric specifics from [01 - Research: cognitive-science techniques](01-research-cognitive-techniques.md)
(review cadence, retention curves) were flagged there as unverified defaults; the ladder above is
adopted as a workable default per this ticket's decision, not a research-confirmed constant — open
to tuning once the proof subject sees real use.
