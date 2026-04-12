import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiSearch, FiFilter, FiEdit, FiTrash2, FiEye, FiMail, FiPhone, FiBriefcase, FiShield, FiUserPlus, FiUserX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';

const ManageUsers = () => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Debug logs au début du composant
  console.log('ManageUsers - component render - user:', user);
  console.log('ManageUsers - component render - isAuthenticated:', isAuthenticated);
  console.log('ManageUsers - component render - user type:', user?.type_utilisateur);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        console.log('ManageUsers - user:', user);
        
        // Vérifier le token
        const token = localStorage.getItem('access_token');
        console.log('ManageUsers - token exists:', !!token);
        console.log('ManageUsers - token length:', token?.length);
        
        // Utiliser le service admin pour récupérer les utilisateurs
        const data = await adminService.getAllUsers();
        console.log('ManageUsers - users data:', data);
        console.log('ManageUsers - users count:', data.results?.length || data.length);
        setUsers(data.results || data);
        
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        setToast({
          message: 'Erreur lors du chargement des utilisateurs',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.type_utilisateur === 'administrateur') {
      console.log('ManageUsers - fetching users for admin');
      fetchUsers();
    } else {
      console.log('ManageUsers - user is not admin:', user?.type_utilisateur);
      setLoading(false);
    }
  }, [user]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.raison_sociale?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'prestataire') return user.type_utilisateur === 'prestataire' && matchesSearch;
    if (filter === 'fournisseur') return user.type_utilisateur === 'fournisseur' && matchesSearch;
    if (filter === 'administrateur') return user.type_utilisateur === 'administrateur' && matchesSearch;
    if (filter === 'active') return user.is_active && matchesSearch;
    if (filter === 'inactive') return !user.is_active && matchesSearch;
    
    return matchesSearch;
  });

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserStatus(userId);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));
      setToast({
        message: `Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`,
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setToast({
        message: 'Erreur lors de la mise à jour du statut',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setToast({
        message: 'Utilisateur supprimé avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        message: 'Erreur lors de la suppression de l\'utilisateur',
        type: 'error'
      });
    }
  };

  const getUserTypeColor = (type) => {
    switch (type) {
      case 'prestataire': return 'bg-green-100 text-green-800';
      case 'fournisseur': return 'bg-blue-100 text-blue-800';
      case 'administrateur': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (type) => {
    switch (type) {
      case 'prestataire': return FiBriefcase;
      case 'fournisseur': return FiUsers;
      case 'administrateur': return FiShield;
      default: return FiUsers;
    }
  };

  const stats = {
    total: users.length,
    prestataires: users.filter(u => u.type_utilisateur === 'prestataire').length,
    fournisseurs: users.filter(u => u.type_utilisateur === 'fournisseur').length,
    administrateurs: users.filter(u => u.type_utilisateur === 'administrateur').length,
    actifs: users.filter(u => u.is_active).length
  };

  // Debug logs
  console.log('ManageUsers - current users state:', users);
  console.log('ManageUsers - filtered users count:', filteredUsers.length);
  console.log('ManageUsers - stats:', stats);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-1">Gérez tous les utilisateurs de la plateforme</p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full">
              <FiUsers className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full">
              <FiBriefcase className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Prestataires</p>
              <p className="text-xl font-semibold text-gray-900">{stats.prestataires}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full">
              <FiUsers className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Fournisseurs</p>
              <p className="text-xl font-semibold text-gray-900">{stats.fournisseurs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full">
              <FiShield className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-xl font-semibold text-gray-900">{stats.administrateurs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full">
              <FiUserPlus className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-xl font-semibold text-gray-900">{stats.actifs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtre
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="prestataire">Prestataires</option>
              <option value="fournisseur">Fournisseurs</option>
              <option value="administrateur">Administrateurs</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Liste des utilisateurs</h2>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              {users.length === 0 ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur correspondant aux filtres'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'inscription
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => {
                  const UserTypeIcon = getUserTypeIcon(userItem.type_utilisateur);
                  return (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {userItem.first_name?.[0] || userItem.email?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.first_name} {userItem.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userItem.raison_sociale || userItem.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserTypeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeColor(userItem.type_utilisateur)}`}>
                            {adminService.formatUserType(userItem.type_utilisateur)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <FiMail className="h-4 w-4 mr-1 text-gray-400" />
                            {userItem.email}
                          </div>
                          {userItem.telephone && (
                            <div className="flex items-center text-gray-500">
                              <FiPhone className="h-4 w-4 mr-1" />
                              {userItem.telephone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {userItem.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {adminService.formatDate(userItem.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(userItem.id, userItem.is_active)}
                            className={`inline-flex items-center px-3 py-1 border text-xs font-medium rounded-md ${
                              userItem.is_active
                                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                            }`}
                            title={userItem.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {userItem.is_active ? <FiUserX className="h-3 w-3" /> : <FiUserPlus className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem.id)}
                            className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                            title="Supprimer"
                          >
                            <FiTrash2 className="h-3 w-3" />
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

export default ManageUsers;
