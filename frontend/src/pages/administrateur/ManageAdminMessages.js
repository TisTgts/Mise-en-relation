import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiChevronLeft,
  FiDownload,
  FiInbox,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';

const getId = (u) => (u && typeof u === 'object' ? u.id : u);

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

const isImageName = (name) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(name || ''));

const buildThreadKey = (m) => {
  const a = getId(m.expediteur);
  const b = getId(m.destinataire);
  const lo = Math.min(Number(a), Number(b));
  const hi = Math.max(Number(a), Number(b));
  const tx = getId(m.transaction) ?? 'none';
  return `${lo}-${hi}::${tx}`;
};

const ManageAdminMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [showThreadMobile, setShowThreadMobile] = useState(false);
  const [toast, setToast] = useState(null);

  const loadMessages = async ({ silent = false } = {}) => {
    if (user?.type_utilisateur !== 'administrateur') return;
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const data = await adminService.getAdminMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setToast({ message: 'Impossible de charger les messages.', type: 'error' });
      if (!silent) setMessages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const threads = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const key = buildThreadKey(m);
      const expId = getId(m.expediteur);
      const destId = getId(m.destinataire);
      const lo = Math.min(Number(expId), Number(destId));
      const aId = lo === Number(expId) ? expId : destId;
      const aName = aId === expId ? m.expediteur_nom : m.destinataire_nom;
      const bId = aId === expId ? destId : expId;
      const bName = aId === expId ? m.destinataire_nom : m.expediteur_nom;
      const txId = getId(m.transaction) || null;

      if (!map.has(key)) {
        map.set(key, {
          key,
          aId,
          aName: aName || `Utilisateur #${aId}`,
          bId,
          bName: bName || `Utilisateur #${bId}`,
          transactionId: txId,
          lastMessageAt: m.created_at,
          lastPreview: m.contenu || m.sujet || (m.piece_jointe_nom ? `📎 ${m.piece_jointe_nom}` : ''),
          unreadCount: m.lu ? 0 : 1,
          count: 1,
        });
      } else {
        const t = map.get(key);
        t.count += 1;
        if (!m.lu) t.unreadCount += 1;
        if (new Date(m.created_at).getTime() > new Date(t.lastMessageAt).getTime()) {
          t.lastMessageAt = m.created_at;
          t.lastPreview =
            m.contenu || m.sujet || (m.piece_jointe_nom ? `📎 ${m.piece_jointe_nom}` : '');
        }
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [messages]);

  const filteredThreads = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        (t.aName || '').toLowerCase().includes(q) ||
        (t.bName || '').toLowerCase().includes(q) ||
        (t.lastPreview || '').toLowerCase().includes(q) ||
        String(t.transactionId || '').includes(q)
    );
  }, [threads, searchTerm]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.key === selectedKey) || null,
    [threads, selectedKey]
  );

  const threadMessages = useMemo(() => {
    if (!selectedKey) return [];
    return messages
      .filter((m) => buildThreadKey(m) === selectedKey)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedKey]);

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    [threads]
  );

  const selectThread = (key) => {
    setSelectedKey(key);
    setShowThreadMobile(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Link
          to="/admin/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <FiChevronLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FiMessageSquare className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Messages</h1>
                {totalUnread > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                    {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                Supervision en lecture seule des échanges ({threads.length} conversation
                {threads.length > 1 ? 's' : ''}, {messages.length} message
                {messages.length > 1 ? 's' : ''}).
              </p>
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
        </div>
      </div>

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Participant, contenu, transaction…"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FiInbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm">
                  {searchTerm ? 'Aucun résultat.' : 'Aucune conversation pour le moment.'}
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const active = t.key === selectedKey;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => selectThread(t.key)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors hover:bg-slate-50 ${
                      active ? 'bg-indigo-50/70' : ''
                    }`}
                  >
                    <span className="flex -space-x-2 shrink-0">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white ${colorForKey(
                          t.aId
                        )}`}
                      >
                        {initialsFor(t.aName)}
                      </span>
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white ${colorForKey(
                          t.bId
                        )}`}
                      >
                        {initialsFor(t.bName)}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {t.aName} ↔ {t.bName}
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

        {/* Fil de discussion (lecture seule) */}
        <section
          className={`flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2 ${
            showThreadMobile ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selectedThread ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-400">
              <FiMessageSquare className="mb-3 h-12 w-12 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">
                Sélectionnez une conversation pour la consulter
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
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {selectedThread.aName} ↔ {selectedThread.bName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedThread.transactionId
                      ? `Transaction #${selectedThread.transactionId}`
                      : 'Conversation libre'}{' '}
                    · {selectedThread.count} message{selectedThread.count > 1 ? 's' : ''}
                  </p>
                </div>
                {selectedThread.transactionId && (
                  <Link
                    to={`/admin/transactions`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Transactions
                  </Link>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-slate-50 p-4">
                {threadMessages.map((m, idx) => {
                  const right = getId(m.expediteur) === selectedThread.bId;
                  const prev = threadMessages[idx - 1];
                  const showDaySep =
                    !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at));
                  const samePrevSender =
                    prev && getId(prev.expediteur) === getId(m.expediteur) && !showDaySep;
                  return (
                    <React.Fragment key={m.id}>
                      {showDaySep && (
                        <div className="my-3 flex items-center justify-center">
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                            {dayLabel(m.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${right ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[78%] rounded-2xl border px-3.5 py-2 shadow-sm ${
                            right
                              ? 'rounded-br-sm border-indigo-100 bg-indigo-50 text-slate-900'
                              : 'rounded-bl-sm border-slate-200 bg-white text-slate-900'
                          } ${samePrevSender ? 'mt-0.5' : 'mt-2'}`}
                        >
                          {!samePrevSender && (
                            <p className="mb-0.5 text-[11px] font-semibold text-slate-500">
                              {m.expediteur_nom || 'Utilisateur'}
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
                                className={`block overflow-hidden rounded-lg ${
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
                                className={`flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 ${
                                  m.contenu ? 'mt-2' : ''
                                }`}
                              >
                                <FiDownload className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {m.piece_jointe_nom || 'Télécharger le fichier'}
                                </span>
                              </a>
                            ))}
                          <p className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
                            {timeLabel(m.created_at)}
                            <span
                              className={`rounded-full px-1.5 ${
                                m.lu ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {m.lu ? 'Lu' : 'Non lu'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ManageAdminMessages;
