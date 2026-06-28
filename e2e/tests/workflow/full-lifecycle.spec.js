// @ts-check
const { test, expect } = require('@playwright/test');
const { apiContextForRole, uniqueSuffix } = require('../helpers/api');

/**
 * Parcours métier complet de bout en bout, piloté via l'API en réutilisant les
 * sessions authentifiées des 3 rôles (client, fournisseur, admin) :
 *
 *   besoin (sur devis) → prestation → collaboration → devis proposé →
 *   devis accepté → travail terminé → vérification client →
 *   demande de validation admin → finalisation admin → transaction « terminée ».
 *
 * Le pilotage API garantit le déterminisme (indépendant du moteur de matching
 * et des aléas du serveur de dev) tout en validant la vraie logique backend.
 */
test.describe.configure({ mode: 'serial' });
test.setTimeout(60000);

let clientApi;
let fournisseurApi;
let adminApi;

let categorieItId;
let besoinId;
let besoinIntitule;
let prestationId;
let prestationIntitule;
let transactionId;

async function expectOk(responsePromise, label) {
  const res = await responsePromise;
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`${label} → HTTP ${res.status()} : ${body}`);
  }
  return res.json();
}

test.beforeAll(async () => {
  clientApi = await apiContextForRole('client');
  fournisseurApi = await apiContextForRole('fournisseur');
  adminApi = await apiContextForRole('admin');

  const categories = await expectOk(
    clientApi.get('/api/services/categories/all/'),
    'Chargement des catégories'
  );
  const it = (Array.isArray(categories) ? categories : []).find(
    (c) => c.nom === 'Informatique & Digital'
  );
  if (!it) throw new Error('Catégorie « Informatique & Digital » introuvable (seed manquant ?).');
  categorieItId = it.id;
});

test.afterAll(async () => {
  await clientApi?.dispose();
  await fournisseurApi?.dispose();
  await adminApi?.dispose();
});

test('1. le client publie un besoin sur devis', async () => {
  besoinIntitule = `E2E Workflow Besoin ${uniqueSuffix()}`;
  // Le serializer de création ne renvoie pas l'id : on le récupère via la liste.
  await expectOk(
    clientApi.post('/api/services/besoins/', {
      data: {
        categorie: categorieItId,
        intitule: besoinIntitule,
        description: 'Besoin de développement web pour le parcours end-to-end.',
        type_service: 'Développement web',
        exigences: { contexte_technique: 'ERP interne', stack_souhaitee: 'Django + React' },
        lieu_intervention: 'Ouagadougou',
        date_souhaitee: '2030-06-01T09:00:00Z',
        date_limite: '2030-07-01T09:00:00Z',
        urgence: 'normale',
        mode_budget: 'sur_devis',
        budget: null,
        flexible: false,
        statut: 'ouverte',
      },
    }),
    'Création du besoin'
  );

  const mesBesoins = await expectOk(clientApi.get('/api/services/besoins/my/'), 'Liste des besoins');
  const besoin = (Array.isArray(mesBesoins) ? mesBesoins : []).find((b) => b.intitule === besoinIntitule);
  besoinId = besoin?.id;
  expect(besoinId).toBeTruthy();
  expect(besoin.statut).toBe('ouverte');
});

test('2. le fournisseur publie une prestation (mode devis)', async () => {
  prestationIntitule = `E2E Workflow Prestation ${uniqueSuffix()}`;
  await expectOk(
    fournisseurApi.post('/api/services/prestations/', {
      data: {
        categorie: categorieItId,
        intitule: prestationIntitule,
        description: 'Prestation de développement web pour le parcours end-to-end.',
        type_prestation: 'Développement web',
        caracteristiques: {},
        zones_intervention: ['Ouagadougou'],
        disponibilite_debut: '2030-06-01T08:00:00Z',
        disponibilite_fin: '2030-12-31T18:00:00Z',
        mode_tarification: 'devis',
      },
    }),
    'Création de la prestation'
  );

  const mesPrestations = await expectOk(
    fournisseurApi.get('/api/services/prestations/my-prestations/'),
    'Liste des prestations'
  );
  const prestation = (Array.isArray(mesPrestations) ? mesPrestations : []).find(
    (p) => p.intitule === prestationIntitule
  );
  prestationId = prestation?.id;
  expect(prestationId).toBeTruthy();
});

test('3. le client crée la collaboration (transaction)', async () => {
  const data = await expectOk(
    clientApi.post('/api/services/transactions/create/', {
      data: { offer_id: prestationId, need_id: besoinId },
    }),
    'Création de la transaction'
  );
  transactionId = data.id;
  expect(transactionId).toBeTruthy();
  expect(data.devis_statut).toBe('a_proposer');
});

test('4. le fournisseur propose un devis', async () => {
  const data = await expectOk(
    fournisseurApi.post(`/api/services/transactions/${transactionId}/fournisseur-propose-devis/`, {
      data: { montant: '850000.00' },
    }),
    'Proposition du devis'
  );
  expect(data.devis_statut).toBe('en_attente_client');
});

test('5. le client accepte le devis', async () => {
  const data = await expectOk(
    clientApi.post(`/api/services/transactions/${transactionId}/client-respond-devis/`, {
      data: { decision: 'accepter' },
    }),
    'Acceptation du devis'
  );
  expect(data.devis_statut).toBe('accepte_client');
});

test('6. le fournisseur déclare le travail terminé', async () => {
  const data = await expectOk(
    fournisseurApi.post(`/api/services/transactions/${transactionId}/fournisseur-work-done/`, {
      data: {},
    }),
    'Déclaration travail terminé'
  );
  expect(data.travail_fournisseur_termine).toBe(true);
});

test('7. le client valide le travail', async () => {
  const data = await expectOk(
    clientApi.post(`/api/services/transactions/${transactionId}/client-verify/`, {
      data: { approved: true },
    }),
    'Vérification client'
  );
  expect(data.verification_client_validee).toBe(true);
});

test('8. le client demande la validation administrateur', async () => {
  const data = await expectOk(
    clientApi.post(`/api/services/transactions/${transactionId}/request-admin-approval/`, {
      data: {},
    }),
    'Demande de validation admin'
  );
  expect(data.validation_admin_statut).toBe('en_attente');
});

test('9. l\'admin finalise → transaction terminée', async () => {
  const data = await expectOk(
    adminApi.post(`/api/services/transactions/${transactionId}/admin-decision/`, {
      data: { decision: 'accepter' },
    }),
    'Décision admin'
  );
  expect(data.validation_admin_statut).toBe('acceptee');
  expect(data.statut).toBe('terminee');

  // Vérification finale côté lecture.
  const detail = await expectOk(
    adminApi.get(`/api/services/transactions/${transactionId}/`),
    'Relecture de la transaction'
  );
  expect(detail.statut).toBe('terminee');
});
