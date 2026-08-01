# HANDOFF 2: Professional Portfolio — Continuing After Re-Investigation

This supersedes `PROFESSIONAL_PORTFOLIO_HANDOFF.md` (v1). That doc's core assumption —
**"no code has been changed yet"** — is **no longer true**. Read this whole doc before touching
anything; it corrects v1's stale assumptions and tells you exactly what's real right now.

## 0. Tooling setup (unchanged from v1)
Requires the **Filesystem MCP connector**. Tools are deferred — call `tool_search` for
"filesystem read write list directory" before use. Confirm root:
```
Filesystem:list_allowed_directories → /Users/falcon/Downloads/claude
```
Everything below is under that root.

## 1. CRITICAL CORRECTION — the site is already substantially modified

v1 said `public/professional` was untouched and broken (empty `assets/`, no cert-images).
That's now wrong. Someone (a prior session or the user directly) ran four Node scripts that
already live at `portfolio-3/{fix_images.js,update_html.js,update_css.js,update_js.js}`
against `public/professional/index.html|css/style.css|js/main.js`. **These have already been
executed** — their output is baked into the live files, not just sitting as unrun scripts.

Confirmed current reality (re-verify with a fresh `read_text_file` before trusting further,
things may keep moving):

- `public/professional/index.html` now sources **all** images via `../filename` paths pointing
  into the shared `portfolio-3/public/` folder (game's asset pool) — e.g. `../preview-14.webp`,
  `../generated/argus-eye.png`, `../WhatsApp Image 2026-07-30 at 19.51.45 (2).webp`. It no
  longer references `assets/award-*.jpg` etc. at all.
- It has: a preloader overlay, a hero profile picture, `.section-animate` class on all 7
  sections with **partial** per-section delay variation (not full distinct animations yet —
  see §3), and images injected into all 6 Builder Arc project cards.
- **§3 image-sourcing decision from v1 is already made for you: Option 1 (treat
  `public/professional` as the real deploy target, reference the shared `public/` folder via
  `../`) is what's in production.** Don't second-guess this or try to switch strategies.
- `Eshan_Portfolio/` (the standalone source folder) is **stale** — still the old version, no
  preloader, still references its own `assets/*.jpg`. It has NOT been touched by the update
  scripts (they only wrote to `public/professional/`). Treat `Eshan_Portfolio/` as effectively
  deprecated/secondary unless the user says otherwise — don't spend budget syncing it unless
  asked. If asked, the fix is trivial: copy the finished `public/professional/index.html` /
  `css/style.css` / `js/*.js` text into `Eshan_Portfolio/`, but its `../filename.webp` paths
  won't resolve there (no parent `public/` folder in that standalone deploy) — you'd need to
  fall back to its own `assets/*.jpg` for image src, or leave it be.
- The `award-*.jpg` / `cert-*.jpg` files described in v1's dimension table
  (`Eshan_Portfolio/assets/*.jpg`) are **no longer referenced anywhere in `public/professional`**.
  They're now orphaned inside `Eshan_Portfolio/assets/` only. The "outframed" bug v1 diagnosed
  against those specific files is moot for the live site — **but a new version of the same bug
  may exist** with the new source images (see §2).

**Do not re-run `fix_images.js` / `update_html.js` / `update_css.js` / `update_js.js`.**
They're idempotent-ish (mostly `.replace()` on strings that already changed), but re-running
risks double-injecting the "NEW ADVANCED AESTHETICS" CSS/JS blocks. If you need similar edits,
edit the live files directly with `Filesystem:edit_file`, not by re-running these scripts.

## 2. Still-open problem: possible re-introduction of the framing bug

The trophy-card front faces (`.trophy-face.front img`, CSS: `object-fit: cover` inside a
fixed `320px`-tall box) now use different source images than v1's table covered
(`../preview-14.webp`, `../preview-12.webp`, `../preview-11.webp`, `../preview-13.webp`,
`../WhatsApp Image 2026-07-30 at 19.51.45 (2).webp`, `../preview-9.webp`). **These were not
individually dimension-checked this session.** From v1's own image catalogue (§4 of v1, still
valid): `preview-9.webp` is confirmed **480×600 portrait** — used for the "Three star win
streak" trophy card — so the crop bug likely still exists on at least that one card. The
others are unverified.

