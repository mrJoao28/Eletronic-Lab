import { test, expect } from '@playwright/test';
test('RC, instrumentos, edição, histórico, fios e recuperação', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Carga e descarga de um capacitor');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Executar', exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(page.locator('.scope-measure')).not.toContainText('0.000');
  await page.getByLabel('Valor do componente').fill('20');
  await expect(page.locator('.sim-status')).toContainText('2.00');
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.getByLabel('Valor do componente')).toHaveValue('10');
  await page.getByRole('button', { name: 'Refazer', exact: true }).click();
  await expect(page.getByLabel('Valor do componente')).toHaveValue('20');
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await page.getByRole('button', { name: 'Reabrir salvo local' }).click();
  await expect(page.locator('.sim-status')).toContainText('2.00');
  await page.getByLabel('Origem da conexão').selectOption('ps:+');
  await page.getByLabel('Destino da conexão').selectOption('bb:j30');
  await expect(page.locator('.wire-list')).toContainText('j30');
  await page.locator('.wire-list button').last().click();
  await page.getByRole('button', { name: 'Remover conexão', exact: true }).click();
  await expect(page.locator('.wire-list')).not.toContainText('j30');
  await page.getByRole('button', { name: 'Superior', exact: true }).click();
  await page.getByRole('button', { name: 'Alternar qualidade gráfica' }).click();
  await page.screenshot({ path: 'test-results/rc-desktop.png' });
  expect(errors).toEqual([]);
});
test('somador, carry, importação, exportação e guia', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await page.getByRole('button', { name: 'Arquitetura 02' }).click();
  await expect(page.getByTestId('sum')).toContainText('1000');
  await page.getByRole('button', { name: 'A1', exact: true }).click();
  await expect(page.getByTestId('sum')).toContainText('1010');
  await page.getByRole('button', { name: 'Carry in', exact: true }).click();
  await expect(page.getByTestId('sum')).toContainText('1011');
  await page.getByRole('button', { name: 'Guia do experimento' }).click();
  await expect(page.getByRole('dialog')).toContainText('desacoplamento');
  await page.getByRole('button', { name: 'Fechar guia' }).click();
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON v1' }).click();
  expect((await dl).suggestedFilename()).toBe('eletronic-lab-v1.json');
  await page.getByRole('button', { name: 'Fechar projetos' }).click();
  await page.screenshot({ path: 'test-results/adder-desktop.png' });
});
test('adicionar, mover, girar, excluir, pontas, arquivo inválido e tela estreita', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar Resistor · MRS25' }).click();
  await expect(page.locator('.selected-component')).toContainText('R2');
  await page.getByLabel('Posição X').fill('30');
  await page.getByLabel('Orientação', { exact: true }).selectOption('90');
  await page.getByLabel('Ponta positiva').selectOption('ps:+');
  await expect(page.locator('.scope-measure')).toContainText('5.000');
  await page.getByLabel('Ponta positiva').selectOption('bb:j30');
  await expect(page.locator('.scope-measure')).toContainText('—');
  await page.getByRole('button', { name: 'Remover componente', exact: true }).click();
  await expect(page.locator('.selected-component')).toHaveCount(0);
  await page.getByLabel('Arquivo do projeto').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":9}'),
  });
  await expect(page.getByRole('status')).toContainText('versão');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Executar', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
