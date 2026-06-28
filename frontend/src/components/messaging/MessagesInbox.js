import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiDownload,
  FiExternalLink,
  FiInbox,
  FiMessageSquare,
  FiPaperclip,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import { fetchAllPaginated } from '../../services/apiClient';
import Toast from '../Toast';
import { requestNotificationsRefresh } from '../../contexts/NotificationContext';

const authJsonHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const isImageName = (name) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(name || ''));

const humanFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const getUserId = (u) => u?.id ?? u;

const buildThreadKey = (m, myId) => {
  const exp = getUserId(m.expediteur);
  const dest = getUserId(m.destinataire);
  const partnerId = exp === myId ? dest : exp;
  const tx = getUserId(m.transaction) || 'none';
  return `${partnerId || 'unknown'}::${tx}`;
};

const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-fuchsia-500',
];

const colorForKey = (key) => {
  const s = String(key ?? '');
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initialsFor = (name) => {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const relativeTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffSec = (now.getTime() - date.getTime()) / 1000;
  if (diffSec < 60) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const dayLabel = (d) => {
  const date = new Date(d);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, now)) return "Aujourd'hui";
  if (isSameDay(date, yesterday)) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const timeLabel = (d) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

/**
 * Espace de communication partagé (client / fournisseur).
 * Inbox style messagerie avec liste de conversations + fil + composer.
 */
const MessagesInbox = ({
  title = 'Messagerie',
  subtitle = 'Suivez vos conversations.',
  transactionBasePath,
  expectedUserType,
}) => {
  const { user } = useAuth();
  const myId = user?.id;
  const [searchParams, setSearchParams] = useSearchParams();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedThreadKey, setSelectedThreadKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [showThreadMobile, setShowThreadMobile] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const deepLinkHandled = useRef(false);

  const loadMessages = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const list = await fetchAllPaginated(API_ENDPOINTS.SERVICES.MESSAGES);
      setMessages(Array.isArray(list) ? list : []);
    } catch {
      if (!silent) setMessages([]);
      setToast({ message: 'Impossible de charger les messages.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (expectedUserType && user.type_utilisateur !== expectedUserType) return;
    loadMessages();
  }, [user, expectedUserType, loadMessages]);

  // Rafraîchissement automatique léger tant que la page est ouverte et visible.
  useEffect(() => {
    if (!user) return undefined;
    if (expectedUserType && user.type_utilisateur !== expectedUserType) return undefined;
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadMessages({ silent: true });
      }
    }, 25000);
    return () => clearInterval(intervalId);
  }, [user, expectedUserType, loadMessages]);

  const threads = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const key = buildThreadKey(m, myId);
      const exp = getUserId(m.expediteur);
      const dest = getUserId(m.destinataire);
      const partnerId = exp === myId ? dest : exp;
      const partnerName =
        exp === myId
          ? m.destinataire_nom || `Utilisateur #${partnerId}`
          : m.expediteur_nom || `Utilisateur #${partnerId}`;
      const txId = getUserId(m.transaction) || null;
      const unreadForMe = dest === myId && !m.lu;

      if (!map.has(key)) {
        map.set(key, {
          key,
          partnerId,
          partnerName,
          transactionId: txId,
          lastMessageAt: m.created_at,
          lastPreview: m.contenu || m.sujet || '',
          unreadCount: unreadForMe ? 1 : 0,
        });
      } else {
        const t = map.get(key);
        if (new Date(m.created_at).getTime() > new Date(t.lastMessageAt).getTime()) {
          t.lastMessageAt = m.created_at;
          t.lastPreview = m.contenu || m.sujet || '';
        }
        if (unreadForMe) t.unreadCount += 1;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [messages, myId]);

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    [threads]
  );

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        (t.partnerName || '').toLowerCase().includes(q) ||
        (t.lastPreview || '').toLowerCase().includes(q) ||
        String(t.transactionId || '').includes(q)
    );
  }, [threads, search]);

  const markThreadAsRead = useCallback(
    async (threadKey) => {
      const ids = messages
        .filter((m) => buildThreadKey(m, myId) === threadKey)
        .filter((m) => getUserId(m.destinataire) === myId && !m.lu)
        .map((m) => m.id);
      if (ids.length === 0) return;
      try {
        const res = await fetch(`${API_ENDPOINTS.SERVICES.MESSAGES}mark-read/`, {
          method: 'POST',
          headers: authJsonHeaders(),
          body: JSON.stringify({ message_ids: ids }),
        });
        if (!res.ok) return;
        setMessages((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, lu: true } : m)));
        requestNotificationsRefresh();
      } catch {
        // non bloquant
      }
    },
    [messages, myId]
  );

  const selectThread = useCallback(
    (threadKey) => {
      setSelectedThreadKey(threadKey);
      setShowThreadMobile(true);
      markThreadAsRead(threadKey);
    },
    [markThreadAsRead]
  );

  // Sélection par défaut (desktop) + deep-link ?transaction=
  useEffect(() => {
    if (loading) return;
    if (deepLinkHandled.current) return;
    const txParam = searchParams.get('transaction');
    if (txParam) {
      const match = threads.find((t) => String(t.transactionId) === String(txParam));
      if (match) {
        deepLinkHandled.current = true;
        setSelectedThreadKey(match.key);
        setShowThreadMobile(true);
        markThreadAsRead(match.key);
        const next = new URLSearchParams(searchParams);
        next.delete('transaction');
        setSearchParams(next, { replace: true });
        return;
      }
    }
    deepLinkHandled.current = true;
    if (!selectedThreadKey && threads.length > 0 && window.innerWidth >= 1024) {
      setSelectedThreadKey(threads[0].key);
    }
  }, [loading, threads, searchParams, setSearchParams, markThreadAsRead, selectedThreadKey]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.key === selectedThreadKey) || null,
    [threads, selectedThreadKey]
  );

  const threadMessages = useMemo(() => {
    if (!selectedThreadKey) return [];
    return messages
      .filter((m) => buildThreadKey(m, myId) === selectedThreadKey)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, myId, selectedThreadKey]);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadMessages, selectedThreadKey]);

  // Auto-grandir le textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setToast({ message: 'Fichier trop volumineux (max 10 Mo).', type: 'warning' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setAttachment(file);
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!selectedThread?.partnerId) {
      setToast({ message: 'Sélectionnez une conversation.', type: 'warning' });
      return;
    }
    if (!draft.trim() && !attachment) return;

    const sujet = selectedThread.transactionId
      ? `Transaction #${selectedThread.transactionId}`
      : 'Message';

    try {
      setSending(true);
      let res;
      if (attachment) {
        const form = new FormData();
        form.append('destinataire', selectedThread.partnerId);
        form.append('sujet', sujet);
        form.append('contenu', draft.trim());
        if (selectedThread.transactionId) form.append('transaction', selectedThread.transactionId);
        form.append('piece_jointe', attachment);
        res = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
          method: 'POST',
          headers: authHeader(),
          body: form,
        });
      } else {
        const payload = {
          destinataire: selectedThread.partnerId,
          sujet,
          contenu: draft.trim(),
        };
        if (selectedThread.transactionId) payload.transaction = selectedThread.transactionId;
        res = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
          method: 'POST',
          headers: authJsonHeaders(),
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Envoi impossible.");
      }
      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      setDraft('');
      clearAttachment();
      requestNotificationsRefresh();
    } catch (error) {
      setToast({ message: error.message || "Erreur lors de l'envoi.", type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FiMessageSquare className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              {totalUnread > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                  {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => loadMessages({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </header>

      <div className="grid h-[72vh] gap-5 lg:grid-cols-3">
        {/* Liste des conversations */}
        <section
          className={`flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-1 ${
            showThreadMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="border-b border-slate-200 p-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une conversation..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FiInbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm">
                  {search ? 'Aucun résultat.' : 'Aucune conversation pour le moment.'}
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const active = t.key === selectedThreadKey;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => selectThread(t.key)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors hover:bg-slate-50 ${
                      active ? 'bg-indigo-50/70' : ''
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${colorForKey(
                        t.partnerId
                      )}`}
                    >
                      {initialsFor(t.partnerName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {t.partnerName}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {relativeTime(t.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            t.transactionId
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {t.transactionId ? `#${t.transactionId}` : 'Libre'}
                        </span>
                        <span className="truncate text-xs text-slate-500">
                          {t.lastPreview || '—'}
                        </span>
                      </span>
                    </span>
                    {t.unreadCount > 0 && (
                      <span className="ml-1 mt-1 flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                        {t.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Fil de discussion */}
        <section
          className={`flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2 ${
            showThreadMobile ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selectedThread ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-400">
              <FiMessageSquare className="mb-3 h-12 w-12 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200 p-3">
                <button
                  type="button"
                  onClick={() => setShowThreadMobile(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
                  aria-label="Retour aux conversations"
                >
                  <FiArrowLeft className="h-5 w-5" />
                </button>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${colorForKey(
                    selectedThread.partnerId
                  )}`}
                >
                  {initialsFor(selectedThread.partnerName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {selectedThread.partnerName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedThread.transactionId
                      ? `Transaction #${selectedThread.transactionId}`
                      : 'Conversation libre'}
                  </p>
                </div>
                {selectedThread.transactionId && transactionBasePath && (
                  <Link
                    to={`${transactionBasePath}/${selectedThread.transactionId}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    <FiExternalLink className="h-3.5 w-3.5" />
                    Transaction
                  </Link>
                )}
              </div>

              <div ref={scrollRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-slate-50 p-4">
                {threadMessages.map((m, idx) => {
                  const mine = getUserId(m.expediteur) === myId;
                  const prev = threadMessages[idx - 1];
                  const showDaySep =
                    !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at));
                  const samePrevSender =
                    prev &&
                    getUserId(prev.expediteur) === getUserId(m.expediteur) &&
                    !showDaySep;
                  return (
                    <React.Fragment key={m.id}>
                      {showDaySep && (
                        <div className="my-3 flex items-center justify-center">
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                            {dayLabel(m.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm ${
                            mine
                              ? 'rounded-br-sm bg-indigo-600 text-white'
                              : 'rounded-bl-sm border border-slate-200 bg-white text-slate-900'
                          } ${samePrevSender ? 'mt-0.5' : 'mt-2'}`}
                        >
                          {!mine && !samePrevSender && (
                            <p className="mb-0.5 text-[11px] font-semibold text-slate-500">
                              {m.expediteur_nom || selectedThread.partnerName}
                            </p>
                          )}
                          {m.contenu ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {m.contenu}
                            </p>
                          ) : null}
                          {m.piece_jointe_url &&
                            (isImageName(m.piece_jointe_nom || m.piece_jointe_url) ? (
                              <a
                                href={m.piece_jointe_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`mt-1 block overflow-hidden rounded-lg ${
                                  m.contenu ? 'mt-2' : ''
                                }`}
                              >
                                <img
                                  src={m.piece_jointe_url}
                                  alt={m.piece_jointe_nom || 'pièce jointe'}
                                  className="max-h-52 w-auto rounded-lg object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                href={m.piece_jointe_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                                  m.contenu ? 'mt-2' : ''
                                } ${
                                  mine
                                    ? 'bg-indigo-500/40 text-white hover:bg-indigo-500/60'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                <FiDownload className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {m.piece_jointe_nom || 'Télécharger le fichier'}
                                </span>
                              </a>
                            ))}
                          <p
                            className={`mt-1 text-right text-[10px] ${
                              mine ? 'text-indigo-100' : 'text-slate-400'
                            }`}
                          >
                            {timeLabel(m.created_at)}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              <form onSubmit={handleSend} className="border-t border-slate-200 p-3">
                {attachment && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <FiPaperclip className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                      {attachment.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {humanFileSize(attachment.size)}
                    </span>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      aria-label="Retirer la pièce jointe"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                    aria-label="Joindre un fichier"
                    title="Joindre un fichier"
                  >
                    <FiPaperclip className="h-4 w-4" />
                  </button>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrire un message…  (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
                    className="max-h-[140px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!draft.trim() && !attachment)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Envoyer"
                  >
                    {sending ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <FiSend className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MessagesInbox;
