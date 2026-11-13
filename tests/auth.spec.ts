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
  await page.getByRole('button', { name: 'Continuar como visitante' }).click();
  await expect(page.getByRole('heading', { name: 'Meus projetos', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Circuito analógico', exact: true }).click();
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

test('homepage starts at auth and guest projects reopen the saved document', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Entrar no laboratório' })).toBeVisible();
  await expect(page.getByLabel('Nome do projeto')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continuar como visitante' }).click();
  await expect(page.getByRole('heading', { name: 'Meus projetos', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Circuito analógico', exact: true }).click();
  await page.getByLabel('Nome do projeto').fill('Meu projeto local');
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  await page.getByRole('button', { name: 'Meus projetos', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Abrir projeto Meu projeto local', exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Abrir projeto Meu projeto local', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Meu projeto local');
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Salvo');
});

test('editor deep links require an account or explicit visitor entry', async ({ page }) => {
  await page.goto('/#schematic');
  await expect(page.getByRole('heading', { name: 'Entrar no laboratório' })).toBeVisible();
  await expect(page.getByLabel('Nome do projeto')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continuar como visitante' }).click();
  await expect(page.getByRole('heading', { name: 'Meus projetos', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Circuito analógico', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nome do projeto')).toBeVisible();
});
