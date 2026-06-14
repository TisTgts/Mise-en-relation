import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiSave, FiCamera, FiPlus, FiX, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../../config/api';
import Toast from '../../../components/Toast';

const authHeadersJson = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

const FREQUENCE_CHOICES = [
  { value: '', label: 'Non renseigné' },
  { value: 'ponctuelle', label: 'Ponctuelle' },
  { value: 'mensuelle', label: 'Mensuelle' },
  { value: 'trimestrielle', label: 'Trimestrielle' },
  { value: 'annuelle', label: 'Annuelle' },
];

const parseApiErrors = (data) => {
  if (!data || typeof data !== 'object') return 'Une erreur est survenue.';
  if (typeof data.detail === 'string') return data.detail;
  const parts = [];
  Object.entries(data).forEach(([key, val]) => {
    if (Array.isArray(val)) parts.push(`${key}: ${val.join(', ')}`);
    else if (val && typeof val === 'object') parts.push(`${key}: ${JSON.stringify(val)}`);
    else if (val) parts.push(`${key}: ${val}`);
  });
  return parts.length ? parts.join(' ') : 'Une erreur est survenue.';
};

const parseEmplacement = (raw) => {
  try {
    const parsed = JSON.parse(raw || '{}');
    const lat = Number(parsed?.latitude);
    const lng = Number(parsed?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      latitude: lat,
      longitude: lng,
      adresse: parsed?.adresse || '',
      ville: parsed?.ville || '',
    };
  } catch {
    return null;
  }
};

