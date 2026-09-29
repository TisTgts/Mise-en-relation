import {
  NETWORK_MESSAGE,
  ApiError,
  apiErrorFromResponse,
  fieldErrorsFromPayload,
  friendlyErrorMessage,
  messageFromPayload,
} from './apiErrors';

const fakeResponse = (status, body) => ({
  status,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

describe('messageFromPayload', () => {
  it('reformule les identifiants invalides avec une consigne', () => {
    const msg = messageFromPayload({ non_field_errors: ['Identifiants invalides'] }, 400, 'x');
    expect(msg).toMatch(/Mot de passe oublié/);
  });

  it('remplace les noms techniques des champs par des libellés', () => {
    const msg = messageFromPayload({ intitule: ['Ce champ est obligatoire.'] }, 400, 'x');
    expect(msg).toBe('Intitulé : Ce champ est obligatoire.');
  });

  it('extrait le délai des requêtes ralenties', () => {
    const msg = messageFromPayload({ detail: 'Requête ralentie. Réessayez dans 42 secondes.' }, 429, 'x');
    expect(msg).toBe('Trop de tentatives. Réessayez dans 42 secondes.');
  });

  it('ne montre jamais une page HTML de serveur', () => {
    const msg = messageFromPayload('<!doctype html><h1>Server Error</h1>', 500, 'x');
    expect(msg).toMatch(/problème temporaire/);
  });
});

describe('apiErrorFromResponse', () => {
  it('expose le statut et les erreurs par champ', async () => {
    const err = await apiErrorFromResponse(fakeResponse(400, { budget: ['Montant invalide'] }), 'x');
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.fieldErrors).toEqual({ budget: 'Montant invalide' });
    expect(err.message).toBe('Budget : Montant invalide');
  });

  it('guide vers la reconnexion sur 401', async () => {
    const err = await apiErrorFromResponse(fakeResponse(401, ''), 'x');
    expect(err.message).toMatch(/Reconnectez-vous/);
  });
});

describe('friendlyErrorMessage', () => {
  it('traduit une coupure réseau du navigateur', () => {
    expect(friendlyErrorMessage(new TypeError('Failed to fetch'), 'x')).toBe(NETWORK_MESSAGE);
  });

  it('remplace les messages techniques anglais par le message de repli', () => {
    expect(friendlyErrorMessage(new Error('Failed to create demande'), 'Repli')).toBe('Repli');
  });

  it('aplatit les erreurs imbriquées', () => {
    expect(fieldErrorsFromPayload({ exigences: { objectif: ['Requis'] } })).toEqual({ exigences: 'Requis' });
  });
});
