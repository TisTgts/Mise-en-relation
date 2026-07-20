import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  EmptyState,
  ErrorBanner,
  ListSkeleton,
  LoadingBlock,
  PageHeader,
  Screen,
} from '../../components/ui';
import { colors, radii, shadows, spacing } from '../../config/theme';
import { fetchPrestation, fetchTransactions, findMatchesForPrestation } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { formatMoney, pickTitle } from '../../utils/format';
import { hapticLight } from '../../utils/haptics';

function normalizeMatches(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.matches)) return payload.matches;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.correspondances)) return payload.correspondances;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function pickBesoinTitle(item) {
  return (
    item.besoin_details?.title ||
    item.besoin?.intitule ||
    pickTitle(item.besoin) ||
    `Besoin #${item.besoin_id || item.id}`
  );
}

function MatchCard({ item, acting, onContact }) {
  const score = item.score ?? item.score_total ?? item.matching_score;
  const title = pickBesoinTitle(item);
  const client = item.besoin_details?.client || item.client_nom;
  const place = item.besoin_details?.service_location || item.besoin?.lieu_intervention;
  const budget = item.besoin_details?.budget ?? item.besoin?.budget;
  const besoinId = item.besoin_id || item.besoin?.id;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          {client || place ? (
            <Text style={styles.cardSub} numberOfLines={2}>
              {[client, place].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
        {score != null ? (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>{Math.round(Number(score))}</Text>
            <Text style={styles.scoreLabel}>/100</Text>
          </View>
        ) : null}
      </View>
      {budget != null && budget !== '' ? (
        <View style={styles.budgetRow}>
          <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
          <Text style={styles.budgetText}>{formatMoney(budget)}</Text>
        </View>
      ) : null}
      <Button
        title="Voir la collaboration"
        variant="secondary"
        icon="people-outline"
        onPress={() => onContact(item)}
        loading={acting === besoinId}
      />
    </View>
  );
}

export default function PrestationMatchingScreen({ route, navigation }) {
  const { id } = route.params;
  const [prestation, setPrestation] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);
  const [ran, setRan] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await findMatchesForPrestation(id);
      setMatches(normalizeMatches(data));
      setRan(true);
    } catch (e) {
      setError(extractErrorMessage(e, 'Matching impossible'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadPrestation = useCallback(async () => {
    try {
      setPrestation(await fetchPrestation(id));
    } catch {
      /* optional */
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadPrestation();
      run();
    }, [loadPrestation, run])
  );

  const onContact = async (match) => {
    const besoinId = match.besoin_id || match.besoin?.id;
    if (!besoinId) {
      setError('Besoin introuvable dans le résultat');
      return;
    }
    hapticLight();
    setActing(besoinId);
    setError(null);
    try {
      const txs = await fetchTransactions();
      const existing = txs.find(
        (t) =>
          (t.besoin === besoinId || t.besoin?.id === besoinId) &&
          (t.prestation === id || t.prestation?.id === id)
      );
      if (existing) {
        navigation.navigate('CollaborationDetail', { id: existing.id });
        return;
      }
      Alert.alert(
        'Opportunité identifiée',
        'Le client doit confirmer le match depuis son espace. Surveillez vos collaborations et messages.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      setError(extractErrorMessage(e, 'Action impossible'));
    } finally {
      setActing(null);
    }
  };

  const listHeader = (
    <View>
      <PageHeader
        eyebrow="Matching"
        title={prestation ? pickTitle(prestation) : 'Besoins correspondants'}
        meta={
          ran
            ? `${matches.length} besoin${matches.length !== 1 ? 's' : ''} compatible${matches.length !== 1 ? 's' : ''}`
            : 'Recherche en cours…'
        }
      />
      <Text style={styles.hint}>
        Besoins clients compatibles avec votre prestation (score multi-critères).
      </Text>
      <ErrorBanner message={error} />
      <Button title="Relancer la recherche" variant="secondary" icon="refresh-outline" onPress={run} loading={loading} />
    </View>
  );

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      {loading && !ran ? (
        <>
          <View style={{ paddingHorizontal: spacing.lg }}>{listHeader}</View>
          <ListSkeleton count={3} />
        </>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item, index) => String(item.besoin_id || item.id || index)}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listPad}
          ListEmptyComponent={
            ran && !loading ? (
              <EmptyState
                icon="search-outline"
                title="Aucun besoin correspondant"
                subtitle="Affinez votre prestation ou réessayez plus tard."
                actionLabel="Modifier la prestation"
                onAction={() => navigation.navigate('PrestationEdit', { id })}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <MatchCard item={item} acting={acting} onContact={onContact} />
          )}
        />
      )}
      {loading && ran ? <LoadingBlock /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listPad: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  hint: { color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, lineHeight: 23 },
  cardSub: { marginTop: 4, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  scoreLabel: { fontSize: 10, fontWeight: '600', color: colors.primary },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  budgetText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
