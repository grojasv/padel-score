// Tests for the ping pong scoring engine: node scripts/test-pingpong.mjs
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const P = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'pingpong.js'));

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; } catch (e) { console.error(`✗ ${name}\n  ${e.message}`); process.exitCode = 1; }
};
// 'rrb' = red, red, blue. Returns { state, events } of the last point.
function play(state, seq) {
  let r = { state, events: [] };
  for (const c of seq) r = P.point(r.state, c === 'r' ? 'red' : 'blue');
  return r;
}
const game = (t) => t.repeat(11); // 11-0
const base = (o = {}) => P.init({ mode: 'singles', bestOf: 3, firstServe: 'red', ...o });
const who = (s) => `${s.srv.team}${s.srv.player}>${s.rcv.team}${s.rcv.player}`;

test('a game is 11, win by 2', () => {
  let r = play(base(), 'r'.repeat(10) + 'b'.repeat(9));
  assert.deepEqual(r.state.points, { red: 10, blue: 9 });
  r = play(r.state, 'r');
  assert.ok(r.events.includes('game'));
  assert.deepEqual(r.state.games, { red: 1, blue: 0 });
  assert.deepEqual(r.state.sets, [{ red: 11, blue: 9, kind: 'game' }]);
  let d = play(base(), 'rb'.repeat(10)); // 10-10
  assert.ok(d.events.includes('deuce'));
  d = play(d.state, 'r'); assert.equal(d.state.games.red, 0, '11-10 is not a win');
  d = play(d.state, 'b'); d = play(d.state, 'rr');
  assert.deepEqual(d.state.sets[0], { red: 13, blue: 11, kind: 'game' });
});

test('best of 1, 3, 5', () => {
  assert.equal(play(base({ bestOf: 1 }), game('r')).state.finished, true);
  let s = play(base({ bestOf: 3 }), game('r') + game('b')).state;
  assert.equal(s.finished, false);
  s = play(s, game('r')).state;
  assert.equal(s.finished, true); assert.equal(s.winner, 'red'); assert.equal(s.endedBy, 'score');
  s = play(base({ bestOf: 5 }), game('b') + game('b')).state;
  assert.equal(s.finished, false);
  s = play(s, game('b')).state; assert.equal(s.finished, true);
  assert.equal(P.init({ bestOf: 7 }).config.bestOf, 3, 'only 1, 3, 5');
});

test('singles serve: 2 each, every point from 10-10, the receiver serves next game', () => {
  let s = base();
  assert.equal(who(s), 'red0>blue0');
  s = play(s, 'r').state; assert.equal(s.srv.team, 'red');
  s = play(s, 'r').state; assert.equal(s.srv.team, 'blue');
  s = play(s, 'bb').state; assert.equal(s.srv.team, 'red');
  s = play(base(), 'rb'.repeat(10)).state; // 10-10
  const at = s.srv.team;
  s = play(s, 'r').state; assert.notEqual(s.srv.team, at, 'every point at 10-10');
  s = play(s, 'b').state; assert.equal(s.srv.team, at);
  const g2 = play(base(), game('r')).state;
  assert.equal(g2.srv.team, 'blue', 'game 2 starts with blue serving');
  assert.equal(play(g2, game('r')).state.srv.team, 'red');
});

test('doubles serve: A1>B1, B1>A2, A2>B2, B2>A1; next game B1>A1', () => {
  let s = base({ mode: 'doubles', firstPlayer: { red: 0, blue: 1 } });
  const seen = [who(s)];
  for (let i = 0; i < 4; i++) { s = play(s, 'rr').state; seen.push(who(s)); }
  assert.deepEqual(seen, ['red0>blue1', 'blue1>red1', 'red1>blue0', 'blue0>red0', 'red0>blue1']);
  const g2 = play(base({ mode: 'doubles', firstPlayer: { red: 0, blue: 1 } }), game('r')).state;
  assert.equal(who(g2), 'blue1>red0', 'the first receiver serves to the first server');
});

test('ends change after each game and at 5 in the deciding game; undo follows', () => {
  let r = play(base(), game('r'));
  assert.ok(r.events.includes('changeEnds')); assert.equal(r.state.swapped, true);
  r = play(r.state, game('b')); assert.equal(r.state.swapped, false);
  r = play(r.state, 'rrrr'); assert.ok(!r.events.includes('changeEnds'));
  r = play(r.state, 'r'); assert.ok(r.events.includes('changeEnds'), 'at 5 in game 3'); assert.equal(r.state.swapped, true);
  r = play(r.state, 'bbbbb'); assert.ok(!r.events.includes('changeEnds'), 'only once');
  const one = play(base({ bestOf: 1 }), 'bbbbb');
  assert.ok(one.events.includes('changeEnds'), 'best of 1: the only game is the deciding one');
  const won = play(base({ bestOf: 1 }), game('r'));
  assert.ok(!won.events.includes('changeEnds'), 'no change after the last game');
});

