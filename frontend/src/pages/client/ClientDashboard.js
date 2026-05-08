import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiSearch,
  FiBriefcase,
  FiClock,
  FiAlertCircle,
  FiPlus,
  FiFilter,
  FiMapPin,
  FiUsers,
  FiEye,
  FiRefreshCw,
  FiChevronRight,
  FiLayers,
  FiUser,
} from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import {
  truncateText,
  besoinStatutLabel,
  besoinStatutPillClass,
  urgenceLabel,
  urgencePillClass,
  transactionStatutLabel,
  transactionStatutPillClass,
  formatMoneyFcfa,
  formatDateShort,
} from './clientUi';

const TABS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'besoins', label: 'Mes besoins' },
  { id: 'collaborations', label: 'Collaborations' },
  { id: 'prestations', label: 'Prestations' },
];

const BESOIN_FILTRES = [
  { id: 'tous', label: 'Tous' },
  { id: 'ouverte', label: 'Ouverts' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'pourvue', label: 'Pourvus' },
  { id: 'annulee', label: 'Annulés' },
];

const COLLAB_FILTRES = [
  { id: 'actives', label: 'En cours' },
  { id: 'terminees', label: 'Terminées' },
  { id: 'annulees', label: 'Annulées' },
];

const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  const h = { 'Content-Type': 'application/json' };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
};

const parseList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

