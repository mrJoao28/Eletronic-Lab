import { test, expect } from '@playwright/test';
test('login, signup validation, recovery and guest navigation', async ({ page }) => {
  await page.goto('/#login');
  await expect(page.getByRole('heading', { name: 'Entrar no laboratório' })).toBeVisible();
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.getByLabel('E-mail', { exact: true }).fill('qa@example.invalid');
  await page.getByLabel('Senha', { exact: true }).fill('A-valid-password-123');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('A-different-password');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  // With no config, unavailable is shown; with config, mismatching passwords never reach Auth.
  await expect(page.getByRole('alert')).toContainText(/senhas|temporariamente indisponível/);
  await page.getByRole('button', { name: 'Já tenho conta · Entrar' }).click();
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar acesso' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à bancada' }).click();
  await expect(page.getByLabel('Nome do projeto')).toBeVisible();
});
test('dashboard without a session requires login and reset needs a valid session', async ({
  page,
}) => {
  await page.goto('/#dashboard');
  await expect(page.getByRole('heading', { name: 'Entrar no laboratório' })).toBeVisible();
  await page.goto('/#reset-password');
  await expect(page.getByRole('heading', { name: 'Recuperar acesso' })).toBeVisible();
});
