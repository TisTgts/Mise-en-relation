import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiFilter, FiSearch, FiCalendar, FiUser, FiStar, FiBriefcase, FiAlertCircle, FiChevronDown, FiEye, FiClock, FiCheckCircle, FiSend, FiX, FiPaperclip } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { requestNotificationsRefresh } from '../../../contexts/NotificationContext';
import Toast from '../../../components/Toast';
import transactionsService from '../../../services/transactionsService';
import { transactionToCollaboration } from '../../../utils/collaborationView';
import { API_ENDPOINTS } from '../../../config/api';
import { formatMoneyFcfa, transactionStatutLabel, transactionStatutPillClass } from '../clientUi';

const MesCollaborations = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    collaboration_id: null
  });
  const [exchangeMessages, setExchangeMessages] = useState([]);
  const [loadingExchange, setLoadingExchange] = useState(false);
  const [workspaceEntry, setWorkspaceEntry] = useState({
    type: 'info',
    title: '',
    content: '',
    fileUrl: '',
    file: null,
  });
  const [sendingExchange, setSendingExchange] = useState(false);
  const [unreadByTransaction, setUnreadByTransaction] = useState({});

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  });
  const authOnlyHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  });

  const WORKSPACE_PREFIX = '[WORKSPACE_ENTRY]';

  const buildWorkspacePayload = (entry) =>
    `${WORKSPACE_PREFIX}${JSON.stringify({
      type: entry.type || 'info',
      title: (entry.title || '').trim(),
      content: (entry.content || '').trim(),
      fileUrl: (entry.fileUrl || '').trim(),
    })}`;

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
        // fallback texte simple
      }
    }
    return {
      ...message,
      workspace: {
        type: 'message',
        title: 'Note',
        content: raw,
        fileUrl: '',
      },
    };
  };

  const fetchCollaborations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionsService.getMyTransactions();
      const list = Array.isArray(data) ? data : [];
      setCollaborations(list.map((tx) => transactionToCollaboration(tx, 'client')));
    } catch (error) {
      console.error('Erreur lors du chargement des collaborations:', error);
      setToast({
        message: 'Erreur lors du chargement des collaborations',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUnreadIndicators = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results || [];
      const counts = {};
      list.forEach((m) => {
        const txId = m.transaction?.id ?? m.transaction;
        const destId = m.destinataire?.id ?? m.destinataire;
        if (txId && destId === user.id && !m.lu) {
          counts[txId] = (counts[txId] || 0) + 1;
        }
      });
      setUnreadByTransaction(counts);
    } catch {
      // lecture non bloquante
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && user.type_utilisateur === 'client') {
      fetchCollaborations();
      refreshUnreadIndicators();
    }
  }, [user, fetchCollaborations, refreshUnreadIndicators]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const created = params.get('created');
    if (created) {
      setToast({
        message: 'Nouvelle collaboration créée avec succès.',
        type: 'success',
      });
      fetchCollaborations();
      refreshUnreadIndicators();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- ?created= une fois au montage

  const formatDate = (value) => {
    if (!value) return '—';
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? '—' : new Date(value).toLocaleDateString('fr-FR');
  };

  const filteredAndSortedCollaborations = collaborations
    .filter(collaboration => {
      const matchesSearch = 
        collaboration.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collaboration.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collaboration.fournisseur?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'all') return matchesSearch;
      if (filter === 'en_attente') return collaboration.statut === 'en_attente' && matchesSearch;
      if (filter === 'acceptee') return collaboration.statut === 'acceptee' && matchesSearch;
      if (filter === 'en_cours') return collaboration.statut === 'en_cours' && matchesSearch;
      if (filter === 'terminee') return collaboration.statut === 'terminee' && matchesSearch;
      if (filter === 'annulee') return collaboration.statut === 'annulee' && matchesSearch;
      if (filter === 'avec_review') return collaboration.review && matchesSearch;
      if (filter === 'sans_review') return !collaboration.review && collaboration.statut === 'terminee' && matchesSearch;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'date_fin':
          comparison = new Date(a.date_fin) - new Date(b.date_fin);
          break;
        case 'budget':
          comparison = (a.budget || 0) - (b.budget || 0);
          break;
        case 'titre':
          comparison = a.titre?.localeCompare(b.titre);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const stats = {
    total: filteredAndSortedCollaborations.length,
    enCours: filteredAndSortedCollaborations.filter(c => c.statut === 'en_cours').length,
    terminees: filteredAndSortedCollaborations.filter(c => c.statut === 'terminee').length,
    avecReview: filteredAndSortedCollaborations.filter(c => c.review).length,
    budgetTotal: filteredAndSortedCollaborations.reduce((sum, c) => sum + (c.budget || 0), 0)
  };

  const loadExchangeMessages = async (transactionId) => {
    if (!transactionId) {
      setExchangeMessages([]);
      return;
    }
    try {
      setLoadingExchange(true);
      const res = await fetch(`${API_ENDPOINTS.SERVICES.MESSAGES}?transaction=${transactionId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erreur chargement messages');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results || [];
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setExchangeMessages(list);
    } catch (error) {
      setExchangeMessages([]);
      setToast({
        message: "Impossible de charger l'espace d'échange",
        type: 'error',
      });
    } finally {
      setLoadingExchange(false);
    }
  };

  const handleViewDetails = (collaboration) => {
    setSelectedCollaboration(collaboration);
    setShowDetails(true);
    setWorkspaceEntry({ type: 'info', title: '', content: '', fileUrl: '', file: null });
    loadExchangeMessages(collaboration.id);
  };

  const handleSendExchangeMessage = async () => {
    if (!selectedCollaboration?.id) return;
    if (!workspaceEntry.title.trim() || !workspaceEntry.content.trim()) return;
    const partenaireId = selectedCollaboration?.raw?.fournisseur;
    if (!partenaireId) {
      setToast({
        message: 'Destinataire introuvable pour cette collaboration.',
        type: 'error',
      });
      return;
    }
    try {
      setSendingExchange(true);
      const form = new FormData();
      form.append('destinataire', partenaireId);
      form.append('transaction', selectedCollaboration.id);
      form.append('sujet', `[Espace travail] ${workspaceEntry.type} - ${workspaceEntry.title.trim()}`);
      form.append('contenu', buildWorkspacePayload(workspaceEntry));
      if (workspaceEntry.file) {
        form.append('piece_jointe', workspaceEntry.file);
      }

      const res = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
        method: 'POST',
        headers: authOnlyHeaders(),
        body: form,
      });
      if (!res.ok) throw new Error('Envoi impossible');
      setWorkspaceEntry({ type: 'info', title: '', content: '', fileUrl: '', file: null });
      await loadExchangeMessages(selectedCollaboration.id);
      await refreshUnreadIndicators();
      requestNotificationsRefresh();
    } catch (error) {
      setToast({ message: "Erreur lors de l'ajout dans l'espace de travail", type: 'error' });
    } finally {
      setSendingExchange(false);
    }
  };

  const handleOpenReviewModal = (collaboration) => {
    setReviewData({
      rating: 5,
      comment: '',
      collaboration_id: collaboration.id
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    setShowReviewModal(false);
    setReviewData({ rating: 5, comment: '', collaboration_id: null });
    setToast({
      message: 'La publication d’avis sera disponible prochainement.',
      type: 'info',
    });
  };

  const applyTransactionUpdate = async (updatedTx, successMessage) => {
    const normalized = transactionToCollaboration(updatedTx, 'client');
    setCollaborations((prev) => prev.map((c) => (c.id === normalized.id ? normalized : c)));
    setSelectedCollaboration((prev) => (prev && prev.id === normalized.id ? normalized : prev));
    setToast({ message: successMessage, type: 'success' });
    requestNotificationsRefresh();
  };

  const handleClientVerifyWork = async () => {
    if (!selectedCollaboration?.id) return;
    try {
      const updated = await transactionsService.clientVerifyWork(selectedCollaboration.id, true);
      await applyTransactionUpdate(updated, 'Travail vérifié côté client.');
    } catch (error) {
      setToast({ message: 'Impossible de vérifier le travail.', type: 'error' });
    }
  };

  const handleClientConfirmTransaction = async () => {
    if (!selectedCollaboration?.id) return;
    try {
      const updated = await transactionsService.clientConfirmTransaction(selectedCollaboration.id);
      await applyTransactionUpdate(updated, 'Transaction confirmée et clôturée.');
    } catch (error) {
      setToast({ message: 'Impossible de confirmer la transaction.', type: 'error' });
    }
  };

  const handleRequestAdminApproval = async () => {
    if (!selectedCollaboration?.id) return;
    try {
      const updated = await transactionsService.requestAdminApproval(selectedCollaboration.id);
      await applyTransactionUpdate(updated, 'Demande de validation envoyée à l’administrateur.');
    } catch (error) {
      setToast({ message: 'Impossible de demander la validation admin.', type: 'error' });
    }
  };

  const workflowState = (raw) => {
    if (raw?.validation_admin_statut === 'en_attente') {
      return { label: 'En attente admin', cls: 'bg-amber-100 text-amber-800' };
    }
    if (raw?.statut === 'terminee') {
      return { label: 'Clôturée', cls: 'bg-emerald-100 text-emerald-800' };
    }
    if (raw?.travail_fournisseur_termine && raw?.verification_client_validee) {
      return { label: 'Prête à clôturer', cls: 'bg-indigo-100 text-indigo-800' };
    }
    return { label: 'En progression', cls: 'bg-slate-100 text-slate-700' };
  };

  const buildNeedSteps = (raw) => {
    const hasAdminStep = raw?.demande_validation_admin || raw?.validation_admin_statut === 'en_attente' || raw?.validation_admin_statut === 'acceptee';
    const steps = [
      { key: 'created', label: 'Besoin publié', done: true },
      { key: 'matched', label: 'Match confirmé', done: true },
      { key: 'work_done', label: 'Travail fournisseur', done: !!raw?.travail_fournisseur_termine },
      { key: 'client_check', label: 'Vérification client', done: !!raw?.verification_client_validee },
    ];
    if (hasAdminStep) {
      steps.push({
        key: 'admin',
        label: 'Validation admin',
        done: raw?.validation_admin_statut === 'acceptee',
        blocked: raw?.validation_admin_statut === 'rejetee',
      });
    }
    steps.push({
      key: 'closed',
      label: 'Besoin clôturé',
      done: raw?.statut === 'terminee',
    });
    return steps;
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "button"}
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            className={`${interactive ? 'hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <FiStar
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Collaborations</h1>
            <p className="text-gray-600 mt-2">Suivez vos échanges issus des transactions avec les fournisseurs</p>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiFilter className="inline mr-2 h-4 w-4" />
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une collaboration..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <FiSearch className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            </div>
          </div>
          
          {/* Statut */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Statut
            </label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Toutes les collaborations</option>
                <option value="en_attente">En attente</option>
                <option value="acceptee">Acceptée</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminées</option>
                <option value="annulee">Annulées</option>
                <option value="avec_review">Avec avis</option>
                <option value="sans_review">Sans avis (terminées)</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trier par
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="created_at">Date de création</option>
                <option value="date_fin">Date de fin</option>
                <option value="budget">Budget</option>
                <option value="titre">Titre</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Ordre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ordre
            </label>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="desc">Récent</option>
                <option value="asc">Ancien</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <FiBriefcase className="h-7 w-7 text-slate-400" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">En cours</p>
              <p className="text-3xl font-bold text-amber-700">{stats.enCours}</p>
            </div>
            <FiClock className="h-7 w-7 text-amber-500" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Terminées</p>
              <p className="text-3xl font-bold text-emerald-700">{stats.terminees}</p>
            </div>
            <FiCheckCircle className="h-7 w-7 text-emerald-500" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avis</p>
              <p className="text-3xl font-bold text-violet-700">{stats.avecReview}</p>
            </div>
            <FiStar className="h-7 w-7 text-violet-500" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget total</p>
              <p className="text-xl font-bold text-orange-700">{formatMoneyFcfa(stats.budgetTotal)}</p>
            </div>
            <FiAlertCircle className="h-7 w-7 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tableau moderne */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredAndSortedCollaborations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune collaboration trouvée</h3>
              <p className="text-gray-600">Les collaborations apparaissent lorsque vous avez une transaction en cours ou terminée.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Collaboration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAndSortedCollaborations.map((collaboration) => (
                  <tr key={collaboration.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {collaboration.titre}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiBriefcase className="mr-1 h-3 w-3" />
                          {collaboration.categorie?.nom}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {collaboration.fournisseur?.nom}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <FiStar className="mr-1 h-3 w-3 text-yellow-400" />
                            {collaboration.fournisseur?.note_moyenne || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>{formatDate(collaboration.date_debut)}</div>
                        <div className="text-gray-500">au</div>
                        <div>{formatDate(collaboration.date_fin)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${transactionStatutPillClass(collaboration.statut)}`}>
                        {transactionStatutLabel(collaboration.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(collaboration)}
                          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          title="Voir les détails"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/client/collaborations/${collaboration.id}/workspace`}
                          className="inline-flex items-center rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                          title="Espace de travail"
                        >
                          Espace travail
                          {unreadByTransaction[collaboration.id] ? (
                            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                              {unreadByTransaction[collaboration.id]}
                            </span>
                          ) : null}
                        </Link>
                        <Link
                          to={`/client/transactions/${collaboration.id}`}
                          className="inline-flex items-center rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                          title="Fiche transaction"
                        >
                          Transaction
                        </Link>
                        {collaboration.statut === 'terminee' && !collaboration.review && (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(collaboration)}
                          className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                            title="Laisser un avis"
                          >
                            <FiStar className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetails && selectedCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCollaboration.titre}</h2>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${transactionStatutPillClass(selectedCollaboration.statut)}`}>
                      {transactionStatutLabel(selectedCollaboration.statut)}
                    </span>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                      <FiBriefcase className="mr-2 h-4 w-4" />
                      {selectedCollaboration.categorie?.nom}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedCollaboration.description}</p>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Période</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Début:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(selectedCollaboration.date_debut)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Fin:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(selectedCollaboration.date_fin)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiAlertCircle className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Montant:</span>
                        <span className="ml-2 font-medium">
                          {formatMoneyFcfa(selectedCollaboration.budget)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Fournisseur</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <FiUser className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedCollaboration.fournisseur?.nom}</p>
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <FiStar className="mr-1 h-3 w-3 text-yellow-400" />
                            {selectedCollaboration.fournisseur?.note_moyenne ?? '—'}
                          </div>
                          {selectedCollaboration.fournisseur?.email ? (
                            <div className="text-sm text-gray-600">
                              {selectedCollaboration.fournisseur.email}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avis */}
                {selectedCollaboration.review && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Avis</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {renderStars(selectedCollaboration.review.rating)}
                          <span className="text-sm text-gray-600">
                            {new Date(selectedCollaboration.review.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Par {selectedCollaboration.review.auteur}
                        </span>
                      </div>
                      <p className="text-gray-700">{selectedCollaboration.review.comment}</p>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Clôture de la transaction</h3>
                  <div className="mt-2">
                    {(() => {
                      const wf = workflowState(selectedCollaboration.raw);
                      return (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${wf.cls}`}>
                          {wf.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-700">
                    <p className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${selectedCollaboration.raw?.travail_fournisseur_termine ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      Travail fournisseur
                    </p>
                    <p className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${selectedCollaboration.raw?.verification_client_validee ? 'bg-emerald-500' : selectedCollaboration.raw?.verification_client_effectuee ? 'bg-rose-500' : 'bg-slate-300'}`} />
                      Vérification client
                    </p>
                    <p className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${selectedCollaboration.raw?.validation_admin_statut === 'acceptee' ? 'bg-emerald-500' : selectedCollaboration.raw?.validation_admin_statut === 'rejetee' ? 'bg-rose-500' : selectedCollaboration.raw?.validation_admin_statut === 'en_attente' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                      Validation admin ({selectedCollaboration.raw?.validation_admin_statut || 'non_requise'})
                    </p>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Ligne de cheminement du besoin
                    </p>
                    <div className="mt-3 overflow-x-auto pb-1">
                      <div className="flex min-w-max items-start">
                        {buildNeedSteps(selectedCollaboration.raw).map((step, idx, arr) => {
                        const isDone = step.done;
                        const isBlocked = step.blocked;
                        const isCurrent =
                          !isDone &&
                          !isBlocked &&
                          arr.findIndex((s) => !s.done && !s.blocked) === idx;
                        return (
                          <React.Fragment key={step.key}>
                            <div className="flex w-32 flex-col items-center text-center">
                              <span
                                className={`h-3 w-3 rounded-full ${
                                  isBlocked
                                    ? 'bg-rose-500'
                                    : isDone
                                    ? 'bg-emerald-500'
                                    : isCurrent
                                    ? 'bg-indigo-500'
                                    : 'bg-slate-300'
                                }`}
                              />
                              <span
                                className={`mt-2 text-[11px] font-medium ${
                                  isBlocked
                                    ? 'text-rose-700'
                                    : isDone
                                    ? 'text-emerald-700'
                                    : isCurrent
                                    ? 'text-indigo-700'
                                    : 'text-slate-600'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                            {idx < arr.length - 1 ? (
                              <div
                                className={`mt-1 h-0.5 w-10 ${
                                  isDone ? 'bg-emerald-400' : 'bg-slate-300'
                                }`}
                              />
                            ) : null}
                          </React.Fragment>
                        );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
                    <p>Travail fournisseur: <span className="font-semibold">{selectedCollaboration.raw?.travail_fournisseur_termine ? 'déclaré' : 'non déclaré'}</span></p>
                    <p>Vérification client: <span className="font-semibold">{selectedCollaboration.raw?.verification_client_effectuee ? 'faite' : 'en attente'}</span></p>
                    <p>Validation client: <span className="font-semibold">{selectedCollaboration.raw?.verification_client_validee ? 'validée' : 'non validée'}</span></p>
                    <p>Validation admin: <span className="font-semibold">{selectedCollaboration.raw?.validation_admin_statut || 'non_requise'}</span></p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleClientVerifyWork}
                      disabled={!selectedCollaboration.raw?.travail_fournisseur_termine || selectedCollaboration.raw?.verification_client_effectuee}
                      className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-700 disabled:opacity-50"
                    >
                      Vérifier le travail
                    </button>
                    <button
                      type="button"
                      onClick={handleClientConfirmTransaction}
                      disabled={
                        !selectedCollaboration.raw?.verification_client_validee ||
                        selectedCollaboration.statut === 'terminee' ||
                        selectedCollaboration.raw?.validation_admin_statut === 'en_attente'
                      }
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-700 disabled:opacity-50"
                    >
                      Confirmer la transaction
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestAdminApproval}
                      disabled={selectedCollaboration.raw?.validation_admin_statut === 'en_attente'}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-700 disabled:opacity-50"
                    >
                      Demander validation admin
                    </button>
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
                {selectedCollaboration.statut === 'terminee' && !selectedCollaboration.review && (
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      handleOpenReviewModal(selectedCollaboration);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Laisser un avis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal espace d'échange rapide */}
      {showExchangeModal && selectedCollaboration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Espace d'échange</h2>
                <p className="text-sm text-slate-600">
                  {selectedCollaboration.titre} - {selectedCollaboration.fournisseur?.nom || 'Fournisseur'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExchangeModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 bg-slate-50 p-4">
              {loadingExchange ? (
                <p className="text-sm text-slate-500">Chargement des messages...</p>
              ) : exchangeMessages.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun message pour cette collaboration.</p>
              ) : (
                exchangeMessages.map((m) => {
                  const parsed = parseWorkspaceEntry(m);
                  const isMine = (m.expediteur?.id ?? m.expediteur) === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${isMine ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-200'} max-w-[90%] rounded-lg px-3 py-2`}>
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold">{isMine ? 'Vous' : m.expediteur_nom || 'Partenaire'}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${isMine ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {parsed.workspace.type}
                          </span>
                        </div>
                        <p className="text-sm font-semibold">{parsed.workspace.title}</p>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{parsed.workspace.content}</p>
                        {parsed.workspace.fileUrl ? (
                          <a
                            href={parsed.workspace.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-2 inline-flex items-center gap-1 text-xs underline ${isMine ? 'text-indigo-100' : 'text-indigo-700'}`}
                          >
                            <FiPaperclip className="h-3.5 w-3.5" />
                            Ouvrir le fichier/lien
                          </a>
                        ) : null}
                        {m.piece_jointe_url ? (
                          <a
                            href={m.piece_jointe_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-2 block text-xs underline ${isMine ? 'text-indigo-100' : 'text-indigo-700'}`}
                          >
                            Fichier joint: {m.piece_jointe_nom || 'Télécharger'}
                          </a>
                        ) : null}
                        <p className={`mt-2 text-[10px] ${isMine ? 'text-indigo-100' : 'text-gray-500'}`}>
                          {new Date(m.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-2 border-t border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Ajouter une information de travail
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <select
                  value={workspaceEntry.type}
                  onChange={(e) => setWorkspaceEntry((prev) => ({ ...prev, type: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="info">Info</option>
                  <option value="consigne">Consigne</option>
                  <option value="livrable">Livrable</option>
                  <option value="fichier">Fichier</option>
                </select>
                <input
                  type="text"
                  value={workspaceEntry.title}
                  onChange={(e) => setWorkspaceEntry((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre (ex: Cahier des charges)"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 md:col-span-2"
                />
              </div>
              <textarea
                value={workspaceEntry.content}
                onChange={(e) => setWorkspaceEntry((prev) => ({ ...prev, content: e.target.value }))}
                rows={3}
                placeholder="Détails utiles pour exécuter le travail..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={workspaceEntry.fileUrl}
                  onChange={(e) => setWorkspaceEntry((prev) => ({ ...prev, fileUrl: e.target.value }))}
                  placeholder="Lien fichier (Drive, Dropbox, etc.) - optionnel"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={(e) => setWorkspaceEntry((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium"
                />
              </div>
              <button
                type="button"
                onClick={handleSendExchangeMessage}
                disabled={sendingExchange || !workspaceEntry.title.trim() || !workspaceEntry.content.trim()}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <FiSend className="h-4 w-4" />
                <span className="ml-2">Publier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal avis */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Laisser un avis</h2>
                  <p className="text-gray-600 mt-2">Évaluez votre collaboration</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <div className="flex justify-center">
                    {renderStars(reviewData.rating, true, (rating) => 
                      setReviewData(prev => ({ ...prev, rating }))
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire
                  </label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Décrivez votre expérience..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Publier l’avis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MesCollaborations;
