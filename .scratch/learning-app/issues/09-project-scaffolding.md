# 09 — Project scaffolding

**What to build:** `learning_app/` becomes a real, runnable skeleton per [SPEC.md](../../../SPEC.md)'s
tech-stack decision (ticket 08): Vite + React client-only SPA, Node + Express backend, Vitest
wired for the pedagogy-engine test seam. No pedagogy logic yet — this is prefactoring so every
later ticket has a place to land. `npm run dev` boots both frontend and backend; the backend
reads/writes an empty/default `progress.json` shape through a bare endpoint round-trip.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `npm run dev` (or equivalent documented script) starts the Vite frontend and Express
      backend together
- [x] Repo layout matches SPEC.md's suggested layout (`content/`, `server/`, `src/`, `progress.json`
      gitignored)
- [x] A GET endpoint returns the current `progress.json` contents (default/empty shape if the
      file doesn't exist yet)
- [x] A POST (or PUT) endpoint writes a new state to `progress.json` and the change is visible on
      the next GET
- [x] Vitest is configured and runs (even a placeholder test) via a documented script
- [x] `progress.json` is gitignored; no runtime state is committed
