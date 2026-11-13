import { test, expect } from '@playwright/test';

test('all downloadable models are valid GLB binaries rather than HTML fallbacks', async ({
  request,
}) => {
  for (const id of ['pi4', 'hc283', 'resistor', 'capacitor']) {
    const response = await request.get(`/models/${id}.glb`);
    expect(response.ok()).toBeTruthy();
    const bytes = await response.body();
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
