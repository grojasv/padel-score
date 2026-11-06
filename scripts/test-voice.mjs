// Tests for the voice command matcher: node scripts/test-voice.mjs
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { match } = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'voice.js'));

const cases = [
  ['rojo', {}, { cmd: 'point', team: 'red' }],
  ['Azul', {}, { cmd: 'point', team: 'blue' }],
  ['punto rojo', {}, { cmd: 'point', team: 'red' }],
  ['punto para el azul', {}, { cmd: 'point', team: 'blue' }],
  ['a sul', {}, { cmd: 'point', team: 'blue' }],
  ['Azúl', {}, { cmd: 'point', team: 'blue' }],
  ['punt vermell', {}, { cmd: 'point', team: 'red' }],
  ['blau', {}, { cmd: 'point', team: 'blue' }],
  ['point blue', {}, { cmd: 'point', team: 'blue' }],
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
  ['Guille', { names: { red: ['Guille Rojas'] } }, { cmd: 'point', team: 'red' }],
  ['punto Ana', { names: { blue: ['Ana'] }, strict: true }, { cmd: 'point', team: 'blue' }],
  ['Al', { names: { blue: ['Al'] } }, null], // names under 3 letters are ignored
];

let fails = 0;
for (const [text, opts, want] of cases) {
  try { assert.deepEqual(match(text, opts), want); } catch { fails++; console.error(`✗ "${text}" ${JSON.stringify(opts)} → ${JSON.stringify(match(text, opts))}, want ${JSON.stringify(want)}`); }
}
console.log(`${cases.length - fails} passed${fails ? `, ${fails} FAILED` : ''}`);
if (fails) process.exit(1);
