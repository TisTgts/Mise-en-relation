import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiDollarSign, FiStar, FiTrendingUp, FiFilter, FiMapPin, FiBriefcase, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import prestationsService from '../../../services/prestationsService';
import categoriesService from '../../../services/categoriesService';
import Toast from '../../../components/Toast';
import {
  formatMoneyFcfa,
  prestationStatutPillClass,
  prestationStatutLabel,
} from '../fournisseurUi';

const MesPrestations = () => {
  const { user } = useAuth();
  const [prestations, setPrestations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les prestations et les catégories en parallèle
        const [prestationsData, categoriesData] = await Promise.all([
          prestationsService.getMyPrestations(),
          categoriesService.getAllCategories()
        ]);
        
        const prestationsList = prestationsData.results || prestationsData;
        const categoriesList = categoriesData.results || categoriesData;
        
        setPrestations(prestationsList);
        setCategories(categoriesList);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setToast({
          message: 'Erreur lors du chargement des prestations',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.type_utilisateur === 'fournisseur') {
      fetchData();
    }
  }, [user]);

  const handleDeletePrestation = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) {
      try {
        setLoading(true);
        await prestationsService.deletePrestation(id);
        setPrestations((prev) => prev.filter((p) => p.id !== id));
        setToast({
          message: 'Prestation supprimée avec succès',
          type: 'success',
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setToast({
          message: 'Erreur lors de la suppression de la prestation',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getCategorieNom = (categorieValue) => {
    const id = typeof categorieValue === 'object' ? categorieValue?.id : categorieValue;
    const categorie = categories.find(c => c.id === id);
    return categorie ? categorie.nom : 'Non spécifiée';
  };

  const filteredAndSortedPrestations = prestations
    .filter(prestation => {
      const matchesSearch = 
        prestation.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.type_prestation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categorieId =
        typeof prestation.categorie === 'object'
          ? prestation.categorie?.id
          : prestation.categorie;
      const matchesCategory = !selectedCategory || String(categorieId) === selectedCategory;
      
      if (filter === 'all') return matchesSearch && matchesCategory;
      if (filter === 'active') return prestation.statut === 'active' && matchesSearch && matchesCategory;
      if (filter === 'inactive') return prestation.statut === 'inactive' && matchesSearch && matchesCategory;
      if (filter === 'pending') return prestation.statut === 'pending' && matchesSearch && matchesCategory;
      if (filter === 'en_cours') return prestation.statut === 'en_cours' && matchesSearch && matchesCategory;
      if (filter === 'terminee') return prestation.statut === 'terminee' && matchesSearch && matchesCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'tarif_min':
          comparison = (a.tarif_min || 0) - (b.tarif_min || 0);
          break;
        case 'note':
          comparison = (a.note || 0) - (b.note || 0);
          break;
        case 'intitule':
          comparison = a.intitule?.localeCompare(b.intitule);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const stats = {
    total: filteredAndSortedPrestations.length,
    actives: filteredAndSortedPrestations.filter(p => p.statut === 'active').length,
    noteMoyenne: filteredAndSortedPrestations.length > 0 ? 
      (filteredAndSortedPrestations.reduce((acc, p) => acc + (p.note || 0), 0) / filteredAndSortedPrestations.length).toFixed(1) : 0,
    revenuTotal: filteredAndSortedPrestations.reduce((sum, p) => sum + (p.tarif_min || 0), 0)
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
            <h1 className="text-3xl font-bold text-slate-900">Mes prestations</h1>
            <p className="mt-2 text-sm text-slate-600">Gérez vos offres de services</p>
          </div>
          <div className="mt-4 lg:mt-0">
            <Link
              to="/fournisseur/creer-prestation"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              Créer une prestation
            </Link>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
                placeholder="Rechercher une prestation..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <FiFilter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.nom}
                  </option>
                ))}
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
                <option value="all">Toutes les prestations</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
                <option value="pending">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminées</option>
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
                <option value="tarif_min">Tarif</option>
                <option value="note">Note</option>
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
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <FiBriefcase className="h-7 w-7 text-slate-400" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actives</p>
              <p className="text-3xl font-bold text-emerald-700">{stats.actives}</p>
            </div>
            <FiTrendingUp className="h-7 w-7 text-emerald-500" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Note moyenne</p>
              <p className="text-3xl font-bold text-amber-700">{stats.noteMoyenne}</p>
            </div>
            <FiStar className="h-7 w-7 text-amber-500" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenu de base</p>
              <p className="text-xl font-bold text-violet-700">{formatMoneyFcfa(stats.revenuTotal)}</p>
            </div>
            <FiDollarSign className="h-7 w-7 text-violet-500" />
          </div>
        </div>
      </div>

      {/* Tableau moderne */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredAndSortedPrestations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500">
              <FiBriefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {prestations.length === 0 ? 'Aucune prestation créée' : 'Aucune prestation trouvée'}
              </h3>
              <p className="text-gray-600">
                {prestations.length === 0 
                  ? 'Commencez par créer votre première offre de service' 
                  : 'Essayez d\'ajuster vos filtres de recherche'
                }
              </p>
            </div>
            {prestations.length === 0 && (
              <div className="mt-6">
                <Link to="/fournisseur/creer-prestation" className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                  <FiPlus className="mr-2 h-5 w-5" />
                  Créer ma première prestation
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Prestation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tarif
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredAndSortedPrestations.map((prestation) => (
                  <tr key={prestation.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {prestation.intitule}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-slate-500">
                          <FiMapPin className="mr-1 h-3 w-3" />
                          {prestation.lieu_intervention || 'Non spécifié'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                          {getCategorieNom(prestation.categorie)}
                        </div>
                        {prestation.type_prestation && (
                          <div className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                            {prestation.type_prestation}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-slate-900">
                          {prestation.tarif_min && prestation.tarif_max ? 
                            `${formatMoneyFcfa(prestation.tarif_min)} - ${formatMoneyFcfa(prestation.tarif_max)}` :
                            prestation.tarif_min ? 
                              `${formatMoneyFcfa(prestation.tarif_min)}` :
                              'Non spécifié'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${prestationStatutPillClass(prestation.statut)}`}>
                        {prestationStatutLabel(prestation.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FiStar className="mr-1 h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-slate-900">
                          {prestation.note || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/fournisseur/prestation/${prestation.id}`}
                          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          title="Voir les détails"
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/fournisseur/modifier-prestation/${prestation.id}`}
                          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          title="Modifier"
                        >
                          <FiEdit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeletePrestation(prestation.id)}
                          className="inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MesPrestations;
