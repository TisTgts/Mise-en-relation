import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BesoinPrecisionsFields, {
  cleanPrecisions,
  missingRequiredPrecisions,
} from '../../components/BesoinPrecisionsFields';
import FormScreen from '../../components/FormScreen';
import FormStepper from '../../components/FormStepper';
import LocationPicker from '../../components/LocationPicker';
import {
  Button,
  Chip,
  ErrorBanner,
  Field,
  Subtitle,
  Title,
} from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { colors, radii, spacing } from '../../config/theme';
import { createBesoin, fetchCategories } from '../../services/dataService';
import { extractErrorMessage, extractFieldErrors } from '../../services/authService';
import { hapticLight } from '../../utils/haptics';

const STEPS = ['Catégorie', 'Précisions', 'Détails', 'Budget'];
const STEP_PRECISIONS = 1;
const STEP_DETAILS = 2;
const STEP_BUDGET = 3;
const FIELD_STEP = {
  categorie: 0,
  type_service: 0,
  exigences: STEP_PRECISIONS,
  intitule: STEP_DETAILS,
  description: STEP_DETAILS,
  lieu_intervention: STEP_DETAILS,
  urgence: STEP_DETAILS,
  budget: STEP_BUDGET,
  mode_budget: STEP_BUDGET,
};
const URGENCE_LABELS = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

const categoryName = (c) => c?.nom || c?.name || '';

