import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPaperclip,
  FiSend,
  FiUser,
  FiCalendar,
  FiBriefcase,
  FiX,
  FiMessageSquare,
  FiArrowRight,
} from 'react-icons/fi';
import transactionsService from '../../services/transactionsService';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const WORKSPACE_PREFIX = '[WORKSPACE_ENTRY]';
const DEVIS_TAG = '[DEVIS]';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const authOnlyHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const parseWorkspaceEntry = (message) => {
  const raw = message?.contenu || '';
  if (raw.startsWith(WORKSPACE_PREFIX)) {
    try {
      const payload = JSON.parse(raw.slice(WORKSPACE_PREFIX.length));
      return {
        ...message,
        workspace: {
          type: payload.type || 'info',
          title: payload.title || 'Information',
          content: payload.content || '',
          fileUrl: payload.fileUrl || '',
        },
      };
    } catch {
      // fallback
    }
  }
  return {
    ...message,
    workspace: { type: 'message', title: 'Note', content: raw, fileUrl: '' },
  };
};

const buildWorkspacePayload = (entry) =>
  `${WORKSPACE_PREFIX}${JSON.stringify({
    type: entry.type || 'info',
    title: (entry.title || '').trim(),
    content: (entry.content || '').trim(),
    fileUrl: (entry.fileUrl || '').trim(),
  })}`;

const fmt = (v) => {
  if (!v) return '—';
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? '—' : new Date(v).toLocaleString('fr-FR');
};

const typeBadgeClass = (type) => {
  if (type === 'consigne') return 'bg-amber-100 text-amber-800';
  if (type === 'livrable') return 'bg-emerald-100 text-emerald-800';
  if (type === 'fichier') return 'bg-indigo-100 text-indigo-800';
  return 'bg-slate-100 text-slate-700';
};

const TYPE_LABELS = {
  info: 'Info',
  consigne: 'Consigne',
  livrable: 'Livrable',
  fichier: 'Fichier',
  message: 'Note',
};
const typeLabel = (t) => TYPE_LABELS[t] || t || 'Note';

