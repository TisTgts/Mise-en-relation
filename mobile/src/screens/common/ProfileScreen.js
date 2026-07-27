import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Button,
  Chip,
  ErrorBanner,
  Field,
  LoadingBlock,
  Screen,
} from '../../components/ui';
import CityChipsPicker from '../../components/CityChipsPicker';
import LocationMapPreview from '../../components/LocationMapPreview';
import LocationPicker from '../../components/LocationPicker';
import { colors, radii, shadows, spacing } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyProfile, updateMe, updateProfile } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { API_BASE_URL } from '../../config/api';
import { captureCurrentLocation } from '../../utils/geolocation';
import { parseLieuIntervention } from '../../utils/location';

function initialsOf(user) {
  const a = (user?.first_name || '').trim().charAt(0);
  const b = (user?.last_name || '').trim().charAt(0);
  const letters = `${a}${b}`.toUpperCase();
  if (letters) return letters;
  return (user?.email || '?').charAt(0).toUpperCase();
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const FREQUENCE_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'ponctuelle', label: 'Ponctuelle' },
  { value: 'mensuelle', label: 'Mensuelle' },
  { value: 'trimestrielle', label: 'Trimestrielle' },
  { value: 'annuelle', label: 'Annuelle' },
];

function parseEmplacementVille(emplacement) {
  if (!emplacement || typeof emplacement !== 'object') return '';
  return emplacement.ville || '';
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, type_utilisateur, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState(null);
  const isFournisseur = type_utilisateur === 'fournisseur';
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    telephone: user?.telephone || '',
  });
  const [enterprise, setEnterprise] = useState({
    raison_sociale: '',
    secteur_activite: '',
    taille_entreprise: '',
    contact_principal: '',
    frequence_besoins: '',
    ville: '',
    types_services: '',
    zones_couverture: '',
    annees_experience: '',
    tarif_horaire: '',
  });
  const [enterpriseInitial, setEnterpriseInitial] = useState(null);
  const [location, setLocation] = useState({ ville: '', quartier: '', adresse: '', label: '' });
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [zonesSelected, setZonesSelected] = useState([]);
  const [locating, setLocating] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const load = useCallback(async () => {
    setProfileError(null);
    try {
      const p = await fetchMyProfile();
      setProfile(p);
      const account = p?.user || user || {};
      setForm({
        first_name: account.first_name || '',
        last_name: account.last_name || '',
        telephone: account.telephone || '',
      });
      if (p?.user) {
        updateUser?.(p.user);
      }
      const emp = {
        raison_sociale: p.raison_sociale || '',
        secteur_activite: p.secteur_activite || '',
        taille_entreprise: p.taille_entreprise || '',
        contact_principal: p.contact_principal || '',
        frequence_besoins: p.frequence_besoins || '',
        ville: parseEmplacementVille(p.emplacement),
        types_services: Array.isArray(p.types_services_offerts)
          ? p.types_services_offerts.join(', ')
          : '',
        zones_couverture: Array.isArray(p.zones_couverture) ? p.zones_couverture.join(', ') : '',
        annees_experience:
          p.annees_experience != null && p.annees_experience !== '' ? String(p.annees_experience) : '',
        tarif_horaire:
          p.tarif_horaire != null && p.tarif_horaire !== '' ? String(p.tarif_horaire) : '',
      };
      setEnterprise(emp);
      setEnterpriseInitial(emp);
      const parsed = parseLieuIntervention(p.emplacement?.ville ? `${p.emplacement.ville}${p.emplacement.quartier ? ` — ${p.emplacement.quartier}` : ''}` : '');
      setLocation({
        ville: p.emplacement?.ville || parsed.ville || '',
        quartier: p.emplacement?.quartier || parsed.quartier || '',
        adresse: p.emplacement?.adresse || parsed.adresse || '',
        label: '',
      });
      setCoords({
        latitude: p.emplacement?.latitude ?? null,
        longitude: p.emplacement?.longitude ?? null,
      });
      setZonesSelected(Array.isArray(p.zones_couverture) ? p.zones_couverture : []);
    } catch (e) {
      setProfileError(extractErrorMessage(e, 'Impossible de charger le profil'));
    } finally {
      setLoading(false);
    }
  }, [updateUser, user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const dirty = useMemo(() => {
    const accountDirty =
      form.first_name !== (user?.first_name || '') ||
      form.last_name !== (user?.last_name || '') ||
      form.telephone !== (user?.telephone || '');
    const enterpriseDirty =
      enterpriseInitial &&
      JSON.stringify(enterprise) !== JSON.stringify(enterpriseInitial);
    return accountDirty || enterpriseDirty;
  }, [form, user, enterprise, enterpriseInitial]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSavedFlash(false);
    try {
      const me = await updateMe({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        telephone: form.telephone.trim(),
      });
      updateUser?.(me);

      const emplacement =
        profile?.emplacement && typeof profile.emplacement === 'object'
          ? { ...profile.emplacement }
          : {};
      if (location.ville?.trim()) emplacement.ville = location.ville.trim();
      if (location.quartier?.trim()) emplacement.quartier = location.quartier.trim();
      if (location.adresse?.trim()) emplacement.adresse = location.adresse.trim();
      if (coords.latitude != null && coords.longitude != null) {
        emplacement.latitude = coords.latitude;
        emplacement.longitude = coords.longitude;
      }

      if (isFournisseur) {
        await updateProfile({
          raison_sociale: enterprise.raison_sociale.trim(),
          types_services_offerts: splitList(enterprise.types_services),
          zones_couverture: zonesSelected.length ? zonesSelected : splitList(enterprise.zones_couverture),
          annees_experience: enterprise.annees_experience
            ? Number(enterprise.annees_experience)
            : null,
          tarif_horaire: enterprise.tarif_horaire ? Number(enterprise.tarif_horaire) : null,
          emplacement,
        });
      } else {
        await updateProfile({
          raison_sociale: enterprise.raison_sociale.trim(),
          secteur_activite: enterprise.secteur_activite.trim(),
          taille_entreprise: enterprise.taille_entreprise.trim(),
          contact_principal: enterprise.contact_principal.trim(),
          frequence_besoins: enterprise.frequence_besoins || '',
          emplacement,
        });
      }

      await load();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (e) {
      setError(extractErrorMessage(e, 'Enregistrement impossible'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
        },
      },
    ]);
  };

  const roleLabel = type_utilisateur === 'fournisseur' ? 'Fournisseur' : 'Client';
  const displayName =
    [form.first_name, form.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Mon profil';
  const ville = location.ville || enterprise.ville || profile?.ville || parseEmplacementVille(profile?.emplacement);
  const isPremium = !!(user?.matching_self_service || user?.client_abonnement_actif);

  const profileCompletion = useMemo(() => {
    const fields = isFournisseur
      ? [
          form.first_name,
          form.last_name,
          form.telephone,
          enterprise.raison_sociale,
          location.ville,
          enterprise.types_services,
          zonesSelected.length ? 'ok' : enterprise.zones_couverture,
          enterprise.annees_experience,
          enterprise.tarif_horaire,
        ]
      : [
          form.first_name,
          form.last_name,
          form.telephone,
          enterprise.raison_sociale,
          location.ville,
          enterprise.secteur_activite,
          enterprise.taille_entreprise,
          enterprise.contact_principal,
        ];
    const filled = fields.filter((v) => String(v || '').trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form, enterprise, isFournisseur, location.ville, zonesSelected.length]);

  return (
    <Screen edges={['left', 'right']} style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
        contentContainerStyle={{
          paddingBottom: 48 + Math.max(insets.bottom, 8) + 56,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.orbA} />
          <View style={styles.orbB} />

          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <Text style={styles.brand}>AppName</Text>
            <Text style={styles.heroEyebrow}>Mon compte</Text>

            <View style={styles.identity}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialsOf(user)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.roleOnHero}>{roleLabel}</Text>
              </View>
            </View>

            {isPremium ? (
              <View style={styles.premiumChip}>
                <Ionicons name="diamond-outline" size={14} color="#fff" />
                <Text style={styles.premiumChipText}>Matching Premium</Text>
              </View>
            ) : null}
          </Animated.View>
        </LinearGradient>

        <View style={[styles.sheet, shadows.card]}>
          {loading && !user ? <LoadingBlock /> : null}
          <ErrorBanner message={error || profileError} />

          {savedFlash ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.successText}>Profil enregistré</Text>
            </View>
          ) : null}

          {profileCompletion < 100 ? (
            <View style={styles.completionBox}>
              <View style={styles.completionHead}>
                <Text style={styles.completionTitle}>Profil complété à {profileCompletion}%</Text>
                <Text style={styles.completionHint}>
                  Un profil complet améliore la confiance et le matching.
                </Text>
              </View>
              <View style={styles.completionTrack}>
                <View style={[styles.completionFill, { width: `${profileCompletion}%` }]} />
              </View>
            </View>
          ) : (
            <View style={styles.completionDone}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.completionDoneText}>Profil complet</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Coordonnées</Text>
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
          <InfoRow icon="call-outline" label="Téléphone" value={form.telephone || user?.telephone} />
          {ville ? <InfoRow icon="location-outline" label="Ville" value={ville} /> : null}
          <InfoRow icon="shield-checkmark-outline" label="Rôle" value={roleLabel} />
          {enterprise.raison_sociale ? (
            <InfoRow icon="business-outline" label="Entreprise" value={enterprise.raison_sociale} />
          ) : null}
        </View>

        <View style={styles.formBlock}>
          <Text style={styles.sectionTitle}>Identité</Text>
          <Text style={styles.sectionHint}>Informations de contact visibles sur vos échanges.</Text>

          <Field
            label="Prénom"
            value={form.first_name}
            onChangeText={(v) => setForm((f) => ({ ...f, first_name: v }))}
            autoCapitalize="words"
            placeholder="Votre prénom"
          />
          <Field
            label="Nom"
            value={form.last_name}
            onChangeText={(v) => setForm((f) => ({ ...f, last_name: v }))}
            autoCapitalize="words"
            placeholder="Votre nom"
          />
          <Field
            label="Téléphone"
            value={form.telephone}
            onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))}
            keyboardType="phone-pad"
            placeholder="Ex. 90 00 00 00"
          />
        </View>

        <View style={styles.formBlock}>
          <Text style={styles.sectionTitle}>
            {isFournisseur ? 'Profil fournisseur' : 'Profil entreprise'}
          </Text>
          <Text style={styles.sectionHint}>
            Complétez votre profil pour améliorer le matching et la confiance.
          </Text>

          <Field
            label="Raison sociale"
            value={enterprise.raison_sociale}
            onChangeText={(v) => setEnterprise((e) => ({ ...e, raison_sociale: v }))}
            autoCapitalize="words"
          />

          <LocationPicker
            value={location}
            showAdresse
            onChange={(next) => {
              setLocation(next);
              setEnterprise((e) => ({ ...e, ville: next.ville || '' }));
            }}
          />

          <Button
            title="Utiliser ma position GPS"
            variant="secondary"
            icon="locate-outline"
            loading={locating}
            onPress={async () => {
              setLocating(true);
              setError(null);
              try {
                const pos = await captureCurrentLocation();
                setCoords({ latitude: pos.latitude, longitude: pos.longitude });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (e) {
                setError(extractErrorMessage(e, 'Localisation impossible'));
              } finally {
                setLocating(false);
              }
            }}
          />

          <LocationMapPreview
            latitude={coords.latitude}
            longitude={coords.longitude}
            title="Carte"
          />

          {isFournisseur ? (
            <>
              <Field
                label="Types de services (virgules)"
                value={enterprise.types_services}
                onChangeText={(v) => setEnterprise((e) => ({ ...e, types_services: v }))}
                placeholder="Plomberie, électricité…"
              />
              <CityChipsPicker
                label="Zones couvertes"
                selected={zonesSelected}
                onChange={setZonesSelected}
              />
              <Field
                label="Années d'expérience"
                value={enterprise.annees_experience}
                onChangeText={(v) => setEnterprise((e) => ({ ...e, annees_experience: v }))}
                keyboardType="numeric"
              />
              <Field
                label="Tarif horaire (FCFA)"
                value={enterprise.tarif_horaire}
                onChangeText={(v) => setEnterprise((e) => ({ ...e, tarif_horaire: v }))}
                keyboardType="numeric"
              />
            </>
          ) : (
            <>
              <Field
                label="Secteur d'activité"
                value={enterprise.secteur_activite}
                onChangeText={(v) => setEnterprise((e) => ({ ...e, secteur_activite: v }))}
              />
              <Field
                label="Taille entreprise"
                value={enterprise.taille_entreprise}
                onChangeText={(v) => setEnterprise((e) => ({ ...e, taille_entreprise: v }))}
                placeholder="TPE, PME, GE…"
              />
              <Field
                label="Contact principal"
                value={enterprise.contact_principal}
                onChangeText={(v) => setEnterprise((e) => ({ ...e, contact_principal: v }))}
              />
              <Text style={styles.chipLabel}>Fréquence des besoins</Text>
              <View style={styles.chips}>
                {FREQUENCE_OPTIONS.map((o) => (
                  <Chip
                    key={o.value || 'none'}
                    label={o.label}
                    selected={enterprise.frequence_besoins === o.value}
                    onPress={() => setEnterprise((e) => ({ ...e, frequence_besoins: o.value }))}
                  />
                ))}
              </View>
            </>
          )}

          <Button
            title={dirty ? 'Enregistrer tout' : 'Enregistrer'}
            onPress={onSave}
            loading={saving}
            disabled={!dirty && !saving}
            icon="save-outline"
          />
        </View>

        <View style={styles.logoutBlock}>
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </Pressable>
          {__DEV__ ? <Text style={styles.api}>API · {API_BASE_URL}</Text> : null}
        </View>
      </ScrollView>

      {dirty ? (
        <View style={[styles.stickySave, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.stickySaveBtn,
              (pressed || saving) && { opacity: 0.9 },
            ]}
          >
            {saving ? (
              <Text style={styles.stickySaveText}>Enregistrement…</Text>
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.stickySaveText}>Enregistrer les modifications</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 12,
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -20,
  },
  orbB: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(14,165,233,0.2)',
    bottom: 10,
    left: -30,
  },
  brand: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroEyebrow: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
  identity: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  roleOnHero: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  premiumChip: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  premiumChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sheet: {
    marginTop: -18,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 13,
  },
  completionBox: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  completionHead: { marginBottom: 10 },
  completionTitle: { fontSize: 14, fontWeight: '800', color: colors.primaryDark },
  completionHint: { marginTop: 4, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  completionTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  completionDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
    paddingVertical: 4,
  },
  completionDoneText: { fontSize: 13, fontWeight: '700', color: colors.success },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  formBlock: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  logoutBlock: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
  api: {
    marginTop: spacing.md,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stickySave: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 52,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(241, 245, 249, 0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stickySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  stickySaveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
