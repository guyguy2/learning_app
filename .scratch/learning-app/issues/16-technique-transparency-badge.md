# 16 — Technique transparency badge (Variant A)

**What to build:** the corner-badge UI from [SPEC.md](../../../SPEC.md)'s technique-transparency
decision (ticket 06) — a small expandable pill, top-right of each screen, naming the active
cognitive-science technique (e.g. "Notional machine," "Retrieval practice," "Named-error
feedback"). Collapsed by default; expands to a one-line explanation on tap/click. Same pattern
reused identically across worked example, guided practice, independent recall, and
misconception-repair screens, per the prototype verdict at
`prototype/session-flow-technique-transparency.PROTOTYPE.html`.

**Blocked by:** 12 — Conjugation production exercise + worked example, 15 — Misconception
detection and repair

**Status:** done

- [x] Badge component renders top-right, collapsed by default, on all four session-flow screens
      (worked example, guided practice, independent recall, misconception repair)
- [x] Tapping/clicking the badge expands a one-line technique explanation; tapping again collapses it
- [x] Each screen's badge names the technique actually in play on that screen (not a generic label)
- [x] Visual pattern matches the corner-badge (Variant A) design from the prototype, not the
      rejected margin-rail or moment-only variants
