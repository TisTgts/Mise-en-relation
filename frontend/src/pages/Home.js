import React, { useState, useEffect } from 'react';
import { FiSearch, FiBriefcase, FiUsers, FiTrendingUp, FiMapPin, FiDollarSign, FiStar, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalOffers: 0,
    totalNeeds: 0,
    activeProviders: 0,
    satisfiedClients: 0
  });
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [urgentNeeds, setUrgentNeeds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
    fetchCategories();
  }, []);

  const fetchHomeData = async () => {
    try {
      // Récupérer les statistiques
      const statsResponse = await fetch('/api/services/statistics/public/');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Récupérer les offres en vedette
      const offersResponse = await fetch('/api/services/offers/featured/');
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        setFeaturedOffers(offersData.results || offersData.slice(0, 6));
      }

      // Récupérer les besoins urgents
      const needsResponse = await fetch('/api/services/needs/urgent/');
      if (needsResponse.ok) {
        const needsData = await needsResponse.json();
        setUrgentNeeds(needsData.results || needsData.slice(0, 6));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Endpoint public : ne pas envoyer de Bearer (évite 401 si vieux jeton dans le stockage)
      const response = await fetch('/api/services/categories/', {
        headers: { 'Content-Type': 'application/json' }
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

  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = e.target.search.value;
    navigate(`/services${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`);
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

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return urgency;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              La plateforme de mise en relation
              <br />
              <span className="text-primary-200">de services au Burkina Faso</span>
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Connectez les meilleurs fournisseurs avec les clients qui ont besoin de vos services
            </p>
            
            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <FiSearch className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Rechercher un service, un fournisseur..."
                  className="w-full pl-12 pr-32 py-4 text-lg rounded-lg border-0 focus:ring-4 focus:ring-primary-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-6 py-2 bg-white text-primary-600 rounded-md font-semibold hover:bg-primary-50 transition-colors"
                >
                  Rechercher
                </button>
              </div>
            </form>

            {/* Boutons d'action */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                  >
                    S'inscrire
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                  >
                    Se connecter
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard/provider/create-offer"
                    className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <FiBriefcase className="h-5 w-5 mr-2" />
                      Créer une offre
                    </div>
                  </Link>
                  <Link
                    to="/client/creer-demande"
                    className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center">
                      <FiUsers className="h-5 w-5 mr-2" />
                      Publier un besoin
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Chiffres clés
            </h2>
            <p className="text-lg text-gray-600">
              Une plateforme dynamique au service de l'économie locale
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBriefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalOffers}</h3>
              <p className="text-gray-600">Offres actives</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalNeeds}</h3>
              <p className="text-gray-600">Besoins publiés</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.activeProviders}</h3>
              <p className="text-gray-600">Fournisseurs actifs</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.satisfiedClients}</h3>
              <p className="text-gray-600">Clients satisfaits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Offres en vedette */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Offres en vedette</h2>
            <Link
              to="/services"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              Voir toutes les offres
              <FiArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(featuredOffers) && featuredOffers.map(offer => (
              <div key={offer.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{offer.title}</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    ⭐ En vedette
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{offer.description}</p>
                
                <div className="space-y-2 mb-4">
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
                
                <Link
                  to="/services"
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
                >
                  Voir détails
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Besoins urgents */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Besoins urgents</h2>
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              Voir tous les besoins
              <FiArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(urgentNeeds) && urgentNeeds.map(need => (
              <div key={need.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{need.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(need.urgency)}`}>
                    {getUrgencyText(need.urgency)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{need.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMapPin className="h-4 w-4 mr-2" />
                    <span>{need.service_area || 'Non spécifié'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FiDollarSign className="h-4 w-4 mr-2" />
                    <span>{need.budget?.toLocaleString() || 'N/A'} XOF</span>
                  </div>
                </div>
                
                <Link
                  to="/login"
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
                >
                  Répondre au besoin
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Rejoignez des milliers de fournisseurs et clients qui font confiance à notre plateforme
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              S'inscrire gratuitement
            </Link>
            <Link
              to="/services"
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Explorer les offres
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
