import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiDollarSign, FiEye, FiMail, FiPlus, FiRefreshCw, FiUser, FiCompass } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import {
  fetchAllPaginated,
  formatDateShort,
  formatMoneyFcfa,
  prestationStatutLabel,
  prestationStatutPillClass,
  transactionStatutLabel,
  transactionStatutPillClass,
  truncateText,
} from './fournisseurUi';

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'prestations', label: 'Prestations' },
  { id: 'transactions', label: 'Transactions' },
];

const buildAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token || ''}`,
});

const FournisseurDashboard = () => {
  const { user, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [prestations, setPrestations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('overview');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!token) {
        navigate('/login');
        return;
      }
      const headers = buildAuthHeaders(token);
      const [prestData, txData, msgData] = await Promise.all([
        fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}my/`, { headers }).then((r) => r.ok ? r.json() : []),
        fetchAllPaginated(API_ENDPOINTS.SERVICES.TRANSACTIONS, headers),
        fetchAllPaginated(API_ENDPOINTS.SERVICES.MESSAGES, headers),
      ]);

      const pList = Array.isArray(prestData) ? prestData : prestData.results || [];
      const uid = user?.id;
      const txList = (Array.isArray(txData) ? txData : []).filter((t) => {
        const fid = t.fournisseur?.id ?? t.fournisseur;
        return uid == null || fid === uid;
      });
      const msgList = (Array.isArray(msgData) ? msgData : []).filter((m) => {
        const eid = m.expediteur?.id ?? m.expediteur;
        const did = m.destinataire?.id ?? m.destinataire;
        return uid == null || eid === uid || did === uid;
      });

      setPrestations(pList);
      setTransactions(txList);
      setMessages(msgList);
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes('HTTP 401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, token, navigate]);

  useEffect(() => {
    if (!isAuthenticated || user?.type_utilisateur !== 'fournisseur') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate, fetchData]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.id === t)) setTab(t);
    else if (!t) setTab('overview');
  }, [searchParams]);

  const goTab = (id) => {
    setTab(id);
    if (id === 'overview') setSearchParams({}, { replace: true });
    else setSearchParams({ tab: id }, { replace: true });
  };

  const stats = useMemo(() => {
    const totalPrestations = prestations.length;
    const prestationsActives = prestations.filter((p) => p.statut === 'active').length;
    const transactionsActives = transactions.filter((t) => ['en_attente', 'acceptee', 'en_cours'].includes(t.statut)).length;
    const revenuTermine = transactions
      .filter((t) => t.statut === 'terminee')
      .reduce((s, t) => s + Number(t.prix_final || 0), 0);
    const nonLus = messages.filter((m) => {
      const did = m.destinataire?.id ?? m.destinataire;
      return did === user?.id && !m.lu;
    }).length;
    return { totalPrestations, prestationsActives, transactionsActives, revenuTermine, nonLus };
  }, [prestations, transactions, messages, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de bord fournisseur</h1>
            <p className="mt-1 text-sm text-slate-600">
              Bienvenue {user?.first_name || user?.username}, suivez vos prestations et vos transactions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchData();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <Link
              to="/fournisseur/profil"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FiUser className="h-4 w-4" />
              Mon profil
            </Link>
            <Link
              to="/fournisseur/creer-prestation"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <FiPlus className="h-4 w-4" />
              Nouvelle prestation
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Prestations</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalPrestations}</p>
            <p className="text-xs text-slate-500">{stats.prestationsActives} actives</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Transactions actives</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{stats.transactionsActives}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Revenu terminé</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{formatMoneyFcfa(stats.revenuTermine)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Messages non lus</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{stats.nonLus}</p>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goTab(t.id)}
              className={`px-4 py-3 text-sm font-medium ${
                tab === t.id
                  ? 'border-b-2 border-indigo-600 bg-indigo-50/60 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {prestations.length === 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <FiCompass className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Première étape : vos offres</p>
                    <p className="mt-1 text-sm text-emerald-800/90">
                      Créez au moins une prestation pour apparaître dans les correspondances et recevoir des sollicitations.
                    </p>
                  </div>
                </div>
                <Link
                  to="/fournisseur/creer-prestation"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Créer ma première prestation
                </Link>
              </div>
            )}
            <Link to="/fournisseur/mes-prestations" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
              <p className="font-semibold text-slate-900">Mes prestations</p>
              <p className="mt-1 text-sm text-slate-600">Gérer vos offres et leurs statuts.</p>
            </Link>
            <Link to="/fournisseur/transactions" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
              <p className="font-semibold text-slate-900">Mes transactions</p>
              <p className="mt-1 text-sm text-slate-600">Suivre les prestations vendues.</p>
            </Link>
            <Link to="/fournisseur/messages" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
              <p className="font-semibold text-slate-900">Messages</p>
              <p className="mt-1 text-sm text-slate-600">Échanger avec les clients.</p>
            </Link>
            <Link to="/fournisseur/mes-collaborations" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
              <p className="font-semibold text-slate-900">Collaborations</p>
              <p className="mt-1 text-sm text-slate-600">Vue détaillée des missions.</p>
            </Link>
          </div>
        )}

        {tab === 'prestations' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Intitulé</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Tarif</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Créée</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prestations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      Aucune prestation.
                    </td>
                  </tr>
                ) : (
                  prestations.slice(0, 12).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="max-w-[14rem] px-4 py-3">
                        <span className="font-medium text-slate-900" title={p.intitule}>
                          {truncateText(p.intitule, 48)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.type_prestation || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-900">
                        {p.tarif_min != null || p.tarif_max != null
                          ? `${p.tarif_min != null ? Number(p.tarif_min).toLocaleString('fr-FR') : '—'} – ${p.tarif_max != null ? Number(p.tarif_max).toLocaleString('fr-FR') : '—'}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${prestationStatutPillClass(p.statut)}`}>
                          {prestationStatutLabel(p.statut)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateShort(p.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link to={`/fournisseur/prestation/${p.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
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
        )}

        {tab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Prestation</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Client</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Montant</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      Aucune transaction.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 12).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateShort(t.created_at)}</td>
                      <td className="max-w-[14rem] px-4 py-3 text-slate-900">
                        {truncateText(t.prestation_intitule || t.prestation?.intitule || `Prestation #${t.prestation}`, 42)}
                      </td>
                      <td className="px-4 py-3 text-slate-800">{t.client_nom || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-900">{formatMoneyFcfa(t.prix_final)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${transactionStatutPillClass(t.statut)}`}>
                          {transactionStatutLabel(t.statut)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link to={`/fournisseur/transactions/${t.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
                          <FiDollarSign className="h-3.5 w-3.5" />
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500">
        <FiMail className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
        Pour répondre rapidement, ouvrez la page <Link to="/fournisseur/messages" className="font-medium text-indigo-600 hover:underline">Messages</Link>.
      </div>
    </div>
  );
};

export default FournisseurDashboard;
