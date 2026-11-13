import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('account projects persist, archive, rename and stay isolated after logout', async ({
  page,
}) => {
  // Browser contract test: API responses are isolated fixtures, never real accounts.
  const users = [
    { id: '11111111-1111-4111-8111-111111111111', email: 'alpha@example.invalid' },
    { id: '22222222-2222-4222-8222-222222222222', email: 'beta@example.invalid' },
  ];
  const rows: Record<string, unknown>[] = [];
  let rejectSave = false;
  const userFor = (authorization: string) =>
    users.find((u) => {
      try {
        return (
          JSON.parse(Buffer.from(authorization.split('.')[1], 'base64url').toString()).sub === u.id
        );
      } catch {
        return false;
      }
    });
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 });
    const user = url.pathname.endsWith('/token')
      ? users.find((u) => u.email === request.postDataJSON().email)
      : userFor(request.headers().authorization ?? '');
    if (!user)
      return route.fulfill({
        status: 400,
        json: { code: 'invalid_credentials', message: 'Invalid credentials' },
      });
    const token = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(
        JSON.stringify({
          sub: user.id,
          email: user.email,
          role: 'authenticated',
          aud: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url'),
      'test-signature',
    ].join('.');
    const body = url.pathname.endsWith('/token')
      ? {
          access_token: token,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: `test-refresh-${user.id}`,
          user: {
            ...user,
            aud: 'authenticated',
            role: 'authenticated',
            app_metadata: { provider: 'email' },
            user_metadata: {},
            created_at: '2026-11-13T00:00:00Z',
          },
        }
      : user;
    await route.fulfill({ json: body });
  });
  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    const user = userFor(req.headers().authorization ?? '');
    if (!user) return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    if (url.pathname.endsWith('/lab_progress')) return route.fulfill({ json: [] });
    const id = url.searchParams.get('id')?.replace('eq.', '');
    let matching = rows.filter((row) => row.owner_id === user.id && (!id || row.id === id));
    if (req.method() === 'POST') {
      if (rejectSave)
        return route.fulfill({ status: 500, json: { message: 'Temporary write failure' } });
      const input = req.postDataJSON();
      if (input.owner_id !== user.id)
        return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
      const row = {
        ...input,
        id: randomUUID(),
        archived: false,
        updated_at: new Date().toISOString(),
      };
      rows.push(row);
      matching = [row];
    }
    if (req.method() === 'PATCH')
      matching.forEach((row) =>
        Object.assign(row, req.postDataJSON(), { updated_at: new Date().toISOString() }),
      );
    const single = req.headers().accept?.includes('vnd.pgrst.object');
    if (single && matching.length !== 1)
      return route.fulfill({ status: 406, json: { message: 'Not found' } });
    await route.fulfill({ json: single ? matching[0] : matching });
  });
  const login = async (email: string) => {
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('Fixture-password-123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Seu laboratório' })).toBeVisible();
  };
  await page.goto('/#login');
  await login(users[0].email);
  await page
    .locator('.dashboard-header')
    .getByRole('button', { name: 'Novo projeto', exact: true })
    .click();
  await page.getByLabel('Nome do projeto').fill('Montagem Alpha');
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Alterações não salvas');
  await page.getByRole('button', { name: 'Executar', exact: true }).click();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu laboratório' })).toBeVisible();
  await page
    .locator('.dashboard-header')
    .getByRole('button', { name: 'Novo projeto', exact: true })
    .click();
  const unsaved = page.getByRole('dialog', { name: 'Alterações não salvas', exact: true });
  await expect(unsaved).toBeVisible();
  await unsaved.getByRole('button', { name: 'Manter montagem', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar montagem', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Montagem Alpha');
  await expect(page.getByRole('button', { name: 'Executar', exact: true })).toBeVisible();
  rejectSave = true;
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  await expect(
    page.getByText('Não foi possível salvar na sua conta. Sua montagem continua aberta.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Alterações não salvas');
  expect(rows).toHaveLength(0);
  rejectSave = false;
  await page.getByRole('button', { name: 'Salvar projeto', exact: true }).click();
  await expect(page.getByText('Projeto salvo na sua conta.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Salvo');
  // The card for a newly saved draft must resume its current edits, not replace them from REST.
  await page.getByLabel('Nome do projeto').fill('Alpha em edição');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Montagem Alpha', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Alpha em edição');
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Alterações não salvas');
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.getByLabel('Nome do projeto')).toHaveValue('Montagem Alpha');
  await expect(page.getByLabel('Estado de salvamento')).toHaveText('Salvo');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Meus projetos' })).toContainText('Montagem Alpha');
  await page.getByRole('button', { name: 'Renomear', exact: true }).click();
  await page.getByLabel('Novo nome do projeto').fill('Alpha renomeado');
  await page.getByRole('button', { name: 'Salvar nome', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Alpha renomeado', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-account-fixture.png', fullPage: true });
  await page.getByRole('button', { name: 'Arquivar', exact: true }).click();
  await page.getByLabel('Filtrar projetos').selectOption('archived');
  await expect(page.getByRole('button', { name: 'Alpha renomeado', exact: true })).toBeVisible();
  const alphaId = String(rows[0].id);
  await page.getByRole('button', { name: 'Continuar montagem', exact: true }).click();
  await page.getByLabel('Nome do projeto').fill('Rascunho privado Alpha');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(unsaved).toContainText('sair da conta');
  await page.keyboard.press('Escape');
  await expect(unsaved).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Seu laboratório' })).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await unsaved.getByRole('button', { name: 'Descartar e continuar', exact: true }).click();
  await login(users[1].email);
  await expect(page.getByRole('button', { name: 'Continuar montagem', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText('Rascunho privado Alpha', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Meus projetos' })).not.toContainText(
    'Alpha renomeado',
  );
  await page.goto(`/#project/${alphaId}`);
  await expect(page.getByRole('alert')).toContainText('Projeto não encontrado');
  await expect(page.getByLabel('Nome do projeto')).toHaveCount(0);
});
