import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLoader } from 'react-icons/fi';

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (user && !loading) {
      switch (user.type_utilisateur) {
        case 'fournisseur':
          navigate('/fournisseur/dashboard');
          break;
        case 'client':
          navigate('/client/dashboard');
          break;
        case 'super_admin':
          navigate('/super-admin/dashboard');
          break;
        case 'administrateur':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/login');
      }
    }
  }, [user, loading, navigate, isAuthenticated]);

  // Afficher un loader pendant la redirection
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiLoader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est authentifié mais en attente de redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FiLoader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirection vers votre tableau de bord...</p>
      </div>
    </div>
  );
};

export default Dashboard;
