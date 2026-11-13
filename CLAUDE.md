# Padel Score: project rules

Phone scoreboard for padel and tennis, run by Bolo (a padel ball mascot) with voice in and out. Plain HTML/CSS/JS, no build step, GitHub Pages under `/padel-score/` (relative paths only). The plan, decisions and data formats are in `SPEC.md`. The shell is borrowed from `grojasv/gym-coach`.

## Files
- `index.html`, `style.css`: the shell. Tokens on `:root`, light and dark.
- `app.js`: hub, setup, history, languages, install, footer. **`VERSION` here must match `CHANGELOG.md`.**
- `scoring.js`: pure padel scoring engine (UMD, no DOM). Every rule change gets a test in `scripts/test-scoring.mjs`.
- `pingpong.js`: ping pong engine with the same API (`Match.engine(setup)` picks one by `setup.sport`). Tests in `scripts/test-pingpong.mjs`.
- `match.js`: the scoreboard, undo/edit, clock, voice out. `voice.js`: speech recognition and command matching.
- `fx.js`: effects that never block a tap: vibration, confetti, the court drawn at match start, the share card (canvas). All motion is off under `prefers-reduced-motion`.
- `mascot.js`: Bolo as SVG (UMD, reused by `scripts/make-icons.mjs`). Original design: no third-party character names or references anywhere.
- `data/lines.json`: Bolo's lines.

## Rules
- **ES is the source language.** CA and EN are translations. Every user-facing string has all 3.
- Spoken lines are short (under about 12 words), with no emoji or symbols.
- `npm test` must pass before every commit: the 3 engine and voice tests, `validate.mjs` and `scripts/test-browser.mjs` (real Chromium via Playwright; `npm install` once, dev tooling only, the app still has no build step).
- Everything that needs a user gesture (speech, AudioContext, mic, wake lock) happens inside the Start tap.
- The mic is paused while Bolo speaks (anti-echo). The recognition loop restarts itself.
- The match in progress is saved after every point. A reload never loses it.
- PWA: `CACHE` in `sw.js` is `padel-score-<VERSION>`, so **every release changes it** (validate.mjs checks it). That makes phones install the new worker, drop the old cache and reload. Icons: `node scripts/make-icons.mjs` (needs uv).
- Check the hub at 320×568 and 390×844 and the scoreboard at 568×320 and 844×390, in light and dark. Run with `python3 -m http.server 8767`.
- `CHANGELOG.md` (Keep a Changelog + SemVer) is updated in the same commit.
- Commits use the GitHub noreply email (repo-local git config), never a work address.
