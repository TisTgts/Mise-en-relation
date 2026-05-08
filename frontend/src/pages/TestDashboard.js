import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestDashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg">Non authentifié</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tableau de bord Test</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Informations utilisateur</h2>
              <div className="space-y-2 text-blue-700">
                <p><strong>ID:</strong> {user?.id || 'N/A'}</p>
                <p><strong>Nom:</strong> {user?.first_name || 'N/A'} {user?.last_name || ''}</p>
                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                <p><strong>Type:</strong> {user?.user_type || 'N/A'}</p>
                <p><strong>Téléphone:</strong> {user?.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-2">État de l'authentification</h2>
              <div className="space-y-2 text-green-700">
                <p><strong>Authentifié:</strong> {isAuthenticated ? 'Oui' : 'Non'}</p>
                <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Présent' : 'Absent'}</p>
                <p><strong>User Type:</strong> {localStorage.getItem('user_type') || 'Non défini'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions de test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/fournisseur/dashboard'}
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard Fournisseur
            </button>
            <button 
              onClick={() => window.location.href = '/client/dashboard'}
              className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Dashboard Client
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user_type');
                window.location.href = '/login';
              }}
              className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Debug Information</h2>
          <div className="bg-gray-100 rounded-lg p-4">
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {JSON.stringify({ user, isAuthenticated, loading }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;
