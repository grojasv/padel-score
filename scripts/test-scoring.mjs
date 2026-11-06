// Tests for scoring.js: node scripts/test-scoring.mjs (no dependencies).
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const S = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'scoring.js'));

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; } catch (e) { console.error(`✗ ${name}\n  ${e.message}`); process.exitCode = 1; }
};
// Plays a string like 'rrbr' (r = red point, b = blue point). Returns { state, events } of the last point.
function play(state, seq) {
  let r = { state, events: [] };
  for (const c of seq) r = S.point(r.state, c === 'r' ? 'red' : 'blue');
  return r;
}
const game = (t) => (t === 'r' ? 'rrrr' : 'bbbb');
const games = (seq) => [...seq].map(game).join('');
const base = (o = {}) => S.init({ mode: 'doubles', deuce: 'golden', superTiebreak: true, firstServe: 'red', ...o });

test('points go 15 30 40 and win the game', () => {
  let r = play(base(), 'r');
  assert.deepEqual(S.display(r.state), { red: '15', blue: '0' });
  r = play(r.state, 'rr');
  assert.deepEqual(S.display(r.state), { red: '40', blue: '0' });
  r = play(r.state, 'r');
  assert.deepEqual(r.state.games, { red: 1, blue: 0 });
  assert.ok(r.events.includes('game'));
  assert.ok(r.events.includes('changeEnds'), 'change ends after game 1');
});

test('golden point: at 40-40 the next point wins', () => {
  let r = play(base(), 'rrrbbb');
  assert.ok(r.events.includes('deuce') && r.events.includes('golden'));
  assert.ok(S.isGolden(r.state));
  assert.ok(!S.isGolden(play(base({ deuce: 'advantage' }), 'rrrbbb').state), 'advantage has no golden point');
  r = play(r.state, 'b');
  assert.deepEqual(r.state.games, { red: 0, blue: 1 });
});

test('advantage: needs two clear points, many deuces', () => {
  let r = play(base({ deuce: 'advantage' }), 'rrrbbb');
  assert.ok(!r.events.includes('golden'));
  r = play(r.state, 'r');
  assert.deepEqual(S.display(r.state), { red: 'AD', blue: '40' });
  r = play(r.state, 'bbrbrb');
  assert.equal(r.state.games.red + r.state.games.blue, 0);
  assert.equal(r.state.deuces, 4);
  r = play(r.state, 'bb');
  assert.deepEqual(r.state.games, { red: 0, blue: 1 });
});

test('star point: advantage twice, golden on the third deuce', () => {
  let r = play(base({ deuce: 'star' }), 'rrrbbb'); // deuce 1
  assert.ok(!r.events.includes('golden'));
  r = play(r.state, 'rb'); // deuce 2
  assert.ok(!r.events.includes('golden'));
  assert.ok(!S.isGolden(r.state), 'deuce 2 is not golden');
  r = play(r.state, 'br'); // deuce 3
  assert.ok(r.events.includes('golden'));
  assert.ok(S.isGolden(r.state));
  r = play(r.state, 'r');
  assert.deepEqual(r.state.games, { red: 1, blue: 0 });
});

test('set to 6 with 2 clear, 7-5 possible', () => {
  let r = play(base(), games('rrrrrbbbbb'));
  assert.deepEqual(r.state.games, { red: 5, blue: 5 });
  r = play(r.state, games('rr'));
  assert.deepEqual(r.state.sets[0], { red: 7, blue: 5, kind: 'set' });
  assert.deepEqual(r.state.setsWon, { red: 1, blue: 0 });
});

test('tie-break at 6-6, to 7 by 2, set is 7-6', () => {
  let r = play(base(), games('rbrbrbrbrbrb'));
  assert.equal(r.state.tiebreak, 'tb');
  assert.ok(r.events.includes('tiebreak'));
  r = play(r.state, 'rrrrrrbbbbbb'); // 6-6 in the tie-break
  assert.equal(r.state.tiebreak, 'tb');
  r = play(r.state, 'rr');
  assert.deepEqual(r.state.sets[0], { red: 7, blue: 6, tb: { red: 8, blue: 6 }, kind: 'set' });
  assert.ok(r.events.includes('changeEnds'), '13 games: change ends');
});

test('tie-break serve: 1 then 2-2, and the receiver serves after it', () => {
  let s = play(base(), games('rbrbrbrbrbrb')).state; // 12 games: serveIdx back to 0 (red P0)
  assert.equal(S.server(s).team, 'red');
  s = play(s, 'r').state;
  assert.equal(S.server(s).team, 'blue');
  s = play(s, 'r').state;
  assert.equal(S.server(s).team, 'blue');
  s = play(s, 'r').state;
  assert.equal(S.server(s).team, 'red');
  s = play(s, 'rrrr').state; // red wins tb 7-0
  assert.equal(s.setsWon.red, 1);
  assert.equal(S.server(s).team, 'blue', 'team that received first serves next set');
});

test('tie-break changes ends every 6 points', () => {
  let r = play(base(), games('rbrbrbrbrbrb') + 'rrrbb');
  assert.ok(!r.events.includes('changeEnds'));
  r = play(r.state, 'b');
  assert.ok(r.events.includes('changeEnds'));
});

