import React, { useState, useEffect } from 'react';
import { FiBriefcase, FiUsers, FiTrendingUp, FiClock, FiStar, FiDollarSign, FiMapPin, FiCalendar, FiAlertCircle, FiPlus, FiFilter, FiEye } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOffers: 0,
    activeOffers: 0,
    completedServices: 0,
    averageRating: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  const [recentOffers, setRecentOffers] = useState([]);
  const [matchingNeeds, setMatchingNeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer les statistiques
      const statsResponse = await fetch('/api/services/statistics/provider/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Récupérer les offres récentes
      const offersResponse = await fetch('/api/services/offers/my-offers/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        setRecentOffers(offersData.results || offersData.slice(0, 5));
      }

      // Récupérer les besoins correspondants
      const needsResponse = await fetch('/api/services/needs/matching/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (needsResponse.ok) {
        const needsData = await needsResponse.json();
        setMatchingNeeds(needsData.results || needsData.slice(0, 5));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (offerId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services/offers/${offerId}/update_status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Mettre à jour l'offre localement
        setRecentOffers(prev => 
          prev.map(offer => 
            offer.id === offerId ? { ...offer, status: newStatus } : offer
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Fournisseur</h1>
          <p className="text-gray-600 mt-1">Bienvenue {user?.first_name}, voici un aperçu de vos activités</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Offres actives</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeOffers}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.monthlyGrowth}% ce mois</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiBriefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Services complétés</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedServices}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.monthlyGrowth}% ce mois</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiUsers className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Note moyenne</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-green-600 mt-1">+0.2 cette semaine</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiStar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Revenus totaux</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalRevenue.toLocaleString()} XOF</p>
                <p className="text-xs text-green-600 mt-1">+{stats.monthlyGrowth}% ce mois</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiDollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button 
            onClick={() => window.location.href = '/dashboard/provider/create-offer'}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <FiPlus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nouvelle offre</h3>
              <p className="text-sm text-gray-600">Créer une offre de service</p>
            </div>
          </button>

          <button 
            onClick={() => window.location.href = '/offers'}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <FiFilter className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mes offres</h3>
              <p className="text-sm text-gray-600">Gérer toutes mes offres</p>
            </div>
          </button>

          <button 
            onClick={() => window.location.href = '/needs'}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <FiEye className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Besoins</h3>
              <p className="text-sm text-gray-600">Voir les besoins correspondants</p>
            </div>
          </button>

          <button 
            onClick={() => window.location.href = '/dashboard/provider/messages'}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <FiUsers className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
              <p className="text-sm text-gray-600">Voir les messages reçus</p>
            </div>
          </button>
        </div>

        {/* Offres récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Offres récentes</h2>
              <button 
                onClick={() => window.location.href = '/dashboard/provider/offers'}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Voir tout
              </button>
            </div>
            
            <div className="space-y-4">
              {Array.isArray(recentOffers) && recentOffers.length > 0 ? (
                recentOffers.map(offer => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{offer.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(offer.status)}`}>
                          {getStatusText(offer.status)}
                        </span>
                        {offer.is_featured && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            ⭐ Mis en avant
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-1" />
                          <span>{offer.service_areas?.slice(0, 2).join(', ') || 'Non spécifié'}</span>
                        </div>
                        <div className="flex items-center">
                          <FiDollarSign className="h-4 w-4 mr-1" />
                          <span>{offer.price_range_min} - {offer.price_range_max} XOF</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStatusChange(offer.id, offer.status === 'active' ? 'inactive' : 'active')}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          {offer.status === 'active' ? 'Désactiver' : 'Activer'}
                        </button>
                        <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                          Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiBriefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>Aucune offre récente</p>
                </div>
              )}
            </div>
          </div>

          {/* Besoins correspondants */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Besoins correspondants</h2>
              <button 
                onClick={() => window.location.href = '/needs'}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Voir tout
              </button>
            </div>
            
            <div className="space-y-4">
              {Array.isArray(matchingNeeds) && matchingNeeds.length > 0 ? (
                matchingNeeds.map(need => (
                  <div key={need.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{need.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{need.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(need.urgency)}`}>
                          {need.urgency_display || need.urgency}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {need.response_count || 0} réponses
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 mr-1" />
                          <span>{need.service_area || 'Non spécifié'}</span>
                        </div>
                        <div className="flex items-center">
                          <FiDollarSign className="h-4 w-4 mr-1" />
                          <span>{need.budget?.toLocaleString() || 'N/A'} XOF</span>
                        </div>
                        <div className="flex items-center">
                          <FiClock className="h-4 w-4 mr-1" />
                          <span>{need.days_remaining > 0 ? `${need.days_remaining} jours` : 'Expiré'}</span>
                        </div>
                      </div>
                      
                      <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                        Répondre
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>Aucun besoin correspondant</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
