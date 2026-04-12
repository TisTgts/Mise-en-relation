import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiDollarSign, FiStar, FiTrendingUp, FiFilter, FiMapPin, FiClock, FiBriefcase, FiAlertCircle, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import prestationsService from '../../services/prestationsService';
import categoriesService from '../../services/categoriesService';
import Toast from '../../components/Toast';

const MesPrestations = () => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les prestations et les catégories en parallèle
        const [prestationsData, categoriesData] = await Promise.all([
          prestationsService.getMyPrestations(),
          categoriesService.getAllCategories()
        ]);
        
        const prestationsList = prestationsData.results || prestationsData;
        const categoriesList = categoriesData.results || categoriesData;
        
        setPrestations(prestationsList);
        setCategories(categoriesList);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setToast({
          message: 'Erreur lors du chargement des prestations',
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

  const handleDeletePrestation = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) {
      try {
        setLoading(true);
        await prestationsService.deletePrestation(id);
        
        setPrestations(prevPrestations => prevPrestations.filter(p => p.id !== id));
        
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
      } finally {
        setLoading(false);
      }
    }
  };

  const getCategorieNom = (categorieId) => {
    const categorie = categories.find(c => c.id === categorieId);
    return categorie ? categorie.nom : 'Non spécifiée';
  };

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
      case 'pending': return <FiClock className="w-4 h-4" />;
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

  const filteredAndSortedPrestations = prestations
    .filter(prestation => {
      const matchesSearch = 
        prestation.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.type_prestation?.toLowerCase().includes(searchTerm.toLowerCase());
      
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
    revenuTotal: filteredAndSortedPrestations.reduce((sum, p) => sum + (p.tarif_min || 0), 0)
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
            <h1 className="text-3xl font-bold text-gray-900">Mes Prestations</h1>
            <p className="text-gray-600 mt-2">Gérez vos offres de services</p>
          </div>
          <div className="mt-4 lg:mt-0">
            <Link
              to="/prestataire/creer-prestation"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              Créer une Prestation
            </Link>
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
                placeholder="Rechercher une prestation..."
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
              <p className="text-purple-100 text-sm">Revenu total</p>
              <p className="text-3xl font-bold">
                0 FCFA
                {/* {stats.revenuTotal.toLocaleString('fr-FR')}  */}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Tableau moderne */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {filteredAndSortedPrestations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {prestations.length === 0 ? 'Aucune prestation créée' : 'Aucune prestation trouvée'}
              </h3>
              <p className="text-gray-600">
                {prestations.length === 0 
                  ? 'Commencez par créer votre première offre de service' 
                  : 'Essayez d\'ajuster vos filtres de recherche'
                }
              </p>
            </div>
            {prestations.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/prestataire/creer-prestation"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-all duration-200"
                >
                  <FiPlus className="mr-2 h-5 w-5" />
                  Créer ma première prestation
                </Link>
              </div>
            )}
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
                      <div className="flex flex-col space-y-2">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
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
                        <Link
                          to={`/prestataire/prestation/${prestation.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Voir les détails"
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/prestataire/modifier-prestation/${prestation.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeletePrestation(prestation.id)}
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

export default MesPrestations;
