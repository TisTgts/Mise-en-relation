import React, { useEffect, useState } from 'react';
import { FiRefreshCw, FiEye } from 'react-icons/fi';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';
import { useNavigate } from 'react-router-dom';

const ManageMatchings = () => {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filterVille, setFilterVille] = useState('all');
  const [filterCategorie, setFilterCategorie] = useState('all');
  const [filterSousCategorie, setFilterSousCategorie] = useState('all');
  const [filterMinScore, setFilterMinScore] = useState(0);

  const loadNeeds = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMatchingByNeed();
      setNeeds(Array.isArray(data) ? data : []);
    } catch {
      setToast({ message: 'Erreur lors du chargement des correspondances', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNeeds();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  const villeOptions = Array.from(
    new Set(needs.map((n) => (n.besoin_ville || '').trim()).filter(Boolean))
  ).sort();

  const categoryOptions = Array.from(
    new Set(
      needs.flatMap((n) => [
        n.besoin_categorie || '',
        ...((n.correspondances || []).map((c) => c.prestation_categorie || '')),
      ]).filter(Boolean)
    )
  ).sort();

  const subCategoryOptions = Array.from(
    new Set(
      needs.flatMap((n) => [
        n.besoin_sous_categorie || '',
        ...((n.correspondances || []).map((c) => c.prestation_sous_categorie || '')),
      ]).filter(Boolean)
    )
  ).sort();

  const displayedNeeds = needs
    .map((n) => {
      const correspondances = (n.correspondances || []).filter((c) => {
        const scoreOk = Number(c.score || 0) >= Number(filterMinScore || 0);
        const cityOk = filterVille === 'all' || (n.besoin_ville || '').toLowerCase().includes(filterVille.toLowerCase());
        const categoryOk =
          filterCategorie === 'all' ||
          (n.besoin_categorie || '').toLowerCase() === filterCategorie.toLowerCase() ||
          (c.prestation_categorie || '').toLowerCase() === filterCategorie.toLowerCase();
        const subCategoryOk =
          filterSousCategorie === 'all' ||
          (n.besoin_sous_categorie || '').toLowerCase() === filterSousCategorie.toLowerCase() ||
          (c.prestation_sous_categorie || '').toLowerCase() === filterSousCategorie.toLowerCase();
        return scoreOk && cityOk && categoryOk && subCategoryOk;
      });
      return {
        ...n,
        correspondances,
        correspondances_count: correspondances.length,
      };
    })
    .filter((n) => n.correspondances_count > 0);

  const totalCorrespondances = displayedNeeds.reduce(
    (sum, n) => sum + Number(n.correspondances_count || 0),
    0
  );

  const navigateToNeedDetails = (needId) => {
    const orderedNeedIds = displayedNeeds.map((n) => n.besoin_id);
    const currentIndex = orderedNeedIds.findIndex((id) => id === needId);
    navigate(`/admin/correspondances/besoin/${needId}`, {
      state: {
        orderedNeedIds,
        currentIndex,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow rounded-xl p-6 flex items-center justify-between text-white">
        <div>
          <h1 className="text-2xl font-bold">Correspondances</h1>
          <p className="text-blue-100 mt-1">Vue globale des besoins matchés</p>
        </div>
        <button
          onClick={loadNeeds}
          className="inline-flex items-center px-4 py-2 bg-white/15 border border-white/25 text-white rounded-lg hover:bg-white/25 transition-colors"
        >
          <FiRefreshCw className="mr-2" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Besoins affichés</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{displayedNeeds.length}</p>
        </div>
        <div className="bg-white border border-gray-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Correspondances totales</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCorrespondances}</p>
        </div>
        <div className="bg-white border border-gray-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Score minimum</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Number(filterMinScore || 0)}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select
            value={filterVille}
            onChange={(e) => setFilterVille(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">Toutes les villes</option>
            {villeOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">Toutes les catégories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterSousCategorie}
            onChange={(e) => setFilterSousCategorie(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">Toutes les sous-catégories</option>
            {subCategoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={filterMinScore}
            onChange={(e) => setFilterMinScore(e.target.value)}
            placeholder="Score min"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Total besoins avec correspondances (filtrés): <span className="font-semibold">{displayedNeeds.length}</span>
        </p>
        {displayedNeeds.length === 0 && (
          <div className="mb-4 p-3 rounded-md bg-amber-50 text-amber-800 text-sm">
            Aucun besoin ne correspond aux filtres actuels.
          </div>
        )}
        <div className="max-h-96 overflow-auto border border-gray-200 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Besoin</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Ville</th>
                <th className="px-3 py-2 text-left">Nombre correspondances</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedNeeds.map((n) => (
                <tr key={n.besoin_id} className="border-t border-gray-100 hover:bg-gray-50/70">
                    <td className="px-3 py-2">{n.besoin_titre}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{n.client_nom}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                        {n.besoin_ville || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        {n.correspondances_count}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => navigateToNeedDetails(n.besoin_id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiEye className="mr-1" />
                        Voir correspondances
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ManageMatchings;
