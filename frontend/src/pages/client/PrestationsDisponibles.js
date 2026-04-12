import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiBriefcase, FiMapPin, FiDollarSign, FiCalendar, FiEye, FiMessageSquare, FiUser, FiStar, FiAlertCircle, FiChevronDown, FiTrendingUp, FiPhone, FiMail } from 'react-icons/fi';
import prestationsService from '../../services/prestationsService';
import categoriesService from '../../services/categoriesService';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/Toast';

const PrestationsDisponibles = () => {
  const { user } = useAuth();
  const [prestations, setPrestations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);
  const [selectedPrestation, setSelectedPrestation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les prestations et les catégories en parallèle
        const [prestationsData, categoriesData] = await Promise.all([
          prestationsService.getAllPrestations(),
          categoriesService.getAllCategories()
        ]);
        
        const prestationsList = prestationsData.results || prestationsData;
        const categoriesList = categoriesData.results || categoriesData;
        
        // Filtrer les prestations actives
        const prestationsActives = prestationsList.filter(prestation => 
          prestation.statut === 'active'
        );
        
        setPrestations(prestationsActives);
        setCategories(categoriesList);
      } catch (error) {
        console.error('Erreur lors du chargement des prestations:', error);
        setToast({
          message: 'Erreur lors du chargement des prestations',
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

  const getCategorieNom = (categorieId) => {
    const categorie = categories.find(c => c.id === categorieId);
    return categorie ? categorie.nom : 'Non spécifiée';
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAndSortedPrestations = prestations
    .filter(prestation => {
      const matchesSearch = 
        prestation.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.prestataire?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.type_prestation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || prestation.categorie?.id?.toString() === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'tarif_min':
          comparison = (a.tarif_min || 0) - (b.tarif_min || 0);
          break;
        case 'note':
          comparison = (a.note || 0) - (b.note || 0);
          break;
        case 'intitule':
          comparison = a.intitule?.localeCompare(b.intitule);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const stats = {
    total: filteredAndSortedPrestations.length,
    actives: filteredAndSortedPrestations.filter(p => p.statut === 'active').length,
    noteMoyenne: filteredAndSortedPrestations.length > 0 ? 
      (filteredAndSortedPrestations.reduce((acc, p) => acc + (p.note || 0), 0) / filteredAndSortedPrestations.length).toFixed(1) : 0,
    prestatairesUniques: new Set(filteredAndSortedPrestations.map(p => p.prestataire?.id)).size
  };

  const handleContact = async (prestationId) => {
    try {
      // Logique pour contacter le prestataire
      setToast({
        message: 'Fonctionnalité de contact à implémenter',
        type: 'info'
      });
    } catch (error) {
      console.error('Erreur lors du contact:', error);
      setToast({
        message: 'Erreur lors du contact',
        type: 'error'
      });
    }
  };

  const handleViewDetails = (prestation) => {
    setSelectedPrestation(prestation);
    setShowDetails(true);
  };

  const handleViewPrestataireProfile = (prestataireId) => {
    // Naviguer vers le profil du prestataire
    window.open(`/prestataire/profile/${prestataireId}`, '_blank');
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
            <h1 className="text-3xl font-bold text-gray-900">Prestations Disponibles</h1>
            <p className="text-gray-600 mt-2">Découvrez les prestations de services disponibles</p>
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
                placeholder="Rechercher une prestation ou un prestataire..."
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.nom}
                  </option>
                ))}
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
                <option value="tarif_min">Tarif</option>
                <option value="note">Note</option>
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
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <FiBriefcase className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Actives</p>
              <p className="text-3xl font-bold">{stats.actives}</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Note moyenne</p>
              <p className="text-3xl font-bold">{stats.noteMoyenne}</p>
            </div>
            <FiStar className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Prestataires</p>
              <p className="text-3xl font-bold">{stats.prestatairesUniques}</p>
            </div>
            <FiUser className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Tableau moderne */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {filteredAndSortedPrestations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune prestation trouvée</h3>
              <p className="text-gray-600">Essayez d'ajuster vos filtres de recherche</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Prestation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Prestataire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tarif
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedPrestations.map((prestation) => (
                  <tr key={prestation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {prestation.intitule}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiMapPin className="mr-1 h-3 w-3" />
                          {prestation.lieu_intervention || 'Non spécifié'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {prestation.prestataire?.nom || 'Non spécifié'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {prestation.type_prestation}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                          <FiBriefcase className="mr-2 h-4 w-4" />
                          {getCategorieNom(prestation.categorie)}
                        </div>
                        {prestation.type_prestation && (
                          <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {prestation.type_prestation}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {prestation.tarif_min && prestation.tarif_max ? 
                            `${prestation.tarif_min?.toLocaleString('fr-FR')} - ${prestation.tarif_max?.toLocaleString('fr-FR')} FCFA` :
                            prestation.tarif_min ? 
                              `${prestation.tarif_min?.toLocaleString('fr-FR')} FCFA` :
                              'Non spécifié'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FiStar className="mr-1 h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {prestation.note || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(prestation)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Voir les détails"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleContact(prestation.id)}
                          className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          title="Contacter"
                        >
                          <FiMessageSquare className="h-4 w-4" />
                        </button>
                        {prestation.prestataire && (
                          <button
                            onClick={() => handleViewPrestataireProfile(prestation.prestataire.id)}
                            className="inline-flex items-center px-3 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            title="Voir le profil du prestataire"
                          >
                            <FiUser className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetails && selectedPrestation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPrestation.intitule}</h2>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(selectedPrestation.statut)}`}>
                      {selectedPrestation.statut}
                    </span>
                    <div className="flex items-center">
                      <FiStar className="mr-1 h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium">{selectedPrestation.note || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedPrestation.description}</p>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations principales</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <FiMapPin className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Lieu:</span>
                        <span className="ml-2 font-medium">{selectedPrestation.lieu_intervention || 'Non spécifié'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Créée le:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedPrestation.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiDollarSign className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Tarif:</span>
                        <span className="ml-2 font-medium">
                          {selectedPrestation.tarif_min && selectedPrestation.tarif_max ? 
                            `${selectedPrestation.tarif_min?.toLocaleString('fr-FR')} - ${selectedPrestation.tarif_max?.toLocaleString('fr-FR')} FCFA` :
                            selectedPrestation.tarif_min ? 
                              `${selectedPrestation.tarif_min?.toLocaleString('fr-FR')} FCFA` :
                              'Non spécifié'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Catégorie et Type</h3>
                    <div className="space-y-2">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                        <FiBriefcase className="mr-2 h-4 w-4" />
                        {getCategorieNom(selectedPrestation.categorie)}
                      </div>
                      {selectedPrestation.type_prestation && (
                        <div className="text-sm text-gray-600">
                          Type: {selectedPrestation.type_prestation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prestataire */}
                {selectedPrestation.prestataire && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations du prestataire</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <FiUser className="w-6 h-6 text-gray-600" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{selectedPrestation.prestataire.nom}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <FiMail className="mr-1 h-3 w-3" />
                              {selectedPrestation.prestataire.email}
                            </div>
                            {selectedPrestation.prestataire.telephone && (
                              <div className="flex items-center mt-1 text-sm text-gray-600">
                                <FiPhone className="mr-1 h-3 w-3" />
                                {selectedPrestation.prestataire.telephone}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewPrestataireProfile(selectedPrestation.prestataire.id)}
                          className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <FiUser className="mr-2 h-4 w-4" />
                          Voir le profil
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleContact(selectedPrestation.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contacter
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

export default PrestationsDisponibles;
