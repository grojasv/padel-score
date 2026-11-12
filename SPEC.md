# Padel Score: plan and decisions

Phone scoreboard for padel (and tennis) matches, run by **Bolo**, a bouncy padel ball with spiky anime-hero hair. It speaks the score after every point, and the players score points by voice ("rojo", "verde") or by tapping. ES is the main and tested language; CA and EN are translations.

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
Split since v0.4.0:
- **New match** (`#/setup`) holds only the player names, the first serve and "¡A jugar!", plus a one-line summary of the rules with a link to Ajustes.
- **Ajustes** (`#/settings`, a button on the hub) holds the rest: mode, 40-40, third set, time and voice. Each change is saved at once.
- **Mic button in a match**: the 🎙 next to the clock turns voice control on and off for that match (`m.micOff`). Turning it on asks for the mic inside the tap and always starts a fresh recognizer.
- **Listen loop**: one recognizer at a time; pause/stop drop it at once and ignore its late events; a recognizer with no `onstart` in 5 s is replaced. The listener is created held while Bolo speaks, so it is never started and aborted at once.
- **Remote** (Ajustes → Mando, `setup.remote`): a silent 10 s looping WAV, started inside the Start tap, makes the match the phone's playing media. Media Session handlers: previoustrack/seekbackward = red, nexttrack/seekforward = blue, play/pause = undo. keydown: ←/PageUp red, →/PageDown blue, ↑/↓/Backspace undo (volume keys never reach the page). Remote presses skip the mic's anti-echo gate; the same action within 400 ms counts once. Metadata: title = points, artist = games/sets. If the track is paused (audio focus taken by speech), it is restarted. Untested on a real band: needs Mi Fitness with notification access.
- **Probar micrófono** (in Ajustes → Voz): permission state before and after a getUserMedia request made inside the tap, then 6 s of real recognition. Each failure shows its fix, and the result can be copied to send.

Everything below is remembered between matches.
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
  - When it ends, the match ends. The end screen offers +30 min or no limit (`Scoring.reopen`): same score, the end-screen time is not counted. The winner is the leader in sets, then games in the current set, then total games. If all of these are equal, the match is a **draw**.
  - In a tie-break, it ends at the end of the tie-break.
- **Undo:** the state is immutable. Each point pushes the previous state onto a stack, undo pops it, and there is no limit.
- **Edit panel:** sets the points, games and server directly, and can end the match now. It refuses a change that would end a set. Each change goes onto the undo stack. Sets are not edited: undo covers a wrong set.

## Ping pong (`pingpong.js`, covered by `test-pingpong.mjs`)
- **Sport switch** at the top of the hub (`setup.sport`: 'padel' | 'pingpong'), remembered. It sets `data-sport` on `<html>` (orange tokens), `Bolo.sport` (orange ball, no seam) and the title. A match uses its own sport while open.
- **Settings** of their own: `ppMode` (singles default, doubles) and `ppBestOf` (1, 3 default, 5), so switching sport loses nothing. No time limit, golden point or third set.
- **Rules:** games to 11, win by 2. Best of 1, 3 or 5. Serve changes every 2 points, every point from 10-10. The first receiver of a game serves first in the next, to the player who served first. Ends change after every game except the last, and when a side first reaches 5 in the deciding game; in doubles the receivers swap then. Short match (Guille, 2026-11-11): one game to 6, serve every point from 5-5, ends change at 3 (`points: 6`, stored as `ppBestOf: 6`).
- **Doubles rotation:** A1→B1, B1→A2, A2→B2, B2→A1 (the receiver serves next, to the partner of the last server). In setup, "1.º en …" is the first server for the serving side and the first receiver for the other.
- **State** reuses padel's field names where the screen reads them: `points` (this game), `games` (games won, the big box), `sets` (finished games with their score, the centre strip), plus `srv`/`rcv`.
- **Calls:** server's score first ("cinco tres", "diez iguales"), "Bola de juego" / "Bola de partido", "Juego rojo. Uno cero", "Cambio de campo". Bolo's lines: `ppHello`, `ppGame`, `ppFinish` replace `hello`, `game`, `finish`.

