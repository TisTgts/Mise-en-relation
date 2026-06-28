// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Espace client — navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client/dashboard');
    await expect(page).toHaveURL(/\/client\/dashboard/);
  });

  test('le tableau de bord et la navigation latérale s\'affichent', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Tableau de bord' })).toBeVisible();
    for (const item of ['Mes besoins', 'Mes matchings', 'Mes collaborations', 'Transactions', 'Messages', 'Profil', 'Paramètres']) {
      await expect(page.getByRole('link', { name: item, exact: true })).toBeVisible();
    }
  });

  test('navigation vers "Mes besoins"', async ({ page }) => {
    await page.getByRole('link', { name: 'Mes besoins', exact: true }).click();
    await expect(page).toHaveURL(/\/client\/mes-besoins/);
  });

  test('navigation vers "Mes matchings"', async ({ page }) => {
    await page.getByRole('link', { name: 'Mes matchings', exact: true }).click();
    await expect(page).toHaveURL(/\/client\/matchings/);
  });

  test('navigation vers "Mes collaborations"', async ({ page }) => {
    await page.getByRole('link', { name: 'Mes collaborations', exact: true }).click();
    await expect(page).toHaveURL(/\/client\/mes-collaborations/);
  });

  test('navigation vers "Transactions"', async ({ page }) => {
    await page.getByRole('link', { name: 'Transactions', exact: true }).click();
    await expect(page).toHaveURL(/\/client\/transactions/);
  });

  test('navigation vers "Messages"', async ({ page }) => {
    await page.getByRole('link', { name: 'Messages', exact: true }).click();
    await expect(page).toHaveURL(/\/client\/messages/);
  });

  test('navigation vers "Profil"', async ({ page }) => {
    await page.getByRole('link', { name: 'Profil', exact: true }).click();
    await expect(page).toHaveURL(/\/client\/profil/);
  });

  test('le repli du menu latéral est mémorisé', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /replier le menu/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('sidebarCollapsed')))
      .toBe('true');

    await page.reload();
    await expect(page.getByRole('button', { name: /déplier le menu/i })).toBeVisible();
  });
});

// Tests à navigation unique (pas de page précédente) → plus déterministes.
test.describe('Espace client — cloisonnement', () => {
  test("un client ne peut pas accéder à l'espace admin", async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/client\/dashboard/, { timeout: 15000 });
  });

  test("un client ne peut pas accéder à l'espace fournisseur", async ({ page }) => {
    await page.goto('/fournisseur/dashboard');
    await expect(page).toHaveURL(/\/client\/dashboard/, { timeout: 15000 });
  });
});
