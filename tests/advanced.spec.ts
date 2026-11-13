import { test, expect } from '@playwright/test';
test('LED, diagnóstico, esquema e acervo de projetos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await page.getByRole('button', { name: 'LED, resistor e botão', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('LED com botão e resistor de 330 Ω');
  await page.getByRole('button', { name: 'Esquema', exact: true }).click();
  await page.getByRole('button', { name: 'Selecionar SW1 no esquema', exact: true }).click();
  await page.getByRole('button', { name: 'Botão fechado', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Botão aberto', exact: true })).toBeVisible();
  await page.getByLabel('Nome do projeto').fill('LED salvo');
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  await page.getByRole('button', { name: 'Arquitetura 02', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await page.getByRole('button', { name: 'LED salvo', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('LED salvo');
  await page.getByRole('button', { name: 'Multímetro', exact: true }).click();
  await page.getByLabel('Modo do multímetro', { exact: true }).selectOption('resistance');
  await expect(page.locator('.meter-display')).toContainText('Desligue a fonte');
});
test('CPU executa assembly e sequência de clock', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await page.getByRole('button', { name: 'CPU e lógica', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Arquitetura de 8 bits', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Montar e reiniciar', exact: true }).click();
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: 'Passo de instrução', exact: true }).click();
  await expect(page.getByTestId('cpu-output')).toHaveText('8');
  await expect(page.locator('.cpu-status')).toContainText('HLT');
  await page.getByRole('button', { name: 'Flip-flop', exact: true }).click();
  await page.getByRole('button', { name: 'Alternar clock · CLK=0', exact: true }).click();
  await expect(page.locator('.digital-output')).toContainText('Q = 1');
});
test('desafio é resolvido por alteração real da montagem', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Alternar inspeção', exact: true }).click();
  await page.getByRole('button', { name: 'Desafios', exact: true }).click();
  await page.getByRole('button', { name: /Por que o LED não acende\?/ }).click();
  const challenge = page.getByRole('region', { name: 'Desafio ativo' });
  await challenge.getByRole('button', { name: 'Verificar montagem', exact: true }).click();
  await expect(challenge).toContainText('ainda não atingido');
  await page.getByRole('button', { name: 'Esquema', exact: true }).click();
  await page.getByRole('button', { name: 'Selecionar SW1 no esquema', exact: true }).click();
  await page.getByRole('button', { name: 'Botão aberto', exact: true }).click();
  await challenge.getByRole('button', { name: 'Verificar montagem', exact: true }).click();
  await expect(challenge).toContainText('Objetivo atingido');
});
