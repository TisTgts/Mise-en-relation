// @ts-check
const path = require('path');

/**
 * Comptes de démonstration créés par `python manage.py seed_db`.
 * Mot de passe commun : demo1234.
 * Surchargables via variables d'environnement si vos identifiants diffèrent.
 */
const DEMO_PASSWORD = process.env.E2E_PASSWORD || 'demo1234';

const USERS = {
  client: {
    email: process.env.E2E_CLIENT_EMAIL || 'client@demo.local',
    password: DEMO_PASSWORD,
    dashboard: '/client/dashboard',
    type: 'client',
  },
  fournisseur: {
    email: process.env.E2E_FOURNISSEUR_EMAIL || 'fournisseur@demo.local',
    password: DEMO_PASSWORD,
    dashboard: '/fournisseur/dashboard',
    type: 'fournisseur',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@demo.local',
    password: DEMO_PASSWORD,
    dashboard: '/admin/dashboard',
    type: 'administrateur',
  },
};

const AUTH_DIR = path.resolve(__dirname, '..', '..', '.auth');

const storageStatePath = (role) => path.join(AUTH_DIR, `${role}.json`);

module.exports = { USERS, DEMO_PASSWORD, AUTH_DIR, storageStatePath };
