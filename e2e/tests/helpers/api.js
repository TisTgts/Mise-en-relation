// @ts-check
const fs = require('fs');
const { request } = require('@playwright/test');
const { storageStatePath } = require('./users');

const API_URL = process.env.E2E_API_URL || 'http://localhost:8000';
const APP_ORIGIN = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Lit le token d'accès JWT depuis l'état de session sauvegardé par le setup. */
function accessTokenForRole(role) {
  const raw = fs.readFileSync(storageStatePath(role), 'utf-8');
  const state = JSON.parse(raw);
  const origin =
    (state.origins || []).find((o) => o.origin === APP_ORIGIN) || (state.origins || [])[0];
  const entry = (origin?.localStorage || []).find((e) => e.name === 'access_token');
  if (!entry?.value) {
    throw new Error(`Token introuvable pour le rôle « ${role} » (relancez le projet setup).`);
  }
  return entry.value;
}

/** Crée un contexte de requêtes API authentifié pour un rôle donné. */
async function apiContextForRole(role) {
  const token = accessTokenForRole(role);
  return request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
}

const uniqueSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

module.exports = { API_URL, APP_ORIGIN, accessTokenForRole, apiContextForRole, uniqueSuffix };
