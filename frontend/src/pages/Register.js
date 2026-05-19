import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiLayers,
  FiLock,
  FiMail,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import categoriesService from '../services/categoriesService';
import prestationsService from '../services/prestationsService';

const emptyPrestationLine = () => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  categorieId: '',
  sousCategorieId: '',
  intitule: '',
  description: '',
});

/** Villes / zones prédéfinies pour la couverture (sélection multiple). */
const ZONES_COUVERTURE_OPTIONS = [
  'Ouagadougou',
  'Bobo-Dioulasso',
  'Koudougou',
  'Ouahigouya',
  'Banfora',
  'Kaya',
  'Dédougou',
  "Fada N'Gourma",
];

const Register = () => {
  const [phase, setPhase] = useState('choose-type');
  const [userType, setUserType] = useState('client');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [prestationLines, setPrestationLines] = useState([emptyPrestationLine()]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [profilFournisseur, setProfilFournisseur] = useState({
    raison_sociale: '',
    /** Noms de villes cochées (liste prédéfinie), envoyés dans `zones_couverture`. */
    zones_couverture: [],
  });

  /** Position GPS (WGS84) : envoyée uniquement dans `emplacement`, sans modifier `zones_couverture`. */
  const [geoPosition, setGeoPosition] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, token } = useAuth();

  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'fournisseur' || t === 'client') {
      setUserType(t);
    }
  }, [searchParams]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await categoriesService.getCategoriesActives();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Impossible de charger les catégories. Réessayez plus tard.');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (phase === 'fournisseur-prestations' && categories.length === 0 && !categoriesLoading) {
      loadCategories();
    }
  }, [phase, categories.length, categoriesLoading, loadCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const selectAccountType = (type) => {
    setUserType(type);
    setError('');
    if (type === 'client') {
      setFormData((p) => ({ ...p, password: '', confirmPassword: '' }));
      setPhase('client-step1');
    } else {
      setPhase('account');
    }
  };

  const goBackToTypeChoice = () => {
    setPhase('choose-type');
    setError('');
  };

  const goBackToClientStep1 = () => {
    setPhase('client-step1');
    setError('');
    setFormData((p) => ({ ...p, password: '', confirmPassword: '' }));
  };

  const submitClientStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (!formData.email.trim()) {
      setError('L’adresse email est obligatoire.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Adresse email invalide.');
      return;
    }
    setPhase('client-step2');
  };

  const clearGeolocation = () => {
    setGeoPosition(null);
    setGeoMessage('');
  };

  const toggleZoneCouverture = (nom) => {
    setProfilFournisseur((p) => {
      const set = new Set(p.zones_couverture || []);
      if (set.has(nom)) set.delete(nom);
      else set.add(nom);
      return { ...p, zones_couverture: [...set] };
    });
    if (error) setError('');
  };

  const requestGeolocation = () => {
    setGeoMessage('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoMessage('La géolocalisation n’est pas disponible sur ce navigateur.');
      return;
    }
    if (window.isSecureContext === false) {
      setGeoMessage('La géolocalisation nécessite une connexion sécurisée (HTTPS), sauf en localhost.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGeoPosition({
          latitude,
          longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          capturedAt: new Date().toISOString(),
        });
        setGeoMessage('Position enregistrée (champ séparé des zones texte, enregistrée dans le profil).');
        setGeoLoading(false);
      },
      (err) => {
        const codes = {
          1: 'Accès à la position refusé. Autorisez la localisation dans les paramètres du navigateur.',
          2: 'Position indisponible pour le moment.',
          3: 'Délai dépassé. Réessayez ou vérifiez le signal GPS.',
        };
        setGeoMessage(codes[err.code] || 'Impossible d’obtenir la position.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const updateLine = (key, patch) => {
    setPrestationLines((rows) =>
      rows.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        if (patch.categorieId !== undefined && patch.categorieId !== row.categorieId) {
          next.sousCategorieId = '';
          next.intitule = '';
        }
        return next;
      })
    );
    if (error) setError('');
  };

  const addPrestationLine = () => {
    setPrestationLines((rows) => [...rows, emptyPrestationLine()]);
  };

  const removePrestationLine = (key) => {
    setPrestationLines((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)));
  };

  const getCategory = (id) => categories.find((c) => String(c.id) === String(id));
  const getSousCategorieNom = (cat, sousId) => {
    const list = cat?.sous_categories || [];
    const sc = list.find((s) => String(s.id) === String(sousId));
    return sc?.nom || '';
  };

  const submitClientStep2 = async (e) => {
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
        username: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        telephone: formData.phone,
        type_utilisateur: 'client',
        password: formData.password,
        password_confirm: formData.confirmPassword,
      };

      const result = await register(userData);
      if (!result.success) {
        setError(result.error || "Erreur lors de l'inscription");
        setLoading(false);
        return;
      }

      if (result.access) {
        localStorage.setItem('access_token', result.access);
        if (result.refresh) localStorage.setItem('refresh_token', result.refresh);
        if (result.user?.type_utilisateur) {
          localStorage.setItem('type_utilisateur', result.user.type_utilisateur);
        }
      }

      navigate('/client/dashboard');
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const submitAccountFournisseur = async (e) => {
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
        username: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        telephone: formData.phone,
        type_utilisateur: 'fournisseur',
        password: formData.password,
        password_confirm: formData.confirmPassword,
      };

      const result = await register(userData);
      if (!result.success) {
        setError(result.error || "Erreur lors de l'inscription");
        setLoading(false);
        return;
      }

      if (result.access) {
        localStorage.setItem('access_token', result.access);
        if (result.refresh) localStorage.setItem('refresh_token', result.refresh);
        if (result.user?.type_utilisateur) {
          localStorage.setItem('type_utilisateur', result.user.type_utilisateur);
        }
      }

      setPhase('fournisseur-prestations');
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const submitPrestations = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const tokenNow = token || localStorage.getItem('access_token');
    if (!tokenNow) {
      setError('Session expirée. Reconnectez-vous.');
      setLoading(false);
      return;
    }

    for (const row of prestationLines) {
      if (!row.categorieId || !row.sousCategorieId || !row.intitule.trim() || !row.description.trim()) {
        setError('Remplissez chaque prestation : catégorie, sous-catégorie, intitulé et description.');
        setLoading(false);
        return;
      }
    }

    const tokensProfil = [];
    for (const row of prestationLines) {
      const cat = getCategory(row.categorieId);
      if (!cat) continue;
      const sousNom = getSousCategorieNom(cat, row.sousCategorieId);
      if (cat.nom) tokensProfil.push(cat.nom);
      if (sousNom) tokensProfil.push(sousNom);
    }
    const types_services_offerts = [...new Set(tokensProfil.map((t) => t.trim()).filter(Boolean))];

    try {
      const patchProfil = await fetch(API_ENDPOINTS.USER.PROFILE, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${tokenNow}`,
        },
        body: JSON.stringify({ types_services_offerts }),
      });
      if (!patchProfil.ok) {
        const d = await patchProfil.json().catch(() => ({}));
        setError(d.detail || d.message || "Impossible d'enregistrer vos types de services.");
        setLoading(false);
        return;
      }

      for (const row of prestationLines) {
        const cat = getCategory(row.categorieId);
        const sousNom = getSousCategorieNom(cat, row.sousCategorieId);
        const payload = {
          categorie: Number(row.categorieId),
          sous_categorie: Number(row.sousCategorieId),
          intitule: row.intitule.trim(),
          description: row.description.trim(),
          type_prestation: sousNom || row.intitule.trim(),
          caracteristiques: {},
          zones_intervention: [],
          mode_tarification: 'devis',
        };
        await prestationsService.createPrestation(payload);
      }

      setPhase('fournisseur-profil');
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement des prestations.");
    } finally {
      setLoading(false);
    }
  };

  const submitProfilFournisseur = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const tokenNow = token || localStorage.getItem('access_token');
    if (!tokenNow) {
      setError('Session expirée. Reconnectez-vous.');
      setLoading(false);
      return;
    }

    const zones_couverture = Array.isArray(profilFournisseur.zones_couverture)
      ? [...profilFournisseur.zones_couverture]
      : [];

    try {
      const body = {
        raison_sociale: profilFournisseur.raison_sociale.trim(),
        zones_couverture,
      };
      if (geoPosition) {
        body.emplacement = {
          latitude: geoPosition.latitude,
          longitude: geoPosition.longitude,
          source: 'browser_geolocation',
          captured_at: geoPosition.capturedAt,
        };
        if (geoPosition.accuracy != null && Number.isFinite(geoPosition.accuracy)) {
          body.emplacement.accuracy = Math.round(geoPosition.accuracy);
        }
      }
      const res = await fetch(API_ENDPOINTS.USER.PROFILE, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${tokenNow}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || d.message || 'Impossible de finaliser le profil.');
        setLoading(false);
        return;
      }
      navigate('/fournisseur/dashboard');
    } catch (err) {
      setError(err.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    'block w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

  const fournisseurStepIndex =
    phase === 'account' ? 1 : phase === 'fournisseur-prestations' ? 2 : phase === 'fournisseur-profil' ? 3 : 0;

  const clientStepIndex = phase === 'client-step1' ? 1 : phase === 'client-step2' ? 2 : 0;

  const mapPreviewUrl =
    geoPosition &&
    `https://www.openstreetmap.org/export/embed.html?bbox=${geoPosition.longitude - 0.02}%2C${geoPosition.latitude - 0.02}%2C${geoPosition.longitude + 0.02}%2C${geoPosition.latitude + 0.02}&layer=mapnik&marker=${geoPosition.latitude}%2C${geoPosition.longitude}`;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <aside className="rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-800 p-8 text-white shadow-sm">
          <p className="inline-flex rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-indigo-100">
            Inscription
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight">Un parcours clair, adapté à votre rôle.</h1>
          <p className="mt-4 text-indigo-100">
            Choisissez le type de compte, puis suivez les étapes : client en deux temps, fournisseur en trois temps
            avec prestations et finalisation.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-4">
              <FiLayers className="mt-0.5 h-5 w-5 text-indigo-100" />
              <div>
                <p className="font-semibold">Étapes modulaires</p>
                <p className="text-sm text-indigo-100">Moins de charge cognitive, champs regroupés par intention.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-4">
              <FiCheckCircle className="mt-0.5 h-5 w-5 text-indigo-100" />
              <div>
                <p className="font-semibold">Client en 2 étapes</p>
                <p className="text-sm text-indigo-100">Identité et contact, puis mot de passe et validation.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 p-4">
              <FiCheckCircle className="mt-0.5 h-5 w-5 text-indigo-100" />
              <div>
                <p className="font-semibold">Fournisseur en 3 temps</p>
                <p className="text-sm text-indigo-100">Compte, prestations liées au catalogue, puis finalisation.</p>
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

          {(phase === 'client-step1' || phase === 'client-step2') && (
            <div className="mb-8 flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              {[1, 2].map((n) => (
                <div key={n} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      clientStepIndex === n
                        ? 'bg-indigo-600 text-white'
                        : clientStepIndex > n
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {clientStepIndex > n ? '✓' : n}
                  </span>
                  <span className="hidden text-center text-[10px] font-medium text-slate-600 sm:block">
                    {n === 1 ? 'Identité' : 'Sécurité'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {userType === 'fournisseur' && phase !== 'choose-type' && (
            <div className="mb-8 flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      fournisseurStepIndex === n
                        ? 'bg-indigo-600 text-white'
                        : fournisseurStepIndex > n
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {fournisseurStepIndex > n ? '✓' : n}
                  </span>
                  <span className="hidden text-center text-[10px] font-medium text-slate-600 sm:block">
                    {n === 1 ? 'Compte' : n === 2 ? 'Prestations' : 'Finalisation'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {phase === 'choose-type' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600">Sélectionnez le type de compte pour continuer.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => selectAccountType('client')}
                  className={`flex flex-col items-start gap-3 rounded-2xl border-2 p-6 text-left transition hover:border-indigo-400 hover:bg-indigo-50/40 ${
                    userType === 'client' ? 'border-indigo-600 bg-indigo-50/60' : 'border-slate-200'
                  }`}
                >
                  <FiShoppingBag className="h-8 w-8 text-indigo-600" />
                  <span className="text-lg font-bold text-slate-900">Client</span>
                  <span className="text-sm text-slate-600">Je publie des besoins et je choisis des prestataires.</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectAccountType('fournisseur')}
                  className={`flex flex-col items-start gap-3 rounded-2xl border-2 p-6 text-left transition hover:border-indigo-400 hover:bg-indigo-50/40 ${
                    userType === 'fournisseur' ? 'border-indigo-600 bg-indigo-50/60' : 'border-slate-200'
                  }`}
                >
                  <FiBriefcase className="h-8 w-8 text-indigo-600" />
                  <span className="text-lg font-bold text-slate-900">Fournisseur</span>
                  <span className="text-sm text-slate-600">Je propose des prestations et je réponds aux besoins.</span>
                </button>
              </div>
              {(searchParams.get('type') === 'client' || searchParams.get('type') === 'fournisseur') && (
                <p className="text-xs text-slate-500">
                  Une suggestion de profil vient de la page d&apos;accueil — vous pouvez choisir l&apos;autre type
                  ci-dessus.
                </p>
              )}
            </div>
          )}

          {phase === 'client-step1' && (
            <form className="space-y-5" onSubmit={submitClientStep1}>
              <button
                type="button"
                onClick={goBackToTypeChoice}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <FiArrowLeft className="h-4 w-4" />
                Changer le type de compte
              </button>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-900">
                <strong>Étape 1 sur 2</strong> — Identité et contact
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">
                    Prénom
                  </label>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      className={`${inputClassName} pl-9`}
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">
                    Nom
                  </label>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      className={`${inputClassName} pl-9`}
                      placeholder="Nom"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Adresse email
                </label>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`${inputClassName} pl-9`}
                    placeholder="adresse@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                  Téléphone
                </label>
                <div className="relative">
                  <FiPhone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className={`${inputClassName} pl-9`}
                    placeholder="+226 xx xx xx xx"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center rounded-xl border border-red-200 bg-red-50 p-3">
                  <FiAlertCircle className="mr-2 h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <span>Continuer</span>
                <FiArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {phase === 'client-step2' && (
            <form className="space-y-5" onSubmit={submitClientStep2}>
              <button
                type="button"
                onClick={goBackToClientStep1}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <FiArrowLeft className="h-4 w-4" />
                Modifier mes informations
              </button>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-900">
                <strong>Étape 2 sur 2</strong> — Sécurité du compte
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">
                  {formData.firstName} {formData.lastName}
                </p>
                <p className="mt-1 text-slate-600">{formData.email}</p>
                {formData.phone && <p className="mt-1 text-slate-600">{formData.phone}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`${inputClassName} pl-9`}
                      placeholder="Mot de passe"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    Confirmer
                  </label>
                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`${inputClassName} pl-9`}
                      placeholder="Confirmer"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center rounded-xl border border-red-200 bg-red-50 p-3">
                  <FiAlertCircle className="mr-2 h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Inscription…' : "S'inscrire"}</span>
                {!loading && <FiArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          {phase === 'account' && (
            <form className="space-y-5" onSubmit={submitAccountFournisseur}>
              <button
                type="button"
                onClick={goBackToTypeChoice}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                <FiArrowLeft className="h-4 w-4" />
                Changer le type de compte
              </button>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-900">
                Profil sélectionné : <strong>Fournisseur</strong>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">
                    Prénom
                  </label>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      className={`${inputClassName} pl-9`}
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">
                    Nom
                  </label>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      className={`${inputClassName} pl-9`}
                      placeholder="Nom"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Adresse email
                </label>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`${inputClassName} pl-9`}
                    placeholder="adresse@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                  Téléphone
                </label>
                <div className="relative">
                  <FiPhone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className={`${inputClassName} pl-9`}
                    placeholder="+226 xx xx xx xx"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`${inputClassName} pl-9`}
                      placeholder="Mot de passe"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    Confirmer
                  </label>
                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`${inputClassName} pl-9`}
                      placeholder="Confirmer"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center rounded-xl border border-red-200 bg-red-50 p-3">
                  <FiAlertCircle className="mr-2 h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'En cours...' : 'Créer le compte et continuer'}</span>
                {!loading && <FiArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          {phase === 'fournisseur-prestations' && (
            <form className="space-y-6" onSubmit={submitPrestations}>
              <p className="text-sm text-slate-600">
                Étape 2 — Pour chaque ligne, choisissez une <strong>catégorie</strong> puis une{' '}
                <strong>sous-catégorie</strong>, et décrivez la prestation. Vous pouvez en ajouter plusieurs.
              </p>

              {categoriesLoading && (
                <p className="text-sm text-slate-500">Chargement du catalogue…</p>
              )}

              {!categoriesLoading && categories.length === 0 && (
                <p className="text-sm text-amber-700">
                  Aucune catégorie active n&apos;est disponible. Contactez un administrateur ou réessayez plus tard.
                </p>
              )}

              <div className="space-y-6">
                {prestationLines.map((row, idx) => {
                  const cat = getCategory(row.categorieId);
                  const sousList = cat?.sous_categories || [];
                  return (
                    <div
                      key={row.key}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">Prestation {idx + 1}</span>
                        {prestationLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePrestationLine(row.key)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                            Retirer
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Catégorie</label>
                          <select
                            required
                            className={inputClassName}
                            value={row.categorieId}
                            onChange={(e) => updateLine(row.key, { categorieId: e.target.value })}
                          >
                            <option value="">— Choisir —</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Sous-catégorie</label>
                          <select
                            required
                            disabled={!row.categorieId || sousList.length === 0}
                            className={inputClassName}
                            value={row.sousCategorieId}
                            onChange={(e) => {
                              const sousId = e.target.value;
                              const nomSous = getSousCategorieNom(cat, sousId);
                              updateLine(row.key, {
                                sousCategorieId: sousId,
                                intitule: nomSous ? `${cat?.nom || ''} — ${nomSous}` : row.intitule,
                              });
                            }}
                          >
                            <option value="">
                              {!row.categorieId
                                ? '— Choisir une catégorie —'
                                : sousList.length === 0
                                  ? '— Aucune sous-catégorie —'
                                  : '— Choisir —'}
                            </option>
                            {sousList.map((sc) => (
                              <option key={sc.id} value={sc.id}>
                                {sc.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Intitulé</label>
                          <input
                            type="text"
                            required
                            className={inputClassName}
                            placeholder="Ex. Transport express Ouagadougou"
                            value={row.intitule}
                            onChange={(e) => updateLine(row.key, { intitule: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                          <textarea
                            required
                            rows={3}
                            className={inputClassName}
                            placeholder="Décrivez ce que vous proposez dans cette sous-catégorie."
                            value={row.description}
                            onChange={(e) => updateLine(row.key, { description: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addPrestationLine}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                <FiPlus className="h-4 w-4" />
                Ajouter une autre prestation
              </button>

              {error && (
                <div className="flex items-center rounded-xl border border-red-200 bg-red-50 p-3">
                  <FiAlertCircle className="mr-2 h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || categoriesLoading || categories.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Enregistrement…' : 'Continuer vers la finalisation'}</span>
                {!loading && <FiArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          {phase === 'fournisseur-profil' && (
            <form className="space-y-5" onSubmit={submitProfilFournisseur}>
              <p className="text-sm text-slate-600">
                Étape 3 — Complétez les informations de structure (facultatif mais recommandé). Vous pourrez tout
                modifier depuis votre espace fournisseur.
              </p>

              <div>
                <label htmlFor="raison_sociale" className="mb-2 block text-sm font-medium text-slate-700">
                  Raison sociale ou nom commercial
                </label>
                <input
                  id="raison_sociale"
                  type="text"
                  className={inputClassName}
                  placeholder="Ex. SARL Transport XYZ"
                  value={profilFournisseur.raison_sociale}
                  onChange={(e) =>
                    setProfilFournisseur((p) => ({ ...p, raison_sociale: e.target.value }))
                  }
                />
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <p className="text-sm font-semibold text-slate-900">Zones de couverture</p>
                <p className="mt-1 text-xs text-slate-600">
                  Cochez <strong>toutes les villes</strong> où vous intervenez (ex. Ouagadougou et Bobo-Dioulasso).
                  Indépendant de la géolocalisation ci-dessous.
                </p>
                <fieldset className="mt-4">
                  <legend className="sr-only">Villes couvertes</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ZONES_COUVERTURE_OPTIONS.map((ville) => {
                      const checked = (profilFournisseur.zones_couverture || []).includes(ville);
                      return (
                        <label
                          key={ville}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                            checked
                              ? 'border-indigo-500 bg-white text-indigo-900 shadow-sm'
                              : 'border-slate-200 bg-white/60 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={checked}
                            onChange={() => toggleZoneCouverture(ville)}
                          />
                          <FiMapPin className={`h-4 w-4 shrink-0 ${checked ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{ville}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {(profilFournisseur.zones_couverture || []).length > 0 && (
                  <p className="mt-3 text-xs text-slate-600">
                    Sélection : {(profilFournisseur.zones_couverture || []).join(', ')}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Géolocalisation (à part)</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Point GPS précis de l’appareil (WGS84), enregistré dans <strong>emplacement</strong> du profil —
                      indépendant des zones Ouaga / Bobo, etc. HTTPS ou localhost requis pour le navigateur.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={requestGeolocation}
                      disabled={geoLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      <FiNavigation className="h-4 w-4" />
                      {geoLoading ? 'Localisation…' : 'Utiliser ma position'}
                    </button>
                    {geoPosition && (
                      <button
                        type="button"
                        onClick={clearGeolocation}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Effacer le point GPS
                      </button>
                    )}
                  </div>
                </div>
                {geoMessage && (
                  <p
                    className={`mt-3 text-sm ${geoMessage.includes('refusé') || geoMessage.includes('nécessite') || geoMessage.includes('Impossible') || geoMessage.includes('indisponible') || geoMessage.includes('Délai') ? 'text-amber-800' : 'text-emerald-800'}`}
                  >
                    {geoMessage}
                  </p>
                )}
                {geoPosition && (
                  <div className="mt-4 space-y-3">
                    <dl className="grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-slate-500">Latitude</dt>
                        <dd className="font-mono">{geoPosition.latitude.toFixed(6)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500">Longitude</dt>
                        <dd className="font-mono">{geoPosition.longitude.toFixed(6)}</dd>
                      </div>
                      {geoPosition.accuracy != null && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-slate-500">Précision estimée</dt>
                          <dd>± {Math.round(geoPosition.accuracy)} m</dd>
                        </div>
                      )}
                    </dl>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${geoPosition.latitude}&mlon=${geoPosition.longitude}&zoom=14`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Ouvrir sur OpenStreetMap
                    </a>
                    {mapPreviewUrl && (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <iframe
                          title="Aperçu position"
                          className="h-48 w-full bg-slate-100"
                          src={mapPreviewUrl}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center rounded-xl border border-red-200 bg-red-50 p-3">
                  <FiAlertCircle className="mr-2 h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Finalisation…' : 'Accéder à mon espace'}</span>
                {!loading && <FiArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

export default Register;
