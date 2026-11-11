import fs from 'node:fs';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(90000);
  const errors = [],
    external = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:5173') && !r.url().startsWith('data:'))
      external.push(r.url());
  });
  const response = await page.goto('http://127.0.0.1:5173');
  await page.locator('.scene-tag').first().waitFor();
  await page.getByRole('button', { name: 'Executar', exact: true }).click();
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.screenshot({ path: 'docs/rc-preview.png' });
  const gpu = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas?.getContext('webgl2');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      width: canvas.width,
      height: canvas.height,
    };
  });
  const modes = {};
  for (const mode of ['high', 'low']) {
    if (mode === 'low')
      await page.getByRole('button', { name: 'Alternar qualidade gráfica' }).click();
    await page.getByRole('button', { name: 'Executar', exact: true }).click();
    const frames = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const times = [];
          let before = performance.now();
          const frame = (now) => {
            times.push(now - before);
            before = now;
            if (times.length < 100) requestAnimationFrame(frame);
            else resolve(times.slice(5));
          };
          requestAnimationFrame(frame);
        }),
    );
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    const sorted = [...frames].sort((a, b) => a - b);
    modes[mode] = {
      rafMeanMs: frames.reduce((s, v) => s + v, 0) / frames.length,
      rafP95Ms: sorted[Math.floor(sorted.length * 0.95)],
    };
  }
  await page.getByRole('button', { name: 'Arquitetura 02' }).click();
  await page.screenshot({ path: 'docs/adder-preview.png' });
  // Validate actual successful JSON import from the user's saved circuit.
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  const raw = await page.evaluate(() => localStorage.getItem('eletronic-lab.project.v1'));
  await page.getByRole('button', { name: 'Eletrônica 01' }).click();
  await page.getByLabel('Arquivo do projeto').setInputFiles({
    name: 'roundtrip.json',
    mimeType: 'application/json',
    buffer: Buffer.from(raw),
  });
  await page.getByRole('heading', { name: 'A lógica de uma soma.' }).waitFor();
  const result = {
    http: response.status(),
    gpu,
    modes,
    pageErrors: errors,
    externalRequests: external,
    roundtripImported: true,
    note: 'rAF measures browser scheduling, not rendered Three.js FPS. SwiftShader does not validate real integrated GPU performance.',
  };
  fs.writeFileSync('docs/browser-audit.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
