import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ReviewModal from '../../components/ReviewModal';
import StarRating from '../../components/StarRating';
import {
  Button,
  ErrorBanner,
  Field,
  LoadingBlock,
  Screen,
  StatusBadge,
} from '../../components/ui';
import { colors, radii, spacing } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  clientConfirm,
  clientVerify,
  fetchTransaction,
  markWorkDone,
  proposeDevis,
  respondDevis,
  submitTransactionReview,
} from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { formatDate } from '../../utils/format';
import {
  labelDevisStatut,
  pickTransactionNextAction,
  pickTransactionReview,
  transactionSummary,
} from '../../utils/collaborationView';
import { hapticSuccess } from '../../utils/haptics';

const STEPS = [
  { key: 'devis', label: 'Devis' },
  { key: 'travail', label: 'Travail' },
  { key: 'verif', label: 'Vérif.' },
  { key: 'cloture', label: 'Clôture' },
];

function InfoLine({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function CollaborationDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { type_utilisateur } = useAuth();
  const isClient = type_utilisateur === 'client';
  const role = isClient ? 'client' : 'fournisseur';
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [montant, setMontant] = useState('');
  const [devisDesc, setDevisDesc] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setError(null);
    try {
      setTx(await fetchTransaction(id));
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

  const run = async (fn, okMsg) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (okMsg) Alert.alert('OK', okMsg);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e, 'Action impossible'));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !tx) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }

  if (!tx) {
    return (
      <Screen style={{ padding: spacing.lg }}>
        <ErrorBanner message={error || 'Introuvable'} />
      </Screen>
    );
  }

  const summary = transactionSummary(tx, role);
  const nextAction = pickTransactionNextAction(tx, role);
  const review = pickTransactionReview(tx);
  const devis = tx.devis_statut || 'non_requis';
  const verifDone = !!tx.verification_client_effectuee;
  const verifOk = !!tx.verification_client_validee;
  const workDone = !!tx.travail_fournisseur_termine;
  const stepIndex =
    tx.statut === 'terminee'
      ? 3
      : workDone || verifDone
        ? 2
        : devis === 'accepte_client' || devis === 'non_requis'
          ? 1
          : 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{summary.title}</Text>
        <View style={styles.badges}>
          <StatusBadge value={tx.statut} />
          {devis !== 'non_requis' ? <StatusBadge value={devis} /> : null}
        </View>

        {nextAction ? (
          <View style={styles.nextBanner}>
            <Ionicons name={nextAction.icon} size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nextBannerLabel}>Prochaine étape</Text>
              <Text style={styles.nextBannerText}>{nextAction.label}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <InfoLine icon="person-outline" label={summary.partnerLabel} value={summary.partner} />
          <InfoLine icon="document-text-outline" label="Besoin" value={summary.besoin} />
          <InfoLine icon="briefcase-outline" label="Prestation" value={summary.prestation} />
          <InfoLine icon="calendar-outline" label="Créée le" value={formatDate(tx.created_at)} />
          <InfoLine icon="time-outline" label="Mise à jour" value={formatDate(tx.updated_at)} />
          {tx.besoin_lieu_intervention ? (
            <InfoLine icon="location-outline" label="Lieu" value={tx.besoin_lieu_intervention} />
          ) : null}
          {devis !== 'non_requis' ? (
            <InfoLine icon="receipt-outline" label="Devis" value={labelDevisStatut(devis)} />
          ) : null}
        </View>

        <View style={styles.timeline}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={styles.step}>
              <View style={[styles.dot, i <= stepIndex && styles.dotActive]} />
              <Text style={[styles.stepLabel, i <= stepIndex && styles.stepActive]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <ErrorBanner message={error} />

        <View style={styles.box}>
          <Text style={styles.boxLabel}>Montant</Text>
          <Text style={styles.boxValue}>{summary.amount}</Text>
          {tx.devis_description ? <Text style={styles.boxDesc}>{tx.devis_description}</Text> : null}
        </View>

        {review ? (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewTitle}>Avis client</Text>
            <StarRating value={review.rating} size={18} showValue />
            {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
            <Text style={styles.reviewMeta}>
              {review.auteur ? `${review.auteur} · ` : ''}
              {review.date ? formatDate(review.date) : ''}
            </Text>
          </View>
        ) : null}

        {summary.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{summary.notes}</Text>
          </View>
        ) : null}

        {!isClient && devis === 'a_proposer' ? (
          <View style={styles.actionBlock}>
            <Text style={styles.actionTitle}>Proposer un devis</Text>
            <Field label="Montant (FCFA)" value={montant} onChangeText={setMontant} keyboardType="numeric" />
            <Field label="Détail" value={devisDesc} onChangeText={setDevisDesc} multiline />
            <Button
              title="Envoyer le devis"
              loading={busy}
              onPress={() =>
                run(
                  () => proposeDevis(id, { montant, description: devisDesc || 'Devis' }),
                  'Devis envoyé au client'
                )
              }
            />
          </View>
        ) : null}

        {isClient && devis === 'en_attente_client' ? (
          <View style={styles.actionBlock}>
            <Text style={styles.actionTitle}>Répondre au devis</Text>
            <Button
              title="Accepter le devis"
              loading={busy}
              onPress={() => run(() => respondDevis(id, 'accepter'), 'Devis accepté')}
            />
            <Button
              title="Rejeter"
              variant="danger"
              loading={busy}
              onPress={() => run(() => respondDevis(id, 'rejeter'), 'Devis rejeté')}
            />
          </View>
        ) : null}

        {!isClient &&
        (devis === 'accepte_client' || devis === 'non_requis') &&
        !workDone &&
        tx.statut !== 'terminee' ? (
          <Button
            title="Marquer le travail comme terminé"
            loading={busy}
            icon="checkmark-done-outline"
            onPress={() => run(() => markWorkDone(id), 'Travail signalé')}
          />
        ) : null}

        {isClient && workDone && !verifDone ? (
          <View style={styles.actionBlock}>
            <Text style={styles.actionTitle}>Vérifier le travail</Text>
            <Button
              title="Approuver"
              loading={busy}
              onPress={() => run(() => clientVerify(id, true), 'Travail approuvé')}
            />
            <Button
              title="Refuser"
              variant="danger"
              loading={busy}
              onPress={() => run(() => clientVerify(id, false), 'Travail refusé')}
            />
          </View>
        ) : null}

        {isClient && verifDone && verifOk && tx.statut !== 'terminee' ? (
          <Button
            title="Confirmer et clôturer"
            loading={busy}
            icon="ribbon-outline"
            onPress={() => run(() => clientConfirm(id), 'Collaboration terminée')}
          />
        ) : null}

        {isClient && tx.statut === 'terminee' && !review ? (
          <Button
            title="Laisser un avis"
            icon="star-outline"
            onPress={() => setReviewOpen(true)}
          />
        ) : null}

        <Button
          title="Messages"
          variant="secondary"
          icon="chatbubbles-outline"
          onPress={() =>
            navigation.navigate('MessageThread', {
              transactionId: id,
              partnerName: summary.partner,
              collabTitle: summary.title,
            })
          }
        />
        <Button title="Retour" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>

      <ReviewModal
        visible={reviewOpen}
        partnerName={summary.partner}
        loading={busy}
        onClose={() => setReviewOpen(false)}
        onSubmit={async ({ rating, comment }) => {
          setBusy(true);
          try {
            await submitTransactionReview(id, { rating, comment });
            hapticSuccess();
            setReviewOpen(false);
            showToast('Merci pour votre avis', 'success');
            await load();
          } catch (e) {
            setError(extractErrorMessage(e, 'Publication impossible'));
          } finally {
            setBusy(false);
          }
        }}
      />
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
  nextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  nextBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nextBannerText: { marginTop: 2, fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoLine: {
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
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: { alignItems: 'center', flex: 1 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginBottom: 6,
  },
  dotActive: { backgroundColor: colors.primary },
  stepLabel: { fontSize: 11, color: colors.textMuted },
  stepActive: { color: colors.primaryDark, fontWeight: '700' },
  box: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  boxLabel: { color: colors.textMuted, fontSize: 12 },
  boxValue: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, marginTop: 2 },
  boxDesc: { marginTop: 8, color: colors.text, lineHeight: 20 },
  notesBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  notesLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 6 },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  actionBlock: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTitle: { fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  reviewBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  reviewTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, marginBottom: spacing.sm },
  reviewComment: { marginTop: spacing.sm, color: colors.text, lineHeight: 20 },
  reviewMeta: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
});
