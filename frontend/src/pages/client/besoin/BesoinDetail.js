import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiTrash2, FiCalendar, FiMapPin, FiDollarSign, FiClock, FiUser, FiTag, FiSearch } from 'react-icons/fi';
import demandesService from '../../../services/demandesService';
import { useAuth } from '../../../contexts/AuthContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { clientCanSelfLaunchMatching } from '../../../utils/clientPremium';
import {
  formatMoneyFcfa,
  formatDateShort,
  besoinStatutPillClass,
  besoinStatutLabel,
  besoinStepsFromStatut,
  urgencePillClass,
  urgenceLabel,
} from '../clientUi';

const BesoinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const canLaunchMatching = clientCanSelfLaunchMatching(user);
  const [besoin, setBesoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBesoin = async () => {
      try {
        setLoading(true);
        const data = await demandesService.getDemandeById(id);
        setBesoin(data);
      } catch (err) {
        console.error('Erreur lors du chargement du besoin:', err);
        setError('Impossible de charger les détails du besoin');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBesoin();
    }
  }, [id]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Supprimer ce besoin ?',
      message: 'Cette action est irréversible.',
      tone: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      await demandesService.deleteDemande(id);
      navigate('/client/mes-besoins');
    } catch (err) {
      setError('Impossible de supprimer le besoin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error || !besoin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-lg">{error || 'Besoin non trouvé'}</div>
              <Link
                to="/client/mes-besoins"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour à mes besoins
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div>
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/client/mes-besoins"
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{besoin.intitule}</h1>
                <p className="mt-1 text-sm text-slate-600">Détail du besoin</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/client/besoins/${besoin.id}/matching`}
                className="inline-flex items-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <FiSearch className="mr-2 h-4 w-4" />
                {canLaunchMatching ? 'Matching' : 'Correspondances'}
              </Link>
              <Link
                to={`/client/besoins/${besoin.id}/edit`}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <FiEdit className="mr-2 h-4 w-4" />
                Modifier
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <FiTrash2 className="mr-2 h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Étapes du besoin</p>
          <div className="overflow-x-auto">
            <div className="flex min-w-max items-start">
              {besoinStepsFromStatut(besoin.statut).map((step, idx, arr) => (
                <React.Fragment key={step.key}>
                  <div className="flex w-36 flex-col items-center text-center">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        step.blocked
                          ? 'bg-rose-500'
                          : step.done
                            ? 'bg-emerald-500'
                            : step.current
                              ? 'bg-indigo-500'
                              : 'bg-slate-300'
                      }`}
                    />
                    <span
                      className={`mt-2 text-[11px] font-medium ${
                        step.blocked
                          ? 'text-rose-700'
                          : step.done
                            ? 'text-emerald-700'
                            : step.current
                              ? 'text-indigo-700'
                              : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 ? (
                    <div className={`mt-1 h-0.5 w-12 ${step.done ? 'bg-emerald-400' : step.current ? 'bg-indigo-300' : 'bg-slate-300'}`} />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </div>
          {besoin.statut === 'annulee' ? (
            <p className="mt-3 text-xs text-rose-700">Ce besoin a été annulé.</p>
          ) : null}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Description</h2>
              <p className="whitespace-pre-wrap text-slate-700">{besoin.description}</p>
            </div>

            {/* Exigences spécifiques */}
            {besoin.exigences && Object.keys(besoin.exigences).length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Exigences spécifiques</h2>
                <div className="space-y-3">
                  {Object.entries(besoin.exigences).map(([key, value]) => (
                    <div key={key} className="flex items-start">
                      <div className="flex-shrink-0">
                        <FiTag className="mt-0.5 h-5 w-5 text-slate-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">{key}</p>
                        <p className="text-sm text-slate-600">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caractéristiques techniques */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Caractéristiques</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <FiMapPin className="mr-3 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Lieu d'intervention</p>
                    <p className="text-sm text-slate-600">{besoin.lieu_intervention || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="mr-3 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Date souhaitée</p>
                    <p className="text-sm text-slate-600">{formatDateShort(besoin.date_souhaitee)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-3 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Date limite</p>
                    <p className="text-sm text-slate-600">{formatDateShort(besoin.date_limite)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiDollarSign className="mr-3 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Budget</p>
                    <p className="text-sm text-slate-600">
                      {besoin.budget ? `${formatMoneyFcfa(besoin.budget)}${besoin.flexible ? ' (Flexible)' : ''}` : 'Non spécifié'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statut et urgence */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Statut</h2>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">État actuel</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${besoinStatutPillClass(besoin.statut)}`}>
                    {besoinStatutLabel(besoin.statut)}
                  </span>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Niveau d'urgence</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${urgencePillClass(besoin.urgence)}`}>
                    {urgenceLabel(besoin.urgence)}
                  </span>
                </div>
              </div>
            </div>

            {/* Catégorie */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Catégorie</h2>
              <div className="flex items-center">
                <FiTag className="mr-3 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{besoin.categorie_nom || besoin.categorie?.nom || 'Non catégorisée'}</p>
                  <p className="text-sm text-slate-600">{besoin.type_service || '—'}</p>
                </div>
              </div>
            </div>

            {/* Informations système */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Informations système</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FiUser className="mr-3 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Client</p>
                    <p className="text-sm text-slate-600">{besoin.client_nom || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Date de création</p>
                  <p className="text-sm text-slate-600">{formatDateShort(besoin.created_at)}</p>
                </div>
                {besoin.updated_at !== besoin.created_at && (
                  <div>
                    <p className="text-sm font-medium text-slate-700">Dernière modification</p>
                    <p className="text-sm text-slate-600">{formatDateShort(besoin.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BesoinDetail;
