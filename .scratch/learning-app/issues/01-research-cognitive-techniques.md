# 01 - Research: cognitive-science techniques in The Programmer's Brain

Type: research
Status: resolved

## Question

Catalog the learning/cognition techniques described in Felienne Hermans' *The Programmer's Brain*
(working memory limits, LTM/STM, chunking, notional machines, roles of variables, cognitive load
types — intrinsic/extraneous/germane, misconception patterns, and any spaced-repetition /
desirable-difficulty research the book cites). For each technique, capture:

- What it says about how people learn.
- A concrete way it could be operationalized as a feature/mechanic in a subject-agnostic web
  learning app.
- Any evidence the book gives for how often or under what conditions it should be applied
  (relevant to session-scheduling decisions later).

Produce a markdown summary as a linked asset (e.g. `docs/research/programmers-brain-techniques.md`)
and link it from this ticket's resolution.

## Answer

Two independent research passes run (Claude: `docs/research/programmers-brain-techniques.md`,
Grok: `docs/research/programmers-brain-techniques-grok.md`), then synthesized into the canonical
catalog: **[`docs/research/programmers-brain-techniques-synthesis.md`](../../../docs/research/programmers-brain-techniques-synthesis.md)**.

8 techniques cataloged, each with claim/mechanism, subject-agnostic operationalization, and
cadence/scheduling evidence: working memory limits, LTM/STM transfer, chunking, notional machines,
roles of variables (Sajaniemi), cognitive load types (Sweller), misconception patterns, spaced
repetition/desirable difficulty.

Core structural claims corroborate across both passes and are safe to design against now.
Numeric specifics (2-6 chunk capacity, "2 days -> 25% LTM retention," monthly/10-min-a-day review
cadence) are consistently reported by both passes but neither confirmed them against the book's
primary text — carry these into later tickets as adjustable defaults, not hard-coded constants.

Two unresolved conflicts between the passes, flagged in the synthesis's Gaps section: whether
Sajaniemi's PPIG 2005 PDF was actually readable (one pass got binary garbage, the other reports
specific extracted stats), and whether Manning's liveBook chapter TOCs (ch 2-7) were genuinely
fetched or hallucinated by one pass. Worth a primary-text check before the app's content model
locks in on the disputed specifics.
