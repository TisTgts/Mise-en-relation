import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FormScreen from '../../components/FormScreen';
import FormStepper from '../../components/FormStepper';
import CityChipsPicker from '../../components/CityChipsPicker';
import { Button, Chip, ErrorBanner, Field, Subtitle, Title } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { colors, radii, spacing } from '../../config/theme';
import { createPrestation, fetchCategories } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { hapticLight } from '../../utils/haptics';

const STEPS = ['Catégorie', 'Offre', 'Tarifs'];
const TARIF_LABELS = {
  devis: 'Sur devis',
  forfait: 'Forfait',
  horaire: 'Horaire',
  fixe: 'Fixe',
};

export default function PrestationCreateScreen({ navigation }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    categorie: null,
    intitule: '',
    description: '',
    type_prestation: '',
    mode_tarification: 'devis',
    tarif_min: '',
    tarif_max: '',
    zones_intervention: '',
  });
  const [zonesSelected, setZonesSelected] = useState([]);

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCategories(list);
        if (list[0]) {
          setForm((f) => ({
            ...f,
            categorie: list[0].id,
            type_prestation: list[0].nom || list[0].name || '',
          }));
        }
      })
      .catch(() => setError('Catégories indisponibles'));
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

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
        setError('Décrivez votre offre (au moins 10 caractères).');
        return false;
      }
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
      const zones = zonesSelected.length
        ? zonesSelected
        : form.zones_intervention
            .split(',')
            .map((z) => z.trim())
            .filter(Boolean);
      const payload = {
        categorie: form.categorie,
        intitule: form.intitule.trim(),
        description: form.description.trim(),
        type_prestation: form.type_prestation || 'Service',
        caracteristiques: {},
        zones_intervention: zones.length ? zones : ['National'],
        mode_tarification: form.mode_tarification,
      };
      if (form.mode_tarification !== 'devis') {
        payload.tarif_min = form.tarif_min || null;
        payload.tarif_max = form.tarif_max || null;
      }
      const created = await createPrestation(payload);
      showToast('Prestation créée — disponible pour le matching.');
      navigation.replace('PrestationDetail', { id: created.id });
    } catch (e) {
      setError(extractErrorMessage(e, 'Création impossible — vérifiez votre profil fournisseur'));
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = categories.find((c) => c.id === form.categorie);

  return (
    <FormScreen>
      <Title>Nouvelle prestation</Title>
      <Subtitle>Présentez votre offre en 3 étapes.</Subtitle>
      <FormStepper steps={STEPS} current={step} onStepPress={setStep} />
      <ErrorBanner message={error} />

      {step === 0 ? (
        <View>
          <Text style={styles.label}>Dans quelle catégorie proposez-vous ?</Text>
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
                    type_prestation: c.nom || c.name || f.type_prestation,
                  }))
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <Field
            label="Intitulé"
            value={form.intitule}
            onChangeText={(v) => set('intitule', v)}
            autoCapitalize="sentences"
            placeholder="Ex. Installation électrique résidentielle"
          />
          <Field
            label="Description"
            value={form.description}
            onChangeText={(v) => set('description', v)}
            multiline
            autoCapitalize="sentences"
            placeholder="Compétences, délais, matériel inclus…"
          />
          <CityChipsPicker
            label="Zones d’intervention"
            selected={zonesSelected}
            onChange={setZonesSelected}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <Text style={styles.label}>Mode de tarification</Text>
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
                label="Tarif min (FCFA)"
                value={form.tarif_min}
                onChangeText={(v) => set('tarif_min', v)}
                keyboardType="numeric"
              />
              <Field
                label="Tarif max (FCFA)"
                value={form.tarif_max}
                onChangeText={(v) => set('tarif_max', v)}
                keyboardType="numeric"
              />
            </>
          ) : (
            <View style={styles.hintCard}>
              <Text style={styles.hintText}>
                Vous proposerez un devis après chaque match client.
              </Text>
            </View>
          )}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
            <Text style={styles.summaryLine}>
              {selectedCat?.nom || selectedCat?.name || '—'} · {form.intitule || 'Sans titre'}
            </Text>
            <Text style={styles.summaryLine}>
              {TARIF_LABELS[form.mode_tarification]}
              {form.zones_intervention ? ` · ${form.zones_intervention}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.nav}>
        {step < STEPS.length - 1 ? (
          <Button title="Continuer" onPress={goNext} icon="arrow-forward" />
        ) : (
          <Button
            title="Publier la prestation"
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
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
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
