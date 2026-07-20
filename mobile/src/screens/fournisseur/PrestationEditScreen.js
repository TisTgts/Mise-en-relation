import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FormScreen from '../../components/FormScreen';
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
import { fetchCategories, fetchPrestation, updatePrestation } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';

export default function PrestationEditScreen({ route, navigation }) {
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
    type_prestation: '',
    mode_tarification: 'devis',
    tarif_min: '',
    tarif_max: '',
    zones_intervention: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, presta] = await Promise.all([fetchCategories(), fetchPrestation(id)]);
        if (cancelled) return;
        setCategories(cats);
        const catId = presta.categorie?.id ?? presta.categorie;
        const zones = Array.isArray(presta.zones_intervention)
          ? presta.zones_intervention.join(', ')
          : '';
        setForm({
          categorie: catId,
          intitule: presta.intitule || '',
          description: presta.description || '',
          type_prestation: presta.type_prestation || presta.categorie_nom || '',
          mode_tarification: presta.mode_tarification || 'devis',
          tarif_min: presta.tarif_min != null ? String(presta.tarif_min) : '',
          tarif_max: presta.tarif_max != null ? String(presta.tarif_max) : '',
          zones_intervention: zones,
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
      setError('Intitulé, description et catégorie requis.');
      return;
    }
    setSaving(true);
    try {
      const zones = form.zones_intervention
        .split(',')
        .map((z) => z.trim())
        .filter(Boolean);
      const payload = {
        categorie: form.categorie,
        intitule: form.intitule.trim(),
        description: form.description.trim(),
        type_prestation: form.type_prestation || 'Service',
        zones_intervention: zones.length ? zones : ['National'],
        mode_tarification: form.mode_tarification,
      };
      if (form.mode_tarification !== 'devis') {
        payload.tarif_min = form.tarif_min || null;
        payload.tarif_max = form.tarif_max || null;
      }
      await updatePrestation(id, payload);
      showToast('Prestation modifiée.');
      navigation.navigate('PrestationDetail', { id });
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
      <Title>Modifier la prestation</Title>
        <Subtitle>Mettez à jour votre offre de service.</Subtitle>
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
                  type_prestation: c.nom || c.name || f.type_prestation,
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
        <Field
          label="Zones (séparées par des virgules)"
          value={form.zones_intervention}
          onChangeText={(v) => set('zones_intervention', v)}
          placeholder="Lomé, Kara"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Tarification</Text>
        <View style={styles.chips}>
          {['devis', 'forfait', 'horaire', 'fixe'].map((m) => (
            <Chip key={m} label={m} selected={form.mode_tarification === m} onPress={() => set('mode_tarification', m)} />
          ))}
        </View>
        {form.mode_tarification !== 'devis' ? (
          <>
            <Field label="Tarif min" value={form.tarif_min} onChangeText={(v) => set('tarif_min', v)} keyboardType="numeric" />
            <Field label="Tarif max" value={form.tarif_max} onChangeText={(v) => set('tarif_max', v)} keyboardType="numeric" />
          </>
        ) : null}

        <Button title="Enregistrer" onPress={onSubmit} loading={saving} icon="save-outline" />
        <Button title="Annuler" variant="ghost" onPress={() => navigation.goBack()} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
});
