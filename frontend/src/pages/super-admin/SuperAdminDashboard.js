import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiActivity,
  FiRefreshCw,
  FiUserPlus,
  FiGrid,
  FiBarChart2,
  FiArrowRight,
  FiDatabase,
  FiGlobe,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import superAdminService from '../../services/superAdminService';
import Toast from '../../components/Toast';

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`rounded-lg p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
      </div>
    </div>
  </div>
);

const QUICK_LINKS = [
  { to: '/super-admin/admins', label: 'Gérer les administrateurs', desc: 'Créer, promouvoir, désactiver', icon: FiShield, tone: 'from-fuchsia-500 to-violet-600' },
  { to: '/super-admin/sante', label: 'Santé & Monitoring', desc: 'État des API, erreurs, latence', icon: FiActivity, tone: 'from-rose-500 to-red-600' },
  { to: '/super-admin/pays', label: 'Pays de l\'application', desc: 'Basculer le contexte régional', icon: FiGlobe, tone: 'from-cyan-500 to-sky-600' },
  { to: '/admin/users', label: 'Utilisateurs', desc: 'Tous les comptes de la plateforme', icon: FiUsers, tone: 'from-indigo-500 to-blue-600' },
  { to: '/admin/categories', label: 'Catégories', desc: 'Taxonomie des services', icon: FiGrid, tone: 'from-emerald-500 to-teal-600' },
  { to: '/admin/transactions', label: 'Transactions', desc: 'Suivi financier', icon: FiBarChart2, tone: 'from-amber-500 to-orange-600' },
  { to: '/admin/correspondances', label: 'Correspondances', desc: 'Moteur de matching', icon: FiActivity, tone: 'from-rose-500 to-pink-600' },
  { to: '/admin/dashboard', label: 'Tableau de bord admin', desc: 'Vue opérationnelle détaillée', icon: FiDatabase, tone: 'from-slate-500 to-slate-700' },
];

const HEALTH_META = {
  ok: { label: 'Opérationnel', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500', icon: FiCheckCircle },
  degraded: { label: 'Dégradé', cls: 'bg-amber-50 border-amber-200 text-amber-900', dot: 'bg-amber-500', icon: FiAlertTriangle },
  down: { label: 'Hors service', cls: 'bg-rose-50 border-rose-200 text-rose-800', dot: 'bg-rose-500', icon: FiXCircle },
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsData, adminsData, healthData] = await Promise.all([
        adminService.getDetailedStatistics().catch(() => null),
        superAdminService.getAdmins().catch(() => []),
        superAdminService.getHealth().catch(() => null),
      ]);
      setStats(statsData);
      setAdmins(adminsData);
      setHealth(healthData);
    } catch {
      setToast({ message: 'Impossible de charger la supervision.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const adminCounts = useMemo(() => ({
    total: admins.length,
    superAdmins: admins.filter((a) => a.type_utilisateur === 'super_admin').length,
    admins: admins.filter((a) => a.type_utilisateur === 'administrateur').length,
    actifs: admins.filter((a) => a.is_active).length,
  }), [admins]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />
      </div>
    );
  }

  const u = stats?.users || {};
  const healthMeta = health ? (HEALTH_META[health.status] || HEALTH_META.degraded) : null;
  const HealthIcon = healthMeta?.icon;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="overflow-hidden rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide">
              <FiShield className="h-3.5 w-3.5" />
              Super administration
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Bonjour {user?.first_name || 'Super Admin'}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Supervision globale de la plateforme et gestion des comptes d'administration.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </header>

      {/* Widget santé */}
      {healthMeta && (
        <Link
          to="/super-admin/sante"
          className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3 transition hover:shadow-sm ${healthMeta.cls}`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${healthMeta.dot}`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${healthMeta.dot}`} />
            </span>
            <HealthIcon className="h-5 w-5" />
            <div>
              <p className="text-sm font-bold">API : {healthMeta.label}</p>
              <p className="text-xs opacity-80">
                {health.traffic?.total_requests ?? 0} requêtes · {health.traffic?.error_rate ?? 0}% d'erreur
                {health.database?.ok ? ` · DB ${health.database.latency_ms} ms` : ' · DB KO'}
                {health.migrations?.count > 0 ? ` · ${health.migrations.count} migration(s) en attente` : ''}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold">
            Voir le détail
            <FiArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      {/* Comptes d'administration */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Équipe d'administration
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={FiShield} label="Super admins" value={adminCounts.superAdmins} tone="bg-fuchsia-100 text-fuchsia-700" />
          <StatCard icon={FiShield} label="Administrateurs" value={adminCounts.admins} tone="bg-violet-100 text-violet-700" />
          <StatCard icon={FiUsers} label="Comptes admin" value={adminCounts.total} tone="bg-indigo-100 text-indigo-700" />
          <StatCard icon={FiActivity} label="Actifs" value={adminCounts.actifs} tone="bg-emerald-100 text-emerald-700" />
        </div>
      </section>

      {/* Statistiques globales */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Plateforme
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={FiUsers} label="Utilisateurs" value={u.total_users} tone="bg-slate-100 text-slate-700" />
          <StatCard icon={FiUsers} label="Clients" value={u.clients} tone="bg-indigo-100 text-indigo-700" />
          <StatCard icon={FiBriefcase} label="Fournisseurs" value={u.fournisseurs} tone="bg-emerald-100 text-emerald-700" />
          <StatCard icon={FiFileText} label="Besoins" value={stats?.besoins?.total_besoins} tone="bg-amber-100 text-amber-700" />
        </div>
      </section>

      {/* Accès rapides */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Accès rapides
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ to, label, desc, icon: Icon, tone }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-fuchsia-300 hover:shadow-md"
            >
              <div className={`rounded-xl bg-gradient-to-br ${tone} p-3 text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{label}</p>
                <p className="truncate text-xs text-slate-500">{desc}</p>
              </div>
              <FiArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-fuchsia-500" />
            </Link>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50/70 px-4 py-3 text-sm text-fuchsia-950">
        <p className="flex items-center gap-2">
          <FiUserPlus className="h-4 w-4" />
          Besoin d'un nouvel administrateur ou d'attribuer des droits ?
        </p>
        <Link
          to="/super-admin/admins"
          className="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-semibold text-white hover:bg-fuchsia-700"
        >
          Gérer les administrateurs
          <FiArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SuperAdminDashboard;
