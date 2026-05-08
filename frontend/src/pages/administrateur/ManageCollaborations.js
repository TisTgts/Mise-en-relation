import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiEye } from 'react-icons/fi';
import adminService from '../../services/adminService';

export default function ManageCollaborations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const txs = await adminService.getAllTransactions();
        setRows(Array.isArray(txs) ? txs : []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      String(r.id).includes(s) ||
      (r.besoin_intitule || '').toLowerCase().includes(s) ||
      (r.client_nom || '').toLowerCase().includes(s) ||
      (r.fournisseur_nom || '').toLowerCase().includes(s)
    );
  }, [rows, q]);

  if (loading) return <div className="p-6">Chargement des collaborations...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Observatoire des collaborations</h1>
        <p className="mt-1 text-sm text-slate-600">Vue globale des collaborations client/fournisseur.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-md">
          <FiSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher ID, besoin, client, fournisseur..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Besoin</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Client</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Fournisseur</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Aucune collaboration trouvée.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-slate-700">{r.id}</td>
                    <td className="px-4 py-3 text-slate-900">{r.besoin_intitule || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.client_nom || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.fournisseur_nom || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.statut || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/collaborations/${r.id}/workspace`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                      >
                        <FiEye className="h-3.5 w-3.5" />
                        Observer
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

