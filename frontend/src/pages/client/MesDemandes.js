import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiFilter, FiDollarSign, FiMapPin, FiClock, FiBriefcase, FiAlertCircle, FiChevronDown, FiX, FiCheck } from 'react-icons/fi';
import demandesService from '../../services/demandesService';
import categoriesService from '../../services/categoriesService';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/Toast';

const MesDemandes = () => {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [demandeToDelete, setDemandeToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('MesDemandes - Début du chargement des données');
        
        // Récupérer les demandes et les catégories en parallèle
        const [demandesData, categoriesData] = await Promise.all([
          demandesService.getMyDemandes(),
          categoriesService.getAllCategories()
        ]);
        
        console.log('MesDemandes - Données brutes reçues:');
        console.log('  - demandesData:', demandesData);
        console.log('  - categoriesData:', categoriesData);
        
        const demandesList = demandesData.results || demandesData;
        const categoriesList = categoriesData.results || categoriesData;
        
        console.log('MesDemandes - Données traitées:');
        console.log('  - demandesList length:', demandesList?.length);
        console.log('  - categoriesList length:', categoriesList?.length);
        console.log('  - categoriesList:', categoriesList);
        
        setDemandes(demandesList);
        setCategories(categoriesList);
      } catch (error) {
        console.error('MesDemandes - Erreur lors du chargement des données:', error);
        setToast({
          message: 'Erreur lors du chargement des demandes',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.type_utilisateur === 'fournisseur') {
      fetchData();
    }
  }, [user]);

  // Vérifier si nous revenons d'une modification réussie
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modified = urlParams.get('modified');
    
    console.log('MesDemandes - URL params:', urlParams.toString());
    console.log('MesDemandes - modified param:', modified);
    
    if (modified === 'true') {
      console.log('MesDemandes - Affichage du message de succès');
      setToast({
        message: 'Demande modifiée avec succès',
        type: 'success'
      });
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const filteredAndSortedDemandes = demandes
    .filter(demande => {
      const matchesSearch = demande.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           demande.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || demande.categorie?.id?.toString() === selectedCategory;
      
      if (filter === 'all') return matchesSearch && matchesCategory;
      if (filter === 'ouverte') return demande.statut === 'ouverte' && matchesSearch && matchesCategory;
      if (filter === 'en_cours') return demande.statut === 'en_cours' && matchesSearch && matchesCategory;
      if (filter === 'terminee') return demande.statut === 'terminee' && matchesSearch && matchesCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'budget':
          comparison = (a.budget || 0) - (b.budget || 0);
          break;
        case 'intitule':
          comparison = a.intitule?.localeCompare(b.intitule);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const handleDelete = async (id) => {
    // Ouvrir la modal de confirmation
    const demande = demandes.find(d => d.id === id);
    setDemandeToDelete(demande);
    setShowDeleteModal(true);
  };

  const confirmDeleteDemande = async () => {
    if (!demandeToDelete) return;
    
    try {
      setLoading(true);
      await demandesService.deleteDemande(demandeToDelete.id);
      
      setDemandes(prevDemandes => prevDemandes.filter(d => d.id !== demandeToDelete.id));
      
      setToast({
        message: 'Demande supprimée avec succès',
        type: 'success'
      });
      
      // Fermer la modal
      setShowDeleteModal(false);
      setDemandeToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        message: 'Erreur lors de la suppression de la demande',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDemandeToDelete(null);
  };

  const handleEdit = (id) => {
    console.log('MesDemandes - handleEdit appelé avec ID:', id);
    
    // Afficher un message de confirmation immédiat
    setToast({
      message: 'Redirection vers la page de modification...',
      type: 'info'
    });
    
    console.log('MesDemandes - Toast affiché, redirection dans 800ms');
    
    // Rediriger après un petit délai pour permettre au toast de s'afficher
    setTimeout(() => {
      console.log('MesDemandes - Redirection vers:', `/fournisseur/demandes/${id}/edit`);
      window.location.href = `/fournisseur/demandes/${id}/edit`;
    }, 800);
  };

  // Fonction pour afficher un message de succès après modification
  const showEditSuccess = () => {
    setToast({
      message: 'Demande modifiée avec succès',
      type: 'success'
    });
  };

  // Fonction pour revenir après modification avec message de succès
  const returnFromEdit = (success = true) => {
    if (success) {
      window.location.href = '/fournisseur/mes-demandes?modified=true';
    } else {
      window.location.href = '/fournisseur/mes-demandes';
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'ouverte': return 'bg-green-100 text-green-800 border-green-200';
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminee': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'ouverte': return <FiAlertCircle className="w-4 h-4" />;
      case 'en_cours': return <FiClock className="w-4 h-4" />;
      case 'terminee': return <FiBriefcase className="w-4 h-4" />;
      default: return <FiAlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'ouverte': return 'Ouverte';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      default: return statut;
    }
  };

  const getUrgencyColor = (urgence) => {
    switch (urgence) {
      case 'haute': return 'text-red-600 bg-red-50';
      case 'normale': return 'text-yellow-600 bg-yellow-50';
      case 'basse': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Demandes</h1>
            <p className="text-gray-600 mt-2">Gérez vos demandes de services</p>
          </div>
          <div className="mt-4 lg:mt-0">
            <a
              href="/fournisseur/creer-demande"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              Nouvelle Demande
            </a>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiFilter className="inline mr-2 h-4 w-4" />
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une demande..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <FiFilter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Catégorie */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catégorie
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
              >
                <option value="">Toutes les catégories</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.nom}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {loading ? 'Chargement...' : 'Aucune catégorie disponible'}
                  </option>
                )}
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Statut */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Statut
            </label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
              >
                <option value="all">Toutes les demandes</option>
                <option value="ouverte">Ouvertes</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminées</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trier par
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
              >
                <option value="created_at">Date</option>
                <option value="budget">Budget</option>
                <option value="intitule">Nom</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Ordre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ordre
            </label>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
              >
                <option value="desc">Récent</option>
                <option value="asc">Ancien</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total</p>
              <p className="text-3xl font-bold">{filteredAndSortedDemandes.length}</p>
            </div>
            <FiBriefcase className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ouvertes</p>
              <p className="text-3xl font-bold">
                {filteredAndSortedDemandes.filter(d => d.statut === 'ouverte').length}
              </p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">En cours</p>
              <p className="text-3xl font-bold">
                {filteredAndSortedDemandes.filter(d => d.statut === 'en_cours').length}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Budget total</p>
              <p className="text-3xl font-bold">
                0
                {/* {filteredAndSortedDemandes.reduce((sum, d) => sum + (d.budget || 0), 0).toLocaleString('fr-FR')} */} FCFA
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Tableau moderne */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {filteredAndSortedDemandes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {demandes.length === 0 ? 'Aucune demande créée' : 'Aucune demande trouvée'}
              </h3>
              <p className="text-gray-600">
                {demandes.length === 0 
                  ? 'Commencez par créer votre première demande de service' 
                  : 'Essayez d\'ajuster vos filtres de recherche'
                }
              </p>
            </div>
            {demandes.length === 0 && (
              <div className="mt-6">
                <a
                  href="/fournisseur/creer-demande"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-all duration-200"
                >
                  <FiPlus className="mr-2 h-5 w-5" />
                  Créer ma première demande
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Demande
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Urgence
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date limite
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedDemandes.map((demande) => (
                  <tr key={demande.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {demande.intitule}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiMapPin className="mr-1 h-3 w-3" />
                          {demande.lieu_intervention}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                          {demande.categorie?.nom || 'Non définie'}
                        </div>
                        {demande.sous_categorie && (
                          <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {demande.sous_categorie}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {demande.budget?.toLocaleString() || 'N/A'} FCFA
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(demande.urgence)}`}>
                        {demande.urgence}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(demande.statut)}`}>
                          {getStatusIcon(demande.statut)}
                          <span className="ml-2">{getStatusText(demande.statut)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(demande.date_limite).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={`/fournisseur/demandes/${demande.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Voir les détails"
                        >
                          <FiEye className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleEdit(demande.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(demande.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal de confirmation de suppression */}
      {showDeleteModal && demandeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Confirmer la suppression</h2>
                  <p className="text-gray-600 mt-2">
                    Êtes-vous sûr de vouloir supprimer cette demande ?
                  </p>
                </div>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <FiTrash2 className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {demandeToDelete.intitule}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {demandeToDelete.description?.substring(0, 100)}
                      {demandeToDelete.description?.length > 100 && '...'}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Budget:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {demandeToDelete.budget?.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Lieu:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {demandeToDelete.lieu_intervention || 'Non spécifié'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Urgence:
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold border ${
                        demandeToDelete.urgence === 'haute' ? 'bg-red-100 text-red-800 border-red-200' :
                        demandeToDelete.urgence === 'moyenne' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        {demandeToDelete.urgence === 'haute' && '🔴 Haute'}
                        {demandeToDelete.urgence === 'moyenne' && '🟡 Moyenne'}
                        {demandeToDelete.urgence === 'basse' && '🟢 Basse'}
                        {(!demandeToDelete.urgence || demandeToDelete.urgence === 'basse') && '🟢 Basse'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Date limite:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {demandeToDelete.date_limite ? new Date(demandeToDelete.date_limite).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteDemande}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

export default MesDemandes;
