# Changelog

All notable changes to Padel Score. Format: [Keep a Changelog](https://keepachangelog.com/), versions: [SemVer](https://semver.org/). New feature = minor, fix or content tweak = patch.

## [0.6.1] - 2026-11-10
### Changed
- Match screen: one big gold **Deshacer** button. Fix, Bolo's voice, pause and exit moved into a ••• menu (tapping a half while it is open only closes it, so no point is scored by mistake).
- A narrower centre and a smaller Bolo leave more room for the points (up to 56% of the height) and the games.

## [0.6.0] - 2026-11-10
From Guille's first real match, with a tablet on the net.
### Added
- A big black summary after every game, set and tie-break change of ends, for 6 s (tap to close, the next point closes it too): who won the game, the games (or sets) huge in team colours, the set scores, who serves next, and "⇄ Cambio de campo" when it is time to change.
- ⚙️ Ajustes → Lados: red and blue swap sides on the screen at every change of ends (after games 1, 3, 5…, every 6 tie-break points, after an odd set). Off by default. Undo swaps them back. The remote stays ⏮ red, ⏭ blue.
- When the time limit ends the match, the end screen offers "⏳ +30 min" and "∞ Sin límite": the match opens again with the same score. The time spent on the end screen does not count.
- A point heard by voice plays a louder three-note sound, so you know from the far end of the court that it was heard.
- Looser voice words for colours shouted from far away ("rollo", "royo", "a sur", "hazul"…), in normal mode only. Strict mode is unchanged.
### Changed
- The scoreboard is built to be read from 5 m: points up to half the screen height, games in a big box, team names bigger, the sets and clock bigger. The serving side has a thick yellow ring and a yellow pill with the server's name. Bolo is smaller.

## [0.5.1] - 2026-11-09
### Changed
- The band shows the winner and every set at the end ("¡Gana Guille · Ana!", "6-4 · 6-7 · 10-8"), "Súper tie-break" during it, and "Tie-break" next to 6-6.
### Fixed
- Bolo's bubble no longer slips under the buttons on a short screen (two lines at most, Bolo shrinks instead), and Bolo is sized by the height Chrome's bars leave free.
- Bubble sentences start with a capital ("Juego rojo. Seis iguales.").
### Tested
- A full match (6-4, 6-7, 10-8) on an Android 17 emulator with Chrome 149, scored only with Android media buttons (the band's path): 127 presses, every score equal to scoring.js, including a game with the phone locked, a paused match, golden point, undo and undo from the finish.

## [0.5.0] - 2026-11-09
### Added
- ⚙️ Ajustes → Mando → «Pulsera o mando Bluetooth». During a match the app plays a silent track, so the music buttons of a band (Mi Band via Mi Fitness), watch or headphones control the score: ⏮ point red, ⏭ point blue, ⏯ undo. The band shows the score as the "song" (points as title, games as artist).
- Bluetooth remotes and keyboards: ← / PageUp point red, → / PageDown point blue, ↑ / ↓ / Backspace undo. The same action twice within 400 ms counts once. Every remote press is in the heard log (⌚), and so is each unknown key the first time, so a new clicker can be mapped.
### Fixed
- The empty mic-test box no longer shows in Ajustes before the test runs.

## [0.4.2] - 2026-11-07
### Fixed
- Voice control never started in a match on Android (broken since 0.3.2). The mic started, Bolo's first line paused it at once, and a recognizer aborted before it starts may never report that it ended, so the loop waited forever. Now the mic waits for Bolo's line before starting, a stopped recognizer is dropped at once, and one that does not start within 5 s is replaced ("mic stuck: restart" in the heard log).
### Added
- The 🎙 next to the clock turns voice control on and off during the match (slashed when off). Each tap is in the heard log.

## [0.4.1] - 2026-11-07
### Added
- ⚙️ Ajustes → «Probar micrófono»: asks for the mic permission inside the tap, shows the permission state before and after, then listens for 6 seconds and shows what Bolo heard. When something fails it says how to fix it (site blocked in Chrome, or the Google app without mic permission) and the result can be copied.

## [0.4.0] — 2026-11-06
### Changed
- **The new-match screen has only the essentials:**
  - player names
  - who serves first ("1.º en Rojo" shows only when both names of a team are filled in)
  - "¡A jugar!"
  - one line with the rules in use, which links to Ajustes
- **New ⚙️ Ajustes page** on the main screen, for the format, the 40-40 rule, the third set, court time and voice. Every change is saved at once and is the default for every new match. Names and the serve are remembered too.

## [0.3.2] — 2026-11-06
### Fixed
- **Voice control did not listen on Android.** The microphone is now requested inside the "¡A jugar!" / "Continuar" tap, which is where Chrome on Android shows the permission prompt. Before, the first request came from a timer, Chrome could refuse it, and the app then stopped listening for the whole match.
- **A blocked mic is now visible.** A red banner explains how to allow it in Chrome or in the Android settings. Tapping it asks again.
- The app no longer waits forever on a phone that reports Bolo is "still talking". The mic comes back at the latest after three times the expected length.
- Mic errors ("audio-capture", "network") retry with a growing pause.
- "Lo que oyó Bolo" now records "mic on" and every mic problem.

## [0.3.1] — 2026-11-06
### Fixed
Found by playing a full match point by point (7-6, 3-6, 10-8 in the super tie-break):
- **Bolo celebrates on the finish screen.** Before, the result covered him.
- **"Bola de set" / "Bola de partido" stays on screen** for as long as it is true. Before, it went away after 4 seconds.
- **Tie-break sets read 7-6⁵,** with only the loser's tie-break points. This applies to the scoreboard and the finish screen.
- **At the end of the match the screen may sleep and the mic stops,** so a phone left on the finish screen doesn't drain the battery. Undoing the last point turns both back on.

## [0.3.0] — 2026-11-06
### Added
- **"Lo que oyó Bolo":** a log of every phrase the mic heard, with what it did:
  - ✅ done
  - 🔇 ignored because Bolo was talking
  - ↺ repeat
  - · no command
  - ⚠️ error
  - 👆 taps, since a tap often means the voice missed
- Open it from the ✏️ panel during a match, from the finish screen or from the history. **Copiar para enviar** copies it as text, ready for WhatsApp.
- The 10 newest matches keep their log.

## [0.2.1] — 2026-11-06
### Fixed
- **A new version now shows without closing the app.** It checks for updates every time it comes back to the screen. When a new version arrives it reloads by itself, or after you leave the scoreboard if you are mid-match. The old cache is deleted.
- The offline cache is now named after the version, so every release replaces it.

## [0.2.0] — 2026-11-06
### Added
- **Bolo goes gold on every golden point** (and on the star point's third deuce), with his fierce face, because the next point decides the game. His hair turns back to black after the point.

### Fixed
- Bolo's ball no longer turns black on the scoreboard when you open a match from the main screen (two drawings shared one colour id).

## [0.1.0] — 2026-11-06
### Added
- **Bolo**, the mascot: a padel ball with big eyes that follow your taps and spiky black hair. The hair turns gold on set point, match point and the win.
- **Match setup**, saved as defaults:
  - Doubles or singles, teams Rojo and Azul with optional player names.
  - At 40-40: golden point, advantage or star point.
  - Third set as a super tie-break to 10 or a normal set.
  - Court time limit and first serve (or a random draw).
- **Landscape scoreboard:**
  - Tap a half to give that team a point.
  - Unlimited undo, plus an edit panel for points, games and the server.
  - Serve rotation, change of ends, tie-breaks, set point and match point.
  - A portrait fallback.
- **Voice out:** Bolo calls the score umpire style, server's score first, with a short comment on games and sets.
- **Voice in:** "rojo" / "azul" (or "punto rojo"), "deshacer", "marcador" and "pausa" in ES, CA and EN. A strict mode accepts only "punto + colour". The mic pauses while Bolo talks.
- **Time limit:** warnings at 5 and 1 minute, then a last game. The leader wins, and a draw is possible.
- **Match history** and a match in progress that survives a reload.
- **Installable PWA** (offline shell) and ES / CA / EN.
