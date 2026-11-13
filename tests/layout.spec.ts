import { test, expect } from '@playwright/test';
test('default canvas dominates the workspace and focus restores panels', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  const canvas = await page.getByTestId('bench').boundingBox();
  expect(canvas!.width).toBeGreaterThan(1200);
  expect(canvas!.height).toBeGreaterThan(500);
  await expect(page.locator('.properties')).toBeHidden();
  await page.getByRole('button', { name: 'Ampliar bancada', exact: true }).click();
  await expect(page.locator('.library')).toBeHidden();
  const focused = await page.getByTestId('bench').boundingBox();
  expect(focused!.width).toBeGreaterThan(canvas!.width);
  expect(focused!.height).toBeGreaterThan(canvas!.height);
  await page.getByRole('button', { name: 'Restaurar painéis', exact: true }).click();
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await expect(page.getByLabel('Valor do componente')).toBeVisible();
});
