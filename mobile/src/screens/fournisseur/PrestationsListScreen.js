import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionSheet from '../../components/ActionSheet';
import {
  EmptyState,
  InlineError,
  ListSkeleton,
  PageHeader,
  Screen,
  StatusBadge,
} from '../../components/ui';
import { colors, radii, shadows, spacing } from '../../config/theme';
import { useToast } from '../../contexts/ToastContext';
import { useScreenLoad } from '../../hooks/useScreenLoad';
import { deletePrestation, fetchMyPrestations } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { formatMoney, pickTitle, relativeDate } from '../../utils/format';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

const STATUT_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'active', label: 'Actives' },
  { value: 'inactive', label: 'Inactives' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date' },
  { value: 'tarif', label: 'Tarif' },
  { value: 'intitule', label: 'Nom' },
];

function StatPill({ label, value, icon, accent }) {
  return (
    <View style={[styles.statPill, accent && { borderColor: accent, backgroundColor: `${accent}08` }]}>
      <Ionicons name={icon} size={16} color={accent || colors.textMuted} />
      <Text style={[styles.statValue, accent && { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatTarif(item) {
  if (item.mode_tarification === 'devis') return 'Sur devis';
  if (item.tarif_min != null && item.tarif_max != null) {
    return `${formatMoney(item.tarif_min)} – ${formatMoney(item.tarif_max)}`;
  }
  if (item.tarif_min != null) return `À partir de ${formatMoney(item.tarif_min)}`;
  return 'Sur devis';
}

function PrestationItem({ item, onView, onOpenMenu }) {
  const category = item.categorie_nom || item.categorie?.nom || item.type_service || '—';
  const zones = Array.isArray(item.zones_intervention)
    ? item.zones_intervention.join(', ')
    : item.lieu_intervention || 'À préciser';
  const isActive = item.statut === 'active';
  const description = typeof item.description === 'string' ? item.description.trim() : '';
  const title = pickTitle(item);

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <StatusBadge value={item.statut} />
          <Text style={styles.cardDate}>{relativeDate(item.created_at)}</Text>
        </View>
        <Pressable
          onPress={() => onOpenMenu(item)}
          hitSlop={10}
          style={styles.menuBtn}
          accessibilityLabel="Actions"
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable onPress={onView} style={({ pressed }) => [pressed && styles.cardPressed]}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>

        {description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {zones}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {category}
              </Text>
            </View>
          </View>
          <Text style={styles.budgetText}>{formatTarif(item)}</Text>
        </View>

        {isActive ? (
          <View style={styles.matchHint}>
            <Ionicons name="search-outline" size={14} color={colors.primary} />
            <Text style={styles.matchHintText}>Besoins correspondants disponibles</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

export default function PrestationsListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setItems(await fetchMyPrestations());
  }, []);

  const { initialLoading, refreshing, error, retry, refresh } = useScreenLoad(loadData, [loadData]);

  const baseFiltered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((d) => {
      const matchesSearch =
        !q ||
        d.intitule?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.type_service?.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [items, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts = { all: baseFiltered.length };
    for (const opt of STATUT_OPTIONS) {
      if (opt.value === 'all') continue;
      counts[opt.value] = baseFiltered.filter((d) => d.statut === opt.value).length;
    }
    return counts;
  }, [baseFiltered]);

  const filtered = useMemo(() => {
    let list = baseFiltered.filter((d) => filter === 'all' || d.statut === filter);

    list = [...list].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'created_at') {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      } else if (sortBy === 'tarif') {
        comparison = Number(a.tarif_min || 0) - Number(b.tarif_min || 0);
      } else if (sortBy === 'intitule') {
        comparison = (a.intitule || '').localeCompare(b.intitule || '');
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return list;
  }, [baseFiltered, filter, sortBy, sortOrder]);

  const stats = useMemo(
    () => ({
      total: baseFiltered.length,
      actives: statusCounts.active || 0,
      inactives: statusCounts.inactive || 0,
    }),
    [baseFiltered, statusCounts]
  );

  const activeFilters =
    (searchTerm.trim() ? 1 : 0) + (sortBy !== 'created_at' || sortOrder !== 'desc' ? 1 : 0);

  const resetFilters = () => {
    setSearchTerm('');
    setFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePrestation(deleteTarget.id);
      setItems((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      hapticSuccess();
      showToast('Prestation supprimée.');
    } catch (e) {
      showToast(extractErrorMessage(e, 'Suppression impossible'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const goCreate = () => {
    hapticLight();
    navigation.navigate('PrestationCreate');
  };

  const openMenu = (item) => {
    hapticLight();
    setMenuItem(item);
  };

  const closeMenu = () => setMenuItem(null);

  const sheetActions = useMemo(() => {
    if (!menuItem) return [];
    const isActive = menuItem.statut === 'active';
    const run = (fn) => () => {
      closeMenu();
      fn();
    };

    const actions = [
      {
        key: 'view',
        icon: 'eye-outline',
        label: 'Voir le détail',
        subtitle: 'Description, tarifs, zones',
        onPress: run(() => navigation.navigate('PrestationDetail', { id: menuItem.id })),
      },
      {
        key: 'edit',
        icon: 'create-outline',
        label: 'Modifier',
        subtitle: 'Intitulé, description, tarification…',
        onPress: run(() => navigation.navigate('PrestationEdit', { id: menuItem.id })),
      },
    ];

    if (isActive) {
      actions.push({
        key: 'match',
        icon: 'search-outline',
        label: 'Besoins correspondants',
        subtitle: 'Trouver des clients compatibles',
        onPress: run(() => navigation.navigate('PrestationMatching', { id: menuItem.id })),
      });
    }

    actions.push({
      key: 'delete',
      icon: 'trash-outline',
      label: 'Supprimer',
      subtitle: 'Action définitive',
      danger: true,
      onPress: run(() => setDeleteTarget(menuItem)),
    });

    return actions;
  }, [menuItem, navigation]);

  const listHeader = (
    <View>
      <PageHeader
        eyebrow="Espace fournisseur"
        title="Prestations"
        meta={
          filter === 'all'
            ? `${stats.total} prestation${stats.total !== 1 ? 's' : ''}`
            : `${filtered.length} affichée${filtered.length !== 1 ? 's' : ''} · ${stats.total} au total`
        }
        onAdd={goCreate}
        addLabel="Nouvelle prestation"
      />
      <InlineError message={error} onRetry={retry} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <StatPill label="Total" value={stats.total} icon="briefcase-outline" />
        <StatPill label="Actives" value={stats.actives} icon="radio-button-on-outline" accent={colors.success} />
        <StatPill label="Inactives" value={stats.inactives} icon="pause-circle-outline" accent={colors.textMuted} />
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFilters}
      >
        {STATUT_OPTIONS.map((o) => {
          const count = statusCounts[o.value] ?? 0;
          const selected = filter === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                hapticLight();
                setFilter(o.value);
              }}
              style={[styles.quickChip, selected && styles.quickChipOn]}
            >
              <Text style={[styles.quickChipText, selected && styles.quickChipTextOn]}>{o.label}</Text>
              {count > 0 ? (
                <View style={[styles.quickChipBadge, selected && styles.quickChipBadgeOn]}>
                  <Text style={[styles.quickChipBadgeText, selected && styles.quickChipBadgeTextOn]}>
                    {count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Rechercher une prestation…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          {searchTerm ? (
            <Pressable onPress={() => setSearchTerm('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setFiltersOpen((v) => !v)}
            style={[styles.filterBtn, filtersOpen && styles.filterBtnOn]}
            accessibilityLabel="Filtres avancés"
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={filtersOpen || activeFilters > 0 ? colors.primary : colors.textMuted}
            />
            {activeFilters > 0 ? <View style={styles.filtersDot} /> : null}
          </Pressable>
        </View>

        {activeFilters > 0 ? (
          <Pressable onPress={resetFilters} style={styles.resetFilters}>
            <Text style={styles.resetFiltersText}>
              {activeFilters} filtre{activeFilters > 1 ? 's' : ''} avancé{activeFilters > 1 ? 's' : ''} · Réinitialiser
            </Text>
          </Pressable>
        ) : null}

        {filtersOpen ? (
          <View style={styles.filtersBody}>
            <Text style={styles.filterLabel}>Trier par</Text>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => setSortBy(o.value)}
                  style={[styles.chip, sortBy === o.value && styles.chipOn]}
                >
                  <Text style={[styles.chipText, sortBy === o.value && styles.chipTextOn]}>{o.label}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                style={[styles.chip, styles.chipOrder]}
              >
                <Ionicons
                  name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'}
                  size={14}
                  color={colors.primaryDark}
                />
                <Text style={[styles.chipText, { color: colors.primaryDark }]}>
                  {sortOrder === 'desc' ? 'Récent' : 'Ancien'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      {initialLoading ? (
        <>
          <View style={{ paddingHorizontal: spacing.lg }}>{listHeader}</View>
          <ListSkeleton count={4} />
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 28 + Math.max(insets.bottom, 8) + 56,
            flexGrow: filtered.length === 0 ? 1 : undefined,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title={
                error
                  ? 'Données indisponibles'
                  : items.length === 0
                    ? 'Aucune offre'
                    : filter !== 'all'
                      ? `Aucune prestation ${STATUT_OPTIONS.find((o) => o.value === filter)?.label?.toLowerCase() || ''}`
                      : 'Aucun résultat'
              }
              subtitle={
                error
                  ? 'Vérifiez votre connexion puis réessayez.'
                  : items.length === 0
                    ? 'Publiez votre première prestation pour apparaître dans le matching.'
                    : 'Ajustez votre recherche ou vos filtres.'
              }
              actionLabel={
                items.length === 0 && !error
                  ? 'Créer une prestation'
                  : filter !== 'all' || activeFilters > 0 || searchTerm
                    ? 'Voir toutes les prestations'
                    : undefined
              }
              onAction={() => {
                if (items.length === 0 && !error) goCreate();
                else resetFilters();
              }}
            />
          }
          renderItem={({ item }) => (
            <PrestationItem
              item={item}
              onView={() => navigation.navigate('PrestationDetail', { id: item.id })}
              onOpenMenu={openMenu}
            />
          )}
        />
      )}

      <ActionSheet
        visible={!!menuItem}
        onClose={closeMenu}
        title={menuItem ? pickTitle(menuItem) : ''}
        subtitle={
          menuItem
            ? `${Array.isArray(menuItem.zones_intervention) ? menuItem.zones_intervention.join(', ') : 'Zones à préciser'} · ${formatTarif(menuItem)}`
            : ''
        }
        badge={menuItem ? <StatusBadge value={menuItem.statut} /> : null}
        actions={sheetActions}
      />

      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmer la suppression</Text>
            <Text style={styles.modalSub}>
              Supprimer « {pickTitle(deleteTarget)} » ? Cette action est irréversible.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setDeleteTarget(null)}
                disabled={deleting}
              >
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
  statsRow: { gap: 10, paddingBottom: spacing.md },
  statPill: {
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  quickFilters: { gap: 8, paddingBottom: spacing.md },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  quickChipTextOn: { color: '#fff' },
  quickChipBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickChipBadgeOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  quickChipBadgeText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  quickChipBadgeTextOn: { color: '#fff' },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, padding: 0 },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    position: 'relative',
  },
  filterBtnOn: { backgroundColor: colors.primaryMuted },
  resetFilters: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 4 },
  resetFiltersText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  filtersDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  filtersBody: { marginTop: 12 },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextOn: { color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardPressed: { opacity: 0.96 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  cardDate: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, lineHeight: 23, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaText: { flex: 1, fontSize: 13, color: colors.textMuted },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    maxWidth: '70%',
  },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.text },
  budgetText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  matchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  matchHintText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.primary },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  modalSub: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: { fontWeight: '700', color: colors.text },
  modalDelete: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.button.fillDanger,
  },
  modalDeleteText: { fontWeight: '700', color: '#fff' },
});