const STATUT_LABELS = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};
const statutLabel = (s) => STATUT_LABELS[s] || s || '—';
const statutPillClass = (s) => {
  switch (s) {
    case 'en_cours':
      return 'bg-blue-100 text-blue-800';
    case 'terminee':
      return 'bg-emerald-100 text-emerald-800';
    case 'annulee':
      return 'bg-rose-100 text-rose-700';
    case 'acceptee':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const DEVIS_LABELS = {
  non_requis: 'Non requis',
  a_proposer: 'À proposer par le fournisseur',
  en_attente_client: 'En attente de réponse du client',
  accepte_client: 'Accepté par le client',
  rejete_client: 'Rejeté par le client',
};
const devisStatutLabel = (s) => DEVIS_LABELS[s] || s || '—';

const getUserId = (u) => u?.id ?? u;

const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-teal-500',
];
const colorForKey = (key) => {
  const s = String(key ?? '');
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const initialsFor = (name) => {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
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

export default function CollaborationWorkspacePage({ role = 'client', backPath = '/' }) {
  const isAdmin = role === 'admin';
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const myId = user?.id;
  const chatRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState(null);
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ type: 'info', title: '', content: '', fileUrl: '', file: null });
  const [showNeedModal, setShowNeedModal] = useState(false);
  const [needDetail, setNeedDetail] = useState(null);
  const [loadingNeedDetail, setLoadingNeedDetail] = useState(false);
  const [devisMessage, setDevisMessage] = useState('');
  const [devisMontant, setDevisMontant] = useState('');
  const [devisDescription, setDevisDescription] = useState('');

  // Robustesse UI: quand on change de collaboration, on ferme les modals de l'espace.
  useEffect(() => {
    setShowNeedModal(false);
    setNeedDetail(null);
    setLoadingNeedDetail(false);
    setError('');
  }, [id]);

  const partnerId = useMemo(() => {
    if (!tx) return null;
    if (isAdmin) return null;
    return role === 'client' ? tx.fournisseur : tx.client;
  }, [tx, role, isAdmin]);

  const partnerName = useMemo(() => {
    if (!tx) return 'Partenaire';
    if (isAdmin) return `${tx.client_nom || 'Client'} <-> ${tx.fournisseur_nom || 'Fournisseur'}`;
    return role === 'client' ? (tx.fournisseur_nom || 'Fournisseur') : (tx.client_nom || 'Client');
  }, [tx, role, isAdmin]);

  const workspaceStats = useMemo(() => {
    const total = entries.length;
    const files = entries.filter((e) => e.piece_jointe_url || e.workspace.fileUrl).length;
    const livrables = entries.filter((e) => e.workspace.type === 'livrable').length;
    return { total, files, livrables };
  }, [entries]);
  const isConversationInterrupted = tx?.statut === 'annulee';
  const isConversationClosed = tx?.statut === 'annulee' || tx?.statut === 'terminee';
  const canPostWorkspace = (role === 'client' || role === 'fournisseur') && !isConversationClosed;
  const isQuoteMode = tx?.devis_statut && tx.devis_statut !== 'non_requis';
  const devisEntries = useMemo(
    () => entries.filter((m) => (m?.workspace?.title || '').startsWith(DEVIS_TAG)),
    [entries]
  );

  const workflowEvents = useMemo(() => {
    if (!tx) return [];
    const events = [
      { key: 'created', label: 'Collaboration créée', date: tx.created_at, tone: 'slate' },
      {
        key: 'devis_propose',
        label: 'Devis proposé',
        date: tx.devis_date_proposition,
        show: tx.devis_statut && tx.devis_statut !== 'non_requis' && tx.devis_statut !== 'a_proposer',
        tone: 'indigo',
      },
      {
        key: 'devis_reponse',
        label: tx.devis_statut === 'rejete_client' ? 'Devis rejeté par le client' : 'Devis traité par le client',
        date: tx.devis_date_reponse_client,
        show: !!tx.devis_date_reponse_client,
        tone: tx.devis_statut === 'rejete_client' ? 'rose' : 'emerald',
      },
      {
        key: 'work_done',
        label: 'Travail déclaré effectué par le fournisseur',
        date: tx.travail_fournisseur_date,
        show: !!tx.travail_fournisseur_termine,
        tone: 'indigo',
      },
      {
        key: 'client_verified',
        label: tx.verification_client_validee ? 'Travail vérifié (validé) par le client' : 'Travail vérifié (non validé) par le client',
        date: tx.verification_client_date,
        show: !!tx.verification_client_effectuee,
        tone: tx.verification_client_validee ? 'emerald' : 'amber',
      },
      {
        key: 'admin_requested',
        label: 'Validation admin demandée',
        date: tx.demande_validation_admin_date,
        show: !!tx.demande_validation_admin,
        tone: 'amber',
      },
      {
        key: 'admin_decision',
        label: tx.validation_admin_statut === 'rejetee' ? 'Validation admin rejetée' : 'Validation admin acceptée',
        date: tx.validation_admin_date,
        show: !!tx.validation_admin_date && tx.validation_admin_statut !== 'en_attente',
        tone: tx.validation_admin_statut === 'rejetee' ? 'rose' : 'emerald',
      },
      {
        key: 'interrupted',
        label: 'Conversation interrompue par administration',
        date: tx.updated_at,
        show: tx.statut === 'annulee',
        tone: 'rose',
      },
      { key: 'done', label: 'Transaction terminée', date: tx.heure_fin, show: tx.statut === 'terminee', tone: 'emerald' },
    ];
    return events.filter((e) => e.date && e.show !== false);
  }, [tx]);

  const projectSteps = useMemo(() => {
    if (!tx) return [];

    const s1Done = !!tx.travail_fournisseur_termine;
    const s2Done = !!(tx.verification_client_effectuee && tx.verification_client_validee);
    const s4Done = tx.statut === 'terminee' || tx.validation_admin_statut === 'acceptee';
    const s3Done = s4Done || tx.demande_validation_admin;

    const stepState = (done, allowed) => {
      if (done) return 'done';
      if (!allowed) return 'blocked';
      return 'current';
    };

    return [
      {
        key: 's1',
        title: 'Travail fait par le fournisseur',
        actor: 'Fournisseur',
        state: stepState(s1Done, true),
        canActNow: role === 'fournisseur' && !isConversationClosed && !s1Done,
      },
      {
        key: 's2',
        title: 'Vérification par le client',
        actor: 'Client',
        state: stepState(s2Done, s1Done),
        canActNow: role === 'client' && !isConversationClosed && s1Done && !s2Done,
      },
      {
        key: 's3',
        title: 'Transaction effectuée par le client',
        actor: 'Client',
        state: stepState(s3Done, s2Done),
        canActNow:
          role === 'client' &&
          !isConversationClosed &&
          s2Done &&
          !s3Done &&
          tx.validation_admin_statut !== 'en_attente',
      },
      {
        key: 's4',
        title: 'Transaction confirmée',
        actor: 'Fournisseur / Admin',
        state: stepState(s4Done, s3Done),
        canActNow:
          (role === 'fournisseur' || role === 'admin') &&
          !isConversationClosed &&
          s3Done &&
          !s4Done,
      },
    ];
  }, [tx, role, isConversationClosed]);

  const loadMessages = async (txId) => {
    const res = await fetch(`${API_ENDPOINTS.SERVICES.MESSAGES}?transaction=${txId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Impossible de charger l’espace de travail');
    const data = await res.json();
    const list = (Array.isArray(data) ? data : data.results || []).map(parseWorkspaceEntry);
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setEntries(list);
  };

  const loadNeedDetail = async () => {
    if (!tx?.id) return;
    try {
      setLoadingNeedDetail(true);
      const res = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_BESOIN_DETAILS(tx.id), { headers: authHeaders() });
      if (!res.ok) {
        setNeedDetail(null);
        return;
      }
      const data = await res.json();
      setNeedDetail(data);
    } catch {
      setNeedDetail(null);
    } finally {
      setLoadingNeedDetail(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const detail = await transactionsService.getTransactionById(id);
        setTx(detail);
        await loadMessages(id);
      } catch (e) {
        setError(e.message || 'Impossible de charger cet espace');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [entries]);

  const submitEntry = async () => {
    if (!partnerId || !form.title.trim() || !form.content.trim()) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('destinataire', partnerId);
      fd.append('transaction', id);
      fd.append('sujet', `[Espace travail] ${form.type} - ${form.title.trim()}`);
      fd.append('contenu', buildWorkspacePayload(form));
      if (form.file) fd.append('piece_jointe', form.file);
      const res = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
        method: 'POST',
        headers: authOnlyHeaders(),
        body: fd,
      });
      if (!res.ok) throw new Error('Impossible d’ajouter cette information');
      setForm({ type: 'info', title: '', content: '', fileUrl: '', file: null });
      await loadMessages(id);
    } catch (e) {
      setError(e.message || 'Échec publication');
    } finally {
      setSaving(false);
    }
  };

  const postWorkspaceEntry = async (entry) => {
    if (!partnerId) return;
    const fd = new FormData();
    fd.append('destinataire', partnerId);
    fd.append('transaction', id);
    fd.append('sujet', `[Espace travail] ${entry.type} - ${entry.title.trim()}`);
    fd.append('contenu', buildWorkspacePayload(entry));
    if (entry.file) fd.append('piece_jointe', entry.file);
    const res = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
      method: 'POST',
      headers: authOnlyHeaders(),
      body: fd,
    });
    if (!res.ok) throw new Error('Impossible de publier dans l’espace devis');
  };

  const handleDevisNoteSubmit = async () => {
    if (!devisMessage.trim() || !canPostWorkspace) return;
    try {
      setSaving(true);
      setError('');
      await postWorkspaceEntry({
        type: 'consigne',
        title: `${DEVIS_TAG} Message devis`,
        content: devisMessage.trim(),
        fileUrl: '',
      });
      setDevisMessage('');
      await loadMessages(id);
    } catch (e) {
      setError(e.message || 'Impossible de publier le message devis');
    } finally {
      setSaving(false);
    }
  };

  const handleFournisseurProposeDevis = async () => {
    if (!tx?.id || !devisMontant) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.fournisseurProposeDevis(tx.id, devisMontant, devisDescription);
      setTx(updated);
      await postWorkspaceEntry({
        type: 'info',
        title: `${DEVIS_TAG} Proposition fournisseur`,
        content: `Montant proposé: ${Number(devisMontant).toLocaleString('fr-FR')} FCFA${devisDescription ? `\n\nDétails: ${devisDescription}` : ''}`,
        fileUrl: '',
      });
      setDevisMontant('');
      setDevisDescription('');
      await loadMessages(id);
    } catch (e) {
      setError(e.message || 'Impossible de proposer le devis');
    } finally {
      setActing(false);
    }
  };

  const handleClientRespondDevis = async (decision) => {
    if (!tx?.id) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.clientRespondDevis(tx.id, decision);
      setTx(updated);
      await postWorkspaceEntry({
        type: 'info',
        title: `${DEVIS_TAG} Réponse client`,
        content: decision === 'accepter' ? 'Le client a accepté le devis.' : 'Le client a rejeté le devis.',
        fileUrl: '',
      });
      await loadMessages(id);
    } catch (e) {
      setError(e.message || 'Impossible de répondre au devis');
    } finally {
      setActing(false);
    }
  };

  const handleFournisseurWorkDone = async () => {
    if (!tx?.id) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.fournisseurWorkDone(tx.id);
      setTx(updated);
    } catch (e) {
      setError(e.message || 'Impossible de déclarer le travail effectué');
    } finally {
      setActing(false);
    }
  };

  const handleRequestAdminApproval = async () => {
    if (!tx?.id) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.requestAdminApproval(tx.id);
      setTx(updated);
    } catch (e) {
      setError(e.message || 'Impossible de demander la validation admin');
    } finally {
      setActing(false);
    }
  };

  const handleClientVerifyWork = async () => {
    if (!tx?.id) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.clientVerifyWork(tx.id, true);
      setTx(updated);
    } catch (e) {
      setError(e.message || 'Impossible de vérifier le travail');
    } finally {
      setActing(false);
    }
  };

  const handleClientConfirmTransaction = async () => {
    if (!tx?.id) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.clientConfirmTransaction(tx.id);
      setTx(updated);
    } catch (e) {
      setError(e.message || 'Impossible de confirmer la transaction');
    } finally {
      setActing(false);
    }
  };

  const handleAdminDecision = async (decision) => {
    if (!tx?.id) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.adminDecideTransaction(tx.id, decision);
      setTx(updated);
    } catch (e) {
      setError(e.message || 'Impossible de traiter la décision admin');
    } finally {
      setActing(false);
    }
  };

  const handleAdminFinalize = async () => {
    if (!tx?.id) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.adminFinalizeTransaction(tx.id);
      setTx(updated);
    } catch (e) {
      setError(e.message || 'Impossible de clôturer la transaction');
    } finally {
      setActing(false);
    }
  };

  const handleAdminInterruptConversation = async () => {
    if (!tx?.id) return;
    const ok = await confirm({
      title: 'Interrompre cette conversation ?',
      message: 'Les nouveaux messages seront bloqués pour cette collaboration.',
      tone: 'warning',
      confirmLabel: 'Interrompre',
    });
    if (!ok) return;
    try {
      setActing(true);
      setError('');
      const updated = await transactionsService.updateTransactionStatus(tx.id, 'annulee');
      setTx(updated);
    } catch (e) {
      setError(e.message || 'Impossible d’interrompre la conversation');
    } finally {
      setActing(false);
    }
  };

  const openNeedModal = async () => {
    setShowNeedModal(true);
    await loadNeedDetail();
  };

  const primaryAction = (() => {
    if (!tx || isConversationClosed) return null;
    if (role === 'fournisseur') {
      if (isQuoteMode && (tx.devis_statut === 'a_proposer' || tx.devis_statut === 'rejete_client')) {
        return { label: 'Proposez un devis au client dans l’espace devis ci-dessous.' };
      }
      if (!tx.travail_fournisseur_termine) {
        return { label: 'Réalisez la mission puis déclarez le travail effectué.', cta: 'Travail effectué', onClick: handleFournisseurWorkDone };
      }
      if (tx.verification_client_validee && tx.validation_admin_statut !== 'en_attente' && tx.statut !== 'terminee') {
        return { label: 'Le client a validé : confirmez la transaction.', cta: 'Confirmer', onClick: handleRequestAdminApproval };
      }
      return null;
    }
    if (role === 'client') {
      if (isQuoteMode && tx.devis_statut === 'en_attente_client') {
        return { label: 'Le fournisseur a proposé un devis : répondez dans l’espace devis ci-dessous.' };
      }
      if (tx.travail_fournisseur_termine && !tx.verification_client_effectuee) {
        return { label: 'Le fournisseur a terminé : vérifiez le travail.', cta: 'Travail vérifié', onClick: handleClientVerifyWork };
      }
      if (tx.verification_client_validee && tx.statut !== 'terminee' && tx.validation_admin_statut !== 'en_attente') {
        return { label: 'Confirmez que la transaction est effectuée.', cta: 'Transaction effectuée', onClick: handleClientConfirmTransaction };
      }
      return null;
    }
    if (isAdmin && tx.validation_admin_statut === 'en_attente') {
      return { label: 'Une validation administrateur est en attente dans le suivi ci-dessous.' };
    }
    return null;
  })();

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!tx) return <div className="p-6 text-red-600">{error || 'Introuvable'}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FiBriefcase className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900">Espace de collaboration</h1>
                <p className="truncate text-sm text-slate-600">#{tx.id} · {partnerName}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-1 font-medium ${statutPillClass(tx.statut)}`}>
                {statutLabel(tx.statut)}
              </span>
              {tx.prix_final != null ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  {Number(tx.prix_final).toLocaleString('fr-FR')} FCFA
                </span>
              ) : null}
              {isQuoteMode ? (
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-medium text-indigo-800">
                  Devis : {devisStatutLabel(tx.devis_statut)}
                </span>
              ) : null}
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                {workspaceStats.total} échange(s)
              </span>
            </div>
          </div>
          <button onClick={() => navigate(backPath)} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </button>
        </div>
        {isConversationInterrupted ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Conversation interrompue. Cet espace est désormais en lecture seule.
          </div>
        ) : tx?.statut === 'terminee' ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Collaboration terminée. Cet espace est désormais en lecture seule.
          </div>
        ) : null}
      </div>

      {primaryAction ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Prochaine étape</p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{primaryAction.label}</p>
          </div>
          {primaryAction.onClick ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={acting}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {primaryAction.cta}
              <FiArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Résumé mission</h2>
            <p className="mt-2 text-sm"><FiBriefcase className="mr-1 inline" /> <span className="font-medium">{tx.besoin_intitule || '—'}</span></p>
            <p className="mt-1 text-sm"><FiUser className="mr-1 inline" /> {partnerName}</p>
            <p className="mt-1 text-sm"><FiCalendar className="mr-1 inline" /> Créée: {fmt(tx.created_at)}</p>
            <p className="mt-1 text-sm">Statut : <span className="font-medium">{statutLabel(tx.statut)}</span></p>
            <p className="mt-1 text-sm">Montant: <span className="font-medium">{tx.prix_final != null ? `${Number(tx.prix_final).toLocaleString('fr-FR')} FCFA` : '—'}</span></p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openNeedModal}
                className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Voir le besoin
              </button>
              <Link to={role === 'client' ? `/client/transactions/${tx.id}` : role === 'fournisseur' ? `/fournisseur/transactions/${tx.id}` : '/admin/transactions'} className="text-sm text-indigo-700 underline">
                Voir la transaction complète
              </Link>
            </div>
          </div>

          {role === 'fournisseur' ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Actions fournisseur</h2>
              <p className="mt-1 text-xs text-slate-600">
                Pilotez l’avancement de la mission depuis cet espace.
              </p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleFournisseurWorkDone}
                  disabled={acting || isConversationClosed || tx?.travail_fournisseur_termine}
                  className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-700 disabled:opacity-50"
                >
                  Travail effectué
                </button>
                <button
                  type="button"
                  onClick={handleRequestAdminApproval}
                  disabled={acting || isConversationClosed || tx?.validation_admin_statut === 'en_attente' || tx?.statut === 'terminee'}
                  className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-700 disabled:opacity-50"
                >
                  Transaction confirmée
                </button>
              </div>
            </div>
          ) : null}

          {role === 'client' ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Actions client</h2>
              <p className="mt-1 text-xs text-slate-600">
                Validez le travail du fournisseur et clôturez la mission.
              </p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleClientVerifyWork}
                  disabled={acting || isConversationClosed || !tx?.travail_fournisseur_termine || tx?.verification_client_effectuee}
                  className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-700 disabled:opacity-50"
                >
                  Travail vérifié
                </button>
                <button
                  type="button"
                  onClick={handleClientConfirmTransaction}
                  disabled={acting || isConversationClosed || !tx?.verification_client_validee || tx?.statut === 'terminee' || tx?.validation_admin_statut === 'en_attente'}
                  className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-700 disabled:opacity-50"
                >
                  Transaction effectuée
                </button>
              </div>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Actions admin</h2>
              <p className="mt-1 text-xs text-slate-600">
                Pilotez la validation et la clôture de cette collaboration.
              </p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => handleAdminDecision('accepter')}
                  disabled={acting || tx?.validation_admin_statut !== 'en_attente'}
                  className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-700 disabled:opacity-50"
                >
                  Accepter validation admin
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminDecision('rejeter')}
                  disabled={acting || tx?.validation_admin_statut !== 'en_attente'}
                  className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-50"
                >
                  Rejeter validation admin
                </button>
                <button
                  type="button"
                  onClick={handleAdminFinalize}
                  disabled={acting || tx?.statut === 'terminee'}
                  className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-700 disabled:opacity-50"
                >
                  Clôturer la transaction
                </button>
                <button
                  type="button"
                  onClick={handleAdminInterruptConversation}
                  disabled={acting || isConversationInterrupted}
                  className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-50"
                >
                  Interrompre la conversation
                </button>
              </div>
            </div>
          ) : null}

          {canPostWorkspace ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
            <h2 className="text-sm font-semibold text-slate-900">Ajouter une information</h2>
            <div className="mt-3 space-y-2">
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="info">Info</option>
                <option value="consigne">Consigne</option>
                <option value="livrable">Livrable</option>
                <option value="fichier">Fichier</option>
              </select>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Titre" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={4} placeholder="Contenu" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input type="url" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} placeholder="Lien fichier (optionnel)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input type="file" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} className="block w-full text-xs" />
              <button onClick={submitEntry} disabled={saving || !form.title.trim() || !form.content.trim()} className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">
                <FiSend className="mr-2 h-4 w-4" />
                {saving ? 'Publication...' : 'Publier dans l’espace'}
              </button>
            </div>
          </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
              {isConversationClosed
                ? 'Conversation fermée : ajout de nouveaux messages désactivé.'
                : 'Mode observateur admin : consultation uniquement.'}
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Échanges de la collaboration</h2>
            <p className="text-xs text-slate-500">Messages, consignes, livrables et fichiers partagés.</p>
          </div>
          <div ref={chatRef} className="max-h-[56vh] min-h-[300px] space-y-1 overflow-y-auto bg-slate-50 p-4">
            {entries.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center text-slate-400">
                <FiMessageSquare className="mb-2 h-10 w-10 text-slate-200" />
                <p className="text-sm">Aucun échange pour le moment.</p>
              </div>
            ) : (
              entries.map((m, idx) => {
                const mine = !isAdmin && getUserId(m.expediteur) === myId;
                const prev = entries[idx - 1];
                const showDay = !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at));
                const wtype = m.workspace.type;
                const showBadge = ['consigne', 'livrable', 'fichier'].includes(wtype);
                const showTitle = m.workspace.title && m.workspace.title !== 'Note';
                return (
                  <React.Fragment key={m.id}>
                    {showDay ? (
                      <div className="my-3 flex items-center justify-center">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                          {dayLabel(m.created_at)}
                        </span>
                      </div>
                    ) : null}
                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex max-w-[88%] items-end gap-2">
                        {!mine ? (
                          <span className={`mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${colorForKey(getUserId(m.expediteur))}`}>
                            {initialsFor(m.expediteur_nom || partnerName)}
                          </span>
                        ) : null}
                        <div className={`rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-900'}`}>
                          {!mine ? (
                            <p className="mb-0.5 text-[11px] font-semibold text-slate-500">{m.expediteur_nom || partnerName}</p>
                          ) : null}
                          {showBadge ? (
                            <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${mine ? 'bg-white/20 text-white' : typeBadgeClass(wtype)}`}>
                              {typeLabel(wtype)}
                            </span>
                          ) : null}
                          {showTitle ? <p className="text-sm font-semibold">{m.workspace.title}</p> : null}
                          {m.workspace.content ? (
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed">{m.workspace.content}</p>
                          ) : null}
                          {m.workspace.fileUrl ? (
                            <a href={m.workspace.fileUrl} target="_blank" rel="noreferrer" className={`mt-1.5 inline-flex items-center text-xs underline ${mine ? 'text-indigo-100' : 'text-indigo-700'}`}>
                              <FiPaperclip className="mr-1 h-3.5 w-3.5" />
                              Lien partagé
                            </a>
                          ) : null}
                          {m.piece_jointe_url ? (
                            <a href={m.piece_jointe_url} target="_blank" rel="noreferrer" className={`mt-1.5 inline-flex items-center text-xs underline ${mine ? 'text-indigo-100' : 'text-indigo-700'} ${m.workspace.fileUrl ? 'ml-3' : ''}`}>
                              <FiPaperclip className="mr-1 h-3.5 w-3.5" />
                              {m.piece_jointe_nom || 'Télécharger'}
                            </a>
                          ) : null}
                          <p className={`mt-1 text-right text-[10px] ${mine ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {timeLabel(m.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Historique du workflow</h2>
        <div className="mt-3 space-y-2">
          {workflowEvents.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun événement workflow pour le moment.</p>
          ) : (
            workflowEvents.map((event) => (
              <div key={event.key} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-sm text-slate-800">{event.label}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    event.tone === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800'
                      : event.tone === 'amber'
                      ? 'bg-amber-100 text-amber-800'
                      : event.tone === 'rose'
                      ? 'bg-rose-100 text-rose-800'
                      : event.tone === 'indigo'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {fmt(event.date)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {isQuoteMode ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Espace devis</h2>
          <p className="mt-1 text-xs text-slate-600">
            Discussion dédiée au devis pour cette prestation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
              Statut devis : {devisStatutLabel(tx.devis_statut)}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-slate-700">
              Montant proposé: {tx.devis_montant_propose != null ? `${Number(tx.devis_montant_propose).toLocaleString('fr-FR')} FCFA` : '—'}
            </span>
          </div>

          {role === 'fournisseur' && !isConversationClosed ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium text-slate-700">Proposer un devis</p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                <input
                  type="number"
                  min="1"
                  value={devisMontant}
                  onChange={(e) => setDevisMontant(e.target.value)}
                  placeholder="Montant FCFA"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={devisDescription}
                  onChange={(e) => setDevisDescription(e.target.value)}
                  placeholder="Description (optionnel)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                />
              </div>
              <button
                type="button"
                onClick={handleFournisseurProposeDevis}
                disabled={acting || !devisMontant.trim()}
                className="mt-2 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-700 disabled:opacity-50"
              >
                Envoyer la proposition de devis
              </button>
            </div>
          ) : null}

          {role === 'client' && tx?.devis_statut === 'en_attente_client' && !isConversationClosed ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium text-slate-700">Réponse client au devis</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleClientRespondDevis('accepter')}
                  disabled={acting}
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-700 disabled:opacity-50"
                >
                  Accepter le devis
                </button>
                <button
                  type="button"
                  onClick={() => handleClientRespondDevis('rejeter')}
                  disabled={acting}
                  className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-50"
                >
                  Rejeter le devis
                </button>
              </div>
            </div>
          ) : null}

          {!isConversationClosed ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium text-slate-700">Message devis</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={devisMessage}
                  onChange={(e) => setDevisMessage(e.target.value)}
                  placeholder="Écrire un message pour discuter du devis"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleDevisNoteSubmit}
                  disabled={saving || !devisMessage.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  Envoyer
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-3 space-y-2">
            {devisEntries.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun échange devis pour le moment.</p>
            ) : (
              devisEntries.map((m) => (
                <div key={`devis-${m.id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">{m.expediteur_nom || 'Partenaire'}</p>
                    <p className="text-[11px] text-slate-500">{fmt(m.created_at)}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">{(m.workspace.title || '').replace(DEVIS_TAG, '').trim() || 'Échange devis'}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{m.workspace.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Parcours complet du besoin</h2>
        <p className="mt-1 text-xs text-slate-600">
          Toutes les étapes visibles par client, fournisseur et administrateur.
        </p>
        <div className="mt-3 space-y-2">
          {projectSteps.map((step) => (
            <div key={step.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{step.title}</p>
                <p className="text-xs text-slate-500">Acteur: {step.actor}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    step.state === 'done'
                      ? 'bg-emerald-100 text-emerald-800'
                      : step.state === 'current'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {step.state === 'done' ? 'Terminée' : step.state === 'current' ? 'En cours' : 'Bloquée'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    step.canActNow ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {step.canActNow ? 'Action disponible pour vous' : 'Aucune action pour vous'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      {showNeedModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNeedModal(false)}>
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Détails du besoin</h3>
              <button
                type="button"
                onClick={() => setShowNeedModal(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            {loadingNeedDetail ? (
              <p className="text-sm text-slate-500">Chargement des informations...</p>
            ) : (
              <div className="space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold">ID:</span> {tx?.besoin || '—'}</p>
                <p><span className="font-semibold">Intitulé:</span> {needDetail?.intitule || tx?.besoin_intitule || '—'}</p>
                <p><span className="font-semibold">Description:</span> {needDetail?.description || 'Non disponible dans cette vue.'}</p>
                <p><span className="font-semibold">Catégorie:</span> {needDetail?.categorie_nom || '—'}</p>
                <p><span className="font-semibold">Sous-catégorie:</span> {needDetail?.sous_categorie_nom || '—'}</p>
                <p><span className="font-semibold">Type de service:</span> {needDetail?.type_service || '—'}</p>
                <p><span className="font-semibold">Lieu:</span> {needDetail?.lieu_intervention || '—'}</p>
                <p><span className="font-semibold">Urgence:</span> {needDetail?.urgence || '—'}</p>
                <p><span className="font-semibold">Budget:</span> {needDetail?.budget != null ? `${Number(needDetail.budget).toLocaleString('fr-FR')} FCFA` : '—'}</p>
                <p><span className="font-semibold">Statut:</span> {needDetail?.statut || '—'}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