test('doubles rotation A1 B1 A2 B2 with chosen first players', () => {
  let s = base({ firstPlayer: { red: 1, blue: 0 } });
  const seen = [];
  for (let i = 0; i < 5; i++) { const sv = S.server(s); seen.push(`${sv.team}${sv.player}`); s = play(s, 'rrrr').state; }
  assert.deepEqual(seen, ['red1', 'blue0', 'red0', 'blue1', 'red1']);
});

test('singles alternates', () => {
  let s = base({ mode: 'singles', firstServe: 'blue' });
  const seen = [];
  for (let i = 0; i < 3; i++) { seen.push(S.server(s).team); s = play(s, 'rrrr').state; }
  assert.deepEqual(seen, ['blue', 'red', 'blue']);
});

test('super tie-break at one set all, to 10, wins the match', () => {
  let r = play(base(), games('rrrrrr') + games('bbbbbb'));
  assert.equal(r.state.tiebreak, 'stb');
  r = play(r.state, 'rrrrrrrrrbbbbbbbbb'); // 9-9
  assert.ok(!r.state.finished);
  r = play(r.state, 'rr');
  assert.ok(r.state.finished);
  assert.equal(r.state.winner, 'red');
  assert.deepEqual(r.state.sets[2], { red: 1, blue: 0, tb: { red: 11, blue: 9 }, kind: 'stb' });
});

test('without super tie-break the third set is normal', () => {
  const r = play(base({ superTiebreak: false }), games('rrrrrr') + games('bbbbbb'));
  assert.equal(r.state.tiebreak, null);
});

test('straight sets win, no points after the end', () => {
  let r = play(base(), games('rrrrrr') + games('rrrrrr'));
  assert.ok(r.state.finished && r.state.winner === 'red' && r.events.includes('match'));
  const after = S.point(r.state, 'blue');
  assert.equal(after.state, r.state);
});

test('set point and match point are flagged', () => {
  let r = play(base(), games('rrrrr') + 'rrr');
  assert.ok(r.events.includes('setPoint'));
  r = play(base(), games('rrrrrr') + games('rrrrr') + 'rrr');
  assert.ok(r.events.includes('matchPoint'));
});

test('point() never mutates the old state (undo stack)', () => {
  const s0 = base();
  const snap = JSON.stringify(s0);
  play(s0, 'rrrr');
  assert.equal(JSON.stringify(s0), snap);
});

test('time up: the current game is the last, leader wins', () => {
  let s = play(base(), games('rrb') + 'bb').state; // 2-1 red, 0-30
  s = S.timeUp(s);
  const r = play(s, 'bb');
  assert.ok(r.state.finished);
  assert.equal(r.state.endedBy, 'time');
  assert.equal(r.state.winner, 'draw', '2-2 is a draw');
  const r2 = play(s, 'rrrrrr');
  assert.equal(r2.state.winner, 'red');
});

test('time up: sets beat games, then total games decides', () => {
  let s = play(base(), games('rrrrrr') + games('bb')).state; // red 1 set, 0-2 in set 2
  let r = play(S.timeUp(s), game('b'));
  assert.equal(r.state.winner, 'red');
  s = play(base(), games('rrrrrr') + games('bbbbbb') + 'rrrb').state; // stb 3-1
  r = play(S.timeUp(s), 'rrrrrrr'); // stb ends 10-1
  assert.equal(r.state.winner, 'red');
});

test('stop now ends with the leader', () => {
  const s = S.stop(play(base(), games('b')).state);
  assert.ok(s.finished);
  assert.equal(s.winner, 'blue');
});

test('adjust: points, games, server; refuses to end a set', () => {
  let s = base();
  s = S.adjust(s, 'points', 'blue', 2);
  assert.deepEqual(S.display(s), { red: '0', blue: '30' });
  s = S.adjust(s, 'games', 'red', 5);
  assert.equal(s.games.red, 5);
  assert.equal(S.adjust(s, 'games', 'red', 1), s, '6-0 would end the set');
  s = S.adjust(s, 'server', 'blue', 1);
  assert.deepEqual(S.server(s), { team: 'blue', player: 1 });
});

test('calls in Spanish: server first, iguales, game, golden', () => {
  let s = base();
  let r = play(s, 'b');
  assert.equal(S.call(r.state, r.events, 'es', 'blue'), 'nada quince');
  r = play(r.state, 'r');
  assert.equal(S.call(r.state, r.events, 'es', 'red'), 'quince iguales');
  r = play(r.state, 'rrbb');
  assert.equal(S.call(r.state, r.events, 'es', 'blue'), 'Iguales. Punto de oro');
  r = play(r.state, 'r');
  assert.equal(S.call(r.state, r.events, 'es', 'red'), 'Juego rojo. uno cero, rojo. Cambio de campo');
});

test('calls: set and match', () => {
  let r = play(base(), games('rrrrr') + 'rrr');
  r = play(r.state, 'r');
  assert.equal(S.call(r.state, r.events, 'es', 'red'), 'Set rojo. seis cero, rojo');
  r = play(r.state, games('rrrrr') + 'rrrr');
  assert.equal(S.call(r.state, r.events, 'en', 'red'), 'Match to red. six zero, six zero');
});

test('calls in Catalan and English exist', () => {
  const r = play(base({ deuce: 'advantage' }), 'rrrbbbr');
  assert.equal(S.call(r.state, r.events, 'ca', 'red'), 'Avantatge vermell');
  assert.equal(S.call(r.state, r.events, 'en', 'red'), 'Advantage red');
});

console.log(`${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
