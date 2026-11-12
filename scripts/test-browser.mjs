// Plays real matches in a real browser (Chromium via Playwright): node scripts/test-browser.mjs
// Needs `npm install` once. Real mouse taps (pointerdown and click, as a finger sends them), a fake speech
// recognizer for the voice path, and a check that nothing is cut off at the sizes in CLAUDE.md.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

let chromium;
try { ({ chromium } = await import('playwright')); } catch { console.error('playwright is missing: run `npm install` first'); process.exit(1); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(root, path.endsWith('/') ? `${path}index.html` : path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || (path.endsWith('/') ? 'text/html' : 'application/octet-stream') }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

// A recognizer the test can talk to: window.__say('rojo') is one final phrase.
const fakeSpeech = () => {
  class Fake {
    // Like Chrome, it ends by itself after a while (the app must start the next one).
    start() { this.results = []; window.__rec = this; setTimeout(() => this.onstart?.(), 10); this.e = setTimeout(() => this.onend?.(), 1200); }
    abort() { clearTimeout(this.e); setTimeout(() => this.onend?.(), 5); }
    stop() { this.abort(); }
  }
  window.SpeechRecognition = Fake; window.webkitSpeechRecognition = Fake;
  window.__say = (text) => {
    const r = window.__rec;
    r.results.push(Object.assign([{ transcript: text }], { isFinal: true }));
    r.onresult?.({ resultIndex: r.results.length - 1, results: r.results });
  };
};
const SETUP = { mode: 'singles', deuce: 'advantage', muted: true, voiceInput: true, timeLimit: 90, names: { red: ['', ''], blue: ['', ''] } };

const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
let passed = 0, failed = 0;
async function test(name, { width, height, dark = false, setup = {} }, fn) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light', locale: 'es-ES', hasTouch: true, permissions: ['microphone'], serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(fakeSpeech);
  await page.addInitScript((s) => { if (!localStorage.getItem('padel-score.setup')) localStorage.setItem('padel-score.setup', JSON.stringify(s)); }, { ...SETUP, ...setup });
  try {
    await fn(page);
    assert.deepEqual(errors, [], 'page errors');
    passed++;
  } catch (e) { failed++; console.error(`✗ ${name} (${width}×${height}${dark ? ' dark' : ''})\n  ${e.message.split('\n').slice(0, 6).join('\n  ')}`); }
  await ctx.close();
}

// ---------- helpers ----------
const TAP_MS = 650; // the scoreboard ignores a second tap within 600 ms
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('padel-score.current')));
async function tap(page, team) { // a real tap in the middle of that half
  const box = await page.locator(`.half.h-${team}`).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6);
  await page.waitForTimeout(TAP_MS);
}
async function start(page) {
  await page.goto(`${URL_}#/setup`);
  await page.locator('#setupForm button[type=submit]').click();
  await page.locator('.board').waitFor();
  await page.waitForTimeout(TAP_MS);
}
// Nothing wider than the screen, and no scoreboard text cut by its own box or by the screen edge.
async function fits(page, selectors, where, { scrolls = false } = {}) {
  const bad = await page.evaluate(([sels, scrolls]) => {
    const out = [];
    const W = innerWidth, H = innerHeight, root = document.documentElement;
    if (root.scrollWidth > W + 1) out.push(`page is ${root.scrollWidth}px wide, screen ${W}px`);
    for (const sel of sels) for (const e of document.querySelectorAll(sel)) {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue; // hidden at this size
      const text = `${sel} «${e.textContent.trim().slice(0, 20)}»`;
      if (r.left < -1 || r.right > W + 1 || (!scrolls && (r.top < -1 || r.bottom > H + 1))) out.push(`${text} leaves the screen (${Math.round(r.left)},${Math.round(r.top)} to ${Math.round(r.right)},${Math.round(r.bottom)})`);
      if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') out.push(`${text} is cut (${e.scrollWidth}px in ${e.clientWidth}px)`);
    }
    return out;
  }, [selectors, scrolls]);
  assert.deepEqual(bad, [], where);
}
const BOARD = ['.m-bubble', '.h-points', '.h-games', '.h-name', '.m-clock', '.undo-big', '.more', '.mic'];
const SUMMARY = ['.s-title', '.s-team b', '.s-team small', '.s-label'];

// ---------- the scoreboard, landscape, both phone sizes, light and dark ----------
for (const [width, height] of [[568, 320], [844, 390]]) for (const dark of [false, true]) {
  await test('padel: a game, the summary, deuce, undo, reload', { width, height, dark }, async (page) => {
    await start(page);
    await fits(page, BOARD, 'board at 0-0, clock 1:29:59');
    assert.match(await page.locator('.m-clock').textContent(), /^1:\d\d:\d\d$/, 'the 90 min clock shows hours');

    for (let i = 0; i < 4; i++) await tap(page, 'red'); // game to red
    assert.deepEqual((await state(page)).state.games, { red: 1, blue: 0 });
    await page.locator('.m-sum').waitFor({ timeout: 500 }); // the same tap must not close it
    await fits(page, SUMMARY, 'game summary');
    await page.waitForTimeout(1500);
    assert.ok(await page.locator('.m-sum').isVisible(), 'the summary stays until a tap');
    await page.locator('.m-sum').click();
    await page.locator('.m-sum').waitFor({ state: 'detached', timeout: 500 });

    for (const t of ['red', 'red', 'red', 'blue', 'blue', 'blue', 'red']) await tap(page, t); // 40-40, then AD red
    assert.equal(await page.locator('.half.h-red .h-points').textContent(), 'AD');
    await fits(page, BOARD, 'board at AD-40');

    await page.locator('[data-act=undo]').click();
    assert.equal(await page.locator('.half.h-red .h-points').textContent(), '40', 'undo takes AD back');

    const before = await state(page);
    await page.reload();
    await page.locator('.m-overlay[data-act=unlock]').click(); // back on the board: one tap to continue (sound and mic need a tap)
    await page.locator('.m-overlay').waitFor({ state: 'detached' });
    const after = await state(page);
    assert.deepEqual(after.state, before.state, 'a reload keeps the match');
    assert.equal(await page.locator('.half.h-blue .h-points').textContent(), '40');
  });
}

