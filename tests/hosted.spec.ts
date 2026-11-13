import { test, expect } from '@playwright/test';

test('all downloadable models are valid GLB binaries rather than HTML fallbacks', async ({
  request,
}) => {
  const responseCatalog = await request.get('/models/catalog.json');
  expect(responseCatalog.ok()).toBeTruthy();
  const catalog = await responseCatalog.json();
  expect(catalog.length).toBeGreaterThanOrEqual(24);
  for (const { id, bytes: size } of catalog) {
    const response = await request.get(`/models/${id}.glb`);
    expect(response.ok()).toBeTruthy();
    const bytes = await response.body();
    expect(bytes.length).toBe(size);
    expect(bytes.subarray(0, 4).toString()).toBe('glTF');
    expect(bytes.readUInt32LE(4)).toBe(2);
    expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  }
});

test('exported circuit can be imported and survives saving and reload', async ({ page }) => {
  await page.goto('/#schematic');
  await page.getByLabel('Nome do projeto').fill('Arquivo de produção');
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON v1' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByRole('button', { name: 'Fechar projetos' }).click();
  await page.getByRole('button', { name: 'Arquitetura 02', exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(path!);
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Arquivo de produção');
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await page.getByRole('button', { name: 'Reabrir salvo local' }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Arquivo de produção');
});

test('hosted health and release manifest identify the tested commit', async ({ request }) => {
  test.skip(
    !process.env.LAB_EXPECTED_COMMIT,
    'Requires a Vercel deployment with release monitoring',
  );
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toEqual({ status: 'ok', commit: process.env.LAB_EXPECTED_COMMIT });
  const release = await request.get('/release.json');
  expect((await release.json()).commit).toBe(process.env.LAB_EXPECTED_COMMIT);
});
