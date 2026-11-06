# Padel Score: plan and decisions

Phone scoreboard for padel (and tennis) matches, run by **Bolo**, a bouncy padel ball with spiky anime-hero hair. It speaks the score after every point, and the players score points by voice ("rojo", "azul") or by tapping. ES is the main and tested language; CA and EN are translations.

Decisions taken with Guille on 2026-11-06 in the planning session. The shell is copied from `grojasv/gym-coach`.

## Stack and shell (reused from gym-coach)
- Plain HTML/CSS/JS, no build step, GitHub Pages at `https://grojasv.github.io/padel-score/`, relative paths only.
- Copied from gym-coach and adapted:
  - the `store` wrapper (localStorage in try/catch)
  - the language switch (CA/ES/EN buttons, `navigator.language` guess, `t()` helper)
  - the install button with the `beforeinstallprompt` + manual help fallback
  - the footer with `VERSION`
  - the network-first `sw.js` with `cache: 'no-cache'` and the `CACHE` bump rule
  - the Web Audio `beep()`
  - speech priming, AudioContext resume and Wake Lock inside the Start tap, re-asked on `visibilitychange`
  - the UMD mascot reused by `scripts/make-icons.mjs` (resvg via uv)
  - `CHANGELOG.md` (Keep a Changelog + SemVer)
  - the CLAUDE.md / SPEC.md / README.md layout
- `manifest.webmanifest`: `orientation: "any"` (the hub is portrait, the scoreboard is landscape). Orientation lock only works in fullscreen, so the scoreboard shows a "turn your phone" hint in portrait and still works there with a stacked layout as fallback.

## Files
- `index.html`, `style.css`: the shell. Tokens on `:root`, light and dark. Red team `--red`, blue team `--blue`.
- `app.js`: the hub (Bolo, Start match, setup, history), languages, install, footer, `VERSION`.
- `scoring.js`: **pure** scoring engine, UMD, no DOM. `Scoring.init(config)`, `Scoring.point(state, team)`, `Scoring.describe(state, lang)` for the spoken line.
- `match.js`: the scoreboard screen. Taps, undo stack, edit panel, clock, voice out, wake lock.
- `voice.js`: speech recognition loop and command matching.
- `mascot.js`: Bolo as SVG (`Bolo.svg(mood)`, `Bolo.head()`), UMD.
- `data/lines.json`: Bolo's line pools (ES/CA/EN).
- `scripts/test-scoring.mjs` and `scripts/test-voice.mjs`: node tests for the engine and the command matcher. `scripts/validate.mjs`: checks `lines.json` (3 languages, word limit). `scripts/make-icons.mjs`.

## Main screen (hub)
- Bolo, big, bouncing gently. His eyes follow the last tap. A random `hello` line sits in a speech bubble.
- Big **Nuevo partido** button → setup (pre-filled with the saved defaults) → **Empezar** (this tap unlocks audio, mic and wake lock).
- If a match is in progress (saved in localStorage), a **Continuar partido** button is shown. A page reload never loses a match.
- History: the last matches (date, teams, set scores, duration, winner or draw). Kept in `padel-score.log`, newest first, 100 max.

## Setup (saved as defaults in `padel-score.setup`)
- **Mode:** Dobles (default) or Individual (tennis singles).
- **Teams:** Rojo and Azul are fixed colours. Optional player names: 2 per team (1 in singles).
- **40-40:** Punto de oro (default) · Ventaja · Star point (advantage twice, then golden point).
- **Third set:** Normal set or Super tie-break to 10 (default: super tie-break).
- **Format:** fixed best of 3 sets, sets to 6, tie-break to 7 at 6-6.
- **Time limit:** Off · 45 · 60 · 75 · 90 · 120 min.
- **First serve:** Rojo, Azul or Sortear (random). In doubles, setup also asks which player of each team serves that team's first game.
- **Voice control:** on/off. **Strict commands** (require "punto rojo"): off by default.
- **Bolo talks:** on/off (mute silences speech, beeps stay on, as in gym-coach).

## Scoring engine rules (`scoring.js`, all covered by `test-scoring.mjs`)
- **Points:** 0, 15, 30, 40, game.
- **At 40-40:**
  - *Advantage* (win by 2).
  - *Golden point* (next point wins). In doubles the receiving team chooses the side, which the app does not track.
  - *Star point*: advantage on the first two deuces. On the third deuce, the next point wins.
- **Sets:** first to 6 games with a 2-game lead. At 6-6, a tie-break to 7 (win by 2), and the set ends 7-6.
- **Super tie-break** (if on, replaces set 3 at 1-1 in sets): first to 10, win by 2. It counts as the set, recorded as 1-0 with the tie-break score.
- **Match:** best of 3.
- **Serve:**
  - The server alternates teams every game.
  - In doubles the order is A1, B1, A2, B2. Each team's first server is set at setup.
  - In a tie-break, the next server serves 1 point, then each serves 2.
  - After a tie-break, the team that received first in it serves the next game.
- **Change ends** after odd games (1, 3, 5…), and every 6 points in a tie-break. Bolo announces "cambio de campo".
- **Time limit:**
  - Bolo warns at 5 min and 1 min.
  - At 0 the current game is the last ("último juego").
  - When it ends, the match ends. The winner is the leader in sets, then games in the current set, then total games. If all of these are equal, the match is a **draw**.
  - In a tie-break, it ends at the end of the tie-break.
- **Undo:** the state is immutable. Each point pushes the previous state onto a stack, undo pops it, and there is no limit.
- **Edit panel:** sets the points, games and server directly, and can end the match now. It refuses a change that would end a set. Each change goes onto the undo stack. Sets are not edited: undo covers a wrong set.

