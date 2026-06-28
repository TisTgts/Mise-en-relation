import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiUsers,
  FiSearch,
  FiTrash2,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiShield,
  FiUserPlus,
  FiUserX,
  FiStar,
  FiRefreshCw,
  FiInfo,
  FiX,
  FiCalendar,
  FiClock,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';

const FILTER_OPTIONS = [
  { id: 'all', label: 'Tous' },
  { id: 'client', label: 'Clients' },
  { id: 'fournisseur', label: 'Fournisseurs' },
  { id: 'administrateur', label: 'Admins' },
  { id: 'client_premium', label: 'Clients Premium' },
  { id: 'active', label: 'Actifs' },
  { id: 'inactive', label: 'Inactifs' },
];

const getUserTypeColor = (type) => {
  switch (type) {
    case 'fournisseur':
      return 'bg-emerald-100 text-emerald-800';
    case 'client':
      return 'bg-indigo-100 text-indigo-800';
    case 'administrateur':
      return 'bg-violet-100 text-violet-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const getUserTypeIcon = (type) => {
  switch (type) {
    case 'fournisseur':
      return FiBriefcase;
    case 'client':
      return FiUsers;
    case 'administrateur':
      return FiShield;
    default:
      return FiUsers;
  }
};

const formatJoinedDate = (userItem) => {
  const raw = userItem.date_joined || userItem.created_at;
  if (!raw) return '—';
  return adminService.formatDate(raw);
};

const isClientPremium = (userItem) =>
  userItem.client_matching_self_service === true ||
  userItem.matching_self_service === true ||
  (userItem.client_abonnement_type === 'premium' && userItem.client_abonnement_actif === true);

const iconBtnClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const ManageUsers = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [premiumConfirm, setPremiumConfirm] = useState(null);

  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data.results || data);
    } catch {
      setToast({ message: 'Impossible de charger les utilisateurs.', type: 'error' });
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.type_utilisateur === 'administrateur') {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [user, loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        (u.first_name || '').toLowerCase().includes(q) ||
        (u.last_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.raison_sociale || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      switch (filter) {
        case 'fournisseur':
          return u.type_utilisateur === 'fournisseur';
        case 'client':
          return u.type_utilisateur === 'client';
        case 'administrateur':
          return u.type_utilisateur === 'administrateur';
        case 'client_premium':
          return u.type_utilisateur === 'client' && isClientPremium(u);
        case 'active':
          return u.is_active;
        case 'inactive':
          return !u.is_active;
        default:
          return true;
      }
    });
  }, [users, searchTerm, filter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      fournisseurs: users.filter((u) => u.type_utilisateur === 'fournisseur').length,
      clients: users.filter((u) => u.type_utilisateur === 'client').length,
      clientsPremium: users.filter((u) => u.type_utilisateur === 'client' && isClientPremium(u)).length,
      administrateurs: users.filter((u) => u.type_utilisateur === 'administrateur').length,
      actifs: users.filter((u) => u.is_active).length,
    }),
    [users]
  );

  const getUserDisplayName = (userItem) =>
    [userItem.first_name, userItem.last_name].filter(Boolean).join(' ') ||
    userItem.username ||
    userItem.email ||
    'Client';

  const requestPremiumChange = (userItem) => {
    if (userItem.type_utilisateur !== 'client') return;
    if (!userItem.is_active) {
      setToast({
        message: 'Activez d’abord le compte client avant de modifier le statut Premium.',
        type: 'warning',
      });
      return;
    }
    setPremiumConfirm({
      user: userItem,
      deactivate: isClientPremium(userItem),
    });
  };

  const confirmPremiumChange = async () => {
    if (!premiumConfirm) return;
    const userItem = premiumConfirm.user;
    const isPremium = premiumConfirm.deactivate;
    setPremiumConfirm(null);
    setBusyId(userItem.id);
    setBusyAction('premium');
    try {
      const updated = await adminService.updateUser(userItem.id, {
        client_abonnement_type: isPremium ? 'standard' : 'premium',
        client_abonnement_actif: !isPremium,
      });
      setUsers((prev) => prev.map((u) => (u.id === userItem.id ? { ...u, ...updated } : u)));
      setDetailUser((prev) => (prev?.id === userItem.id ? { ...prev, ...updated } : prev));
      setToast({
        message: isPremium
          ? 'Client repassé en Standard — matching lancé par l’admin uniquement.'
          : 'Client Premium activé — matching autonome autorisé.',
        type: 'success',
      });
    } catch {
      setToast({ message: 'Modification du statut Premium impossible.', type: 'error' });
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setBusyId(userId);
    setBusyAction('status');
    try {
      await adminService.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
      setDetailUser((prev) =>
        prev?.id === userId ? { ...prev, is_active: !currentStatus } : prev
      );
      setToast({
        message: !currentStatus ? 'Utilisateur activé.' : 'Utilisateur désactivé.',
        type: 'success',
      });
    } catch {
      setToast({ message: 'Mise à jour du statut impossible.', type: 'error' });
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    const ok = await confirm({
      title: 'Désactiver cet utilisateur ?',
      message: 'Il ne pourra plus se connecter (suppression douce, réversible).',
      tone: 'warning',
      confirmLabel: 'Désactiver',
    });
    if (!ok) return;
    setBusyId(userId);
    setBusyAction('delete');
    try {
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setToast({ message: 'Utilisateur désactivé.', type: 'success' });
    } catch {
      setToast({ message: 'Suppression impossible.', type: 'error' });
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  if (user?.type_utilisateur !== 'administrateur') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <FiShield className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 text-sm text-slate-600">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Administration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Utilisateurs</h1>
            <p className="mt-1 text-sm text-slate-600">
              Comptes, statuts et option Premium matching pour les clients.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadUsers(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </header>

      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        <FiInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Client Standard</strong> : consulte les correspondances lancées par l’admin.{' '}
          <strong>Client Premium</strong> : peut lancer le matching de ses besoins lui-même.
          Activez Premium via le bouton étoile (<FiStar className="inline h-3.5 w-3.5" />) dans les actions, ou depuis le détail (
          <FiInfo className="inline h-3.5 w-3.5" />
          ).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total', value: stats.total, icon: FiUsers, tone: 'text-slate-600 bg-slate-100' },
          { label: 'Clients', value: stats.clients, icon: FiUsers, tone: 'text-indigo-600 bg-indigo-100' },
          {
            label: 'Premium',
            value: stats.clientsPremium,
            icon: FiStar,
            tone: 'text-amber-600 bg-amber-100',
          },
          {
            label: 'Fournisseurs',
            value: stats.fournisseurs,
            icon: FiBriefcase,
            tone: 'text-emerald-600 bg-emerald-100',
          },
          {
            label: 'Admins',
            value: stats.administrateurs,
            icon: FiShield,
            tone: 'text-violet-600 bg-violet-100',
          },
          {
            label: 'Actifs',
            value: stats.actifs,
            icon: FiUserPlus,
            tone: 'text-emerald-600 bg-emerald-100',
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recherche
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, email, username, raison sociale…"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-slate-500">
            {users.length === 0
              ? 'Aucun utilisateur enregistré.'
              : 'Aucun résultat pour cette recherche ou ce filtre.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Utilisateur</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Compte</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((userItem) => {
                  const UserTypeIcon = getUserTypeIcon(userItem.type_utilisateur);
                  const isBusy = busyId === userItem.id;
                  const displayName =
                    [userItem.first_name, userItem.last_name].filter(Boolean).join(' ') ||
                    userItem.username ||
                    '—';

                  return (
                    <tr key={userItem.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-semibold text-indigo-800">
                            {(userItem.first_name?.[0] || userItem.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{displayName}</p>
                            <p className="truncate text-xs text-slate-500">
                              @{userItem.username}
                              {userItem.raison_sociale ? ` · ${userItem.raison_sociale}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getUserTypeColor(userItem.type_utilisateur)}`}
                        >
                          <UserTypeIcon className="h-3 w-3" />
                          {adminService.formatUserType(userItem.type_utilisateur)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-xs">
                          <p className="flex items-center gap-1 text-slate-800">
                            <FiMail className="h-3.5 w-3.5 text-slate-400" />
                            {userItem.email}
                          </p>
                          {userItem.telephone && (
                            <p className="flex items-center gap-1 text-slate-500">
                              <FiPhone className="h-3.5 w-3.5 text-slate-400" />
                              {userItem.telephone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            userItem.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {userItem.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailUser(userItem)}
                            className={`${iconBtnClass} border-indigo-200 text-indigo-700 hover:bg-indigo-50`}
                            title="Détails de l'utilisateur"
                            aria-label="Détails de l'utilisateur"
                          >
                            <FiInfo className="h-4 w-4" />
                          </button>
                          {userItem.type_utilisateur === 'client' && (
                            <button
                              type="button"
                              onClick={() => requestPremiumChange(userItem)}
                              disabled={isBusy || !userItem.is_active}
                              className={`${iconBtnClass} ${
                                isClientPremium(userItem)
                                  ? 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                              }`}
                              title={
                                !userItem.is_active
                                  ? 'Compte inactif — activez-le d’abord'
                                  : isClientPremium(userItem)
                                    ? 'Retirer le Premium (Standard)'
                                    : 'Passer en client Premium'
                              }
                              aria-label={
                                isClientPremium(userItem)
                                  ? 'Retirer le Premium'
                                  : 'Activer Premium'
                              }
                            >
                              {isBusy && busyAction === 'premium' ? (
                                <span className="text-xs">…</span>
                              ) : (
                                <FiStar
                                  className={`h-4 w-4 ${isClientPremium(userItem) ? 'fill-current' : ''}`}
                                />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(userItem.id, userItem.is_active)}
                            disabled={isBusy}
                            className={`${iconBtnClass} ${
                              userItem.is_active
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={userItem.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                            aria-label={userItem.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                          >
                            {isBusy && busyAction === 'status' ? (
                              <span className="text-xs">…</span>
                            ) : userItem.is_active ? (
                              <FiUserX className="h-4 w-4" />
                            ) : (
                              <FiUserPlus className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(userItem.id)}
                            disabled={isBusy}
                            className={`${iconBtnClass} border-slate-200 text-slate-600 hover:bg-slate-50`}
                            title="Supprimer le compte"
                            aria-label="Supprimer le compte"
                          >
                            {isBusy && busyAction === 'delete' ? (
                              <span className="text-xs">…</span>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
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

      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setDetailUser(null)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            role="dialog"
            aria-labelledby="user-detail-title"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Détail utilisateur
                </p>
                <h2 id="user-detail-title" className="mt-1 text-lg font-bold text-slate-900">
                  {[detailUser.first_name, detailUser.last_name].filter(Boolean).join(' ') ||
                    detailUser.username}
                </h2>
                <p className="text-sm text-slate-500">@{detailUser.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className={`${iconBtnClass} border-slate-200 text-slate-600 hover:bg-slate-50`}
                title="Fermer"
                aria-label="Fermer"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-medium text-slate-900">
                    {adminService.formatUserType(detailUser.type_utilisateur)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">Compte</p>
                  <p className="font-medium text-slate-900">
                    {detailUser.is_active ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-2 text-slate-800">
                  <FiMail className="h-4 w-4 text-slate-400" />
                  {detailUser.email || '—'}
                </p>
                <p className="flex items-center gap-2 text-slate-800">
                  <FiPhone className="h-4 w-4 text-slate-400" />
                  {detailUser.telephone || '—'}
                </p>
                {detailUser.raison_sociale && (
                  <p className="flex items-center gap-2 text-slate-800">
                    <FiBriefcase className="h-4 w-4 text-slate-400" />
                    {detailUser.raison_sociale}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <FiCalendar className="h-3.5 w-3.5" />
                    Inscription
                  </p>
                  <p className="mt-1 font-medium text-slate-900">{formatJoinedDate(detailUser)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <FiClock className="h-3.5 w-3.5" />
                    Dernière connexion
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {detailUser.last_login ? formatJoinedDate({ date_joined: detailUser.last_login }) : 'Jamais'}
                  </p>
                </div>
              </div>

              {detailUser.type_utilisateur === 'client' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Matching autonome
                  </p>
                  <p className="mt-1 text-sm text-amber-950">
                    {isClientPremium(detailUser)
                      ? 'Premium — le client peut lancer le matching de ses besoins.'
                      : 'Standard — seul l’administrateur lance le matching.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => requestPremiumChange(detailUser)}
                    disabled={
                      (busyId === detailUser.id && busyAction === 'premium') || !detailUser.is_active
                    }
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                      isClientPremium(detailUser)
                        ? 'bg-slate-700 text-white hover:bg-slate-800'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    <FiStar className="h-3.5 w-3.5" />
                    {busyId === detailUser.id && busyAction === 'premium'
                      ? 'Mise à jour…'
                      : isClientPremium(detailUser)
                        ? 'Repasser en Standard'
                        : 'Activer Premium'}
                  </button>
                  {!detailUser.is_active && (
                    <p className="mt-2 text-xs text-amber-800">Activez le compte pour modifier le statut Premium.</p>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-400">ID utilisateur : #{detailUser.id}</p>
            </div>
          </div>
        </div>
      )}

      {premiumConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
          onClick={(e) => e.target === e.currentTarget && setPremiumConfirm(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
            role="alertdialog"
            aria-labelledby="premium-confirm-title"
            aria-describedby="premium-confirm-desc"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-full p-2 ${
                    premiumConfirm.deactivate ? 'bg-slate-100' : 'bg-amber-100'
                  }`}
                >
                  <FiStar
                    className={`h-5 w-5 ${
                      premiumConfirm.deactivate ? 'text-slate-600' : 'fill-amber-500 text-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <h2 id="premium-confirm-title" className="text-lg font-bold text-slate-900">
                    {premiumConfirm.deactivate
                      ? 'Retirer le statut Premium ?'
                      : 'Activer le compte Premium ?'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {getUserDisplayName(premiumConfirm.user)}
                    {premiumConfirm.user.email ? ` · ${premiumConfirm.user.email}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div id="premium-confirm-desc" className="space-y-3 px-5 py-4 text-sm text-slate-700">
              {premiumConfirm.deactivate ? (
                <>
                  <p>Ce client repassera en compte <strong>Standard</strong>.</p>
                  <ul className="list-disc space-y-1 pl-5 text-slate-600">
                    <li>Il ne pourra plus lancer le matching de ses besoins lui-même.</li>
                    <li>Seul l’administrateur pourra déclencher les correspondances.</li>
                    <li>Il pourra toujours consulter les matchs déjà calculés.</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>Ce client obtiendra un compte <strong>Premium</strong>.</p>
                  <ul className="list-disc space-y-1 pl-5 text-slate-600">
                    <li>Il pourra lancer et recalculer le matching de ses besoins ouverts.</li>
                    <li>Il accède aux mêmes correspondances qu’un client Standard une fois calculées.</li>
                    <li>Cette action est réservée aux clients de confiance ou sous contrat Premium.</li>
                  </ul>
                </>
              )}
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Confirmez uniquement si vous avez vérifié l’identité du client et l’accord commercial
                le cas échéant.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setPremiumConfirm(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmPremiumChange}
                disabled={busyId === premiumConfirm.user.id && busyAction === 'premium'}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  premiumConfirm.deactivate
                    ? 'bg-slate-700 hover:bg-slate-800'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {premiumConfirm.deactivate ? 'Confirmer le passage Standard' : 'Confirmer Premium'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default ManageUsers;
