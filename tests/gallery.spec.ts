import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('atlas preserva montagem, seleciona partes e baixa GLB válido', async ({ page }) => {
  await page.goto('/#workbench');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await page.getByLabel('Valor do componente').fill('20');
  await page.getByRole('button', { name: 'Modelos 3D', exact: true }).click();
  const gallery = page.getByRole('region', { name: 'Catálogo de modelos 3D' });
  await expect(gallery).toBeVisible();
  await expect(
    gallery.getByRole('heading', { name: 'Raspberry Pi 4 Model B', exact: true }),
  ).toBeVisible();
  await gallery
    .getByRole('button', { name: 'Inspecionar Processador BCM2711', exact: true })
    .click();
  await expect(
    gallery.getByRole('heading', { name: 'Processador BCM2711', exact: true }),
  ).toBeVisible();
  await gallery.getByRole('button', { name: 'Inferior', exact: true }).click();
  await expect(gallery.getByRole('button', { name: 'Inferior', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await gallery.getByRole('button', { name: /CD74HC283 · PDIP-16/ }).click();
  await expect(
    gallery.getByRole('heading', { name: 'CD74HC283 · PDIP-16', exact: true }),
  ).toBeVisible();
  const waiting = page.waitForEvent('download');
  await gallery.getByRole('link', { name: 'GLB', exact: true }).click();
  const download = await waiting;
  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 4).toString()).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  await gallery.getByRole('button', { name: 'Voltar à bancada', exact: true }).click();
  await expect(page.getByLabel('Valor do componente')).toHaveValue('20');
});

test('expanded electronics catalog filters models and inserts a simulated component', async ({
  page,
}) => {
  await page.goto('/#schematic');
  await page.getByRole('button', { name: 'Modelos 3D', exact: true }).click();
  const gallery = page.getByRole('region', { name: 'Catálogo de modelos 3D' });
  await gallery.getByLabel('Filtrar modelos 3D').selectOption('electronics');
  await gallery.getByLabel('Buscar modelo 3D').fill('ESP32');
  await expect(gallery.locator('.model-card')).toHaveCount(1);
  await gallery.locator('.model-card').click();
  await expect(
    gallery.getByRole('heading', { name: 'ESP32 DevKit · estudo visual', exact: true }),
  ).toBeVisible();
  await expect(gallery.getByRole('button', { name: 'Adicionar à bancada' })).toHaveCount(0);
  await gallery.getByLabel('Buscar modelo 3D').fill('inexistente-xyz');
  await expect(
    gallery.getByText('Nenhum modelo encontrado. Tente outro termo ou categoria.'),
  ).toBeVisible();
  await gallery.getByLabel('Buscar modelo 3D').fill('LED vermelho');
  await gallery.locator('.model-card').click();
  await gallery.getByRole('button', { name: 'Adicionar à bancada', exact: true }).click();
  await expect(gallery).toHaveCount(0);
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Alterações não salvas');
  await expect(page.getByRole('button', { name: 'Desfazer', exact: true })).toBeEnabled();
});

test('computer models load at different scales and remain downloadable without simulated insertion', async ({
  page,
}) => {
  await page.goto('/#schematic');
  await page.getByRole('button', { name: 'Modelos 3D', exact: true }).click();
  const gallery = page.getByRole('region', { name: 'Catálogo de modelos 3D' });
  await gallery.getByLabel('Filtrar modelos 3D').selectOption('computers');
  await expect(gallery.locator('.model-card')).toHaveCount(17);
  for (const term of ['microATX', 'SO-DIMM', 'M.2 2280', 'duas ventoinhas', 'HDD']) {
    await gallery.getByLabel('Buscar modelo 3D').fill(term);
    await expect(gallery.locator('.model-card')).toHaveCount(1);
    await gallery.locator('.model-card').click();
    await expect(gallery.getByRole('heading', { level: 1 })).toContainText(term);
    await expect(gallery.getByRole('button', { name: 'Adicionar à bancada' })).toHaveCount(0);
    await expect(gallery.getByRole('link', { name: 'GLB', exact: true })).toHaveAttribute(
      'href',
      /\/models\/.+\.glb$/,
    );
    await expect(gallery.locator('canvas')).toBeVisible();
    await expect(
      gallery.getByRole('heading', { name: 'Não foi possível exibir o 3D' }),
    ).toHaveCount(0);
  }
  await page.screenshot({ path: 'test-results/computer-hdd-atlas.png', fullPage: true });
  await gallery.getByLabel('Buscar modelo 3D').fill('microATX');
  await gallery.locator('.model-card').click();
  await page.screenshot({ path: 'test-results/computer-motherboard-atlas.png', fullPage: true });
});
