import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiTrash2, FiCalendar, FiMapPin, FiDollarSign, FiClock, FiUser, FiTag } from 'react-icons/fi';
import demandesService from '../../services/demandesService';

const DemandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        setLoading(true);
        const data = await demandesService.getDemandeById(id);
        setDemande(data);
      } catch (err) {
        console.error('Erreur lors du chargement de la demande:', err);
        setError('Impossible de charger les détails de la demande');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDemande();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.')) {
      try {
        await demandesService.deleteDemande(id);
        navigate('/fournisseur/mes-demandes');
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Impossible de supprimer la demande');
      }
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'ouverte': return 'bg-green-100 text-green-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'pourvue': return 'bg-purple-100 text-purple-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'ouverte': return 'Ouverte';
      case 'en_cours': return 'En cours';
      case 'pourvue': return 'Pourvue';
      case 'annulee': return 'Annulée';
      default: return statut;
    }
  };

  const getUrgencyColor = (urgence) => {
    switch (urgence) {
      case 'basse': return 'bg-gray-100 text-gray-800';
      case 'normale': return 'bg-blue-100 text-blue-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'urgente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyText = (urgence) => {
    switch (urgence) {
      case 'basse': return 'Basse';
      case 'normale': return 'Normale';
      case 'haute': return 'Haute';
      case 'urgente': return 'Urgente';
      default: return urgence;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !demande) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-lg">{error || 'Demande non trouvée'}</div>
              <Link
                to="/fournisseur/mes-demandes"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour aux demandes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/fournisseur/mes-demandes"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{demande.intitule}</h1>
                <p className="text-gray-600 mt-1">Détails de la demande</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/fournisseur/demandes/${demande.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiEdit className="mr-2 h-4 w-4" />
                Modifier
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <FiTrash2 className="mr-2 h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{demande.description}</p>
            </div>

            {/* Exigences spécifiques */}
            {demande.exigences && Object.keys(demande.exigences).length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Exigences spécifiques</h2>
                <div className="space-y-3">
                  {Object.entries(demande.exigences).map(([key, value]) => (
                    <div key={key} className="flex items-start">
                      <div className="flex-shrink-0">
                        <FiTag className="h-5 w-5 text-gray-400 mt-0.5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{key}</p>
                        <p className="text-sm text-gray-600">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caractéristiques techniques */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <FiMapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Lieu d'intervention</p>
                    <p className="text-sm text-gray-600">{demande.lieu_intervention}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date souhaitée</p>
                    <p className="text-sm text-gray-600">
                      {demande.date_souhaitee ? 
                        new Date(demande.date_souhaitee).toLocaleDateString('fr-FR') : 
                        'Non spécifiée'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiClock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date limite</p>
                    <p className="text-sm text-gray-600">
                      {demande.date_limite ? 
                        new Date(demande.date_limite).toLocaleDateString('fr-FR') : 
                        'Non spécifiée'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiDollarSign className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Budget</p>
                    <p className="text-sm text-gray-600">
                      {demande.budget ? 
                        `${demande.budget.toLocaleString()} FCFA${demande.flexible ? ' (Flexible)' : ''}` : 
                        'Non spécifié'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statut et urgence */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statut</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">État actuel</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(demande.statut)}`}>
                    {getStatusText(demande.statut)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Niveau d'urgence</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getUrgencyColor(demande.urgence)}`}>
                    {getUrgencyText(demande.urgence)}
                  </span>
                </div>
              </div>
            </div>

            {/* Catégorie */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Catégorie</h2>
              <div className="flex items-center">
                <FiTag className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{demande.categorie?.nom || 'Non catégorisée'}</p>
                  <p className="text-sm text-gray-600">{demande.type_service}</p>
                </div>
              </div>
            </div>

            {/* Informations système */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations système</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FiUser className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Créée par</p>
                    <p className="text-sm text-gray-600">{demande.fournisseur_nom}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Date de création</p>
                  <p className="text-sm text-gray-600">
                    {new Date(demande.created_at).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(demande.created_at).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                {demande.updated_at !== demande.created_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Dernière modification</p>
                    <p className="text-sm text-gray-600">
                      {new Date(demande.updated_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(demande.updated_at).toLocaleTimeString('fr-FR')}
                    </p>
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

export default DemandeDetail;
