import React, { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiFilter, FiMapPin, FiBriefcase, FiAlertCircle, FiChevronDown, FiCalendar, FiUser, FiMail, FiPhone, FiStar, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import prestationsService from '../../services/prestationsService';
import categoriesService from '../../services/categoriesService';
import { Link } from 'react-router-dom';
import Toast from '../../components/Toast';

const ToutesLesPrestations = () => {
  const { user } = useAuth();
  const [prestations, setPrestations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);
  const [selectedPrestation, setSelectedPrestation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' ou 'prestations'
  const [expandedCategory, setExpandedCategory] = useState('all'); // 'all' pour tout montrer par défaut

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('ToutesLesPrestations - Début du chargement des données');
        
        // Récupérer toutes les prestations publiques et les catégories en parallèle
        const [prestationsData, categoriesData] = await Promise.all([
          prestationsService.getAllPublicPrestations(),
          categoriesService.getAllCategories()
        ]);
        
        console.log('ToutesLesPrestations - Données reçues:');
        console.log('  - prestationsData:', prestationsData);
        console.log('  - categoriesData:', categoriesData);
        
        const prestationsList = prestationsData.results || prestationsData;
        const categoriesList = categoriesData.results || categoriesData;
        
        console.log('ToutesLesPrestations - Données traitées:');
        console.log('  - prestationsList length:', prestationsList?.length);
        console.log('  - categoriesList length:', categoriesList?.length);
        
        setPrestations(prestationsList);
        setCategories(categoriesList);
      } catch (error) {
        console.error('ToutesLesPrestations - Erreur lors du chargement des données:', error);
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

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminee': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'active': return <FiBriefcase className="w-4 h-4" />;
      case 'inactive': return <FiAlertCircle className="w-4 h-4" />;
      case 'pending': return <FiAlertCircle className="w-4 h-4" />;
      case 'en_cours': return <FiTrendingUp className="w-4 h-4" />;
      case 'terminee': return <FiStar className="w-4 h-4" />;
      default: return <FiAlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      default: return statut;
    }
  };

  const getCategorieNom = (categorieId) => {
    const categorie = categories.find(c => c.id === categorieId);
    return categorie ? categorie.nom : 'Non spécifiée';
  };

  const filteredAndSortedPrestations = prestations
    .filter(prestation => {
      const matchesSearch = 
        prestation.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.type_prestation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.prestataire?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || prestation.categorie?.id?.toString() === selectedCategory;
      
      if (filter === 'all') return matchesSearch && matchesCategory;
      if (filter === 'active') return prestation.statut === 'active' && matchesSearch && matchesCategory;
      if (filter === 'inactive') return prestation.statut === 'inactive' && matchesSearch && matchesCategory;
      if (filter === 'pending') return prestation.statut === 'pending' && matchesSearch && matchesCategory;
      if (filter === 'en_cours') return prestation.statut === 'en_cours' && matchesSearch && matchesCategory;
      if (filter === 'terminee') return prestation.statut === 'terminee' && matchesSearch && matchesCategory;
      
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
          comparison = (a.prestataire_note || 0) - (b.prestataire_note || 0);
          break;
        case 'intitule':
          comparison = a.intitule?.localeCompare(b.intitule);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Regrouper les prestations par catégorie avec prestataires et leurs types
  const groupedByCategory = filteredAndSortedPrestations.reduce((acc, prestation) => {
    const categorieId = prestation.categorie?.id || 'non catégorisé';
    const categorieNom = prestation.categorie?.nom || 'Non catégorisé';
    
    if (!acc[categorieId]) {
      acc[categorieId] = {
        id: categorieId,
        nom: categorieNom,
        prestataires: new Map() // Pour éviter les doublons de prestataires
      };
    }
    
    // Ajouter le prestataire s'il n'est pas déjà dans cette catégorie
    if (!acc[categorieId].prestataires.has(prestation.prestataire?.id)) {
      acc[categorieId].prestataires.set(prestation.prestataire?.id, {
        id: prestation.prestataire?.id,
        username: prestation.prestataire?.username || prestation.prestataire?.nom || `Prestataire ${prestation.prestataire?.id}`,
        email: prestation.prestataire?.email,
        note: prestation.prestataire_note,
        types_prestations: new Set(), // Pour stocker les types de prestations
        prestations_list: [] // Liste complète des prestations
      });
    }
    
    // Ajouter le type de prestation et la prestation complète
    const prestataire = acc[categorieId].prestataires.get(prestation.prestataire?.id);
    if (prestataire && prestation.prestataire?.id) {
      prestataire.types_prestations.add(prestation.type_prestation);
      prestataire.prestations_list.push(prestation);
    }
    
    return acc;
  }, {});

  // Convertir en tableau pour le rendu
  const categoriesWithPrestataires = Object.values(groupedByCategory);

  const handleViewDetails = (prestation) => {
    setSelectedPrestation(prestation);
    setShowDetails(true);
  };

  const handleViewPrestataireProfile = (prestataireId) => {
    // Naviguer vers le profil du prestataire
    window.open(`/prestataire/profile/${prestataireId}`, '_blank');
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleViewPrestatairesInCategory = (categoryId) => {
    setExpandedCategory(categoryId);
  };

  // Fonction pour vérifier si une catégorie doit être affichée
  const shouldShowCategory = (categoryId) => {
    return expandedCategory === 'all' || expandedCategory === categoryId;
  };

  const renderStars = (note) => {
    // Convertir en nombre et gérer les cas invalides
    const numericNote = parseFloat(note);
    
    if (isNaN(numericNote) || numericNote === 0) {
      return (
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <FiStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
          ))}
          <span className="ml-2 text-sm text-gray-600">(Non noté)</span>
        </div>
      );
    }
    
    const fullStars = Math.floor(numericNote);
    const hasHalfStar = numericNote % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FiStar key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <FiStar key="half" className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FiStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="ml-2 text-sm text-gray-600">({numericNote.toFixed(1)})</span>
      </div>
    );
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
            <h1 className="text-3xl font-bold text-gray-900">Toutes les Prestations</h1>
            <p className="text-gray-600 mt-2">Découvrez toutes les offres de services disponibles</p>
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
                <option value="all">Toutes les prestations</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
                <option value="pending">En attente</option>
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
              <p className="text-3xl font-bold">{filteredAndSortedPrestations.length}</p>
            </div>
            <FiBriefcase className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Actives</p>
              <p className="text-3xl font-bold">
                {filteredAndSortedPrestations.filter(p => p.statut === 'active').length}
              </p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Note moyenne</p>
              <p className="text-3xl font-bold">
                {filteredAndSortedPrestations.length > 0 ? 
                  (filteredAndSortedPrestations.reduce((acc, p) => acc + (p.note || 0), 0) / filteredAndSortedPrestations.length).toFixed(1) : 0}
              </p>
            </div>
            <FiStar className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Prestataires</p>
              <p className="text-3xl font-bold">
                {new Set(filteredAndSortedPrestations.map(p => p.prestataire?.id)).size}
              </p>
            </div>
            <FiUser className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Vue par catégorie */}
      <div className="space-y-6">
        {/* Contrôle global pour développer/réduire tout */}
        <div className="bg-white shadow-lg rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {categoriesWithPrestataires.length} catégorie{categoriesWithPrestataires.length !== 1 ? 's' : ''} disponibles
              </h3>
              <p className="text-gray-600 text-sm">
                {new Set(filteredAndSortedPrestations.map(p => p.prestataire?.id)).size} prestataire{new Set(filteredAndSortedPrestations.map(p => p.prestataire?.id)).size !== 1 ? 's' : ''} au total
              </p>
            </div>
            <button
              onClick={() => setExpandedCategory(expandedCategory === 'all' ? null : 'all')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-medium flex items-center"
            >
              {expandedCategory === 'all' ? (
                <>
                  <FiChevronDown className="w-4 h-4 mr-2 rotate-180" />
                  Réduire tout
                </>
              ) : (
                <>
                  <FiChevronDown className="w-4 h-4 mr-2" />
                  Développer tout
                </>
              )}
            </button>
          </div>
        </div>

        {categoriesWithPrestataires.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-16 border border-gray-200 text-center">
            <div className="text-gray-500">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune prestation trouvée</h3>
              <p className="text-gray-600">Essayez d'ajuster vos filtres de recherche</p>
            </div>
          </div>
        ) : (
          categoriesWithPrestataires.map((category) => (
            <div key={category.id} className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
              {/* Header de la catégorie */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg">
                      <FiBriefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category.nom}</h2>
                      <p className="text-gray-600 text-sm mt-1">
                        {category.prestataires?.size || 0} prestataire{(category.prestataires?.size || 0) !== 1 ? 's' : ''} • 
                        {category.prestataires && Array.from(category.prestataires.values()).reduce((total, p) => total + (p.prestations_list?.length || 0), 0)} prestation{
                          category.prestataires && Array.from(category.prestataires.values()).reduce((total, p) => total + (p.prestations_list?.length || 0), 0) !== 1 ? 's' : ''
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      {shouldShowCategory(category.id) ? 'Développée' : 'Réduite'}
                    </span>
                    <button
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={shouldShowCategory(category.id) ? 'Réduire cette catégorie' : 'Développer cette catégorie'}
                    >
                      <FiChevronDown 
                        className={`w-5 h-5 text-gray-600 transition-transform ${
                          shouldShowCategory(category.id) ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Liste des prestataires de la catégorie avec leurs types de prestations */}
              <div className="p-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from(category.prestataires.values()).map((prestataire) => (
                    <div key={prestataire.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                      {/* Header du prestataire */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <FiUser className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{prestataire.username}</h3>
                            <p className="text-sm text-gray-600">{prestataire.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Prestations</div>
                          <div className="text-lg font-bold text-blue-600">{prestataire.prestations_list?.length || 0}</div>
                        </div>
                      </div>

                      {/* Note du prestataire */}
                      <div className="mb-4">
                        {prestataire.note ? (
                          renderStars(prestataire.note)
                        ) : (
                          <div className="flex items-center text-gray-500">
                            <FiStar className="w-4 h-4 mr-2" />
                            <span className="text-sm">Non noté</span>
                          </div>
                        )}
                      </div>

                      {/* Types de prestations */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Types de prestations:</h4>
                        <div className="flex flex-wrap gap-2">
                          {prestataire.types_prestations && typeof prestataire.types_prestations === 'object' && Array.from(prestataire.types_prestations).map((type, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                            >
                              <FiBriefcase className="mr-1.5 h-3 w-3" />
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewPrestataireProfile(prestataire.id)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-medium flex items-center justify-center"
                        >
                          <FiEye className="w-4 h-4 mr-2" />
                          Voir profil
                        </button>
                        <button
                          onClick={() => {
                            // Afficher les prestations de ce prestataire dans cette catégorie
                            console.log('Prestations de', prestataire.username, ':', prestataire.prestations_list || []);
                            console.log('Détails prestataire:', {
                              id: prestataire.id,
                              username: prestataire.username,
                              email: prestataire.email,
                              types_prestations: prestataire.types_prestations ? Array.from(prestataire.types_prestations) : [],
                              prestations_count: prestataire.prestations_list?.length || 0
                            });
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          title="Voir les prestations de ce prestataire"
                        >
                          <FiBriefcase className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Statistiques de la catégorie */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-blue-600">{category.prestataires?.size || 0}</span> prestataire{(category.prestataires?.size || 0) !== 1 ? 's' : ''} dans cette catégorie
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-green-600">
                          {category.prestataires && Array.from(category.prestataires.values()).reduce((total, p) => total + (p.prestations_list?.length || 0), 0)}
                        </span> prestation{
                          category.prestataires && Array.from(category.prestataires.values()).reduce((total, p) => total + (p.prestations_list?.length || 0), 0) !== 1 ? 's' : ''
                        } au total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
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
                    Statut
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
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(prestation.statut)}`}>
                          {getStatusIcon(prestation.statut)}
                          <span className="ml-2">{getStatusText(prestation.statut)}</span>
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
                        {prestation.prestataire && (
                          <button
                            onClick={() => handleViewPrestataireProfile(prestation.prestataire.id)}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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

      {/* Modal pour les détails de la prestation */}
      {showDetails && selectedPrestation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPrestation.intitule}</h2>
                <div className="flex items-center mt-2 space-x-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(selectedPrestation.statut)}`}>
                    {getStatusIcon(selectedPrestation.statut)}
                    <span className="ml-2">{getStatusText(selectedPrestation.statut)}</span>
                  </span>
                  <div className="flex items-center">
                    <FiStar className="mr-1 h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium">{selectedPrestation.prestataire_note || 'N/A'}</span>
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

            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Accédez au profil complet du prestataire
                </h3>
                <p className="text-gray-600 mb-4">
                  Pour voir toutes les informations et contacter le prestataire, cliquez sur le bouton ci-dessous
                </p>
                <button
                  onClick={() => {
                    handleViewPrestataireProfile(selectedPrestation.prestataire?.id);
                    setShowDetails(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                >
                  <FiUser className="inline mr-2" />
                  Voir le profil complet
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

export default ToutesLesPrestations;
