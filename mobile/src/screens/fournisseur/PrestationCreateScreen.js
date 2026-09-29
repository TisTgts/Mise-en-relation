import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BesoinPrecisionsFields, { cleanPrecisions } from '../../components/BesoinPrecisionsFields';
import FormScreen from '../../components/FormScreen';
import FormStepper from '../../components/FormStepper';
import CityChipsPicker from '../../components/CityChipsPicker';
import { Button, Chip, ErrorBanner, Field, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { colors, radii, spacing } from '../../config/theme';
import { createPrestation, fetchCategories } from '../../services/dataService';
import { extractErrorMessage, extractFieldErrors } from '../../services/authService';
import { hapticLight } from '../../utils/haptics';

const STEPS = ['Service', 'Offre', 'Zones', 'Prix'];
const STEP_OFFRE = 1;
const STEP_ZONES = 2;
const STEP_PRIX = 3;
const FIELD_STEP = {
  categorie: 0,
  type_prestation: 0,
  intitule: STEP_OFFRE,
  description: STEP_OFFRE,
  caracteristiques: STEP_OFFRE,
  zones_intervention: STEP_ZONES,
  disponibilite_debut: STEP_ZONES,
  disponibilite_fin: STEP_ZONES,
  mode_tarification: STEP_PRIX,
  tarif_min: STEP_PRIX,
  tarif_max: STEP_PRIX,
};
const TARIF_LABELS = {
  devis: 'Sur devis',
  forfait: 'Prix par travail',
  horaire: "À l'heure",
};
const OTHER = '__autre__';

const categoryName = (c) => c?.nom || c?.name || '';

export default function PrestationCreateScreen({ navigation }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [profileMismatch, setProfileMismatch] = useState(false);
  const [form, setForm] = useState({
    categorie: null,
    type_prestation: '',
    intitule: '',
    description: '',
    mode_tarification: 'devis',
    tarif_min: '',
    tarif_max: '',
  });
  const [typeChoice, setTypeChoice] = useState('');
  const [precisions, setPrecisions] = useState({});
  const [zones, setZones] = useState([]);

  const selectedCat = categories.find((c) => c.id === form.categorie);
  const serviceTypes = selectedCat?.types_service_suggeres || [];
  const questions = selectedCat?.champs_prestation || [];

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setError(extractErrorMessage(null, 'Impossible de charger les catégories. Réessayez.')));
  }, []);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((prev) => ({ ...prev, [k]: null }));
  };

  const selectCategory = (c) => {
    if (c.id === form.categorie) return;
    setForm((f) => ({ ...f, categorie: c.id, type_prestation: '' }));
    setTypeChoice('');
    setPrecisions({});
    setFieldErrors({});
    setProfileMismatch(false);
  };

  const selectType = (t) => {
    const next = typeChoice === t ? '' : t;
    setTypeChoice(next);
    set('type_prestation', next === OTHER ? '' : next);
  };

  const setPrecision = (key, value) => {
    setPrecisions((prev) => ({ ...prev, [key]: value }));
  };

  const errorsForStep = (s) => {
    const next = {};
    if (s === 0) {
      if (!form.categorie) next.categorie = 'Choisissez une catégorie.';
      else if (!form.type_prestation.trim()) next.type_prestation = 'Choisissez le type de service que vous proposez.';
    }
    if (s === STEP_OFFRE) {
      if (!form.intitule.trim()) next.intitule = 'Donnez un titre à votre prestation';
      if (form.description.trim().length < 20) next.description = 'Décrivez votre offre en quelques phrases (20 caractères minimum)';
    }
    if (s === STEP_ZONES && zones.map((z) => z.trim()).filter(Boolean).length === 0) {
      next.zones_intervention = 'Choisissez au moins une ville où vous intervenez.';
    }
    if (s === STEP_PRIX && form.mode_tarification !== 'devis') {
      const min = String(form.tarif_min).trim();
      const max = String(form.tarif_max).trim();
      if (!min && !max) next.tarif_min = 'Indiquez au moins un prix';
      if (min && max && Number(min) > Number(max)) next.tarif_max = 'Doit être supérieur au prix minimum';
    }
    return next;
  };

  const validateStep = (s = step) => {
    setError(null);
    const next = errorsForStep(s);
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setError(next.categorie || next.type_prestation || next.zones_intervention || 'Complétez les champs marqués.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    hapticLight();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    hapticLight();
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setError(null);
    setFieldErrors({});
    setStep((s) => s - 1);
  };

  const onSubmit = async () => {
    for (let s = 0; s < STEPS.length; s += 1) {
      if (Object.keys(errorsForStep(s)).length > 0) {
        setStep(s);
        validateStep(s);
        return;
      }
    }
    setLoading(true);
    try {
      const payload = {
        categorie: form.categorie,
        intitule: form.intitule.trim(),
        description: form.description.trim(),
        type_prestation: form.type_prestation.trim(),
        caracteristiques: cleanPrecisions(precisions),
        zones_intervention: zones.map((z) => z.trim()).filter(Boolean),
        disponibilite_debut: new Date().toISOString(),
        disponibilite_fin: null,
        mode_tarification: form.mode_tarification,
      };
      if (form.mode_tarification !== 'devis') {
        payload.tarif_min = form.tarif_min || null;
        payload.tarif_max = form.tarif_max || null;
      }
      const created = await createPrestation(payload);
      showToast('Prestation publiée : elle sera proposée aux clients correspondants.');
      if (created?.id) navigation.replace('PrestationDetail', { id: created.id });
      else navigation.goBack();
    } catch (e) {
      const serverFields = extractFieldErrors(e);
      setProfileMismatch(Boolean(serverFields.type_prestation));
      const firstField = Object.keys(serverFields)[0];
      if (firstField && FIELD_STEP[firstField] != null) {
        setStep(FIELD_STEP[firstField]);
        setFieldErrors(serverFields);
      }
      setError(extractErrorMessage(e, "La prestation n'a pas pu être publiée. Vérifiez les étapes puis réessayez."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <Title>Nouvelle prestation</Title>
      <Subtitle>Présentez votre offre en 4 étapes.</Subtitle>
      <FormStepper steps={STEPS} current={step} onStepPress={setStep} />
      <ErrorBanner message={error} />
      {profileMismatch ? (
        <Button
          title="Compléter mes types de services"
          variant="secondary"
          icon="person-circle-outline"
          onPress={() => navigation.navigate('Tabs', { screen: 'ProfilTab' })}
        />
      ) : null}

      {step === 0 ? (
        <View>
          <Text style={styles.label}>Dans quelle catégorie proposez-vous ?</Text>
          <View style={styles.chips}>
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={categoryName(c) || `#${c.id}`}
                selected={form.categorie === c.id}
                onPress={() => selectCategory(c)}
              />
            ))}
          </View>
          {selectedCat ? (
            <>
              <Text style={styles.label}>Quel service proposez-vous ? *</Text>
              <Text style={styles.help}>
                Ce sont les mêmes types que ceux choisis par les clients : c’est ce qui permet de vous proposer leurs besoins.
              </Text>
              <View style={styles.chips}>
                {serviceTypes.map((t) => (
                  <Chip key={t} label={t} selected={typeChoice === t} onPress={() => selectType(t)} />
                ))}
                <Chip label="Autre" selected={typeChoice === OTHER || serviceTypes.length === 0} onPress={() => selectType(OTHER)} />
              </View>
              {typeChoice === OTHER || serviceTypes.length === 0 ? (
                <Field
                  label="Précisez votre service"
                  value={form.type_prestation}
                  onChangeText={(v) => set('type_prestation', v)}
                  error={fieldErrors.type_prestation}
                  autoCapitalize="sentences"
                  placeholder="Ex. Réparation de climatiseurs"
                />
              ) : fieldErrors.type_prestation ? (
                <Text style={styles.error}>{fieldErrors.type_prestation}</Text>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}

      {step === STEP_OFFRE ? (
        <View>
          <Field
            label="Titre de la prestation *"
            value={form.intitule}
            onChangeText={(v) => set('intitule', v)}
            error={fieldErrors.intitule}
            autoCapitalize="sentences"
            placeholder="Ex. Réparation de climatiseurs à domicile"
          />
          <Field
            label="Description *"
            value={form.description}
            onChangeText={(v) => set('description', v)}
            error={fieldErrors.description}
            multiline
            autoCapitalize="sentences"
            placeholder="Ce que vous faites, ce qui est compris dans le prix, vos délais…"
          />
          {questions.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Quelques précisions (facultatif)</Text>
              <Text style={styles.help}>
                Les clients choisissent plus facilement un prestataire qui donne ces détails.
              </Text>
              <BesoinPrecisionsFields
                fields={questions}
                values={precisions}
                errors={fieldErrors}
                onChange={setPrecision}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {step === STEP_ZONES ? (
        <View>
          <CityChipsPicker label="Dans quelles villes intervenez-vous ? *" selected={zones} onChange={setZones} />
          {fieldErrors.zones_intervention ? (
            <Text style={styles.error}>{fieldErrors.zones_intervention}</Text>
          ) : null}
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>
              Votre prestation est disponible dès aujourd’hui, sans date de fin. Vous pourrez la mettre en pause à tout moment.
            </Text>
          </View>
        </View>
      ) : null}

      {step === STEP_PRIX ? (
        <View>
          <Text style={styles.label}>Comment fixez-vous votre prix ?</Text>
          <View style={styles.chips}>
            {Object.entries(TARIF_LABELS).map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                selected={form.mode_tarification === value}
                onPress={() => set('mode_tarification', value)}
              />
            ))}
          </View>
          {form.mode_tarification !== 'devis' ? (
            <>
              <Field
                label={form.mode_tarification === 'horaire' ? 'Prix par heure à partir de (FCFA)' : 'Prix à partir de (FCFA)'}
                value={String(form.tarif_min)}
                onChangeText={(v) => set('tarif_min', v.replace(/[^0-9]/g, ''))}
                error={fieldErrors.tarif_min}
                keyboardType="numeric"
                placeholder="Ex. 15000"
              />
              <Field
                label="Jusqu’à (FCFA)"
                value={String(form.tarif_max)}
                onChangeText={(v) => set('tarif_max', v.replace(/[^0-9]/g, ''))}
                error={fieldErrors.tarif_max}
                keyboardType="numeric"
                placeholder="Ex. 50000"
              />
              <Text style={styles.help}>Indiquez au moins un des deux prix. Une fourchette rassure le client.</Text>
            </>
          ) : (
            <View style={styles.hintCard}>
              <Text style={styles.hintText}>
                Pas besoin d’indiquer de prix : vous enverrez un devis à chaque client intéressé.
              </Text>
            </View>
          )}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
            <Text style={styles.summaryLine}>
              {form.type_prestation || categoryName(selectedCat) || '—'} · {form.intitule || 'Sans titre'}
            </Text>
            <Text style={styles.summaryLine}>
              {TARIF_LABELS[form.mode_tarification]}
              {zones.length ? ` · ${zones.join(', ')}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.nav}>
        {step < STEPS.length - 1 ? (
          <Button title="Continuer" onPress={goNext} icon="arrow-forward" />
        ) : (
          <Button title="Publier la prestation" onPress={onSubmit} loading={loading} icon="cloud-upload-outline" />
        )}
        <Button title={step === 0 ? 'Annuler' : 'Retour'} variant="ghost" onPress={goBack} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 2 },
  help: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 17 },
  error: { fontSize: 12, color: colors.danger, marginTop: -spacing.xs, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  hintCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hintText: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  summary: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  summaryLine: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  nav: { marginTop: spacing.md },
});
