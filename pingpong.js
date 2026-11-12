/* Ping pong (table tennis) scoring engine: pure functions, no DOM, the same API as scoring.js (padel), so the
 * match screen can use either. Browser: <script src="pingpong.js"> after scoring.js, then PingPong.init(config).
 * Node: const PingPong = require('./pingpong.js'). Rules are in SPEC.md § Ping pong rules.
 *
 * The state uses padel's field names where the screen reads them:
 *   points = the current game, games = games won (the big "Juegos" box), sets = finished games with their score
 *   (the centre strip), plus srv / rcv = who serves to whom now. */
(function (root) {
  'use strict';

  const base = typeof module === 'object' && module.exports ? require('./scoring.js') : root.Scoring;
  const TEAMS = ['red', 'blue'];
  const other = (t) => (t === 'red' ? 'blue' : 'red');
  const clone = (s) => JSON.parse(JSON.stringify(s));
  const BEST_OF = [1, 3, 5];

  /* config: { mode: 'singles' | 'doubles', bestOf: 1 | 3 | 5, points: 11 | 6, firstServe: 'red' | 'blue',
   *           firstPlayer: { red: 0, blue: 0 } }  firstPlayer: in doubles, who serves first for the serving side
   *           and who receives first for the other side. */
  function init(config) {
    const c = {
      mode: config.mode === 'doubles' ? 'doubles' : 'singles',
      bestOf: BEST_OF.includes(Number(config.bestOf)) ? Number(config.bestOf) : 3,
      points: Number(config.points) === 6 ? 6 : 11, // 6: the short game
      firstServe: config.firstServe === 'blue' ? 'blue' : 'red',
      firstPlayer: { red: config.firstPlayer?.red ? 1 : 0, blue: config.firstPlayer?.blue ? 1 : 0 },
    };
    if (c.mode === 'singles') c.firstPlayer = { red: 0, blue: 0 };
    const a = c.firstServe, b = other(a);
    const srv = { team: a, player: c.firstPlayer[a] }, rcv = { team: b, player: c.firstPlayer[b] };
    const order = c.mode === 'singles' ? [{ team: 'red', player: 0 }, { team: 'blue', player: 0 }]
      : [0, 1].flatMap((p) => TEAMS.map((team) => ({ team, player: p })));
    return {
      sport: 'pingpong',
      config: c,
      order, // every player, for the edit panel
      srv, rcv, // serving now, receiving now
      firstSrv: srv, firstRcv: rcv, // of this game: the next game swaps them
      sets: [], // finished games: { red, blue, kind: 'game' }
      setsWon: { red: 0, blue: 0 }, // unused in ping pong (kept so shared code never reads undefined)
      games: { red: 0, blue: 0 }, // games won
      points: { red: 0, blue: 0 },
      deuces: 0,
      tiebreak: null,
      lastGame: false,
      finished: false,
      winner: null,
      endedBy: null, // 'score' | 'stopped'
      swapped: false,
      switched: false, // the deciding game's change at 5 has happened
    };
  }

  const toWin = (s) => Math.ceil(s.config.bestOf / 2);
  const target = (s) => s.config.points || 11; // points to win a game
  const half = (s) => Math.floor(target(s) / 2); // the deciding game changes ends here: 5 of 11, 3 of 6
  const deciding = (s) => s.sets.length === s.config.bestOf - 1; // the last possible game
  const partner = (p, mode) => (mode === 'doubles' ? { team: p.team, player: 1 - p.player } : p);
  const server = (s) => ({ ...s.srv });
  const isGolden = () => false;

  function apply(prev, team) {
    if (prev.finished || !TEAMS.includes(team)) return { state: prev, events: [] };
    const s = clone(prev);
    const o = other(team);
    const ev = ['point'];
    s.points[team]++;
    const { red, blue } = s.points;

    const P = target(s);
    if (s.points[team] >= P && s.points[team] - s.points[o] >= 2) {
      // ---- game over ----
      s.sets.push({ red, blue, kind: 'game' });
      s.games[team]++;
      ev.push('game');
      s.points = { red: 0, blue: 0 };
      s.deuces = 0;
      s.switched = false;
      if (s.games[team] >= toWin(s)) {
        s.finished = true; s.winner = team; s.endedBy = 'score';
        ev.push('match');
        return { state: s, events: ev };
      }
      ev.push('changeEnds'); // ends change after every game
      s.swapped = !prev.swapped;
      // Next game: whoever received first serves first, to whoever served first.
      const [fs, fr] = [s.firstRcv, s.firstSrv];
      s.srv = { ...fs }; s.rcv = { ...fr }; s.firstSrv = { ...fs }; s.firstRcv = { ...fr };
      return { state: s, events: ev };
    }

    if (red === blue && red >= P - 1) { s.deuces++; ev.push('deuce'); }
    // Serve changes every 2 points, and every point from 10-10 (5-5 in the short game).
    if ((red >= P - 1 && blue >= P - 1) || (red + blue) % 2 === 0) {
      const next = { ...s.rcv };
      s.rcv = partner(s.srv, s.config.mode);
      if (s.config.mode === 'singles') s.rcv = { ...s.srv };
      s.srv = next;
    }
    // The deciding game: ends change when a side first reaches 5 (3 in the short game), and in doubles the receivers swap.
    if (deciding(s) && !s.switched && Math.max(red, blue) === half(s)) {
      s.switched = true;
      ev.push('changeEnds');
      s.swapped = !prev.swapped;
      if (s.config.mode === 'doubles') s.rcv = partner(s.rcv, 'doubles');
    }
    return { state: s, events: ev };
  }

  // What the next point would decide for each team: null | 'game' | 'match'.
  function stakes(s) {
    const out = { red: null, blue: null };
    if (s.finished) return out;
    TEAMS.forEach((t) => {
      const e = apply(s, t).events;
      out[t] = e.includes('match') ? 'match' : e.includes('game') ? 'game' : null;
    });
    return out;
  }

  function point(s, team) {
    const r = apply(s, team);
    if (r.state.finished) return r;
    const st = stakes(r.state);
    const t = st.red === 'match' || st.blue === 'match' ? 'matchPoint' : st.red || st.blue ? 'gamePoint' : null;
    if (t) r.events.push(t);
    return r;
  }

  const timeUp = (s) => s; // no time limit in ping pong
  function stop(s) {
    if (s.finished) return s;
    const n = clone(s);
    const cmp = (o) => (o.red > o.blue ? 'red' : o.blue > o.red ? 'blue' : null);
    n.finished = true; n.endedBy = 'stopped';
    n.winner = cmp(n.games) || cmp(n.points) || 'draw';
    return n;
  }
  function reopen(s) {
    if (!s.finished || s.endedBy === 'score') return s;
    const n = clone(s); n.finished = false; n.winner = null; n.endedBy = null; return n;
  }

  // Edit panel: 'points' | 'games' | 'server'. Never ends a game or the match.
  function adjust(s, what, team, delta) {
    if (s.finished) return s;
    const n = clone(s);
    if (what === 'server') {
      const p = { team, player: n.config.mode === 'doubles' ? delta : 0 };
      n.srv = p;
      if (n.rcv.team === team) n.rcv = { team: other(team), player: 0 };
      if (n.config.mode === 'singles') n.rcv = { team: other(team), player: 0 };
      return n;
    }
    if (what === 'points') {
      const v = Math.max(0, n.points[team] + delta);
      const o = n.points[other(team)];
      if (v >= target(n) && v - o >= 2) return s; // would end the game: refuse
      n.points[team] = v;
    } else if (what === 'games') {
      const v = Math.max(0, n.games[team] + delta);
      if (v >= toWin(n)) return s; // would end the match: refuse
      n.games[team] = v;
    }
    return n;
  }

  const display = (s) => ({ red: String(s.points.red), blue: String(s.points.blue) });

  // ---------- spoken calls (ES / CA / EN) ----------
  const NUM = base.NUM;
  const W = {
    team: { es: { red: 'rojo', blue: 'verde' }, ca: { red: 'vermell', blue: 'verd' }, en: { red: 'red', blue: 'green' } }, // the blue team is shown green
    all: { es: 'iguales', ca: 'iguals', en: 'all' },
    game: { es: 'Juego {t}', ca: 'Joc {t}', en: 'Game {t}' },
    match: { es: 'Partido para {t}', ca: 'Partit per a {t}', en: 'Match to {t}' },
    draw: { es: 'Empate', ca: 'Empat', en: 'It’s a draw' },
    gamePoint: { es: 'Bola de juego', ca: 'Pilota de joc', en: 'Game point' },
    matchPoint: { es: 'Bola de partido', ca: 'Pilota de partit', en: 'Match point' },
    change: { es: 'Cambio de campo', ca: 'Canvi de camp', en: 'Change ends' },
  };
  const pick = (o, L) => o[L] || o.es;
  const num = (n, L) => NUM[L][n] ?? String(n);
  const pair = (a, b, lead, L) => (a === b ? `${num(a, L)} ${pick(W.all, L)}` : `${num(Math.max(a, b), L)} ${num(Math.min(a, b), L)}, ${pick(W.team, L)[lead]}`);

  // The umpire's call: the server's score first ("cinco tres", "diez iguales").
  function call(s, events, lang = 'es', team = null) {
    const L = NUM[lang] ? lang : 'es';
    const fill = (o, t) => pick(o, L).replace('{t}', pick(W.team, L)[t]);
    const out = [];
    if (events.includes('match')) {
      out.push(s.winner === 'draw' ? pick(W.draw, L) : fill(W.match, s.winner));
      out.push([...s.sets.map((x) => `${num(x.red, L)} ${num(x.blue, L)}`),
        ...(s.endedBy !== 'score' && (s.points.red || s.points.blue) ? [`${num(s.points.red, L)} ${num(s.points.blue, L)}`] : [])].join(', '));
      return out.filter(Boolean).join('. ');
    }
    if (events.includes('game')) {
      const lead = s.games.red > s.games.blue ? 'red' : s.games.blue > s.games.red ? 'blue' : team;
      out.push(fill(W.game, team || lead));
      if (s.config.bestOf > 1) out.push(pair(s.games.red, s.games.blue, lead, L));
    } else {
      const sv = s.srv.team, rc = other(sv);
      const a = s.points[sv], b = s.points[rc];
      out.push(a === b ? `${num(a, L)} ${pick(W.all, L)}` : `${num(a, L)} ${num(b, L)}`);
    }
    if (events.includes('matchPoint')) out.push(pick(W.matchPoint, L));
    else if (events.includes('gamePoint')) out.push(pick(W.gamePoint, L));
    if (events.includes('changeEnds')) out.push(pick(W.change, L));
    return out.join('. ');
  }

  const totalGames = (s) => ({ ...s.games });
  const api = { sport: 'pingpong', isGolden, init, point, timeUp, stop, reopen, adjust, server, display, call, stakes, totalGames, other, TEAMS, NUM, BEST_OF };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PingPong = api;
})(typeof self !== 'undefined' ? self : this);
