import { test, expect } from '@playwright/test';
test('large workbench remains editable while instruments and simulation run', async ({
  page,
}, testInfo) => {
  await page.goto('/#workbench');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Alternar qualidade gráfica' }).click();
  for (let i = 0; i < 24; i++)
    await page.getByRole('button', { name: 'Adicionar Resistor · MRS25' }).click();
  await page.getByRole('button', { name: 'Executar', exact: true }).click();
  const latencies: number[] = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await page.getByLabel('Nome do projeto').fill(`Carga ${i}`);
    await expect(page.getByLabel('Nome do projeto')).toHaveValue(`Carga ${i}`);
    latencies.push(Date.now() - start);
  }
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  latencies.sort((a, b) => a - b);
  await testInfo.attach('interaction-latency.json', {
    body: JSON.stringify({
      mode: 'low',
      extraResistors: 24,
      milliseconds: latencies,
      renderer: 'CI software renderer; not physical GPU validation',
    }),
    contentType: 'application/json',
  });
  expect(latencies[8]).toBeLessThan(5000);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
