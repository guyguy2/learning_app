# 06 - UI for surfacing techniques transparently

Type: prototype
Assignee: claude (session 2026-07-10)
Status: closed
Blocked by: (none)

## Question

Per the map's design preference — the app should surface which cognitive-science technique a
screen/exercise is using, not hide the pedagogy — build a rough, reactable prototype of the
session flow fixed in [03 - Core learning loop / session mechanics](03-core-learning-loop.md):
worked example (notional machine shown) → guided practice → independent recall, with
misconception-repair feedback that names the misconception. Use `/prototype` to raise the fidelity
of the discussion: how and where does the technique name/explanation actually appear on screen
without turning every exercise into a lecture?

## Resolution

Built 3 structurally distinct variants (A: corner badge, B: margin rail, C: moment-only/woven-
into-copy) across all four session-flow screens, switchable via `?variant=`. Asset:
`prototype/session-flow-technique-transparency.PROTOTYPE.html` (repo root, standalone static
HTML — no app exists yet to host variants inside, so sub-shape B per `/prototype`'s UI branch).
No git repo in `learning_app/` yet, so the full variant set stays in place as the primary source
rather than moving to a throwaway branch; only the verdict below is meant to survive into the
real build.

**Verdict: Variant A — corner badge.** Small expandable pill, top-right of each screen, naming
the active technique (e.g. "Notional machine", "Retrieval practice", "Named-error feedback");
click/tap expands a one-line explanation. Same pattern reused across all four steps, single-
column layout preserved (unlike B's persistent two-column rail), and nothing narrated unless the
learner opens it (unlike C's inline prose, which read as more lecture-y in practice). Answers the
open question: the technique name/explanation appears as a per-screen expandable badge, collapsed
by default.
