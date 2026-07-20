import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { extractErrorMessage } from '../../services/authService';
import { hapticLight } from '../../utils/haptics';

const STEPS = ['Catégorie', 'Détails', 'Budget'];
const URGENCE_LABELS = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

export default function BesoinCreateScreen({ navigation }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  const [location, setLocation] = useState({ ville: '', quartier: '', adresse: '', label: '' });

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCategories(list);
        if (list[0]) {
          setForm((f) => ({
            ...f,
            categorie: list[0].id,
            type_service: list[0].nom || list[0].name || '',
          }));
        }
      })
      .catch(() => setError('Impossible de charger les catégories'));
  }, []);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const validateStep = () => {
    setError(null);
    if (step === 0 && !form.categorie) {
      setError('Choisissez une catégorie.');
      return false;
    }
    if (step === 1) {
      if (!form.intitule.trim()) {
        setError('L’intitulé est requis.');
        return false;
      }
      if (!form.description.trim() || form.description.trim().length < 10) {
        setError('Décrivez votre besoin (au moins 10 caractères).');
        return false;
      }
      if (!location.ville?.trim()) {
        setError('Choisissez une ville d’intervention.');
        return false;
      }
    }
    if (step === 2 && form.mode_budget === 'budget_fixe' && !form.budget) {
      setError('Indiquez un montant ou choisissez « Sur devis ».');
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
    setStep((s) => s - 1);
  };

  const onSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const cat = categories.find((c) => c.id === form.categorie);
      const catName = (cat?.nom || cat?.name || '').toLowerCase();
      let exigences = {};
      if (catName.includes('transport') || catName.includes('logistique')) {
        exigences = { type_marchandise: 'À préciser', volume_estime: 'À préciser' };
      } else if (catName.includes('informatique') || catName.includes('digital')) {
        exigences = { contexte_technique: 'À préciser', stack_souhaitee: 'À préciser' };
      } else if (catName.includes('btp') || catName.includes('travaux')) {
        exigences = { surface_estimee_m2: '1', materiaux_fournis_par: 'À préciser' };
      } else if (catName.includes('maintenance') || catName.includes('repar')) {
        exigences = { equipement_concerne: 'À préciser', panne_constatee: 'À préciser' };
      }
      const payload = {
        categorie: form.categorie,
        intitule: form.intitule.trim(),
        description: form.description.trim(),
        type_service: form.type_service || cat?.nom || cat?.name || 'Service',
        exigences,
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
      navigation.replace('BesoinDetail', { id: created.id });
    } catch (e) {
      setError(extractErrorMessage(e, 'Création impossible'));
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = categories.find((c) => c.id === form.categorie);

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
                label={c.nom || c.name || `#${c.id}`}
                selected={form.categorie === c.id}
                onPress={() =>
                  setForm((f) => ({
                    ...f,
                    categorie: c.id,
                    type_service: c.nom || c.name || f.type_service,
                  }))
                }
              />
            ))}
          </View>
          {selectedCat ? (
            <View style={styles.hintCard}>
              <Text style={styles.hintTitle}>
                {selectedCat.nom || selectedCat.name}
              </Text>
              <Text style={styles.hintText}>
                Les professionnels de cette catégorie pourront vous matcher.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <Field
            label="Intitulé"
            value={form.intitule}
            onChangeText={(v) => set('intitule', v)}
            autoCapitalize="sentences"
            placeholder="Ex. Réparation climatisation bureau"
          />
          <Field
            label="Description"
            value={form.description}
            onChangeText={(v) => set('description', v)}
            multiline
            autoCapitalize="sentences"
            placeholder="Décrivez le contexte, les contraintes, le délai souhaité…"
          />
          <LocationPicker
            value={location}
            onChange={(next) => {
              setLocation(next);
              set('lieu_intervention', next.label || '');
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

      {step === 2 ? (
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
              {selectedCat?.nom || selectedCat?.name || '—'} · {form.intitule || 'Sans titre'}
            </Text>
            <Text style={styles.summaryLine} numberOfLines={2}>
              {form.lieu_intervention || 'Lieu à préciser'} · Urgence {URGENCE_LABELS[form.urgence]}
            </Text>
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