## Scoreboard screen (landscape)
- Two halves: **left red, right blue.** Each half shows a huge point score (15/30/40/AD, or tie-break digits), the games in the current set and the set scores, plus a 🎾 marker on the server (and the server's name if set).
- A centre strip shows the clock (elapsed time, or remaining time if a limit is on), a mic status dot, Bolo (small, he reacts to every point) and **Deshacer**.
- **Tap a half** = point for that team. A 600 ms tap guard stops double taps.
- **Long-press** the centre (or ✏️) opens the edit panel.
- Pause / exit with confirm. Screen wake lock while a match is open.
- The halves never swap on a change of ends. Red stays left, so nobody gets confused.

## Voice out (umpire style)
- After each point Bolo says the score with the **server's score first**: "Quince-cero", "Treinta iguales", "Iguales" / "Deuce", "Ventaja rojo", "Punto de oro".
- On a game: "Juego rojo. Cuatro-tres rojo." On a set: "Set azul, seis-cuatro." On the match: winner + score, plus a line from the `finish` pool. A short Bolo comment from `lines.json` comes on games and sets only, never on each point.
- Special moments: set point, match point ("punto de partido"), cambio de campo, tie-break, time warnings, and the last game.
- Lines are short (under about 12 words), with no emoji. Voices are `es-ES`, `ca-ES` and `en-GB`. If there is no `ca-ES` voice, fall back to ES and show a note, as gym-coach does.

## Voice in (`voice.js`)
- Uses Web Speech `SpeechRecognition` / `webkitSpeechRecognition`, `continuous` + `interimResults`, in the language of the UI.
- **Commands** (ES / CA / EN). A point needs the colour word alone, or with "punto"/"punt"/"point":
  - point red: `rojo` / `vermell` / `red`
  - point blue: `azul` / `blau` / `blue`
  - undo: `deshacer`, `anula` / `desfés`, `anul·la` / `undo`, `cancel`. Not "error" or "atrás": players say those during play.
  - repeat score: `marcador` / `marcador` / `score`
  - pause: `pausa` / `pausa` / `pause`
  - Player names score for their team **only in strict mode** ("punto Ana"). Players call each other by name all game.
  - EN colour words (`red`, `blue`) count only when the app is in English, because "red" is Spanish for the net.
  - Only the top recognition alternative is used, so "¡ojo!" is less likely to become "rojo".
  - Small near-miss lists ("roja", "azúl", "a sul"…) live in `voice.js`.
- **Strict mode** (setting): only "punto + colour" counts. Use it if false points happen.
- **Anti-echo:**
  - Recognition is aborted before every `speak()` and restarted 700 ms after the speech ends.
  - Each call has an id, so the late `onend` of a cancelled call cannot reopen the mic.
  - A fallback timer restarts it, because `onend` is unreliable: the estimated length, re-armed while `speechSynthesis.speaking` is still true.
  - Commands are dropped while Bolo speaks and for 700 ms after.
- **Keep-alive:** Chrome ends recognition after silence or about a minute, so the loop restarts it on `onend`/`onerror`, with backoff on `not-allowed`/`network` errors. The mic dot shows the state: green listening, grey paused, red error with a tap to retry.
- **De-dup:** one command per result. The same command within 1.5 s is ignored, and final results are preferred over interim ones.
- **Confirm:** every accepted command plays a short two-tone sound right away, then the score is spoken. If it was wrong, say "deshacer".
- **Limits** (shown in the setup help):
  - Chrome on Android needs network for recognition.
  - Firefox has no recognition, so the voice toggle is hidden.
  - iOS Safari is flaky.
  - `ca-ES` recognition may be missing. If it fails, fall back to `es-ES` and accept the CA words too.
  - Only a test on Guille's phone can confirm all this.

## Bolo (mascot)
- Original design: a fuzzy yellow-green padel ball with the white seam curve and big expressive eyes. The eyes bounce and follow taps. He has black spiky anime-hero hair.
- The hair **turns gold** on set point, match point and the win, with a short glow.
- **Moods:**
  - `idle` (gentle bounce)
  - `happy`, which squashes and stretches on each point
  - `fierce` (eyebrows down, on big points)
  - `sad`, a brief look toward the team that lost the point
  - `cheer` (match end)
  - `talk`, which animates the `<g class="bolo-mouth">` group
- **Naming:** no third-party names or references in the code, ids or docs. The design is original.
- Icons come from `Bolo.head()` via `make-icons.mjs`.

## Data
- `padel-score.setup`: the last setup (defaults).
- `padel-score.current`: the match in progress (config + state + undo stack + clock start/pauses).
- `padel-score.log`: finished matches `{ at, config, sets: [[6,4],[3,6],[10,8,'stb']], winner: 'red'|'blue'|'draw', minutes, endedBy: 'score'|'time'|'abandoned' }`.
- `data/lines.json`: pools keyed by moment.
  - Keys: `hello`, `start`, `game`, `set`, `setPoint`, `matchPoint`, `tiebreak`, `changeEnds`, `timeWarn`, `lastGame`, `finish`, `draw`, `paused`.
  - Each key holds `{ es: [...], ca: [...], en: [...] }`, with placeholders `{team}` and `{n}`.

## Quality gates
- Run `node scripts/test-scoring.mjs`, `node scripts/test-voice.mjs` and `node scripts/validate.mjs` before every commit.
- Check the hub in portrait at 320×568 and 390×844. Check the scoreboard in landscape at 568×320 and 844×390. Do both in light and dark.
- Voice in and out can only be confirmed on a real phone (Guille, Android Chrome).

## Release
- Public repo `grojasv/padel-score`, push to `main`, Pages from the `main` root (approved by Guille, 2026-11-06).
- Commits use the GitHub noreply email (repo-local git config).
- v0.1.0 = everything above.
