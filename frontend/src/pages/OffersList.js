import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiMapPin, FiDollarSign, FiStar, FiCalendar, FiClock, FiEye, FiHeart, FiShare2 } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const OffersList = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    service_type: '',
    price_min: '',
    price_max: '',
    experience_level: '',
    service_area: '',
    is_featured: false,
    is_verified: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0
  });

  useEffect(() => {
    fetchCategories();
    fetchOffers();
  }, [pagination.page, filters]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Ajouter le token seulement s'il existe
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/services/categories/', {
        headers: headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        page_size: pagination.pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`/api/services/offers/public/?${queryParams}`);
      const data = await response.json();
      
      setOffers(data.results || data);
      setPagination(prev => ({
        ...prev,
        total: data.count || data.length
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOffers();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getExperienceColor = (level) => {
    switch (level) {
      case 'beginner': return 'text-blue-600 bg-blue-100';
      case 'intermediate': return 'text-green-600 bg-green-100';
      case 'expert': return 'text-purple-600 bg-purple-100';
      case 'master': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getExperienceText = (level) => {
    switch (level) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'expert': return 'Expert';
      case 'master': return 'Maître';
      default: return level;
    }
  };

  const handleSaveOffer = async (offerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services/offers/${offerId}/save/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('Offre sauvegardée!');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleContactProvider = async (offerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services/offers/${offerId}/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: 'Bonjour, je suis intéressé par votre offre de service.'
        })
      });
      
      if (response.ok) {
        alert('Message envoyé!');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Offres de services</h1>
          <p className="text-gray-600 mt-1">Trouvez les meilleurs fournisseurs pour vos besoins</p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Rechercher une offre..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Toutes les catégories</option>
                  {Array.isArray(categories) && categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de service</label>
                <input
                  type="text"
                  name="service_type"
                  value={filters.service_type}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Transport"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone de service</label>
                <input
                  type="text"
                  name="service_area"
                  value={filters.service_area}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Ouagadougou"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix minimum</label>
                <input
                  type="number"
                  name="price_min"
                  value={filters.price_min}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix maximum</label>
                <input
                  type="number"
                  name="price_max"
                  value={filters.price_max}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="1000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau d'expérience</label>
                <select
                  name="experience_level"
                  value={filters.experience_level}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Tous les niveaux</option>
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="expert">Expert</option>
                  <option value="master">Maître</option>
                </select>
              </div>

              <div className="flex items-end space-x-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={filters.is_featured}
                    onChange={handleFilterChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">Mis en avant</label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_verified"
                    checked={filters.is_verified}
                    onChange={handleFilterChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">Vérifié</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <div className="flex items-center">
                  <FiFilter className="h-4 w-4 mr-2" />
                  Appliquer les filtres
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* Résultats */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            {pagination.total} offre{pagination.total > 1 ? 's' : ''} trouvée{pagination.total > 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des offres...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Array.isArray(offers) && offers.map(offer => (
                <div key={offer.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3">{offer.description}</p>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        {offer.is_featured && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            ⭐ Mis en avant
                          </span>
                        )}
                        {offer.is_verified && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            ✓ Vérifié
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(offer.status)}`}>
                          {offer.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>

                    {/* Info fournisseur */}
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{offer.provider_name || 'Fournisseur'}</p>
                        <div className="flex items-center">
                          <span className="mr-1">⭐</span>
                          <span className="text-sm text-gray-600">{offer.provider_rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMapPin className="h-4 w-4 mr-2" />
                        <span>{offer.service_areas?.slice(0, 2).join(', ') || 'Non spécifié'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FiDollarSign className="h-4 w-4 mr-2" />
                        <span>{offer.price_range_min} - {offer.price_range_max} XOF</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FiStar className="h-4 w-4 mr-2" />
                        <span className={`px-2 py-1 text-xs rounded-full ${getExperienceColor(offer.experience_level)}`}>
                          {getExperienceText(offer.experience_level)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleSaveOffer(offer.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Sauvegarder"
                      >
                        <FiHeart className="h-5 w-5" />
                      </button>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/offers/${offer.id}`}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          <div className="flex items-center">
                            <FiEye className="h-3 w-3 mr-1" />
                            Détails
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleContactProvider(offer.id)}
                          className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                        >
                          Contacter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {offers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
                <FiSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune offre trouvée</h3>
                <p className="text-gray-600">Essayez de modifier vos filtres de recherche</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                <span className="text-gray-600">
                  Page {pagination.page} sur {totalPages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                  disabled={pagination.page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OffersList;
