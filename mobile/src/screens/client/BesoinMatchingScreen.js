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
import StarRating from '../../components/StarRating';
import { colors, radii, shadows, spacing } from '../../config/theme';
import { useToast } from '../../contexts/ToastContext';
import { confirmerMatch, fetchBesoin, findMatchesForBesoin } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { formatMoney, pickTitle } from '../../utils/format';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { normalizeMatches } from '../../utils/matchingView';

function MatchCard({ item, acting, onConfirm }) {
  const score = item.score ?? item.score_total ?? item.matching_score;
  const title =
    pickTitle(item.prestation || item) ||
    item.fournisseur_nom ||
    `Prestation #${item.prestation_id || item.id}`;
  const prestationId = item.prestation_id || item.prestation?.id || item.id;
  const subtitle = [item.fournisseur_nom, item.ville, item.zones_intervention?.join?.(', ')]
    .filter(Boolean)
    .join(' · ');
  const tarif =
    item.tarif_min != null
      ? formatMoney(item.tarif_min)
      : item.prestation?.tarif_min != null
        ? formatMoney(item.prestation.tarif_min)
        : null;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.cardSub} numberOfLines={2}>
              {subtitle}
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

      {tarif ? (
        <View style={styles.tarifRow}>
          <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
          <Text style={styles.tarifText}>À partir de {tarif}</Text>
        </View>
      ) : null}

      {item.note_moyenne ? (
        <View style={styles.ratingRow}>
          <StarRating value={Number(item.note_moyenne)} size={14} showValue />
        </View>
      ) : null}

      <View style={styles.cardActions}>
        <Button
          title="Choisir ce fournisseur"
          icon="checkmark-circle-outline"
          onPress={() => onConfirm(item)}
          loading={acting === prestationId}
        />
      </View>
    </View>
  );
}

export default function BesoinMatchingScreen({ route, navigation }) {
  const { id } = route.params;
  const { showToast } = useToast();
  const [besoin, setBesoin] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);
  const [ran, setRan] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await findMatchesForBesoin(id);
      setMatches(normalizeMatches(data));
      setRan(true);
    } catch (e) {
      setError(extractErrorMessage(e, 'Matching impossible'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadBesoin = useCallback(async () => {
    try {
      setBesoin(await fetchBesoin(id));
    } catch {
      /* optional context */
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadBesoin();
      run();
    }, [loadBesoin, run])
  );

  const onConfirm = (match) => {
    const prestationId =
      match.prestation_id || match.prestation?.id || match.offer_id || match.id;
    if (!prestationId) {
      setError('Prestation introuvable dans le résultat');
      return;
    }

    hapticLight();
    Alert.alert(
      'Confirmer le match',
      'Démarrer une collaboration avec ce fournisseur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setActing(prestationId);
            setError(null);
            try {
              const res = await confirmerMatch({
                besoin_id: id,
                prestation_id: prestationId,
              });
              hapticSuccess();
              showToast(res.awaiting_quote ? 'Match confirmé — devis en attente.' : 'Collaboration créée.');
              const txId = res.transaction_id || res.transaction?.id;
              if (txId) navigation.replace('CollaborationDetail', { id: txId });
              else navigation.navigate('CollabTab');
            } catch (e) {
              setError(extractErrorMessage(e, 'Confirmation impossible'));
            } finally {
              setActing(null);
            }
          },
        },
      ]
    );
  };

  const listHeader = (
    <View>
      <PageHeader
        eyebrow="Matching"
        title={besoin ? pickTitle(besoin) : 'Correspondances'}
        meta={
          ran
            ? `${matches.length} résultat${matches.length !== 1 ? 's' : ''}`
            : 'Recherche en cours…'
        }
      />
      <Text style={styles.hint}>
        Algorithme multi-critères : compétence, zone, fiabilité et budget.
      </Text>
      <ErrorBanner message={error} />
      <Button
        title="Relancer la recherche"
        variant="secondary"
        icon="refresh-outline"
        onPress={run}
        loading={loading}
      />
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
          keyExtractor={(item, index) => String(item.prestation_id || item.id || index)}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listPad}
          ListEmptyComponent={
            ran && !loading ? (
              <EmptyState
                icon="search-outline"
                title="Aucune correspondance"
                subtitle="Élargissez la zone, ajustez le budget ou modifiez votre besoin."
                actionLabel="Modifier le besoin"
                onAction={() => navigation.navigate('BesoinEdit', { id })}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <MatchCard item={item} acting={acting} onConfirm={onConfirm} />
          )}
        />
      )}

      {loading && ran ? <LoadingBlock /> : null}

      <View style={styles.footer}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>Retour au besoin</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listPad: { paddingHorizontal: spacing.lg, paddingBottom: 80 },
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
  tarifRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tarifText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  ratingRow: { marginBottom: spacing.sm },
  cardActions: { marginTop: 4 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  backText: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
