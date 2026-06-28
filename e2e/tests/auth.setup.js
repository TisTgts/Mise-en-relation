// @ts-check
const { test } = require('@playwright/test');
const fs = require('fs');
const { USERS, AUTH_DIR, storageStatePath } = require('./helpers/users');
const { loginViaUI } = require('./helpers/auth');

// Marge pour l'éventuelle attente anti-throttling du login.
test.setTimeout(120000);

test.beforeAll(() => {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
});

for (const role of ['client', 'fournisseur', 'admin']) {
  test(`authentification ${role}`, async ({ page }) => {
    await loginViaUI(page, USERS[role]);
    await page.context().storageState({ path: storageStatePath(role) });
  });
}
