/* Padel Score scoring engine: pure functions, no DOM. UMD so node tests can require it.
 * Browser: <script src="scoring.js"></script> then Scoring.init(config).
 * Node:    const Scoring = require('./scoring.js').
 * A state is plain JSON. point() never mutates its input, so the undo stack is just a list of old states.
 * Rules are in SPEC.md § Scoring engine rules. */
(function (root) {
  'use strict';

  const TEAMS = ['red', 'blue'];
  const other = (t) => (t === 'red' ? 'blue' : 'red');
  const clone = (s) => JSON.parse(JSON.stringify(s));
  // How many deuces before the next point decides the game.
  const GOLDEN_AT = { golden: 1, star: 3, advantage: Infinity };

  /* config: {
   *   mode: 'doubles' | 'singles',
   *   deuce: 'golden' | 'advantage' | 'star',
   *   superTiebreak: true,          // third set is a tie-break to 10
   *   firstServe: 'red' | 'blue',
   *   firstPlayer: { red: 0, blue: 0 } // which player of each team serves that team's first game
   * } */
  function init(config) {
    const c = {
      mode: config.mode === 'singles' ? 'singles' : 'doubles',
      deuce: GOLDEN_AT[config.deuce] ? config.deuce : 'golden',
      superTiebreak: config.superTiebreak !== false,
      firstServe: config.firstServe === 'blue' ? 'blue' : 'red',
      firstPlayer: { red: config.firstPlayer?.red ? 1 : 0, blue: config.firstPlayer?.blue ? 1 : 0 },
    };
    const a = c.firstServe, b = other(a);
    // Serve rotation: A1 B1 A2 B2 (doubles) or A B (singles).
    const order = c.mode === 'singles'
      ? [{ team: a, player: 0 }, { team: b, player: 0 }]
      : [{ team: a, player: c.firstPlayer[a] }, { team: b, player: c.firstPlayer[b] },
        { team: a, player: 1 - c.firstPlayer[a] }, { team: b, player: 1 - c.firstPlayer[b] }];
    return {
      config: c,
      order,
      serveIdx: 0, // index in order of the player serving this game (or who started the tie-break)
      sets: [], // finished sets: { red, blue, tb?: { red, blue }, kind: 'set' | 'stb' }
      setsWon: { red: 0, blue: 0 },
      games: { red: 0, blue: 0 },
      points: { red: 0, blue: 0 }, // raw points this game, or tie-break points
      deuces: 0,
      tiebreak: null, // null | 'tb' (to 7) | 'stb' (super, to 10)
      lastGame: false, // time is up: the current game (or tie-break) is the last one
      finished: false,
      winner: null, // 'red' | 'blue' | 'draw'
      endedBy: null, // 'score' | 'time'
      swapped: false, // ends changed an odd number of times: the teams now play on the other side
    };
  }

  const goldenNow = (s) => s.tiebreak == null && s.points.red === 3 && s.points.blue === 3
    && s.deuces >= GOLDEN_AT[s.config.deuce];

  function server(s) {
    if (s.tiebreak) {
      const n = s.points.red + s.points.blue;
      return s.order[(s.serveIdx + Math.floor((n + 1) / 2)) % s.order.length];
    }
    return s.order[s.serveIdx % s.order.length];
  }

  const totalGames = (s) => {
    const t = { red: s.games.red, blue: s.games.blue };
    s.sets.forEach((x) => { t.red += x.red; t.blue += x.blue; });
    return t;
  };

  function finishByTime(s) {
    const cmp = (o) => (o.red > o.blue ? 'red' : o.blue > o.red ? 'blue' : null);
    s.finished = true;
    s.endedBy = 'time';
    s.winner = cmp(s.setsWon) || cmp(s.games) || cmp(totalGames(s)) || 'draw';
  }

  // Applies one point. Returns the new state and the events it caused, in order.
  function apply(prev, team) {
    if (prev.finished || !TEAMS.includes(team)) return { state: prev, events: [] };
    const s = clone(prev);
    const o = other(team);
    const ev = ['point'];
    s.points[team]++;

    let gameWon = false;
    if (s.tiebreak) {
      const target = s.tiebreak === 'stb' ? 10 : 7;
      if (s.points[team] >= target && s.points[team] - s.points[o] >= 2) gameWon = true;
      else if ((s.points.red + s.points.blue) % 6 === 0) ev.push('changeEnds');
    } else if (prev.points[team] === 3 && prev.points[o] === 3 && goldenNow(prev)) {
      gameWon = true;
    } else if (s.points[team] >= 4 && s.points[team] - s.points[o] >= 2) {
      gameWon = true;
    } else if (s.points.red === s.points.blue && s.points.red >= 3) {
      s.points.red = 3; s.points.blue = 3; s.deuces++;
      ev.push('deuce');
      if (goldenNow(s)) ev.push('golden');
    }
    if (!gameWon) return { state: s, events: ev };

    // ---- a game (or tie-break) is over ----
    let setWon = false;
    if (s.tiebreak) {
      const tb = { red: s.points.red, blue: s.points.blue };
      if (s.tiebreak === 'stb') {
        s.sets.push({ red: team === 'red' ? 1 : 0, blue: team === 'blue' ? 1 : 0, tb, kind: 'stb' });
      } else {
        s.games[team]++;
        s.sets.push({ red: s.games.red, blue: s.games.blue, tb, kind: 'set' });
      }
      s.serveIdx = (s.serveIdx + 1) % s.order.length; // the side that received first serves next
      setWon = true;
    } else {
      s.games[team]++;
      ev.push('game');
      s.serveIdx = (s.serveIdx + 1) % s.order.length;
      if (s.games[team] >= 6 && s.games[team] - s.games[o] >= 2) {
        s.sets.push({ red: s.games.red, blue: s.games.blue, kind: 'set' });
        setWon = true;
      } else if ((s.games.red + s.games.blue) % 2 === 1) {
        ev.push('changeEnds');
      }
    }
    s.points = { red: 0, blue: 0 };
    s.deuces = 0;

    if (setWon) {
      const done = s.sets[s.sets.length - 1];
      s.setsWon[team]++;
      s.tiebreak = null;
      s.games = { red: 0, blue: 0 };
      ev.push('set');
      if (s.setsWon[team] === 2) {
        s.finished = true; s.winner = team; s.endedBy = 'score';
        ev.push('match');
        return { state: s, events: ev };
      }
      if (done.kind === 'set' && (done.red + done.blue) % 2 === 1) ev.push('changeEnds');
      if (s.config.superTiebreak && s.setsWon.red === 1 && s.setsWon.blue === 1) {
        s.tiebreak = 'stb';
        ev.push('tiebreak');
      }
    } else if (s.games.red === 6 && s.games.blue === 6) {
      s.tiebreak = 'tb';
      ev.push('tiebreak');
    }

    if (s.lastGame) { finishByTime(s); ev.push('match'); }
    return { state: s, events: ev };
  }
  // Every change of ends flips the sides (undo restores the old state, so the sides follow it too).
  function applySides(prev, team) {
    const r = apply(prev, team);
    if (r.events.includes('changeEnds')) r.state.swapped = !prev.swapped;
    return r;
  }

  // What the next point would decide for each team: null | 'set' | 'match'.
  function stakes(s) {
    const out = { red: null, blue: null };
    if (s.finished) return out;
    TEAMS.forEach((t) => {
      const e = apply(s, t).events;
      out[t] = e.includes('match') && !s.lastGame ? 'match' : e.includes('set') ? 'set' : null;
    });
    return out;
  }

  function point(s, team) {
    const r = applySides(s, team);
    if (r.state.finished) return r;
    const st = stakes(r.state);
    const t = st.red === 'match' || st.blue === 'match' ? 'matchPoint' : st.red || st.blue ? 'setPoint' : null;
    if (t) r.events.push(t);
    return r;
  }

  // Time is up: the current game is the last one. If no point of it was played yet, it still gets played.
  function timeUp(s) {
    if (s.finished || s.lastGame) return s;
    const n = clone(s); n.lastGame = true; return n;
  }

  // End the match now with the current score (the players stop early).
  function stop(s) {
    if (s.finished) return s;
    const n = clone(s); finishByTime(n); n.endedBy = 'stopped'; return n;
  }

  // Time ran out (or the players stopped) but they play on: the match is open again, score as it was.
  function reopen(s) {
    if (!s.finished || s.endedBy === 'score') return s;
    const n = clone(s); n.finished = false; n.winner = null; n.endedBy = null; n.lastGame = false; return n;
  }

  // Manual correction from the edit panel. what: 'points' | 'games' | 'server'. Returns a new state.
  function adjust(s, what, team, delta) {
    if (s.finished) return s;
    const n = clone(s);
    if (what === 'server') {
      // team is the team that should serve now; delta (0/1) is the player.
      const i = n.order.findIndex((p) => p.team === team && (n.config.mode === 'singles' || p.player === delta));
      if (i >= 0) n.serveIdx = n.tiebreak ? (i - Math.floor((n.points.red + n.points.blue + 1) / 2) + n.order.length * 10) % n.order.length : i;
      return n;
    }
    if (what === 'points') {
      const cap = n.tiebreak ? 99 : 3;
      n.points[team] = Math.max(0, Math.min(cap, n.points[team] + delta));
      if (!n.tiebreak && n.points.red === 3 && n.points.blue === 3 && n.deuces === 0) n.deuces = 1;
      if (!n.tiebreak && (n.points.red < 3 || n.points.blue < 3)) n.deuces = 0;
    } else if (what === 'games' && !n.tiebreak) {
      const g = { ...n.games, [team]: Math.max(0, Math.min(6, n.games[team] + delta)) };
      if (Math.max(g.red, g.blue) >= 6 && Math.abs(g.red - g.blue) >= 2) return s; // would end the set: refuse
      n.games = g;
      if (g.red === 6 && g.blue === 6) { n.tiebreak = 'tb'; n.points = { red: 0, blue: 0 }; n.deuces = 0; }
    }
    return n;
  }

  // ---------- display ----------
  const LABEL = ['0', '15', '30', '40'];
  function display(s) {
    if (s.tiebreak) return { red: String(s.points.red), blue: String(s.points.blue) };
    const { red, blue } = s.points;
    if (red >= 3 && blue >= 3) {
      if (red === blue) return { red: '40', blue: '40' };
      return red > blue ? { red: 'AD', blue: '40' } : { red: '40', blue: 'AD' };
    }
    return { red: LABEL[red], blue: LABEL[blue] };
  }

  // ---------- spoken calls (ES / CA / EN) ----------
  const NUM = {
    es: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'],
    ca: ['zero', 'u', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou', 'deu', 'onze', 'dotze', 'tretze', 'catorze', 'quinze', 'setze', 'disset', 'divuit', 'dinou', 'vint'],
    en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  };
  const PTS = {
    es: ['nada', 'quince', 'treinta', 'cuarenta'],
    ca: ['zero', 'quinze', 'trenta', 'quaranta'],
    en: ['love', 'fifteen', 'thirty', 'forty'],
  };
  const W = {
    team: { es: { red: 'rojo', blue: 'azul' }, ca: { red: 'vermell', blue: 'blau' }, en: { red: 'red', blue: 'blue' } },
    all: { es: 'iguales', ca: 'iguals', en: 'all' },
    deuce: { es: 'Iguales', ca: 'Iguals', en: 'Deuce' },
    adv: { es: 'Ventaja {t}', ca: 'Avantatge {t}', en: 'Advantage {t}' },
    golden: { es: 'Punto de oro', ca: 'Punt d’or', en: 'Golden point' },
    game: { es: 'Juego {t}', ca: 'Joc {t}', en: 'Game {t}' },
    set: { es: 'Set {t}', ca: 'Set {t}', en: 'Set {t}' },
    match: { es: 'Partido para {t}', ca: 'Partit per a {t}', en: 'Match to {t}' },
    draw: { es: 'Empate', ca: 'Empat', en: 'It’s a draw' },
    tb: { es: 'Tie-break', ca: 'Tie-break', en: 'Tie-break' },
    stb: { es: 'Súper tie-break', ca: 'Súper tie-break', en: 'Super tie-break' },
    setPoint: { es: 'Bola de set', ca: 'Pilota de set', en: 'Set point' },
    matchPoint: { es: 'Bola de partido', ca: 'Pilota de partit', en: 'Match point' },
    change: { es: 'Cambio de campo', ca: 'Canvi de camp', en: 'Change ends' },
    sets: { es: 'Sets', ca: 'Sets', en: 'Sets' },
  };
  const num = (n, lang) => NUM[lang][n] ?? String(n);
  const pick = (o, lang) => o[lang] || o.es;
  // "cuatro tres rojo" with the leader named; "tres iguales" when level. Used for games and tie-breaks.
  function pair(a, b, lead, lang) {
    if (a === b) return `${num(a, lang)} ${pick(W.all, lang)}`;
    return `${num(Math.max(a, b), lang)} ${num(Math.min(a, b), lang)}, ${pick(W.team, lang)[lead]}`;
  }

  // The umpire's call after a point won by team. Server's score first in a normal game.
  function call(s, events, lang = 'es', team = null) {
    const L = NUM[lang] ? lang : 'es';
    const tn = (t) => pick(W.team, L)[t];
    const fill = (o, t) => pick(o, L).replace('{t}', tn(t));
    const out = [];
    const lastSet = s.sets[s.sets.length - 1];
    if (events.includes('match')) {
      out.push(s.winner === 'draw' ? pick(W.draw, L) : fill(W.match, s.winner));
      out.push(s.sets.map((x) => (x.kind === 'stb' ? `${num(x.tb.red, L)} ${num(x.tb.blue, L)}` : `${num(x.red, L)} ${num(x.blue, L)}`)).join(', ')
        + (s.endedBy !== 'score' && (s.games.red || s.games.blue) ? `${s.sets.length ? ', ' : ''}${num(s.games.red, L)} ${num(s.games.blue, L)}` : ''));
      return out.filter(Boolean).join('. ');
    }
    if (events.includes('set')) {
      const w = lastSet.kind === 'stb' ? (lastSet.red ? 'red' : 'blue') : lastSet.red > lastSet.blue ? 'red' : 'blue';
      out.push(fill(W.set, w));
      out.push(lastSet.kind === 'stb' ? pair(lastSet.tb.red, lastSet.tb.blue, w, L) : pair(lastSet.red, lastSet.blue, w, L));
    } else if (events.includes('game')) {
      const lead = s.games.red > s.games.blue ? 'red' : s.games.blue > s.games.red ? 'blue' : team;
      out.push(fill(W.game, team || lead));
      out.push(pair(s.games.red, s.games.blue, lead, L));
    } else if (s.tiebreak) {
      const lead = s.points.red > s.points.blue ? 'red' : 'blue';
      out.push(pair(s.points.red, s.points.blue, lead, L));
    } else {
      const sv = server(s).team, rc = other(sv);
      const { red, blue } = s.points;
      if (events.includes('golden')) out.push(`${pick(W.deuce, L)}. ${pick(W.golden, L)}`);
      else if (red >= 3 && blue >= 3) out.push(red === blue ? pick(W.deuce, L) : fill(W.adv, red > blue ? 'red' : 'blue'));
      else if (s.points[sv] === s.points[rc]) out.push(`${pick(PTS, L)[s.points[sv]]} ${pick(W.all, L)}`);
      else out.push(`${pick(PTS, L)[s.points[sv]]} ${pick(PTS, L)[s.points[rc]]}`);
    }
    if (events.includes('tiebreak')) out.push(pick(s.tiebreak === 'stb' ? W.stb : W.tb, L));
    if (events.includes('matchPoint')) out.push(pick(W.matchPoint, L));
    else if (events.includes('setPoint')) out.push(pick(W.setPoint, L));
    if (events.includes('changeEnds')) out.push(pick(W.change, L));
    return out.join('. ');
  }

  const api = { isGolden: goldenNow, init, point, timeUp, stop, reopen, adjust, server, display, call, stakes, totalGames, other, TEAMS, NUM };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Scoring = api;
})(typeof self !== 'undefined' ? self : this);