const MonProfil = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const isParametres = location.pathname.includes('/parametres');
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [newBesoin, setNewBesoin] = useState('');
  const [newFournisseur, setNewFournisseur] = useState('');
  const [newModePaiement, setNewModePaiement] = useState('');

  const [accountForm, setAccountForm] = useState({
    first_name: '',
    last_name: '',
    telephone: '',
  });

  const [profileForm, setProfileForm] = useState({
    raison_sociale: '',
    secteur_activite: '',
    taille_entreprise: '',
    besoins_services: [],
    fournisseurs_preferes: [],
    plage_budget_min: '',
    plage_budget_max: '',
    frequence_besoins: '',
    contact_principal: '',
    mode_paiement_preferes: [],
    emplacement: '{}',
  });

  const applyProfilePayload = useCallback((data) => {
    const u = data.user || {};
    setAccountForm({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      telephone: u.telephone || '',
    });
    const pb = data.plage_budget && typeof data.plage_budget === 'object' ? data.plage_budget : {};
    setProfileForm({
      raison_sociale: data.raison_sociale || '',
      secteur_activite: data.secteur_activite || '',
      taille_entreprise: data.taille_entreprise || '',
      besoins_services: Array.isArray(data.besoins_services) ? data.besoins_services : [],
      fournisseurs_preferes: Array.isArray(data.fournisseurs_preferes) ? data.fournisseurs_preferes : [],
      plage_budget_min: pb.min != null && pb.min !== '' ? String(pb.min) : '',
      plage_budget_max: pb.max != null && pb.max !== '' ? String(pb.max) : '',
      frequence_besoins: data.frequence_besoins || '',
      contact_principal: data.contact_principal || '',
      mode_paiement_preferes: Array.isArray(data.mode_paiement_preferes) ? data.mode_paiement_preferes : [],
      emplacement: JSON.stringify(data.emplacement && typeof data.emplacement === 'object' ? data.emplacement : {}, null, 2),
    });
  }, []);

  const loadProfile = useCallback(async () => {
    const response = await fetch(API_ENDPOINTS.USER.PROFILE, {
      headers: authHeadersJson(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(parseApiErrors(err));
    }
    const data = await response.json();
    applyProfilePayload(data);
  }, [applyProfilePayload]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Fallback affichage compte si l'API profil repond tardivement.
    setAccountForm((prev) => ({
      ...prev,
      first_name: user.first_name || prev.first_name,
      last_name: user.last_name || prev.last_name,
      telephone: user.telephone || prev.telephone,
    }));
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await loadProfile();
      } catch (e) {
        if (!cancelled) {
          setToast({ message: e.message || 'Erreur lors du chargement du profil', type: 'error' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loadProfile]);

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    setToast(null);
    try {
      let response;
      if (photoFile) {
        const fd = new FormData();
        fd.append('first_name', accountForm.first_name);
        fd.append('last_name', accountForm.last_name);
        fd.append('telephone', accountForm.telephone);
        fd.append('photo_profil', photoFile);
        response = await fetch(API_ENDPOINTS.USER.ME, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          body: fd,
        });
      } else {
        response = await fetch(API_ENDPOINTS.USER.ME, {
          method: 'PATCH',
          headers: authHeadersJson(),
          body: JSON.stringify({
            first_name: accountForm.first_name,
            last_name: accountForm.last_name,
            telephone: accountForm.telephone,
          }),
        });
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(parseApiErrors(data));
      }
      updateUser(data);
      setPhotoFile(null);
      setToast({ message: 'Compte mis à jour.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Erreur lors de la mise à jour du compte', type: 'error' });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setToast(null);
    try {
      const plage = {};
      const minN =
        profileForm.plage_budget_min === '' ? undefined : Number(profileForm.plage_budget_min);
      const maxN =
        profileForm.plage_budget_max === '' ? undefined : Number(profileForm.plage_budget_max);
      if (Number.isFinite(minN)) plage.min = minN;
      if (Number.isFinite(maxN)) plage.max = maxN;
      const body = {
        raison_sociale: profileForm.raison_sociale,
        secteur_activite: profileForm.secteur_activite,
        taille_entreprise: profileForm.taille_entreprise,
        besoins_services: profileForm.besoins_services,
        fournisseurs_preferes: profileForm.fournisseurs_preferes,
        plage_budget: plage,
        frequence_besoins: profileForm.frequence_besoins,
        contact_principal: profileForm.contact_principal,
        mode_paiement_preferes: profileForm.mode_paiement_preferes,
        emplacement: {},
      };
      try {
        const emplacementObj = JSON.parse(profileForm.emplacement || '{}');
        if (emplacementObj === null || typeof emplacementObj !== 'object' || Array.isArray(emplacementObj)) {
          throw new Error();
        }
        body.emplacement = emplacementObj;
      } catch {
        throw new Error('Emplacement : JSON objet invalide. Exemple: {"latitude": 12.34, "longitude": -1.23, "adresse": "Ouagadougou"}');
      }
      const response = await fetch(API_ENDPOINTS.USER.PROFILE, {
        method: 'PATCH',
        headers: authHeadersJson(),
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(parseApiErrors(data));
      }
      await loadProfile();
      setToast({ message: 'Profil entreprise mis à jour.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Erreur lors de la mise à jour du profil', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const addTag = (field, value, clear) => {
    const v = value.trim();
    if (!v) return;
    setProfileForm((prev) => ({
      ...prev,
      [field]: [...prev[field], v],
    }));
    clear('');
  };

  const removeTag = (field, index) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  const photoSrc =
    user?.photo_profil &&
    (String(user.photo_profil).startsWith('http')
      ? user.photo_profil
      : String(user.photo_profil));

  if (!user) {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Chargement du profil...</div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-600">Session non disponible. Veuillez vous reconnecter.</p>
        <a href="/login" className="text-primary-600 font-medium hover:underline">
          Aller à la connexion
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const emplacement = parseEmplacement(profileForm.emplacement);
  const mapUrl = emplacement
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${emplacement.longitude - 0.02}%2C${emplacement.latitude - 0.02}%2C${emplacement.longitude + 0.02}%2C${emplacement.latitude + 0.02}&layer=mapnik&marker=${emplacement.latitude}%2C${emplacement.longitude}`
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isParametres ? 'Paramètres du compte' : 'Mon profil entreprise'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {isParametres
                ? 'Identité, contact et photo de profil'
                : 'Informations entreprise pour affiner le matching'}
            </p>
            <Link
              to={isParametres ? '/client/profil' : '/client/parametres'}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              {isParametres ? (
                <>
                  <FiBriefcase className="h-4 w-4" />
                  Profil entreprise
                </>
              ) : (
                <>
                  <FiSettings className="h-4 w-4" />
                  Paramètres du compte
                </>
              )}
            </Link>
          </div>
          {isParametres && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FiUser className="mr-2 h-4 w-4" />
              Déconnexion
            </button>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isParametres ? 'lg:grid-cols-3' : ''}`}>
        <div className={`space-y-6 ${isParametres ? 'lg:col-span-2' : ''}`}>
          {isParametres && (
          <form onSubmit={handleSaveAccount} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Compte</h2>
            <p className="text-sm text-slate-500">Prénom, nom, téléphone et photo (enregistrés via l&apos;API compte).</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Prénom</label>
                <input
                  type="text"
                  name="first_name"
                  value={accountForm.first_name}
                  onChange={handleAccountChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
                <input
                  type="text"
                  name="last_name"
                  value={accountForm.last_name}
                  onChange={handleAccountChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={accountForm.telephone}
                  onChange={handleAccountChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nouvelle photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(ev) => setPhotoFile(ev.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingAccount}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingAccount ? (
                  <span className="inline-flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enregistrement…
                  </span>
                ) : (
                  <>
                    <FiSave className="mr-2 h-4 w-4" />
                    Enregistrer le compte
                  </>
                )}
              </button>
            </div>
          </form>
          )}

          {!isParametres && (
          <form onSubmit={handleSaveProfile} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Profil entreprise (client)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Raison sociale</label>
                <input
                  type="text"
                  name="raison_sociale"
                  value={profileForm.raison_sociale}
                  onChange={handleProfileChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Secteur d&apos;activité</label>
                <input
                  type="text"
                  name="secteur_activite"
                  value={profileForm.secteur_activite}
                  onChange={handleProfileChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Taille de l&apos;entreprise</label>
                <select
                  name="taille_entreprise"
                  value={profileForm.taille_entreprise}
                  onChange={handleProfileChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Non renseigné</option>
                  <option value="TPE">TPE</option>
                  <option value="PME">PME</option>
                  <option value="GE">GE</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Fréquence des besoins</label>
                <select
                  name="frequence_besoins"
                  value={profileForm.frequence_besoins}
                  onChange={handleProfileChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {FREQUENCE_CHOICES.map((c) => (
                    <option key={c.value || 'none'} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Contact principal</label>
                <input
                  type="text"
                  name="contact_principal"
                  value={profileForm.contact_principal}
                  onChange={handleProfileChange}
                  placeholder="Nom du référent"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Plage de budget (FCFA)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  name="plage_budget_min"
                  value={profileForm.plage_budget_min}
                  onChange={handleProfileChange}
                  placeholder="Minimum"
                  min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  name="plage_budget_max"
                  value={profileForm.plage_budget_max}
                  onChange={handleProfileChange}
                  placeholder="Maximum"
                  min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Emplacement (JSON objet)</label>
              <textarea
                name="emplacement"
                value={profileForm.emplacement}
                onChange={handleProfileChange}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Exemple: {"{"}"latitude": 12.36, "longitude": -1.53, "adresse": "Ouagadougou"{"}"}
              </p>
            </div>

            {mapUrl && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Aperçu carte (géolocalisation)</label>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <iframe
                    title="Carte emplacement client"
                    src={mapUrl}
                    className="w-full h-64"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Types de services recherchés</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newBesoin}
                  onChange={(e) => setNewBesoin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('besoins_services', newBesoin, setNewBesoin);
                    }
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ex. maintenance, site web…"
                />
                <button
                  type="button"
                  onClick={() => addTag('besoins_services', newBesoin, setNewBesoin)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                >
                  <FiPlus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileForm.besoins_services.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-sm text-slate-700"
                  >
                    {t}
                    <button type="button" onClick={() => removeTag('besoins_services', i)} className="text-gray-500 hover:text-red-600">
                      <FiX className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Fournisseurs préférés</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newFournisseur}
                  onChange={(e) => setNewFournisseur(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('fournisseurs_preferes', newFournisseur, setNewFournisseur);
                    }
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nom ou raison sociale"
                />
                <button
                  type="button"
                  onClick={() => addTag('fournisseurs_preferes', newFournisseur, setNewFournisseur)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                >
                  <FiPlus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileForm.fournisseurs_preferes.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-sm text-slate-700"
                  >
                    {t}
                    <button type="button" onClick={() => removeTag('fournisseurs_preferes', i)} className="text-gray-500 hover:text-red-600">
                      <FiX className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Modes de paiement préférés</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newModePaiement}
                  onChange={(e) => setNewModePaiement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('mode_paiement_preferes', newModePaiement, setNewModePaiement);
                    }
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ex. virement, mobile money…"
                />
                <button
                  type="button"
                  onClick={() => addTag('mode_paiement_preferes', newModePaiement, setNewModePaiement)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                >
                  <FiPlus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileForm.mode_paiement_preferes.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-sm text-slate-700"
                  >
                    {t}
                    <button type="button" onClick={() => removeTag('mode_paiement_preferes', i)} className="text-gray-500 hover:text-red-600">
                      <FiX className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingProfile ? (
                  <span className="inline-flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enregistrement…
                  </span>
                ) : (
                  <>
                    <FiSave className="mr-2 h-4 w-4" />
                    Enregistrer le profil entreprise
                  </>
                )}
              </button>
            </div>
          </form>
          )}
        </div>

        {isParametres && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Photo de profil</h3>
            <div className="text-center">
              <div className="relative inline-block">
                <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                  {photoSrc ? (
                    <img src={photoSrc} alt="Profil" className="h-full w-full object-cover" />
                  ) : user?.first_name ? (
                    <span className="text-2xl font-bold text-slate-600">{user.first_name[0].toUpperCase()}</span>
                  ) : (
                    <FiUser className="h-16 w-16 text-slate-400" />
                  )}
                </div>
                <span className="pointer-events-none absolute bottom-0 right-0 rounded-full bg-indigo-600 p-2 text-white" title="Photo : formulaire Compte">
                  <FiCamera className="h-4 w-4" />
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">Choisissez une image puis enregistrez la section Compte.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Résumé compte</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <FiMail className="mr-3 mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiUser className="mr-3 mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Type de compte</p>
                  <p className="text-sm capitalize text-slate-600">{user?.type_utilisateur}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiPhone className="mr-3 mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Téléphone</p>
                  <p className="text-sm text-slate-600">{user?.telephone || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiBriefcase className="mr-3 mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Raison sociale</p>
                  <p className="text-sm text-slate-600">{profileForm.raison_sociale || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default MonProfil;
