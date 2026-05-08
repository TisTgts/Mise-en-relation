import React, { useEffect, useState, useCallback } from 'react';
import { FiEye, FiTrash2, FiArrowLeft, FiX, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';

const ManageMatchingNeedDetails = () => {
  const { besoinId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [payload, setPayload] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [validatingMatchId, setValidatingMatchId] = useState(null);

  const orderedNeedIds = location.state?.orderedNeedIds || [];
  const currentIndexFromState = location.state?.currentIndex;
  const currentIndex = Number.isInteger(currentIndexFromState)
    ? currentIndexFromState
    : orderedNeedIds.findIndex((id) => String(id) === String(besoinId));
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < orderedNeedIds.length - 1;

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getMatchingForNeed(besoinId);
      setPayload(data);
    } catch {
      setToast({ message: 'Erreur lors du chargement des correspondances', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [besoinId]);

  useEffect(() => {
    loadDetails();
  }, [besoinId, loadDetails]);

  const viewProviderProfile = async (providerId) => {
    try {
      setActiveModal('provider');
      setLoadingProfile(true);
      const data = await adminService.getProviderProfileForAdmin(providerId);
      setProviderProfile(data);
    } catch {
      setToast({ message: 'Impossible de charger le profil fournisseur', type: 'error' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const removeScore = async (scoreId) => {
    if (!window.confirm('Supprimer cette correspondance ?')) return;
    try {
      await adminService.deleteMatchingScore(scoreId);
      setPayload((prev) => ({
        ...prev,
        count: Math.max(0, (prev?.count || 1) - 1),
        results: (prev?.results || []).filter((r) => r.score_id !== scoreId),
      }));
      setToast({ message: 'Correspondance supprimée', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const goToNeedByOffset = (offset) => {
    const nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= orderedNeedIds.length) return;
    const nextNeedId = orderedNeedIds[nextIndex];
    navigate(`/admin/correspondances/besoin/${nextNeedId}`, {
      state: {
        orderedNeedIds,
        currentIndex: nextIndex,
      },
    });
  };

  const validateCollaboration = async (row) => {
    if (!row?.prestation_id || !besoin?.id) return;
    if (!window.confirm('Valider cette correspondance et créer la collaboration ?')) return;
    try {
      setValidatingMatchId(row.score_id);
      const res = await adminService.validateCollaborationFromMatching(besoin.id, row.prestation_id);
      const createdTxId = res?.id || res?.transaction_id;
      setToast({
        message: `Collaboration validée (transaction #${createdTxId || 'créée'}).`,
        type: 'success',
      });
      if (createdTxId) {
        navigate(`/admin/collaborations/${createdTxId}/workspace`);
        return;
      }
      await loadDetails();
    } catch (e) {
      setToast({ message: e.message || 'Impossible de valider la collaboration', type: 'error' });
    } finally {
      setValidatingMatchId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const besoin = payload?.besoin || {};
  const rows = payload?.results || [];
  const scoreClass = (score) => {
    const n = Number(score || 0);
    if (n >= 80) return 'bg-emerald-100 text-emerald-700';
    if (n >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };
  const isWeightLikeKey = (key = '') => /poids|weight|ponderation/i.test(String(key));
  const humanizeKey = (key = '') =>
    String(key)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const normalizeWeight = (value) => {
    const n = toNumber(value);
    if (n === null) return null;
    // Respecte l'échelle native: 0..1 ou 0..100
    const scaleMax = n <= 1 ? 1 : 100;
    const clamped = Math.max(0, Math.min(scaleMax, n));
    const percent = scaleMax === 1 ? clamped * 100 : clamped;
    return { value: clamped, scaleMax, percent };
  };
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
    if (typeof value === 'object') return '-';
    return String(value);
  };
  const getMatchDetailSections = (details = {}) => {
    const general = [];
    const weights = [];
    const weightedBreakdown = [];
    const CRITERIA_LABELS = {
      competence: 'Compétence',
      geographie: 'Géographie',
      disponibilite: 'Disponibilité',
      fiabilite: 'Fiabilité',
      prix: 'Prix',
      abonnement: 'Abonnement',
    };

    const scoresObj = details?.scores && typeof details.scores === 'object' ? details.scores : null;
    const weightsObj = details?.weights && typeof details.weights === 'object' ? details.weights : null;
    if (scoresObj && weightsObj) {
      Object.keys(weightsObj).forEach((criterionKey) => {
        const weightValue = toNumber(weightsObj[criterionKey]);
        const criterionScore = toNumber(scoresObj[criterionKey]);
        if (weightValue === null || criterionScore === null) return;
        const maxPoints = weightValue * 100; // ex: 0.25 => 25 points max
        const obtainedPoints = (criterionScore / 100) * maxPoints; // ex: 90% de 10 => 9
        if (!Number.isFinite(maxPoints) || maxPoints <= 0) return;
        const clampedObtained = Math.max(0, Math.min(maxPoints, obtainedPoints));
        weightedBreakdown.push({
          key: criterionKey,
          label: CRITERIA_LABELS[criterionKey] || humanizeKey(criterionKey),
          score100: Math.max(0, Math.min(100, criterionScore)),
          weight100: maxPoints,
          obtained: clampedObtained,
          max: maxPoints,
          percent: (clampedObtained / maxPoints) * 100,
        });
      });
    }

    Object.entries(details || {}).forEach(([key, value]) => {
      if (key === 'weights' || key === 'scores') return;
      if (isWeightLikeKey(key) && value && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          const n = toNumber(subValue);
          if (n !== null) {
            weights.push({ key: humanizeKey(subKey), value: n });
          } else {
            general.push({ key: `${humanizeKey(key)} - ${humanizeKey(subKey)}`, value: formatValue(subValue) });
          }
        });
        return;
      }
      if (isWeightLikeKey(key)) {
        const n = toNumber(value);
        if (n !== null) {
          weights.push({ key: humanizeKey(key), value: n });
        } else {
          general.push({ key: humanizeKey(key), value: formatValue(value) });
        }
        return;
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          general.push({ key: `${humanizeKey(key)} - ${humanizeKey(subKey)}`, value: formatValue(subValue) });
        });
        return;
      }
      general.push({ key: humanizeKey(key), value: formatValue(value) });
    });
    return { general, weights, weightedBreakdown };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow rounded-xl p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/admin/correspondances')}
            className="inline-flex items-center text-sm text-blue-50 hover:text-white"
          >
            <FiArrowLeft className="mr-1" />
            Retour aux besoins
          </button>
          {orderedNeedIds.length > 1 && (
            <>
              <button
                onClick={() => goToNeedByOffset(-1)}
                disabled={!hasPrevious}
                className="px-2 py-1 text-xs rounded border border-white/40 bg-white/10 text-white disabled:opacity-50"
              >
                Besoin précédent
              </button>
              <button
                onClick={() => goToNeedByOffset(1)}
                disabled={!hasNext}
                className="px-2 py-1 text-xs rounded border border-white/40 bg-white/10 text-white disabled:opacity-50"
              >
                Besoin suivant
              </button>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold">{besoin.intitule}</h1>
        <p className="text-blue-100 mt-1">
          Client: {besoin.client_nom} | Ville: {besoin.lieu_intervention} | Statut: {besoin.statut}
        </p>
        <p className="text-sm text-blue-100 mt-1">
          Catégorie: {besoin.categorie || '-'} / {besoin.sous_categorie || '-'}
        </p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
        <p className="text-sm text-gray-600 mb-4">
          Correspondances trouvées: <span className="font-semibold">{rows.length}</span>
        </p>
        {rows.length === 0 && (
          <div className="mb-4 p-3 rounded-md bg-amber-50 text-amber-800 text-sm">
            Aucune correspondance disponible pour ce besoin.
          </div>
        )}
        <div className="max-h-96 overflow-auto border border-gray-200 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Prestation</th>
                <th className="px-3 py-2 text-left">Fournisseur</th>
                <th className="px-3 py-2 text-left">Score</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Correspondance</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.score_id} className="border-t border-gray-100 hover:bg-gray-50/70">
                  <td className="px-3 py-2">{r.prestation_titre}</td>
                  <td className="px-3 py-2 font-medium">{r.fournisseur?.username}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${scoreClass(r.score)}`}>
                      {r.score}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {r.calculated_at ? new Date(r.calculated_at).toLocaleString('fr-FR') : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => {
                        setSelectedMatch(r);
                        setActiveModal('match');
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <FiInfo className="mr-1" />
                      Voir détails
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewProviderProfile(r.fournisseur?.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiEye className="mr-1" />
                        Profil fournisseur
                      </button>
                      <button
                        onClick={() => validateCollaboration(r)}
                        disabled={validatingMatchId === r.score_id}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <FiCheckCircle className="mr-1" />
                        {validatingMatchId === r.score_id ? 'Validation...' : 'Valider collab'}
                      </button>
                      <button
                        onClick={() => removeScore(r.score_id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FiTrash2 className="mr-1" />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[85vh] overflow-auto border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                {activeModal === 'match' ? 'Détails de la correspondance' : 'Profil fournisseur'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                title="Fermer"
              >
                <FiX />
              </button>
            </div>

            <div className="p-5">
              {activeModal === 'match' && selectedMatch && (
                <div className="text-sm text-gray-700 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"><span className="font-semibold">Réf. correspondance:</span> {selectedMatch.score_id}</div>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"><span className="font-semibold">Prestation:</span> {selectedMatch.prestation_titre}</div>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                      <span className="font-semibold">Catégorie prestation:</span>{' '}
                      {[selectedMatch.prestation_categorie, selectedMatch.prestation_sous_categorie].filter(Boolean).join(' / ') || '-'}
                    </div>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"><span className="font-semibold">Fournisseur:</span> {selectedMatch.fournisseur?.username || '-'}</div>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-semibold">Score:</span>{' '}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${scoreClass(selectedMatch.score)}`}>
                        {selectedMatch.score}
                      </span>
                    </div>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                      <span className="font-semibold">Calculé le:</span>{' '}
                      {selectedMatch.calculated_at ? new Date(selectedMatch.calculated_at).toLocaleString('fr-FR') : '-'}
                    </div>
                  </div>

                  {(() => {
                    const { general, weights, weightedBreakdown } = getMatchDetailSections(selectedMatch.details || {});
                    return (
                      <div className="space-y-4">
                        {weightedBreakdown.length > 0 && (
                          <div>
                            <p className="font-semibold mb-2">Poids du matching (obtenu / maximum)</p>
                            <div className="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900">
                              <span className="font-semibold">Score global:</span> {Number(selectedMatch.score || 0).toFixed(2)} / 100
                              <span className="mx-2">|</span>
                              <span className="font-semibold">Somme des points critères:</span>{' '}
                              {weightedBreakdown.reduce((sum, i) => sum + i.obtained, 0).toFixed(2)} / 100
                            </div>
                            <div className="overflow-auto border border-gray-200 rounded-lg">
                              <table className="min-w-full text-xs">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Critère</th>
                                    <th className="px-3 py-2 text-left">Score critère</th>
                                    <th className="px-3 py-2 text-left">Poids max</th>
                                    <th className="px-3 py-2 text-left">Points obtenus</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {weightedBreakdown.map((item) => {
                                    const obtainedLabel = item.max <= 10
                                      ? item.obtained.toFixed(1).replace(/\.0$/, '')
                                      : item.obtained.toFixed(0);
                                    const maxLabel = item.max <= 10
                                      ? item.max.toFixed(1).replace(/\.0$/, '')
                                      : item.max.toFixed(0);
                                    return (
                                      <tr key={`${item.key}-${item.max}`} className="border-t border-gray-100">
                                        <td className="px-3 py-2 font-medium">{item.label}</td>
                                        <td className="px-3 py-2">{item.score100.toFixed(0)} / 100</td>
                                        <td className="px-3 py-2">{maxLabel}</td>
                                        <td className="px-3 py-2 font-semibold">{obtainedLabel}/{maxLabel}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {weightedBreakdown.length === 0 && weights.length > 0 && (
                          <div>
                            <p className="font-semibold mb-2">Poids du matching</p>
                            <div className="space-y-2">
                              {weights.map((item) => {
                                const normalized = normalizeWeight(item.value);
                                if (!normalized) return null;
                                const labelValue = normalized.scaleMax === 1
                                  ? normalized.value.toFixed(2)
                                  : normalized.value.toFixed(0);
                                return (
                                  <div key={`${item.key}-${item.value}`} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="font-medium">{item.key}</span>
                                      <span className="font-semibold">{labelValue} / {normalized.scaleMax}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="font-semibold mb-2">Détails de calcul</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {general.map((item) => (
                              <div key={`${item.key}-${item.value}`} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="font-medium">{item.key}:</span> {item.value}
                              </div>
                            ))}
                            {general.length === 0 && weights.length === 0 && (
                              <p className="text-gray-500">Aucun détail disponible.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeModal === 'provider' && (
                <>
                  {loadingProfile && <p className="text-sm text-gray-500">Chargement du profil...</p>}
                  {!loadingProfile && providerProfile && (
                    <div className="text-sm text-gray-700 space-y-2">
                      <p><span className="font-semibold">Username:</span> {providerProfile.username}</p>
                      <p><span className="font-semibold">Nom:</span> {providerProfile.first_name} {providerProfile.last_name}</p>
                      <p><span className="font-semibold">Email:</span> {providerProfile.email}</p>
                      <p><span className="font-semibold">Téléphone:</span> {providerProfile.telephone || '-'}</p>
                      <p><span className="font-semibold">Raison sociale:</span> {providerProfile.profile?.raison_sociale || '-'}</p>
                      <p><span className="font-semibold">Domaines:</span> {(providerProfile.profile?.types_services_offerts || []).join(', ') || '-'}</p>
                      <p><span className="font-semibold">Zones:</span> {(providerProfile.profile?.zones_couverture || []).join(', ') || '-'}</p>
                      <p>
                        <span className="font-semibold">Note:</span>{' '}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          {providerProfile.profile?.note_moyenne}
                        </span>
                        {' '}| <span className="font-semibold">Services:</span> {providerProfile.profile?.services_effectues}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ManageMatchingNeedDetails;
