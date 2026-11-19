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
- Verified click roundtrip: `/Eshan_Portfolio/index.html` -> `Project Arcade` -> `/arcade/index.html?from=pro` -> `PORTFOLIO` returns to `/Eshan_Portfolio/index.html`.

## 4. Playable Game Mode (`/`)
- Verified Title Screen shows `PRESS START`, `RECRUITER SKIP`, `PROJECT ARCADE`, and `RESUME`.
- Verified walking right (`ArrowRight`) into `arcade_hub` opens `PROJECT ARCADE` card with `ENTER PROJECT ARCADE` (`/arcade/index.html?from=game`), navigating to `/arcade/` and returning via `PORTFOLIO` to `/`.
- Verified mobile touch D-pad (`390x844`) triggers `arcade_hub` portal, and `SAATHI` project card renders `PLAY SHOWCASE` (`/arcade/projects/saathi/index.html?from=game`).

## 5. All 9 Arcade Projects (1440x900, 1280x720, 390x844) + Offline `file://`
- Verified all 9 projects (`argus`, `axiom`, `kavach`, `personaforge`, `pro-rover`, `saathi`, `soil-and-toil`, `usb-tcp-bridge`, `verifarm`) at 1440x900, 1280x720, and 390x844:
  - 0 overlaps on `#ex-port`, `#ex-btn`, `#ex-go`
  - 0 horizontal scroll (`scrollWidth <= innerWidth`)
  - Mascot / fallback launcher opens chat (`#ch-panel`), starter chips work, `ArrowRight`/`E`/`P` do not leak to scenes or EXPLAIN, `Esc` closes cleanly without navigating away
  - Both top `#ex-go` and EXPLAIN footer `#ex-foot-go` match `arcade/data/links.js` with `target="_blank" rel="noopener noreferrer"` and aria-labels
- Verified `file://` directly on `public/arcade/index.html` and `public/arcade/projects/saathi/index.html`:
  - 0 console errors
  - Chat shows `"Chat needs internet. Open the EXPLAIN card for the full story."` + `OPEN EXPLAIN` button and answers starter chips locally from `window.EXPLAIN`.

## 6. Follow-up Verification: Visibility, Resume Modals & ARGUS KB Update
- `node scripts/generate-project-context.mjs`: generates `src/data/project-context.json` (9 projects) and `src/data/argus-prompt.json` (9 KB project blocks, system prompt, and full knowledge base; preserves existing `argus-prompt.json` if root `.md` files are absent during CI builds).
- `npm run build`: exited 0 after final changes.
- `/api/chat` (without local `GROQ_API_KEY`): `GET` returns `200 { ok: true, configured: false }`; empty messages or unknown `project` returns `400`; `POST` (both main `{ message }` and `{ project: "argus", message }`) returns `503 { offline: true }` without leaking `GROQ_API_KEY`.
- Resume assets (`Eshan_H_Resume.pdf`, `resume_page_1.webp`, `resume_page_2.webp`) return `200` at both `/resume/*` and `/arcade/assets/resume/*`.
- **Professional Mode (`/Eshan_Portfolio/index.html`)** at `1440x900`, `1280x720`, `390x844`:
  - Verified Nav (`Project Arcade` link + `Resume` pill + mobile drawer `#navMobileResume`) and above-the-fold Hero CTAs (`Project Arcade ↗`, `View Resume`, `Download PDF`).
  - Verified updated KB facts (`GigBirds`, `Sep 2026`, `515509-001` "Design Registration, Published", `15+`, `8` podiums, `SIH Internal Hackathon 2026`, `Vigyantra`, `PRASHASAN`, `LoRa`, `91.5%`, `97.44%`), 0 `"patent granted"` matches, 0 broken images.
  - Verified `#heroResumeBtn` & `#navMobileResume` open `#resumeModal.open`, both WebP pages load (`naturalWidth > 0`), and `Escape` closes cleanly.
  - Verified ARGUS chat fallback mentions `515509-001` without `"patent granted"`.
