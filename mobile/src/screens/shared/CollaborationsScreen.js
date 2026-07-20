import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
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
import {
  EmptyState,
  InlineError,
  ListSkeleton,
  PageHeader,
  Screen,
  StatusBadge,
} from '../../components/ui';
import { colors, radii, shadows, spacing } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useScreenLoad } from '../../hooks/useScreenLoad';
import { fetchTransactions } from '../../services/dataService';
import {
  pickTransactionPartner,
  pickTransactionTitle,
  pickTransactionNextAction,
  pickTransactionReview,
  TRANSACTION_FILTERS,
  transactionSummary,
} from '../../utils/collaborationView';

function CollaborationCard({ item, role, onPress }) {
  const summary = transactionSummary(item, role);
  const nextAction = pickTransactionNextAction(item, role);
  const review = pickTransactionReview(item);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, shadows.card, pressed && styles.cardPressed]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={2}>
            {summary.title}
          </Text>
          <Text style={styles.partner}>
            {summary.partnerLabel} · {summary.partner}
          </Text>
        </View>
        <StatusBadge value={item.statut} />
      </View>

      <View style={styles.metaRow}>
        {summary.prestation ? (
          <View style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {summary.prestation}
            </Text>
          </View>
        ) : null}
        {item.devis_statut && item.devis_statut !== 'non_requis' ? (
          <View style={[styles.tag, styles.tagDevis]}>
            <Text style={[styles.tagText, styles.tagDevisText]} numberOfLines={1}>
              {summary.devisLabel}
            </Text>
          </View>
        ) : null}
        {review ? (
          <View style={[styles.tag, styles.tagReview]}>
            <Text style={[styles.tagText, styles.tagReviewText]}>★ {review.rating}/5</Text>
          </View>
        ) : null}
      </View>

      {nextAction ? (
        <View style={styles.nextAction}>
          <Ionicons name={nextAction.icon} size={14} color={colors.primary} />
          <Text style={styles.nextActionText}>{nextAction.label}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.amount}>{summary.amount}</Text>
        <Text style={styles.date}>{summary.date}</Text>
      </View>
    </Pressable>
  );
}

export default function CollaborationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { type_utilisateur } = useAuth();
  const { refreshAppData } = useAppData();
  const role = type_utilisateur === 'fournisseur' ? 'fournisseur' : 'client';
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(async () => {
    setItems(await fetchTransactions());
    refreshAppData();
  }, [refreshAppData]);

  const { initialLoading, refreshing, error, retry, refresh } = useScreenLoad(load, [load]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((d) => {
      const title = pickTransactionTitle(d, role);
      const partner = pickTransactionPartner(d, role);
      const matchesSearch =
        !q ||
        title.toLowerCase().includes(q) ||
        partner.toLowerCase().includes(q) ||
        String(d.id).includes(q) ||
        d.besoin_intitule?.toLowerCase().includes(q) ||
        d.prestation_intitule?.toLowerCase().includes(q) ||
        d.devis_statut?.toLowerCase().includes(q);
      const review = pickTransactionReview(d);
      const matchesStatut =
        filter === 'all' ||
        (filter === 'avec_avis' && review) ||
        (filter === 'sans_avis' && !review && d.statut === 'terminee') ||
        (filter !== 'avec_avis' && filter !== 'sans_avis' && d.statut === filter);
      return matchesSearch && matchesStatut;
    });
  }, [items, searchTerm, filter, role]);

  const actives = filtered.filter(
    (t) => t.statut !== 'terminee' && t.statut !== 'annulee'
  ).length;
  const pendingActions = filtered.filter((t) => {
    const action = pickTransactionNextAction(t, role);
    return action && action.tone !== 'muted';
  }).length;

  const listHeader = (
    <View>
      <PageHeader
        title="Collaborations"
        meta={`${filtered.length} au total${actives > 0 ? ` · ${actives} active${actives > 1 ? 's' : ''}` : ''}${pendingActions > 0 ? ` · ${pendingActions} action${pendingActions > 1 ? 's' : ''}` : ''}`}
      />
      <InlineError message={error} onRetry={retry} />

      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Rechercher une collaboration…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          {searchTerm ? (
            <Pressable onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setFiltersOpen((v) => !v)}
            style={[styles.filterBtn, filtersOpen && styles.filterBtnOn]}
            accessibilityLabel="Filtres"
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={filtersOpen ? colors.primary : colors.textMuted}
            />
            {filter !== 'all' ? <View style={styles.filtersDot} /> : null}
          </Pressable>
        </View>

        {filtersOpen ? (
          <View style={styles.filtersBody}>
            <Text style={styles.filterLabel}>Statut</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {TRANSACTION_FILTERS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => setFilter(o.value)}
                  style={[styles.chip, filter === o.value && styles.chipOn]}
                >
                  <Text style={[styles.chipText, filter === o.value && styles.chipTextOn]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 28 + Math.max(insets.bottom, 8) + 56,
            flexGrow: filtered.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={error ? 'Données indisponibles' : items.length === 0 ? 'Pas encore de collaboration' : 'Aucun résultat'}
              subtitle={
                error
                  ? 'Vérifiez votre connexion puis réessayez.'
                  : items.length === 0
                    ? 'Elles apparaissent après un match confirmé entre client et fournisseur.'
                    : 'Ajustez vos filtres de recherche.'
              }
              actionLabel={
                items.length === 0 && !error
                  ? role === 'client'
                    ? 'Publier un besoin'
                    : 'Créer une prestation'
                  : undefined
              }
              onAction={
                items.length === 0 && !error
                  ? () =>
                      navigation.navigate(
                        role === 'client' ? 'BesoinCreate' : 'PrestationCreate'
                      )
                  : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <CollaborationCard
              item={item}
              role={role}
              onPress={() => navigation.navigate('CollaborationDetail', { id: item.id })}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextOn: { color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardPressed: { opacity: 0.96 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '700', fontSize: 16, color: colors.text, lineHeight: 22 },
  partner: { marginTop: 4, fontSize: 13, color: colors.textMuted },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tag: {
    maxWidth: '100%',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagDevis: { backgroundColor: colors.warningSoft, borderColor: colors.warningSoft },
  tagReview: { backgroundColor: colors.successSoft, borderColor: colors.successSoft },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  tagDevisText: { color: colors.warning },
  tagReviewText: { color: colors.success },
  nextAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
  },
  nextActionText: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.primary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  amount: { fontSize: 15, fontWeight: '800', color: colors.primary },
  date: { fontSize: 12, color: colors.textMuted },
});
