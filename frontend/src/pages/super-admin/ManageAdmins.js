import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiShield,
  FiPlus,
  FiRefreshCw,
  FiUserPlus,
  FiUserX,
  FiSearch,
  FiMail,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import adminService from '../../services/adminService';
import superAdminService from '../../services/superAdminService';
import Toast from '../../components/Toast';
import { roleLabel } from '../../utils/roles';

const roleBadge = (type) => {
  switch (type) {
    case 'super_admin':
      return 'bg-fuchsia-100 text-fuchsia-800';
    case 'administrateur':
      return 'bg-violet-100 text-violet-800';
    case 'fournisseur':
      return 'bg-emerald-100 text-emerald-800';
    case 'client':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const iconBtn =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const emptyForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  telephone: '',
  type_utilisateur: 'administrateur',
  password: '',
};

const ManageAdmins = () => {
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();
  const [admins, setAdmins] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const [promoteSearch, setPromoteSearch] = useState('');

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [adminsData, usersData] = await Promise.all([
        superAdminService.getAdmins(),
        adminService.getAllUsers().catch(() => []),
      ]);
      setAdmins(adminsData);
      setAllUsers(Array.isArray(usersData) ? usersData : (usersData.results || []));
    } catch (e) {
      setToast({ message: e.message || 'Chargement impossible.', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => ({
    superAdmins: admins.filter((a) => a.type_utilisateur === 'super_admin').length,
    admins: admins.filter((a) => a.type_utilisateur === 'administrateur').length,
    actifs: admins.filter((a) => a.is_active).length,
  }), [admins]);

  const promotionCandidates = useMemo(() => {
    const q = promoteSearch.trim().toLowerCase();
    if (!q) return [];
    return allUsers
      .filter((u) => !['administrateur', 'super_admin'].includes(u.type_utilisateur))
      .filter((u) =>
        (u.first_name || '').toLowerCase().includes(q) ||
        (u.last_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q))
      .slice(0, 6);
  }, [allUsers, promoteSearch]);

  const displayName = (u) =>
    [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email;

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setFormError('Nom d\'utilisateur, email et mot de passe sont obligatoires.');
      return;
    }
    setCreating(true);
    try {
      await superAdminService.createAdmin(form);
      setToast({ message: `Compte ${roleLabel(form.type_utilisateur)} créé.`, type: 'success' });
      setShowCreate(false);
      setForm(emptyForm);
      load(true);
    } catch (err) {
      setFormError(err.message || 'Création impossible.');
    } finally {
      setCreating(false);
    }
  };

  const changeRole = async (u, newRole, label) => {
    const ok = await confirm({
      title: label,
      message: `${displayName(u)} deviendra « ${roleLabel(newRole)} ».`,
      tone: newRole === 'client' ? 'warning' : 'default',
      confirmLabel: 'Confirmer',
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      await superAdminService.setUserRole(u.id, newRole);
      setToast({ message: `${displayName(u)} est désormais ${roleLabel(newRole)}.`, type: 'success' });
      load(true);
    } catch (err) {
      setToast({ message: err.message || 'Modification impossible.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const promoteUser = async (u) => {
    const ok = await confirm({
      title: 'Promouvoir en administrateur ?',
      message: `${displayName(u)} (${roleLabel(u.type_utilisateur)}) obtiendra les droits d'administration.`,
      confirmLabel: 'Promouvoir',
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      await superAdminService.setUserRole(u.id, 'administrateur');
      setToast({ message: `${displayName(u)} est désormais administrateur.`, type: 'success' });
      setPromoteSearch('');
      load(true);
    } catch (err) {
      setToast({ message: err.message || 'Promotion impossible.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (u) => {
    setBusyId(u.id);
    try {
      const res = await superAdminService.toggleStatus(u.id);
      setToast({ message: res.message || 'Statut mis à jour.', type: 'success' });
      load(true);
    } catch (err) {
      setToast({ message: err.message || 'Changement de statut impossible.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">
              <FiShield className="h-3.5 w-3.5" />
              Super administration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Gestion des administrateurs</h1>
            <p className="mt-1 text-sm text-slate-600">
              Créez des comptes d'administration, attribuez ou retirez des droits.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              type="button"
              onClick={() => { setForm(emptyForm); setFormError(''); setShowCreate(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700"
            >
              <FiPlus className="h-4 w-4" />
              Nouvel administrateur
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Super admins', value: counts.superAdmins, tone: 'bg-fuchsia-100 text-fuchsia-700' },
          { label: 'Administrateurs', value: counts.admins, tone: 'bg-violet-100 text-violet-700' },
          { label: 'Actifs', value: counts.actifs, tone: 'bg-emerald-100 text-emerald-700' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${s.tone}`}>
                <FiShield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promotion d'un utilisateur existant */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Promouvoir un utilisateur existant</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Recherchez un client ou fournisseur pour lui accorder les droits d'administrateur.
        </p>
        <div className="relative mt-3">
          <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={promoteSearch}
            onChange={(e) => setPromoteSearch(e.target.value)}
            placeholder="Nom, email, username…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
          />
        </div>
        {promoteSearch.trim() && (
          <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {promotionCandidates.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">Aucun utilisateur correspondant.</p>
            ) : (
              promotionCandidates.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{displayName(u)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {u.email} · <span className={`rounded px-1.5 py-0.5 ${roleBadge(u.type_utilisateur)}`}>{roleLabel(u.type_utilisateur)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => promoteUser(u)}
                    disabled={busyId === u.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    <FiArrowUp className="h-3.5 w-3.5" />
                    Promouvoir admin
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Table des administrateurs */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {admins.length} compte{admins.length !== 1 ? 's' : ''} d'administration
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Compte</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Rôle</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((a) => {
                const isSelf = a.id === currentUser?.id;
                const isBusy = busyId === a.id;
                return (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-100 to-violet-100 text-sm font-semibold text-fuchsia-800">
                          {(a.first_name?.[0] || a.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {displayName(a)}{isSelf && <span className="ml-1 text-xs text-fuchsia-600">(vous)</span>}
                          </p>
                          <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                            <FiMail className="h-3 w-3" />{a.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge(a.type_utilisateur)}`}>
                        <FiShield className="h-3 w-3" />
                        {roleLabel(a.type_utilisateur)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {a.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.type_utilisateur === 'administrateur' && (
                          <button
                            type="button"
                            onClick={() => changeRole(a, 'super_admin', 'Promouvoir super administrateur ?')}
                            disabled={isBusy}
                            className={`${iconBtn} border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50`}
                            title="Promouvoir super administrateur"
                          >
                            <FiArrowUp className="h-4 w-4" />
                          </button>
                        )}
                        {a.type_utilisateur === 'super_admin' && !isSelf && (
                          <button
                            type="button"
                            onClick={() => changeRole(a, 'administrateur', 'Rétrograder en administrateur ?')}
                            disabled={isBusy}
                            className={`${iconBtn} border-violet-200 text-violet-700 hover:bg-violet-50`}
                            title="Rétrograder en administrateur"
                          >
                            <FiArrowDown className="h-4 w-4" />
                          </button>
                        )}
                        {!isSelf && (
                          <>
                            <button
                              type="button"
                              onClick={() => changeRole(a, 'client', 'Retirer les droits d\'administration ?')}
                              disabled={isBusy}
                              className={`${iconBtn} border-slate-200 text-slate-600 hover:bg-slate-50`}
                              title="Retirer les droits (repasser client)"
                            >
                              <FiArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStatus(a)}
                              disabled={isBusy}
                              className={`${iconBtn} ${a.is_active ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                              title={a.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {a.is_active ? <FiUserX className="h-4 w-4" /> : <FiUserPlus className="h-4 w-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          role="presentation"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl" role="dialog">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Nouveau compte</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Créer un administrateur</h2>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className={`${iconBtn} border-slate-200 text-slate-600 hover:bg-slate-50`} title="Fermer">
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 px-5 py-4">
              {formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Prénom</label>
                  <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Nom</label>
                  <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nom d'utilisateur *</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Téléphone</label>
                <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Rôle</label>
                  <select value={form.type_utilisateur} onChange={(e) => setForm({ ...form, type_utilisateur: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500">
                    <option value="administrateur">Administrateur</option>
                    <option value="super_admin">Super administrateur</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Mot de passe *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-9 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Afficher / masquer">
                      {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={creating} className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50">
                  {creating ? 'Création…' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ManageAdmins;
