import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiKey, FiMail, FiShield } from 'react-icons/fi';
import AuthLayout from '../components/auth/AuthLayout';
import AuthError from '../components/auth/AuthError';
import { inputWithIconClass, labelClass, primaryBtnClass } from '../components/auth/authUi';
import authService from '../services/authService';
import { COUNTRY } from '../pays';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Email requis');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.requestPasswordReset(email.trim());
      const msg =
        data.message ||
        'Si un compte existe pour cet email, un code de réinitialisation a été envoyé.';
      setInfo(data.dev_code ? `${msg} Code (dev) : ${data.dev_code}` : msg);
      navigate('/reset-password', {
        state: { email: email.trim(), devCode: data.dev_code || '' },
      });
    } catch (err) {
      setError(err.message || 'Demande impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Sécurité"
      title="Mot de passe oublié"
      description="Recevez un code de réinitialisation pour retrouver l’accès à votre compte."
      formTitle="Réinitialisation"
      formSubtitle="Indiquez l’email associé à votre compte."
      features={[
        {
          icon: FiShield,
          title: 'Procédure sécurisée',
          description: 'Un code à usage unique, valable 30 minutes.',
        },
        {
          icon: FiKey,
          title: 'Nouveau mot de passe',
          description: 'Choisissez un mot de passe d’au moins 8 caractères.',
        },
      ]}
      alternateLink={
        <p className="text-sm text-slate-600">
          Vous vous souvenez de votre mot de passe ?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Se connecter
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
              placeholder={`vous@${COUNTRY.email_domain_example || 'exemple.tg'}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
            />
          </div>
        </div>

        <AuthError message={error} />
        {info ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 whitespace-pre-line">
            {info}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={primaryBtnClass}>
          {loading ? (
            'Envoi en cours…'
          ) : (
            <>
              Envoyer le code
              <FiArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
