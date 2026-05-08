import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight, FiCheckCircle, FiLock, FiMail, FiPhone, FiUser, FiUsers } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: 'client',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'fournisseur' || t === 'client') {
      setFormData((prev) => ({ ...prev, userType: t }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        username: formData.email, // Utiliser l'email comme username
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        telephone: formData.phone,
        type_utilisateur: formData.userType,
        password: formData.password,
        password_confirm: formData.confirmPassword
      };

      const result = await register(userData);
      if (result.success) {
        navigate('/login');
      } else {
        setError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = 'block w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <aside className="rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-800 p-8 text-white shadow-sm">
          <p className="inline-flex rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-indigo-100">
            Demarrage
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight">Créez votre compte et lancez vos premiers échanges.</h1>
          <p className="mt-4 text-indigo-100">
            Choisissez votre rôle, complétez votre profil, puis commencez à publier ou répondre aux besoins.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-4">
              <FiUsers className="mt-0.5 h-5 w-5 text-indigo-100" />
              <div>
                <p className="font-semibold">Rôles séparés</p>
                <p className="text-sm text-indigo-100">Client ou fournisseur selon votre activité.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-4">
              <FiCheckCircle className="mt-0.5 h-5 w-5 text-indigo-100" />
              <div>
                <p className="font-semibold">Parcours simple</p>
                <p className="text-sm text-indigo-100">Inscription rapide puis redirection vers l’espace adapté.</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <h2 className="text-3xl font-bold text-slate-900">Créer un compte</h2>
            <p className="mt-2 text-sm text-slate-600">
              Déjà inscrit ?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Se connecter
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">Prénom</label>
                <div className="relative">
                  <FiUser className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="firstName" name="firstName" type="text" autoComplete="given-name" required className={`${inputClassName} pl-9`} placeholder="Prénom" value={formData.firstName} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
                <div className="relative">
                  <FiUser className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="lastName" name="lastName" type="text" autoComplete="family-name" required className={`${inputClassName} pl-9`} placeholder="Nom" value={formData.lastName} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Adresse email</label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input id="email" name="email" type="email" autoComplete="email" required className={`${inputClassName} pl-9`} placeholder="adresse@email.com" value={formData.email} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
              <div className="relative">
                <FiPhone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input id="phone" name="phone" type="tel" autoComplete="tel" className={`${inputClassName} pl-9`} placeholder="+226 xx xx xx xx" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label htmlFor="userType" className="mb-2 block text-sm font-medium text-slate-700">Type d&apos;utilisateur</label>
              <select id="userType" name="userType" required className={inputClassName} value={formData.userType} onChange={handleChange}>
                <option value="client">Client — je cherche des prestataires</option>
                <option value="fournisseur">Fournisseur — je propose des services</option>
              </select>
              {(searchParams.get('type') === 'client' || searchParams.get('type') === 'fournisseur') && (
                <p className="mt-2 text-xs text-slate-500">Profil présélectionné depuis la page d&apos;accueil — vous pouvez le modifier.</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="password" name="password" type="password" autoComplete="new-password" required className={`${inputClassName} pl-9`} placeholder="Mot de passe" value={formData.password} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">Confirmer</label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={`${inputClassName} pl-9`} placeholder="Confirmer" value={formData.confirmPassword} onChange={handleChange} />
                </div>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{loading ? 'Inscription en cours...' : "S'inscrire"}</span>
              {!loading && <FiArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Register;
