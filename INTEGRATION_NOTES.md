# Integration Notes

1. **Framework & Static Assets**
   - Next.js `16.2.12` (App Router, `src/app/`), React `19.2.4`, `npm run build` (`next build`).
   - Static files are served from `public/`. Arcade lives at `public/arcade/` -> `/arcade/*`.

2. **Portfolio Modes & Project Data**
   - **Game mode (`/`)**: `src/app/page.js` loads `src/components/PortfolioGame.jsx` (2D Canvas + Three.js portals/minigames, Zustand in `src/state/gameStore.js`). Level layout is in `src/components/game/Engine.js`; project/content map `BLOCK_CONTENT` is in `src/data/gameContent.js`.
   - **Professional mode (`/Eshan_Portfolio/index.html`)**: Static HTML/CSS/JS opened via `RECRUITER SKIP` in `PortfolioGame.jsx:810`. Projects live inline in `public/Eshan_Portfolio/index.html` (`#work`: Argus, SAATHI, AXIOM, VeriFarm, Agronym Solutions, AVANGARD). Root `Eshan_Portfolio/` is an earlier duplicate; `public/professional/` is legacy and unlinked.
   - Missing in professional `#work` vs Arcade's 9: Soil & Toil, PersonaForge, KAVACH, Pro-Rover, USB-TCP Bridge (Agronym rover covers Pro-Rover/USB-TCP conceptually; we add the missing Arcade projects using `data/explain.js`).

3. **ARGUS AI Assistant**
   - **Backend**: `src/app/api/chat/route.js` (`POST /api/chat`), using `groq-sdk` (`llama-3.1-8b-instant`, `temperature: 0.6`, `max_tokens: 200`).
   - **Prompt & KB**: `SYSTEM_PROMPT` embeds `PORTFOLIO_CONTEXT` generated from `BLOCK_CONTENT`, `ZONES`, `GUIDE` in `src/data/gameContent.js`.
   - **Env / Limits / Format**: Reads `process.env.GROQ_API_KEY`. Currently has no rate limiter and returns non-streaming JSON `{ reply }`.
   - **Frontend callers**: `src/components/game/GuideBubble.jsx` and `public/Eshan_Portfolio/js/agent.js` (with local fallback).

4. **Config, Env Vars & Conflicts Resolved**
   - No `vercel.json` existed; `next.config.mjs` only sets `allowedDevOrigins`. No `.env*` files exist locally. Env var needed: `GROQ_API_KEY`.
   - **Conflict 1 (Trailing slash)**: Next.js default `trailingSlash: false` redirects `/arcade/` -> `/arcade`, breaking relative asset links (`css/hub.css`). Fix: add `vercel.json` cache headers + clean `/arcade` -> `/arcade/` redirect & `/arcade/` -> `/arcade/index.html` rewrite (`skipTrailingSlashRedirect: true` in `next.config.mjs`) so both `/arcade` and `/arcade/` resolve to the hub with working relative paths.
   - **Conflict 2 (No `tools/lint_site.py`)**: Not present in `Eshan_Arcade`; we keep `fetch` strictly inside `chat.js` and add a check script for verification.
   - **Conflict 3 (Dual static folders)**: Update `public/Eshan_Portfolio/` (the live recruiter target) and sync `Eshan_Portfolio/` if untouched, leaving legacy `public/professional/` untouched.
