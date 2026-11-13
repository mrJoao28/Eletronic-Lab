import { test, expect } from '@playwright/test';
test('keyboard tools, views and panels ignore text editing and modal dialogs', async ({ page }) => {
  await page.goto('/#schematic');
  await page.getByLabel('Nome do projeto').fill('Atalhos');
  await page.getByLabel('Nome do projeto').press('m');
  await expect(page.getByRole('button', { name: 'Mover', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('m');
  await expect(page.getByRole('button', { name: 'Mover', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('p');
  await expect(page.locator('.properties')).toBeVisible();
  await page.keyboard.press('i');
  await expect(page.locator('.instrument-body')).toBeHidden();
  await page.keyboard.press('i');
  await expect(page.locator('.instrument-body')).toBeVisible();
  await page.keyboard.press('?');
  const help = page.getByRole('dialog', { name: 'Atalhos de teclado', exact: true });
  await expect(help).toBeVisible();
  await page.keyboard.press('v');
  await expect(page.getByRole('button', { name: 'Mover', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(help).toHaveCount(0);
  await page.keyboard.press('3');
  await expect(page.getByRole('region', { name: 'Esquema elétrico sincronizado' })).toBeVisible();
});

test('atlas arrow keys switch filtered models and digits change views', async ({ page }) => {
  await page.goto('/#schematic');
  await page.getByRole('button', { name: 'Modelos 3D', exact: true }).click();
  const gallery = page.getByRole('region', { name: 'Catálogo de modelos 3D' });
  await gallery.getByLabel('Buscar modelo 3D').fill('Memória DDR4');
  await gallery.getByRole('button', { name: /Memória DDR4 · DIMM/ }).click();
  await page.keyboard.press('ArrowRight');
  await expect(gallery.getByRole('heading', { level: 1 })).toHaveText('Memória DDR4 · SO-DIMM');
  await page.keyboard.press('2');
  await expect(gallery.getByRole('button', { name: 'Superior', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
});
