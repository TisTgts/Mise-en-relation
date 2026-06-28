// @ts-check
const { test, expect } = require('@playwright/test');
const { USERS } = require('../helpers/users');
const { loginViaUI } = require('../helpers/auth');

// L'endpoint /login est limité à 5/min par IP : on garde peu de vraies
// connexions ici (le setup couvre déjà le routage des 3 rôles) et on les
// exécute en série.
test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

test.describe('Flux de connexion', () => {
  test('connexion réussie → tableau de bord + session persistante', async ({ page }) => {
    await loginViaUI(page, USERS.client);
    await expect(page).toHaveURL(/\/client\/dashboard/);

    await page.reload();
    await expect(page).toHaveURL(/\/client\/dashboard/);
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).not.toBeNull();
  });

  test("identifiants invalides → message d'erreur, pas de redirection", async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('inconnu@demo.local');
    await page.locator('#password').fill('mauvais-mot-de-passe');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page.getByText(/incorrect|invalide|erreur|throttl|tentative/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
