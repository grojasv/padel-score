// Tests for the voice command matcher: node scripts/test-voice.mjs
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { match, listen } = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'voice.js'));

const cases = [
  ['rojo', {}, { cmd: 'point', team: 'red' }],
  ['Azul', {}, { cmd: 'point', team: 'blue' }],
  ['punto rojo', {}, { cmd: 'point', team: 'red' }],
  ['punto para el azul', {}, { cmd: 'point', team: 'blue' }],
  ['a sul', {}, { cmd: 'point', team: 'blue' }],
  ['Azúl', {}, { cmd: 'point', team: 'blue' }],
  ['punt vermell', {}, { cmd: 'point', team: 'red' }],
  ['blau', {}, { cmd: 'point', team: 'blue' }],
  ['point blue', { lang: 'en' }, { cmd: 'point', team: 'blue' }],
  ['point blue', {}, null],
  ['a la red', {}, null],
  ['dio en la red', {}, null],
  ['red', { lang: 'en' }, { cmd: 'point', team: 'red' }],
  ['rojo azul', {}, null],
  ['deshacer', {}, { cmd: 'undo' }],
  ['desfés', {}, { cmd: 'undo' }],
  ['no, rojo no, deshacer', {}, { cmd: 'undo' }],
  ['marcador', {}, { cmd: 'score' }],
  ['pausa', {}, { cmd: 'pause' }],
  ['qué buena esa', {}, null],
  ['', {}, null],
  ['rojo', { strict: true }, null],
  ['punto rojo', { strict: true }, { cmd: 'point', team: 'red' }],
  ['punto para rojo', { strict: true }, null],
  ['tuya Guille', { names: { red: ['Guille Rojas'] } }, null],
  ['punto Guille', { names: { red: ['Guille Rojas'] }, strict: true }, { cmd: 'point', team: 'red' }],
  ['punto Ana', { names: { blue: ['Ana'] }, strict: true }, { cmd: 'point', team: 'blue' }],
  ['punto Al', { names: { blue: ['Al'] }, strict: true }, null], // names under 3 letters are ignored
  ['rollo', {}, { cmd: 'point', team: 'red' }], // shouted from far away
  ['Royo', {}, { cmd: 'point', team: 'red' }],
  ['a sur', {}, { cmd: 'point', team: 'blue' }],
  ['hazul', {}, { cmd: 'point', team: 'blue' }],
  ['turquesa', {}, { cmd: 'point', team: 'blue' }],
  ['Turquesa', { lang: 'ca' }, { cmd: 'point', team: 'blue' }],
  ['punto turquesa', { strict: true }, { cmd: 'point', team: 'blue' }],
  ['turquesa', { strict: true }, null],
  ['turkesa', {}, { cmd: 'point', team: 'blue' }],
  ['turkesa', { strict: true }, null],
  ['rojo turquesa', {}, null],
  ['rollo', { strict: true }, null],
  ['punto rollo', { strict: true }, null], // strict mode keeps only the real words
  ['qué rollo de bola', {}, { cmd: 'point', team: 'red' }], // the known cost of loose mode: undo fixes it
  ['vamos al sur', {}, null],
];

let fails = 0;
for (const [text, opts, want] of cases) {
  try { assert.deepEqual(match(text, opts), want); } catch { fails++; console.error(`✗ "${text}" ${JSON.stringify(opts)} → ${JSON.stringify(match(text, opts))}, want ${JSON.stringify(want)}`); }
}
// ---------- the listen loop, with a fake recognizer like Android's: abort() before onstart sends no onend ----------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let recs = [];
class AndroidRec {
  constructor() { this.live = false; this.ended = false; recs.push(this); }
  start() { this.t = setTimeout(() => { this.live = true; this.onstart?.(); }, 20); }
  abort() { clearTimeout(this.t); if (this.live) setTimeout(() => { this.live = false; this.ended = true; this.onend?.(); }, 10); }
  stop() { this.abort(); }
}
globalThis.window = { SpeechRecognition: AndroidRec };
const loops = [
  ['paused before it starts, then resumed: listens again', async () => {
    recs = []; const states = [];
    const l = listen({ onState: (s) => states.push(s) });
    l.pause(); await wait(5); l.resume(); await wait(60);
    assert.equal(states.at(-1), 'listening');
    assert.equal(recs.filter((r) => r.live).length, 1);
    l.stop();
  }],
  ['created held: no recognizer until resume', async () => {
    recs = [];
    const l = listen({ held: true, onState: () => {} });
    await wait(40); assert.equal(recs.length, 0);
    l.resume(); await wait(40); assert.equal(recs.filter((r) => r.live).length, 1);
    l.stop();
  }],
  ['a late onend from an old recognizer does not stop the new one', async () => {
    recs = []; const states = [];
    const l = listen({ onState: (s) => states.push(s) });
    await wait(40); l.pause(); l.resume(); await wait(60);
    assert.equal(states.at(-1), 'listening');
    assert.equal(recs.filter((r) => r.live && !r.ended).length, 1);
    l.stop();
  }],
  ['a recognizer that never starts is replaced by the watchdog', async () => {
    recs = []; const traces = [];
    class Dead extends AndroidRec { start() {} }
    globalThis.window = { SpeechRecognition: Dead };
    const l = listen({ startMs: 30, onState: () => {}, onTrace: (s) => traces.push(s) });
    try {
      await wait(400); // 30 ms watchdog, then a new recognizer 250 ms later
      assert.ok(recs.length >= 2, `only ${recs.length} recognizer`);
      assert.ok(traces.includes('mic stuck: restart'));
    } finally { l.stop(); globalThis.window = { SpeechRecognition: AndroidRec }; }
  }],
  ['retry (the mic button) always makes a fresh recognizer', async () => {
    recs = [];
    const l = listen({ onState: () => {} });
    l.pause(); l.retry(); await wait(40);
    assert.equal(recs.length, 2); assert.ok(recs[1].live);
    l.stop();
  }],
];
let loopFails = 0;
for (const [name, fn] of loops) {
  try { await fn(); } catch (e) { loopFails++; console.error(`✗ listen: ${name}: ${e.message}`); }
}
fails += loopFails;
console.log(`${cases.length + loops.length - fails} passed${fails ? `, ${fails} FAILED` : ''}`);
if (fails) process.exit(1);