**Recommended fix (not yet applied):** convert every `.trophy-face.front` to a letterbox
structure — a blurred `object-fit:cover` background layer + a sharp `object-fit:contain`
foreground layer — so cropping is impossible regardless of source aspect ratio, without
needing to dimension-check each image. This was v1's own recommendation (§2, option b) and
still stands as the right call. Concrete markup/CSS to apply, per trophy card:

```html
<div class="trophy-face front">
  <img class="trophy-img-bg" src="../preview-14.webp" alt="">
  <img class="trophy-img-fg" src="../preview-14.webp" alt="ADVAYA 2.0 win">
  <div class="trophy-badge gold">1st</div>
  <div class="trophy-face-label">ADVAYA 2.0</div>
</div>
```
```css
.trophy-face.front { position: relative; }
.trophy-img-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; filter: blur(18px) brightness(0.5) saturate(1.2);
  transform: scale(1.15); opacity: 0.82;
}
.trophy-img-fg {
  position: relative; width: 100%; height: 100%;
  object-fit: contain; z-index: 1;
}
.trophy-face.front::after { z-index: 2; } /* keep the existing gradient overlay on top */
```
Apply to all 6 trophy cards (same two-image pattern, swap `src`/`alt` per card). Verify in a
browser afterward — this is a CSS-only, image-agnostic fix, no need to pre-check dimensions.

## 3. Confirmed win: a real image source for the Certifications section

v1 assumed the only candidate images for a Certifications section were
`Eshan_Portfolio/assets/cert-{axiom,icriet-appreciation,sentinel}.jpg` — which are **not**
reachable from `public/professional/index.html` without a binary copy (the known MCP
limitation v1 flagged in its §3).

