import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFilter, FiCalendar, FiDollarSign, FiUser, FiBriefcase, FiEye, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import transactionsService from '../../../services/transactionsService';
import Toast from '../../../components/Toast';

const MesTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        console.log('MesTransactions (fournisseur) - user:', user);
        const data = await transactionsService.getMyTransactions();
        console.log('MesTransactions (fournisseur) - transactions data:', data);
        setTransactions(data);
      } catch (error) {
        console.error('Erreur lors du chargement des transactions:', error);
        setToast({
          message: 'Erreur lors du chargement des transactions',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.prestation?.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.besoin?.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.fournisseur_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'en_attente') return transaction.statut === 'en_attente' && matchesSearch;
    if (filter === 'acceptee') return transaction.statut === 'acceptee' && matchesSearch;
    if (filter === 'en_cours') return transaction.statut === 'en_cours' && matchesSearch;
    if (filter === 'terminee') return transaction.statut === 'terminee' && matchesSearch;
    if (filter === 'annulee') return transaction.statut === 'annulee' && matchesSearch;
    
    return matchesSearch;
  });

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

  const handleExport = () => {
    // Logique d'exportation à implémenter
    setToast({
      message: 'Fonctionnalité d\'exportation à implémenter',
      type: 'info'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Transactions</h1>
            <p className="text-gray-600 mt-1">Historique de vos transactions en tant que fournisseur</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiDownload className="mr-2 h-4 w-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une transaction..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <FiFilter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Toutes les transactions</option>
              <option value="en_attente">En attente</option>
              <option value="acceptee">Acceptées</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminées</option>
              <option value="annulee">Annulées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {transactions.length === 0 ? 'Vous n\'avez pas encore de transaction' : 'Aucune transaction trouvée'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prestation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Besoin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix final
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 h-4 w-4" />
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {transaction.prestation?.intitule}
                        </div>
                        <div className="text-gray-500">
                          {transaction.prestation?.categorie?.nom}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {transaction.besoin?.intitule}
                        </div>
                        <div className="text-gray-500">
                          {transaction.besoin?.lieu_intervention}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.fournisseur_nom}
                          </div>
                          <div className="text-gray-500">
                            {transaction.fournisseur?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <FiDollarSign className="mr-2 h-4 w-4" />
                        {transaction.prix_final?.toLocaleString()} FCFA
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.statut)}`}>
                        {getStatusText(transaction.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/fournisseur/transactions/${transaction.id}`}
                        className="text-primary-600 hover:text-primary-900"
                        title="Voir les détails"
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistiques */}
      {transactions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FiDollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Total transactions</p>
                  <p className="text-2xl font-bold text-blue-900">{transactions.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FiBriefcase className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Terminées</p>
                  <p className="text-2xl font-bold text-green-900">
                    {transactions.filter(t => t.statut === 'terminee').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FiCalendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">En cours</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {transactions.filter(t => t.statut === 'en_cours').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <FiUser className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Montant total</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {transactions
                      .filter(t => t.statut === 'terminee')
                      .reduce((sum, t) => sum + (t.prix_final || 0), 0)
                      .toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

export default MesTransactions;
