import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
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
} from '../../components/ui';
import { colors, radii, shadows, spacing } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useScreenLoad } from '../../hooks/useScreenLoad';
import { fetchMessages, fetchTransactions } from '../../services/dataService';
import { pickTransactionTitle } from '../../utils/collaborationView';
import { groupMessagesIntoThreads, relativeMessageTime } from '../../utils/messageThreads';

function ThreadCard({ thread, onPress }) {
  const initials = (thread.partnerName || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadows.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {thread.partnerName}
            </Text>
            <Text style={styles.time}>{relativeMessageTime(thread.lastMessageAt)}</Text>
          </View>
          {thread.collabTitle ? (
            <Text style={styles.collabTitle} numberOfLines={1}>
              {thread.collabTitle}
            </Text>
          ) : thread.transactionId ? (
            <Text style={styles.collabTitle}>Collaboration #{thread.transactionId}</Text>
          ) : null}
          <Text style={[styles.preview, thread.unreadCount > 0 && styles.previewUnread]} numberOfLines={2}>
            {thread.lastPreview || 'Aucun contenu'}
          </Text>
        </View>
        {thread.unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{thread.unreadCount > 9 ? '9+' : thread.unreadCount}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, type_utilisateur } = useAuth();
  const { refreshAppData } = useAppData();
  const role = type_utilisateur === 'fournisseur' ? 'fournisseur' : 'client';
  const [messages, setMessages] = useState([]);
  const [txList, setTxList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    const [msgs, txs] = await Promise.all([fetchMessages(), fetchTransactions()]);
    setMessages(msgs);
    setTxList(txs);
    refreshAppData();
  }, [refreshAppData]);

  const { initialLoading, refreshing, error, retry, refresh } = useScreenLoad(load, [load]);

  const txTitles = useMemo(() => {
    const map = {};
    for (const tx of txList) {
      map[tx.id] = pickTransactionTitle(tx, role);
    }
    return map;
  }, [txList, role]);

  const threads = useMemo(
    () => groupMessagesIntoThreads(messages, user?.id, txTitles),
    [messages, user?.id, txTitles]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.partnerName?.toLowerCase().includes(q) ||
        t.lastPreview?.toLowerCase().includes(q) ||
        t.collabTitle?.toLowerCase().includes(q) ||
        String(t.transactionId || '').includes(q)
    );
  }, [threads, searchTerm]);

  const unreadTotal = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  const listHeader = (
    <View>
      <PageHeader
        title="Messages"
        meta={`${filtered.length} conversation${filtered.length !== 1 ? 's' : ''}${unreadTotal > 0 ? ` · ${unreadTotal} non lu${unreadTotal > 1 ? 's' : ''}` : ''}`}
      />
      <InlineError message={error} onRetry={retry} />

      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Rechercher une conversation…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          {searchTerm ? (
            <Pressable onPress={() => setSearchTerm('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      {initialLoading ? (
        <>
          <View style={{ paddingHorizontal: spacing.lg }}>{listHeader}</View>
          <ListSkeleton count={5} />
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.key}
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
              icon="chatbubble-ellipses-outline"
              title={error ? 'Données indisponibles' : messages.length === 0 ? 'Boîte vide' : 'Aucun résultat'}
              subtitle={
                error
                  ? 'Vérifiez votre connexion puis réessayez.'
                  : messages.length === 0
                    ? 'Vos échanges apparaîtront ici après un match confirmé.'
                    : 'Aucune conversation ne correspond à votre recherche.'
              }
              actionLabel={messages.length === 0 && !error ? 'Voir les collaborations' : undefined}
              onAction={
                messages.length === 0 && !error
                  ? () => navigation.navigate('CollabTab')
                  : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <ThreadCard
              thread={item}
              onPress={() =>
                navigation.navigate('MessageThread', {
                  transactionId: item.transactionId,
                  partnerName: item.partnerName,
                  collabTitle: item.collabTitle,
                })
              }
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardPressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  partnerName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  time: { fontSize: 11, color: colors.textMuted },
  collabTitle: { marginTop: 2, fontSize: 12, fontWeight: '600', color: colors.primary },
  preview: { marginTop: 4, fontSize: 14, color: colors.textMuted, lineHeight: 19 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
