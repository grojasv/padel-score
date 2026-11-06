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
    blue: ['azul', 'azules', 'asul', 'azur', 'blau', 'blava', 'blao'],
    undo: ['deshacer', 'deshaz', 'anula', 'anular', 'desfes', 'desfer', 'anulla', 'undo', 'cancel'],
    score: ['marcador', 'resultado', 'score'],
    pause: ['pausa', 'pause'],
  };
  const EN_WORDS = { red: ['red'], blue: ['blue', 'blew'] };
  const PHRASES = { blue: ['a sul', 'a zul'] }; // two-token near misses for "azul"
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
      red: [...WORDS.red, ...(lang === 'en' ? EN_WORDS.red : []), ...named('red')],
      blue: [...WORDS.blue, ...(lang === 'en' ? EN_WORDS.blue : []), ...named('blue')],
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

  function listen(opts) {
    const Rec = getRec();
    if (!Rec) { opts.onState?.('unsupported'); return null; }
    let rec = null, wanted = true, held = false, backoff = 0, timer = null, lang = opts.lang || 'es', fallback = false;
    let lastCmd = '', lastAt = 0;
    const handled = new Set(); // result indexes already acted on (interim results come several times)

    const state = (s) => opts.onState?.(s);
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

    function start() {
      clearTimeout(timer);
      if (!wanted || held || rec) return;
      rec = new Rec();
      rec.lang = fallback ? 'es-ES' : VOICE_LANG[lang] || 'es-ES';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1; // extra alternatives turn "¡ojo!" into "rojo"
      handled.clear();
      rec.onstart = () => { backoff = 0; state('listening'); };
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const key = i;
          if (handled.has(key)) continue;
          const text = e.results[i][0].transcript;
          const cmd = match(text, { strict: opts.strict, names: opts.names, lang });
          if (cmd) fire(cmd, key, text);
          else if (e.results[i].isFinal) { handled.add(key); opts.onHeard?.({ text, cmd: null, outcome: 'none' }); }
        }
      };
      rec.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') opts.onHeard?.({ text: e.error, cmd: null, outcome: 'error' });
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { wanted = false; state('denied'); return; }
        if (e.error === 'language-not-supported' && !fallback) { fallback = true; return; }
        if (e.error === 'network') { backoff = Math.min(30000, (backoff || 1000) * 2); state('error'); }
      };
      rec.onend = () => {
        rec = null;
        if (!wanted) { state('off'); return; }
        if (held) { state('paused'); return; }
        timer = setTimeout(start, backoff || 250);
      };
      try { rec.start(); } catch { rec = null; timer = setTimeout(start, 1000); }
    }
    function abort() { clearTimeout(timer); if (rec) { try { rec.abort(); } catch { /* already stopped */ } } }

    start();
    return {
      // Hold while Bolo speaks, so his own words are not heard as commands.
      pause() { held = true; abort(); state('paused'); },
      resume() { held = false; if (wanted) start(); },
      stop() { wanted = false; held = false; abort(); state('off'); },
      retry() { wanted = true; backoff = 0; start(); },
      setLang(l) { lang = l; fallback = false; abort(); },
      set strict(v) { opts.strict = v; },
    };
  }

  const api = { match, norm, listen, supported, WORDS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Voice = api;
})(typeof self !== 'undefined' ? self : this);
