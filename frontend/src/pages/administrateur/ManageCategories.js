import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminType } from '../../utils/roles';
import { useConfirm } from '../../contexts/ConfirmContext';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';

const ManageCategories = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [newCategory, setNewCategory] = useState({ nom: '', description: '', est_active: true });
  const [editById, setEditById] = useState({});
  const [subCategories, setSubCategories] = useState([]);
  const [newSubCategory, setNewSubCategory] = useState({ categorie: '', nom: '', description: '', est_active: true });
  const [editSubById, setEditSubById] = useState({});

  useEffect(() => {
    const load = async () => {
      if (!isAdminType(user)) return;
      try {
        setLoading(true);
        const data = await adminService.getAllCategoriesAll();
        const subData = await adminService.getAllSubCategories();
        setCategories(Array.isArray(data) ? data : []);
        setSubCategories(Array.isArray(subData) ? subData : []);
      } catch {
        setToast({ message: 'Impossible de charger les catégories.', type: 'error' });
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const filtered = categories.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.nom?.toLowerCase().includes(q) ||
      (c.description && String(c.description).toLowerCase().includes(q)) ||
      (c.sous_categories || []).some((sc) => sc.nom?.toLowerCase().includes(q))
    );
  });

  const handleCreateCategory = async () => {
    if (!newCategory.nom.trim()) {
      setToast({ message: 'Le nom de la catégorie est requis.', type: 'error' });
      return;
    }
    try {
      setCreating(true);
      const created = await adminService.createCategory({
        nom: newCategory.nom.trim(),
        description: (newCategory.description || '').trim(),
        est_active: !!newCategory.est_active,
      });
      setCategories((prev) => [created, ...prev]);
      setNewCategory({ nom: '', description: '', est_active: true });
      setToast({ message: 'Catégorie ajoutée.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Impossible d’ajouter la catégorie.', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (row) => {
    setEditById((prev) => ({
      ...prev,
      [row.id]: {
        nom: row.nom || '',
        description: row.description || '',
        est_active: !!row.est_active,
      },
    }));
  };

  const cancelEdit = (id) => {
    setEditById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSaveEdit = async (id) => {
    const draft = editById[id];
    if (!draft?.nom?.trim()) {
      setToast({ message: 'Le nom de la catégorie est requis.', type: 'error' });
      return;
    }
    try {
      setSavingId(id);
      const updated = await adminService.updateCategory(id, {
        nom: draft.nom.trim(),
        description: (draft.description || '').trim(),
        est_active: !!draft.est_active,
      });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      cancelEdit(id);
      setToast({ message: 'Catégorie modifiée.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Impossible de modifier la catégorie.', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteCategory = async (id) => {
    const ok = await confirm({
      title: 'Supprimer cette catégorie ?',
      message: 'Les sous-catégories liées seront aussi impactées.',
      tone: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      setSavingId(id);
      await adminService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSubCategories((prev) => prev.filter((sc) => sc.categorie !== id));
      cancelEdit(id);
      setToast({ message: 'Catégorie supprimée.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Impossible de supprimer la catégorie.', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const startSubEdit = (row) => {
    setEditSubById((prev) => ({
      ...prev,
      [row.id]: {
        nom: row.nom || '',
        description: row.description || '',
        est_active: !!row.est_active,
        categorie: row.categorie,
      },
    }));
  };

  const cancelSubEdit = (id) => {
    setEditSubById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleCreateSubCategory = async () => {
    if (!newSubCategory.categorie) {
      setToast({ message: 'Choisissez une catégorie parente.', type: 'error' });
      return;
    }
    if (!newSubCategory.nom.trim()) {
      setToast({ message: 'Le nom de la sous-catégorie est requis.', type: 'error' });
      return;
    }
    try {
      setCreating(true);
      const created = await adminService.createSubCategory({
        categorie: Number(newSubCategory.categorie),
        nom: newSubCategory.nom.trim(),
        description: (newSubCategory.description || '').trim(),
        est_active: !!newSubCategory.est_active,
      });
      setSubCategories((prev) => [created, ...prev]);
      setNewSubCategory({ categorie: '', nom: '', description: '', est_active: true });
      setToast({ message: 'Sous-catégorie ajoutée.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Impossible d’ajouter la sous-catégorie.', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSubEdit = async (id) => {
    const draft = editSubById[id];
    if (!draft?.nom?.trim()) {
      setToast({ message: 'Le nom de la sous-catégorie est requis.', type: 'error' });
      return;
    }
    try {
      setSavingId(id);
      const updated = await adminService.updateSubCategory(id, {
        categorie: Number(draft.categorie),
        nom: draft.nom.trim(),
        description: (draft.description || '').trim(),
        est_active: !!draft.est_active,
      });
      setSubCategories((prev) => prev.map((sc) => (sc.id === id ? updated : sc)));
      cancelSubEdit(id);
      setToast({ message: 'Sous-catégorie modifiée.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Impossible de modifier la sous-catégorie.', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteSubCategory = async (id) => {
    const ok = await confirm({
      title: 'Supprimer cette sous-catégorie ?',
      message: 'Cette action est irréversible.',
      tone: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      setSavingId(id);
      await adminService.deleteSubCategory(id);
      setSubCategories((prev) => prev.filter((sc) => sc.id !== id));
      cancelSubEdit(id);
      setToast({ message: 'Sous-catégorie supprimée.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Impossible de supprimer la sous-catégorie.', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/admin/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <FiChevronLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Catégories de services</h1>
            <p className="mt-1 text-sm text-slate-600">
              Taxonomie utilisée pour les prestations et les besoins ({categories.length} catégories).
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom *</label>
            <input
              type="text"
              value={newCategory.nom}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, nom: e.target.value }))}
              placeholder="Ex: Agriculture"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <input
              type="text"
              value={newCategory.description}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description de la catégorie"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-1 flex items-end justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={newCategory.est_active}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, est_active: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600"
              />
              Active
            </label>
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={creating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-slate-700">Recherche</label>
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom, description ou sous-catégorie…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Nom</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Actif</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Sous-catégories</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Créée le</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Aucune catégorie à afficher.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {editById[row.id] ? (
                        <input
                          type="text"
                          value={editById[row.id].nom}
                          onChange={(e) =>
                            setEditById((prev) => ({ ...prev, [row.id]: { ...prev[row.id], nom: e.target.value } }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        row.nom
                      )}
                      {editById[row.id] && (
                        <input
                          type="text"
                          value={editById[row.id].description}
                          onChange={(e) =>
                            setEditById((prev) => ({ ...prev, [row.id]: { ...prev[row.id], description: e.target.value } }))
                          }
                          placeholder="Description"
                          className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editById[row.id] ? (
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editById[row.id].est_active}
                            onChange={(e) =>
                              setEditById((prev) => ({ ...prev, [row.id]: { ...prev[row.id], est_active: e.target.checked } }))
                            }
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          Active
                        </label>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.est_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.est_active ? 'Oui' : 'Non'}
                        </span>
                      )}
                    </td>
                    <td className="max-w-md px-4 py-3 text-slate-700">
                      {(row.sous_categories || []).length ? (
                        <span className="line-clamp-2">
                          {(row.sous_categories || []).map((sc) => sc.nom).join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {editById[row.id] ? (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(row.id)}
                            disabled={savingId === row.id}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelEdit(row.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(row.id)}
                            disabled={savingId === row.id}
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Sous-catégories</h2>
        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-5">
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie parente *</label>
            <select
              value={newSubCategory.categorie}
              onChange={(e) => setNewSubCategory((prev) => ({ ...prev, categorie: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Choisir</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom *</label>
            <input
              type="text"
              value={newSubCategory.nom}
              onChange={(e) => setNewSubCategory((prev) => ({ ...prev, nom: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <input
              type="text"
              value={newSubCategory.description}
              onChange={(e) => setNewSubCategory((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-1 flex items-end justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={newSubCategory.est_active}
                onChange={(e) => setNewSubCategory((prev) => ({ ...prev, est_active: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600"
              />
              Active
            </label>
            <button
              type="button"
              onClick={handleCreateSubCategory}
              disabled={creating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Nom</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Catégorie</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Active</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {subCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Aucune sous-catégorie.
                  </td>
                </tr>
              ) : (
                subCategories.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-slate-600">{row.id}</td>
                    <td className="px-4 py-3 text-slate-900">
                      {editSubById[row.id] ? (
                        <input
                          type="text"
                          value={editSubById[row.id].nom}
                          onChange={(e) =>
                            setEditSubById((prev) => ({ ...prev, [row.id]: { ...prev[row.id], nom: e.target.value } }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      ) : row.nom}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {editSubById[row.id] ? (
                        <select
                          value={editSubById[row.id].categorie}
                          onChange={(e) =>
                            setEditSubById((prev) => ({ ...prev, [row.id]: { ...prev[row.id], categorie: e.target.value } }))
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.nom}</option>
                          ))}
                        </select>
                      ) : (row.categorie_nom || '—')}
                    </td>
                    <td className="px-4 py-3">
                      {editSubById[row.id] ? (
                        <input
                          type="checkbox"
                          checked={editSubById[row.id].est_active}
                          onChange={(e) =>
                            setEditSubById((prev) => ({ ...prev, [row.id]: { ...prev[row.id], est_active: e.target.checked } }))
                          }
                          className="rounded border-slate-300 text-indigo-600"
                        />
                      ) : (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.est_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {row.est_active ? 'Oui' : 'Non'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editSubById[row.id] ? (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveSubEdit(row.id)}
                            disabled={savingId === row.id}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelSubEdit(row.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => startSubEdit(row)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubCategory(row.id)}
                            disabled={savingId === row.id}
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default ManageCategories;
