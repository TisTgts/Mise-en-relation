import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import {
  FiUsers,
  FiBriefcase,
  FiDollarSign,
  FiSettings,
  FiBarChart,
  FiActivity,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiSearch,
  FiMessageSquare,
  FiGrid,
  FiChevronRight,
  FiExternalLink,
} from 'react-icons/fi';
import Toast from '../../components/Toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const TABS = [
  { id: 'overview', label: "Vue d'ensemble", description: 'Indicateurs et analyses' },
  { id: 'matching', label: 'Matching', description: 'Exécutions et correspondances' },
  { id: 'shortcuts', label: 'Navigation', description: 'Accès aux modules' },
];

const QUICK_LINKS = [
  { to: '/admin/users', label: 'Utilisateurs', sub: 'Comptes et rôles', icon: FiUsers, tone: 'blue' },
  { to: '/admin/prestations', label: 'Prestations & Besoins', sub: 'Offres fournisseurs + demandes clients', icon: FiBriefcase, tone: 'emerald' },
  { to: '/admin/categories', label: 'Catégories', sub: 'Taxonomie des services', icon: FiGrid, tone: 'amber' },
  { to: '/admin/transactions', label: 'Transactions', sub: 'Flux financiers', icon: FiBarChart, tone: 'sky' },
  { to: '/admin/collaborations', label: 'Collaborations', sub: 'Observation globale', icon: FiUsers, tone: 'teal' },
  { to: '/admin/correspondances', label: 'Correspondances', sub: 'Vue par besoin', icon: FiSearch, tone: 'indigo' },
  { to: '/admin/messages', label: 'Messages', sub: 'Communication', icon: FiMessageSquare, tone: 'teal' },
  { to: '/admin/settings', label: 'Paramètres', sub: 'Configuration', icon: FiSettings, tone: 'slate' },
];

const toneRing = {
  blue: 'ring-blue-100 hover:bg-blue-50/80',
  emerald: 'ring-emerald-100 hover:bg-emerald-50/80',
  violet: 'ring-violet-100 hover:bg-violet-50/80',
  amber: 'ring-amber-100 hover:bg-amber-50/80',
  sky: 'ring-sky-100 hover:bg-sky-50/80',
  indigo: 'ring-indigo-100 hover:bg-indigo-50/80',
  teal: 'ring-teal-100 hover:bg-teal-50/80',
  slate: 'ring-slate-200 hover:bg-slate-50',
};

