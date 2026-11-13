import { test as base, expect } from '@playwright/test';
// Editor scenarios opt into the visitor workspace through the same visible UI as a user.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/#login');
    await page.getByRole('button', { name: 'Continuar como visitante', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Meus projetos', exact: true })).toBeVisible();
    await use(page);
  },
});
export { expect };
