import React, { useState, useEffect } from 'react';
import { FiPlus, FiUser, FiMapPin, FiClock, FiDollarSign, FiAlertCircle, FiFilter } from 'react-icons/fi';

const Needs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [needs, setNeeds] = useState([]);

  useEffect(() => {
    // Simuler des données de besoins
    setNeeds([
      {
        id: 1,
        title: 'Transport urgent de marchandises',
        clientProvider: 'Société de Distribution Alpha',
        category: 'Transport',
        serviceType: 'Transport de marchandises',
        description: 'Besoin de transport hebdomadaire pour produits alimentaires',
        requirements: {
          weight: '8 tonnes',
          volume: '15 m³',
          frequency: 'hebdomadaire'
        },
        serviceLocation: 'Ouagadougou → Bobo-Dioulasso',
        preferredDate: '2024-03-01',
        deadline: '2024-03-02',
        urgency: 'high',
        budget: '150 000 FCFA',
        isFlexible: true,
        postedDate: 'Il y a 2 heures'
      },
      {
        id: 2,
        title: 'Construction de 3 maisons',
        clientProvider: 'Entreprise Construction Beta',
        category: 'BTP',
        serviceType: 'Construction résidentielle',
        description: 'Construction de 3 maisons R+4 dans quartier résidentiel',
        requirements: {
          surface: '450 m²',
          materials: 'Fournis par client',
          duration: '6 mois'
        },
        serviceLocation: 'Ouagadougou, Zone 1',
        preferredDate: '2024-04-01',
        deadline: '2024-10-01',
        urgency: 'medium',
        budget: '15 000 000 FCFA',
        isFlexible: false,
        postedDate: 'Il y a 5 heures'
      },
      {
        id: 3,
        title: 'Application de gestion des stocks',
        clientProvider: 'Agro Industrie Gamma',
        category: 'Informatique',
        serviceType: 'Développement application',
        description: 'Application web pour la gestion des stocks et inventaires',
        requirements: {
          features: 'Gestion stocks, rapports, multi-utilisateurs',
          technology: 'React + Node.js',
          maintenance: '1 an inclus'
        },
        serviceLocation: 'Ouagadougou',
        preferredDate: '2024-03-15',
        deadline: '2024-05-15',
        urgency: 'urgent',
        budget: '2 500 000 FCFA',
        isFlexible: true,
        postedDate: 'Hier'
      }
    ]);
  }, []);

  const filteredNeeds = needs.filter(need => {
    const matchesSearch = need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.clientProvider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = !selectedUrgency || need.urgency === selectedUrgency;
    
    return matchesSearch && matchesUrgency;
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Normale';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <header className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Besoins des services</h1>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <FiPlus className="h-5 w-5 mr-2" />
            Nouveau besoin
          </button>
        </div>
      </header>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Publier un nouveau besoin</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre du besoin</label>
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
                  <option value="Sécurité">Sécurité</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Décrivez votre besoin en détail..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de service</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Ouagadougou, Zone 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date souhaitée</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: 100 000 FCFA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date limite</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgence</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="flexible"
                className="mr-2"
              />
              <label htmlFor="flexible" className="text-sm text-gray-700">
                Dates flexibles
              </label>
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
                Publier le besoin
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
              placeholder="Rechercher un besoin..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
            >
              <option value="">Toutes les urgences</option>
              <option value="urgent">Urgent</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
              <FiFilter className="h-4 w-4 mr-2" />
              Plus de filtres
            </button>
          </div>
        </div>
      </div>

      {/* Grille de besoins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNeeds.map((need) => (
          <div key={need.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            {/* En-tête avec urgence */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{need.title}</h3>
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2
                  ${getUrgencyColor(need.urgency)}
                `}>
                  <FiAlertCircle className="h-4 w-4 mr-1" />
                  {getUrgencyLabel(need.urgency)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {need.postedDate}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-4 line-clamp-2">{need.description}</p>

            {/* Détails */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <FiUser className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Fournisseur client:</span>
                <span className="ml-2">{need.clientProvider}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiMapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Lieu:</span>
                <span className="ml-2">{need.serviceLocation}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiClock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Date souhaitée:</span>
                <span className="ml-2">{need.preferredDate}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiClock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Date limite:</span>
                <span className="ml-2">{need.deadline}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <FiDollarSign className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">Budget:</span>
                <span className="ml-2 text-primary-600 font-semibold">{need.budget}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Flexibilité:</span>
                <span className="ml-2">
                  {need.isFlexible ? (
                    <span className="text-green-600">Oui</span>
                  ) : (
                    <span className="text-red-600">Non</span>
                  )}
                </span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <button className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
                Proposer mes services
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Voir détails
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredNeeds.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <FiFilter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun besoin trouvé</h3>
          <p className="text-gray-500">
            Essayez de modifier vos critères de recherche ou de filtres
          </p>
        </div>
      )}
    </div>
  );
};

export default Needs;
