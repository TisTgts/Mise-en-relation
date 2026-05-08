import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiDollarSign, FiMapPin, FiClock, FiBriefcase, FiAlertCircle, FiChevronDown, FiX } from 'react-icons/fi';
import demandesService from '../../../services/demandesService';
import categoriesService from '../../../services/categoriesService';
import { useAuth } from '../../../contexts/AuthContext';
import Toast from '../../../components/Toast';
import {
  formatMoneyFcfa,
  formatDateShort,
  besoinStatutPillClass,
  besoinStatutLabel,
  besoinStepsFromStatut,
  urgencePillClass,
  urgenceLabel,
} from '../clientUi';

const MesBesoins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [demandes, setDemandes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [demandeToDelete, setDemandeToDelete] = useState(null);
  /** Après création : guidage vers les correspondances { besoinId } ou {} si pas d’id */
  const [postCreateMatchingHint, setPostCreateMatchingHint] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les demandes et les catégories en parallèle
        const [demandesData, categoriesData] = await Promise.all([
          demandesService.getMyDemandes(),
          categoriesService.getAllCategories()
        ]);
        
        const demandesList = Array.isArray(demandesData)
          ? demandesData
          : (demandesData.results || []);
        const categoriesList = Array.isArray(categoriesData)
          ? categoriesData
          : (categoriesData.results || []);
        
        setDemandes(demandesList);
        setCategories(categoriesList);
      } catch (error) {
        console.error('MesBesoins - Erreur lors du chargement des données:', error);
        setToast({
          message: 'Erreur lors du chargement de vos besoins',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.type_utilisateur === 'client') {
      fetchData();
    }
  }, [user]);

  // Retour après modification réussie
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modified = urlParams.get('modified');

    if (modified === 'true') {
      setToast({
        message: 'Besoin modifié avec succès',
        type: 'success'
      });

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Après création d’un besoin : hint dans l’URL → bandeau + toast
  useEffect(() => {
    const hint = searchParams.get('hint');
    if (hint !== 'matching') return;

    const raw = searchParams.get('besoin');
    let besoinId = null;
    if (raw != null && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) besoinId = n;
    }
    setPostCreateMatchingHint({ besoinId });
    setToast({
      message: 'Besoin enregistré. Consultez les correspondances pour être mis en relation.',
      type: 'success'
    });

    const next = new URLSearchParams(searchParams);
    next.delete('hint');
    next.delete('besoin');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const filteredAndSortedDemandes = demandes
    .filter(demande => {
      const matchesSearch = demande.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           demande.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categorieId = demande.categorie?.id ?? demande.categorie;
      const matchesCategory = !selectedCategory || String(categorieId) === selectedCategory;
      
      if (filter === 'all') return matchesSearch && matchesCategory;
      if (filter === 'ouverte') return demande.statut === 'ouverte' && matchesSearch && matchesCategory;
      if (filter === 'en_cours') return demande.statut === 'en_cours' && matchesSearch && matchesCategory;
      if (filter === 'pourvue') return demande.statut === 'pourvue' && matchesSearch && matchesCategory;
      if (filter === 'annulee') return demande.statut === 'annulee' && matchesSearch && matchesCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'budget':
          comparison = (a.budget || 0) - (b.budget || 0);
          break;
        case 'intitule':
          comparison = a.intitule?.localeCompare(b.intitule);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const handleDelete = async (id) => {
    // Ouvrir la modal de confirmation
    const demande = demandes.find(d => d.id === id);
    setDemandeToDelete(demande);
    setShowDeleteModal(true);
  };

  const confirmDeleteDemande = async () => {
    if (!demandeToDelete) return;
    
    try {
      setLoading(true);
      await demandesService.deleteDemande(demandeToDelete.id);
      
      setDemandes(prevDemandes => prevDemandes.filter(d => d.id !== demandeToDelete.id));
      
      setToast({
        message: 'Besoin supprimé avec succès',
        type: 'success'
      });
      
      // Fermer la modal
      setShowDeleteModal(false);
      setDemandeToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        message: 'Erreur lors de la suppression du besoin',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDemandeToDelete(null);
  };

  const handleEdit = (id) => {
    navigate(`/client/besoins/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes besoins</h1>
            <p className="text-gray-600 mt-2">Créez, modifiez ou supprimez vos besoins de services</p>
          </div>
          <div className="mt-4 lg:mt-0">
            <Link
              to="/client/creer-besoin"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Nouveau besoin
            </Link>
          </div>
        </div>
      </div>

      {postCreateMatchingHint && (
        <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-900">Étape suivante : correspondances</p>
            <p className="mt-1 text-sm text-slate-600">
              Découvrez les prestations suggérées pour votre besoin. Vous pouvez aussi lancer le matching depuis la ligne du
              tableau.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to={
                postCreateMatchingHint.besoinId != null
                  ? `/client/besoins/${postCreateMatchingHint.besoinId}/matching`
                  : '/client/matchings'
              }
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FiSearch className="h-4 w-4" />
              Voir les correspondances
            </Link>
            <button
              type="button"
              onClick={() => setPostCreateMatchingHint(null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Masquer
            </button>
          </div>
        </div>
      )}

      {/* Filtres avancés */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiSearch className="inline mr-2 h-4 w-4" />
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un besoin…"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <FiSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Catégorie */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catégorie
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.nom}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {loading ? 'Chargement...' : 'Aucune catégorie disponible'}
                  </option>
                )}
              </select>
              <FiChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
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
                className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Tous les besoins</option>
                <option value="ouverte">Ouverts</option>
                <option value="en_cours">En cours</option>
                <option value="pourvue">Pourvus</option>
                <option value="annulee">Annulés</option>
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
                className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="created_at">Date</option>
                <option value="budget">Budget</option>
                <option value="intitule">Nom</option>
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
                className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
              <p className="text-3xl font-bold text-slate-900">{filteredAndSortedDemandes.length}</p>
            </div>
            <FiBriefcase className="h-7 w-7 text-slate-400" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ouvertes</p>
              <p className="text-3xl font-bold text-emerald-700">
                {filteredAndSortedDemandes.filter(d => d.statut === 'ouverte').length}
              </p>
            </div>
            <FiAlertCircle className="h-7 w-7 text-emerald-500" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">En cours</p>
              <p className="text-3xl font-bold text-amber-700">
                {filteredAndSortedDemandes.filter(d => d.statut === 'en_cours').length}
              </p>
            </div>
            <FiClock className="h-7 w-7 text-amber-500" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget total</p>
              <p className="text-xl font-bold text-violet-700">{formatMoneyFcfa(filteredAndSortedDemandes.reduce((sum, d) => sum + Number(d.budget || 0), 0))}</p>
            </div>
            <FiDollarSign className="h-7 w-7 text-violet-500" />
          </div>
        </div>
      </div>

      {/* Tableau moderne */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredAndSortedDemandes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {demandes.length === 0 ? 'Aucun besoin créé' : 'Aucun besoin ne correspond aux filtres'}
              </h3>
              <p className="text-gray-600">
                {demandes.length === 0 
                  ? 'Commencez par publier votre premier besoin de service.' 
                  : 'Essayez d\'ajuster vos filtres de recherche.'}
              </p>
            </div>
            {demandes.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/client/creer-besoin"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-all duration-200"
                >
                  <FiPlus className="mr-2 h-5 w-5" />
                  Créer mon premier besoin
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Besoin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Catégorie
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAndSortedDemandes.map((demande) => {
                  return (
                  <tr key={demande.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {demande.intitule}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-slate-500">
                          <FiMapPin className="mr-1 h-3 w-3" />
                          {demande.lieu_intervention || '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                          {demande.categorie_nom || demande.categorie?.nom || 'Non définie'}
                        </div>
                        {(demande.sous_categorie_nom || demande.sous_categorie?.nom) && (
                          <div className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                            {demande.sous_categorie_nom || demande.sous_categorie?.nom}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${besoinStatutPillClass(demande.statut)}`}>
                        {besoinStatutLabel(demande.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/client/besoins/${demande.id}`}
                          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          title="Voir les détails"
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(demande.id)}
                          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          title="Modifier"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/client/besoins/${demande.id}/matching`}
                          className="inline-flex items-center rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                          title="Voir les correspondances"
                        >
                          <FiSearch className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(demande.id)}
                          className="inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal de confirmation de suppression */}
      {showDeleteModal && demandeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Confirmer la suppression</h2>
                  <p className="text-gray-600 mt-2">
                    Êtes-vous sûr de vouloir supprimer ce besoin ?
                  </p>
                </div>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <FiTrash2 className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {demandeToDelete.intitule}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {demandeToDelete.description?.substring(0, 100)}
                      {demandeToDelete.description?.length > 100 && '...'}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Budget:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {demandeToDelete.budget?.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Lieu:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {demandeToDelete.lieu_intervention || 'Non spécifié'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Urgence:
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold border ${
                        demandeToDelete.urgence === 'urgente' ? 'bg-red-100 text-red-800 border-red-200' :
                        demandeToDelete.urgence === 'haute' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        demandeToDelete.urgence === 'normale' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        {demandeToDelete.urgence === 'urgente' && 'Urgente'}
                        {demandeToDelete.urgence === 'haute' && 'Haute'}
                        {demandeToDelete.urgence === 'normale' && 'Normale'}
                        {(!demandeToDelete.urgence || demandeToDelete.urgence === 'basse') && 'Basse'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Date limite:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {demandeToDelete.date_limite ? new Date(demandeToDelete.date_limite).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteDemande}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Supprimer
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

export default MesBesoins;

