import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import prestationsService from '../../services/prestationsService';
import './PrestationsDisponibles.css';

const PrestationsDisponibles = () => {
  const navigate = useNavigate();
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    categorie: '',
    zone: ''
  });

  useEffect(() => {
    const fetchPrestations = async () => {
      try {
        const data = await prestationsService.getAllPublicPrestations();
        setPrestations(data.results || data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrestations();
  }, []);

  const handleContact = async (prestationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/services/transactions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prestation: prestationId
        }),
      });

      if (response.ok) {
        navigate('/client/transactions');
      }
    } catch (error) {
      console.error('Erreur lors de la prise de contact:', error);
    }
  };

  const filteredPrestations = prestations.filter(prestation => {
    const matchesSearch = prestation.intitule.toLowerCase().includes(filters.search.toLowerCase()) ||
                          prestation.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategorie = !filters.categorie || prestation.categorie?.nom === filters.categorie;
    const matchesZone = !filters.zone || prestation.zones_intervention?.includes(filters.zone);
    
    return matchesSearch && matchesCategorie && matchesZone;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Erreur:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Prestations disponibles</h1>
          
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Rechercher une prestation..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <select
              value={filters.categorie}
              onChange={(e) => setFilters(prev => ({ ...prev, categorie: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Toutes les catégories</option>
            </select>
            <select
              value={filters.zone}
              onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Toutes les zones</option>
            </select>
          </div>

          {filteredPrestations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Aucune prestation trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrestations.map((prestation) => (
                <div key={prestation.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{prestation.intitule}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      prestation.statut === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {prestation.statut}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{prestation.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Tarif:</span>
                      <span className="text-lg font-bold text-primary-600">
                        {prestation.tarif_min && prestation.tarif_max 
                          ? `${prestation.tarif_min} - ${prestation.tarif_max} FCFA`
                          : prestation.tarif_min 
                          ? `${prestation.tarif_min} FCFA`
                          : 'Sur devis'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Mode:</span>
                      <span className="text-sm font-medium">{prestation.mode_tarification}</span>
                    </div>
                    {prestation.categorie && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Catégorie:</span>
                        <span className="text-sm font-medium">{prestation.categorie.nom}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/client/prestations/${prestation.id}`)}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 text-sm"
                    >
                      Voir détails
                    </button>
                    <button
                      onClick={() => handleContact(prestation.id)}
                      className="flex-1 bg-primary-600 text-white px-3 py-2 rounded hover:bg-primary-700 text-sm"
                    >
                      Contacter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrestationsDisponibles;
