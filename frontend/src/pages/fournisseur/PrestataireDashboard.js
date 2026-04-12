import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import prestationsService from '../../services/prestationsService';
import categoriesService from '../../services/categoriesService';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiDollarSign, FiStar, FiTrendingUp, FiBriefcase, FiCalendar, FiClock, FiActivity, FiArrowUp, FiArrowDown, FiFileText } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const PrestataireDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [prestations, setPrestations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrestations: 0,
    prestationsActives: 0,
    totalTransactions: 0,
    noteMoyenne: 0,
    revenuTotal: 0
  });

  const calculateStats = useCallback((prestationsList) => {
    const total = prestationsList.length;
    const actives = prestationsList.filter(p => p.statut === 'active').length;
    const noteMoyenne = prestationsList.reduce((acc, p) => acc + (p.note || 0), 0) / total || 0;
    const revenuTotal = prestationsList.reduce((acc, p) => acc + (p.tarif_max || 0), 0);
    
    setStats({
      totalPrestations: total,
      prestationsActives: actives,
      totalTransactions: Math.floor(Math.random() * 20) + 5, // Simulé
      noteMoyenne: noteMoyenne.toFixed(1),
      revenuTotal: revenuTotal
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('PrestataireDashboard - user:', user);
      console.log('PrestataireDashboard - user type:', user?.type_utilisateur);
      
      // Récupérer les prestations du prestataire
      const prestationsData = await prestationsService.getMyPrestations();
      console.log('PrestataireDashboard - prestationsData:', prestationsData);
      setPrestations(prestationsData.results || prestationsData);
      
      // Récupérer les catégories
      const categoriesData = await categoriesService.getAllCategories();
      console.log('PrestataireDashboard - categoriesData:', categoriesData);
      setCategories(categoriesData);
      
      // Calculer les statistiques
      calculateStats(prestationsData.results || prestationsData);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, [user, calculateStats]);

  useEffect(() => {
    // Vérification des permissions
    if (!isAuthenticated || user?.type_utilisateur !== 'prestataire') {
      navigate('/login');
      return;
    }

    fetchData();
  }, [isAuthenticated, user, navigate, fetchData]);

  // Données pour les graphiques
  const statusData = [
    { name: 'Actives', value: stats.prestationsActives, color: '#10B981' },
    { name: 'Inactives', value: stats.totalPrestations - stats.prestationsActives, color: '#EF4444' }
  ];

  const monthlyData = [
    { month: 'Jan', prestations: 4, revenus: 250000 },
    { month: 'Fev', prestations: 6, revenus: 380000 },
    { month: 'Mar', prestations: 8, revenus: 520000 },
    { month: 'Avr', prestations: 5, revenus: 310000 },
    { month: 'Mai', prestations: 9, revenus: 580000 },
    { month: 'Jun', prestations: 7, revenus: 450000 }
  ];

  const categoriesData = categories.slice(0, 5).map(cat => ({
    name: cat.nom,
    count: prestations.filter(p => p.categorie === cat.id).length
  }));

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
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Prestataire</h1>
            <p className="text-gray-600 mt-1">Bienvenue, {user?.first_name || user?.username}</p>
          </div>
          <Link
            to="/prestataire/creer-prestation"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Nouvelle Prestation
          </Link>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Mes Prestations</p>
              <p className="text-3xl font-bold mt-2">{stats.totalPrestations}</p>
              <div className="flex items-center mt-2 text-sm">
                <FiArrowUp className="mr-1" />
                <span>{stats.prestationsActives} actives</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiBriefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Transactions</p>
              <p className="text-3xl font-bold mt-2">{stats.totalTransactions}</p>
              <div className="flex items-center mt-2 text-sm">
                <FiTrendingUp className="mr-1" />
                <span>Ce mois</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Note Moyenne</p>
              <p className="text-3xl font-bold mt-2">{stats.noteMoyenne}/5</p>
              <div className="flex items-center mt-2 text-sm">
                <FiStar className="mr-1" />
                <span>Excellente</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiStar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Revenu Potentiel</p>
              <p className="text-3xl font-bold mt-2">{stats.revenuTotal.toLocaleString()} FCFA</p>
              <div className="flex items-center mt-2 text-sm">
                <FiArrowUp className="mr-1" />
                <span>Total</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de statut des prestations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des Prestations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique des revenus mensuels */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenus Mensuels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} FCFA`, 'Revenu']} />
              <Area type="monotone" dataKey="revenus" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prestations récentes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mes Prestations Récentes</h3>
          <Link
            to="/prestataire/mes-prestations"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Voir tout
          </Link>
        </div>
        <div className="space-y-4">
          {prestations.slice(0, 5).map((prestation) => (
            <div key={prestation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiBriefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{prestation.intitule}</p>
                  <p className="text-sm text-gray-500">{prestation.type_prestation}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{prestation.tarif_min?.toLocaleString()} - {prestation.tarif_max?.toLocaleString()} FCFA</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  prestation.statut === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {prestation.statut}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/prestataire/creer-prestation"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FiPlus className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Créer une Prestation</p>
              <p className="text-sm text-gray-500">Ajouter un nouveau service</p>
            </div>
          </Link>
          
          <Link
            to="/prestataire/mes-prestations"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FiBriefcase className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Mes Prestations</p>
              <p className="text-sm text-gray-500">Gérer mes services</p>
            </div>
          </Link>
          
          <Link
            to="/prestataire/demandes"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <FiFileText className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Demandes Disponibles</p>
              <p className="text-sm text-gray-500">Voir les opportunités</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrestataireDashboard;
