import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ErrorBanner, LoadingBlock, Screen, StatusBadge } from '../../components/ui';
import { colors, radii, spacing } from '../../config/theme';
import { deletePrestation, fetchPrestation } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { formatDate, formatMoney, pickTitle } from '../../utils/format';

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function PrestationDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setItem(await fetchPrestation(id));
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

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePrestation(id);
      setDeleteOpen(false);
      navigation.goBack();
    } catch (e) {
      setError(extractErrorMessage(e, 'Suppression impossible'));
    } finally {
      setDeleting(false);
    }
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
        <ErrorBanner message={error || 'Introuvable'} />
      </Screen>
    );
  }

  const category = item.categorie_nom || item.categorie?.nom || item.type_prestation;
  const zones = Array.isArray(item.zones_intervention)
    ? item.zones_intervention.join(', ')
    : null;
  const tarif =
    item.mode_tarification === 'devis'
      ? 'Sur devis'
      : `${formatMoney(item.tarif_min)} – ${formatMoney(item.tarif_max)}`;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>{pickTitle(item)}</Text>
        <View style={styles.badges}>
          <StatusBadge value={item.statut} />
        </View>
        <ErrorBanner message={error} />

        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.infoCard}>
          <InfoRow icon="grid-outline" label="Catégorie" value={category} />
          <InfoRow icon="cash-outline" label="Tarification" value={`${item.mode_tarification} · ${tarif}`} />
          <InfoRow icon="location-outline" label="Zones" value={zones} />
          <InfoRow icon="calendar-outline" label="Créée le" value={formatDate(item.created_at)} />
          <InfoRow icon="time-outline" label="Mise à jour" value={formatDate(item.updated_at)} />
        </View>

        <Button
          title="Besoins correspondants"
          icon="sparkles-outline"
          onPress={() => navigation.navigate('PrestationMatching', { id: item.id })}
          disabled={item.statut !== 'active'}
        />
        <Button
          title="Modifier"
          variant="secondary"
          icon="create-outline"
          onPress={() => navigation.navigate('PrestationEdit', { id: item.id })}
        />
        <Button title="Supprimer" variant="danger" onPress={() => setDeleteOpen(true)} />
        <Button title="Retour" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmer la suppression</Text>
            <Text style={styles.modalSub}>
              Supprimer « {pickTitle(item)} » ? Cette action est irréversible.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setDeleteOpen(false)} disabled={deleting}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.modalDelete} onPress={confirmDelete} disabled={deleting}>
                <Text style={styles.modalDeleteText}>{deleting ? '…' : 'Supprimer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingBottom: 48 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  desc: { fontSize: 15, lineHeight: 22, color: colors.text, marginBottom: spacing.lg },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { marginTop: 8, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontWeight: '700', color: colors.text },
  modalDelete: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.button.fillDanger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: { fontWeight: '700', color: '#fff' },
});
