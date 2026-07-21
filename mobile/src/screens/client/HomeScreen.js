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
import { fetchMyBesoins, fetchMessages, fetchTransactions } from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { transactionSummary } from '../../utils/collaborationView';
import { getUserId } from '../../utils/messageThreads';
import { pickTitle } from '../../utils/format';

export default function ClientHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refreshAppData } = useAppData();
  const [besoins, setBesoins] = useState([]);
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
          fetchMyBesoins(),
          fetchTransactions(),
          fetchMessages(),
        ]);
        const [b, t, m] = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
        if (b) setBesoins(b);
        if (t) setTransactions(t);
        if (m) setMessages(m);
        const failed = results.find((r) => r.status === 'rejected');
        if (failed) {
          setError(extractErrorMessage(failed.reason, 'Impossible de charger l\'accueil'));
        } else {
          hasLoaded.current = true;
          refreshAppData();
        }
        if (b || t || m) hasLoaded.current = true;
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

  const ouverts = besoins.filter((b) => b.statut === 'ouverte');
  const ouvertsCount = ouverts.length;
  const collabsActives = transactions.filter(
    (t) => t.statut !== 'terminee' && t.statut !== 'annulee'
  );
  const recentCollabs = collabsActives.slice(0, 4);
  const recentBesoins = ouverts.slice(0, 3);
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
            roleLabel="Espace client"
            subtitle="Publiez un besoin, trouvez le bon pro, suivez vos collaborations."
            ctaLabel="Publier un besoin"
            onCta={() => navigation.navigate('BesoinCreate')}
          />
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 24 }}>
            <InlineError message={error} onRetry={() => load('initial')} />
          </View>
        ) : null}

        <ActivityStrip
          items={[
            { label: 'Besoins ouverts', value: ouvertsCount },
            { label: 'Collabs actives', value: collabsActives.length },
            { label: 'Messages', value: unread || messages.length },
          ]}
        />

        <HomeSection title="Aller à">
          <ShortcutRow
            icon="construct-outline"
            label="Mes besoins"
            hint={ouvertsCount > 0 ? `${ouvertsCount} ouvert${ouvertsCount > 1 ? 's' : ''}` : 'Créer un besoin'}
            onPress={() => navigation.navigate('BesoinsTab')}
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

        {recentBesoins.length > 0 ? (
          <HomeSection
            title="Besoins ouverts"
            actionLabel="Tout voir"
            onAction={() => navigation.navigate('BesoinsTab')}
          >
            {recentBesoins.map((item) => (
              <ActivityItem
                key={item.id}
                title={pickTitle(item)}
                subtitle={item.lieu_intervention || 'Lieu à préciser'}
                meta={item.mode_budget === 'budget_fixe' ? 'Budget fixe' : 'Sur devis'}
                onPress={() => navigation.navigate('BesoinMatching', { id: item.id })}
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
              icon="people-outline"
              title="Aucune collaboration active"
              subtitle="Lancez le matching depuis un besoin pour démarrer."
              actionLabel="Voir mes besoins"
              onAction={() => navigation.navigate('BesoinsTab')}
            />
          ) : (
            recentCollabs.map((item) => {
              const summary = transactionSummary(item, 'client');
              return (
                <ActivityItem
                  key={item.id}
                  title={summary.title}
                  subtitle={summary.partner}
                  meta={summary.amount}
                  onPress={() => navigation.navigate('CollaborationDetail', { id: item.id })}
                  badge={<StatusBadge value={item.statut} />}
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
  screen: { flex: 1 },
});
