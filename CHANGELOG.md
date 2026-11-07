# Changelog

All notable changes to Padel Score. Format: [Keep a Changelog](https://keepachangelog.com/), versions: [SemVer](https://semver.org/). New feature = minor, fix or content tweak = patch.

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
