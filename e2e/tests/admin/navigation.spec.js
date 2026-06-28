// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Espace administrateur — navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('le tableau de bord et la navigation latérale s\'affichent', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Tableau de bord' })).toBeVisible();
    for (const item of ['Utilisateurs', 'Catégories', 'Prestations & Besoins', 'Collaborations', 'Transactions', 'Correspondances', 'Messages', 'Paramètres']) {
      await expect(page.getByRole('link', { name: item, exact: true })).toBeVisible();
    }
  });

  test('navigation vers "Utilisateurs"', async ({ page }) => {
    await page.getByRole('link', { name: 'Utilisateurs', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText(/@/).first()).toBeVisible({ timeout: 15000 });
  });

  test('navigation vers "Catégories"', async ({ page }) => {
    await page.getByRole('link', { name: 'Catégories', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/categories/);
  });

  test('navigation vers "Prestations & Besoins"', async ({ page }) => {
    await page.getByRole('link', { name: 'Prestations & Besoins', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/prestations/);
  });

  test('navigation vers "Transactions"', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/transactions/);
  });

  test('navigation vers "Correspondances"', async ({ page }) => {
    await page.getByRole('link', { name: 'Correspondances', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/correspondances/);
  });

  test('navigation vers "Messages"', async ({ page }) => {
    await page.getByRole('link', { name: 'Messages', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/messages/);
  });

  test('navigation vers "Paramètres"', async ({ page }) => {
    await page.getByRole('link', { name: 'Paramètres', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/settings/);
  });
});

test.describe('Espace administrateur — cloisonnement', () => {
  test("un admin ne peut pas accéder à l'espace client", async ({ page }) => {
    await page.goto('/client/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15000 });
  });
});
