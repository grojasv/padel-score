/* Padel Score voice input: command matching (pure, testable in node) + the recognition loop (browser).
 * Browser: Voice.listen({ lang, strict, names, onCommand, onState }) → { pause, resume, stop, setLang }.
 * Node:    const { match } = require('./voice.js').
 * See SPEC.md § Voice in. The loop is paused while Bolo speaks (anti-echo) and restarts itself after silence. */
(function (root) {
  'use strict';

  // Words per command, normalized (lowercase, no accents). ES and CA words are always accepted: a Catalan
  // phone without ca-ES recognition falls back to es-ES and players mix both. EN colour words count only when
  // the app is in English, because "red" is Spanish for the net ("¡a la red!").
  const WORDS = {
    red: ['rojo', 'roja', 'rojos', 'vermell', 'vermella', 'bermell'],
    // turquesa (Guille, 2026-11-12): "azul" starts soft and was missed far more than "rojo" on court. A word
    // with hard T and K sounds carries better; azul keeps working.
    blue: ['azul', 'azules', 'asul', 'azur', 'blau', 'blava', 'blao', 'turquesa', 'turquesas', 'turquoise'],
    undo: ['deshacer', 'deshaz', 'anula', 'anular', 'desfes', 'desfer', 'anulla', 'undo', 'cancel'],
    score: ['marcador', 'resultado', 'score'],
    pause: ['pausa', 'pause'],
  };
  const EN_WORDS = { red: ['red'], blue: ['blue', 'blew'] };
  const PHRASES = { blue: ['a sul', 'a zul', 'a sur', 'ha sul', 'as ul'] }; // two-token near misses for "azul"
  // What Chrome writes for a colour shouted from the far end of the court. Normal mode only: strict mode is for
  // noisy courts, where a near miss must not score.
  const LOOSE = {
    red: ['rollo', 'royo', 'rocho', 'roxo', 'rogo', 'rojito', 'rojas', 'vermel', 'vermey', 'bermey', 'bermello'],
    blue: ['asur', 'hazul', 'azull', 'azu', 'abul', 'azure', 'asules', 'blaus', 'blaw', 'blou', 'turkesa', 'turquese', 'turquessa', 'turqueza'],
  };
  const POINT = ['punto', 'punt', 'point', 'puntos', 'punts'];

  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/·/g, '').replace(/[^a-z0-9ñç\s]/g, ' ').replace(/\s+/g, ' ').trim();

  /* Returns { cmd: 'point', team } | { cmd: 'undo' } | { cmd: 'score' } | { cmd: 'pause' } | null.
   * strict: a point needs "punto" right before the colour or the name.
   * names: { red: ['guille', 'ana'], blue: [...] } player names, matched by their first word, in strict mode only:
   * players call each other by name all game ("¡tuya, Ana!"), so a bare name must never score.
   * lang: the app language; 'en' adds the English colour words. */
  function match(transcript, { strict = false, names = {}, lang = 'es' } = {}) {
    const text = norm(transcript);
    if (!text) return null;
    const tokens = text.split(' ');
    const has = (list) => tokens.some((t) => list.includes(t));
    if (has(WORDS.undo)) return { cmd: 'undo' };

    const named = (team) => (strict ? (names[team] || []).map((n) => norm(n).split(' ')[0]).filter((n) => n.length > 2) : []);
    const teamWords = {
      red: [...WORDS.red, ...(strict ? [] : LOOSE.red), ...(lang === 'en' ? EN_WORDS.red : []), ...named('red')],
      blue: [...WORDS.blue, ...(strict ? [] : LOOSE.blue), ...(lang === 'en' ? EN_WORDS.blue : []), ...named('blue')],
    };
    const hits = new Set();
    tokens.forEach((t, i) => {
      for (const team of ['red', 'blue']) {
        if (!teamWords[team].includes(t)) continue;
        if (strict && !POINT.includes(tokens[i - 1])) continue;
        hits.add(team);
      }
    });
    if (!strict) PHRASES.blue.forEach((p) => { if (` ${text} `.includes(` ${p} `)) hits.add('blue'); });
    if (hits.size === 1) return { cmd: 'point', team: [...hits][0] };
    if (hits.size > 1) return null; // "rojo azul": ambiguous, ignore
    if (has(WORDS.score)) return { cmd: 'score' };
    if (has(WORDS.pause)) return { cmd: 'pause' };
    return null;
  }

  // ---------- the recognition loop (browser only) ----------
  const VOICE_LANG = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };
  // Looked up on use, not at load, so a test can swap in a fake recognizer.
  const getRec = () => (typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null);
  const supported = () => !!getRec();

  // The loop keeps one recognizer at a time. A recognizer that is aborted before it starts may never send onend
  // (seen on Android, where Bolo's first line paused the mic at once and it never came back), so abort() drops it
  // at once, every handler checks it still belongs to the current recognizer, and a watchdog replaces a recognizer
  // that does not start within 5 s. opts.onTrace gets each step, for the "what Bolo heard" log.
  function listen(opts) {
    const Rec = getRec();
    if (!Rec) { opts.onState?.('unsupported'); return null; }
    let rec = null, wanted = true, held = !!opts.held, backoff = 0, timer = null, guard = null, lang = opts.lang || 'es', fallback = false;
    let lastCmd = '', lastAt = 0;
    const handled = new Set(); // result indexes already acted on (interim results come several times)
    const START_MS = opts.startMs || 5000; // tests use a shorter wait

    const state = (s) => opts.onState?.(s);
    const trace = (s) => opts.onTrace?.(s);
    // onHeard gets every final phrase and every command, with what happened to it, for the "what Bolo heard" log.
    function fire(cmd, key, text) {
      const sig = cmd.cmd + (cmd.team || '');
      const now = Date.now();
      handled.add(key);
      if (opts.isQuiet?.()) { opts.onHeard?.({ text, cmd, outcome: 'quiet' }); return; } // Bolo is talking: his own words
      if (sig === lastCmd && now - lastAt < 1500) { opts.onHeard?.({ text, cmd, outcome: 'dup' }); return; } // the same command twice in 1.5 s: once
      lastCmd = sig; lastAt = now;
      const outcome = opts.onCommand?.(cmd) || 'ok';
      opts.onHeard?.({ text, cmd, outcome });
    }
    const later = (ms) => { clearTimeout(timer); timer = setTimeout(start, ms); };

    function start() {
      clearTimeout(timer);
      if (!wanted || held || rec) return;
      const r = new Rec();
      rec = r;
      r.lang = fallback ? 'es-ES' : VOICE_LANG[lang] || 'es-ES';
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1; // extra alternatives turn "¡ojo!" into "rojo"
      handled.clear();
      let live = false;
      r.onstart = () => {
        if (rec !== r) return;
        live = true; clearTimeout(guard); backoff = 0; state('listening');
      };
      r.onresult = (e) => {
        if (rec !== r) return;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const key = i;
          if (handled.has(key)) continue;
          const text = e.results[i][0].transcript;
          const cmd = match(text, { strict: opts.strict, names: opts.names, lang });
          if (cmd) fire(cmd, key, text);
          else if (e.results[i].isFinal) { handled.add(key); opts.onHeard?.({ text, cmd: null, outcome: 'none' }); }
        }
      };
      r.onerror = (e) => {
        if (rec !== r) return;
        if (e.error !== 'no-speech' && e.error !== 'aborted') opts.onHeard?.({ text: e.error, cmd: null, outcome: 'error' });
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { wanted = false; state('denied'); return; }
        if (e.error === 'language-not-supported' && !fallback) { fallback = true; return; }
        if (e.error === 'network' || e.error === 'audio-capture') { backoff = Math.min(30000, (backoff || 1000) * 2); state('error'); }
      };
      r.onend = () => {
        if (rec !== r) return; // an old recognizer, already replaced
        rec = null; clearTimeout(guard);
        if (!wanted) { state('off'); return; }
        if (held) { state('paused'); return; }
        later(backoff || 250);
      };
      clearTimeout(guard);
      guard = setTimeout(() => {
        if (rec !== r || live) return;
        trace('mic stuck: restart');
        drop();
        if (wanted && !held) later(250);
      }, START_MS);
      try { r.start(); } catch (x) { trace(`mic start failed ${x?.name || ''}`.trim()); if (rec === r) rec = null; later(1000); }
    }
    // Forget the current recognizer at once (its late events are ignored) and ask it to stop.
    function drop() {
      clearTimeout(timer); clearTimeout(guard);
      const r = rec;
      rec = null;
      if (r) { try { r.abort(); } catch { /* already stopped */ } }
    }

    if (held) state('paused'); else start();
    return {
      // Hold while Bolo speaks, so his own words are not heard as commands.
      pause() { held = true; drop(); state('paused'); },
      resume() { held = false; if (wanted) start(); },
      stop() { wanted = false; held = false; drop(); state('off'); },
      // A tap on the mic: always a fresh recognizer, whatever state the old one is in.
      retry() { wanted = true; held = false; backoff = 0; drop(); start(); },
      setLang(l) { lang = l; fallback = false; drop(); if (wanted && !held) later(250); },
      set strict(v) { opts.strict = v; },
    };
  }

  const api = { match, norm, listen, supported, WORDS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Voice = api;
})(typeof self !== 'undefined' ? self : this);
