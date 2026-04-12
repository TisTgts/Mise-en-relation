import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import { FiFileText, FiUsers, FiBriefcase, FiTrendingUp, FiDollarSign, FiSettings, FiBarChart, FiActivity, FiCalendar, FiDownload, FiRefreshCw, FiArrowUp, FiArrowDown, FiUser, FiShoppingCart, FiCreditCard } from 'react-icons/fi';
import Toast from '../../components/Toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    users: {},
    prestations: {},
    demandes: {},
    transactions: {},
    categories: {},
    recent_activity: {},
    monthly_revenue: [],
    top_prestataires: [],
    top_categories: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Vérification des permissions
    if (!isAuthenticated || user?.type_utilisateur !== 'administrateur') {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('AdminDashboard - user:', user);
      
      const data = await adminService.getDetailedStatistics();
      console.log('AdminDashboard - stats data:', data);
      setStats(data);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données');
      setToast({
        message: 'Erreur lors du chargement des données du tableau de bord',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    setToast({
      message: 'Données actualisées avec succès',
      type: 'success'
    });
  };

  const handleExport = async () => {
    try {
      const data = await adminService.exportData();
      // Créer un blob et télécharger
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setToast({
        message: 'Export des données réussi',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: 'Erreur lors de l\'export des données',
        type: 'error'
      });
    }
  };

  // Données pour les graphiques
  const userDistributionData = [
    { name: 'Prestataires', value: stats.users?.prestataires || 0, color: '#3B82F6' },
    { name: 'Fournisseurs', value: stats.users?.fournisseurs || 0, color: '#10B981' },
    { name: 'Administrateurs', value: stats.users?.administrateurs || 0, color: '#8B5CF6' }
  ];

  const servicesData = [
    { name: 'Prestations', value: stats.prestations?.total_prestations || 0, color: '#3B82F6' },
    { name: 'Demandes', value: stats.demandes?.total_demandes || 0, color: '#10B981' }
  ];

  const revenueData = stats.monthly_revenue?.map(item => ({
    month: item.month,
    revenue: item.revenue || 0
  })) || [];

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

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
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble de la plateforme</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiDownload className="mr-2" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Utilisateurs</p>
              <p className="text-3xl font-bold mt-2">{stats.users?.total_users || 0}</p>
              <div className="flex items-center mt-2 text-sm">
                <FiArrowUp className="mr-1" />
                <span>{stats.users?.active_users || 0} actifs</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Prestations</p>
              <p className="text-3xl font-bold mt-2">{stats.prestations?.total_prestations || 0}</p>
              <div className="flex items-center mt-2 text-sm">
                <FiArrowUp className="mr-1" />
                <span>{stats.prestations?.active_prestations || 0} actives</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiBriefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Demandes</p>
              <p className="text-3xl font-bold mt-2">{stats.demandes?.total_demandes || 0}</p>
              <div className="flex items-center mt-2 text-sm">
                <FiArrowUp className="mr-1" />
                <span>{stats.demandes?.ouvertes_demandes || 0} ouvertes</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Revenus</p>
              <p className="text-3xl font-bold mt-2">{(stats.transactions?.total_revenu || 0).toLocaleString()} FCFA</p>
              <div className="flex items-center mt-2 text-sm">
                <FiTrendingUp className="mr-1" />
                <span>{stats.transactions?.total_transactions || 0} transactions</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de distribution des utilisateurs */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des Utilisateurs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique des services */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={servicesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique des revenus mensuels */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Revenus Mensuels</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value.toLocaleString()} FCFA`, 'Revenu']} />
            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top prestataires et catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top prestataires */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Prestataires</h3>
          <div className="space-y-3">
            {stats.top_prestataires?.slice(0, 5).map((prestataire, index) => (
              <div key={prestataire.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{prestataire.name}</p>
                    <p className="text-sm text-gray-500">{prestataire.raison_sociale}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{prestataire.prestation_count}</p>
                  <p className="text-sm text-gray-500">prestations</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top catégories */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Catégories</h3>
          <div className="space-y-3">
            {stats.top_categories?.slice(0, 5).map((categorie, index) => (
              <div key={categorie.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{categorie.nom}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{categorie.prestation_count}</p>
                  <p className="text-sm text-gray-500">prestations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FiUsers className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Gérer les Utilisateurs</p>
              <p className="text-sm text-gray-500">Ajouter, modifier, supprimer</p>
            </div>
          </Link>
          
          <Link
            to="/admin/services"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FiBriefcase className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Gérer les Services</p>
              <p className="text-sm text-gray-500">Prestations et demandes</p>
            </div>
          </Link>
          
          <Link
            to="/admin/categories"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <FiSettings className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Gérer les Catégories</p>
              <p className="text-sm text-gray-500">Organiser les services</p>
            </div>
          </Link>
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

export default AdminDashboard;