**This session found a better, already-available source:** `portfolio-3/public/certs/`
contains real course/skill certificate badges, already inside the shared `public/` folder, so
they're reachable via the exact same `../certs/filename.webp` pattern already used everywhere
else. No binary copy needed. Contents:
```
python_basic_certificate.webp   sql_basic_certificate.webp   java_basic_certificate.webp
problem_solving_basic_certificate.webp   Design_and_analysis_of_algorithms.webp
Ethical_Hacking.webp   AI_IN_HRM.webp
(+ png dupes: python_cert.png, sql_cert.png, java_cert.png, ps_cert.png, daa_cert.png,
  eh_cert.png, hr_cert.png — likely older/lower-res versions of the same certs, prefer the
  .webp files)
```
These look like HackerRank/NPTEL-style certs (matches memory: "HackerRank SQL certification
prep"). **Not yet dimension-checked or content-verified** — before writing final copy, either
view each `.webp` (via `view` on the copied file, after `copy_file_user_to_claude`) to confirm
what each actually shows, or ask the user to confirm titles/issuers if any filename is
ambiguous (e.g. `AI_IN_HRM.webp`, `Ethical_Hacking.webp` — don't invent the issuing body).

**Recommended section placement:** between Trophies and Builds (both are "evidence" sections;
Certifications bridges naturally into the more technical Builder Arc). Use `object-fit:contain`
on a neutral/dark background for each badge (certificates have legible text — don't crop them
with `cover`), in a responsive grid, 3-up on desktop.

## 4. Actually completed this session

Only one real edit was made and verified before this handoff was written:

- **Fixed a live CSS bug** in `public/professional/css/style.css`: `.preloader-mark` and
  `.preloader-text` referenced undefined custom properties (`var(--neon-cyan)`,
  `var(--text-muted)`) that don't exist anywhere in `:root` (the actual tokens are `--cyan`,
  `--ink-lo`, etc. — see the design-tokens block at the top of the file). This silently broke
  the preloader's intended glow/color styling on load. Fixed to reference the real tokens.
  **This edit is applied and live in the file right now** — nothing else in this doc has been
  written to disk yet.

Everything else below is diagnosed and planned but **not yet applied**.

## 5. Remaining work, in priority order

1. **Letterbox the 6 trophy-card front images** (§2 above) — highest priority, fixes a
   possibly-still-live visual bug, code is ready to paste in §2.
2. **Add the Certifications section** (§3 above) using `public/certs/*.webp` — verify image
   content first, then write honest copy per badge, matching existing section markup patterns
   (copy the structure of `.research-card` or `.beyond-card` for a single badge, or build a
   dedicated `.cert-grid` — either works, dedicated grid probably reads cleaner for 7 badges).
   Remember to:
   - Add a nav link (`<a href="#certifications" data-nav>Certifications</a>` in `.topnav-links`)
   - Add `section-animate` and a unique class (e.g. `certifications`) to the new `<section>`
   - Add the new section id to `js/game.js`'s `ACHIEVEMENTS` array (for the XP/achievement
     system) **and** its `sectionOrder` array (for the `1`–`8` keyboard shortcuts — update the
     `kbd-hint` label text from "1–7" to "1–8" too)
   - `js/main.js`'s `levelContent` object is keyed to the level-map modal buttons only
     (`research`/`builds`/`streak`/`beyond`/`contact`) — that system is separate from the main
     section flow and does **not** need a Certifications entry unless you also add a 6th
     `level-node` button to the journey/level-map UI (optional scope creep — skip unless asked)
3. **Give every section a genuinely distinct entrance animation** — still only partially done.
   Current state: generic `.section-animate`/`.in-view` fade-up-and-translateY applies to all
   7(+1) sections uniformly, with only `transition-delay` and a slight `scale` differing for
   `.trophies`. This was flagged in v1 as **the single most impactful "make it top notch"
   lever** and it's still mostly undone. Ideas from v1 §7 still apply: origin timeline nodes
   draw in sequentially; journey path draws via `stroke-dashoffset` before nodes pop; trophies
   = staggered 3D flip-in cascade; certifications/gallery = masonry scale+blur-in with
   per-card stagger; research = scanline sweep or terminal unroll; beyond = parallax slide-in
   from alternating sides; contact = radar/ping expand from center. Implement via CSS
   (`nth-child` delays on children, distinct `@keyframes` per section class) — the JS
   observer logic in `main.js`/`game.js` already just toggles `.in-view`/`.in` classes, so no
   JS changes should be needed, only CSS.
4. **Delete truly unwanted assets** (v1 §5.10) — only after confirming zero references. Given
   §1's finding that `Eshan_Portfolio/assets/*.jpg` (the original award-*/cert-* files) are now
   fully orphaned from `public/professional`, they're candidates — but confirm
   `Eshan_Portfolio/index.html` (the stale standalone copy) still needs them before deleting
   anything, since deleting there would break that standalone deploy.
5. **Sanity pass**: re-read the final `index.html` and confirm every `<img src="...">` resolves
   to a real file, given the confirmed Option-1 sourcing strategy.

## 6. Non-negotiables (recap, unchanged)
- Never touch `portfolio-3/src/` or root-level `portfolio-3/public/*` files (the finished game
  version) — only its `professional/` subfolder.
- No binary file writes via `Filesystem:write_file` — text files only.
- Don't re-run `fix_images.js`/`update_html.js`/`update_css.js`/`update_js.js` (§1).
- Keep the site functional at every step — don't leave it broken mid-edit if budget runs out;
  if you have to stop, write a handoff like this one instead of leaving silent partial edits.
