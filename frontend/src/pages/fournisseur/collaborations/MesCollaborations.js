import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFilter, FiCalendar, FiUser, FiStar, FiBriefcase, FiAlertCircle, FiChevronDown, FiEye, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import Toast from '../../../components/Toast';
import transactionsService from '../../../services/transactionsService';
import { transactionToCollaboration } from '../../../utils/collaborationView';

const MesCollaborations = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    collaboration_id: null
  });

  useEffect(() => {
    const fetchCollaborations = async () => {
      try {
        setLoading(true);
        const data = await transactionsService.getMyTransactions();
        const list = Array.isArray(data) ? data : [];
        setCollaborations(list.map((tx) => transactionToCollaboration(tx, 'fournisseur')));
      } catch (error) {
        console.error('Erreur lors du chargement des collaborations:', error);
        setToast({
          message: 'Erreur lors du chargement des collaborations',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.type_utilisateur === 'fournisseur') {
      fetchCollaborations();
    }
  }, [user]);

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'acceptee': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminee': return 'bg-green-100 text-green-800 border-green-200';
      case 'annulee': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'en_attente': return <FiAlertCircle className="w-4 h-4" />;
      case 'acceptee': return <FiCheckCircle className="w-4 h-4" />;
      case 'en_cours': return <FiClock className="w-4 h-4" />;
      case 'terminee': return <FiCheckCircle className="w-4 h-4" />;
      case 'annulee': return <FiXCircle className="w-4 h-4" />;
      default: return <FiAlertCircle className="w-4 h-4" />;
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

  const formatDate = (value) => {
    if (!value) return '—';
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? '—' : new Date(value).toLocaleDateString('fr-FR');
  };

  const filteredAndSortedCollaborations = collaborations
    .filter(collaboration => {
      const matchesSearch = 
        collaboration.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collaboration.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collaboration.fournisseur?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'all') return matchesSearch;
      if (filter === 'en_attente') return collaboration.statut === 'en_attente' && matchesSearch;
      if (filter === 'acceptee') return collaboration.statut === 'acceptee' && matchesSearch;
      if (filter === 'en_cours') return collaboration.statut === 'en_cours' && matchesSearch;
      if (filter === 'terminee') return collaboration.statut === 'terminee' && matchesSearch;
      if (filter === 'annulee') return collaboration.statut === 'annulee' && matchesSearch;
      if (filter === 'avec_review') return collaboration.review && matchesSearch;
      if (filter === 'sans_review') return !collaboration.review && collaboration.statut === 'terminee' && matchesSearch;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'date_fin':
          comparison = new Date(a.date_fin) - new Date(b.date_fin);
          break;
        case 'budget':
          comparison = (a.budget || 0) - (b.budget || 0);
          break;
        case 'titre':
          comparison = a.titre?.localeCompare(b.titre);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const stats = {
    total: filteredAndSortedCollaborations.length,
    enCours: filteredAndSortedCollaborations.filter(c => c.statut === 'en_cours').length,
    terminees: filteredAndSortedCollaborations.filter(c => c.statut === 'terminee').length,
    avecReview: filteredAndSortedCollaborations.filter(c => c.review).length,
    revenuTotal: filteredAndSortedCollaborations.reduce((sum, c) => sum + (c.budget || 0), 0)
  };

  const handleViewDetails = (collaboration) => {
    setSelectedCollaboration(collaboration);
    setShowDetails(true);
  };

  const handleOpenReviewModal = (collaboration) => {
    setReviewData({
      rating: 5,
      comment: '',
      collaboration_id: collaboration.id
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    setShowReviewModal(false);
    setReviewData({ rating: 5, comment: '', collaboration_id: null });
    setToast({
      message: 'La publication d’avis sera disponible prochainement.',
      type: 'info',
    });
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "button"}
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            className={`${interactive ? 'hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <FiStar
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
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
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Collaborations</h1>
            <p className="text-gray-600 mt-2">Suivez vos missions liées aux transactions avec vos clients</p>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiFilter className="inline mr-2 h-4 w-4" />
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une collaboration..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <FiFilter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Statut */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Statut
            </label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
              >
                <option value="all">Toutes les collaborations</option>
                <option value="en_attente">En attente</option>
                <option value="acceptee">Acceptée</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminées</option>
                <option value="annulee">Annulées</option>
                <option value="avec_review">Avec avis</option>
                <option value="sans_review">Sans avis (terminées)</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trier par
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
              >
                <option value="created_at">Date de création</option>
                <option value="date_fin">Date de fin</option>
                <option value="budget">Budget</option>
                <option value="titre">Titre</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Ordre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ordre
            </label>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
              >
                <option value="desc">Récent</option>
                <option value="asc">Ancien</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <FiBriefcase className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">En cours</p>
              <p className="text-3xl font-bold">{stats.enCours}</p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Terminées</p>
              <p className="text-3xl font-bold">{stats.terminees}</p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avis</p>
              <p className="text-3xl font-bold">{stats.avecReview}</p>
            </div>
            <FiStar className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Montant total</p>
              <p className="text-3xl font-bold">
                {stats.revenuTotal.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Tableau moderne */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {filteredAndSortedCollaborations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune collaboration trouvée</h3>
              <p className="text-gray-600">Les collaborations apparaissent lorsque vous avez une transaction en cours ou terminée.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Collaboration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Avis
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedCollaborations.map((collaboration) => (
                  <tr key={collaboration.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {collaboration.titre}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiBriefcase className="mr-1 h-3 w-3" />
                          {collaboration.categorie?.nom}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {collaboration.fournisseur?.nom}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <FiStar className="mr-1 h-3 w-3 text-yellow-400" />
                            {collaboration.fournisseur?.note_moyenne ?? '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>{formatDate(collaboration.date_debut)}</div>
                        <div className="text-gray-500">au</div>
                        <div>{formatDate(collaboration.date_fin)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {collaboration.budget != null
                          ? `${collaboration.budget.toLocaleString('fr-FR')} FCFA`
                          : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(collaboration.statut)}`}>
                          {getStatusIcon(collaboration.statut)}
                          <span className="ml-2">{getStatusText(collaboration.statut)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {collaboration.review ? (
                        <div className="flex items-center space-x-2">
                          {renderStars(collaboration.review.rating)}
                          <span className="text-xs text-gray-500">
                            {new Date(collaboration.review.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {collaboration.statut === 'terminee' ? 'Non évaluée' : '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(collaboration)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Voir les détails"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/fournisseur/transactions/${collaboration.id}`}
                          className="inline-flex items-center px-3 py-2 border border-primary-300 rounded-lg text-sm font-medium text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          title="Fiche transaction"
                        >
                          Transaction
                        </Link>
                        {collaboration.statut === 'terminee' && !collaboration.review && (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(collaboration)}
                            className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-lg text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                            title="Laisser un avis"
                          >
                            <FiStar className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetails && selectedCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCollaboration.titre}</h2>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(selectedCollaboration.statut)}`}>
                      {getStatusIcon(selectedCollaboration.statut)}
                      <span className="ml-2">{getStatusText(selectedCollaboration.statut)}</span>
                    </span>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                      <FiBriefcase className="mr-2 h-4 w-4" />
                      {selectedCollaboration.categorie?.nom}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedCollaboration.description}</p>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Période</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Début:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(selectedCollaboration.date_debut)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Fin:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(selectedCollaboration.date_fin)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiAlertCircle className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Montant:</span>
                        <span className="ml-2 font-medium">
                          {selectedCollaboration.budget != null
                            ? `${selectedCollaboration.budget.toLocaleString('fr-FR')} FCFA`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Client</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <FiUser className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedCollaboration.fournisseur?.nom}</p>
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <FiStar className="mr-1 h-3 w-3 text-yellow-400" />
                            {selectedCollaboration.fournisseur?.note_moyenne ?? '—'}
                          </div>
                          {selectedCollaboration.fournisseur?.email ? (
                            <div className="text-sm text-gray-600">
                              {selectedCollaboration.fournisseur.email}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avis */}
                {selectedCollaboration.review && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Avis</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {renderStars(selectedCollaboration.review.rating)}
                          <span className="text-sm text-gray-600">
                            {new Date(selectedCollaboration.review.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Par {selectedCollaboration.review.auteur}
                        </span>
                      </div>
                      <p className="text-gray-700">{selectedCollaboration.review.comment}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
                {selectedCollaboration.statut === 'terminee' && !selectedCollaboration.review && (
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      handleOpenReviewModal(selectedCollaboration);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Laisser un avis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal avis */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Laisser un avis</h2>
                  <p className="text-gray-600 mt-2">Évaluez votre collaboration</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <div className="flex justify-center">
                    {renderStars(reviewData.rating, true, (rating) => 
                      setReviewData(prev => ({ ...prev, rating }))
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire
                  </label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Décrivez votre expérience..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Publier l’avis
                </button>
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

export default MesCollaborations;
