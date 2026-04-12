import React, { useState, useEffect } from 'react';
import { FiSearch, FiBriefcase, FiDollarSign, FiClock, FiAlertCircle, FiPlus, FiFilter, FiMapPin, FiCalendar, FiTrendingUp, FiUsers, FiEye } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalNeeds: 0,
    activeNeeds: 0,
    completedNeeds: 0,
    totalSpent: 0,
    averageMonthlyRequests: 0,
    pendingContracts: 0
  });
  const [recentNeeds, setRecentNeeds] = useState([]);
  const [matchingOffers, setMatchingOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer les statistiques
      const statsResponse = await fetch('/api/services/statistics/client/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Récupérer les besoins récents
      const needsResponse = await fetch('/api/services/needs/my-needs/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (needsResponse.ok) {
        const needsData = await needsResponse.json();
        setRecentNeeds(needsData.results || needsData.slice(0, 5));
      }

      // Récupérer les offres correspondantes
      const offersResponse = await fetch('/api/services/offers/matching/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        setMatchingOffers(offersData.results || offersData.slice(0, 5));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (needId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services/needs/${needId}/update_status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Mettre à jour le besoin localement
        setRecentNeeds(prev => 
          prev.map(need => 
            need.id === needId ? { ...need, status: newStatus } : need
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'closed': return 'Fermé';
      case 'in_progress': return 'En cours';
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

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    
    if (hasHalfStar) {
      stars.push('⭐');
    }
    
    return stars.join('');
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
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Client</h1>
          <p className="text-gray-600 mt-1">Bienvenue {user?.first_name}, voici un aperçu de vos activités</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Besoins actifs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeNeeds}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.averageMonthlyRequests}% ce mois</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiBriefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Contrats en attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingContracts}</p>
                <p className="text-xs text-green-600 mt-1">+2 cette semaine</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiAlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total dépensé</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalSpent.toLocaleString()} XOF</p>
                <p className="text-xs text-green-600 mt-1">+{stats.averageMonthlyRequests}% ce mois</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiDollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Besoins complétés</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completedNeeds}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.averageMonthlyRequests}% ce mois</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiTrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button 
            onClick={() => window.location.href = '/dashboard/client/create-need'}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <FiPlus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nouveau besoin</h3>
              <p className="text-sm text-gray-600">Publier un besoin de service</p>
            </div>
          </button>

          <button 
            onClick={() => window.location.href = '/needs'}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <FiFilter className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mes besoins</h3>
              <p className="text-sm text-gray-600">Gérer tous mes besoins</p>
            </div>
          </button>

          <button 
            onClick={() => window.location.href = '/offers'}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <FiEye className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Offres</h3>
              <p className="text-sm text-gray-600">Voir les offres disponibles</p>
            </div>
          </button>

          <button 
            onClick={() => window.location.href = '/dashboard/client/messages'}
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

        {/* Besoins récents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Besoins récents</h2>
              <button 
                onClick={() => window.location.href = '/dashboard/client/needs'}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Voir tout
              </button>
            </div>
            
            <div className="space-y-4">
              {Array.isArray(recentNeeds) && recentNeeds.length > 0 ? (
                recentNeeds.map(need => (
                  <div key={need.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{need.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{need.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(need.status)}`}>
                          {getStatusText(need.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(need.urgency)}`}>
                          {need.urgency_display || need.urgency}
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
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStatusChange(need.id, need.status === 'open' ? 'closed' : 'open')}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          {need.status === 'open' ? 'Fermer' : 'Rouvrir'}
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
                  <p>Aucun besoin récent</p>
                </div>
              )}
            </div>
          </div>

          {/* Offres correspondantes */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Offres correspondantes</h2>
              <button 
                onClick={() => window.location.href = '/offers'}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Voir tout
              </button>
            </div>
            
            <div className="space-y-4">
              {Array.isArray(matchingOffers) && matchingOffers.length > 0 ? (
                matchingOffers.map(offer => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{offer.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${offer.status === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                          {offer.status === 'active' ? 'Actif' : 'Inactif'}
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
                        <div className="flex items-center">
                          <span className="mr-1">⭐</span>
                          <span>{offer.provider_rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                          Contacter
                        </button>
                        <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          Voir détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>Aucune offre correspondante</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