- **Playable Game Mode (`/`)** at `1280x720`, `390x844`:
  - Verified Title Screen `🕹️ PROJECT ARCADE` (`?from=game`) + `📄 RESUME` button and in-game `.hud-quick-actions` (`🕹️ ARCADE`, `📄 RESUME`, `BGM`, `SFX`) do not overlap `.game-hud`.
  - Verified `.game-resume-modal` renders both resume pages cleanly from both Title Screen and HUD, and closes on `Escape`.
- **Arcade Hub (`/arcade/`) & All 9 Projects** at `1440x900`, `1280x720`, `390x844` + `file://`:
  - Verified `#bResume` opens `#ovResume.on`, loads both WebP pages, closes cleanly on `Escape` even in `ROOM_IDLE`, and `.port-bar` does not overlap `.hud-l` or `.hud-r` in `playing` mode on `390x844`.
  - Verified `#bPort` and `#ex-port` honor `?from=pro` (`/Eshan_Portfolio/index.html`) and `?from=game` (`/`).
  - Verified all 9 project pages (`argus`, `saathi`, `verifarm`, `soil-and-toil`, `axiom`, `personaforge`, `kavach`, `pro-rover`, `usb-tcp-bridge`) have 0 overlaps among `#ex-port`, `#ex-res`, `#ex-btn`, `#ex-go`, `#back`/`#arcade`, 0 horizontal overflow, `#ex-res` & `#ex-foot-res` open `#ex-res-scrim.on` with lazy WebP images, and `Escape` closes without leaving the page.
  - Verified offline `file://` direct open on `public/arcade/index.html` and `public/arcade/projects/verifarm/index.html` loads both Resume images cleanly.
- Known local-only environment exclusions when running `next start` offline: `/_vercel/insights/script.js` and missing pre-existing `/favicon.ico` return 404 locally, and live Groq completions require `GROQ_API_KEY` on Vercel.

## 7. Mobile UX, Spotlight Walkthroughs, Sound Persistence & Rich Chat Engine Verification
- `npx eslint src/components/game/GuideBubble.jsx src/components/game/reveal/HolographicCard.jsx src/app/api/chat/route.js`: exited `0` (0 errors, 0 warnings).
- `node scripts/sync-arcade-shared.mjs`: synced `4` shared files into all `9` project folders.
- `npm run build`: exited `0` (`prebuild` regenerated `src/data/project-context.json` and `argus-prompt.json`; Next.js `16.2.12` compiled `/` and `/api/chat`).
- Playwright Desktop (`1280x720`, `1024x576`) + Mobile (`390x844`) suite (`verify_visual_all.mjs`): **52 PASS, 0 FAIL**, with real PNG screenshot inspection across all views:
  - **Game Title Screen (`/`)**: 0 button/caption overlaps on both Desktop (`1280x720`) and Mobile (`390x844`); bespoke same-tab transition animations for `RECRUITER SKIP` (`/Eshan_Portfolio/index.html`) and `PROJECT ARCADE` (`/arcade/index.html?from=game`) verified end-to-end.
  - **Expandable & Closable Modals/Panels**: Sticky `FULL VIEW`/`COMPACT` + `CLOSE` verified on `#ex-card` (fixes previous ~1cm mobile strip on `saathi` and projects), Arcade Hub overlays (`.ov-in.expanded`), Executive Portfolio `#resumeModal` & `#agentPanel.expanded` (`z-index: 1200` above sticky nav), `.holo-win-bar` on `.holo-card`, and `.game-resume-modal.expanded`.
  - **Spotlight Tutorials**: Verified auto-start on first visit, `localStorage` persistence (`game_tut_done`, `arc_hub_tut_done`, `arc_proj_tut_done`), horizontal scroll/swipe demo cues, AI corner introduction (`GuideBubble` `.guide-orb` + `#ch-fab` / `.ch-host` + `#agentIntroTip`), and replay buttons (`? GUIDE`, `#bTut`, `#ex-tut-btn`).
  - **Cross-Project Sound Persistence (`arc_snd`)**: Verified `localStorage['arc_snd'] === '1'` persists across Hub (`#bSnd`) -> `verifarm` (`#mbtn.on`) -> Hub -> `argus` (`#mBtn[aria-pressed="true"]`) -> `saathi` (`#ex-snd.on`).
  - **Desktop (`1280x720`, `1024x576`, `1440x900`) & Mobile (`390x844`) Top Dock & Viewport Audit (all 9 projects + Hub Boot + Pro Portfolio)**: Unified `#ex-top` dock (`PORTFOLIO`, `RESUME`, `EXPLAIN`, `TAKE ME TO PROJECT`, `?`, conditional `SND`) solves dynamically for free native top-bar width (`.ex-compact` at tight desktop widths, compact wrapped dock `<=920px`); verified 0 top-bar/control overlaps across all 9 showcases including `pro-rover` (`[CUT CABLE]` / `[RESET CRATE]` unobstructed), `personaforge`, and `axiom`; 0 horizontal overflow, `#ui > .toast` pointer interception resolved, VeriFarm `#badge` separated above `#dots`, and `saathi` `.bubble` horizontal layout fixed.
  - **AI Chatbot Engine (`/api/chat`, `agent.js`, `shared/chat.js`, `GuideBubble.jsx`)**: Safe-DOM formatting (bullet lists, bold labels, flow diagrams), `sessionStorage` conversation memory (`eshan_argus_history`, `arc_chat_<slug>`, `game_argus_history`) + `Clear`, canonical `[[ACTION:...]]` allowlisting (stripping injected malicious external URLs), and API input guardrails (`400` on unknown project or >500 chars; `503 { offline: true }` when `GROQ_API_KEY` unset).

