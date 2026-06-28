// @ts-check
const { test, expect } = require('@playwright/test');
const { uniqueSuffix } = require('../helpers/api');

/**
 * Remplit et soumet le formulaire de création de besoin (catégorie « BTP & Travaux »).
 * Chaque catégorie impose des exigences spécifiques côté backend ; pour BTP il faut
 * « Surface estimée » et « Matériaux fournis par ».
 * @returns l'intitulé unique du besoin créé.
 */
async function ouvrirFormulaireAvecCategories(page) {
  // Les catégories sont chargées en asynchrone ; le serveur de dev peut être lent.
  // On recharge si la liste reste vide.
  for (let tentative = 0; tentative < 3; tentative += 1) {
    await page.goto('/client/creer-besoin');
    await expect(page).toHaveURL(/\/client\/creer-besoin/);
    try {
      await expect(page.locator('#categorie')).toContainText('BTP & Travaux', { timeout: 8000 });
      return;
    } catch (_e) {
      // nouvelle tentative
    }
  }
  throw new Error('Les catégories ne se sont pas chargées dans le formulaire de besoin.');
}

async function creerBesoin(page, prefix = 'E2E Besoin') {
  const intitule = `${prefix} ${uniqueSuffix()}`;
  await ouvrirFormulaireAvecCategories(page);

  await page.locator('#intitule').fill(intitule);
  await page.locator('#description').fill('Besoin créé automatiquement par les tests end-to-end.');
  await page.locator('#categorie').selectOption({ label: 'BTP & Travaux' });
  // Après le choix d'une catégorie configurée, le type devient une liste déroulante.
  await page.locator('#type_service').selectOption({ index: 1 });

  // Exigences obligatoires pour la catégorie BTP (champs sans id : ciblés via leur label).
  await page.locator('label:has-text("Surface estimée (m²)") + input').fill('120');
  await page.locator('label:has-text("Matériaux fournis par") + select').selectOption('Client');

  await page.locator('#lieu_intervention').fill('Ouagadougou');
  await page.locator('#date_souhaitee').fill('2030-06-01T09:00');
  await page.locator('#date_limite').fill('2030-07-01T09:00');
  await page.locator('#budget').fill('150000');

  await page.getByRole('button', { name: /Créer le besoin/i }).click();
  await expect(page).toHaveURL(/\/client\/mes-besoins/, { timeout: 15000 });
  return intitule;
}

test.describe('Gestion des besoins — client', () => {
  test('créer un besoin redirige vers la liste et l\'affiche', async ({ page }) => {
    const intitule = await creerBesoin(page);
    await expect(page.getByText(intitule).first()).toBeVisible({ timeout: 15000 });
  });

  test('un formulaire vide affiche les erreurs de validation', async ({ page }) => {
    await page.goto('/client/creer-besoin');
    await page.getByRole('button', { name: /Créer le besoin/i }).click();
    await expect(page).toHaveURL(/\/client\/creer-besoin/);
    await expect(page.getByText("L'intitulé est obligatoire")).toBeVisible();
    await expect(page.getByText('La description est obligatoire')).toBeVisible();
  });

  test('rechercher un besoin filtre la liste puis ouvre son détail', async ({ page }) => {
    const intitule = await creerBesoin(page, 'E2E Recherche');

    await page.getByPlaceholder('Rechercher un besoin…').fill(intitule);
    const ligne = page.getByRole('row').filter({ hasText: intitule });
    await expect(ligne).toHaveCount(1);

    await ligne.getByRole('link', { name: 'Voir les détails' }).click();
    await expect(page).toHaveURL(/\/client\/besoins\/\d+$/);
    await expect(page.getByRole('heading', { name: intitule })).toBeVisible();
  });

  test('ouvrir la modification d\'un besoin depuis la liste', async ({ page }) => {
    const intitule = await creerBesoin(page, 'E2E Edition');

    await page.getByPlaceholder('Rechercher un besoin…').fill(intitule);
    const ligne = page.getByRole('row').filter({ hasText: intitule });
    await ligne.getByRole('button', { name: 'Modifier' }).click();

    await expect(page).toHaveURL(/\/client\/besoins\/\d+\/edit/);
    await expect(page.locator('input[name="intitule"]')).toHaveValue(intitule);
  });

  test('supprimer un besoin depuis sa page de détail', async ({ page }) => {
    const intitule = await creerBesoin(page, 'E2E Suppression');

    await page.getByPlaceholder('Rechercher un besoin…').fill(intitule);
    const ligne = page.getByRole('row').filter({ hasText: intitule });
    await ligne.getByRole('link', { name: 'Voir les détails' }).click();
    await expect(page.getByRole('heading', { name: intitule })).toBeVisible();

    await page.getByRole('button', { name: /Supprimer/i }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Supprimer' }).click();

    await expect(page).toHaveURL(/\/client\/mes-besoins/, { timeout: 15000 });
    await page.getByPlaceholder('Rechercher un besoin…').fill(intitule);
    await expect(page.getByRole('row').filter({ hasText: intitule })).toHaveCount(0);
  });
});
