# Changelog

All notable changes to Padel Score. Format: [Keep a Changelog](https://keepachangelog.com/), versions: [SemVer](https://semver.org/). New feature = minor, fix or content tweak = patch.

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
