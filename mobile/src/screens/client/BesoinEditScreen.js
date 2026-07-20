import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  const { id } = route.params;
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === form.categorie);
      const payload = {
        categorie: form.categorie,
        intitule: form.intitule.trim(),
        description: form.description.trim(),
        type_service: form.type_service || cat?.nom || cat?.name || 'Service',
        lieu_intervention: location.label?.trim() || form.lieu_intervention.trim() || 'À préciser',
        urgence: form.urgence,
        mode_budget: form.mode_budget,
        flexible: true,
      };
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
});
