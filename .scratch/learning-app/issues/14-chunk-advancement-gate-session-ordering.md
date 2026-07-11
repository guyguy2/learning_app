# 14 — Chunk advancement gate + session chunk ordering

**What to build:** the advancement gate and session-level chunk ordering from
[SPEC.md](../../../SPEC.md)'s core learning loop (ticket 03) and data model (ticket 05): a chunk
is mastered after 3 consecutive correct attempts spanning at least 2 of the available exercise
types; any miss resets the streak fully. All three chunks (-ar, -er, -ir) are unlocked in
parallel from the start (no locking), but session one presents them blocked (one family fully
before the next); interleaving starts from session two onward. A session ends when the current
chunk's gate is hit (no fixed count or timer).

**Blocked by:** 12 — Conjugation production exercise + worked example, 13 — Role-tagging exercise
type

**Status:** ready-for-agent

- [ ] Test: chunk `mastered` flips to true at exactly 3-in-a-row spanning ≥2 exercise types, not
      before (e.g. 3-in-a-row on one type alone does not flip it)
- [ ] Test: a single miss at any point resets `streak_count` and `types_in_streak` to empty,
      regardless of prior streak length
- [ ] All three chunks are queryable/attemptable from a fresh state (no locked/unlocked field
      blocking access)
- [ ] Session-one content selection presents one verb family at a time (blocked ordering);
      session-two-onward selection interleaves across families already introduced
- [ ] Session boundary: the app signals session end when the active chunk's gate clears, not on a
      fixed question count or timer
