import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {FiUser, FiBriefcase, FiFileText, FiSearch, FiFilter, FiEdit, FiTrash2, FiEye, FiDollarSign, FiMapPin, FiCalendar, FiTag } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';

const ManageServices = () => {
  const { user } = useAuth();
  const [prestations, setPrestations] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('prestations');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('ManageServices - user:', user);
        
        // Utiliser le service admin pour récupérer les données
        const [prestationsData, demandesData] = await Promise.all([
          adminService.getAllPrestations(),
          adminService.getAllDemandes()
        ]);
        
        setPrestations(prestationsData.results || prestationsData);
        setDemandes(demandesData.results || demandesData);
        
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        setToast({
          message: 'Erreur lors du chargement des services',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.type_utilisateur === 'administrateur') {
      fetchData();
    }
  }, [user]);

  const handleDeletePrestation = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) {
      return;
    }

    try {
      await adminService.deletePrestation(id);
      setPrestations(prev => prev.filter(p => p.id !== id));
      setToast({
        message: 'Prestation supprimée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        message: 'Erreur lors de la suppression de la prestation',
        type: 'error'
      });
    }
  };

  const handleDeleteDemande = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      return;
    }

    try {
      await adminService.deleteDemande(id);
      setDemandes(prev => prev.filter(d => d.id !== id));
      setToast({
        message: 'Demande supprimée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        message: 'Erreur lors de la suppression de la demande',
        type: 'error'
      });
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'active': case 'ouverte': return 'bg-green-100 text-green-800';
      case 'inactive': case 'fermee': return 'bg-gray-100 text-gray-800';
      case 'pending': case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'terminee': return 'bg-purple-100 text-purple-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPrestations = prestations.filter(prestation => {
    const matchesSearch = 
      prestation.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestation.fournisseur_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return prestation.statut === 'active' && matchesSearch;
    if (filter === 'inactive') return prestation.statut === 'inactive' && matchesSearch;
    if (filter === 'pending') return prestation.statut === 'pending' && matchesSearch;
    
    return matchesSearch;
  });

  const filteredDemandes = demandes.filter(demande => {
    const matchesSearch = 
      demande.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.fournisseur_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'ouverte') return demande.statut === 'ouverte' && matchesSearch;
    if (filter === 'fermee') return demande.statut === 'fermee' && matchesSearch;
    if (filter === 'en_cours') return demande.statut === 'en_cours' && matchesSearch;
    
    return matchesSearch;
  });

  const stats = {
    totalPrestations: prestations.length,
    prestationsActives: prestations.filter(p => p.statut === 'active').length,
    totalDemandes: demandes.length,
    demandesOuvertes: demandes.filter(d => d.statut === 'ouverte').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Services</h1>
            <p className="text-gray-600 mt-1">Gérez toutes les prestations et demandes</p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full">
              <FiBriefcase className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Prestations</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalPrestations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full">
              <FiTag className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Prestations Actives</p>
              <p className="text-xl font-semibold text-gray-900">{stats.prestationsActives}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full">
              <FiFileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Demandes</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalDemandes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-full">
              <FiCalendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Demandes Ouvertes</p>
              <p className="text-xl font-semibold text-gray-900">{stats.demandesOuvertes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un service..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtre
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Tous les services</option>
              {activeTab === 'prestations' ? (
                <>
                  <option value="active">Prestations actives</option>
                  <option value="inactive">Prestations inactives</option>
                  <option value="pending">En attente</option>
                </>
              ) : (
                <>
                  <option value="ouverte">Demandes ouvertes</option>
                  <option value="fermee">Demandes fermées</option>
                  <option value="en_cours">En cours</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('prestations')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'prestations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Prestations ({prestations.length})
            </button>
            <button
              onClick={() => setActiveTab('demandes')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'demandes'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Demandes ({demandes.length})
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'prestations' ? (
            <div className="space-y-4">
              {filteredPrestations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    {prestations.length === 0 ? 'Aucune prestation trouvée' : 'Aucune prestation correspondant aux filtres'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPrestations.map((prestation) => (
                    <div key={prestation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{prestation.intitule}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prestation.statut)}`}>
                          {adminService.formatServiceStatus(prestation.statut)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{prestation.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <FiBriefcase className="h-4 w-4 mr-2" />
                          {prestation.type_prestation}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <FiDollarSign className="h-4 w-4 mr-2" />
                          {prestation.tarif_min && prestation.tarif_max ? 
                            `${prestation.tarif_min?.toLocaleString()} - ${prestation.tarif_max?.toLocaleString()} FCFA` :
                            prestation.tarif_min ? 
                              `${prestation.tarif_min?.toLocaleString()} FCFA` :
                              'Non spécifié'
                          }
                        </div>
                        <div className="flex items-center text-gray-500">
                          <FiUser className="h-4 w-4 mr-2" />
                          {prestation.fournisseur_nom || 'Non spécifié'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <Link
                          to={`/fournisseur/prestation/${prestation.id}`}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          Voir détails
                        </Link>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeletePrestation(prestation.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDemandes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    {demandes.length === 0 ? 'Aucune demande trouvée' : 'Aucune demande correspondant aux filtres'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDemandes.map((demande) => (
                    <div key={demande.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{demande.intitule}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(demande.statut)}`}>
                          {adminService.formatServiceStatus(demande.statut)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{demande.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <FiMapPin className="h-4 w-4 mr-2" />
                          {demande.lieu_intervention}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <FiDollarSign className="h-4 w-4 mr-2" />
                          {demande.budget ? `${demande.budget?.toLocaleString()} FCFA` : 'Budget non spécifié'}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <FiCalendar className="h-4 w-4 mr-2" />
                          Date limite: {adminService.formatDate(demande.date_limite)}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <FiUser className="h-4 w-4 mr-2" />
                          {demande.fournisseur_nom || 'Non spécifié'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <Link
                          to="/admin/besoins"
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          Liste publique des besoins
                        </Link>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteDemande(demande.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

export default ManageServices;