test('doubles deciding game: receivers swap at 5', () => {
  let s = play(base({ mode: 'doubles', bestOf: 1 }), 'rrrr').state; // red0>blue0 … after 4 points: A1>B1 rotation twice
  const before = who(s);
  s = play(s, 'r').state; // 5-0: serve does not rotate (5 points), receivers swap
  assert.equal(s.srv.team, before.slice(0, before.indexOf('>')).replace(/\d/, ''));
  assert.equal(s.rcv.player, 1 - Number(before.at(-1)));
});

test('game point, match point, stakes', () => {
  let r = play(base(), 'r'.repeat(10));
  assert.ok(r.events.includes('gamePoint'));
  assert.deepEqual(P.stakes(r.state), { red: 'game', blue: null });
  r = play(base({ bestOf: 1 }), 'r'.repeat(10));
  assert.ok(r.events.includes('matchPoint'));
});

test('calls: server first, iguales, game, match', () => {
  let r = play(base(), 'b');
  assert.equal(P.call(r.state, r.events, 'es'), 'cero uno');
  r = play(r.state, 'r');
  assert.equal(P.call(r.state, r.events, 'es'), 'uno iguales');
  r = play(base(), 'r'.repeat(10));
  assert.equal(P.call(r.state, r.events, 'es'), 'cero diez. Bola de juego', 'blue serves at 10-0: server first');
  r = play(base(), game('r'));
  assert.equal(P.call(r.state, r.events, 'es', 'red'), 'Juego rojo. uno cero, rojo. Cambio de campo');
  r = play(base({ bestOf: 1 }), game('b'));
  assert.equal(P.call(r.state, r.events, 'en', 'blue'), 'Match to green. zero eleven');
});

test('stop, reopen, adjust', () => {
  let s = play(base(), game('r') + 'bbb').state;
  const st = P.stop(s);
  assert.equal(st.winner, 'red'); assert.equal(st.endedBy, 'stopped');
  assert.equal(P.reopen(st).finished, false);
  const won = play(base({ bestOf: 1 }), game('r')).state;
  assert.equal(P.reopen(won), won);
  s = P.adjust(base(), 'points', 'red', 10);
  assert.equal(s.points.red, 10);
  assert.equal(P.adjust(s, 'points', 'red', 1), s, '11-0 would end the game');
  assert.equal(P.adjust(P.adjust(base(), 'games', 'red', 1), 'games', 'red', 1).games.red, 1, '2 games would end a best of 3');
  s = P.adjust(base({ mode: 'doubles' }), 'server', 'blue', 1);
  assert.deepEqual(P.server(s), { team: 'blue', player: 1 });
});

test('short game: 1 game to 6, win by 2, serve every point from 5-5, ends change at 3', () => {
  const short = () => base({ bestOf: 1, points: 6 });
  assert.equal(short().config.points, 6);
  assert.equal(base().config.points, 11, '11 by default');
  assert.equal(P.init({ points: 7 }).config.points, 11, 'only 6 or 11');
  let r = play(short(), 'rrbb'); // 2-2
  assert.ok(!r.events.includes('changeEnds'));
  r = play(short(), 'rrr'); assert.ok(r.events.includes('changeEnds'), 'at 3'); assert.equal(r.state.swapped, true);
  r = play(short(), 'r'.repeat(5)); assert.ok(r.events.includes('matchPoint'));
  r = play(r.state, 'r'); assert.equal(r.state.finished, true); assert.deepEqual(r.state.sets[0], { red: 6, blue: 0, kind: 'game' });
  let d = play(short(), 'rb'.repeat(5)); // 5-5
  assert.ok(d.events.includes('deuce'));
  const at = d.state.srv.team;
  d = play(d.state, 'r'); assert.notEqual(d.state.srv.team, at, 'every point at 5-5');
  assert.equal(d.state.finished, false, '6-5 is not a win');
  d = play(d.state, 'r'); assert.equal(d.state.winner, 'red');
  assert.equal(P.adjust(P.adjust(short(), 'points', 'red', 5), 'points', 'red', 1).points.red, 5, '6-0 would end the game');
});

console.log(`${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