// ---------- voice, the heard log and its numbers ----------
await test('voice: «rojo» and «verde» score, a tap is counted apart, the log shows the share', { width: 844, height: 390 }, async (page) => {
  await start(page);
  await page.waitForFunction(() => document.querySelector('.mic')?.dataset.state === 'listening', null, { timeout: 3000 });
  for (const w of ['rojo', 'punto verde', 'rojo']) { await page.evaluate((x) => window.__say(x), w); await page.waitForTimeout(100); }
  await page.evaluate(() => window.__say('qué calor hace')); // heard, not a command
  await tap(page, 'blue');
  let m = await state(page);
  assert.deepEqual(m.state.points, { red: 2, blue: 2 });
  assert.deepEqual(m.src, ['vr', 'vb', 'vr', 'tb']);
  await page.locator('[data-act=undo]').click(); // the undone tap leaves the count
  m = await state(page);
  assert.deepEqual(m.src, ['vr', 'vb', 'vr']);
  assert.ok(m.mic.starts >= 2, `mic restarts are counted (${m.mic.starts})`);
  assert.ok(m.mic.ms < Date.now() - m.startedAt, 'restart waits are not listening time');

  await page.locator('[data-act=menu]').click();
  await page.locator('[data-act=edit]').click();
  await page.locator('[data-act=heard]').click();
  const stats = await page.locator('.h-stats').innerText();
  assert.match(stats, /Rojo: 🎙 2 · 👆 0 · ⌚ 0 \(100% por voz\)/);
  assert.match(stats, /Verde: 🎙 1 · 👆 0 · ⌚ 0 \(100% por voz\)/);
  assert.match(stats, /Micro escuchando el \d+% del tiempo, \d+ arranques/);
  const log = await page.locator('.h-list').innerText();
  assert.match(log, /✅ «rojo» → Rojo/); assert.match(log, /✅ «punto verde» → Verde/); assert.match(log, /· «qué calor hace»/);
  await fits(page, ['.h-box'], 'heard log');
});

// ---------- a whole match (ping pong to 6), then the hub and its history, portrait, light and dark ----------
for (const [width, height] of [[320, 568], [390, 844]]) for (const dark of [false, true]) {
  await test('ping pong to 6: finish, history row with the voice share, hub fits', { width, height, dark, setup: { sport: 'pingpong', ppMode: 'singles', ppBestOf: 6 } }, async (page) => {
    await page.goto(URL_);
    await fits(page, ['.btn', '.sec', '.brand', '.langs'], 'hub, no history', { scrolls: true });
    await start(page);
    await page.waitForFunction(() => document.querySelector('.mic')?.dataset.state === 'listening', null, { timeout: 3000 });
    for (let i = 0; i < 2; i++) { await page.evaluate(() => window.__say('rojo')); await page.waitForTimeout(1600); } // the same word twice within 1.5 s counts once
    await tap(page, 'red'); // 3-0: change of ends
    await page.locator('.m-sum').waitFor();
    await fits(page, SUMMARY, 'change of ends');
    await page.waitForTimeout(900); // a tap in the first 800 ms does not close it
    await page.locator('.m-sum').click();
    await page.waitForTimeout(TAP_MS);
    for (let i = 0; i < 3; i++) await tap(page, 'red');
    await page.locator('.m-finish').waitFor();
    await fits(page, ['.m-finish h2', '.m-finish .btn'], 'finish panel');
    await page.goto(`${URL_}#/`);
    const row = page.locator('.history li').first();
    await row.waitFor();
    assert.match(await row.innerText(), /6-0/);
    assert.match(await row.locator('.h-voice').innerText(), /🎙 33% · –/, '2 of red\'s 6 points by voice');
    await fits(page, ['.history li', '.h-voice', '.h-heard', '.btn', '.brand', '.langs'], 'hub with history', { scrolls: true });
    await row.locator('.h-heard').click();
    assert.match(await page.locator('.heard-modal .h-stats').innerText(), /Rojo: 🎙 2 · 👆 4 · ⌚ 0 \(33% por voz\)/);
    await fits(page, ['.heard-modal .h-box'], 'heard log from the history');
  });
}

await browser.close();
server.close();
console.log(`${passed} passed${failed ? `, ${failed} FAILED` : ''}`);
if (failed) process.exit(1);
