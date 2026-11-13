// Checks data/lines.json and the version: node scripts/validate.mjs
// Every key has ES, CA and EN pools, none empty, each line at most 12 words, with no emoji.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lines = JSON.parse(readFileSync(join(root, 'data', 'lines.json'), 'utf8'));
const KEYS = ['hello', 'start', 'game', 'set', 'setPoint', 'matchPoint', 'finish', 'draw', 'timeWarn', 'lastGame', 'paused', 'resumed', 'ppHello', 'ppGame', 'ppFinish', 'streak'];
const LANGS = ['es', 'ca', 'en'];
const errors = [];

for (const k of KEYS) if (!lines[k]) errors.push(`missing key ${k}`);
for (const [k, pools] of Object.entries(lines)) {
  if (!KEYS.includes(k)) errors.push(`unknown key ${k}`);
  for (const l of LANGS) {
    const pool = pools[l];
    if (!Array.isArray(pool) || !pool.length) { errors.push(`${k}.${l} is empty`); continue; }
    if (pool.length !== pools.es.length) errors.push(`${k}.${l} has ${pool.length} lines, es has ${pools.es.length}`);
    for (const line of pool) {
      if (line.split(/\s+/).length > 12) errors.push(`${k}.${l} too long: ${line}`);
      if (/\p{Extended_Pictographic}/u.test(line)) errors.push(`${k}.${l} has an emoji: ${line}`);
    }
  }
}
// One version everywhere: app.js VERSION, the newest CHANGELOG entry and the service worker cache name.
const version = readFileSync(join(root, 'app.js'), 'utf8').match(/const VERSION = '([^']+)'/)?.[1];
const logTop = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').match(/^## \[([^\]]+)\]/m)?.[1];
const cache = readFileSync(join(root, 'sw.js'), 'utf8').match(/const CACHE = '([^']+)'/)?.[1];
if (version !== logTop) errors.push(`app.js VERSION ${version} != CHANGELOG ${logTop}`);
if (cache !== `padel-score-${version}`) errors.push(`sw.js CACHE ${cache} != padel-score-${version}`);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`lines.json ok (${Object.keys(lines).length} keys), version ${version} matches CHANGELOG and sw.js`);
