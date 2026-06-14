import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiMessageSquare, FiUser } from 'react-icons/fi';
import transactionsService from '../../../services/transactionsService';
import Toast from '../../../components/Toast';
import { formatMoneyFcfa, transactionStatutLabel, transactionStatutPillClass } from '../clientUi';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadTransaction = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionsService.getTransactionById(id);
      setTransaction(data);
    } catch (error) {
      setToast({ message: error.message || 'Impossible de charger la transaction.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadTransaction();
  }, [id, loadTransaction]);

  const handleVerify = async () => {
    try {
      await transactionsService.clientVerifyWork(id, true);
      await loadTransaction();
      setToast({ message: 'Travail vérifié côté client.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Erreur de vérification.', type: 'error' });
    }
  };

  const handleConfirm = async () => {
    try {
      await transactionsService.clientConfirmTransaction(id);
      await loadTransaction();
      setToast({ message: 'Transaction confirmée.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Erreur de confirmation.', type: 'error' });
    }
  };

  const handleAskAdmin = async () => {
    try {
      await transactionsService.requestAdminApproval(id);
      await loadTransaction();
      setToast({ message: 'Demande envoyée à l’administrateur.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Erreur de demande admin.', type: 'error' });
    }
  };

  const handleRespondQuote = async (decision) => {
    try {
      await transactionsService.clientRespondDevis(id, decision);
      await loadTransaction();
      setToast({
        message: decision === 'accepter' ? 'Devis accepté.' : 'Devis rejeté.',
        type: 'success',
      });
    } catch (error) {
      setToast({ message: error.message || 'Erreur lors de la réponse au devis.', type: 'error' });
    }
  };

  const steps = useMemo(() => {
    if (!transaction) return [];
    const hasAdmin = transaction.demande_validation_admin || transaction.validation_admin_statut !== 'non_requise';
    const items = [
      { key: 'created', label: 'Besoin publié', done: true },
      { key: 'matched', label: 'Match confirmé', done: true },
      { key: 'work', label: 'Travail fournisseur', done: !!transaction.travail_fournisseur_termine },
      { key: 'check', label: 'Vérification client', done: !!transaction.verification_client_validee },
    ];
    if (hasAdmin) {
      items.push({
        key: 'admin',
        label: 'Validation admin',
        done: transaction.validation_admin_statut === 'acceptee',
        blocked: transaction.validation_admin_statut === 'rejetee',
      });
    }
    items.push({ key: 'closed', label: 'Clôture', done: transaction.statut === 'terminee' });
    return items;
  }, [transaction]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!transaction) {
    return <div className="p-8 text-sm text-slate-600">Transaction introuvable.</div>;
  }

  const isQuoteFlow =
    transaction.besoin_mode_budget === 'sur_devis' ||
    transaction.prestation_mode_tarification === 'devis' ||
    transaction.devis_statut !== 'non_requis';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/client/transactions')}
              className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Transaction #{transaction.id}</h1>
              <p className="text-sm text-slate-600">{transaction.besoin_intitule || 'Besoin'} · {transaction.prestation_intitule || 'Prestation'}</p>
            </div>
          </div>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${transactionStatutPillClass(transaction.statut)}`}>
            {transactionStatutLabel(transaction.statut)}
          </span>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ligne de cheminement</p>
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-start">
            {steps.map((step, idx) => {
              const isDone = step.done;
              const isBlocked = step.blocked;
              const isCurrent = !isDone && !isBlocked && steps.findIndex((s) => !s.done && !s.blocked) === idx;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex w-32 flex-col items-center text-center">
                    <span className={`h-3 w-3 rounded-full ${isBlocked ? 'bg-rose-500' : isDone ? 'bg-emerald-500' : isCurrent ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    <span className={`mt-2 text-[11px] font-medium ${isBlocked ? 'text-rose-700' : isDone ? 'text-emerald-700' : isCurrent ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 ? <div className={`mt-1 h-0.5 w-10 ${isDone ? 'bg-emerald-400' : 'bg-slate-300'}`} /> : null}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Participants et service</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Fournisseur</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900"><FiUser className="h-4 w-4 text-slate-400" />{transaction.fournisseur_nom || '—'}</p>
                <p className="mt-2 text-sm text-slate-600">{transaction.prestation_intitule || '—'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Besoin</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{transaction.besoin_intitule || '—'}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <FiCalendar className="h-4 w-4 text-slate-400" />
                  {transaction.created_at ? new Date(transaction.created_at).toLocaleString('fr-FR') : '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{transaction.notes || 'Aucune note.'}</p>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Montant</h2>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{formatMoneyFcfa(transaction.prix_final)}</p>
            <p className="mt-2 text-xs text-slate-500">Validation admin: {transaction.validation_admin_statut || 'non_requise'}</p>
            {isQuoteFlow && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                <p>Statut devis: <span className="font-semibold">{transaction.devis_statut || 'a_proposer'}</span></p>
                <p>
                  Montant proposé: <span className="font-semibold">{formatMoneyFcfa(transaction.devis_montant_propose)}</span>
                </p>
                {transaction.devis_description && (
                  <p className="mt-1 text-slate-600">{transaction.devis_description}</p>
                )}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Actions client</h2>
            <div className="mt-4 space-y-2">
              {transaction.devis_statut === 'en_attente_client' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRespondQuote('accepter')}
                    className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700"
                  >
                    Accepter le devis
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespondQuote('rejeter')}
                    className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700"
                  >
                    Rejeter le devis
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleVerify}
                disabled={!transaction.travail_fournisseur_termine || transaction.verification_client_effectuee}
                className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 disabled:opacity-50"
              >
                Vérifier le travail
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!transaction.verification_client_validee || transaction.statut === 'terminee' || transaction.validation_admin_statut === 'en_attente'}
                className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50"
              >
                Confirmer la transaction
              </button>
              <button
                type="button"
                onClick={handleAskAdmin}
                disabled={transaction.validation_admin_statut === 'en_attente'}
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-700 disabled:opacity-50"
              >
                Demander validation admin
              </button>
              <Link
                to={`/client/messages?transaction=${transaction.id}`}
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FiMessageSquare className="mr-2 h-4 w-4" />
                Ouvrir les messages
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default TransactionDetail;
