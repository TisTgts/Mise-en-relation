// @ts-check
const { test, expect } = require('@playwright/test');
const { uniqueSuffix } = require('../helpers/api');

/**
 * Crée une prestation cohérente avec le profil du fournisseur de démonstration
 * (domaine « Informatique & Digital »), sinon la validation backend la refuse.
 * @returns l'intitulé unique de la prestation créée.
 */
async function ouvrirFormulaireAvecCategories(page) {
  for (let tentative = 0; tentative < 3; tentative += 1) {
    await page.goto('/fournisseur/creer-prestation');
    await expect(page).toHaveURL(/\/fournisseur\/creer-prestation/);
    try {
      await expect(page.locator('#categorie')).toContainText('Informatique & Digital', { timeout: 8000 });
      return;
    } catch (_e) {
      // nouvelle tentative (serveur de dev lent)
    }
  }
  throw new Error('Les catégories ne se sont pas chargées dans le formulaire de prestation.');
}

async function creerPrestation(page, prefix = 'E2E Prestation') {
  const intitule = `${prefix} ${uniqueSuffix()}`;
  await ouvrirFormulaireAvecCategories(page);

  // La catégorie d'abord : la changer réinitialise le type de service.
  await page.locator('#categorie').selectOption({ label: 'Informatique & Digital' });
  await page.locator('#type_prestation').selectOption({ label: 'Autre (préciser)' });
  await page.locator('#type_prestation_autre').fill('Développement web');
  await page.locator('#intitule').fill(intitule);
  await page.locator('#description').fill('Prestation créée automatiquement par les tests end-to-end.');

  // Zone d'intervention (au moins une est obligatoire).
  await page.getByRole('button', { name: 'Lomé', exact: true }).click();

  await page.locator('#disponibilite_debut').fill('2030-06-01');
  await page.locator('#disponibilite_fin').fill('2030-12-31');
  await page.locator('#mode_tarification').selectOption('forfait');
  await page.locator('#tarif_min').fill('120000');

  await page.getByRole('button', { name: /Publier la prestation/i }).click();
  await expect(page).toHaveURL(/\/fournisseur\/dashboard/, { timeout: 15000 });
  return intitule;
}

test.describe('Gestion des prestations — fournisseur', () => {
  test('créer une prestation puis la retrouver dans la liste', async ({ page }) => {
    const intitule = await creerPrestation(page);

    await page.goto('/fournisseur/mes-prestations');
    await page.getByPlaceholder('Rechercher une prestation...').fill(intitule);
    await expect(page.getByText(intitule).first()).toBeVisible({ timeout: 15000 });
  });

  test('un formulaire vide affiche les erreurs de validation', async ({ page }) => {
    await page.goto('/fournisseur/creer-prestation');
    await page.getByRole('button', { name: /Publier la prestation/i }).click();
    await expect(page).toHaveURL(/\/fournisseur\/creer-prestation/);
    await expect(page.getByText('Donnez un titre à votre prestation.')).toBeVisible();
    await expect(page.getByText('Choisissez au moins une ville où vous intervenez.')).toBeVisible();
  });

  test('rechercher une prestation puis ouvrir son détail', async ({ page }) => {
    const intitule = await creerPrestation(page, 'E2E Detail');

    await page.goto('/fournisseur/mes-prestations');
    await page.getByPlaceholder('Rechercher une prestation...').fill(intitule);
    const ligne = page.getByRole('row').filter({ hasText: intitule });
    await expect(ligne).toHaveCount(1);

    await ligne.getByRole('link', { name: 'Voir les détails' }).click();
    await expect(page).toHaveURL(/\/fournisseur\/prestation\/\d+/);
    await expect(page.getByText(intitule).first()).toBeVisible();
  });

  test('supprimer une prestation depuis la liste', async ({ page }) => {
    const intitule = await creerPrestation(page, 'E2E Suppression');

    await page.goto('/fournisseur/mes-prestations');
    await page.getByPlaceholder('Rechercher une prestation...').fill(intitule);
    const ligne = page.getByRole('row').filter({ hasText: intitule });
    await ligne.getByRole('button', { name: 'Supprimer' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Supprimer' }).click();

    await expect(page.getByText('Prestation supprimée avec succès')).toBeVisible({ timeout: 15000 });
    await page.getByPlaceholder('Rechercher une prestation...').fill(intitule);
    await expect(page.getByRole('row').filter({ hasText: intitule })).toHaveCount(0);
  });
});
