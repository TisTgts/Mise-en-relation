import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiEye, FiSearch, FiUser } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import transactionsService from '../../../services/transactionsService';
import {
  formatDateShort,
  formatMoneyFcfa,
  transactionStatutLabel,
  transactionStatutPillClass,
  truncateText,
} from '../fournisseurUi';

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
      } finally {
        setLoading(false);
      }
    };
    if (user?.type_utilisateur === 'fournisseur') fetchTransactions();
  }, [user]);

  const filteredTransactions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return transactions.filter((t) => {
      const prest = t.prestation_intitule || t.prestation?.intitule || '';
      const besoin = t.besoin_intitule || t.besoin?.intitule || '';
      const client = t.client_nom || '';
      const matchesSearch =
        !q ||
        prest.toLowerCase().includes(q) ||
        besoin.toLowerCase().includes(q) ||
        client.toLowerCase().includes(q) ||
        String(t.id).includes(q);
      const matchesStatus = filter === 'all' || t.statut === filter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, filter]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const actives = transactions.filter((t) => ['en_attente', 'acceptee', 'en_cours'].includes(t.statut)).length;
    const terminees = transactions.filter((t) => t.statut === 'terminee').length;
    const montantTermine = transactions
      .filter((t) => t.statut === 'terminee')
      .reduce((s, t) => s + Number(t.prix_final || 0), 0);
    return { total, actives, terminees, montantTermine };
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Mes transactions</h1>
        <p className="mt-1 text-sm text-slate-600">Suivi de vos transactions côté fournisseur.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Actives</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{stats.actives}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Terminées</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.terminees}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Montant terminé</p>
          <p className="mt-1 text-xl font-bold text-violet-700">{formatMoneyFcfa(stats.montantTermine)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Recherche
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une transaction..."
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Statut
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Toutes les transactions</option>
              <option value="en_attente">En attente</option>
              <option value="acceptee">Acceptées</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminées</option>
              <option value="annulee">Annulées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {transactions.length === 0 ? 'Vous n\'avez pas encore de transaction' : 'Aucune transaction trouvée'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Prestation
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Besoin
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Client
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Prix
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="h-4 w-4" />
                        {formatDateShort(transaction.created_at)}
                      </div>
                    </td>
                    <td className="max-w-[12rem] px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-900" title={transaction.prestation_intitule || transaction.prestation?.intitule}>
                          {truncateText(transaction.prestation_intitule || transaction.prestation?.intitule || `Prestation #${transaction.prestation}`, 38)}
                        </div>
                        <div className="text-xs text-slate-500">{transaction.prestation?.categorie?.nom || '—'}</div>
                      </div>
                    </td>
                    <td className="max-w-[12rem] px-4 py-3 text-slate-800">
                      <div>
                        <div>{truncateText(transaction.besoin_intitule || transaction.besoin?.intitule || `Besoin #${transaction.besoin}`, 38)}</div>
                        <div className="text-xs text-slate-500">{transaction.besoin?.lieu_intervention || '—'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm">
                        <FiUser className="mr-1 h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900">
                            {transaction.client_nom || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                      {formatMoneyFcfa(transaction.prix_final)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${transactionStatutPillClass(transaction.statut)}`}>
                        {transactionStatutLabel(transaction.statut)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/fournisseur/transactions/${transaction.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                        title="Voir les détails"
                      >
                        <FiEye className="h-3.5 w-3.5" />
                        Détail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MesTransactions;
