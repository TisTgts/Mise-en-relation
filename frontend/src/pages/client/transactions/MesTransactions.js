import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiCalendar,
  FiUser,
  FiBriefcase,
  FiEye,
} from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import transactionsService from '../../../services/transactionsService';
import {
  truncateText,
  formatMoneyFcfa,
  formatDateShort,
  transactionStatutPillClass,
  transactionStatutLabel,
} from '../clientUi';

function normalizeTransaction(tx) {
  const prestationLabel =
    tx.prestation_intitule ?? tx.prestation?.intitule ?? (tx.prestation ? `#${tx.prestation}` : '—');
  const besoinLabel =
    tx.besoin_intitule ?? tx.besoin?.intitule ?? (tx.besoin ? `#${tx.besoin}` : '—');
  const lieu = tx.besoin?.lieu_intervention ?? '';
  const categorie = tx.prestation?.categorie?.nom ?? '';
  const fournisseurLabel =
    tx.fournisseur_nom ?? tx.fournisseur?.username ?? tx.fournisseur?.email ?? '—';
  const email = tx.fournisseur?.email ?? '';

  return {
    raw: tx,
    prestationLabel,
    besoinLabel,
    lieu,
    categorie,
    fournisseurLabel,
    email,
  };
}

const MesTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await transactionsService.getMyTransactions();
        setTransactions(Array.isArray(data) ? data : []);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.type_utilisateur === 'client') {
      fetchTransactions();
    }
  }, [user]);

  const rows = useMemo(() => transactions.map(normalizeTransaction), [transactions]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return rows.filter(({ raw, prestationLabel, besoinLabel, fournisseurLabel }) => {
      const matchesSearch =
        !q ||
        prestationLabel.toLowerCase().includes(q) ||
        besoinLabel.toLowerCase().includes(q) ||
        fournisseurLabel.toLowerCase().includes(q) ||
        String(raw.id).includes(q);

      if (filter === 'all') return matchesSearch;
      return raw.statut === filter && matchesSearch;
    });
  }, [rows, filter, searchTerm]);

  const stats = useMemo(() => {
    const tx = transactions;
    const termineesMontant = tx
      .filter((t) => t.statut === 'terminee')
      .reduce((sum, t) => sum + Number(t.prix_final || 0), 0);
    return {
      total: tx.length,
      enAttente: tx.filter((t) => t.statut === 'en_attente').length,
      enCours: tx.filter((t) => t.statut === 'en_cours' || t.statut === 'acceptee').length,
      termineesMontant,
    };
  }, [transactions]);

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
        <h1 className="text-2xl font-bold text-slate-900">Mes transactions</h1>
        <p className="mt-1 text-sm text-slate-600">
          Historique et suivi des collaborations avec les prestataires.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">En attente</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.enAttente}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Actives</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{stats.enCours}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Montant terminé</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {Math.round(stats.termineesMontant).toLocaleString('fr-FR')} FCFA
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Recherche
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Prestation, besoin, fournisseur…"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Statut
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Toutes</option>
              <option value="en_attente">En attente</option>
              <option value="acceptee">Acceptées</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminées</option>
              <option value="annulee">Annulées</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Prestation</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Besoin</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Fournisseur</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Montant</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    {transactions.length === 0
                      ? 'Vous n’avez pas encore de transaction.'
                      : 'Aucune transaction ne correspond aux filtres.'}
                  </td>
                </tr>
              ) : (
                filtered.map(({ raw, prestationLabel, besoinLabel, lieu, categorie, fournisseurLabel, email }) => (
                  <tr key={raw.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDateShort(raw.created_at)}
                      </span>
                    </td>
                    <td className="max-w-[11rem] px-4 py-3">
                      <p className="font-medium text-slate-900" title={prestationLabel}>
                        {truncateText(prestationLabel, 40)}
                      </p>
                      {categorie ? (
                        <p className="text-xs text-slate-500">{categorie}</p>
                      ) : null}
                    </td>
                    <td className="max-w-[11rem] px-4 py-3">
                      <p className="text-slate-900" title={besoinLabel}>
                        {truncateText(besoinLabel, 40)}
                      </p>
                      {lieu ? <p className="text-xs text-slate-500">{lieu}</p> : null}
                    </td>
                    <td className="max-w-[10rem] px-4 py-3">
                      <span className="inline-flex items-start gap-1 text-slate-800">
                        <FiUser className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>
                          <span className="block font-medium">{fournisseurLabel}</span>
                          {email ? <span className="block text-xs text-slate-500">{email}</span> : null}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-900">
                      {formatMoneyFcfa(raw.prix_final)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${transactionStatutPillClass(raw.statut)}`}
                      >
                        {transactionStatutLabel(raw.statut)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/client/transactions/${raw.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
                        title="Détail"
                      >
                        <FiEye className="h-3.5 w-3.5" />
                        Détail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        <FiBriefcase className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
        Pour les évaluations détaillées, utilisez aussi la page{' '}
        <Link to="/client/mes-collaborations" className="font-medium text-indigo-600 hover:underline">
          Mes collaborations
        </Link>
        .
      </p>
    </div>
  );
};

export default MesTransactions;
