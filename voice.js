/* Padel Score voice input: command matching (pure, testable in node) + the recognition loop (browser).
 * Browser: Voice.listen({ lang, strict, names, onCommand, onState }) → { pause, resume, stop, setLang }.
 * Node:    const { match } = require('./voice.js').
 * See SPEC.md § Voice in. The loop is paused while Bolo speaks (anti-echo) and restarts itself after silence. */
(function (root) {
  'use strict';

  // Words per command, normalized (lowercase, no accents). All languages are accepted at once: a Catalan
  // phone without ca-ES recognition falls back to es-ES and the players may mix languages anyway.
  const WORDS = {
    red: ['rojo', 'roja', 'rojos', 'vermell', 'vermella', 'bermell', 'red'],
    blue: ['azul', 'azules', 'asul', 'azur', 'blau', 'blava', 'blao', 'blue', 'blew'],
    undo: ['deshacer', 'deshaz', 'anula', 'anular', 'desfes', 'desfer', 'anulla', 'undo', 'cancel'],
    score: ['marcador', 'resultado', 'score'],
    pause: ['pausa', 'pause'],
  };
  const PHRASES = { blue: ['a sul', 'a zul'] }; // two-token near misses for "azul"
  const POINT = ['punto', 'punt', 'point', 'puntos', 'punts'];

  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/·/g, '').replace(/[^a-z0-9ñç\s]/g, ' ').replace(/\s+/g, ' ').trim();

  /* Returns { cmd: 'point', team } | { cmd: 'undo' } | { cmd: 'score' } | { cmd: 'pause' } | null.
   * strict: a point needs "punto" right before the colour (or name).
   * names: { red: ['guille', 'ana'], blue: [...] } player names, matched by their first word. */
  function match(transcript, { strict = false, names = {} } = {}) {
    const text = norm(transcript);
    if (!text) return null;
    const tokens = text.split(' ');
    const has = (list) => tokens.some((t) => list.includes(t));
    if (has(WORDS.undo)) return { cmd: 'undo' };

    const teamWords = {
      red: [...WORDS.red, ...(names.red || []).map((n) => norm(n).split(' ')[0]).filter((n) => n.length > 2)],
      blue: [...WORDS.blue, ...(names.blue || []).map((n) => norm(n).split(' ')[0]).filter((n) => n.length > 2)],
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
  const Rec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const supported = () => !!Rec;

  function listen(opts) {
    if (!Rec) { opts.onState?.('unsupported'); return null; }
    let rec = null, wanted = true, held = false, backoff = 0, timer = null, lang = opts.lang || 'es', fallback = false;
    let lastCmd = '', lastAt = 0;
    const handled = new Set(); // result indexes already acted on (interim results come several times)

    const state = (s) => opts.onState?.(s);
    function fire(cmd, key) {
      const sig = cmd.cmd + (cmd.team || '');
      const now = Date.now();
      if (sig === lastCmd && now - lastAt < 1500) return; // the same command twice in 1.5 s: once
      lastCmd = sig; lastAt = now;
      handled.add(key);
      opts.onCommand?.(cmd);
    }

    function start() {
      clearTimeout(timer);
      if (!wanted || held || rec) return;
      rec = new Rec();
      rec.lang = fallback ? 'es-ES' : VOICE_LANG[lang] || 'es-ES';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      handled.clear();
      rec.onstart = () => { backoff = 0; state('listening'); };
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const key = i;
          if (handled.has(key)) continue;
          const res = e.results[i];
          for (let a = 0; a < res.length; a++) {
            const cmd = match(res[a].transcript, { strict: opts.strict, names: opts.names });
            // Interim results act only on the top alternative; final ones may use the others.
            if (cmd && (res.isFinal || a === 0)) { fire(cmd, key); break; }
          }
        }
      };
      rec.onerror = (e) => {
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
