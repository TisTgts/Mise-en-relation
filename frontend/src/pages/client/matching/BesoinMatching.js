import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiMail, FiRefreshCw, FiSend, FiUser, FiX } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../../config/api';
import { clientCanSelfLaunchMatching, clientMatchingPremiumMessage } from '../../../utils/clientPremium';
import { formatDateShort, formatMoneyFcfa, truncateText } from '../clientUi';
import Toast from '../../../components/Toast';
import transactionsService from '../../../services/transactionsService';
import {
  devisStatutPillClass,
  labelDevisStatut,
  labelModeBudget,
  labelModeTarification,
  matchRequiresQuote,
} from '../../../utils/tarification';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const BesoinMatching = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canLaunchMatching = clientCanSelfLaunchMatching(user);
  const besoinId = Number(id);
  const [besoin, setBesoin] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedPrestationId, setSelectedPrestationId] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loadingProviderProfile, setLoadingProviderProfile] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [respondingDevis, setRespondingDevis] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [openDetails, setOpenDetails] = useState({ reasons: false, scores: false });
  const initialSelectionDone = useRef(false);

  const toggleDetail = (key) => {
    setOpenDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [besRes, scoreRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.SERVICES.BESOINS}${besoinId}/`, { headers: authHeaders() }),
        fetch(API_ENDPOINTS.MATCHING.SCORES, { headers: authHeaders() }),
      ]);
      const besoinData = besRes.ok ? await besRes.json() : null;
      let scoreData = scoreRes.ok ? await scoreRes.json() : [];

      const needsQuoteSync =
        besoinData &&
        (besoinData.mode_budget === 'sur_devis' ||
          (Array.isArray(scoreData) &&
            scoreData.some((s) =>
              matchRequiresQuote(s.besoin, s.prestation)
            )));

      if (needsQuoteSync && Array.isArray(scoreData) && scoreData.length > 0) {
        await fetch(API_ENDPOINTS.MATCHING.SYNC_DEVIS_OPPORTUNITIES(besoinId), {
          method: 'POST',
          headers: authHeaders(),
        }).catch(() => {});
        const scoreRes2 = await fetch(API_ENDPOINTS.MATCHING.SCORES, { headers: authHeaders() });
        if (scoreRes2.ok) scoreData = await scoreRes2.json();
      }

      const filtered = (Array.isArray(scoreData) ? scoreData : [])
        .filter((s) => s?.besoin?.id === besoinId)
        .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

      setBesoin(besoinData);
      setScores(filtered);
      if (!initialSelectionDone.current && filtered.length) {
        setSelectedPrestationId(filtered[0]?.prestation?.id ?? null);
        initialSelectionDone.current = true;
      }
    } catch {
      setToast({ message: 'Impossible de charger ce matching.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [besoinId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selected = useMemo(
    () => scores.find((s) => (s.prestation?.id ?? null) === selectedPrestationId) || null,
    [scores, selectedPrestationId]
  );
  const selectedScoreDetails = selected?.details?.scores || selected?.score_details?.scores || {};
  const selectedReasons = Array.isArray(selected?.reasons) ? selected.reasons : [];
  const selectedQuote = selected?.quote || null;
  const requiresQuote = Boolean(
    selectedQuote?.match_requires_quote ||
      matchRequiresQuote(selected?.besoin, selected?.prestation)
  );
  const quoteAccepted = Boolean(selectedQuote?.can_confirm_match);
  const quoteAwaitingClient = selectedQuote?.devis_statut === 'en_attente_client';
  // Étape « choisir ce fournisseur » : devis requis mais aucune proposition encore en cours.
  const needsQuoteRequest = requiresQuote && !quoteAccepted && !quoteAwaitingClient;
  const canConfirmMatch = Boolean(
    selected?.prestation?.id &&
      (!requiresQuote || quoteAccepted || needsQuoteRequest)
  );

  const handleRespondDevis = async (decision) => {
    const txId = selectedQuote?.transaction_id;
    if (!txId) {
      setToast({ message: 'Aucune transaction devis pour cette correspondance.', type: 'warning' });
      return;
    }
    try {
      setRespondingDevis(true);
      await transactionsService.clientRespondDevis(txId, decision);
      setToast({
        message: decision === 'accepter' ? 'Devis accepté.' : 'Devis rejeté.',
        type: decision === 'accepter' ? 'success' : 'info',
      });
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Réponse au devis impossible.', type: 'error' });
    } finally {
      setRespondingDevis(false);
    }
  };

  const handleRunMatching = async () => {
    if (!canLaunchMatching) {
      setToast({ message: clientMatchingPremiumMessage(), type: 'warning' });
      return;
    }
    try {
      setRunning(true);
      const res = await fetch(API_ENDPOINTS.MATCHING.FIND_MATCHES_FOR_BESOIN(besoinId), {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || payload.detail || 'Erreur matching');
      }
      setToast({ message: 'Matching recalculé pour ce besoin.', type: 'success' });
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Échec du recalcul matching.', type: 'error' });
    } finally {
      setRunning(false);
    }
  };

  const handleContact = async (e) => {
    e.preventDefault();
    if (!selected?.prestation?.fournisseur) {
      setToast({ message: 'Sélectionnez une correspondance valide.', type: 'warning' });
      return;
    }
    if (!subject.trim() || !message.trim()) {
      setToast({ message: 'Sujet et message sont obligatoires.', type: 'warning' });
      return;
    }

    try {
      setSending(true);
      const payload = {
        destinataire: selected.prestation.fournisseur,
        transaction: null,
        sujet: subject.trim(),
        contenu: message.trim(),
      };
      const res = await fetch(API_ENDPOINTS.SERVICES.MESSAGES, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.detail || "Envoi impossible");
      }
      setMessage('');
      setSubject('');
      setToast({ message: 'Message envoyé au fournisseur.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || "Erreur d'envoi du message.", type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const openContactModal = (matchRow) => {
    if (!matchRow?.prestation?.id) return;
    setSelectedPrestationId(matchRow.prestation.id);
    setContactModalOpen(true);
  };

  const handleConfirmMatch = async () => {
    if (!selected?.prestation?.id) {
      setToast({ message: 'Choisissez une correspondance à confirmer.', type: 'warning' });
      return;
    }
    try {
      setConfirming(true);
      const payload = {
        besoin_id: besoinId,
        prestation_id: selected.prestation.id,
      };
      if (subject.trim() && message.trim()) {
        payload.sujet = subject.trim();
        payload.contenu = message.trim();
      }
      const res = await fetch(API_ENDPOINTS.MATCHING.CLIENT_CONFIRMER_MATCH, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Impossible de confirmer ce match.');
      }
      if (data.awaiting_quote) {
        setToast({
          message:
            data.message ||
            'Fournisseur sélectionné. Une demande de devis lui a été envoyée.',
          type: 'success',
        });
        await loadData();
        return;
      }
      setToast({ message: 'Match confirmé, collaboration créée.', type: 'success' });
      setTimeout(() => {
        navigate(`/client/mes-collaborations?created=${data.transaction_id || 'ok'}`);
      }, 300);
    } catch (err) {
      setToast({ message: err.message || 'Erreur de confirmation du match.', type: 'error' });
    } finally {
      setConfirming(false);
    }
  };

  const openProviderProfile = async (fournisseurId) => {
    try {
      setLoadingProviderProfile(true);
      const url = `${API_ENDPOINTS.MATCHING.CLIENT_FOURNISSEUR_PROFIL_MATCHE(fournisseurId)}?besoin_id=${besoinId}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.error || p.detail || 'Profil non disponible');
      }
      const data = await res.json();
      setProviderProfile(data);
    } catch (err) {
      setToast({ message: err.message || 'Impossible de charger le profil fournisseur.', type: 'error' });
    } finally {
      setLoadingProviderProfile(false);
    }
  };

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Matching client</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {besoin?.intitule || `Besoin #${besoinId}`}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Comparez les correspondances{requiresQuote || besoin?.mode_budget === 'sur_devis' ? ', les devis proposés,' : ''}{' '}
              puis confirmez le fournisseur retenu.
            </p>
            {besoin?.mode_budget && (
              <span className="mt-2 inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                {labelModeBudget(besoin.mode_budget)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              to="/client/matchings"
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retour aux matchings
            </Link>
            {canLaunchMatching ? (
              <button
                type="button"
                onClick={handleRunMatching}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <FiRefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
                Recalculer
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {!canLaunchMatching && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {clientMatchingPremiumMessage()} Vous pouvez consulter les correspondances déjà calculées par
          l&apos;administrateur.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Choix</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Fournisseur</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Prestation</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Score</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Tarif</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Devis</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Calculé</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    Aucune correspondance pour ce besoin.
                  </td>
                </tr>
              ) : (
                scores.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        checked={(s.prestation?.id ?? null) === selectedPrestationId}
                        onChange={() => setSelectedPrestationId(s.prestation?.id ?? null)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-800">{s.prestation?.fournisseur_nom || '—'}</td>
                    <td className="max-w-[20rem] px-4 py-3">
                      <p className="font-medium text-slate-900">{truncateText(s.prestation?.intitule, 52)}</p>
                      <p className="text-xs text-slate-500">{s.prestation?.categorie_nom || '—'}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {Number(s.score || 0).toFixed(2)} / 100
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-800">
                      {s.prestation
                        ? `${formatMoneyFcfa(s.prestation.tarif_min)} - ${formatMoneyFcfa(s.prestation.tarif_max)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.quote?.match_requires_quote || matchRequiresQuote(s.besoin, s.prestation) ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${devisStatutPillClass(s.quote?.devis_statut)}`}
                        >
                          {labelDevisStatut(s.quote?.devis_statut || 'a_proposer')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Prix direct</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateShort(s.calculated_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => openContactModal(s)}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          <FiMail className="h-3.5 w-3.5" />
                          Contacter
                        </button>
                        <button
                          type="button"
                          onClick={() => openProviderProfile(s.prestation?.fournisseur)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          disabled={loadingProviderProfile}
                        >
                          <FiUser className="h-3.5 w-3.5" />
                          Profil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <section className="overflow-hidden rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white shadow-sm">
          <div className="border-b border-emerald-100 bg-white/60 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Fournisseur retenu</p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {selected.prestation?.fournisseur_nom || '—'}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-slate-800">
                  {selected.prestation?.intitule || '—'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
                    Score {Number(selected.score || 0).toFixed(2)} / 100
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-semibold ${
                      selected.accepted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selected.accepted ? 'Correspondance acceptée' : 'À vérifier'}
                  </span>
                  {(requiresQuote || selectedQuote?.match_requires_quote) && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-semibold ${devisStatutPillClass(selectedQuote?.devis_statut)}`}
                    >
                      {labelDevisStatut(selectedQuote?.devis_statut || 'a_proposer')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openContactModal(selected)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  <FiMail className="h-4 w-4" />
                  Contacter
                </button>
                <button
                  type="button"
                  onClick={() => openProviderProfile(selected.prestation?.fournisseur)}
                  disabled={loadingProviderProfile}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <FiUser className="h-4 w-4" />
                  Profil
                </button>
              </div>
            </div>
          </div>

          {requiresQuote && (
            <div className="border-b border-emerald-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Devis du fournisseur</h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Tarification : {labelModeTarification(selected.prestation?.mode_tarification)}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Montant proposé</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {selectedQuote?.devis_montant_propose != null
                      ? formatMoneyFcfa(selectedQuote.devis_montant_propose)
                      : 'En attente'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Fourchette prestation</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatMoneyFcfa(selected.prestation?.tarif_min)} –{' '}
                    {formatMoneyFcfa(selected.prestation?.tarif_max)}
                  </p>
                </div>
              </div>
              {selectedQuote?.devis_description ? (
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                  {selectedQuote.devis_description}
                </p>
              ) : null}
              {selectedQuote?.devis_statut === 'en_attente_client' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRespondDevis('accepter')}
                    disabled={respondingDevis}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Accepter le devis
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespondDevis('rejeter')}
                    disabled={respondingDevis}
                    className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                </div>
              )}
              {selectedQuote?.awaiting_supplier && (
                <p className="mt-3 text-sm text-violet-800">
                  En attente de la proposition du fournisseur.
                </p>
              )}
              {selectedQuote?.transaction_id && (
                <Link
                  to={`/client/transactions/${selectedQuote.transaction_id}`}
                  className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Voir la transaction #{selectedQuote.transaction_id}
                </Link>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">
                {needsQuoteRequest ? 'Choisir ce fournisseur ?' : 'Prêt à lancer la collaboration ?'}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {requiresQuote
                  ? quoteAccepted
                    ? 'Devis accepté — confirmez pour lancer la collaboration.'
                    : quoteAwaitingClient
                      ? 'Le fournisseur a proposé un devis : acceptez-le ci-dessus pour continuer.'
                      : 'En le choisissant, le fournisseur recevra une demande de devis. La collaboration démarrera une fois le devis accepté.'
                  : 'La confirmation crée une collaboration dans Mes collaborations.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmMatch}
              disabled={!canConfirmMatch || confirming}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[16rem]"
            >
              <FiSend className="h-4 w-4" />
              {confirming
                ? 'Traitement en cours…'
                : !requiresQuote
                  ? 'Confirmer ce match'
                  : quoteAccepted
                    ? 'Confirmer la collaboration'
                    : needsQuoteRequest
                      ? 'Choisir ce fournisseur (demander un devis)'
                      : 'En attente de votre réponse au devis'}
            </button>
          </div>
        </section>
      )}

      {selected && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Informations complémentaires
          </p>

          <div className="border-b border-slate-100">
            <button
              type="button"
              onClick={() => toggleDetail('reasons')}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
              aria-expanded={openDetails.reasons}
            >
              <span className="text-sm font-medium text-slate-800">Raisons du matching</span>
              {openDetails.reasons ? (
                <FiChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
              ) : (
                <FiChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
              )}
            </button>
            {openDetails.reasons && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                {selectedReasons.length ? (
                  <ul className="space-y-2">
                    {selectedReasons.map((reason, idx) => (
                      <li
                        key={`${idx}-${reason}`}
                        className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Aucune raison détaillée disponible.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => toggleDetail('scores')}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
              aria-expanded={openDetails.scores}
            >
              <span className="text-sm font-medium text-slate-800">Détail du score</span>
              {openDetails.scores ? (
                <FiChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
              ) : (
                <FiChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
              )}
            </button>
            {openDetails.scores && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                <div className="space-y-2 text-sm">
                  {[
                    ['Compétence', selectedScoreDetails.competence],
                    ['Zone', selectedScoreDetails.geographie],
                    ['Disponibilité', selectedScoreDetails.disponibilite],
                    ['Fiabilité', selectedScoreDetails.fiabilite],
                    ['Prix', selectedScoreDetails.prix],
                    ['Abonnement', selectedScoreDetails.abonnement],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                    >
                      <span className="text-slate-700">{label}</span>
                      <span className="font-semibold text-slate-900">
                        {value != null ? `${Number(value).toFixed(2)} / 100` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  Seuil minimal : <span className="font-semibold">{selected.threshold || '55'}</span> / 100 ·
                  Statut :{' '}
                  <span
                    className={`font-semibold ${selected.accepted ? 'text-emerald-700' : 'text-amber-700'}`}
                  >
                    {selected.accepted ? 'Accepté' : 'À vérifier'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {contactModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setContactModalOpen(false)}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Contact fournisseur</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {selected?.prestation?.fournisseur_nom || 'Fournisseur'}
                </h3>
                <p className="text-sm text-slate-600">
                  {selected?.prestation?.intitule ? `Prestation: ${selected.prestation.intitule}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Fermer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleContact} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Sujet</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ex. Discussion sur mon besoin"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Message</label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Bonjour, je souhaite échanger avec vous sur ce besoin..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selected || sending}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <FiSend className="h-4 w-4" />
                  {sending ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {providerProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setProviderProfile(null)}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Profil fournisseur</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {providerProfile.profile?.raison_sociale || providerProfile.username}
                </h3>
                <p className="text-sm text-slate-600">
                  {providerProfile.first_name || ''} {providerProfile.last_name || ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProviderProfile(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Fermer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Contact</p>
                <p className="mt-1 text-sm text-slate-800">{providerProfile.email || '—'}</p>
                <p className="text-sm text-slate-800">{providerProfile.telephone || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Réputation</p>
                <p className="mt-1 text-sm text-slate-800">Note : {providerProfile.profile?.note_moyenne ?? 0} / 5</p>
                <p className="text-sm text-slate-800">Services : {providerProfile.profile?.services_effectues ?? 0}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Expérience</p>
              <p className="mt-1 text-sm text-slate-800">
                {providerProfile.profile?.annees_experience ?? 0} an(s)
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Zones : {(providerProfile.profile?.zones_couverture || []).join(', ') || '—'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Services : {(providerProfile.profile?.types_services_offerts || []).join(', ') || '—'}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Prestations matchées pour ce besoin</p>
              <div className="mt-2 space-y-2">
                {(providerProfile.matched_prestations || []).map((p) => (
                  <div key={p.id} className="rounded-md bg-slate-50 px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">{p.intitule}</p>
                    <p className="text-xs text-slate-600">
                      {p.categorie || '—'} / {p.sous_categorie || '—'} - {formatMoneyFcfa(p.tarif_min)} a {formatMoneyFcfa(p.tarif_max)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default BesoinMatching;
