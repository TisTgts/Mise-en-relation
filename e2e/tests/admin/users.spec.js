// @ts-check
const { test, expect } = require('@playwright/test');
const { USERS } = require('../helpers/users');

const CLIENT_EMAIL = USERS.client.email;

test.describe('Gestion des utilisateurs — administrateur', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText(/@/).first()).toBeVisible({ timeout: 15000 });
  });

  test('la recherche filtre la liste sur un email', async ({ page }) => {
    await page.getByPlaceholder(/Nom, email, username/i).fill(CLIENT_EMAIL);
    const ligne = page.getByRole('row').filter({ hasText: CLIENT_EMAIL });
    await expect(ligne).toHaveCount(1);
  });

  test("le panneau de détails d'un utilisateur s'ouvre et se ferme", async ({ page }) => {
    await page.getByPlaceholder(/Nom, email, username/i).fill(CLIENT_EMAIL);
    const ligne = page.getByRole('row').filter({ hasText: CLIENT_EMAIL });
    await ligne.getByRole('button', { name: "Détails de l'utilisateur" }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Détail utilisateur')).toBeVisible();

    await dialog.getByRole('button', { name: 'Fermer' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('le filtre "Clients Premium" est applicable', async ({ page }) => {
    await page.getByRole('button', { name: 'Clients Premium' }).click();
    await expect(page.getByText(/utilisateur/).first()).toBeVisible();
  });

  test('activer puis retirer le Premium d\'un client (aller-retour)', async ({ page }) => {
    await page.getByPlaceholder(/Nom, email, username/i).fill(CLIENT_EMAIL);
    const ligne = page.getByRole('row').filter({ hasText: CLIENT_EMAIL });

    // 1er basculement (Premium ↔ Standard selon l'état initial).
    await ligne.getByRole('button', { name: /Premium/ }).click();
    let dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Confirmer/ }).click();
    await expect(page.getByText(/Premium activé|Standard/i).first()).toBeVisible({ timeout: 15000 });

    // 2e basculement : rétablit l'état d'origine (test idempotent).
    await ligne.getByRole('button', { name: /Premium/ }).click();
    dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Confirmer/ }).click();
    await expect(page.getByText(/Premium activé|Standard/i).first()).toBeVisible({ timeout: 15000 });
  });
});
