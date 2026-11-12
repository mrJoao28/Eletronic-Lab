import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createHardwareModel } from '../src/models/hardware.ts';
import { modelCatalog } from '../src/models/catalog.ts';
// GLTFExporter needs only readAsArrayBuffer for these texture-free assets.
globalThis.FileReader = class {
  result = null;
  onloadend = null;
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.();
    });
  }
};
await mkdir('public/models', { recursive: true });
const fontLicense = await readFile('public/licenses/Helvetiker.txt', 'utf8');
const manifest = [];
for (const id of Object.keys(modelCatalog)) {
  const model = createHardwareModel(id);
  model.userData.license =
    'Original geometry: MIT, contributors Eletronic Lab. Text glyphs: MAGENTA font license.';
  model.userData.fontLicense = fontLicense;
  // The interactive scene uses millimetres; glTF's standard unit is metres.
  model.scale.setScalar(0.001);
  const data = await new GLTFExporter().parseAsync(model, { binary: true });
  await writeFile(`public/models/${id}.glb`, Buffer.from(data));
  manifest.push({
    id,
    ...modelCatalog[id],
    file: `${id}.glb`,
    bytes: data.byteLength,
    units: 'metres',
    license: 'MIT',
    fidelity: 'educational visual model; not manufacturing CAD',
  });
  console.log(`${id}.glb: ${(data.byteLength / 1024).toFixed(0)} KiB`);
}
await writeFile('public/models/catalog.json', JSON.stringify(manifest, null, 2) + '\n');
