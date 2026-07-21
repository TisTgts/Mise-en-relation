import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityItem,
  ActivityStrip,
  HomeHero,
  HomeSection,
  QuietEmpty,
  ShortcutRow,
} from '../../components/HomeShell';
import { InlineError, ListSkeleton, Screen, StatusBadge } from '../../components/ui';
import { colors } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { fetchMessages, fetchMyPrestations, fetchTransactions } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { transactionSummary } from '../../utils/collaborationView';
import { getUserId } from '../../utils/messageThreads';
import { pickTitle } from '../../utils/format';

export default function FournisseurHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refreshAppData } = useAppData();
  const [prestations, setPrestations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoaded = useRef(false);

  const load = useCallback(
    async (mode = 'initial') => {
      if (mode === 'refresh') setRefreshing(true);
      else if (!hasLoaded.current) setInitialLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          fetchMyPrestations(),
          fetchTransactions(),
          fetchMessages(),
        ]);
        const [p, t, m] = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
        if (p) setPrestations(p);
        if (t) setTransactions(t);
        if (m) setMessages(m);
        const failed = results.find((r) => r.status === 'rejected');
        if (failed) {
          setError(extractErrorMessage(failed.reason, 'Impossible de charger l\'accueil'));
        } else {
          refreshAppData();
        }
        if (p || t || m) hasLoaded.current = true;
      } catch (e) {
        setError(extractErrorMessage(e, 'Impossible de charger l\'accueil'));
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [refreshAppData]
  );

  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current ? 'refresh' : 'initial');
    }, [load])
  );

  const activesList = prestations.filter((i) => i.statut === 'active');
  const actives = activesList.length;
  const recentPrestations = activesList.slice(0, 3);
  const pendingDevis = transactions.filter((t) => t.devis_statut === 'a_proposer');
  const collabsActives = transactions.filter(
    (t) => t.statut !== 'terminee' && t.statut !== 'annulee'
  );
  const recentCollabs = collabsActives.slice(0, 4);
  const unread = messages.filter(
    (m) => getUserId(m.destinataire) === user?.id && !m.lu
  ).length;

  return (
    <Screen edges={['left', 'right']} style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={colors.primary} />
        }
        contentContainerStyle={{
          paddingBottom: 36 + Math.max(insets.bottom, 8) + 56,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top }}>
          <HomeHero
            firstName={user?.first_name}
            roleLabel="Espace fournisseur"
            subtitle="Proposez vos services, répondez aux devis, développez votre activité."
            ctaLabel="Nouvelle prestation"
            onCta={() => navigation.navigate('PrestationCreate')}
          />
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 24 }}>
            <InlineError message={error} onRetry={() => load('initial')} />
          </View>
        ) : null}

        <ActivityStrip
          items={[
            { label: 'Prestations', value: actives },
            { label: 'Devis à faire', value: pendingDevis.length },
            { label: 'Messages', value: unread || messages.length },
          ]}
        />

        <HomeSection title="Aller à">
          <ShortcutRow
            icon="briefcase-outline"
            label="Mes prestations"
            hint={actives > 0 ? `${actives} active${actives > 1 ? 's' : ''}` : 'Publier une offre'}
            onPress={() => navigation.navigate('PrestationsTab')}
          />
          <ShortcutRow
            icon="document-text-outline"
            label="Devis en attente"
            hint={
              pendingDevis.length > 0
                ? `${pendingDevis.length} à traiter`
                : 'Aucune action urgente'
            }
            onPress={() => navigation.navigate('CollabTab')}
          />
          <ShortcutRow
            icon="people-outline"
            label="Collaborations"
            hint={`${collabsActives.length} en cours`}
            onPress={() => navigation.navigate('CollabTab')}
          />
          <ShortcutRow
            icon="chatbubbles-outline"
            label="Messages"
            hint={unread > 0 ? `${unread} non lu${unread > 1 ? 's' : ''}` : 'Boîte de réception'}
            onPress={() => navigation.navigate('MessagesTab')}
          />
        </HomeSection>

        {recentPrestations.length > 0 ? (
          <HomeSection
            title="Prestations actives"
            actionLabel="Tout voir"
            onAction={() => navigation.navigate('PrestationsTab')}
          >
            {recentPrestations.map((item) => (
              <ActivityItem
                key={item.id}
                title={pickTitle(item)}
                subtitle={
                  Array.isArray(item.zones_intervention)
                    ? item.zones_intervention.join(', ')
                    : 'Zones à préciser'
                }
                meta={item.mode_tarification === 'devis' ? 'Sur devis' : 'Tarif défini'}
                onPress={() => navigation.navigate('PrestationMatching', { id: item.id })}
                badge={<StatusBadge value={item.statut} />}
              />
            ))}
          </HomeSection>
        ) : null}

        <HomeSection
          title="En cours"
          actionLabel="Tout voir"
          onAction={() => navigation.navigate('CollabTab')}
        >
          {initialLoading && recentCollabs.length === 0 ? (
            <ListSkeleton count={2} />
          ) : recentCollabs.length === 0 ? (
            <QuietEmpty
              icon="briefcase-outline"
              title="Pas encore de mission"
              subtitle="Quand un client vous matchera, le suivi apparaîtra ici."
              actionLabel="Voir mes prestations"
              onAction={() => navigation.navigate('PrestationsTab')}
            />
          ) : (
            recentCollabs.map((item) => {
              const summary = transactionSummary(item, 'fournisseur');
              return (
                <ActivityItem
                  key={item.id}
                  title={summary.title}
                  meta={`${summary.partnerLabel} · ${summary.partner} · ${summary.date}`}
                  badge={<StatusBadge value={item.statut} />}
                  onPress={() => navigation.navigate('CollaborationDetail', { id: item.id })}
                />
              );
            })
          )}
        </HomeSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
});
