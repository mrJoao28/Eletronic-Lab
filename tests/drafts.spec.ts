import { test, expect } from '@playwright/test';

test('guest edits and undo survive a visit to login without resuming simulation', async ({
  page,
}) => {
  await page.goto('/#workbench');
  await page.getByLabel('Nome do projeto').fill('Montagem visitante em andamento');
  await page.getByRole('button', { name: 'Executar', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entrar no laboratório' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à bancada', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Montagem visitante em andamento');
  await expect(page.getByRole('button', { name: 'Executar', exact: true })).toBeVisible();
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Alterações não salvas');
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Carga e descarga de um capacitor');
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Sem alterações');
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Salvo');
});
