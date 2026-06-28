// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Pages publiques', () => {
  test("la page d'accueil se charge avec un titre et un lien de connexion", async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /connexion|se connecter/i }).first()).toBeVisible();
  });

  test('la page de connexion affiche le formulaire', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test("la page d'inscription se charge", async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText(/créer un compte/i).first()).toBeVisible();
  });

  test('le lien "créer un compte" mène vers /register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /créer un compte/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