## 8. Groq Model Deprecation Fix & Live Failover Verification
- **Root Cause Check**: Verified against `https://api.groq.com/openai/v1/models` and `/openai/v1/chat/completions` that the previously hardcoded `llama-3.1-8b-instant` model returns `HTTP 404` (`code: "model_not_found"`). Active high-context (`131072`) chat models available on the Groq key are `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.8-27b` (`8,000 TPM`, `1,000 RPM` per model).
- **API Route Updates (`src/app/api/chat/route.js`)**:
  - Updated default `MODEL_CANDIDATES` chain to `process.env.GROQ_MODEL` (optional override) -> `openai/gpt-oss-120b` -> `openai/gpt-oss-20b` -> `qwen/qwen3.8-27b`, with `maxRetries: 0` on the `Groq` client so `404`/`429` responses immediately fail over to the next model's separate TPM pool instead of stalling inside SDK retries.
  - Added compact core KB context for project-scoped prompts (`buildCompactCoreKb()`), explicit `Portfolio Game` routing in `MAIN_SYSTEM_PROMPT`, `allowExplain` scoping so `MODAL:explain` is only suggested inside Arcade project showcases, `<think>...</think>` tag stripping in `sanitizeReply()`, and bidirectional `↔` flow-arrow splitting in `agent.js`, `shared/chat.js`, and `GuideBubble.jsx`.
- **Verification After Final Code Edit**:
  - `npx eslint src/app/api/chat/route.js src/components/game/GuideBubble.jsx`: exited `0` (0 errors, 0 warnings).
  - `npm run build` (Next.js `16.2.12` + `prebuild`): exited `0`.
  - Live `next start` `/api/chat` verification with runtime `GROQ_API_KEY` env var (key not stored in repo):
    - `GET /api/chat` -> `HTTP 200` (`{"ok":true,"configured":true,"model":"openai/gpt-oss-120b"}`).
    - `POST /api/chat` (Executive Pro ARGUS + design registration + resume query) -> `HTTP 200`, formatted bullet response with `[[ACTION:MODAL|View Resume|resume]]`.
    - `POST /api/chat` (`project: "Portfolio Game"`) -> `HTTP 200`, routed cleanly with `[[ACTION:ARCADE|Open Project Arcade|/arcade/index.html]]`.
    - `POST /api/chat` (`project: "saathi"`) -> `HTTP 200`, structured technical pipeline bullets with `[[ACTION:MODAL|Open Explain Card|explain]]`.
    - `POST /api/chat` (`project: "nonexistent-project"`) -> `HTTP 400` (`{"error":"Unknown project."}`).
  - Playwright Desktop (`1280x720`, `1024x576`) & Mobile (`390x844`) suite (`verify_visual_all.mjs`): **52 PASS, 0 FAIL**.
  - Repository secret scan (`grep -rnE "gsk_[A-Za-z0-9]{10,}" src/ public/ scripts/ TESTING.md`): `0` matches.
