import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BesoinPrecisionsFields, { cleanPrecisions } from '../../components/BesoinPrecisionsFields';
import CityChipsPicker from '../../components/CityChipsPicker';
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
import { extractErrorMessage, extractFieldErrors } from '../../services/authService';

const TARIF_LABELS = {
  devis: 'Sur devis',
  forfait: 'Prix par travail',
  horaire: "À l'heure",
};
const STATUT_LABELS = {
  active: 'Visible par les clients',
  inactive: 'En pause',
};
const OTHER = '__autre__';

const categoryName = (c) => c?.nom || c?.name || '';

export default function PrestationEditScreen({ route, navigation }) {
  const { showToast } = useToast();
  const { id } = route.params || {};
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    statut: 'active',
  });
  const [typeChoice, setTypeChoice] = useState('');
  const [precisions, setPrecisions] = useState({});
  const [zones, setZones] = useState([]);

  const selectedCat = categories.find((c) => c.id === form.categorie);
  const serviceTypes = selectedCat?.types_service_suggeres || [];
  const questions = selectedCat?.champs_prestation || [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setError('Prestation introuvable.');
        setLoading(false);
        return;
      }
      try {
        const [cats, presta] = await Promise.all([fetchCategories(), fetchPrestation(id)]);
        if (cancelled) return;
        setCategories(cats);
        const catId = presta.categorie?.id ?? presta.categorie;
        const cat = cats.find((c) => c.id === catId);
        const types = cat?.types_service_suggeres || [];
        const rawType = (presta.type_prestation || '').trim();
        const generic = !rawType || rawType === categoryName(cat) || rawType.toLowerCase() === 'service';
        const type = generic ? '' : rawType;
        setTypeChoice(!type ? '' : types.includes(type) ? type : OTHER);
        setForm({
          categorie: catId,
          type_prestation: type,
          intitule: presta.intitule || '',
          description: presta.description || '',
          mode_tarification: presta.mode_tarification || 'devis',
          tarif_min: presta.tarif_min != null ? String(Math.round(Number(presta.tarif_min))) : '',
          tarif_max: presta.tarif_max != null ? String(Math.round(Number(presta.tarif_max))) : '',
          statut: presta.statut || 'active',
        });
        const carac = presta.caracteristiques;
        setPrecisions(carac && typeof carac === 'object' && !Array.isArray(carac) ? carac : {});
        setZones(Array.isArray(presta.zones_intervention) ? presta.zones_intervention.filter(Boolean) : []);
      } catch (e) {
        if (!cancelled) setError(extractErrorMessage(e, 'Impossible de charger cette prestation. Réessayez.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const set = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((prev) => ({ ...prev, [k]: null }));
  };

  const selectCategory = (c) => {
    if (c.id === form.categorie) return;
    setForm((f) => ({ ...f, categorie: c.id, type_prestation: '' }));
    setTypeChoice('');
    setPrecisions({});
  };

  const selectType = (t) => {
    const next = typeChoice === t ? '' : t;
    setTypeChoice(next);
    set('type_prestation', next === OTHER ? '' : next);
  };

  const validate = () => {
    const next = {};
    if (!form.type_prestation.trim()) next.type_prestation = 'Choisissez le type de service que vous proposez.';
    if (!form.intitule.trim()) next.intitule = 'Donnez un titre à votre prestation';
    if (!form.description.trim()) next.description = 'Décrivez votre offre';
    if (!zones.map((z) => z.trim()).filter(Boolean).length) next.zones_intervention = 'Choisissez au moins une ville.';
    if (form.mode_tarification !== 'devis') {
      const min = String(form.tarif_min).trim();
      const max = String(form.tarif_max).trim();
      if (!min && !max) next.tarif_min = 'Indiquez au moins un prix';
      if (min && max && Number(min) > Number(max)) next.tarif_max = 'Doit être supérieur au prix minimum';
    }
    setFieldErrors(next);
    return next;
  };

  const onSubmit = async () => {
    setError(null);
    const next = validate();
    if (Object.keys(next).length) {
      setError(next.type_prestation || next.zones_intervention || 'Complétez les champs marqués.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categorie: form.categorie,
        intitule: form.intitule.trim(),
        description: form.description.trim(),
        type_prestation: form.type_prestation.trim(),
        caracteristiques: cleanPrecisions(precisions),
        zones_intervention: zones.map((z) => z.trim()).filter(Boolean),
        mode_tarification: form.mode_tarification,
        tarif_min: form.mode_tarification !== 'devis' ? form.tarif_min || null : null,
        tarif_max: form.mode_tarification !== 'devis' ? form.tarif_max || null : null,
      };
      if (STATUT_LABELS[form.statut]) payload.statut = form.statut;
      await updatePrestation(id, payload);
      showToast('Prestation modifiée.');
      navigation.navigate('PrestationDetail', { id });
    } catch (e) {
      const serverFields = extractFieldErrors(e);
      setProfileMismatch(Boolean(serverFields.type_prestation));
      setFieldErrors(serverFields);
      setError(extractErrorMessage(e, "Les modifications n'ont pas pu être enregistrées. Réessayez."));
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
      {profileMismatch ? (
        <Button
          title="Compléter mes types de services"
          variant="secondary"
          icon="person-circle-outline"
          onPress={() => navigation.navigate('Tabs', { screen: 'ProfilTab' })}
        />
      ) : null}

      <Text style={styles.label}>Catégorie</Text>
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

      <Text style={styles.label}>Quel service proposez-vous ? *</Text>
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

      <Field
        label="Titre de la prestation *"
        value={form.intitule}
        onChangeText={(v) => set('intitule', v)}
        error={fieldErrors.intitule}
        autoCapitalize="sentences"
      />
      <Field
        label="Description *"
        value={form.description}
        onChangeText={(v) => set('description', v)}
        error={fieldErrors.description}
        multiline
        autoCapitalize="sentences"
      />

      {questions.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Quelques précisions (facultatif)</Text>
          <BesoinPrecisionsFields
            fields={questions}
            values={precisions}
            errors={fieldErrors}
            onChange={(key, value) => setPrecisions((prev) => ({ ...prev, [key]: value }))}
          />
        </>
      ) : null}

      <CityChipsPicker label="Dans quelles villes intervenez-vous ? *" selected={zones} onChange={setZones} />
      {fieldErrors.zones_intervention ? <Text style={styles.error}>{fieldErrors.zones_intervention}</Text> : null}

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
            label="Prix à partir de (FCFA)"
            value={form.tarif_min}
            onChangeText={(v) => set('tarif_min', v.replace(/[^0-9]/g, ''))}
            error={fieldErrors.tarif_min}
            keyboardType="numeric"
          />
          <Field
            label="Jusqu’à (FCFA)"
            value={form.tarif_max}
            onChangeText={(v) => set('tarif_max', v.replace(/[^0-9]/g, ''))}
            error={fieldErrors.tarif_max}
            keyboardType="numeric"
          />
        </>
      ) : null}

      {STATUT_LABELS[form.statut] ? (
        <>
          <Text style={styles.label}>Visibilité</Text>
          <View style={styles.chips}>
            {Object.entries(STATUT_LABELS).map(([value, label]) => (
              <Chip key={value} label={label} selected={form.statut === value} onPress={() => set('statut', value)} />
            ))}
          </View>
        </>
      ) : null}

      <Button title="Enregistrer" onPress={onSubmit} loading={saving} icon="save-outline" />
      <Button title="Annuler" variant="ghost" onPress={() => navigation.goBack()} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: spacing.xs },
  error: { fontSize: 12, color: colors.danger, marginTop: -spacing.xs, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
});
