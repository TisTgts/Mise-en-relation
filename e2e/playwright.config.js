// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

/**
 * Configuration Playwright — dossier 100% isolé du code applicatif.
 *
 * Pré-requis avant `npm test` :
 *  - Backend Django lancé et accessible sur http://localhost:8000
 *    (avec la base peuplée : `python manage.py seed_db`).
 *  - Le frontend (http://localhost:3000) est démarré automatiquement
 *    par Playwright via `webServer` (ou réutilisé s'il tourne déjà).
 *
 * Variables d'environnement utiles :
 *  - E2E_BASE_URL       (def. http://localhost:3000)
 *  - E2E_API_URL        (def. http://localhost:8000)
 *  - E2E_NO_WEBSERVER=1 pour ne pas démarrer/attendre le frontend automatiquement
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

const webServer = process.env.E2E_NO_WEBSERVER
  ? undefined
  : {
      command: 'npm start',
      cwd: FRONTEND_DIR,
      url: BASE_URL,
      timeout: 180 * 1000,
      reuseExistingServer: !process.env.CI,
      env: { BROWSER: 'none' },
    };

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries : absorbent les aléas du serveur de dev (Django runserver / proxy CRA)
  // qui peut échouer ponctuellement sous charge (ex. /me/ → déconnexion transitoire).
  retries: process.env.CI ? 2 : 2,
  // Concurrence modérée pour ne pas saturer le serveur de dev mono-thread.
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 2,
  timeout: 45 * 1000,
  expect: { timeout: 10 * 1000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },
  webServer,
  projects: [
    // 1. Authentifie chaque rôle une seule fois et sauvegarde l'état de session.
    { name: 'setup', testMatch: /auth\.setup\.js/ },

    // 2. Tests publics / non authentifiés.
    {
      name: 'public',
      testMatch: /[\\/]shared[\\/].*\.spec\.js$/,
      use: { ...devices['Desktop Chrome'] },
    },

    // 3. Parcours authentifiés par rôle (réutilisent l'état de session du setup).
    {
      name: 'client',
      testMatch: /[\\/]client[\\/].*\.spec\.js$/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.auth/client.json' },
    },
    {
      name: 'fournisseur',
      testMatch: /[\\/]fournisseur[\\/].*\.spec\.js$/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.auth/fournisseur.json' },
    },
    {
      name: 'admin',
      testMatch: /[\\/]admin[\\/].*\.spec\.js$/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
    },

    // 4. Parcours métier complet (multi-rôles, piloté via l'API avec les
    //    sessions du setup). Pas de storageState : chaque rôle a son contexte.
    {
      name: 'workflow',
      testMatch: /[\\/]workflow[\\/].*\.spec\.js$/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
