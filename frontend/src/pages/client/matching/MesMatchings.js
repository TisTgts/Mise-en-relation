import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiSearch, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../../config/api';
import Toast from '../../../components/Toast';
import { clientCanSelfLaunchMatching, clientMatchingPremiumMessage } from '../../../utils/clientPremium';
import {
  parseListResponse,
  formatDateShort,
  truncateText,
  besoinStatutPillClass,
  besoinStatutLabel,
  urgencePillClass,
  urgenceLabel,
} from '../clientUi';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

/** Besoin en phase matching = publié (ouverte), pas encore pourvu ni annulé. */
const isMatchingPhase = (besoin) => besoin?.statut === 'ouverte';

const MesMatchings = () => {
  const { user } = useAuth();
  const canLaunchMatching = clientCanSelfLaunchMatching(user);
  const [besoins, setBesoins] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [besRes, scoreRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.SERVICES.BESOINS}my/`, { headers: authHeaders() }),
        fetch(API_ENDPOINTS.MATCHING.SCORES, { headers: authHeaders() }),
      ]);

      const besoinsData = besRes.ok ? await besRes.json() : [];
      const scoreData = scoreRes.ok ? await scoreRes.json() : [];
      setBesoins(parseListResponse(besoinsData));
      setScores(Array.isArray(scoreData) ? scoreData : []);
    } catch {
      setToast({ message: 'Impossible de charger vos besoins en matching.', type: 'error' });
      setBesoins([]);
      setScores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.type_utilisateur === 'client') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, loadData]);

  const scoresByBesoin = useMemo(() => {
    const map = new Map();
    scores.forEach((s) => {
      const bid = s.besoin?.id;
      if (bid == null) return;
      if (!map.has(bid)) map.set(bid, []);
      map.get(bid).push(s);
    });
    return map;
  }, [scores]);

  const rows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return besoins
      .filter(isMatchingPhase)
      .map((b) => {
        const matches = scoresByBesoin.get(b.id) || [];
        const best = matches.reduce(
          (m, r) => (Number(r.score || 0) > Number(m?.score || -1) ? r : m),
          null
        );
        const lastAt = matches.reduce((max, r) => {
          const t = r.calculated_at || '';
          return t > max ? t : max;
        }, '');
        return {
          besoin: b,
          count: matches.length,
          bestScore: best ? Number(best.score || 0) : null,
          lastAt: lastAt || null,
          hasMatches: matches.length > 0,
        };
      })
      .filter(({ besoin }) => {
        if (!q) return true;
        return (
          (besoin.intitule || '').toLowerCase().includes(q) ||
          (besoin.description || '').toLowerCase().includes(q) ||
          (besoin.lieu_intervention || '').toLowerCase().includes(q) ||
          String(besoin.id).includes(q)
        );
      })
      .sort((a, b) => {
        if (a.hasMatches !== b.hasMatches) return a.hasMatches ? -1 : 1;
        return Number(b.bestScore || 0) - Number(a.bestScore || 0);
      });
  }, [besoins, scoresByBesoin, searchTerm]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      withMatches: rows.filter((r) => r.hasMatches).length,
      awaiting: rows.filter((r) => !r.hasMatches).length,
    }),
    [rows]
  );

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Mise en relation
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Mes matchings</h1>
            <p className="mt-1 text-sm text-slate-600">
              Besoins publiés en phase de matching — consultez les correspondances et choisissez un
              fournisseur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </header>

      {!canLaunchMatching && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{clientMatchingPremiumMessage()} Les correspondances lancées par l’admin restent visibles ici.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'En matching', value: stats.total },
          { label: 'Avec correspondances', value: stats.withMatches },
          { label: 'En attente de match', value: stats.awaiting },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Recherche
        </label>
        <div className="relative max-w-xl">
          <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Intitulé, lieu, ID besoin…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Besoin</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Phase</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Matchs</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Meilleur score</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Dernier calcul</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Suite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <p className="text-slate-600">Aucun besoin en phase de matching.</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Publiez un besoin ou consultez vos besoins déjà pourvus dans{' '}
                      <Link to="/client/mes-besoins" className="font-medium text-indigo-600 hover:text-indigo-800">
                        Mes besoins
                      </Link>
                      .
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map(({ besoin, count, bestScore, lastAt, hasMatches }) => (
                  <tr key={besoin.id} className="hover:bg-slate-50/80">
                    <td className="max-w-[22rem] px-4 py-3">
                      <p className="font-medium text-slate-900">{truncateText(besoin.intitule, 58)}</p>
                      <p className="text-xs text-slate-500">
                        #{besoin.id}
                        {besoin.lieu_intervention ? ` · ${truncateText(besoin.lieu_intervention, 28)}` : ''}
                      </p>
                      {besoin.urgence && (
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${urgencePillClass(besoin.urgence)}`}
                        >
                          {urgenceLabel(besoin.urgence)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${besoinStatutPillClass(besoin.statut)}`}
                      >
                        {besoinStatutLabel(besoin.statut)}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">
                        {hasMatches ? 'Correspondances dispo.' : 'En attente de match'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                      {count}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                      {bestScore != null ? `${bestScore.toFixed(2)} / 100` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateShort(lastAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/client/besoins/${besoin.id}/matching`}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        {hasMatches ? 'Voir les matchs' : 'Ouvrir'}
                        <FiArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MesMatchings;
