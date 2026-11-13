import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('atlas preserva montagem, seleciona partes e baixa GLB válido', async ({ page }) => {
  await page.goto('/');
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
