import { test, expect } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';
test('seleção de furos reais no canvas cria conexão elétrica', async ({ page }) => {
  await page.goto('/#workbench');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.scene-tag').first()).toBeVisible();
  await page.getByRole('button', { name: 'Conectar terminais', exact: true }).click();
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas ausente');
  const cam = new PerspectiveCamera(43, box.width / box.height, 0.1, 800);
  cam.position.set(95, 105, 120);
  cam.lookAt(-12, 0, 5);
  cam.updateMatrixWorld();
  const click = async (x: number, z: number) => {
    const v = new Vector3(x, 4.15, z).project(cam);
    await page.mouse.click(
      box.x + ((v.x + 1) / 2) * box.width,
      box.y + ((-v.y + 1) / 2) * box.height,
    );
  };
  await click(36.83, 12.7);
  await expect(page.getByLabel('Origem da conexão')).toHaveValue('bb:j30');
  await click(31.75, 12.7);
  await expect(page.locator('.wire-list')).toContainText('j30 → j28');
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('eletronic-lab.project.v1')!),
  );
  expect(
    stored.wires.some(
      (w: { from: string; to: string }) => w.from === 'bb:j30' && w.to === 'bb:j28',
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Mover', exact: true }).click();
  const sourcePoint = new Vector3(-64, 10, -12).project(cam);
  const sx = box.x + ((sourcePoint.x + 1) / 2) * box.width,
    sy = box.y + ((-sourcePoint.y + 1) / 2) * box.height;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 45, sy + 15, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  const moved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('eletronic-lab.project.v1')!).parts.find(
        (p: { id: string }) => p.id === 'ps',
      ).position,
  );
  expect(moved).not.toEqual([-64, 0, -12]);
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  const restored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('eletronic-lab.project.v1')!).parts.find(
        (p: { id: string }) => p.id === 'ps',
      ).position,
  );
  expect(restored).toEqual([-64, 0, -12]);
});
