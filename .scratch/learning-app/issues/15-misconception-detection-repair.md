# 15 — Misconception detection and repair

**What to build:** misconception-aware wrong-answer handling per [SPEC.md](../../../SPEC.md)'s
core learning loop (ticket 03): wrong answers matching a seeded distractor (from
`content/spanish/distractors.json`, ticket 10) are mapped to the specific misconception they
represent, not scored as generic "wrong." Feedback names the misconception and re-shows the
notional-machine correction. A similar item is re-served within-session shortly after, to check
the repair held.

**Blocked by:** 12 — Conjugation production exercise + worked example, 10 — Spanish v1 content

**Status:** ready-for-agent

- [ ] Test: a wrong answer matching a seeded distractor returns the specific misconception id/name
      it matches, not a generic incorrect result
- [ ] Test: a wrong answer with no matching seeded distractor still fails, but without a false
      misconception attribution
- [ ] Misconception-repair screen names the misconception and re-shows the relevant notional
      machine (stem + ending swap, or the relevant vocab rule)
- [ ] A similar item targeting the same misconception is re-served later in the same session after
      a repair is triggered
- [ ] Recheck outcome (held vs. resurfaced) is observable in the engine's returned state/next
      stimulus
