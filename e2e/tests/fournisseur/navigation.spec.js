// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Espace fournisseur — navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fournisseur/dashboard');
    await expect(page).toHaveURL(/\/fournisseur\/dashboard/);
  });

  test('le tableau de bord et la navigation latérale s\'affichent', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Tableau de bord' })).toBeVisible();
    for (const item of ['Mes prestations', 'Mes collaborations', 'Mes transactions', 'Messages', 'Profil', 'Paramètres']) {
      await expect(page.getByRole('link', { name: item, exact: true })).toBeVisible();
    }
  });

  test('navigation vers "Mes prestations"', async ({ page }) => {
    await page.getByRole('link', { name: 'Mes prestations', exact: true }).click();
    await expect(page).toHaveURL(/\/fournisseur\/mes-prestations/);
  });

  test('navigation vers "Mes collaborations"', async ({ page }) => {
    await page.getByRole('link', { name: 'Mes collaborations', exact: true }).click();
    await expect(page).toHaveURL(/\/fournisseur\/mes-collaborations/);
  });

  test('navigation vers "Mes transactions"', async ({ page }) => {
    await page.getByRole('link', { name: 'Mes transactions', exact: true }).click();
    await expect(page).toHaveURL(/\/fournisseur\/transactions/);
  });

  test('navigation vers "Messages"', async ({ page }) => {
    await page.getByRole('link', { name: 'Messages', exact: true }).click();
    await expect(page).toHaveURL(/\/fournisseur\/messages/);
  });

  test('navigation vers "Profil"', async ({ page }) => {
    await page.getByRole('link', { name: 'Profil', exact: true }).click();
    await expect(page).toHaveURL(/\/fournisseur\/profil/);
  });
});

test.describe('Espace fournisseur — cloisonnement', () => {
  test("un fournisseur ne peut pas accéder à l'espace admin", async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/fournisseur\/dashboard/, { timeout: 15000 });
  });

  test("un fournisseur ne peut pas accéder à l'espace client", async ({ page }) => {
    await page.goto('/client/dashboard');
    await expect(page).toHaveURL(/\/fournisseur\/dashboard/, { timeout: 15000 });
  });
});
