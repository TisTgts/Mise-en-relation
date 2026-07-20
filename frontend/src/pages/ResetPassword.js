import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEye, FiEyeOff, FiHash, FiLock, FiMail, FiShield } from 'react-icons/fi';
import AuthLayout from '../components/auth/AuthLayout';
import AuthError from '../components/auth/AuthError';
import { inputWithIconClass, labelClass, primaryBtnClass } from '../components/auth/authUi';
import authService from '../services/authService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState(location.state?.devCode || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email requis');
      return;
    }
    if (!code.trim()) {
      setError('Code requis');
      return;
    }
    if (password.length < 8) {
      setError('Mot de passe : 8 caractères minimum');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.confirmPasswordReset(email.trim(), code.trim(), password);
      setSuccess(data.message || 'Mot de passe mis à jour.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || 'Réinitialisation impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Sécurité"
      title="Nouveau mot de passe"
      description="Saisissez le code reçu puis définissez votre nouveau mot de passe."
      formTitle="Nouveau mot de passe"
      formSubtitle="Le code expire après 30 minutes."
      features={[
        {
          icon: FiShield,
          title: 'Code à usage unique',
          description: 'Une fois utilisé, le code ne peut plus servir.',
        },
      ]}
      alternateLink={
        <p className="text-sm text-slate-600">
          Pas de code ?{' '}
          <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Demander un nouveau code
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
              type="email"
              autoComplete="email"
              required
              className={inputWithIconClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="code" className={labelClass}>
            Code
          </label>
          <div className="relative">
            <FiHash className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className={inputWithIconClass}
              placeholder="6 chiffres"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Nouveau mot de passe
          </label>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`${inputWithIconClass} pr-11`}
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="passwordConfirm" className={labelClass}>
            Confirmer
          </label>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="passwordConfirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={inputWithIconClass}
              placeholder="Répétez le mot de passe"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>
        </div>

        <AuthError message={error} />
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={primaryBtnClass}>
          {loading ? (
            'Enregistrement…'
          ) : (
            <>
              Enregistrer
              <FiArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