const toneIcon = {
  blue: 'text-blue-600 bg-blue-100',
  emerald: 'text-emerald-600 bg-emerald-100',
  violet: 'text-violet-600 bg-violet-100',
  amber: 'text-amber-600 bg-amber-100',
  sky: 'text-sky-600 bg-sky-100',
  indigo: 'text-indigo-600 bg-indigo-100',
  teal: 'text-teal-600 bg-teal-100',
  slate: 'text-slate-600 bg-slate-100',
};

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [stats, setStats] = useState({
    users: {},
    prestations: {},
    besoins: {},
    transactions: {},
    categories: {},
    recent_activity: {},
    monthly_revenue: [],
    top_fournisseurs: [],
    top_categories: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [runningMatching, setRunningMatching] = useState(false);
  const [adminBesoins, setAdminBesoins] = useState([]);
  const [selectedBesoins, setSelectedBesoins] = useState([]);
  const [matchingScores, setMatchingScores] = useState([]);
  const [matchingRuns, setMatchingRuns] = useState([]);
  const [selectedMatchingDetail, setSelectedMatchingDetail] = useState(null);
  const [loadingMatchingDetail, setLoadingMatchingDetail] = useState(false);
  const [txOps, setTxOps] = useState({
    pendingAdmin: 0,
    enProgression: 0,
    pretCloture: 0,
    cloturees: 0,
    total: 0,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.type_utilisateur !== 'administrateur') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.id === t)) {
      setActiveTab(t);
    } else if (!t) {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleDashboardTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'overview') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDetailedStatistics();
      setStats(data);
      const besoinsData = await adminService.getAllDemandes();
      const besoinsList = besoinsData.results || besoinsData || [];
      setAdminBesoins(Array.isArray(besoinsList) ? besoinsList : []);
      const matchingData = await adminService.getAllMatchingScores();
      setMatchingScores(Array.isArray(matchingData) ? matchingData : []);
      const runsData = await adminService.getMatchingRuns();
      setMatchingRuns(Array.isArray(runsData) ? runsData : []);

      let txs = [];
      try {
        txs = await adminService.getAllTransactions();
      } catch {
        txs = [];
      }
      const list = Array.isArray(txs) ? txs : [];
      const pendingAdmin = list.filter((r) => r.validation_admin_statut === 'en_attente').length;
      const pretCloture = list.filter(
        (r) =>
          r.travail_fournisseur_termine &&
          r.verification_client_validee &&
          r.statut !== 'terminee' &&
          r.validation_admin_statut !== 'en_attente'
      ).length;
      const cloturees = list.filter((r) => r.statut === 'terminee').length;
      const enProgression = list.filter(
        (r) =>
          r.validation_admin_statut !== 'en_attente' &&
          r.statut !== 'terminee' &&
          !(r.travail_fournisseur_termine && r.verification_client_validee)
      ).length;
      setTxOps({
        pendingAdmin,
        enProgression,
        pretCloture,
        cloturees,
        total: list.length,
      });
    } catch {
      setError('Impossible de charger les données du tableau de bord.');
      setToast({
        message: 'Erreur lors du chargement des données du tableau de bord',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    setToast({ message: 'Données actualisées', type: 'success' });
  };

  const handleExport = async () => {
    try {
      const data = await adminService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({ message: 'Export téléchargé', type: 'success' });
    } catch {
      setToast({ message: "Erreur lors de l'export", type: 'error' });
    }
  };

  const handleRunMatching = async () => {
    try {
      setRunningMatching(true);
      const result = await adminService.runMatchingForUnmatchedNeeds(100);
      setToast({
        message: `Matching : ${result.processed_besoins} besoin(s), ${result.total_matches_generated} correspondance(s).`,
        type: 'success',
      });
      await fetchDashboardData();
    } catch {
      setToast({ message: 'Erreur lors du matching', type: 'error' });
    } finally {
      setRunningMatching(false);
    }
  };

  const handleToggleBesoin = (besoinId) => {
    setSelectedBesoins((prev) =>
      prev.includes(besoinId) ? prev.filter((id) => id !== besoinId) : [...prev, besoinId]
    );
  };

  const handleSelectAllOpenNeeds = () => {
    const openIds = adminBesoins.filter((b) => b.statut === 'ouverte').map((b) => b.id);
    setSelectedBesoins(openIds);
  };

  const handleClearSelection = () => setSelectedBesoins([]);

  const handleRunMatchingSelected = async () => {
    if (!selectedBesoins.length) {
      setToast({ message: 'Sélectionnez au moins un besoin.', type: 'error' });
      return;
    }
    try {
      setRunningMatching(true);
      const result = await adminService.runMatchingForSelectedNeeds(selectedBesoins);
      setToast({
        message: `Sélection : ${result.processed_besoins} besoin(s), ${result.total_matches_generated} correspondance(s).`,
        type: 'success',
      });
      await fetchDashboardData();
    } catch {
      setToast({ message: 'Erreur matching sélection', type: 'error' });
    } finally {
      setRunningMatching(false);
    }
  };

  const handleRunMatchingAllOpen = async () => {
    try {
      setRunningMatching(true);
      const result = await adminService.runMatchingForAllOpenNeeds();
      setToast({
        message: `Tous les ouverts : ${result.processed_besoins} besoin(s), ${result.total_matches_generated} correspondance(s).`,
        type: 'success',
      });
      await fetchDashboardData();
    } catch {
      setToast({ message: 'Erreur matching global', type: 'error' });
    } finally {
      setRunningMatching(false);
    }
  };

  const handleViewMatchingDetail = async (scoreId) => {
    try {
      setLoadingMatchingDetail(true);
      const detail = await adminService.getMatchingScoreDetail(scoreId);
      setSelectedMatchingDetail(detail);
    } catch {
      setToast({ message: 'Impossible de charger le détail', type: 'error' });
    } finally {
      setLoadingMatchingDetail(false);
    }
  };

  const handleDeleteMatching = async (scoreId) => {
    if (!window.confirm('Supprimer cette correspondance ?')) return;
    try {
      await adminService.deleteMatchingScore(scoreId);
      setMatchingScores((prev) => prev.filter((s) => s.id !== scoreId));
      if (selectedMatchingDetail?.id === scoreId) setSelectedMatchingDetail(null);
      setToast({ message: 'Correspondance supprimée', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const userDistributionData = [
    { name: 'Fournisseurs', value: stats.users?.fournisseurs || 0, color: '#2563eb' },
    { name: 'Clients', value: stats.users?.clients || 0, color: '#059669' },
    { name: 'Administrateurs', value: stats.users?.administrateurs || 0, color: '#7c3aed' },
  ];

  const servicesData = [
    { name: 'Prestations', value: stats.prestations?.total_prestations || 0 },
    { name: 'Besoins', value: stats.besoins?.total_besoins || 0 },
  ];

  const revenueData =
    stats.monthly_revenue?.map((item) => ({
      month: item.month,
      revenue: item.revenue || 0,
    })) || [];

  const openBesoinsCount = adminBesoins.filter((b) => b.statut === 'ouverte').length;
  const alertItems = useMemo(() => {
    const alerts = [];
    if (txOps.pendingAdmin > 0) {
      alerts.push({
        id: 'admin_pending',
        level: 'high',
        title: 'Validations admin en attente',
        description: `${txOps.pendingAdmin} transaction(s) attendent une décision.`,
        to: '/admin/transactions?workflow=admin_en_attente',
        action: 'Traiter',
      });
    }
    if (txOps.pretCloture > 0) {
      alerts.push({
        id: 'ready_close',
        level: 'medium',
        title: 'Transactions prêtes à clôturer',
        description: `${txOps.pretCloture} transaction(s) peuvent être finalisées.`,
        to: '/admin/transactions?workflow=pret_cloture',
        action: 'Clôturer',
      });
    }
    if (openBesoinsCount > 0) {
      alerts.push({
        id: 'open_needs',
        level: 'medium',
        title: 'Besoins ouverts à traiter',
        description: `${openBesoinsCount} besoin(s) ouverts à faire matcher.`,
        to: '/admin/correspondances',
        action: 'Lancer matching',
      });
    }
    if (matchingRuns.length === 0) {
      alerts.push({
        id: 'no_run',
        level: 'low',
        title: 'Aucune exécution matching récente',
        description: 'Aucune exécution n’a encore été enregistrée.',
        to: '/admin/dashboard?tab=matching',
        action: 'Voir Matching',
      });
    }
    return alerts;
  }, [txOps.pendingAdmin, txOps.pretCloture, openBesoinsCount, matchingRuns.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* En-tête */}
      <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Administration</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Tableau de bord
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {user?.first_name || user?.username ? (
                <>
                  Connecté en tant que{' '}
                  <span className="font-medium text-slate-800">{user.first_name || user.username}</span>
                </>
              ) : (
                "Vue d'ensemble de la plateforme"
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <FiDownload className="h-4 w-4" />
              Exporter JSON
            </button>
          </div>
        </div>

        {error && (
          <div
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Onglets */}
        <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Sections du tableau de bord">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleDashboardTabChange(tab.id)}
                className={`min-w-[9rem] shrink-0 rounded-xl px-4 py-3 text-left transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span className={`mt-0.5 block text-xs ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {tab.description}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ——— Vue d'ensemble ——— */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Priorités du jour</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Actions opérationnelles à traiter en premier pour garder le flux fluide.
                </p>
              </div>
              <Link
                to="/admin/dashboard?tab=matching"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Ouvrir espace Matching
                <FiChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {alertItems.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Aucune alerte prioritaire pour le moment. Le flux est sous contrôle.
                </div>
              ) : (
                alertItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-4 py-3 ${
                      item.level === 'high'
                        ? 'border-rose-200 bg-rose-50'
                        : item.level === 'medium'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        item.level === 'high'
                          ? 'text-rose-800'
                          : item.level === 'medium'
                          ? 'text-amber-800'
                          : 'text-slate-800'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-700">{item.description}</p>
                    <Link
                      to={item.to}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                    >
                      {item.action}
                      <FiExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          <section aria-labelledby="kpi-heading">
            <h2 id="kpi-heading" className="sr-only">
              Indicateurs clés
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Utilisateurs',
                  value: stats.users?.total_users ?? 0,
                  hint: `${stats.users?.active_users ?? 0} actifs`,
                  icon: FiUsers,
                  accent: 'border-l-blue-500',
                },
                {
                  label: 'Prestations',
                  value: stats.prestations?.total_prestations ?? 0,
                  hint: `${stats.prestations?.active_prestations ?? 0} actives`,
                  icon: FiBriefcase,
                  accent: 'border-l-emerald-500',
                },
                {
                  label: 'Besoins',
                  value: stats.besoins?.total_besoins ?? 0,
                  hint: `${stats.besoins?.ouvertes_besoins ?? 0} ouverts`,
                  icon: FiFileText,
                  accent: 'border-l-violet-500',
                },
                {
                  label: 'Revenus',
                  value: `${(stats.transactions?.total_revenu || 0).toLocaleString('fr-FR')} FCFA`,
                  hint: `${stats.transactions?.total_transactions ?? 0} transactions`,
                  icon: FiDollarSign,
                  accent: 'border-l-amber-500',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm border-l-4 ${card.accent}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{card.value}</p>
                      <p className="mt-1 text-xs text-slate-600">{card.hint}</p>
                    </div>
                    <span className="rounded-xl bg-slate-100 p-3 text-slate-600">
                      <card.icon className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            aria-labelledby="ops-heading"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 id="ops-heading" className="text-base font-semibold text-slate-900">
                  Contrôle opérationnel
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Files transactions alignées sur les filtres de la page Transactions — ouvrez la liste préfiltrée en un
                  clic.
                </p>
              </div>
              <Link
                to="/admin/transactions"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Toutes les transactions ({txOps.total})
                <FiChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {[
                {
                  to: '/admin/transactions?workflow=admin_en_attente',
                  label: 'Validation admin',
                  sub: 'Décisions en attente',
                  count: txOps.pendingAdmin,
                  ring: 'ring-amber-100 hover:bg-amber-50/80',
                  countCls: 'text-amber-700',
                },
                {
                  to: '/admin/transactions?workflow=en_progression',
                  label: 'En progression',
                  sub: 'Hors attente admin / clôture',
                  count: txOps.enProgression,
                  ring: 'ring-slate-200 hover:bg-slate-50/90',
                  countCls: 'text-slate-800',
                },
                {
                  to: '/admin/transactions?workflow=pret_cloture',
                  label: 'Prêt à clôturer',
                  sub: 'Travail validé côté client',
                  count: txOps.pretCloture,
                  ring: 'ring-indigo-100 hover:bg-indigo-50/80',
                  countCls: 'text-indigo-700',
                },
                {
                  to: '/admin/transactions?workflow=cloturees',
                  label: 'Clôturées',
                  sub: 'Transactions terminées',
                  count: txOps.cloturees,
                  ring: 'ring-emerald-100 hover:bg-emerald-50/80',
                  countCls: 'text-emerald-700',
                },
                {
                  to: '/admin/besoins',
                  label: 'Besoins ouverts',
                  sub: 'Demandes à traiter / matcher',
                  count: openBesoinsCount,
                  ring: 'ring-violet-100 hover:bg-violet-50/80',
                  countCls: 'text-violet-700',
                },
              ].map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className={`flex flex-col rounded-2xl border border-slate-100 bg-slate-50/40 p-4 shadow-sm ring-1 ring-transparent transition ${card.ring}`}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</span>
                  <span className={`mt-2 text-3xl font-bold tabular-nums ${card.countCls}`}>{card.count}</span>
                  <span className="mt-1 text-xs text-slate-600">{card.sub}</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Utilisateurs par type</h3>
              {userDistributionData.every((d) => d.value === 0) ? (
                <p className="py-12 text-center text-sm text-slate-500">Pas encore de données utilisateurs.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={userDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {userDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Effectif']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Offres et demandes</h3>
              {servicesData.every((d) => d.value === 0) ? (
                <p className="py-12 text-center text-sm text-slate-500">Pas encore de prestations ou besoins.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={servicesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Revenus mensuels</h3>
            {!revenueData.length ? (
              <p className="py-12 text-center text-sm text-slate-500">Aucune série de revenus disponible.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Revenu']} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#fillRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Top fournisseurs</h3>
              <ul className="space-y-2">
                {(stats.top_fournisseurs || []).slice(0, 5).length === 0 ? (
                  <li className="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-500">Aucune donnée.</li>
                ) : (
                  (stats.top_fournisseurs || []).slice(0, 5).map((fournisseur, index) => (
                    <li
                      key={fournisseur.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-indigo-600 shadow-sm">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{fournisseur.name}</p>
                          <p className="truncate text-xs text-slate-500">{fournisseur.raison_sociale}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                        {fournisseur.prestation_count}{' '}
                        <span className="font-normal text-slate-500">prest.</span>
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Top catégories</h3>
              <ul className="space-y-2">
                {(stats.top_categories || []).slice(0, 5).length === 0 ? (
                  <li className="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-500">Aucune donnée.</li>
                ) : (
                  (stats.top_categories || []).slice(0, 5).map((categorie, index) => (
                    <li
                      key={categorie.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-emerald-600 shadow-sm">
                          {index + 1}
                        </span>
                        <p className="font-medium text-slate-900">{categorie.nom}</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-slate-700">
                        {categorie.prestation_count}{' '}
                        <span className="font-normal text-slate-500">prest.</span>
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* ——— Matching ——— */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                  <FiActivity className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Moteur de correspondances</h2>
                  <p className="mt-1 max-w-xl text-sm text-slate-600">
                    Lancez le matching pour les besoins sans correspondance, ou affinez la sélection. Les résultats sont
                    enregistrés par exécution (historique consultable ci-dessous).
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Besoins ouverts dans la liste chargée :{' '}
                    <span className="font-semibold text-slate-700">{openBesoinsCount}</span> · Correspondances actives :{' '}
                    <span className="font-semibold text-slate-700">{matchingScores.length}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRunMatching}
                  disabled={runningMatching}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <FiActivity className={`h-4 w-4 ${runningMatching ? 'animate-spin' : ''}`} />
                  Non matchés (batch)
                </button>
                <Link
                  to="/admin/correspondances"
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Vue par besoin
                  <FiExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Sélection manuelle</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Cochez des besoins puis lancez le matching — une exécution regroupe toutes les paires calculées.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllOpenNeeds}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tout sélectionner (ouverts)
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={handleRunMatchingSelected}
                  disabled={runningMatching}
                  className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  Matching sélection ({selectedBesoins.length})
                </button>
                <button
                  type="button"
                  onClick={handleRunMatchingAllOpen}
                  disabled={runningMatching}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Tous les besoins ouverts
                </button>
              </div>
            </div>
            <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3 w-10" scope="col">
                      #
                    </th>
                    <th className="px-3 py-3" scope="col">
                      ID
                    </th>
                    <th className="px-3 py-3" scope="col">
                      Intitulé
                    </th>
                    <th className="px-3 py-3" scope="col">
                      Statut
                    </th>
                    <th className="px-3 py-3" scope="col">
                      Catégorie
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminBesoins.slice(0, 300).map((b) => (
                    <tr key={b.id} className="bg-white hover:bg-slate-50/80">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedBesoins.includes(b.id)}
                          onChange={() => handleToggleBesoin(b.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          aria-label={`Sélectionner besoin ${b.id}`}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{b.id}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{b.intitule}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.statut === 'ouverte'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {b.statut}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{b.categorie_nom || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Historique des exécutions</h3>
              <p className="mt-1 text-xs text-slate-500">
                Une ligne par lancement : identifiant, horodatage, auteur, taille du tableau JSON.
              </p>
              <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">N°</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Lancé par</th>
                      <th className="px-3 py-2 text-right">Corresp.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matchingRuns.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                          Aucune exécution enregistrée.
                        </td>
                      </tr>
                    ) : (
                      matchingRuns.map((run) => (
                        <tr key={run.id} className="bg-white">
                          <td className="px-3 py-2 font-mono text-slate-800">{run.id}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {run.lance_le ? new Date(run.lance_le).toLocaleString('fr-FR') : '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-700">{run.lance_par_username || '—'}</td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                            {run.nombre_correspondances}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Correspondances effectives</h3>
              <p className="mt-1 text-xs text-slate-500">
                Fusion chronologique : dernière version par paire besoin / prestation ({matchingScores.length} lignes
                affichées max. 500).
              </p>
              <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Réf.</th>
                      <th className="px-3 py-2">Besoin</th>
                      <th className="px-3 py-2">Prestation</th>
                      <th className="px-3 py-2">Score</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matchingScores.slice(0, 500).map((score) => (
                      <tr key={score.id} className="bg-white hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-mono text-xs text-slate-600">{score.id}</td>
                        <td className="px-3 py-2 max-w-[140px] truncate text-slate-800" title={score.besoin_titre}>
                          {score.besoin_titre}
                        </td>
                        <td className="px-3 py-2 max-w-[140px] truncate text-slate-800" title={score.prestation_titre}>
                          {score.prestation_titre}
                        </td>
                        <td className="px-3 py-2 font-semibold tabular-nums text-indigo-700">{score.score}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleViewMatchingDetail(score.id)}
                              className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                            >
                              Détail
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMatching(score.id)}
                              className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Suppr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loadingMatchingDetail && (
                <p className="mt-3 text-xs text-slate-500">Chargement du détail…</p>
              )}
              {selectedMatchingDetail && !loadingMatchingDetail && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Détail — réf. {selectedMatchingDetail.id}
                  </p>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-white p-3 text-[11px] leading-relaxed text-slate-700 ring-1 ring-slate-100">
                    {JSON.stringify(selectedMatchingDetail, null, 2)}
                  </pre>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ——— Raccourcis ——— */}
      {activeTab === 'shortcuts' && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Modules</h2>
          <p className="mt-1 text-sm text-slate-600">
            Accès direct aux écrans de gestion. Utilisez aussi le menu latéral pour naviguer pendant votre travail.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-transparent transition ${toneRing[item.tone]}`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneIcon[item.tone]}`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="truncate text-xs text-slate-500">{item.sub}</p>
                </div>
                <FiChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminDashboard;
