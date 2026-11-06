// Builds the PWA icons from Bolo: node scripts/make-icons.mjs
// Writes icons/icon.svg, icon-192.png, icon-512.png and apple-touch-icon.png (180, opaque).
// PNGs are rasterized with resvg-py through uv (no npm dependencies). Borrowed from gym-coach.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const Bolo = require(join(root, 'mascot.js'));
const outDir = join(root, 'icons');
mkdirSync(outDir, { recursive: true });

const COURT = '#1f5fbf', COURT_DARK = '#17488f', LINE = '#ffffff', RED = '#e63946';

// A padel court seen from above, behind Bolo. Bolo stays inside the maskable safe circle (r 205).
const SIZE = 360;
const head = Bolo.head('happy').replace('<svg ', `<svg x="${256 - SIZE / 2}" y="${256 - SIZE / 2 + 8}" width="${SIZE}" height="${SIZE}" `);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<rect width="512" height="512" fill="${COURT}"/>
<rect x="0" y="0" width="512" height="256" fill="${COURT_DARK}"/>
<line x1="0" y1="256" x2="512" y2="256" stroke="${LINE}" stroke-width="10"/>
<line x1="256" y1="120" x2="256" y2="392" stroke="${LINE}" stroke-width="6" opacity="0.8"/>
<line x1="0" y1="120" x2="512" y2="120" stroke="${LINE}" stroke-width="6" opacity="0.8"/>
<line x1="0" y1="392" x2="512" y2="392" stroke="${LINE}" stroke-width="6" opacity="0.8"/>
<circle cx="256" cy="256" r="200" fill="none" stroke="${RED}" stroke-width="8" opacity="0.9"/>
${head}
</svg>
`;

const svgPath = join(outDir, 'icon.svg');
writeFileSync(svgPath, svg);

const py = `
import sys, resvg_py
svg_path, outdir = sys.argv[1], sys.argv[2]
for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)):
    data = resvg_py.svg_to_bytes(svg_path=svg_path, width=size, height=size)
    with open(outdir + "/" + name, "wb") as f:
        f.write(bytes(data))
    print(name, size, len(data))
`;
const out = execFileSync('uv', ['run', '-q', '--with', 'resvg-py', 'python', '-I', '-c', py, svgPath, outDir], { encoding: 'utf8' });
process.stdout.write('icon.svg\n' + out);
