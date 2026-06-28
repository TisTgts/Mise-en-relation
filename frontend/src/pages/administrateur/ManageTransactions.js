import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiChevronLeft, FiFilter, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import adminService from '../../services/adminService';
import transactionsService from '../../services/transactionsService';
import Toast from '../../components/Toast';

const statutLabel = (s) => {
  const map = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    terminee: 'Terminée',
    annulee: 'Annulée',
  };
  return map[s] || s || '—';
};

const adminValidationLabel = (s) => {
  const map = {
    non_requise: 'Non requise',
    en_attente: 'En attente admin',
    acceptee: 'Acceptée admin',
    rejetee: 'Rejetée admin',
  };
  return map[s] || s || '—';
};

const workflowBadge = (row) => {
  if (row.validation_admin_statut === 'en_attente') {
    return { label: 'En attente admin', cls: 'bg-amber-100 text-amber-800' };
  }
  if (row.statut === 'terminee') {
    return { label: 'Clôturée', cls: 'bg-emerald-100 text-emerald-800' };
  }
  if (row.travail_fournisseur_termine && row.verification_client_validee) {
    return { label: 'Prêt à clôturer', cls: 'bg-indigo-100 text-indigo-800' };
  }
  return { label: 'En progression', cls: 'bg-slate-100 text-slate-700' };
};

const WORKFLOW_QUERY_VALUES = new Set([
  'admin_en_attente',
  'en_progression',
  'pret_cloture',
  'cloturees',
  'all',
]);

const matchesWorkflowProgress = (r) =>
  r.validation_admin_statut !== 'en_attente' &&
  r.statut !== 'terminee' &&
  !(r.travail_fournisseur_termine && r.verification_client_validee);

/** Clôture admin autorisée (hors file validation admin en cours). */
const canAdminCloseTransaction = (r) =>
  r.statut !== 'terminee' &&
  r.travail_fournisseur_termine &&
  r.verification_client_validee &&
  r.validation_admin_statut !== 'en_attente' &&
  (!r.demande_validation_admin || r.validation_admin_statut === 'acceptee');

const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('fr-FR') : '—');

