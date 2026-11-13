import { test, expect } from '@playwright/test';

test('context loss preserves edits and offers a working schematic', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await page.getByLabel('Nome do projeto').fill('Montagem preservada');
  await expect(page.locator('canvas')).toBeVisible();
  await page.locator('canvas').evaluate((canvas) => {
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  });
  await expect(page.getByRole('alert')).toContainText('Não foi possível exibir o 3D');
  await page.getByRole('button', { name: 'Continuar pelo esquema', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Montagem preservada');
  await expect(
    page.getByRole('button', { name: 'Selecionar R1 no esquema', exact: true }),
  ).toBeVisible();
});

test('failed GLB can be retried after network recovery', async ({ page }) => {
  await page.route('**/models/*.glb', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível exibir o 3D');
  await page.unroute('**/models/*.glb');
  await page.getByRole('button', { name: 'Tentar carregar o 3D novamente' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();
  await expect.poll(() => page.locator('.scene-loading').count()).toBe(0);
});
