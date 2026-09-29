import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BesoinPrecisionsFields, {
  cleanPrecisions,
  missingRequiredPrecisions,
} from '../../components/BesoinPrecisionsFields';
import FormScreen from '../../components/FormScreen';
import LocationPicker from '../../components/LocationPicker';
import {
  Button,
  Chip,
  ErrorBanner,
  Field,
  LoadingBlock,
  Screen,
  Subtitle,
  Title,
} from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { colors, spacing } from '../../config/theme';
import { fetchBesoin, fetchCategories, updateBesoin } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { parseLieuIntervention } from '../../utils/location';

export default function BesoinEditScreen({ route, navigation }) {
  const { showToast } = useToast();
  const { id } = route.params || {};
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [exigences, setExigences] = useState({});
  const [initialCategorie, setInitialCategorie] = useState(null);
  const [exigencesTouched, setExigencesTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const selectedCat = categories.find((c) => c.id === form.categorie);
  const specificFields = selectedCat?.champs_specifiques || [];
  const suggestedTypes = selectedCat?.types_service_suggeres || [];
  const serviceTypes =
    form.type_service && !suggestedTypes.includes(form.type_service) && form.categorie === initialCategorie
      ? [form.type_service, ...suggestedTypes]
      : suggestedTypes;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setError('Identifiant manquant');
        setLoading(false);
        return;
      }
      try {
        const [cats, besoin] = await Promise.all([fetchCategories(), fetchBesoin(id)]);
        if (cancelled) return;
        setCategories(cats);
        const catId = besoin.categorie?.id ?? besoin.categorie;
        setForm({
          categorie: catId,
          intitule: besoin.intitule || '',
          description: besoin.description || '',
          lieu_intervention: besoin.lieu_intervention || '',
          urgence: besoin.urgence || 'normale',
          mode_budget: besoin.mode_budget || 'sur_devis',
          budget: besoin.budget != null ? String(besoin.budget) : '',
          type_service: besoin.type_service || '',
        });
        setInitialCategorie(catId);
        setExigences(
          besoin.exigences && typeof besoin.exigences === 'object' ? besoin.exigences : {}
        );
        const parsed = parseLieuIntervention(besoin.lieu_intervention || '');
        setLocation({
          ...parsed,
          label: besoin.lieu_intervention || '',
        });
      } catch (e) {
        if (!cancelled) setError(extractErrorMessage(e, 'Chargement impossible'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const selectCategory = (c) => {
    if (c.id === form.categorie) return;
    setForm((f) => ({ ...f, categorie: c.id, type_service: '' }));
    setExigences({});
    setExigencesTouched(true);
    setFieldErrors({});
  };

  const setExigence = (key, value) => {
    setExigences((prev) => {
      const next = { ...prev };
      if (value == null || value === '') delete next[key];
      else next[key] = value;
      return next;
    });
    setExigencesTouched(true);
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: null }));
  };

  const onSubmit = async () => {
    setError(null);
    if (!form.intitule.trim() || !form.description.trim() || !form.categorie) {
      setError('Intitulé, description et catégorie sont requis.');
      return;
    }
    if (!location.ville?.trim()) {
      setError('Choisissez une ville d’intervention.');
      return;
    }
    const sendExigences = exigencesTouched || form.categorie !== initialCategorie;
    if (sendExigences) {
      const missing = missingRequiredPrecisions(specificFields, exigences);
      setFieldErrors(missing);
      if (Object.keys(missing).length > 0) {
        setError('Répondez aux précisions marquées *.');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        categorie: form.categorie,
        intitule: form.intitule.trim(),
        description: form.description.trim(),
        type_service: form.type_service || selectedCat?.nom || selectedCat?.name || 'Service',
        lieu_intervention: location.label?.trim() || form.lieu_intervention.trim() || 'À préciser',
        urgence: form.urgence,
        mode_budget: form.mode_budget,
        flexible: true,
      };
      if (sendExigences) payload.exigences = cleanPrecisions(exigences);
      if (form.mode_budget === 'budget_fixe') {
        payload.budget = form.budget || '0';
      }
      await updateBesoin(id, payload);
      showToast('Besoin modifié.');
      navigation.navigate('BesoinDetail', { id });
    } catch (e) {
      setError(extractErrorMessage(e, 'Modification impossible'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }

  return (
    <FormScreen>
      <Title>Modifier le besoin</Title>
        <Subtitle>Mettez à jour les informations de votre demande.</Subtitle>
        <ErrorBanner message={error} />

        <Text style={styles.label}>Catégorie</Text>
        <View style={styles.chips}>
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.nom || c.name || `#${c.id}`}
              selected={form.categorie === c.id}
              onPress={() => selectCategory(c)}
            />
          ))}
        </View>

        {serviceTypes.length > 0 ? (
          <>
            <Text style={styles.label}>Type de service</Text>
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
        ) : null}

        {specificFields.length > 0 ? (
          <View style={styles.precisions}>
            <Text style={styles.sectionTitle}>Précisions</Text>
            <BesoinPrecisionsFields
              fields={specificFields}
              values={exigences}
              errors={fieldErrors}
              onChange={setExigence}
            />
          </View>
        ) : null}

        <Field
          label="Intitulé"
          value={form.intitule}
          onChangeText={(v) => set('intitule', v)}
          autoCapitalize="sentences"
        />
        <Field
          label="Description"
          value={form.description}
          onChangeText={(v) => set('description', v)}
          multiline
          autoCapitalize="sentences"
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
          {['basse', 'normale', 'haute', 'urgente'].map((u) => (
            <Chip key={u} label={u} selected={form.urgence === u} onPress={() => set('urgence', u)} />
          ))}
        </View>

        <Text style={styles.label}>Budget</Text>
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
          />
        ) : null}

        <Button title="Enregistrer" onPress={onSubmit} loading={saving} icon="save-outline" />
        <Button title="Annuler" variant="ghost" onPress={() => navigation.goBack()} />
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
  precisions: { marginBottom: spacing.sm },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
});
