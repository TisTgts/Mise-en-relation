import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { EmptyState, ErrorBanner, LoadingBlock, Screen } from '../../components/ui';
import { colors, radii, spacing } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  fetchMessages,
  fetchTransaction,
  markMessagesRead,
  sendMessage,
} from '../../services/dataService';
import { extractErrorMessage } from '../../services/authService';
import { pickTransactionTitle } from '../../utils/collaborationView';
import {
  formatBytes,
  isImageAttachment,
  validateAttachment,
} from '../../utils/attachments';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import {
  getUserId,
  messageTimeLabel,
  withDaySeparators,
} from '../../utils/messageThreads';

function pickFileName(uri, fallback = 'fichier') {
  if (!uri) return fallback;
  const part = uri.split('/').pop()?.split('?')[0];
  return part || fallback;
}

function normalizeAttachment(asset, fallbackName) {
  const name = asset.name || asset.fileName || pickFileName(asset.uri, fallbackName);
  const mimeType =
    asset.mimeType ||
    (name.match(/\.(jpe?g)$/i) ? 'image/jpeg' : null) ||
    (name.match(/\.png$/i) ? 'image/png' : null) ||
    'application/octet-stream';
  return { uri: asset.uri, name, mimeType, size: asset.size };
}

function AttachmentPreview({ attachment, onClear }) {
  const isImage = attachment.mimeType?.startsWith('image/');
  return (
    <View style={styles.attachmentPreview}>
      {isImage ? (
        <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
      ) : (
        <View style={styles.attachmentFileIcon}>
          <Ionicons name="document-outline" size={22} color={colors.primary} />
        </View>
      )}
      <View style={styles.attachmentMeta}>
        <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
        {attachment.size ? (
          <Text style={styles.attachmentSize}>{formatBytes(attachment.size)}</Text>
        ) : null}
      </View>
      <Pressable onPress={onClear} hitSlop={8} style={styles.attachmentClear}>
        <Ionicons name="close-circle" size={22} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function MessageAttachment({ item, mine }) {
  const url = item.piece_jointe_url;
  const name = item.piece_jointe_nom || 'Pièce jointe';
  if (!url) return null;

  const open = () => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', "Impossible d'ouvrir le fichier.");
    });
  };

  if (isImageAttachment(name) || isImageAttachment(url)) {
    return (
      <Pressable onPress={open} style={styles.attachmentImageWrap}>
        <Image source={{ uri: url }} style={styles.attachmentImage} resizeMode="cover" />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={open} style={styles.attachmentLink}>
      <Ionicons name="attach" size={16} color={mine ? '#fff' : colors.primary} />
      <Text style={[styles.attachmentLinkText, mine && styles.attachmentLinkTextMine]} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

export default function MessageThreadScreen({ route }) {
  const { transactionId, partnerName, collabTitle } = route.params || {};
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const hasLoaded = useRef(false);
  const { user, type_utilisateur } = useAuth();
  const { refreshAppData } = useAppData();
  const role = type_utilisateur === 'fournisseur' ? 'fournisseur' : 'client';
  const [messages, setMessages] = useState([]);
  const [tx, setTx] = useState(null);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const markRead = useCallback(
    async (msgs) => {
      if (!user?.id) return;
      const ids = msgs
        .filter((m) => getUserId(m.destinataire) === user.id && !m.lu)
        .map((m) => m.id);
      if (ids.length === 0) return;
      try {
        await markMessagesRead(ids);
        refreshAppData();
      } catch {
        /* non bloquant */
      }
    },
    [user?.id, refreshAppData]
  );

  const load = useCallback(
    async (mode = 'initial') => {
      if (!transactionId) {
        setLoading(false);
        setError('Aucune collaboration liée');
        return;
      }
      if (mode === 'refresh') setRefreshing(true);
      else if (!hasLoaded.current) setLoading(true);
      setError(null);
      try {
        const [msgs, transaction] = await Promise.all([
          fetchMessages({ transaction: transactionId }),
          fetchTransaction(transactionId),
        ]);
        const sorted = msgs.slice().sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sorted);
        setTx(transaction);
        await markRead(sorted);
        hasLoaded.current = true;
        scrollToBottom(false);
      } catch (e) {
        setError(extractErrorMessage(e, 'Impossible de charger les messages'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [transactionId, markRead, scrollToBottom]
  );

  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current ? 'refresh' : 'initial');
    }, [load])
  );

  const headerTitle =
    collabTitle ||
    (tx ? pickTransactionTitle(tx, role) : null) ||
    `Collaboration #${transactionId || '—'}`;
  const headerPartner =
    partnerName ||
    (tx
      ? role === 'client'
        ? tx.fournisseur_nom || 'Fournisseur'
        : tx.client_nom || 'Client'
      : 'Discussion');

  const destinataireId = useMemo(() => {
    if (!tx || !user) return null;
    const clientId = getUserId(tx.client);
    const fourId = getUserId(tx.fournisseur);
    if (user.id === clientId) return fourId;
    return clientId;
  }, [tx, user]);

  const setPickedAttachment = (file) => {
    if (!file) return;
    const check = validateAttachment(file);
    if (!check.ok) {
      Alert.alert('Pièce jointe refusée', check.error);
      return;
    }
    setAttachment(file);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', "Autorisez l'accès aux photos dans les réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPickedAttachment(normalizeAttachment(result.assets[0], 'photo.jpg'));
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPickedAttachment(normalizeAttachment(result.assets[0], 'document'));
  };

  const showAttachMenu = () => {
    hapticLight();
    Alert.alert('Pièce jointe', 'Choisir une source', [
      { text: 'Photo', onPress: pickPhoto },
      { text: 'Document', onPress: pickDocument },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const canSend = Boolean(text.trim() || attachment);

  const listRows = useMemo(() => withDaySeparators(messages), [messages]);

  const onSend = async () => {
    if (!canSend || sending) return;
    const dest = destinataireId;
    if (!dest) {
      setError('Destinataire introuvable');
      return;
    }

    const body = text.trim();
    const pendingAttachment = attachment;
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      contenu: body || (pendingAttachment ? '📎 Pièce jointe' : ''),
      expediteur_id: user.id,
      expediteur_nom: user.first_name || 'Moi',
      created_at: new Date().toISOString(),
      _pending: true,
    };

    setSending(true);
    setError(null);
    setText('');
    setAttachment(null);
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      await sendMessage({
        destinataire: dest,
        transaction: transactionId,
        contenu: body,
        sujet: 'Collaboration',
        attachment: pendingAttachment,
      });
      hapticSuccess();
      await load('refresh');
      refreshAppData();
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(body);
      setAttachment(pendingAttachment);
      setError(extractErrorMessage(e, 'Envoi impossible'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen style={{ flex: 1 }} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.header, { paddingTop: spacing.sm }]}>
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{headerPartner}</Text>
        </View>

        <ErrorBanner message={error} />

        {loading && messages.length === 0 ? (
          <LoadingBlock />
        ) : (
          <FlatList
            ref={listRef}
            data={listRows}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => scrollToBottom(false)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load('refresh')}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item: row }) => {
              if (row.type === 'day') {
                return (
                  <View style={styles.daySep}>
                    <View style={styles.dayLine} />
                    <Text style={styles.dayLabel}>{row.label}</Text>
                    <View style={styles.dayLine} />
                  </View>
                );
              }
              const item = row.message;
              const mine =
                getUserId(item.expediteur) === user?.id ||
                item.expediteur_id === user?.id;
              const hasText = Boolean(item.contenu?.trim());
              return (
                <View style={[styles.bubbleWrap, mine ? styles.wrapMine : styles.wrapTheirs]}>
                  {!mine ? (
                    <Text style={styles.senderName}>{item.expediteur_nom || 'Contact'}</Text>
                  ) : null}
                  {(hasText || item.piece_jointe_url || item._pending) ? (
                    <View style={[styles.bubble, mine ? styles.mine : styles.theirs, item._pending && styles.pending]}>
                      {hasText ? (
                        <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.contenu}</Text>
                      ) : null}
                      <MessageAttachment item={item} mine={mine} />
                      {item._pending ? (
                        <ActivityIndicator
                          size="small"
                          color={mine ? '#fff' : colors.primary}
                          style={{ marginTop: 4, alignSelf: mine ? 'flex-end' : 'flex-start' }}
                        />
                      ) : null}
                    </View>
                  ) : null}
                  {!item._pending ? (
                    <Text style={[styles.time, mine && styles.timeMine]}>
                      {messageTimeLabel(item.created_at)}
                    </Text>
                  ) : null}
                </View>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-outline"
                title="Aucun message"
                subtitle="Envoyez le premier message pour démarrer la conversation."
              />
            }
          />
        )}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {attachment ? (
            <AttachmentPreview attachment={attachment} onClear={() => setAttachment(null)} />
          ) : null}
          <View style={styles.composerRow}>
            <Pressable onPress={showAttachMenu} style={styles.attachBtn} disabled={sending}>
              <Ionicons name="attach" size={22} color={colors.primary} />
            </Pressable>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Écrire un message…"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Pressable
              onPress={onSend}
              disabled={sending || !canSend}
              style={[styles.send, (sending || !canSend) && { opacity: 0.5 }]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  headerSub: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  list: { padding: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },
  daySep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: spacing.md,
  },
  dayLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  bubbleWrap: { marginBottom: spacing.md, maxWidth: '85%' },
  wrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4, marginLeft: 4 },
  bubble: { padding: spacing.md, borderRadius: radii.lg, gap: 8 },
  pending: { opacity: 0.85 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.text, lineHeight: 20 },
  mineText: { color: '#fff' },
  attachmentImageWrap: { borderRadius: radii.md, overflow: 'hidden', marginTop: 2 },
  attachmentImage: { width: 200, height: 150, borderRadius: radii.md },
  attachmentLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingVertical: 4 },
  attachmentLinkText: { flex: 1, fontSize: 13, color: colors.primary, textDecorationLine: 'underline' },
  attachmentLinkTextMine: { color: '#E0E7FF' },
  time: { marginTop: 4, fontSize: 10, color: colors.textMuted },
  timeMine: { textAlign: 'right' },
  composer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  attachBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentThumb: { width: 44, height: 44, borderRadius: radii.sm },
  attachmentFileIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentMeta: { flex: 1 },
  attachmentName: { fontSize: 13, fontWeight: '600', color: colors.text },
  attachmentSize: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  attachmentClear: { padding: 4 },
});
