import React, { useState, useEffect } from 'react';
import { FiPlus, FiBriefcase, FiStar, FiMapPin, FiClock, FiDollarSign, FiFilter } from 'react-icons/fi';

const Offers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    // Simuler des données d'offres
    setOffers([
      {
        id: 1,
        title: 'Transport national',
        provider: 'ServiceExpress SA',
        category: 'Transport',
        serviceType: 'Transport de marchandises',
        description: 'Service de transport fiable dans tout le Burkina Faso',
        serviceAreas: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou'],
        availability: 'Immédiate',
        experience: '5 ans',
        rating: 4.8,
        pricingModel: 'fixed',
        priceRangeMin: '100 000 FCFA',
        priceRangeMax: '500 000 FCFA',
        createdAt: '2024-01-10'
      },
      {
        id: 2,
        title: 'Développement web sur mesure',
        provider: 'TechSolutions',
        category: 'Informatique',
        serviceType: 'Développement web',
        description: 'Création de sites web modernes et applications personnalisées',
        serviceAreas: ['Ouagadougou', 'Bobo-Dioulasso'],
        availability: 'À partir de demain',
        experience: '8 ans',
        rating: 4.6,
        pricingModel: 'per_project',
        priceRangeMin: '200 000 FCFA',
        priceRangeMax: '1 000 000 FCFA',
        createdAt: '2024-01-10'
      }
    ]);
  }, []);

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || offer.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <header className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mes offres</h1>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <FiPlus className="h-5 w-5 mr-2" />
            Nouvelle offre
          </button>
        </div>
      </header>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Créer une nouvelle offre</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre de l'offre</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Transport de marchandises"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Transport">Transport</option>
                  <option value="Informatique">Informatique</option>
                  <option value="BTP">BTP</option>
                  <option value="Nettoyage">Nettoyage</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Décrivez votre offre en détail..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modèle de tarification</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                  <option value="fixed">Fixe</option>
                  <option value="hourly">À l'heure</option>
                  <option value="per_project">Par projet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix minimum</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: 100 000 FCFA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix maximum</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: 500 000 FCFA"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Créer l'offre
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Rechercher une offre..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Toutes catégories</option>
              <option value="Transport">Transport</option>
              <option value="Informatique">Informatique</option>
              <option value="BTP">BTP</option>
            </select>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
              <FiFilter className="h-4 w-4 mr-2" />
              Plus de filtres
            </button>
          </div>
        </div>
      </div>

      {/* Grille d'offres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map((offer) => (
          <div key={offer.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            {/* En-tête */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <FiStar className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">{offer.rating}</span>
                  </div>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {offer.availability}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {offer.createdAt}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-4 line-clamp-2">{offer.description}</p>

            {/* Détails */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <FiBriefcase className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Type:</span>
                <span className="ml-2">{offer.serviceType}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiMapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Zones:</span>
                <span className="ml-2">{offer.serviceAreas.join(', ')}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiClock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Expérience:</span>
                <span className="ml-2">{offer.experience}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiDollarSign className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Tarification:</span>
                <span className="ml-2 capitalize">{offer.pricingModel}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiDollarSign className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Prix:</span>
                <span className="ml-2 text-primary-600 font-semibold">
                  {offer.priceRangeMin} - {offer.priceRangeMax}
                </span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <button className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
                Modifier
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Offers;
