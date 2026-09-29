import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CURRENCY_LABEL } from '../../pays';
import { TARIF_LABELS, TARIF_OPTIONS } from '../../utils/prestationForm';
import CategoryQuestions from './CategoryQuestions';
import CityZonesPicker from './CityZonesPicker';
import ServiceTypeField from './ServiceTypeField';

const Section = ({ title, subtitle, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

const Label = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
    {children}
    {required && <> <span className="text-red-500">*</span></>}
  </label>
);

const FieldError = ({ message, help }) =>
  message ? (
    <p className="mt-1 text-sm text-red-600">{message}</p>
  ) : help ? (
    <p className="mt-1 text-xs text-slate-500">{help}</p>
  ) : null;

/**
 * Champs du formulaire de prestation (création et modification).
 * setField(name, value) est fourni par la page (remise à zéro liée à la catégorie, erreurs…).
 */
export default function PrestationFormFields({ formData, setField, errors = {}, categories = [], children }) {
  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(formData.categorie)),
    [categories, formData.categorie]
  );
  const serviceTypes = selectedCategory?.types_service_suggeres || [];
  const questions = selectedCategory?.champs_prestation || [];
  const isDevis = formData.mode_tarification === 'devis';
  const tarifOptions = TARIF_OPTIONS.some((o) => o.value === formData.mode_tarification)
    ? TARIF_OPTIONS
    : [...TARIF_OPTIONS, { value: formData.mode_tarification, label: TARIF_LABELS[formData.mode_tarification] || formData.mode_tarification }];
  const unit = formData.mode_tarification === 'horaire' ? ` (${CURRENCY_LABEL} / heure)` : ` (${CURRENCY_LABEL})`;
  const profileHint = /mon profil/i.test(errors.type_prestation || '');

  const onInput = (e) => setField(e.target.name, e.target.value);

  return (
    <>
      <Section title="Votre service">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="categorie" required>Catégorie</Label>
              <select
                id="categorie"
                name="categorie"
                value={formData.categorie}
                onChange={onInput}
                className={`form-select ${errors.categorie ? 'form-field-error' : ''}`}
              >
                <option value="">Choisir une catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
              <FieldError message={errors.categorie} />
            </div>

            <div>
              <Label htmlFor="type_prestation" required>Type de service</Label>
              {formData.categorie ? (
                <ServiceTypeField
                  types={serviceTypes}
                  value={formData.type_prestation}
                  onChange={(v) => setField('type_prestation', v)}
                  error={errors.type_prestation}
                />
              ) : (
                <>
                  <select disabled className="form-select">
                    <option>Choisissez d&apos;abord une catégorie</option>
                  </select>
                  <FieldError message={errors.type_prestation} />
                </>
              )}
              {profileHint && (
                <Link to="/fournisseur/profil" className="mt-1 inline-block text-sm font-medium text-indigo-700 hover:underline">
                  Modifier mes services dans « Mon profil »
                </Link>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="intitule" required>Titre de la prestation</Label>
            <input
              type="text"
              id="intitule"
              name="intitule"
              value={formData.intitule}
              onChange={onInput}
              maxLength={200}
              placeholder="Ex. Réparation et entretien de climatiseurs à domicile"
              className={`form-input ${errors.intitule ? 'form-field-error' : ''}`}
            />
            <FieldError message={errors.intitule} help="C'est ce que le client lit en premier : soyez simple et précis." />
          </div>

          <div>
            <Label htmlFor="description" required>Description</Label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={onInput}
              placeholder="Ce que vous faites, ce qui est compris dans le prix, vos délais, votre expérience…"
              className={`form-input ${errors.description ? 'form-field-error' : ''}`}
            />
            <FieldError message={errors.description} />
          </div>
        </div>
      </Section>

      {questions.length > 0 && (
        <Section
          title="Quelques précisions sur votre offre"
          subtitle="Facultatif, mais les clients choisissent plus facilement un prestataire qui donne ces détails."
        >
          <CategoryQuestions
            fields={questions}
            values={formData.caracteristiques}
            onChange={(key, value) => setField('caracteristiques', { ...formData.caracteristiques, [key]: value })}
            errors={errors}
          />
        </Section>
      )}

      <Section title={<>Zones d&apos;intervention <span className="text-red-500">*</span></>}>
        <CityZonesPicker
          selected={formData.zones_intervention}
          onChange={(zones) => setField('zones_intervention', zones)}
          error={errors.zones_intervention}
        />
      </Section>

      <Section title="Disponibilité">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="disponibilite_debut" required>Disponible à partir du</Label>
            <input
              type="date"
              id="disponibilite_debut"
              name="disponibilite_debut"
              value={formData.disponibilite_debut}
              onChange={onInput}
              className={`form-input ${errors.disponibilite_debut ? 'form-field-error' : ''}`}
            />
            <FieldError message={errors.disponibilite_debut} />
          </div>
          <div>
            <Label htmlFor="disponibilite_fin">Jusqu&apos;au (facultatif)</Label>
            <input
              type="date"
              id="disponibilite_fin"
              name="disponibilite_fin"
              value={formData.disponibilite_fin}
              min={formData.disponibilite_debut || undefined}
              onChange={onInput}
              className={`form-input ${errors.disponibilite_fin ? 'form-field-error' : ''}`}
            />
            <FieldError
              message={errors.disponibilite_fin}
              help="Laissez vide si vous êtes disponible sans limite de date."
            />
          </div>
        </div>
      </Section>

      <Section title="Prix">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="mode_tarification" required>Comment fixez-vous votre prix ?</Label>
            <select
              id="mode_tarification"
              name="mode_tarification"
              value={formData.mode_tarification}
              onChange={onInput}
              className="form-select"
            >
              {tarifOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {isDevis ? (
            <div className="md:col-span-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
              Pas besoin d&apos;indiquer de prix : vous enverrez un devis à chaque client intéressé.
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="tarif_min">Prix à partir de{unit}</Label>
                <input
                  type="number"
                  id="tarif_min"
                  name="tarif_min"
                  min="0"
                  step="500"
                  value={formData.tarif_min}
                  onChange={onInput}
                  placeholder="Ex. 15000"
                  className={`form-input ${errors.tarif_min ? 'form-field-error' : ''}`}
                />
                <FieldError message={errors.tarif_min} help="Indiquez au moins un des deux prix." />
              </div>
              <div>
                <Label htmlFor="tarif_max">Jusqu&apos;à{unit}</Label>
                <input
                  type="number"
                  id="tarif_max"
                  name="tarif_max"
                  min="0"
                  step="500"
                  value={formData.tarif_max}
                  onChange={onInput}
                  placeholder="Ex. 50000"
                  className={`form-input ${errors.tarif_max ? 'form-field-error' : ''}`}
                />
                <FieldError message={errors.tarif_max} help="Une fourchette rassure le client." />
              </div>
            </>
          )}
        </div>
      </Section>

      {children}
    </>
  );
}
