import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import transactionsService from '../../services/transactionsService';
import './TransactionDetail.css';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const data = await transactionsService.getTransactionById(id);
        setTransaction(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTransaction();
    setLoading(false);
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await transactionsService.updateTransactionStatus(id, newStatus);
      setTransaction(prev => ({ ...prev, statut: newStatus }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Erreur:</strong> {error}
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>Transaction non trouvée</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Détails de la transaction</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              transaction.statut === 'terminee' ? 'bg-green-100 text-green-800' :
              transaction.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
              transaction.statut === 'acceptee' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {transaction.statut}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Prestation</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Intitulé:</strong> {transaction.prestation?.intitule}</p>
                <p><strong>Fournisseur:</strong> {transaction.prestataire?.username}</p>
                <p><strong>Description:</strong> {transaction.prestation?.description}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Demande</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Intitulé:</strong> {transaction.demande?.intitule}</p>
                <p><strong>Client:</strong> {transaction.client?.username}</p>
                <p><strong>Lieu:</strong> {transaction.demande?.lieu_intervention}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Informations générales</h3>
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Prix final:</strong> {transaction.prix_final ? `${transaction.prix_final} FCFA` : 'Non défini'}</p>
                <p><strong>Date de création:</strong> {new Date(transaction.created_at).toLocaleDateString()}</p>
                <p><strong>Début confirmé:</strong> {transaction.debut_confirme ? 'Oui' : 'Non'}</p>
                <p><strong>Fin confirmée:</strong> {transaction.fin_confirmee ? 'Oui' : 'Non'}</p>
                {transaction.heure_debut && (
                  <p><strong>Heure de début:</strong> {new Date(transaction.heure_debut).toLocaleString()}</p>
                )}
                {transaction.heure_fin && (
                  <p><strong>Heure de fin:</strong> {new Date(transaction.heure_fin).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          {transaction.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-700">{transaction.notes}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {transaction.statut === 'en_attente' && (
                <button
                  onClick={() => handleStatusUpdate('acceptee')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Accepter
                </button>
              )}
              {transaction.statut === 'acceptee' && (
                <button
                  onClick={() => handleStatusUpdate('en_cours')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Démarrer
                </button>
              )}
              {transaction.statut === 'en_cours' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('terminee')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Terminer
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('annulee')}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Annuler
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/client/transactions')}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Retour aux transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
