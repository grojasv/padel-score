/* Padel Score effects: vibration, confetti, the court drawn at match start and the result card to share.
 * Browser only: window.Fx = { calm, buzz, confetti, courtIntro, card, share }. Every layer ignores taps
 * (pointer-events: none), so nothing here delays a point. With "reduce motion" on, the animations do not run. */
(() => {
  'use strict';
  const calm = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Android only: iPhone Safari has no vibration.
  function buzz(pattern) { try { navigator.vibrate?.(pattern); } catch { /* not allowed now */ } }
  function layer(cls, ms) {
    const d = document.createElement('div');
    d.className = cls;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), ms);
    return d;
  }

  const SHADES = { red: ['#e63946', '#ff8a93', '#b8202d'], blue: ['#0f8a3c', '#4ade80', '#06603a'] };
  // n pieces in the team's colour, falling over the whole screen: about 30 for a game, 70 for a set, 140 for the match.
  function confetti(team, n = 30) {
    if (calm()) return;
    const cols = [...(SHADES[team] || []), '#ffffff', '#ffcf24'];
    const r = Math.random;
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<i style="left:${(r() * 100).toFixed(1)}%;background:${cols[i % cols.length]};width:${6 + Math.round(r() * 8)}px;height:${8 + Math.round(r() * 10)}px;`
        + `--dx:${((r() - 0.5) * 30).toFixed(1)}vw;--rot:${Math.round(r() * 900 - 450)}deg;--d:${(r() * 0.5).toFixed(2)}s;--t:${(1.4 + r() * 1.2).toFixed(2)}s"></i>`;
    }
    layer('fx-confetti', 3400).innerHTML = html;
  }

  // Match start: the court lines draw themselves and a ball flies from the receiver's half to the server's half.
  // el: the match element (its two .half give the positions, so it works sideways and upright). ball: '' or 'pp'.
  function courtIntro(el, serverTeam, ball = '') {
    if (calm()) return;
    const halves = [...el.querySelectorAll('.half')];
    const to = halves.find((h) => h.dataset.team === serverTeam), from = halves.find((h) => h !== to);
    if (!to || !from) return;
    const W = window.innerWidth, H = window.innerHeight, p = Math.round(Math.min(W, H) * 0.05);
    const x = (f) => Math.round(p + (W - 2 * p) * f), y = (f) => Math.round(p + (H - 2 * p) * f);
    const paths = W >= H // the net runs between the two halves
      ? [`M${x(0)} ${y(0)}H${x(1)}V${y(1)}H${x(0)}Z`, `M${x(0.5)} ${y(0)}V${y(1)}`, `M${x(0.22)} ${y(0)}V${y(1)}`, `M${x(0.78)} ${y(0)}V${y(1)}`, `M${x(0.22)} ${y(0.5)}H${x(0.78)}`]
      : [`M${x(0)} ${y(0)}H${x(1)}V${y(1)}H${x(0)}Z`, `M${x(0)} ${y(0.5)}H${x(1)}`, `M${x(0)} ${y(0.22)}H${x(1)}`, `M${x(0)} ${y(0.78)}H${x(1)}`, `M${x(0.5)} ${y(0.22)}V${y(0.78)}`];
    const box = layer('fx-court', 2000);
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${paths.map((d, i) => `<path d="${d}" pathLength="1" style="--i:${i}"/>`).join('')}</svg><b class="fx-ball ${ball}"></b>`;
    const mid = (h) => { const r = h.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const [fx, fy] = mid(from), [tx, ty] = mid(to);
    box.querySelector('.fx-ball').animate?.([
      { transform: `translate(${fx}px,${fy}px) scale(0.4)`, opacity: 0 },
      { transform: `translate(${fx}px,${fy}px) scale(0.8)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${(fx + tx) / 2}px,${(fy + ty) / 2}px) scale(1.9)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${tx}px,${ty}px) scale(1)`, opacity: 1, offset: 0.85 },
      { transform: `translate(${tx}px,${ty}px) scale(2.8)`, opacity: 0 },
    ], { duration: 1300, delay: 250, fill: 'both', easing: 'ease-in-out' });
  }

  // ---------- the result card: a 1080×1080 image for the share sheet ----------
  // d: { sport, title, date, red, blue, cols: [{ red, blue }], winner: 'red' | 'blue' | 'draw', meta }
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const TEAM = { red: '#e63946', blue: '#0f8a3c' };
  async function card(d) {
    const S = 1080, c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    try { await Promise.all(['400 60px Bungee', '700 90px Oswald', '800 44px Rubik'].map((f) => document.fonts.load(f))); } catch { /* system fonts */ }
    const pp = d.sport === 'pingpong';
    const bg = g.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, pp ? '#e2620a' : '#1f5fbf'); bg.addColorStop(1, pp ? '#2a1405' : '#0b1530');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 8; // faint court lines
    g.strokeRect(44, 44, S - 88, S - 88);
    g.beginPath(); g.moveTo(44, 600); g.lineTo(S - 44, 600); g.moveTo(S / 2, 44); g.lineTo(S / 2, 600); g.stroke();
    // Shrinks the font until the text fits the width.
    const fit = (text, font, size, max) => { do { g.font = font.replace('#', size); size -= 2; } while (g.measureText(text).width > max && size > 18); };
    g.textBaseline = 'alphabetic'; g.fillStyle = '#fff';
    g.font = '400 44px Bungee, Rubik, sans-serif'; g.textAlign = 'left'; g.fillText(pp ? 'PING PONG SCORE' : 'PADEL SCORE', 84, 132);
    g.font = '600 32px Rubik, sans-serif'; g.textAlign = 'right'; g.globalAlpha = 0.85; g.fillText(d.date || '', S - 84, 130); g.globalAlpha = 1;
    const won = d.winner === 'red' || d.winner === 'blue';
    try {
      const svg = window.Bolo.svg(won ? 'cheer' : 'happy', { gold: won, sport: d.sport }).replace('<svg ', '<svg width="400" height="440" ');
      g.drawImage(await loadImg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`), won ? 290 : 360, 170, 360, 396);
    } catch { /* the card still works without the drawing */ }
    if (won) { g.font = '190px sans-serif'; g.textAlign = 'left'; g.fillText('🏆', 610, 540); }
    g.textAlign = 'center'; g.fillStyle = '#ffcf24';
    fit(d.title.toUpperCase(), '400 #px Bungee, Rubik, sans-serif', 92, S - 160);
    g.fillText(d.title.toUpperCase(), S / 2, 690);
    ['red', 'blue'].forEach((team, i) => {
      const top = 740 + i * 126, mine = d.winner === team;
      g.globalAlpha = mine || !won ? 1 : 0.8;
      g.fillStyle = TEAM[team];
      g.beginPath(); g.roundRect?.(84, top, S - 168, 108, 26); if (!g.roundRect) g.rect(84, top, S - 168, 108); g.fill();
      if (mine) { g.lineWidth = 7; g.strokeStyle = '#fff'; g.stroke(); }
      g.fillStyle = '#fff'; g.textAlign = 'right'; g.font = '700 84px Oswald, Rubik, sans-serif';
      const cols = d.cols.slice(-5);
      cols.forEach((col, k) => g.fillText(String(col[team]), S - 120 - (cols.length - 1 - k) * 104, top + 84));
      g.textAlign = 'left';
      fit(d[team], '800 #px Rubik, sans-serif', 46, S - 168 - 60 - cols.length * 104 - 30);
      g.fillText(d[team], 120, top + 70);
    });
    g.globalAlpha = 0.85; g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '600 30px Rubik, sans-serif';
    g.fillText([d.meta, 'grojasv.github.io/padel-score'].filter(Boolean).join('  ·  '), S / 2, 1034);
    g.globalAlpha = 1;
    return c;
  }
  // Opens the phone's share sheet with the image; where that does not exist (a desktop browser), saves the image.
  async function share(d) {
    const canvas = await card(d);
    const blob = await new Promise((done) => canvas.toBlob(done, 'image/png'));
    const file = new File([blob], 'padel-score.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: d.title }); } catch { /* closed without sharing */ }
      return 'shared';
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    return 'saved';
  }

  window.Fx = { calm, buzz, confetti, courtIntro, card, share };
})();
