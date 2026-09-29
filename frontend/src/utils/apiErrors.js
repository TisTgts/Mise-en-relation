// Traduction des erreurs API en messages qui disent à l'utilisateur quoi faire.

export const NETWORK_MESSAGE =
  'Impossible de joindre le serveur. Vérifiez votre connexion internet puis réessayez.';

const SESSION_EXPIRED_MESSAGE = 'Votre session a expiré. Reconnectez-vous pour continuer.';

const STATUS_MESSAGES = {
  400: 'Certaines informations sont incorrectes. Vérifiez le formulaire puis réessayez.',
  401: SESSION_EXPIRED_MESSAGE,
  403: "Votre compte ne permet pas cette action. Si vous pensez que c'est une erreur, contactez le support.",
  404: 'Élément introuvable : il a peut-être été supprimé. Revenez à la liste et actualisez la page.',
  408: 'Le serveur met trop de temps à répondre. Vérifiez votre connexion puis réessayez.',
  409: 'Cette action entre en conflit avec une modification récente. Actualisez la page puis réessayez.',
  413: 'Le fichier est trop volumineux. Choisissez un fichier plus léger.',
  429: 'Trop de tentatives en peu de temps. Patientez une minute puis réessayez.',
  500: 'Le service rencontre un problème temporaire. Réessayez dans quelques instants ; si cela continue, contactez le support.',
};

export const FIELD_LABELS = {
  email: 'E-mail',
  password: 'Mot de passe',
  password_confirm: 'Confirmation du mot de passe',
  new_password: 'Nouveau mot de passe',
  username: "Nom d'utilisateur",
  first_name: 'Prénom',
  last_name: 'Nom',
  telephone: 'Téléphone',
  type_utilisateur: 'Type de compte',
  photo_profil: 'Photo de profil',
  code: 'Code',
  intitule: 'Intitulé',
  description: 'Description',
  categorie: 'Catégorie',
  sous_categorie: 'Sous-catégorie',
  type_service: 'Type de service',
  exigences: 'Précisions',
  lieu_intervention: "Lieu d'intervention",
  date_souhaitee: 'Date souhaitée',
  date_limite: 'Date limite',
  urgence: 'Urgence',
  budget: 'Budget',
  mode_budget: 'Mode de prix',
  statut: 'Statut',
  type_prestation: 'Type de prestation',
  caracteristiques: 'Caractéristiques',
  zones_intervention: "Zones d'intervention",
  disponibilite_debut: 'Début de disponibilité',
  disponibilite_fin: 'Fin de disponibilité',
  mode_tarification: 'Mode de tarification',
  tarif_min: 'Tarif minimum',
  tarif_max: 'Tarif maximum',
  raison_sociale: 'Raison sociale',
  types_services_offerts: 'Types de services proposés',
  zones_couverture: 'Zones couvertes',
  annees_experience: "Années d'expérience",
  tarif_horaire: 'Tarif horaire',
  emplacement: 'Emplacement',
  montant: 'Montant',
  contenu: 'Message',
  notes: 'Notes',
};

// Messages serveur reformulés avec une consigne claire.
const KNOWN_MESSAGES = [
  [/identifiants invalides|no active account|unable to log in/i,
    'E-mail ou mot de passe incorrect. Vérifiez votre saisie ou utilisez « Mot de passe oublié ».'],
  [/compte est désactivé|account is disabled|user is inactive/i,
    'Ce compte est désactivé. Contactez le support pour le réactiver.'],
  [/(ralentie|throttled).*?(\d+)\s*(secondes?|seconds?)/i,
    (m) => `Trop de tentatives. Réessayez dans ${m[2]} secondes.`],
  [/ralentie|throttled/i, STATUS_MESSAGES[429]],
  [/(token|jeton).*(invalide|expir|not valid)|given token not valid|no refresh token/i, SESSION_EXPIRED_MESSAGE],
  [/informations d'authentification n'ont pas été fournies|authentication credentials were not provided/i,
    'Connectez-vous pour continuer.'],
  [/e-?mail.*(existe déjà|already exists)|(existe déjà|already exists).*e-?mail/i,
    'Un compte existe déjà avec cet e-mail. Connectez-vous ou utilisez « Mot de passe oublié ».'],
  [/^failed to fetch$|networkerror|network request failed|^load failed$/i, NETWORK_MESSAGE],
];

const statusMessage = (status) => {
  if (!status) return null;
  if (status >= 500) return STATUS_MESSAGES[500];
  return STATUS_MESSAGES[status] || null;
};

export function translateMessage(text) {
  const value = String(text || '').trim();
  if (!value) return '';
  for (const [pattern, replacement] of KNOWN_MESSAGES) {
    const match = value.match(pattern);
    if (match) return typeof replacement === 'function' ? replacement(match) : replacement;
  }
  return value;
}

const flatten = (value) => {
  if (value == null) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value === 'object') return Object.values(value).flatMap(flatten);
  return [String(value)];
};

export const labelForField = (key) =>
  FIELD_LABELS[key] || String(key).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** Erreurs de champs DRF → { champ: message } pour affichage sous chaque champ. */
export function fieldErrorsFromPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const out = {};
  for (const [key, value] of Object.entries(payload)) {
    if (['detail', 'error', 'message', 'non_field_errors', 'code'].includes(key)) continue;
    const text = flatten(value).map(translateMessage).join(' ');
    if (text) out[key] = text;
  }
  return out;
}

export function messageFromPayload(payload, status, fallback) {
  if (status >= 500) return STATUS_MESSAGES[500];

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (trimmed && !trimmed.startsWith('<') && trimmed.length <= 200) return translateMessage(trimmed);
    return statusMessage(status) || fallback;
  }

  if (payload && typeof payload === 'object') {
    for (const key of ['detail', 'error', 'message']) {
      if (typeof payload[key] === 'string' && payload[key].trim()) return translateMessage(payload[key]);
    }
    if (payload.non_field_errors) {
      const text = flatten(payload.non_field_errors).map(translateMessage).join(' ');
      if (text) return text;
    }
    const fields = fieldErrorsFromPayload(payload);
    const entries = Object.entries(fields);
    if (entries.length) {
      const lines = entries.slice(0, 2).map(([key, msg]) => `${labelForField(key)} : ${msg}`);
      if (entries.length > 2) lines.push('Vérifiez aussi les autres champs signalés.');
      return lines.join(' ');
    }
  }

  return statusMessage(status) || fallback || STATUS_MESSAGES[400];
}

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, payload = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.payload = payload;
  }
}

export async function apiErrorFromResponse(response, fallback) {
  let payload = null;
  try {
    const text = await response.text();
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }
  } catch {
    payload = null;
  }
  return new ApiError(messageFromPayload(payload, response.status, fallback), {
    status: response.status,
    fieldErrors: response.status < 500 ? fieldErrorsFromPayload(payload) : {},
    payload,
  });
}

/** fetch() qui transforme une coupure réseau en message compréhensible. */
export async function apiFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(NETWORK_MESSAGE, { status: 0 });
  }
}

/** Message à afficher pour n'importe quelle erreur attrapée dans un catch. */
export function friendlyErrorMessage(err, fallback = 'Une erreur est survenue. Réessayez.') {
  if (!err) return fallback;
  if (err instanceof ApiError) return err.message || fallback;
  const raw = typeof err === 'string' ? err : err.message;
  if (!raw) return fallback;
  if (/^(failed to|http error|http \d{3}|login failed|token refresh failed)/i.test(raw)) {
    return translateMessage(raw) !== raw ? translateMessage(raw) : fallback;
  }
  return translateMessage(raw);
}
