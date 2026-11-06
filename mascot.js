/* Bolo: the Padel Score mascot, a padel ball with spiky hero hair, drawn as inline SVG. Original design.
 * Browser: <script src="mascot.js"></script> then Bolo.svg('happy', { gold: true }).
 * Node:    const Bolo = require('./mascot.js').
 * Moods: idle, happy, fierce, sad, cheer. The app moves <g class="bolo-pupils"> (CSS --look-x/--look-y)
 * and animates <g class="bolo-mouth"> while he speaks. No external assets and no text. */
(function (root) {
  'use strict';

  const C = {
    ink: '#1d1a12',
    ball: '#dcef3a',
    ballHi: '#f4ff9c',
    ballLo: '#a9c21a',
    seam: '#ffffff',
    hair: '#1d1a12',
    hairHi: '#3b3628',
    gold: '#ffcf24',
    goldHi: '#fff1a0',
    white: '#ffffff',
    mouth: '#5a1420',
    tongue: '#f07a8a',
    cheek: '#ff8a65',
  };
  const MOODS = ['idle', 'happy', 'fierce', 'sad', 'cheer'];
  const pts = (p) => p.map(([x, y]) => `${x},${y}`).join(' ');

  // Spiky hair: a crown of big spikes, sweeping up and out. Points from left to right over the top of the ball.
  const HAIR = [
    [44, 112], [18, 92], [46, 88], [22, 58], [58, 70], [52, 30], [82, 58],
    [96, 8], [110, 54], [140, 22], [134, 64], [176, 44], [152, 84], [184, 92], [156, 112],
    [140, 92], [120, 86], [100, 84], [80, 86], [60, 94],
  ];
  // Bangs falling over the forehead.
  const BANGS = [[64, 92], [72, 106], [84, 92], [96, 108], [108, 92], [122, 104], [136, 92]];

  function hair(gold) {
    const fill = gold ? C.gold : C.hair, hi = gold ? C.goldHi : C.hairHi;
    return `<g class="bolo-hair${gold ? ' gold' : ''}">
      ${gold ? `<polygon points="${pts(HAIR)}" fill="${C.gold}" opacity="0.45" transform="translate(100 70) scale(1.12) translate(-100 -70)" class="bolo-aura"/>` : ''}
      <polygon points="${pts(HAIR)}" fill="${fill}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
      <polyline points="58,70 70,84 82,58 92,78 110,54 118,74 134,64" fill="none" stroke="${hi}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }
  const bangs = (gold) => `<polygon points="${pts(BANGS)}" fill="${gold ? C.gold : C.hair}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;

  function brows(mood) {
    const s = `stroke="${C.ink}" stroke-width="6" stroke-linecap="round" fill="none"`;
    if (mood === 'fierce') return `<path d="M64 114 L92 126" ${s}/><path d="M136 114 L108 126" ${s}/>`;
    if (mood === 'sad') return `<path d="M66 124 L90 116" ${s}/><path d="M134 124 L110 116" ${s}/>`;
    if (mood === 'happy' || mood === 'cheer') return `<path d="M66 120 Q78 110 90 118" ${s}/><path d="M110 118 Q122 110 134 120" ${s}/>`;
    return `<path d="M66 119 Q78 114 90 119" ${s}/><path d="M110 119 Q122 114 134 119" ${s}/>`;
  }

  function eyes(mood) {
    // Big determined eyes: white with a sharp upper lid; pupils move as a group.
    const lid = mood === 'fierce' ? 8 : mood === 'sad' ? 4 : 0;
    const eye = (cx, flip) => {
      const top = 130 + lid;
      const d = flip
        ? `M${cx + 13} ${top} Q${cx - 2} ${top - 4} ${cx - 13} ${top + 6} Q${cx - 15} 160 ${cx} 160 Q${cx + 14} 160 ${cx + 13} ${top} Z`
        : `M${cx - 13} ${top} Q${cx + 2} ${top - 4} ${cx + 13} ${top + 6} Q${cx + 15} 160 ${cx} 160 Q${cx - 14} 160 ${cx - 13} ${top} Z`;
      return `<path d="${d}" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`;
    };
    if (mood === 'cheer') {
      // Closed happy eyes ^ ^
      const s = `stroke="${C.ink}" stroke-width="6" stroke-linecap="round" fill="none"`;
      return `<path d="M66 148 Q78 132 90 148" ${s}/><path d="M110 148 Q122 132 134 148" ${s}/>`;
    }
    return `${eye(78, false)}${eye(122, true)}
      <g class="bolo-pupils">
        <ellipse cx="80" cy="147" rx="7" ry="9" fill="${C.ink}"/><ellipse cx="120" cy="147" rx="7" ry="9" fill="${C.ink}"/>
        <circle cx="82.5" cy="143" r="2.8" fill="${C.white}"/><circle cx="122.5" cy="143" r="2.8" fill="${C.white}"/>
      </g>`;
  }

  function mouth(mood) {
    let shape;
    if (mood === 'sad') shape = `<path d="M88 182 Q100 172 112 182" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    else if (mood === 'fierce') shape = `<path d="M86 172 L114 172 L110 182 L90 182 Z" fill="${C.mouth}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><path d="M88 174 L112 174" stroke="${C.white}" stroke-width="3"/>`;
    else if (mood === 'idle') shape = `<path d="M88 172 Q100 182 112 172" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    else shape = `<path d="M84 170 Q100 170 116 170 Q114 192 100 192 Q86 192 84 170 Z" fill="${C.mouth}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><path d="M92 186 Q100 180 108 186 Q100 192 92 186 Z" fill="${C.tongue}"/>`;
    return `<g class="bolo-mouth">${shape}</g>`;
  }

  function svg(mood = 'idle', opts = {}) {
    if (!MOODS.includes(mood)) mood = 'idle';
    const gold = !!opts.gold;
    return `<svg class="bolo mood-${mood}" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bolo">
  <defs>
    <radialGradient id="boloBall" cx="38%" cy="32%" r="75%">
      <stop offset="0" stop-color="${C.ballHi}"/><stop offset="0.55" stop-color="${C.ball}"/><stop offset="1" stop-color="${C.ballLo}"/>
    </radialGradient>
  </defs>
  <ellipse class="bolo-shadow" cx="100" cy="212" rx="46" ry="7" fill="#000" opacity="0.18"/>
  <g class="bolo-body">
    ${hair(gold)}
    <circle cx="100" cy="140" r="66" fill="url(#boloBall)" stroke="${C.ink}" stroke-width="3"/>
    <circle cx="100" cy="140" r="62" fill="none" stroke="${C.ballHi}" stroke-width="3" stroke-dasharray="1.5 4" opacity="0.8"/>
    <path d="M48 100 Q76 140 48 182" fill="none" stroke="${C.seam}" stroke-width="6" stroke-linecap="round"/>
    <path d="M152 100 Q124 140 152 182" fill="none" stroke="${C.seam}" stroke-width="6" stroke-linecap="round"/>
    ${bangs(gold)}
    ${brows(mood)}
    ${eyes(mood)}
    <ellipse cx="62" cy="166" rx="8" ry="5" fill="${C.cheek}" opacity="0.45"/><ellipse cx="138" cy="166" rx="8" ry="5" fill="${C.cheek}" opacity="0.45"/>
    ${mouth(mood)}
  </g>
</svg>`;
  }

  // Just the head for icons: same drawing, a squarer crop.
  const head = (mood = 'happy', opts = {}) => svg(mood, opts).replace('viewBox="0 0 200 220"', 'viewBox="6 4 188 206"');

  const api = { svg, head, MOODS, C };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Bolo = api;
})(typeof self !== 'undefined' ? self : this);
