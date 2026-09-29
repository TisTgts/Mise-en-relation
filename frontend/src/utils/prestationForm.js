export const TARIF_OPTIONS = [
  { value: 'devis', label: 'Sur devis : je donne un prix après avoir vu le travail' },
  { value: 'forfait', label: 'Prix par travail (forfait)' },
  { value: 'horaire', label: "Prix à l'heure" },
];

export const TARIF_LABELS = {
  devis: 'Sur devis',
  forfait: 'Prix par travail (forfait)',
  fixe: 'Prix fixe',
  horaire: "Prix à l'heure",
};

const pad = (n) => String(n).padStart(2, '0');

export const toDateInput = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const todayInput = () => toDateInput(new Date());

export const cleanCaracteristiques = (values) =>
  Object.fromEntries(
    Object.entries(values || {})
      .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      .filter(([, v]) => v !== '' && v != null)
  );

export function validatePrestation(formData, { minDescription = 20 } = {}) {
  const errors = {};
  const isDevis = formData.mode_tarification === 'devis';
  const min = formData.tarif_min === '' || formData.tarif_min == null ? null : parseFloat(formData.tarif_min);
  const max = formData.tarif_max === '' || formData.tarif_max == null ? null : parseFloat(formData.tarif_max);

  if (!formData.categorie) errors.categorie = 'Choisissez la catégorie de votre service.';
  if (!String(formData.type_prestation || '').trim()) errors.type_prestation = 'Choisissez le type de service que vous proposez.';
  if (!formData.intitule.trim()) errors.intitule = 'Donnez un titre à votre prestation.';
  const description = formData.description.trim();
  if (!description) {
    errors.description = 'Décrivez votre prestation en quelques phrases.';
  } else if (description.length < minDescription) {
    errors.description = `Décrivez votre prestation en quelques phrases (${minDescription} caractères minimum).`;
  }
  if (!formData.zones_intervention.length) {
    errors.zones_intervention = 'Choisissez au moins une ville où vous intervenez.';
  }
  if (!formData.disponibilite_debut) {
    errors.disponibilite_debut = 'Indiquez à partir de quand vous êtes disponible.';
  }
  if (formData.disponibilite_fin && formData.disponibilite_debut && formData.disponibilite_fin < formData.disponibilite_debut) {
    errors.disponibilite_fin = 'Cette date doit être après la date de début.';
  }
  if (!isDevis) {
    if (min == null && max == null) errors.tarif_min = 'Indiquez au moins un prix (minimum ou maximum).';
    if (min != null && !(min > 0)) errors.tarif_min = 'Le prix doit être supérieur à 0.';
    if (max != null && !(max > 0)) errors.tarif_max = 'Le prix doit être supérieur à 0.';
    if (min != null && max != null && min > max) errors.tarif_max = 'Le prix maximum doit être supérieur au prix minimum.';
  }
  return errors;
}

export function buildPrestationPayload(formData) {
  const isDevis = formData.mode_tarification === 'devis';
  return {
    categorie: formData.categorie,
    intitule: formData.intitule.trim(),
    description: formData.description.trim(),
    type_prestation: String(formData.type_prestation).trim(),
    caracteristiques: cleanCaracteristiques(formData.caracteristiques),
    zones_intervention: formData.zones_intervention,
    disponibilite_debut: formData.disponibilite_debut ? `${formData.disponibilite_debut}T00:00:00` : null,
    disponibilite_fin: formData.disponibilite_fin ? `${formData.disponibilite_fin}T23:59:59` : null,
    mode_tarification: formData.mode_tarification,
    tarif_min: isDevis || formData.tarif_min === '' ? null : parseFloat(formData.tarif_min),
    tarif_max: isDevis || formData.tarif_max === '' ? null : parseFloat(formData.tarif_max),
  };
}
