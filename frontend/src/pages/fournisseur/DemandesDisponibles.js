import React, { useState, useEffect } from 'react';
import { FiFilter, FiCalendar, FiMapPin, FiDollarSign, FiUser, FiTag, FiSearch, FiBriefcase, FiAlertCircle, FiChevronDown, FiClock, FiEye, FiMail, FiPhone } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import demandesService from '../../services/demandesService';
import categoriesService from '../../services/categoriesService';
import Toast from '../../components/Toast';

const DemandesDisponibles = () => {
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
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer toutes les demandes et les catégories en parallèle
        const [demandesData, categoriesData] = await Promise.all([
          demandesService.getAllDemandes(),
          categoriesService.getAllCategories()
        ]);
        
        const demandesList = demandesData.results || demandesData;
        const categoriesList = categoriesData.results || categoriesData;
        
        // Filtrer les demandes actives (statut 'ouverte')
        const demandesActives = demandesList.filter(demande => 
          demande.statut === 'ouverte'
        );
        
        setDemandes(demandesActives);
        setCategories(categoriesList);
      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        setToast({
          message: 'Erreur lors du chargement des demandes',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.type_utilisateur === 'prestataire') {
      fetchData();
    }
  }, [user]);

  const handlePostuler = async (demandeId) => {
    try {
      // Logique pour postuler à une demande
      setToast({
        message: 'Fonctionnalité de postulation à implémenter',
        type: 'info'
      });
    } catch (error) {
      console.error('Erreur lors de la postulation:', error);
      setToast({
        message: 'Erreur lors de la postulation',
        type: 'error'
      });
    }
  };

  const getCategorieNom = (categorieId) => {
    const categorie = categories.find(c => c.id === categorieId);
    return categorie ? categorie.nom : 'Non spécifiée';
  };

  const getUrgencyColor = (urgence) => {
    switch (urgence) {
      case 'basse': return 'text-green-600 bg-green-50';
      case 'moyenne': return 'text-yellow-600 bg-yellow-50';
      case 'haute': return 'text-orange-600 bg-orange-50';
      case 'urgente': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredAndSortedDemandes = demandes
    .filter(demande => {
      const matchesSearch = 
        demande.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demande.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demande.lieu_intervention?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || demande.categorie?.id?.toString() === selectedCategory;
      
      if (filter === 'all') return matchesSearch && matchesCategory;
      if (filter === 'recentes') {
        const dateLimite = new Date(demande.date_limite);
        const aujourdHui = new Date();
        const diffJours = Math.ceil((dateLimite - aujourdHui) / (1000 * 60 * 60 * 24));
        return diffJours <= 7 && matchesSearch && matchesCategory;
      }
      if (filter === 'urgentes') return (demande.urgence === 'urgente' || demande.urgence === 'haute') && matchesSearch && matchesCategory;
      
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
        case 'date_limite':
          comparison = new Date(a.date_limite) - new Date(b.date_limite);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const stats = {
    total: filteredAndSortedDemandes.length,
    recentes: filteredAndSortedDemandes.filter(d => {
      const dateLimite = new Date(d.date_limite);
      const aujourdHui = new Date();
      const diffJours = Math.ceil((dateLimite - aujourdHui) / (1000 * 60 * 60 * 24));
      return diffJours <= 7;
    }).length,
    urgentes: filteredAndSortedDemandes.filter(d => d.urgence === 'urgente' || d.urgence === 'haute').length,
    budgetTotal: filteredAndSortedDemandes.reduce((sum, d) => sum + (d.budget || 0), 0)
  };

  const handleViewDetails = (demande) => {
    setSelectedDemande(demande);
    setShowDetails(true);
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
            <h1 className="text-3xl font-bold text-gray-900">Demandes Disponibles</h1>
            <p className="text-gray-600 mt-2">Consultez les demandes de services en vigueur</p>
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.nom}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Filtre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filtre
            </label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
              >
                <option value="all">Toutes les demandes</option>
                <option value="recentes">Récentes (≤ 7 jours)</option>
                <option value="urgentes">Urgentes</option>
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
                <option value="date_limite">Date limite</option>
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
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Récentes</p>
              <p className="text-3xl font-bold">{stats.recentes}</p>
            </div>
            <FiCalendar className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Urgentes</p>
              <p className="text-3xl font-bold">{stats.urgentes}</p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Budget total</p>
              <p className="text-3xl font-bold">
                {stats.budgetTotal.toLocaleString('fr-FR')} FCFA
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune demande trouvée</h3>
              <p className="text-gray-600">Essayez d'ajuster vos filtres de recherche</p>
            </div>
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
                          <FiBriefcase className="mr-2 h-4 w-4" />
                          {getCategorieNom(demande.categorie)}
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
                          {demande.budget?.toLocaleString('fr-FR') || 'N/A'} FCFA
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(demande.urgence)}`}>
                        {demande.urgence}
                      </span>
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
                        <button
                          onClick={() => handleViewDetails(demande)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Voir les détails"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePostuler(demande.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Postuler"
                        >
                          Postuler
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

      {/* Modal Détails */}
      {showDetails && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDemande.intitule}</h2>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(selectedDemande.urgence)}`}>
                      {selectedDemande.urgence}
                    </span>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                      <FiBriefcase className="mr-2 h-4 w-4" />
                      {getCategorieNom(selectedDemande.categorie)}
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
                  <p className="text-gray-600">{selectedDemande.description}</p>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations principales</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <FiMapPin className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Lieu:</span>
                        <span className="ml-2 font-medium">{selectedDemande.lieu_intervention}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Date limite:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedDemande.date_limite).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiDollarSign className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Budget:</span>
                        <span className="ml-2 font-medium">
                          {selectedDemande.budget?.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Catégorie</h3>
                    <div className="space-y-2">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                        <FiBriefcase className="mr-2 h-4 w-4" />
                        {getCategorieNom(selectedDemande.categorie)}
                      </div>
                      {selectedDemande.sous_categorie && (
                        <div className="text-sm text-gray-600">
                          Sous-catégorie: {selectedDemande.sous_categorie}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exigences */}
                {selectedDemande.exigences && selectedDemande.exigences.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Exigences principales</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDemande.exigences.map((exigence, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                        >
                          {exigence}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client */}
                {selectedDemande.client && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations du client</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <FiUser className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedDemande.client.nom}</p>
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <FiMail className="mr-1 h-3 w-3" />
                            {selectedDemande.client.email}
                          </div>
                          {selectedDemande.client.telephone && (
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <FiPhone className="mr-1 h-3 w-3" />
                              {selectedDemande.client.telephone}
                            </div>
                          )}
                        </div>
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
                  onClick={() => handlePostuler(selectedDemande.id)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Postuler
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

export default DemandesDisponibles;
