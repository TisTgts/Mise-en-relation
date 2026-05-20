import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import AuthError from '../components/auth/AuthError';
import { inputWithIconClass, labelClass, primaryBtnClass } from '../components/auth/authUi';

const DEMO_PASSWORD = 'demo1234';

const DEMO_ACCOUNT_GROUPS = [
  {
    role: 'Administrateurs',
    tone: 'bg-violet-50 border-violet-200 hover:border-violet-300',
    accounts: [
      { label: 'Mamadou Kaboré', email: 'admin@demo.local' },
      { label: 'Salimata Ouédraogo', email: 'admin2@demo.local' },
    ],
  },
  {
    role: 'Clients',
    tone: 'bg-blue-50 border-blue-200 hover:border-blue-300',
    accounts: [
      { label: 'Ibrahim Zongo', email: 'client@demo.local' },
      { label: 'Aïssata Traoré', email: 'client2@demo.local' },
      { label: 'Moussa Compaoré', email: 'client_bulk_03@demo.local' },
      { label: 'Aminata Savadogo', email: 'client_bulk_04@demo.local' },
      { label: 'Issa Sanou', email: 'client_bulk_05@demo.local' },
      { label: 'Mariam Koné', email: 'client_bulk_06@demo.local' },
    ],
  },
  {
    role: 'Fournisseurs',
    tone: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
    accounts: [
      { label: 'Amadou Sawadogo', email: 'fournisseur@demo.local' },
      { label: 'Fatou Bance (Presta SARL)', email: 'contact@presta-sarl.demo' },
      { label: 'Boubacar Zoungrana', email: 'fournisseur_bulk_03@demo.local' },
      { label: 'Clarisse Pare', email: 'fournisseur_bulk_04@demo.local' },
      { label: 'Hamidou Bado', email: 'fournisseur_bulk_05@demo.local' },
      { label: 'Kadidia Somé', email: 'fournisseur_bulk_06@demo.local' },
    ],
  },
];

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const fillDemo = (email) => {
    setFormData({ email, password: DEMO_PASSWORD });
    setError('');
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
    } catch {
      setError('Erreur de connexion. Vérifiez votre connexion réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Connexion"
      title="Bienvenue sur votre espace"
      description="Connectez-vous pour gérer vos besoins, vos prestations et vos échanges avec vos partenaires."
      formTitle="Connexion"
      formSubtitle="Entrez vos identifiants pour continuer."
      features={[
        {
          icon: FiShield,
          title: 'Accès sécurisé',
          description: 'Authentification protégée et espaces séparés par rôle.',
        },
        {
          icon: FiZap,
          title: 'Redirection intelligente',
          description: 'Accès direct à votre tableau de bord client, fournisseur ou admin.',
        },
        {
          icon: FiUsers,
          title: 'Mise en relation',
          description: 'Clients et prestataires sur une même plateforme.',
        },
      ]}
      alternateLink={
        <p className="text-sm text-slate-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Créer un compte gratuitement
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>
            Adresse email
          </label>
          <div className="relative">
            <FiMail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputWithIconClass}
              placeholder="vous@exemple.bf"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Mot de passe
          </label>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className={`${inputWithIconClass} pr-11`}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AuthError message={error} />

        <button type="submit" disabled={loading} className={primaryBtnClass}>
          {loading ? (
            'Connexion en cours…'
          ) : (
            <>
              Se connecter
              <FiArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
            Comptes de démonstration
          </summary>
          <p className="mt-2 mb-3 text-xs text-slate-500">
            Mot de passe pour tous : <span className="font-mono font-medium text-slate-700">{DEMO_PASSWORD}</span>
            — cliquez sur un compte pour remplir le formulaire.
          </p>
          <div className="max-h-64 space-y-4 overflow-y-auto pr-1">
            {DEMO_ACCOUNT_GROUPS.map((group) => (
              <div key={group.role}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{group.role}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.accounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillDemo(account.email)}
                      className={`rounded-lg border p-2.5 text-left text-xs transition ${group.tone}`}
                    >
                      <p className="font-semibold text-slate-800">{account.label}</p>
                      <p className="mt-0.5 truncate text-slate-600">{account.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </AuthLayout>
  );
};

export default Login;
