import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  ErrorBanner,
  LoadingBlock,
  Screen,
  StatusBadge,
} from '../../components/ui';
import { colors, radii, shadows, spacing } from '../../config/theme';
import { deleteBesoin, fetchBesoin } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { formatDate, formatMoney, pickTitle } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { hapticLight } from '../../utils/haptics';

const URGENCE_LABELS = {
  urgente: 'Urgente',
  haute: 'Haute',
  normale: 'Normale',
  basse: 'Basse',
};

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

export default function BesoinDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItem(await fetchBesoin(id));
    } catch (e) {
      setError(extractErrorMessage(e, 'Chargement impossible'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onDelete = () => {
    Alert.alert('Supprimer', 'Confirmer la suppression de ce besoin ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBesoin(id);
            showToast('Besoin supprimé.');
            navigation.goBack();
          } catch (e) {
            setError(extractErrorMessage(e, 'Suppression impossible'));
          }
        },
      },
    ]);
  };

  if (loading && !item) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen style={{ padding: spacing.lg }}>
        <ErrorBanner message={error || 'Besoin introuvable'} />
        <Button title="Retour" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const canLaunchMatch = !!(user?.matching_self_service || user?.client_abonnement_actif);
  const isOpen = item.statut === 'ouverte';
  const isCancelled = item.statut === 'annulee';
  const category = item.categorie_nom || item.categorie?.nom || item.type_service;
  const budgetLabel =
    item.mode_budget === 'budget_fixe' || item.budget != null
      ? formatMoney(item.budget)
      : 'Sur devis';

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.pad, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <Text style={styles.title}>{pickTitle(item)}</Text>
          <View style={styles.badges}>
            <StatusBadge value={item.statut} />
            {item.urgence && item.urgence !== 'normale' ? (
              <View style={styles.urgencyBadge}>
                <Text style={styles.urgencyText}>
                  {URGENCE_LABELS[item.urgence] || item.urgence}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <ErrorBanner message={error} />

        {item.description ? (
          <View style={[styles.block, shadows.card]}>
            <Text style={styles.blockTitle}>Description</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
        ) : null}

        <View style={[styles.block, shadows.card]}>
          <Text style={styles.blockTitle}>Informations</Text>
          <InfoRow icon="pricetag-outline" label="Catégorie" value={category} />
          <InfoRow icon="location-outline" label="Lieu" value={item.lieu_intervention} />
          <InfoRow icon="cash-outline" label="Budget" value={budgetLabel} />
          <InfoRow
            icon="calendar-outline"
            label="Date souhaitée"
            value={item.date_souhaitee ? formatDate(item.date_souhaitee) : null}
          />
          <InfoRow
            icon="time-outline"
            label="Date limite"
            value={item.date_limite ? formatDate(item.date_limite) : null}
          />
          <InfoRow icon="create-outline" label="Créé le" value={formatDate(item.created_at)} />
        </View>

        {isOpen && !canLaunchMatch ? (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.hintText}>
              Le lancement du matching est réservé au compte Premium. Vous pouvez consulter les
              correspondances déjà calculées.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {isOpen ? (
          <Button
            title={canLaunchMatch ? 'Lancer le matching' : 'Voir les correspondances'}
            icon="search-outline"
            onPress={() => {
              hapticLight();
              navigation.navigate('BesoinMatching', { id: item.id });
            }}
          />
        ) : null}
        {!isCancelled ? (
          <Button
            title="Modifier"
            variant="secondary"
            icon="create-outline"
            onPress={() => navigation.navigate('BesoinEdit', { id: item.id })}
          />
        ) : null}
        <Button title="Supprimer" variant="danger" icon="trash-outline" onPress={onDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg },
  head: { marginBottom: spacing.md },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  urgencyBadge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  urgencyText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  block: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  desc: { fontSize: 15, lineHeight: 22, color: colors.text },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
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
  infoLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  infoValue: { marginTop: 2, fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 20 },
  hintBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hintText: { flex: 1, fontSize: 13, color: colors.primaryDark, lineHeight: 19 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: 8,
  },
});
