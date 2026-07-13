import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './PageLoader';

// Composant pour protéger les routes selon le type d'utilisateur
const ProtectedRoute = ({ children, allowedTypes }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Si le chargement est en cours, afficher un loader
  if (loading) {
    return <PageLoader minHeight="min-h-screen" />;
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si des types spécifiques sont requis et que l'utilisateur n'est pas autorisé
  if (allowedTypes && !allowedTypes.includes(user?.type_utilisateur)) {
    // Rediriger vers le dashboard approprié
    switch (user?.type_utilisateur) {
      case 'fournisseur':
        return <Navigate to="/fournisseur/dashboard" replace />;
      case 'client':
        return <Navigate to="/client/dashboard" replace />;
      case 'super_admin':
        return <Navigate to="/super-admin/dashboard" replace />;
      case 'administrateur':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Si tout est bon, afficher le composant enfant
  return children;
};

// Composants spécialisés pour chaque type
export const FournisseurRoute = ({ children }) => (
  <ProtectedRoute allowedTypes={['fournisseur']}>
    {children}
  </ProtectedRoute>
);

export const ClientRoute = ({ children }) => (
  <ProtectedRoute allowedTypes={['client']}>
    {children}
  </ProtectedRoute>
);

// L'espace admin est accessible aux administrateurs ET aux super administrateurs
// (le super admin hérite de toutes les fonctions de l'admin).
export const AdministrateurRoute = ({ children }) => (
  <ProtectedRoute allowedTypes={['administrateur', 'super_admin']}>
    {children}
  </ProtectedRoute>
);

// Espace réservé au super administrateur uniquement.
export const SuperAdminRoute = ({ children }) => (
  <ProtectedRoute allowedTypes={['super_admin']}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
