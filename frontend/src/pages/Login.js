import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiBriefcase, FiShield, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Connexion réussie, redirection...');
        console.log('User data:', result.user);
        console.log('Token received:', result.token ? 'Yes' : 'No');
        
        // Attendre un peu pour que le contexte soit mis à jour
        setTimeout(() => {
          // Rediriger selon le type d'utilisateur
          const userType = result.user?.type_utilisateur;
          console.log('User type for redirection:', userType);
          
          switch (userType) {
            case 'administrateur':
              navigate('/admin/dashboard');
              break;
            case 'fournisseur':
              navigate('/fournisseur/dashboard');
              break;
            case 'client':
              navigate('/client/dashboard');
              break;
            default:
              navigate('/dashboard');
          }
        }, 500);
      } else {
        setError(result.error || 'Email ou mot de passe incorrect');
      }
    } catch (error) {
      setError('Erreur de connexion');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Colonne gauche - Design */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Plateforme de Mise en Relation
            </h1>
            <p className="text-xl text-blue-100">
              Connectez les prestataires de services avec les clients pour des collaborations efficaces
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiUser className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Gestion des Utilisateurs</h3>
                <p className="text-blue-100 text-sm">Administrez prestataires et fournisseurs</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiBriefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Services Professionnels</h3>
                <p className="text-blue-100 text-sm">Accédez à des services qualifiés</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiShield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Sécurité Garantie</h3>
                <p className="text-blue-100 text-sm">Plateforme sécurisée et fiable</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-blue-400">
            <p className="text-blue-100 text-sm">
              © 2026 Plateforme de Mise en Relation. Tous droits réservés.
            </p>
          </div>
        </div>
        
        {/* Éléments décoratifs */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
      </div>

      {/* Colonne droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <FiUser className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Connexion
            </h2>
            <p className="text-gray-600">
              Accédez à votre espace personnel
            </p>
          </div>

          {/* Formulaire */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="exemple@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <button 
                  type="button"
                  onClick={() => console.log('Mot de passe oublié')}
                  className="font-medium text-primary-600 hover:text-primary-500 bg-transparent border-none cursor-pointer transition-colors"
                >
                  Mot de passe oublié?
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <FiAlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Bouton de connexion */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion en cours...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>

            {/* Lien d'inscription */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte?{' '}
                <Link 
                  to="/register" 
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </form>

          {/* Infos de connexion rapide */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-4">
              Comptes de test disponibles
            </p>
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">Admin:</span> admin@miseenrelation.bf / admin123
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">Prestataire:</span> transporteur1@example.com / password123
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="font-medium">Fournisseur:</span> entreprise1@example.com / password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
