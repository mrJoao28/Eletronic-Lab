import { test, expect } from './fixtures';
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

test('project dialogs stay above scene labels, trap focus and close with Escape', async ({
  page,
}) => {
  await page.goto('/#workbench');
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Abrir projeto', exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir', exact: true })).toBeFocused();
});

test('short desktop keeps the scope and probes inside an explicitly collapsible instrument panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await page.goto('/#schematic');
  const scope = page.getByRole('img', { name: 'Osciloscópio: tensão medida ao longo do tempo' });
  await expect(scope).toBeVisible();
  const plot = await scope.boundingBox(),
    panel = await page.locator('.instruments').boundingBox(),
    probes = await page.locator('.probe-bar').boundingBox();
  expect(plot!.height).toBeGreaterThanOrEqual(90);
  expect(probes!.y + probes!.height).toBeLessThanOrEqual(panel!.y + panel!.height + 1);
  await page.getByRole('button', { name: 'Recolher instrumentos' }).click();
  await expect(scope).toBeHidden();
  await page.getByRole('button', { name: 'Expandir instrumentos' }).click();
  await expect(scope).toBeVisible();
  await page.screenshot({ path: 'test-results/short-desktop-instruments.png' });
});
