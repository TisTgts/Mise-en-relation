import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiTrash2, FiCalendar, FiMapPin, FiDollarSign, FiClock, FiUser, FiTag } from 'react-icons/fi';
import demandesService from '../../../services/demandesService';

const BesoinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce besoin ? Cette action est irréversible.')) {
      try {
        await demandesService.deleteDemande(id);
        navigate('/client/mes-besoins');
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Impossible de supprimer le besoin');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/client/mes-besoins"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{besoin.intitule}</h1>
                <p className="text-gray-600 mt-1">Détail du besoin</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/client/besoins/${besoin.id}/edit`}
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
              <p className="text-gray-700 whitespace-pre-wrap">{besoin.description}</p>
            </div>

            {/* Exigences spécifiques */}
            {besoin.exigences && Object.keys(besoin.exigences).length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Exigences spécifiques</h2>
                <div className="space-y-3">
                  {Object.entries(besoin.exigences).map(([key, value]) => (
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
                    <p className="text-sm text-gray-600">{besoin.lieu_intervention}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date souhaitée</p>
                    <p className="text-sm text-gray-600">
                      {besoin.date_souhaitee ? 
                        new Date(besoin.date_souhaitee).toLocaleDateString('fr-FR') : 
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
                      {besoin.date_limite ? 
                        new Date(besoin.date_limite).toLocaleDateString('fr-FR') : 
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
                      {besoin.budget ? 
                        `${besoin.budget.toLocaleString()} FCFA${besoin.flexible ? ' (Flexible)' : ''}` : 
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
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(besoin.statut)}`}>
                    {getStatusText(besoin.statut)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Niveau d'urgence</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getUrgencyColor(besoin.urgence)}`}>
                    {getUrgencyText(besoin.urgence)}
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
                  <p className="text-sm font-medium text-gray-900">{besoin.categorie_nom || besoin.categorie?.nom || 'Non catégorisée'}</p>
                  <p className="text-sm text-gray-600">{besoin.type_service}</p>
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
                    <p className="text-sm font-medium text-gray-900">Client</p>
                    <p className="text-sm text-gray-600">{besoin.client_nom || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Date de création</p>
                  <p className="text-sm text-gray-600">
                    {new Date(besoin.created_at).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(besoin.created_at).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                {besoin.updated_at !== besoin.created_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Dernière modification</p>
                    <p className="text-sm text-gray-600">
                      {new Date(besoin.updated_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(besoin.updated_at).toLocaleTimeString('fr-FR')}
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

export default BesoinDetail;
