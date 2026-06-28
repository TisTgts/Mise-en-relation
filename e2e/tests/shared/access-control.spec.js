// @ts-check
const { test, expect } = require('@playwright/test');

test.describe("Contrôle d'accès — utilisateur non authentifié", () => {
  const routesProtegees = [
    '/client/dashboard',
    '/fournisseur/dashboard',
    '/admin/dashboard',
    '/client/mes-besoins',
    '/admin/users',
    '/fournisseur/mes-prestations',
  ];

  for (const route of routesProtegees) {
    test(`${route} redirige vers /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });
  }
});

// Le cloisonnement par rôle (un client ne peut pas atteindre l'admin, etc.)
// est testé dans client/ , fournisseur/ et admin/ en réutilisant les sessions
// du setup (évite de re-consommer le quota /login).