const formatZones = (zones) => {
  if (!zones) return '—';
  if (Array.isArray(zones)) return zones.length ? zones.slice(0, 3).join(', ') : '—';
  return '—';
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState('accueil');
  const [besoinFiltre, setBesoinFiltre] = useState('tous');
  const [collabFiltre, setCollabFiltre] = useState('actives');

  const [besoins, setBesoins] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [prestations, setPrestations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setError(null);
    const headers = authHeaders();
    if (!headers.Authorization) {
      setError('Session expirée. Reconnectez-vous.');
      setLoading(false);
      return;
    }

    try {
      const [besoinsRes, transRes, prestRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.SERVICES.BESOINS}my/`, { headers }),
        fetch(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}`, { headers }),
        fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}public/`, { headers }),
      ]);

      if (besoinsRes.ok) {
        const data = await besoinsRes.json();
        setBesoins(parseList(data));
      } else {
        setBesoins([]);
      }

      if (transRes.ok) {
        const data = await transRes.json();
        setTransactions(parseList(data));
      } else {
        setTransactions([]);
      }

      if (prestRes.ok) {
        const data = await prestRes.json();
        setPrestations(parseList(data).slice(0, 24));
      } else {
        setPrestations([]);
      }
    } catch (e) {
      console.error(e);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.id === t)) {
      setTab(t);
    } else if (!t) {
      setTab('accueil');
    }
  }, [searchParams]);

  const goTab = (id) => {
    setTab(id);
    if (id === 'accueil') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: id }, { replace: true });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const stats = useMemo(() => {
    const actifs = besoins.filter((b) => b.statut === 'ouverte' || b.statut === 'en_cours').length;
    const pourvus = besoins.filter((b) => b.statut === 'pourvue').length;
    const txActives = transactions.filter((t) =>
      ['en_attente', 'acceptee', 'en_cours'].includes(t.statut)
    ).length;
    const totalDepense = transactions
      .filter((t) => t.statut === 'terminee' && t.prix_final != null)
      .reduce((sum, t) => sum + Number(t.prix_final || 0), 0);
    return {
      besoinsActifs: actifs,
      besoinsPourvus: pourvus,
      collaborationsEnCours: txActives,
      totalDepense,
      totalBesoins: besoins.length,
    };
  }, [besoins, transactions]);

  const besoinsFiltres = useMemo(() => {
    if (besoinFiltre === 'tous') return besoins;
    return besoins.filter((b) => b.statut === besoinFiltre);
  }, [besoins, besoinFiltre]);

  const transactionsFiltrees = useMemo(() => {
    if (collabFiltre === 'actives') {
      return transactions.filter((t) => ['en_attente', 'acceptee', 'en_cours'].includes(t.statut));
    }
    if (collabFiltre === 'terminees') return transactions.filter((t) => t.statut === 'terminee');
    if (collabFiltre === 'annulees') return transactions.filter((t) => t.statut === 'annulee');
    return transactions;
  }, [transactions, collabFiltre]);

  const journeyHint = useMemo(() => {
    const openCount = besoins.filter((b) => b.statut === 'ouverte').length;
    if (besoins.length === 0) {
      return {
        title: 'Par où commencer ?',
        description: 'Publiez un besoin pour être mis en relation avec des prestataires.',
        primaryLabel: 'Créer mon premier besoin',
        onPrimary: () => navigate('/client/creer-besoin'),
      };
    }
    if (openCount > 0) {
      return {
        title: 'Étape suivante',
        description: `Vous avez ${openCount} besoin(s) ouvert(s). Consultez les correspondances ou complétez vos fiches depuis Mes besoins.`,
        primaryLabel: 'Voir les correspondances',
        onPrimary: () => navigate('/client/matchings'),
        secondaryLabel: 'Mes besoins',
        onSecondary: () => {
          setBesoinFiltre('ouverte');
          setTab('besoins');
          setSearchParams({ tab: 'besoins' }, { replace: true });
        },
      };
    }
    if (stats.collaborationsEnCours > 0) {
      return {
        title: 'Collaborations en cours',
        description:
          'Suivez l’avancement (messages, validation, paiement) depuis l’onglet Collaborations ou vos transactions.',
        primaryLabel: 'Ouvrir collaborations',
        onPrimary: () => {
          setCollabFiltre('actives');
          setTab('collaborations');
          setSearchParams({ tab: 'collaborations' }, { replace: true });
        },
        secondaryLabel: 'Mes transactions',
        onSecondary: () => navigate('/client/transactions'),
      };
    }
    return null;
  }, [besoins, stats.collaborationsEnCours, navigate, setSearchParams]);

  const handleBesoinStatut = async (besoinId, statutActuel) => {
    const prochain = statutActuel === 'ouverte' ? 'annulee' : 'ouverte';
    try {
      const res = await fetch(`${API_ENDPOINTS.SERVICES.BESOINS}${besoinId}/`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ statut: prochain }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBesoins((prev) => prev.map((b) => (b.id === besoinId ? { ...b, ...updated } : b)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-600 mt-1">
              Bienvenue{user?.first_name ? `, ${user.first_name}` : ''} — suivez vos besoins et vos collaborations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => navigate('/client/profil')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              <FiUser className="w-4 h-4" />
              Mon profil
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {journeyHint && (
          <div className="mb-6 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-slate-50 p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-indigo-900">{journeyHint.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{journeyHint.description}</p>
            </div>
            <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">
              <button
                type="button"
                onClick={journeyHint.onPrimary}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {journeyHint.primaryLabel}
              </button>
              {journeyHint.secondaryLabel && journeyHint.onSecondary && (
                <button
                  type="button"
                  onClick={journeyHint.onSecondary}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {journeyHint.secondaryLabel}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">Besoins actifs</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.besoinsActifs}</p>
            <p className="text-xs text-gray-400 mt-2">{stats.totalBesoins} besoin(s) au total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">Collaborations en cours</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.collaborationsEnCours}</p>
            <p className="text-xs text-gray-400 mt-2">Transactions non terminées</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">Total dépensé (terminé)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {Math.round(stats.totalDepense).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500">Besoins pourvus</p>
            <p className="text-2xl font-bold text-violet-600 mt-1">{stats.besoinsPourvus}</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="flex flex-wrap border-b border-gray-100">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => goTab(t.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  tab === t.id
                    ? 'text-primary-700 bg-primary-50/80'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            {tab === 'accueil' && (
              <div className="space-y-6">
                <p className="text-gray-600 text-sm">
                  Accédez rapidement aux actions les plus courantes. Les onglets <strong>Mes besoins</strong> et{' '}
                  <strong>Collaborations</strong> regroupent le détail filtrable.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/client/creer-besoin')}
                    className="text-left rounded-xl border border-gray-100 p-5 hover:border-primary-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                      <FiPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">Nouveau besoin</h3>
                    <p className="text-sm text-gray-500 mt-1">Publier un besoin de service</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBesoinFiltre('tous');
                      goTab('besoins');
                    }}
                    className="text-left rounded-xl border border-gray-100 p-5 hover:border-primary-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                      <FiFilter className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">Mes besoins</h3>
                    <p className="text-sm text-gray-500 mt-1">Voir et filtrer tous vos besoins</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCollabFiltre('actives');
                      goTab('collaborations');
                    }}
                    className="text-left rounded-xl border border-gray-100 p-5 hover:border-primary-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-11 h-11 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                      <FiLayers className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">Collaborations</h3>
                    <p className="text-sm text-gray-500 mt-1">Suivre vos transactions avec les fournisseurs</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/services')}
                    className="text-left rounded-xl border border-gray-100 p-5 hover:border-primary-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-11 h-11 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
                      <FiSearch className="w-5 h-5 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">Prestations</h3>
                    <p className="text-sm text-gray-500 mt-1">Parcourir les prestations disponibles</p>
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/client/messages')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800"
                  >
                    <FiUsers className="w-4 h-4" />
                    Messages
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/client/transactions')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FiBriefcase className="w-4 h-4" />
                    Toutes les transactions
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/client/mes-collaborations')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Page collaborations détaillée
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/client/matchings')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-sm text-indigo-700 hover:bg-indigo-50"
                  >
                    Mes besoins matchés
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {tab === 'besoins' && (
              <div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {BESOIN_FILTRES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBesoinFiltre(f.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        besoinFiltre === f.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {besoinsFiltres.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FiBriefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucun besoin dans cette catégorie.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/client/creer-besoin')}
                      className="mt-4 text-primary-600 font-medium text-sm hover:underline"
                    >
                      Créer un besoin
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Intitulé</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Statut</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Urgence</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Budget</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Limite</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {besoinsFiltres.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/80">
                            <td className="max-w-[14rem] px-3 py-2 align-top">
                              <span className="font-medium text-gray-900" title={b.intitule}>
                                {truncateText(b.intitule, 48)}
                              </span>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                <FiMapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{b.lieu_intervention || '—'}</span>
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${besoinStatutPillClass(b.statut)}`}>
                                {besoinStatutLabel(b.statut)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${urgencePillClass(b.urgence)}`}>
                                {urgenceLabel(b.urgence)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top tabular-nums text-gray-800">
                              {formatMoneyFcfa(b.budget)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <FiClock className="h-3 w-3 text-gray-400" />
                                {formatDateShort(b.date_limite)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top text-right">
                              <div className="flex flex-wrap justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/client/besoins/${b.id}`)}
                                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  Détail
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/client/besoins/${b.id}/edit`)}
                                  className="rounded-lg bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700"
                                >
                                  Modifier
                                </button>
                                {(b.statut === 'ouverte' || b.statut === 'annulee') && (
                                  <button
                                    type="button"
                                    onClick={() => handleBesoinStatut(b.id, b.statut)}
                                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                  >
                                    {b.statut === 'ouverte' ? 'Annuler' : 'Rouvrir'}
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
            )}

            {tab === 'collaborations' && (
              <div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {COLLAB_FILTRES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCollabFiltre(f.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        collabFiltre === f.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {transactionsFiltrees.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune collaboration dans cette catégorie.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/services')}
                      className="mt-4 text-primary-600 font-medium text-sm hover:underline"
                    >
                      Découvrir des prestations
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Statut</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Prestation</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Besoin</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Fournisseur</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Montant</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {transactionsFiltrees.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-50/80">
                            <td className="whitespace-nowrap px-3 py-2 align-middle">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${transactionStatutPillClass(tx.statut)}`}>
                                {transactionStatutLabel(tx.statut)}
                              </span>
                            </td>
                            <td className="max-w-[11rem] px-3 py-2 align-middle">
                              <span className="font-medium text-gray-900" title={tx.prestation_intitule}>
                                {truncateText(tx.prestation_intitule || `Prestation #${tx.prestation}`, 36)}
                              </span>
                            </td>
                            <td className="max-w-[11rem] px-3 py-2 align-middle text-gray-700">
                              {truncateText(tx.besoin_intitule || `Besoin #${tx.besoin}`, 36)}
                            </td>
                            <td className="max-w-[9rem] px-3 py-2 align-middle text-gray-800">
                              {truncateText(tx.fournisseur_nom || '—', 28)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle text-right tabular-nums text-gray-900">
                              {formatMoneyFcfa(tx.prix_final)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle text-right">
                              <button
                                type="button"
                                onClick={() => navigate(`/client/transactions/${tx.id}`)}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                              >
                                Détail
                                <FiChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'prestations' && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Aperçu des prestations publiées sur la plateforme. Ouvrez la liste complète pour filtrer et comparer.
                </p>
                {prestations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FiSearch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune prestation à afficher pour le moment.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Prestation</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Catégorie</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Fournisseur</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Tarif</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Zones</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Voir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {prestations.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/80">
                            <td className="max-w-[13rem] px-3 py-2 align-top">
                              <span className="font-medium text-gray-900" title={p.intitule}>
                                {truncateText(p.intitule, 42)}
                              </span>
                              <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{p.description}</p>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top text-gray-700">
                              {p.categorie_nom || '—'}
                            </td>
                            <td className="max-w-[9rem] px-3 py-2 align-top text-gray-800">
                              {truncateText(p.fournisseur_nom || '—', 24)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top text-right tabular-nums text-gray-900">
                              {p.tarif_min != null || p.tarif_max != null
                                ? `${p.tarif_min != null ? Number(p.tarif_min).toLocaleString('fr-FR') : '—'} – ${p.tarif_max != null ? Number(p.tarif_max).toLocaleString('fr-FR') : '—'}`
                                : '—'}
                            </td>
                            <td className="max-w-[8rem] px-3 py-2 align-top text-xs text-gray-500">
                              <span className="inline-flex items-start gap-1">
                                <FiMapPin className="mt-0.5 h-3 w-3 shrink-0" />
                                <span className="truncate">{formatZones(p.zones_intervention)}</span>
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-top text-right">
                              <button
                                type="button"
                                onClick={() => navigate('/services')}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-gray-50"
                              >
                                <FiEye className="h-3.5 w-3.5" />
                                Catalogue
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Raccourci bas de page */}
        <div className="flex flex-wrap justify-between items-center gap-3 text-sm text-gray-500">
          <span>Besoin d&apos;aide ? Consultez vos messages ou votre profil.</span>
          <button
            type="button"
            onClick={() => navigate('/client/profil')}
            className="text-primary-600 font-medium hover:underline"
          >
            Mon profil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
