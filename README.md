# 🎾 Padel Score

Bolo, a padel ball with spiky hero hair, keeps the score of your padel or tennis match on the phone. He calls every point out loud, and you score by saying "rojo" or "azul" or by tapping. ES / CA / EN.

**Live:** https://grojasv.github.io/padel-score/

The plan and data formats are in [SPEC.md](SPEC.md), and the project rules in [CLAUDE.md](CLAUDE.md). The shell is borrowed from [gym-coach](https://github.com/grojasv/gym-coach).

## What it does
- **Setup, saved as your defaults:**
  - Doubles or singles, teams Rojo and Azul with optional names.
  - At 40-40: golden point, advantage or star point.
  - Super tie-break or a normal third set.
  - Court time limit and first serve.
- **Scoreboard:** landscape, red half on the left and blue on the right. Tap a half to give that team a point.
  - Unlimited undo.
  - An edit panel to fix points, games and the server.
  - Serve rotation, change of ends, tie-breaks, set point and match point.
- **Voice:** Bolo calls the score umpire style, with the server's score first. Say "rojo" / "azul" (or "punto rojo"), "deshacer", "marcador" or "pausa". The mic pauses while Bolo talks.
- **Time limit:** Bolo warns at 5 and 1 minute. Then the current game is the last one, and the leader wins (a draw is possible).
- **History** of finished matches, stored on the phone. A match in progress survives a reload.

## Structure
- `index.html`, `style.css`, `app.js`: the hub, setup and shell. There is no build step.
- `scoring.js`: the scoring rules (pure, tested). `match.js`: the scoreboard. `voice.js`: voice commands.
- `mascot.js`: Bolo (SVG). `data/lines.json`: his lines.
- `scripts/`: tests, the lines validator and the icon generator.

## Run locally
```bash
python3 -m http.server 8767
```
Then open http://localhost:8767/.

## Tests
```bash
npm install   # once: Playwright, for the browser test
npm test
```
