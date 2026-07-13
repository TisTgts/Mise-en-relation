import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiActivity,
  FiDatabase,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiZap,
  FiRefreshCw,
  FiTrash2,
  FiServer,
  FiPlay,
  FiPause,
} from 'react-icons/fi';
import { useConfirm } from '../../contexts/ConfirmContext';
import superAdminService from '../../services/superAdminService';
import Toast from '../../components/Toast';

const POLL_MS = 5000;

const STATUS_META = {
  ok: { label: 'Opérationnel', cls: 'from-emerald-500 to-teal-600', icon: FiCheckCircle },
  degraded: { label: 'Dégradé', cls: 'from-amber-500 to-orange-600', icon: FiAlertTriangle },
  down: { label: 'Hors service', cls: 'from-rose-500 to-red-600', icon: FiXCircle },
};

const fmtUptime = (s) => {
  if (s == null) return '—';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}j ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
};

const statusColor = (code) => {
  if (code === 0) return 'bg-slate-100 text-slate-700';
  if (code >= 500) return 'bg-rose-100 text-rose-800';
  if (code >= 400) return 'bg-amber-100 text-amber-800';
  if (code >= 300) return 'bg-sky-100 text-sky-800';
  return 'bg-emerald-100 text-emerald-800';
};

const latencyColor = (ms) => {
  if (ms == null) return 'text-slate-500';
  if (ms >= 1000) return 'text-rose-600';
  if (ms >= 300) return 'text-amber-600';
  return 'text-emerald-600';
};

const StatCard = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`rounded-lg p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-xl font-bold text-slate-900">{value}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  </div>
);

const SystemHealth = () => {
  const confirm = useConfirm();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await superAdminService.getHealth();
      setHealth(data);
      setLastUpdate(new Date());
    } catch (e) {
      if (!silent) setToast({ message: e.message || 'Chargement impossible.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    timerRef.current = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, load]);

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Réinitialiser les compteurs ?',
      message: 'Les statistiques de trafic et les erreurs récentes seront remises à zéro.',
      tone: 'warning',
      confirmLabel: 'Réinitialiser',
    });
    if (!ok) return;
    try {
      await superAdminService.resetMetrics();
      setToast({ message: 'Compteurs réinitialisés.', type: 'success' });
      load(true);
    } catch (e) {
      setToast({ message: e.message || 'Réinitialisation impossible.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />
      </div>
    );
  }

  if (!health) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <FiXCircle className="mx-auto h-10 w-10 text-rose-400" />
        <p className="mt-3 text-sm text-slate-600">Impossible de récupérer l'état de santé.</p>
        <button onClick={() => load()} className="mt-4 rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700">
          Réessayer
        </button>
      </div>
    );
  }

  const meta = STATUS_META[health.status] || STATUS_META.degraded;
  const StatusIcon = meta.icon;
  const t = health.traffic || {};
  const db = health.database || {};
  const mig = health.migrations || {};
  const rt = health.runtime || {};

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Bannière statut */}
      <header className={`overflow-hidden rounded-2xl bg-gradient-to-br ${meta.cls} p-6 text-white shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/15 p-3">
              <StatusIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Santé de la plateforme</p>
              <h1 className="text-2xl font-bold">{meta.label}</h1>
              <p className="mt-0.5 text-sm text-white/80">
                {lastUpdate ? `Mis à jour à ${lastUpdate.toLocaleTimeString('fr-FR')}` : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
            >
              {autoRefresh ? <FiPause className="h-4 w-4" /> : <FiPlay className="h-4 w-4" />}
              {autoRefresh ? 'Auto (5s)' : 'En pause'}
            </button>
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
            >
              <FiRefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>
      </header>

      {/* Cartes infra */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={FiDatabase}
          label="Base de données"
          value={db.ok ? 'OK' : 'KO'}
          hint={db.ok ? `${db.latency_ms} ms · ${db.engine}` : (db.error || 'Indisponible')}
          tone={db.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
        />
        <StatCard
          icon={FiServer}
          label="Migrations en attente"
          value={mig.count ?? 0}
          hint={mig.count ? mig.pending.slice(0, 2).join(', ') : 'À jour'}
          tone={mig.count ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
        />
        <StatCard
          icon={FiClock}
          label="Uptime (process)"
          value={fmtUptime(t.uptime_seconds)}
          hint={`Python ${rt.python} · Django ${rt.django}`}
          tone="bg-indigo-100 text-indigo-700"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Mode debug"
          value={rt.debug ? 'Activé' : 'Désactivé'}
          hint={`Fuseau : ${rt.time_zone}`}
          tone={rt.debug ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}
        />
      </div>

      {/* Cartes trafic */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={FiActivity} label="Requêtes API" value={t.total_requests ?? 0} tone="bg-sky-100 text-sky-700" />
        <StatCard
          icon={FiXCircle}
          label="Erreurs serveur (5xx)"
          value={t.total_errors ?? 0}
          tone={(t.total_errors ?? 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}
        />
        <StatCard
          icon={FiZap}
          label="Taux d'erreur"
          value={`${t.error_rate ?? 0} %`}
          tone={(t.error_rate ?? 0) >= 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}
        />
        <StatCard icon={FiServer} label="Endpoints suivis" value={(t.endpoints || []).length} tone="bg-violet-100 text-violet-700" />
      </div>

      {/* Tableau endpoints */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Trafic par endpoint</h2>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-700">Endpoint</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-700">Appels</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-700">Erreurs</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-700">Taux</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-700">Moy.</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-700">p95</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-700">Max</th>
                <th className="px-4 py-2.5 text-center font-semibold text-slate-700">Dernier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(t.endpoints || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    Aucune requête enregistrée pour le moment. Naviguez dans l'application pour alimenter les métriques.
                  </td>
                </tr>
              ) : (
                (t.endpoints || []).map((e) => (
                  <tr key={e.key} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-700">{e.method}</span>
                        <span className="font-mono text-xs text-slate-600">{e.route}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">{e.count}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{e.errors}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${e.error_rate >= 10 ? 'text-rose-600' : 'text-slate-700'}`}>{e.error_rate}%</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${latencyColor(e.avg_ms)}`}>{e.avg_ms} ms</td>
                    <td className={`px-4 py-2.5 text-right ${latencyColor(e.p95_ms)}`}>{e.p95_ms} ms</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{e.max_ms} ms</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(e.last_status)}`}>
                        {e.last_status || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Erreurs récentes */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Erreurs récentes {(t.recent_errors || []).length > 0 && `(${t.recent_errors.length})`}
          </h2>
        </div>
        {(t.recent_errors || []).length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FiCheckCircle className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="mt-2 text-sm text-slate-500">Aucune erreur récente. Tout roule.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {t.recent_errors.map((err, i) => (
              <li key={`${err.time}-${i}`} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(err.status)}`}>
                  {err.status}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-700">{err.method}</span>
                    <span className="truncate font-mono text-xs text-slate-600">{err.path}</span>
                  </p>
                  {err.message && <p className="mt-0.5 truncate text-xs text-rose-600">{err.message}</p>}
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(err.time).toLocaleTimeString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        Métriques en mémoire (remises à zéro au redémarrage du serveur, propres à chaque worker).
      </p>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SystemHealth;
