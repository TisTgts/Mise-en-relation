import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiTrash2, FiCalendar, FiMapPin, FiDollarSign, FiUser, FiTag, FiCheck, FiX } from 'react-icons/fi';
import prestationsService from '../../../services/prestationsService';
import Toast from '../../../components/Toast';
import { useConfirm } from '../../../contexts/ConfirmContext';

const PrestationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [prestation, setPrestation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchPrestation = async () => {
      try {
        setLoading(true);
        const data = await prestationsService.getPrestationById(id);
        setPrestation(data);
      } catch (err) {
        console.error('Erreur lors du chargement de la prestation:', err);
        setError('Impossible de charger les détails de la prestation');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPrestation();
    }
  }, [id]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Supprimer cette prestation ?',
      message: 'Cette action est irréversible.',
      tone: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      await prestationsService.deletePrestation(id);
      navigate('/fournisseur/dashboard');
      setToast({
        message: 'Prestation supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: 'Erreur lors de la suppression de la prestation',
        type: 'error',
      });
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const updatedPrestation = await prestationsService.updatePrestation(id, { statut: newStatus });
      setPrestation(updatedPrestation);
      setToast({
        message: `Statut mis à jour: ${getStatusText(newStatus)}`,
        type: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setToast({
        message: 'Erreur lors de la mise à jour du statut',
        type: 'error'
      });
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'terminee': return 'bg-purple-100 text-purple-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'annulee': return 'Annulée';
      default: return statut;
    }
  };

  const getTarificationText = (mode) => {
    switch (mode) {
      case 'fixe': return 'Tarif fixe';
      case 'horaire': return 'Tarif horaire';
      case 'forfait': return 'Forfait';
      case 'devis': return 'Sur devis';
      default: return mode;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error || !prestation) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-lg">{error || 'Prestation non trouvée'}</div>
              <Link
                to="/fournisseur/dashboard"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour aux prestations
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
                to="/fournisseur/dashboard"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{prestation.intitule}</h1>
                <p className="text-gray-600 mt-1">Détails de la prestation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(prestation.statut)}`}>
                {getStatusText(prestation.statut)}
              </span>
              <Link
                to={`/fournisseur/modifier-prestation/${prestation.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiEdit className="mr-2 h-4 w-4" />
                Modifier
              </Link>
              <button
                type="button"
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
              <p className="text-gray-700 whitespace-pre-wrap">{prestation.description}</p>
            </div>

            {/* Caractéristiques techniques */}
            {prestation.caracteristiques && Object.keys(prestation.caracteristiques).length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques techniques</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(prestation.caracteristiques).map(([key, value]) => (
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

            {/* Disponibilités et tarifs */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Disponibilités et tarifs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Période de disponibilité</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FiCalendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Début</p>
                        <p className="text-sm text-gray-600">
                          {prestation.disponibilite_debut ? 
                            new Date(prestation.disponibilite_debut).toLocaleDateString('fr-FR') : 
                            'Non spécifiée'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Fin</p>
                        <p className="text-sm text-gray-600">
                          {prestation.disponibilite_fin ? 
                            new Date(prestation.disponibilite_fin).toLocaleDateString('fr-FR') : 
                            'Non spécifiée'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Tarification</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FiDollarSign className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Mode</p>
                        <p className="text-sm text-gray-600">{getTarificationText(prestation.mode_tarification)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FiDollarSign className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Tarifs</p>
                        <p className="text-sm text-gray-600">
                          {prestation.tarif_min && prestation.tarif_max ? 
                            `${prestation.tarif_min.toLocaleString()} - ${prestation.tarif_max.toLocaleString()} FCFA` :
                            prestation.tarif_min ? 
                              `${prestation.tarif_min.toLocaleString()} FCFA` :
                              'Non spécifié'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zones d'intervention */}
            {prestation.zones_intervention && prestation.zones_intervention.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Zones d'intervention</h2>
                <div className="flex flex-wrap gap-2">
                  {prestation.zones_intervention.map((zone, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      <FiMapPin className="mr-1 h-3 w-3" />
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Catégorie et type */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Catégorie</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <FiTag className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{prestation.categorie?.nom || 'Non catégorisée'}</p>
                    <p className="text-sm text-gray-600">{prestation.type_prestation}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
              <div className="space-y-3">
                {prestation.statut === 'inactive' && (
                  <button
                    onClick={() => handleStatusUpdate('active')}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <FiCheck className="mr-2 h-4 w-4" />
                    Activer
                  </button>
                )}
                
                {prestation.statut === 'active' && (
                  <button
                    onClick={() => handleStatusUpdate('inactive')}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiX className="mr-2 h-4 w-4" />
                    Désactiver
                  </button>
                )}
                
                <Link
                  to={`/fournisseur/modifier-prestation/${prestation.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <FiEdit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </button>
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
                    <p className="text-sm text-gray-600">{prestation.fournisseur_nom}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Date de création</p>
                  <p className="text-sm text-gray-600">
                    {new Date(prestation.created_at).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(prestation.created_at).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                {prestation.updated_at !== prestation.created_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Dernière modification</p>
                    <p className="text-sm text-gray-600">
                      {new Date(prestation.updated_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(prestation.updated_at).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default PrestationDetail;
