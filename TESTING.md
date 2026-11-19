# Verification & Testing Log

All checks below were run on branch `feature/arcade-merge` against a local production Next.js server (`npm run build && npx next start`) and Chrome via Playwright. Note: `GROQ_API_KEY` is not present locally, so live Groq inference and the Vercel Preview URL checks must still be verified on the deployed Vercel Preview URL.

## 1. Build, Lint & Secret Scan
- `node scripts/generate-project-context.mjs`: generated `src/data/project-context.json` for all 9 arcade slugs.
- `node scripts/sync-arcade-shared.mjs`: synced `shared/{explain,chat}.{js,css}` into all 9 project folders.
- `npx eslint src/app/api/chat/route.js src/data/gameContent.js src/components/game/Engine.js src/components/game/Renderer.js next.config.mjs`: exited 0 with 0 errors (pre-existing repo-wide `npm run lint` still reports pre-existing React hook errors in untouched minigame files and `PortfolioGame.jsx` lines 74/253).
- `npm run build`: exited 0; compiled static `/` and dynamic `/api/chat` + `Proxy (Middleware)`.
- `grep -rn "fetch(" public/arcade/ | grep -v "chat.js"`: 0 matches outside `chat.js`.
- `grep -rnE "GROQ_API_KEY|gsk_|api\.groq\.com" public/arcade/ .next/static/`: 0 matches.

## 2. Routing, API Guardrails & Rate Limit (`next start`)
- `GET /` -> 200
- `GET /Eshan_Portfolio/index.html` -> 200
- `GET /arcade` -> 308 -> `/arcade/` -> 200 (hub loads, 12 items / 9 doors, `#bPort` present, 0 horizontal overflow)
- `GET /arcade/index.html` -> 200
- `GET /arcade/projects/<slug>/index.html` & `/arcade/projects/<slug>/` -> 200
- `GET /api/chat` -> 200 `{ ok: true, configured: false }` (no permissive CORS header)
- `POST /api/chat` with empty message -> 400; > 500 chars -> 400; unknown `project` slug -> 400; `{ message: "hi" }` (main site fallback without key) -> 200 unchanged; `{ message: "hi", project: "saathi" }` without key -> 503 `{ offline: true }`; 16th rapid request from same IP -> 429 (`Retry-After`).

## 3. Professional Mode (`/Eshan_Portfolio/index.html`)
- Verified `Project Arcade` link (`/arcade/index.html?from=portfolio`) and all 9 project `PLAY SHOWCASE` + `TAKE ME TO PROJECT` links (including KAVACH fallback to `https://github.com/Falcon0516`).
- Verified all images in `#work` loaded (`brokenImgs: []`), 0 console/page errors, and 0 horizontal overflow at 1440x900.
- Verified click roundtrip: `/Eshan_Portfolio/index.html` -> `Project Arcade` -> `/arcade/index.html?from=portfolio` -> `PORTFOLIO` returns to `/Eshan_Portfolio/index.html`.

## 4. Playable Game Mode (`/`)
- Verified Title Screen shows `PRESS START`, `RECRUITER SKIP`, and `PROJECT ARCADE`.
- Verified walking right (`ArrowRight`) into `arcade_hub` opens `PROJECT ARCADE` card with `ENTER PROJECT ARCADE` (`/arcade/index.html?from=portfolio`), navigating to `/arcade/` and returning via `PORTFOLIO` to `/`.
- Verified mobile touch D-pad (`390x844`) triggers `arcade_hub` portal, and `SAATHI` project card renders `PLAY SHOWCASE` (`/arcade/projects/saathi/index.html?from=portfolio`).

## 5. All 9 Arcade Projects (1440x900, 1280x720, 390x844) + Offline `file://`
- Verified all 9 projects (`argus`, `axiom`, `kavach`, `personaforge`, `pro-rover`, `saathi`, `soil-and-toil`, `usb-tcp-bridge`, `verifarm`) at 1440x900, 1280x720, and 390x844:
  - 0 overlaps on `#ex-port`, `#ex-btn`, `#ex-go`
  - 0 horizontal scroll (`scrollWidth <= innerWidth`)
  - Mascot / fallback launcher opens chat (`#ch-panel`), starter chips work, `ArrowRight`/`E`/`P` do not leak to scenes or EXPLAIN, `Esc` closes cleanly without navigating away
  - Both top `#ex-go` and EXPLAIN footer `#ex-foot-go` match `arcade/data/links.js` with `target="_blank" rel="noopener noreferrer"` and aria-labels
- Verified `file://` directly on `public/arcade/index.html` and `public/arcade/projects/saathi/index.html`:
  - 0 console errors
  - Chat shows `"Chat needs internet. Open the EXPLAIN card for the full story."` + `OPEN EXPLAIN` button and answers starter chips locally from `window.EXPLAIN`.
