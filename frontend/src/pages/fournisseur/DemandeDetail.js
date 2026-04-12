import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import demandesService from '../../services/demandesService';
import prestationsService from '../../services/prestationsService';
import './DemandeDetail.css';

const DemandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        const data = await demandesService.getDemandeById(id);
        setDemande(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchPrestations = async () => {
      try {
        const data = await prestationsService.getAllPublicPrestations();
        setPrestations(data.results || data);
      } catch (err) {
        console.error('Erreur lors du chargement des prestations:', err);
      }
    };

    fetchDemande();
    fetchPrestations();
    setLoading(false);
  }, [id]);

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
          demande: parseInt(id),
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
        <div className="bg-red-100 border border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Erreur:</strong> {error}
        </div>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>Demande non trouvée</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{demande.intitule}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              demande.urgence === 'urgente' ? 'bg-red-100 text-red-800' :
              demande.urgence === 'haute' ? 'bg-orange-100 text-orange-800' :
              demande.urgence === 'normale' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {demande.urgence}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{demande.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Détails</h3>
              <div className="space-y-2">
                <p><strong>Budget:</strong> {demande.budget ? `${demande.budget} FCFA` : 'Non spécifié'}</p>
                <p><strong>Date souhaitée:</strong> {new Date(demande.date_souhaitee).toLocaleDateString()}</p>
                <p><strong>Lieu:</strong> {demande.lieu_intervention}</p>
                <p><strong>Statut:</strong> {demande.statut}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Exigences</h3>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(demande.exigences, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Prestations disponibles</h3>
            {prestations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prestations.map((prestation) => (
                  <div key={prestation.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold mb-2">{prestation.intitule}</h4>
                    <p className="text-gray-600 text-sm mb-2">{prestation.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-primary-600">
                        {prestation.tarif_min && prestation.tarif_max 
                          ? `${prestation.tarif_min} - ${prestation.tarif_max} FCFA`
                          : 'Sur devis'
                        }
                      </span>
                      <span className="text-sm text-gray-500">{prestation.mode_tarification}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleContact(prestation.id)}
                        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                      >
                        Contacter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">Aucune prestation disponible pour cette demande</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandeDetail;
