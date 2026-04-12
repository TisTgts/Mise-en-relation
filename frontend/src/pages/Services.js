import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiBriefcase, FiStar, FiMapPin } from 'react-icons/fi';

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [services, setServices] = useState([]);

  useEffect(() => {
    // Simuler des données de services
    setServices([
      {
        id: 1,
        title: 'Transport de marchandises',
        provider: 'ServiceExpress SA',
        category: 'Transport',
        location: 'Ouagadougou',
        rating: 4.8,
        description: 'Service de transport fiable et rapide pour toutes vos marchandises',
        price: 'À partir de 50 000 FCFA',
        availability: 'Immédiat',
        image: '🏗'
      },
      {
        id: 2,
        title: 'Développement web',
        provider: 'TechSolutions',
        category: 'Informatique',
        location: 'Bobo-Dioulasso',
        rating: 4.6,
        description: 'Création de sites web modernes et responsives',
        price: 'À partir de 200 000 FCFA',
        availability: 'Cette semaine',
        image: '💻'
      },
      {
        id: 3,
        title: 'Construction résidentielle',
        provider: 'Construction Plus',
        category: 'BTP',
        location: 'Koudougou',
        rating: 4.9,
        description: 'Construction de maisons et immeubles de qualité',
        price: 'Sur devis',
        availability: 'Cette semaine',
        image: '🏗'
      }
    ]);
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    const matchesLocation = !selectedLocation || service.location.toLowerCase().includes(selectedLocation.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-6">
      {/* Header avec recherche et filtres */}
      <header className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un service..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Toutes catégories</option>
            <option value="Transport">Transport</option>
            <option value="Informatique">Informatique</option>
            <option value="BTP">BTP</option>
            <option value="Nettoyage">Nettoyage</option>
            <option value="Sécurité">Sécurité</option>
          </select>
          
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">Toutes les villes</option>
            <option value="Ouagadougou">Ouagadougou</option>
            <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
            <option value="Koudougou">Koudougou</option>
            <option value="Banfora">Banfora</option>
            <option value="Kaya">Kaya</option>
          </select>
          
          <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center">
            <FiFilter className="h-5 w-5 mr-2" />
            Filtres avancés
          </button>
        </div>
      </header>

      {/* Grille de services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            {/* En-tête avec image et note */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{service.image}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      <FiStar className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">{service.rating}</span>
                    </div>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {service.availability}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>

            {/* Détails */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <FiBriefcase className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Prestataire:</span>
                <span className="ml-2">{service.provider}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiMapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Localisation:</span>
                <span className="ml-2">{service.location}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Catégorie:</span>
                <span className="ml-2">{service.category}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Prix:</span>
                <span className="ml-2 text-primary-600 font-semibold">{service.price}</span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <button className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
                Contacter
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Voir détails
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredServices.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <FiSearch className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun service trouvé</h3>
          <p className="text-gray-500">
            Essayez de modifier vos critères de recherche ou de filtres
          </p>
        </div>
      )}
    </div>
  );
};

export default Services;
