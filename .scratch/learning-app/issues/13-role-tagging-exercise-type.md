# 13 — Role-tagging exercise type

**What to build:** the third exercise type from [SPEC.md](../../../SPEC.md)'s core learning loop
(ticket 03) — word/sentence-role tagging (subject, verb stem, ending, object) — over the same
chunk/word model established in ticket 12. Needed so the advancement gate (ticket 14) has ≥2
distinct exercise types to span, per the SPEC's anti-gaming requirement.

**Blocked by:** 12 — Conjugation production exercise + I-do/We-do/You-do worked example

**Status:** ready-for-agent

- [ ] Engine extended with a "role-tagging" attempt type feeding the same chunk
      `streak_count`/`types_in_streak` state as production and recognition
- [ ] Role-tagging screen presents a conjugated sentence/phrase and asks the learner to tag
      subject, stem, ending, and object
- [ ] Test: a correct role-tagging attempt counts toward the chunk's `types_in_streak` set
      distinctly from recognition/production
- [ ] Role-tagging drills respect the same vocab-gates-conjugation constraint as production
      (only mastered vocab appears)
