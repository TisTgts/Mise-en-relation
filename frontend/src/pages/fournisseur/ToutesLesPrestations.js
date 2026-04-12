import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import prestationsService from '../../services/prestationsService';
import './ToutesLesPrestations.css';

const ToutesLesPrestations = () => {
  const navigate = useNavigate();
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleView = (id) => {
    navigate(`/client/prestations/${id}`);
  };

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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Toutes les prestations</h1>
          
          {prestations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Aucune prestation disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prestations.map((prestation) => (
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
                    {prestation.zones_intervention && prestation.zones_intervention.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500">Zones:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prestation.zones_intervention.map((zone, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded">
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleView(prestation.id)}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                  >
                    Voir détails
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToutesLesPrestations;