## Scoreboard screen (landscape)
- Two halves: **left red, right blue.** Each half shows a huge point score (15/30/40/AD, or tie-break digits), the games in the current set and the set scores, plus a 🎾 marker on the server (and the server's name if set).
- A narrow centre strip shows the clock (elapsed time, or remaining time if a limit is on), a mic status dot, the sets, a small Bolo (he reacts to every point), a big gold **Deshacer** and a ••• menu with Corregir, Bolo's voice, Pausa and Salir. A tap on a half while the menu is open only closes it.
- **Tap a half** = point for that team. A 600 ms tap guard stops double taps.
- **Long-press** the centre (or ✏️) opens the edit panel.
- Pause / exit with confirm. Screen wake lock while a match is open.
- By default the halves never swap: red stays left. With **Ajustes → Lados** (`setup.swapSides`) they follow the players: the engine flips `state.swapped` on every `changeEnds`, so undo restores the sides too.
- Sized for a tablet on the net, read from 5 m: points up to ~50% of the height, games in a large box, a thick ball-yellow ring and a yellow name pill on the serving half.
- **Summary** after every game, set and tie-break change of ends: full screen, black, 6 s, tap or the next point closes it. Shows the winner, the games (sets after a set) in team colours, set scores, the next server and "Cambio de campo".

## Voice out (umpire style)
- After each point Bolo says the score with the **server's score first**: "Quince-cero", "Treinta iguales", "Iguales" / "Deuce", "Ventaja rojo", "Punto de oro".
- On a game: "Juego rojo. Cuatro-tres rojo." On a set: "Set azul, seis-cuatro." On the match: winner + score, plus a line from the `finish` pool. A short Bolo comment from `lines.json` comes on games and sets only, never on each point.
- Special moments: set point, match point ("punto de partido"), cambio de campo, tie-break, time warnings, and the last game.
- Lines are short (under about 12 words), with no emoji. Voices are `es-ES`, `ca-ES` and `en-GB`. If there is no `ca-ES` voice, fall back to ES and show a note, as gym-coach does.

## Voice in (`voice.js`)
- Uses Web Speech `SpeechRecognition` / `webkitSpeechRecognition`, `continuous` + `interimResults`, in the language of the UI.
- **Commands** (ES / CA / EN). A point needs the colour word alone, or with "punto"/"punt"/"point":
  - point red: `rojo` / `vermell` / `red`
  - point for the second team (id `blue`, shown **green** since 0.9.0, Guille 2026-11-12): `verde` / `verd` / `green`, plus the old `azul` / `blau` / `blue` and `turquesa`. Near misses for verde in `LOOSE` ("berde", "verdi", "verte"…).
  - Why: `turquesa` was added in 0.8.2 (2026-11-12) because on court "azul" scored by voice 49% of blue points vs 68% for "rojo"; a word with hard T and K sounds should carry better, to be checked in the next heard log)
  - undo: `deshacer`, `anula` / `desfés`, `anul·la` / `undo`, `cancel`. Not "error" or "atrás": players say those during play.
  - repeat score: `marcador` / `marcador` / `score`
  - pause: `pausa` / `pausa` / `pause`
  - Player names score for their team **only in strict mode** ("punto Ana"). Players call each other by name all game.
  - EN colour words (`red`, `blue`) count only when the app is in English, because "red" is Spanish for the net.
  - Only the top recognition alternative is used, so "¡ojo!" is less likely to become "rojo".
  - Small near-miss lists ("roja", "azúl", "a sul"…) live in `voice.js`. Normal mode also accepts what Chrome writes for a colour shouted from far away (`LOOSE`: "rollo", "royo", "a sur", "hazul"…). The cost: "qué rollo" scores red, and undo fixes it.
- **Strict mode** (setting): only "punto + colour" counts. Use it if false points happen.
- **Anti-echo:**
  - Recognition is aborted before every `speak()` and restarted 700 ms after the speech ends.
  - Each call has an id, so the late `onend` of a cancelled call cannot reopen the mic.
  - A fallback timer restarts it, because `onend` is unreliable: the estimated length, re-armed while `speechSynthesis.speaking` is still true.
  - Commands are dropped while Bolo speaks and for 700 ms after.
- **Keep-alive:** Chrome ends recognition after silence or about a minute, so the loop restarts it on `onend`/`onerror`, with backoff on `not-allowed`/`network` errors. The mic dot shows the state: green listening, grey paused, red error with a tap to retry.
- **De-dup:** one command per result. The same command within 1.5 s is ignored, and final results are preferred over interim ones.
- **Confirm:** a voice point plays a loud three-note sound (a tap or remote plays the short two-tone one) right away, then the score is spoken. If it was wrong, say "deshacer".
- **Heard log** (for tuning):
  - Every final phrase, command, error and tap is stored with the match time and what it did. This is capped at 250 entries per match, and kept on the 10 newest history entries.
  - Viewed from the ✏️ panel, the finish screen and the history, with a copy-as-text button.
- **Limits** (shown in the setup help):
  - Chrome on Android needs network for recognition.
  - Firefox has no recognition, so the voice toggle is hidden.
  - iOS Safari is flaky.
  - `ca-ES` recognition may be missing. If it fails, fall back to `es-ES` and accept the CA words too.
  - Only a test on Guille's phone can confirm all this.

## Bolo (mascot)
- Original design: a fuzzy yellow-green padel ball with the white seam curve and big expressive eyes. The eyes bounce and follow taps. He has black spiky anime-hero hair.
- The hair **turns gold** on set point, match point, every golden point (sudden death at 40-40) and the win, with a short glow.
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
