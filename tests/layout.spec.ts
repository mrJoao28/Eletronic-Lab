import { test, expect } from '@playwright/test';
test('default canvas dominates the workspace and focus restores panels', async ({ page }) => {
  await page.goto('/#workbench');
  await expect(page.locator('canvas')).toBeVisible();
  const canvas = await page.getByTestId('bench').boundingBox();
  expect(canvas!.width).toBeGreaterThan(1200);
  expect(canvas!.height).toBeGreaterThan(500);
  await expect(page.locator('.properties')).toBeHidden();
  await page.screenshot({ path: 'test-results/midnight-scene-first.png' });
  await page.getByRole('button', { name: 'Ampliar bancada', exact: true }).click();
  await expect(page.locator('.library')).toBeHidden();
  const focused = await page.getByTestId('bench').boundingBox();
  expect(focused!.width).toBeGreaterThan(canvas!.width);
  expect(focused!.height).toBeGreaterThan(canvas!.height);
  await page.getByRole('button', { name: 'Restaurar painéis', exact: true }).click();
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await expect(page.getByLabel('Valor do componente')).toBeVisible();
});

test('scene has no promotional headline over the circuit', async ({ page }) => {
  await page.goto('/#workbench');
  await expect(page.getByText('O tempo de um circuito.', { exact: true })).toHaveCount(0);
  await expect(page.locator('.scene-caption')).toHaveCount(0);
  await expect(page.getByLabel('Nome do projeto')).toBeVisible();
});
