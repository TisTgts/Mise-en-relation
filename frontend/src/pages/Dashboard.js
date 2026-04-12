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
    console.log('Dashboard useEffect - user:', user);
    console.log('Dashboard useEffect - isAuthenticated:', isAuthenticated);
    console.log('Dashboard useEffect - loading:', loading);
    
    if (user && !loading) {
      console.log('User authenticated, redirecting based on type:', user.type_utilisateur);
      // Rediriger selon le type d'utilisateur avec les nouvelles routes
      switch (user.type_utilisateur) {
        case 'prestataire':
          console.log('Redirecting to fournisseur dashboard');
          navigate('/fournisseur/dashboard');
          break;
        case 'fournisseur':
          console.log('Redirecting to client dashboard');
          navigate('/client_dashboard');
          break;
        case 'administrateur':
          console.log('Redirecting to admin dashboard');
          navigate('/admin/dashboard');
          break;
        default:
          console.log('Unknown user type, redirecting to login');
          navigate('/login');
      }
    }
  }, [user, loading, navigate]);

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