const TransactionDetailModal = ({ row, onClose, decidingId, onAdminDecision, onAdminFinalize }) => {
  if (!row) return null;
  const badge = workflowBadge(row);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p id="tx-detail-title" className="text-lg font-semibold text-slate-900">
              Transaction #{row.id}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Informations complètes</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fermer la fenêtre"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-5 py-4 text-sm">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prestation & besoin</h4>
            <dl className="mt-2 space-y-2 text-slate-800">
              <div>
                <dt className="text-xs text-slate-500">Prestation</dt>
                <dd className="font-medium">{row.prestation_intitule || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Besoin</dt>
                <dd className="font-medium">{row.besoin_intitule || '—'}</dd>
              </div>
              {(row.prestation != null || row.besoin != null) && (
                <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                  {row.prestation != null && <span>ID prestation : {row.prestation}</span>}
                  {row.besoin != null && <span>ID besoin : {row.besoin}</span>}
                </div>
              )}
            </dl>
          </section>
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parties</h4>
            <dl className="mt-2 grid gap-2 text-slate-800 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Fournisseur</dt>
                <dd className="font-medium">{row.fournisseur_nom || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Client</dt>
                <dd className="font-medium">{row.client_nom || '—'}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Montant & statut</h4>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="text-xs text-slate-500">Montant</dt>
                <dd className="text-lg font-semibold tabular-nums text-slate-900">
                  {row.prix_final != null ? `${Number(row.prix_final).toLocaleString('fr-FR')} FCFA` : '—'}
                </dd>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                  {statutLabel(row.statut)}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
            </dl>
          </section>
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</h4>
            <ul className="mt-2 space-y-2 text-slate-700">
              <li className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${row.travail_fournisseur_termine ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                Travail fournisseur déclaré
                <span className="text-xs text-slate-500">({fmtDateTime(row.travail_fournisseur_date)})</span>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${row.verification_client_validee ? 'bg-emerald-500' : row.verification_client_effectuee ? 'bg-rose-500' : 'bg-slate-300'}`}
                />
                Vérification client
                <span className="text-xs text-slate-500">
                  ({fmtDateTime(row.verification_client_date)})
                </span>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${row.validation_admin_statut === 'acceptee' ? 'bg-emerald-500' : row.validation_admin_statut === 'rejetee' ? 'bg-rose-500' : row.validation_admin_statut === 'en_attente' ? 'bg-amber-500' : 'bg-slate-300'}`}
                />
                Validation admin : {adminValidationLabel(row.validation_admin_statut)}
                <span className="text-xs text-slate-500">({fmtDateTime(row.validation_admin_date)})</span>
              </li>
              <li className="text-xs text-slate-600">
                Demande validation admin :{' '}
                <span className="font-medium">{row.demande_validation_admin ? 'Oui' : 'Non'}</span>
                {row.demande_validation_admin_date && (
                  <span className="text-slate-500"> · {fmtDateTime(row.demande_validation_admin_date)}</span>
                )}
              </li>
            </ul>
          </section>
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dates</h4>
            <dl className="mt-2 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Créée</dt>
                <dd>{fmtDateTime(row.created_at)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Mise à jour</dt>
                <dd>{fmtDateTime(row.updated_at)}</dd>
              </div>
            </dl>
          </section>
        </div>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/95 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fermer
          </button>
          {row.validation_admin_statut === 'en_attente' ? (
            <>
              <button
                type="button"
                onClick={() => onAdminDecision(row.id, 'accepter')}
                disabled={decidingId === row.id}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                Valider (accepter)
              </button>
              <button
                type="button"
                onClick={() => onAdminDecision(row.id, 'rejeter')}
                disabled={decidingId === row.id}
                className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Rejeter
              </button>
            </>
          ) : canAdminCloseTransaction(row) ? (
            <button
              type="button"
              onClick={() => onAdminFinalize(row.id)}
              disabled={decidingId === row.id}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Clôturer
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ManageTransactions = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterWorkflow, setFilterWorkflow] = useState('all');
  const [toast, setToast] = useState(null);
  const [decidingId, setDecidingId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);

  useEffect(() => {
    const w = searchParams.get('workflow');
    if (w && WORKFLOW_QUERY_VALUES.has(w)) {
      setFilterWorkflow(w === 'all' ? 'all' : w);
    } else if (!w) {
      setFilterWorkflow('all');
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      if (user?.type_utilisateur !== 'administrateur') return;
      try {
        setLoading(true);
        const data = await adminService.getAllTransactions();
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setToast({ message: 'Impossible de charger les transactions.', type: 'error' });
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!detailRow) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setDetailRow(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailRow]);

  const statuts = useMemo(() => {
    const set = new Set(rows.map((r) => r.statut).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = rows.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      r.prestation_intitule?.toLowerCase().includes(q) ||
      r.besoin_intitule?.toLowerCase().includes(q) ||
      r.fournisseur_nom?.toLowerCase().includes(q) ||
      r.client_nom?.toLowerCase().includes(q) ||
      String(r.id).includes(q);
    const matchesStatut = filterStatut === 'all' || r.statut === filterStatut;
    const matchesWorkflow =
      filterWorkflow === 'all' ||
      (filterWorkflow === 'admin_en_attente' && r.validation_admin_statut === 'en_attente') ||
      (filterWorkflow === 'en_progression' && matchesWorkflowProgress(r)) ||
      (filterWorkflow === 'pret_cloture' &&
        r.travail_fournisseur_termine &&
        r.verification_client_validee &&
        r.statut !== 'terminee' &&
        r.validation_admin_statut !== 'en_attente') ||
      (filterWorkflow === 'cloturees' && r.statut === 'terminee');
    return matchesSearch && matchesStatut && matchesWorkflow;
  });

  const handleAdminDecision = async (transactionId, decision) => {
    try {
      setDecidingId(transactionId);
      const updated = await transactionsService.adminDecideTransaction(transactionId, decision);
      setRows((prev) => prev.map((row) => (row.id === transactionId ? { ...row, ...updated } : row)));
      setDetailRow((d) => (d && d.id === transactionId ? { ...d, ...updated } : d));
      setToast({
        message: decision === 'accepter' ? 'Transaction validée par admin.' : 'Demande rejetée.',
        type: 'success',
      });
    } catch (error) {
      setToast({ message: error.message || 'Action admin impossible.', type: 'error' });
    } finally {
      setDecidingId(null);
    }
  };

  const handleAdminFinalize = async (transactionId) => {
    const ok = await confirm({
      title: 'Clôturer cette transaction ?',
      message: 'Le statut passera à « Terminée ».',
      tone: 'warning',
      confirmLabel: 'Clôturer',
    });
    if (!ok) return;
    try {
      setDecidingId(transactionId);
      const updated = await transactionsService.adminFinalizeTransaction(transactionId);
      setRows((prev) => prev.map((row) => (row.id === transactionId ? { ...row, ...updated } : row)));
      setDetailRow((d) => (d && d.id === transactionId ? { ...d, ...updated } : d));
      setToast({ message: 'Transaction clôturée.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Clôture impossible.', type: 'error' });
    } finally {
      setDecidingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/admin/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <FiChevronLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="mt-1 text-sm text-slate-600">
          Vue consolidée des transactions entre clients et fournisseurs ({rows.length} en base).
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Recherche</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Prestation, besoin, utilisateurs, ID…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <FiFilter className="h-4 w-4" />
            Statut
          </label>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Tous</option>
            {statuts.map((s) => (
              <option key={s} value={s}>
                {statutLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Workflow clôture</label>
          <select
            value={filterWorkflow}
            onChange={(e) => setFilterWorkflow(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Tous</option>
            <option value="admin_en_attente">Demandes admin en attente</option>
            <option value="en_progression">En progression</option>
            <option value="pret_cloture">Prêtes à clôturer</option>
            <option value="cloturees">Clôturées</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Résumé</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Étape</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Montant</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Aucune transaction correspondante.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const badge = workflowBadge(r);
                  const summaryTitle = [r.prestation_intitule, r.besoin_intitule].filter(Boolean).join(' · ');
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{r.id}</td>
                      <td className="max-w-[min(28rem,55vw)] px-4 py-3 text-slate-900">
                        <p className="truncate font-medium" title={summaryTitle || undefined}>
                          {r.prestation_intitule || '—'}
                        </p>
                        <p className="truncate text-xs text-slate-600" title={r.besoin_intitule || undefined}>
                          {r.besoin_intitule || '—'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {r.prix_final != null ? `${Number(r.prix_final).toLocaleString('fr-FR')}` : '—'}
                        {r.prix_final != null && <span className="ml-1 text-xs font-normal text-slate-500">FCFA</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailRow(r)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                          >
                            Détails
                          </button>
                          {r.validation_admin_statut === 'en_attente' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAdminDecision(r.id, 'accepter')}
                                disabled={decidingId === r.id}
                                className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                              >
                                Valider
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminDecision(r.id, 'rejeter')}
                                disabled={decidingId === r.id}
                                className="rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              >
                                Rejeter
                              </button>
                            </>
                          ) : canAdminCloseTransaction(r) ? (
                            <button
                              type="button"
                              onClick={() => handleAdminFinalize(r.id)}
                              disabled={decidingId === r.id}
                              className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              Clôturer
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionDetailModal
        row={detailRow}
        onClose={() => setDetailRow(null)}
        decidingId={decidingId}
        onAdminDecision={handleAdminDecision}
        onAdminFinalize={handleAdminFinalize}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default ManageTransactions;
