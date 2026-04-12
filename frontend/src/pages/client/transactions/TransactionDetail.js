import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiCheck, FiX, FiClock, FiCalendar, FiDollarSign, FiUser, FiMessageSquare } from 'react-icons/fi';
import transactionsService from '../../../services/transactionsService';
import Toast from '../../../components/Toast';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const data = await transactionsService.getTransactionById(id);
        setTransaction(data);
        setNotes(data.notes || '');
      } catch (err) {
        console.error('Erreur lors du chargement de la transaction:', err);
        setError('Impossible de charger les détails de la transaction');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      const updatedTransaction = await transactionsService.updateTransactionStatus(id, newStatus);
      setTransaction(updatedTransaction);
      setToast({
        message: `Statut mis à jour: ${getStatusText(newStatus)}`,
        type: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setToast({
        message: 'Erreur lors de la mise à jour du statut',
        type: 'error'
      });
    }
  };

  const handleConfirmStart = async () => {
    try {
      const now = new Date().toISOString();
      const updatedTransaction = await transactionsService.confirmStart(id, now);
      setTransaction(updatedTransaction);
      setToast({
        message: 'Début de la transaction confirmé',
        type: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de la confirmation du début:', err);
      setToast({
        message: 'Erreur lors de la confirmation du début',
        type: 'error'
      });
    }
  };

  const handleConfirmEnd = async () => {
    try {
      const now = new Date().toISOString();
      const updatedTransaction = await transactionsService.confirmEnd(id, now);
      setTransaction(updatedTransaction);
      setToast({
        message: 'Fin de la transaction confirmée',
        type: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de la confirmation de la fin:', err);
      setToast({
        message: 'Erreur lors de la confirmation de la fin',
        type: 'error'
      });
    }
  };

  const handleSaveNotes = async () => {
    try {
      const updatedTransaction = await transactionsService.addNotes(id, notes);
      setTransaction(updatedTransaction);
      setEditingNotes(false);
      setToast({
        message: 'Notes enregistrées avec succès',
        type: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des notes:', err);
      setToast({
        message: 'Erreur lors de l\'enregistrement des notes',
        type: 'error'
      });
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'acceptee': return 'bg-blue-100 text-blue-800';
      case 'en_cours': return 'bg-purple-100 text-purple-800';
      case 'terminee': return 'bg-green-100 text-green-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'acceptee': return 'Acceptée';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'annulee': return 'Annulée';
      default: return statut;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-lg">{error || 'Transaction non trouvée'}</div>
              <button
                type="button"
                onClick={() => navigate('/client/transactions')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour aux transactions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => navigate('/client/transactions')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Détails de la Transaction</h1>
                <p className="text-gray-600 mt-1">Référence: #{transaction.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(transaction.statut)}`}>
                {getStatusText(transaction.statut)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prestation et besoin */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Services concernés</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">Prestation</h3>
                  <p className="text-sm font-medium text-blue-600">{transaction.prestation?.intitule}</p>
                  <p className="text-sm text-gray-600">{transaction.prestation?.categorie?.nom}</p>
                  <p className="text-sm text-gray-500 mt-1">{transaction.prestation?.type_prestation}</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">Besoin</h3>
                  <p className="text-sm font-medium text-green-600">{transaction.besoin?.intitule}</p>
                  <p className="text-sm text-gray-600">{transaction.besoin?.lieu_intervention}</p>
                  <p className="text-sm text-gray-500 mt-1">Urgence: {transaction.besoin?.urgence}</p>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Participants</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fournisseur</p>
                    <p className="text-sm text-gray-900 font-medium">{transaction.fournisseur_nom}</p>
                    <p className="text-sm text-gray-500">{transaction.fournisseur?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FiUser className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Client</p>
                    <p className="text-sm text-gray-900 font-medium">{transaction.client_nom}</p>
                    <p className="text-sm text-gray-500">{transaction.client?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline de la transaction</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiCalendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Création</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(transaction.created_at).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                {transaction.heure_debut && (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FiClock className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Début confirmé</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.heure_debut).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(transaction.heure_debut).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {transaction.heure_fin && (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <FiCheck className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fin confirmée</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.heure_fin).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(transaction.heure_fin).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                {!editingNotes && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiEdit className="mr-2 h-4 w-4" />
                    Modifier
                  </button>
                )}
              </div>
              
              {editingNotes ? (
                <div className="space-y-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ajoutez des notes sur cette transaction..."
                  />
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSaveNotes}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <FiCheck className="mr-2 h-4 w-4" />
                      Enregistrer
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(false);
                        setNotes(transaction.notes || '');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FiX className="mr-2 h-4 w-4" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {transaction.notes || 'Aucune note pour cette transaction.'}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prix et statut */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations financières</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Prix final</span>
                  <div className="flex items-center text-lg font-bold text-green-600">
                    <FiDollarSign className="h-5 w-5" />
                    {transaction.prix_final?.toLocaleString()} FCFA
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Statut</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.statut)}`}>
                    {getStatusText(transaction.statut)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {transaction.statut === 'en_attente' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('acceptee')}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <FiCheck className="mr-2 h-4 w-4" />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('annulee')}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <FiX className="mr-2 h-4 w-4" />
                      Annuler
                    </button>
                  </>
                )}
                
                {transaction.statut === 'acceptee' && !transaction.debut_confirme && (
                  <button
                    onClick={handleConfirmStart}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FiClock className="mr-2 h-4 w-4" />
                    Confirmer le début
                  </button>
                )}
                
                {transaction.statut === 'en_cours' && transaction.debut_confirme && !transaction.fin_confirmee && (
                  <button
                    onClick={handleConfirmEnd}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <FiCheck className="mr-2 h-4 w-4" />
                    Confirmer la fin
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Communication</h2>
              <Link
                to={`/client/messages?transaction=${transaction.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiMessageSquare className="mr-2 h-4 w-4" />
                Voir les messages
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default TransactionDetail;
