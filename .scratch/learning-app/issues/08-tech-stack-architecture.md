# 08 - Tech stack / architecture

Type: grilling
Assignee: claude (session 2026-07-10)
Status: closed
Blocked by: (none)

## Question

What tech stack, hosting, and build tooling should the app use? Constraints already fixed by
earlier decisions: content is static, version-controlled data files
([07 - Content authoring model](07-content-authoring-model.md)); progress/mastery state has a
defined shape (per-word status+streak, per-chunk mastered/streak/ladder-step) per
[05 - Progress / mastery tracking data model](05-progress-data-model.md); the UI needs light
client-side state for the expand/collapse technique badge, reused across 4 session screens, per
[06 - UI for surfacing techniques transparently](06-technique-transparency-ui.md). Personal
single-user tool, web-only, no auth. Open question includes where per-user progress state
persists (no backend/DB has been decided either way yet) and whether the repo becomes a proper
git project as part of this.

## Resolution

`learning_app/` becomes a real git repo (git init as part of this ticket). Frontend: Vite +
React, client-only SPA — no SSR, no routing framework needed beyond simple client-side state for
session steps and the technique badge. Progress/mastery state (per 05's schema) persists to a
local `progress.json` file rather than localStorage, so it survives browser-data clears and stays
portable across browsers on the same machine — this needs a small backend, so the app is no
longer pure static hosting. Backend: Node + Express, a handful of minimal REST endpoints (get
state, record attempt outcome) reading/writing `progress.json`. Hosting: local-only, no deploy —
runs on the user's own machine (e.g. `npm run dev` plus a start script for the Express server),
no cloud or self-host, since this is a single-user personal tool. Static content files from 07
(vocab, distractors, worked examples) ship as part of the frontend bundle/source, not served by
the backend.
