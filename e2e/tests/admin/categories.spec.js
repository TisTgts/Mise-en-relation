// @ts-check
const { test, expect } = require('@playwright/test');
const { uniqueSuffix } = require('../helpers/api');

test.describe('Gestion des catégories — administrateur', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page).toHaveURL(/\/admin\/categories/);
    await expect(page.getByRole('heading', { name: 'Catégories de services' })).toBeVisible({ timeout: 15000 });
  });

  test('créer puis supprimer une catégorie', async ({ page }) => {
    const nom = `E2E Cat ${uniqueSuffix()}`;

    await page.getByPlaceholder('Ex: Agriculture').fill(nom);
    await page.getByRole('button', { name: 'Ajouter' }).first().click();
    await expect(page.getByText('Catégorie ajoutée.')).toBeVisible({ timeout: 15000 });

    const ligne = page.getByRole('row').filter({ hasText: nom });
    await expect(ligne).toHaveCount(1);

    await ligne.getByRole('button', { name: 'Supprimer' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Supprimer' }).click();

    await expect(page.getByText('Catégorie supprimée.')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('row').filter({ hasText: nom })).toHaveCount(0);
  });

  test('créer une sous-catégorie sous une nouvelle catégorie puis tout nettoyer', async ({ page }) => {
    const catNom = `E2E ParentCat ${uniqueSuffix()}`;
    const subNom = `E2E SousCat ${uniqueSuffix()}`;

    // Catégorie parente.
    await page.getByPlaceholder('Ex: Agriculture').fill(catNom);
    await page.getByRole('button', { name: 'Ajouter' }).first().click();
    await expect(page.getByText('Catégorie ajoutée.')).toBeVisible({ timeout: 15000 });

    // Sous-catégorie : on scope tous les champs à la carte « Sous-catégories »
    // pour éviter toute ambiguïté avec le formulaire de catégorie.
    const subCard = page
      .getByRole('heading', { name: 'Sous-catégories' })
      .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
    await subCard.getByRole('combobox').selectOption({ label: catNom });
    await subCard.getByRole('textbox').first().fill(subNom);
    await subCard.getByRole('button', { name: 'Ajouter' }).click();
    await expect(page.getByText('Sous-catégorie ajoutée.')).toBeVisible({ timeout: 15000 });

    // Nettoyage : supprimer la sous-catégorie.
    const ligneSub = page.getByRole('row').filter({ hasText: subNom });
    await ligneSub.getByRole('button', { name: 'Supprimer' }).click();
    let dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Supprimer' }).click();
    await expect(page.getByText('Sous-catégorie supprimée.')).toBeVisible({ timeout: 15000 });

    // Nettoyage : supprimer la catégorie parente.
    const ligneCat = page.getByRole('row').filter({ hasText: catNom });
    await ligneCat.getByRole('button', { name: 'Supprimer' }).click();
    dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Supprimer' }).click();
    await expect(page.getByText('Catégorie supprimée.')).toBeVisible({ timeout: 15000 });
  });
});
