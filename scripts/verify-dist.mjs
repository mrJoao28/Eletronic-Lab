import { readFileSync, statSync, writeFileSync } from 'node:fs';
for (const id of ['pi4', 'hc283', 'resistor', 'capacitor']) {
  const path = `dist/models/${id}.glb`;
  const bytes = readFileSync(path);
  if (
    bytes.subarray(0, 4).toString() !== 'glTF' ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length
  )
    throw new Error(`Invalid deployed asset: ${path}`);
}
if (!statSync('dist/index.html').size) throw new Error('Empty application entry');
console.log('Production entry and all four binary GLB assets verified.');

writeFileSync(
  'dist/release.json',
  JSON.stringify({
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local',
    builtAt: new Date().toISOString(),
  }),
);