export default function BesoinCreateScreen({ navigation }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    categorie: null,
    intitule: '',
    description: '',
    lieu_intervention: '',
    urgence: 'normale',
    mode_budget: 'sur_devis',
    budget: '',
    type_service: '',
  });
  const [exigences, setExigences] = useState({});
  const [location, setLocation] = useState({ ville: '', quartier: '', adresse: '', label: '' });

  const selectedCat = categories.find((c) => c.id === form.categorie);
  const specificFields = selectedCat?.champs_specifiques || [];
  const serviceTypes = selectedCat?.types_service_suggeres || [];

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCategories(list);
        if (list[0]) {
          setForm((f) => ({ ...f, categorie: list[0].id, type_service: '' }));
        }
      })
      .catch(() => setError(extractErrorMessage(null, 'Impossible de charger les catégories')));
  }, []);

  const set = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((prev) => ({ ...prev, [k]: null }));
  };

  const selectCategory = (c) => {
    if (c.id === form.categorie) return;
    setForm((f) => ({ ...f, categorie: c.id, type_service: '' }));
    setExigences({});
    setFieldErrors({});
  };

  const setExigence = (key, value) => {
    setExigences((prev) => {
      const next = { ...prev };
      if (value == null || value === '') delete next[key];
      else next[key] = value;
      return next;
    });
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: null }));
  };

  const errorsForStep = (s) => {
    let next = {};
    if (s === 0 && !form.categorie) next.categorie = 'Choisissez une catégorie.';
    if (s === STEP_PRECISIONS) next = missingRequiredPrecisions(specificFields, exigences);
    if (s === STEP_DETAILS) {
      if (!form.intitule.trim()) next.intitule = 'L’intitulé est requis';
      if (!form.description.trim() || form.description.trim().length < 10) {
        next.description = 'Au moins 10 caractères';
      }
      if (!location.ville?.trim()) next.lieu = 'Choisissez une ville d’intervention';
    }
    if (s === STEP_BUDGET && form.mode_budget === 'budget_fixe' && !String(form.budget).trim()) {
      next.budget = 'Indiquez un montant ou choisissez « Sur devis »';
    }
    return next;
  };

  const validateStep = (s = step) => {
    setError(null);
    const next = errorsForStep(s);
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setError(next.categorie || next.lieu || 'Complétez les champs marqués.');
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
        type_service: form.type_service || categoryName(selectedCat) || 'Service',
        exigences: cleanPrecisions(exigences),
        lieu_intervention: location.label?.trim() || form.lieu_intervention.trim() || 'À préciser',
        urgence: form.urgence,
        mode_budget: form.mode_budget,
        flexible: true,
      };
      if (form.mode_budget === 'budget_fixe') {
        payload.budget = form.budget || '0';
      }
      const created = await createBesoin(payload);
      showToast('Besoin publié — lancez le matching.');
      if (created?.id) navigation.replace('BesoinDetail', { id: created.id });
      else navigation.goBack();
    } catch (e) {
      const serverFields = extractFieldErrors(e);
      const firstField = Object.keys(serverFields)[0];
      if (firstField && FIELD_STEP[firstField] != null) {
        setStep(FIELD_STEP[firstField]);
        setFieldErrors(serverFields);
      }
      setError(extractErrorMessage(e, "Le besoin n'a pas pu être publié. Vérifiez les étapes puis réessayez."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <Title>Nouveau besoin</Title>
      <Subtitle>Quelques étapes pour un matching plus pertinent.</Subtitle>
      <FormStepper steps={STEPS} current={step} onStepPress={setStep} />
      <ErrorBanner message={error} />

      {step === 0 ? (
        <View>
          <Text style={styles.label}>Quelle catégorie correspond à votre besoin ?</Text>
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
          {serviceTypes.length > 0 ? (
            <>
              <Text style={styles.label}>Plus précisément ?</Text>
              <View style={styles.chips}>
                {serviceTypes.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={form.type_service === t}
                    onPress={() => set('type_service', form.type_service === t ? '' : t)}
                  />
                ))}
              </View>
            </>
          ) : selectedCat ? (
            <View style={styles.hintCard}>
              <Text style={styles.hintTitle}>{categoryName(selectedCat)}</Text>
              <Text style={styles.hintText}>
                Les professionnels de cette catégorie pourront vous matcher.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === STEP_PRECISIONS ? (
        <View>
          {specificFields.length === 0 ? (
            <View style={styles.hintCard}>
              <Text style={styles.hintText}>
                Pas de question particulière pour cette catégorie. Passez à l’étape suivante.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.intro}>
                Ces réponses aident les prestataires à comprendre votre besoin et à vous faire un prix juste.
              </Text>
              <BesoinPrecisionsFields
                fields={specificFields}
                values={exigences}
                errors={fieldErrors}
                onChange={setExigence}
              />
            </>
          )}
        </View>
      ) : null}

      {step === STEP_DETAILS ? (
        <View>
          <Field
            label="Intitulé"
            value={form.intitule}
            onChangeText={(v) => set('intitule', v)}
            error={fieldErrors.intitule}
            autoCapitalize="sentences"
            placeholder="Ex. Réparation climatisation bureau"
          />
          <Field
            label="Description"
            value={form.description}
            onChangeText={(v) => set('description', v)}
            error={fieldErrors.description}
            multiline
            autoCapitalize="sentences"
            placeholder="Décrivez le contexte, les contraintes, le délai souhaité…"
          />
          <LocationPicker
            value={location}
            onChange={(next) => {
              setLocation(next);
              set('lieu_intervention', next.label || '');
              if (fieldErrors.lieu) setFieldErrors((p) => ({ ...p, lieu: null }));
            }}
          />
          <Text style={styles.label}>Urgence</Text>
          <View style={styles.chips}>
            {Object.entries(URGENCE_LABELS).map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                selected={form.urgence === value}
                onPress={() => set('urgence', value)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === STEP_BUDGET ? (
        <View>
          <Text style={styles.label}>Comment souhaitez-vous budgéter ?</Text>
          <View style={styles.chips}>
            <Chip
              label="Sur devis"
              selected={form.mode_budget === 'sur_devis'}
              onPress={() => set('mode_budget', 'sur_devis')}
            />
            <Chip
              label="Budget fixe"
              selected={form.mode_budget === 'budget_fixe'}
              onPress={() => set('mode_budget', 'budget_fixe')}
            />
          </View>
          {form.mode_budget === 'budget_fixe' ? (
            <Field
              label="Montant (FCFA)"
              value={form.budget}
              onChangeText={(v) => set('budget', v)}
              error={fieldErrors.budget}
              keyboardType="numeric"
              placeholder="Ex. 150000"
            />
          ) : (
            <View style={styles.hintCard}>
              <Text style={styles.hintText}>
                Les fournisseurs vous proposeront un devis adapté.
              </Text>
            </View>
          )}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
            <Text style={styles.summaryLine}>
              {form.type_service || categoryName(selectedCat) || '—'} · {form.intitule || 'Sans titre'}
            </Text>
            <Text style={styles.summaryLine} numberOfLines={2}>
              {form.lieu_intervention || 'Lieu à préciser'} · Urgence {URGENCE_LABELS[form.urgence]}
            </Text>
            {specificFields
              .filter((f) => exigences[f.key])
              .map((f) => (
                <Text key={f.key} style={styles.summaryLine} numberOfLines={2}>
                  {f.label} : {exigences[f.key]}
                </Text>
              ))}
          </View>
        </View>
      ) : null}

      <View style={styles.nav}>
        {step < STEPS.length - 1 ? (
          <Button title="Continuer" onPress={goNext} icon="arrow-forward" />
        ) : (
          <Button
            title="Publier le besoin"
            onPress={onSubmit}
            loading={loading}
            icon="cloud-upload-outline"
          />
        )}
        <Button
          title={step === 0 ? 'Annuler' : 'Retour'}
          variant="ghost"
          onPress={goBack}
        />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  hintCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hintTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginBottom: 4 },
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
