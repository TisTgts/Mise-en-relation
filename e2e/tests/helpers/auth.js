// @ts-check
const { expect } = require('@playwright/test');

const THROTTLE_HINT = /throttl|tentative|réessay|seconds|secondes|trop de/i;

/**
 * Connecte un utilisateur via le formulaire de login de l'UI.
 *
 * L'endpoint /login est limité à 5 requêtes/min par IP. Si la suite atteint
 * cette limite, on détecte le message de throttling et on retente une fois
 * après la fenêtre de temps, ce qui rend les tests robustes.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ email: string, password: string, dashboard: string }} user
 */
async function loginViaUI(page, user) {
  const attempt = async (isRetry) => {
    await page.goto('/login');
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(user.password);
    await page.getByRole('button', { name: /se connecter/i }).click();

    try {
      await expect(page).toHaveURL(new RegExp(escapeRegExp(user.dashboard)), { timeout: 15000 });
    } catch (error) {
      const bodyText = await page.locator('body').innerText().catch(() => '');
      if (!isRetry && THROTTLE_HINT.test(bodyText)) {
        // Quota de connexion atteint : on attend la fin de la fenêtre puis on retente.
        await page.waitForTimeout(61000);
        return attempt(true);
      }
      throw error;
    }
  };

  await attempt(false);

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('access_token')))
    .not.toBeNull();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { loginViaUI, escapeRegExp };
