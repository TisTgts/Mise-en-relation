import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

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
  const demoAccounts = [
    { label: 'Admin', email: 'admin@demo.local', password: 'demo1234' },
    { label: 'Client', email: 'client@demo.local', password: 'demo1234' },
    { label: 'Fournisseur', email: 'fournisseur@demo.local', password: 'demo1234' }
  ];

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
      const result = await login(formData.email.trim(), formData.password);
      if (result.success) {
        const userType = result.user?.type_utilisateur;
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
      } else {
        setError(result.error || 'Email ou mot de passe incorrect');
      }
    } catch (_error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        <aside className="hidden bg-gradient-to-br from-indigo-700 to-blue-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-indigo-100">
              Plateforme Burkina Faso
            </p>
            <h1 className="text-4xl font-bold leading-tight">
              Reprenez vos collaborations là où vous les avez laissées.
            </h1>
            <p className="mt-4 max-w-md text-indigo-100">
              Connectez-vous pour gérer vos besoins, vos prestations et vos discussions client-fournisseur.
            </p>
          </div>
          <div className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <FiShield className="mt-0.5 h-5 w-5 text-indigo-100" />
              <div>
                <p className="font-semibold">Accès sécurisé</p>
                <p className="text-sm text-indigo-100">Authentification JWT et rôles séparés.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiArrowRight className="mt-0.5 h-5 w-5 text-indigo-100" />
              <div>
                <p className="font-semibold">Navigation rapide</p>
                <p className="text-sm text-indigo-100">Redirection automatique selon votre profil.</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex items-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Connexion</h2>
              <p className="mt-2 text-sm text-slate-600">Accédez à votre espace personnel.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiMail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="exemple@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center rounded-xl border border-red-200 bg-red-50 p-3">
                  <FiAlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>

              <p className="text-center text-sm text-slate-600">
                Pas encore de compte ?{' '}
                <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Créer un compte
                </Link>
              </p>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Comptes de test (clic pour remplir)
              </p>
              <div className="space-y-2 text-xs text-slate-700">
                {demoAccounts.map((account) => (
                  <button
                    key={account.label}
                    type="button"
                    onClick={() => setFormData({ email: account.email, password: account.password })}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <p><span className="font-semibold">{account.label} :</span> {account.email}</p>
                    <p><span className="font-semibold">Mot de passe :</span> {account.password}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
