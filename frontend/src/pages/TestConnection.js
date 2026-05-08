import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const TestConnection = () => {
  const [status, setStatus] = useState('Chargement...');
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [needs, setNeeds] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test 1: Connexion de base
      const response = await fetch(API_ENDPOINTS.SERVICES.CATEGORIES);
      const data = await response.json();
      setCategories(data);
      
      // Test 2: Récupérer les offres
      const offersResponse = await fetch('http://127.0.0.1:8000/api/services/offers/public/');
      const offersData = await offersResponse.json();
      setOffers(offersData);
      
      // Test 3: Récupérer les besoins
      const needsResponse = await fetch('http://127.0.0.1:8000/api/services/needs/public/');
      const needsData = await needsResponse.json();
      setNeeds(needsData);
      
      setStatus('✅ Connexion réussie avec le backend!');
    } catch (error) {
      setStatus(`❌ Erreur de connexion: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test de Connexion Frontend-Backend</h1>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Statut de la connexion</h2>
          <p className={`text-lg ${status.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {status}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Catégories ({categories.length})</h3>
            <div className="space-y-2">
              {categories.slice(0, 5).map(category => (
                <div key={category.id} className="text-sm text-gray-600">
                  • {category.name}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Offres ({offers.length})</h3>
            <div className="space-y-2">
              {offers.slice(0, 3).map(offer => (
                <div key={offer.id} className="text-sm text-gray-600">
                  • {offer.title}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Besoins ({needs.length})</h3>
            <div className="space-y-2">
              {needs.slice(0, 3).map(need => (
                <div key={need.id} className="text-sm text-gray-600">
                  • {need.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">URLs de test</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Backend: http://127.0.0.1:8000</p>
            <p>• API Categories: endpoint configuré dans API_ENDPOINTS.SERVICES.CATEGORIES</p>
            <p>• API Offers: /api/services/offers/public/</p>
            <p>• API Needs: /api/services/needs/public/</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Aller à la page de login
          </button>
          <button 
            onClick={testConnection}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;
