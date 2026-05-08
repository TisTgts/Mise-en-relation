import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import { API_ENDPOINTS } from '../../../config/api';
import { parseListResponse, formatDateShort, truncateText } from '../clientUi';
import Toast from '../../../components/Toast';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const MesMatchings = () => {
  const [besoins, setBesoins] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [besRes, scoreRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.SERVICES.BESOINS}my/`, { headers: authHeaders() }),
        fetch(API_ENDPOINTS.MATCHING.SCORES, { headers: authHeaders() }),
      ]);

      const besoinsData = besRes.ok ? await besRes.json() : [];
      const scoreData = scoreRes.ok ? await scoreRes.json() : [];
      setBesoins(parseListResponse(besoinsData));
      setScores(Array.isArray(scoreData) ? scoreData : []);
    } catch {
      setToast({ message: 'Impossible de charger les correspondances.', type: 'error' });
      setBesoins([]);
      setScores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const grouped = useMemo(() => {
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
    const q = searchTerm.toLowerCase();
    return besoins
      .map((b) => {
        const matches = grouped.get(b.id) || [];
        const best = matches.reduce((m, r) => (Number(r.score || 0) > Number(m?.score || -1) ? r : m), null);
        return {
          besoin: b,
          count: matches.length,
          bestScore: best ? Number(best.score || 0) : null,
          lastAt: best?.calculated_at || null,
        };
      })
      .filter(({ besoin }) => {
        if (!q) return true;
        return (
          (besoin.intitule || '').toLowerCase().includes(q) ||
          (besoin.description || '').toLowerCase().includes(q) ||
          String(besoin.id).includes(q)
        );
      });
  }, [besoins, grouped, searchTerm]);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mes besoins matchés</h1>
            <p className="mt-1 text-sm text-slate-600">
              Consultez les correspondances trouvées et continuez vers le choix du fournisseur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Recherche</label>
        <div className="relative max-w-xl">
          <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Intitulé, description, ID besoin…"
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
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Nb matchs</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Meilleur score</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Dernier calcul</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Suite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Aucun besoin trouvé.
                  </td>
                </tr>
              ) : (
                rows.map(({ besoin, count, bestScore, lastAt }) => (
                  <tr key={besoin.id} className="hover:bg-slate-50/80">
                    <td className="max-w-[20rem] px-4 py-3">
                      <p className="font-medium text-slate-900">{truncateText(besoin.intitule, 58)}</p>
                      <p className="text-xs text-slate-500">ID #{besoin.id}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{besoin.statut || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">{count}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                      {bestScore != null ? `${bestScore.toFixed(2)} / 100` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateShort(lastAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/client/besoins/${besoin.id}/matching`}
                        className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                      >
                        Ouvrir
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
