import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiInbox, FiSearch, FiSend } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../../config/api';
import { fetchAllPaginated } from '../fournisseurUi';
import Toast from '../../../components/Toast';
import { requestNotificationsRefresh } from '../../../contexts/NotificationContext';

const authJsonHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const getUserId = (u) => u?.id ?? u;
const formatDateTime = (d) => (d ? new Date(d).toLocaleString('fr-FR') : '—');

const buildThreadKey = (m, myId) => {
  const exp = getUserId(m.expediteur);
  const dest = getUserId(m.destinataire);
  const partnerId = exp === myId ? dest : exp;
  const tx = getUserId(m.transaction) || 'none';
  return `${partnerId || 'unknown'}::${tx}`;
};

const MesMessages = () => {
  const { user } = useAuth();
  const myId = user?.id;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedThreadKey, setSelectedThreadKey] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchAllPaginated(API_ENDPOINTS.SERVICES.MESSAGES, authJsonHeaders());
      setMessages(Array.isArray(list) ? list : []);
    } catch {
      setMessages([]);
      setToast({ message: 'Impossible de charger les messages.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.type_utilisateur === 'fournisseur') loadMessages();
  }, [user, loadMessages]);

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

  useEffect(() => {
    if (!selectedThreadKey && filteredThreads.length > 0) {
      setSelectedThreadKey(filteredThreads[0].key);
    }
  }, [filteredThreads, selectedThreadKey]);

  const selectedThread = useMemo(
    () => filteredThreads.find((t) => t.key === selectedThreadKey) || null,
    [filteredThreads, selectedThreadKey]
  );

  const threadMessages = useMemo(() => {
    if (!selectedThreadKey) return [];
    return messages
      .filter((m) => buildThreadKey(m, myId) === selectedThreadKey)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, myId, selectedThreadKey]);

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
      } catch {
        // non bloquant
      }
    },
    [messages, myId]
  );

  const handleSelectThread = async (threadKey) => {
    setSelectedThreadKey(threadKey);
    await markThreadAsRead(threadKey);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedThread?.partnerId) {
      setToast({ message: 'Sélectionnez une conversation.', type: 'warning' });
      return;
    }
    if (!draft.trim()) {
      setToast({ message: 'Le message est vide.', type: 'warning' });
      return;
    }
    const payload = {
      destinataire: selectedThread.partnerId,
      sujet: selectedThread.transactionId ? `Transaction #${selectedThread.transactionId}` : 'Message',
      contenu: draft.trim(),
    };
    if (selectedThread.transactionId) payload.transaction = selectedThread.transactionId;
    try {
      setSending(true);
      const res = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Envoi impossible');
      }
      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      setDraft('');
      requestNotificationsRefresh();
    } catch (error) {
      setToast({ message: error.message || 'Erreur lors de l’envoi.', type: 'error' });
    } finally {
      setSending(false);
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
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Messagerie fournisseur</h1>
        <p className="mt-1 text-sm text-slate-600">Conversations clients centralisées par transaction.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une conversation…"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="max-h-[65vh] overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FiInbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                Aucune conversation.
              </div>
            ) : (
              filteredThreads.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleSelectThread(t.key)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${
                    t.key === selectedThreadKey ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{t.partnerName}</p>
                    {t.unreadCount > 0 ? (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {t.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t.transactionId ? `Transaction #${t.transactionId}` : 'Hors transaction'}</p>
                  <p className="mt-1 text-xs text-slate-600">{(t.lastPreview || '').slice(0, 55)}</p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          {!selectedThread ? (
            <div className="flex h-full min-h-[50vh] items-center justify-center text-slate-500">
              Sélectionnez une conversation.
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{selectedThread.partnerName}</p>
                <p className="text-xs text-slate-500">
                  {selectedThread.transactionId ? `Transaction #${selectedThread.transactionId}` : 'Conversation libre'}
                </p>
              </div>

              <div className="max-h-[52vh] space-y-3 overflow-y-auto bg-slate-50 p-4">
                {threadMessages.map((m) => {
                  const mine = getUserId(m.expediteur) === myId;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${mine ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border border-slate-200'} max-w-[80%] rounded-lg px-3 py-2`}>
                        <p className="mb-1 text-[11px] font-semibold">
                          {mine ? 'Vous' : m.expediteur_nom || selectedThread.partnerName}
                        </p>
                        <p className="whitespace-pre-wrap text-sm">{m.contenu}</p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {formatDateTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSend} className="border-t border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Écrire un message…"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <FiSend className="h-4 w-4" />
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

export default MesMessages;
