import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMail, FiPhone, FiBriefcase, FiAward, FiEdit2, FiSave, FiX, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../../config/api';
import Toast from '../../../components/Toast';
import { getEmplacementExample } from '../../../pays';

const EMPLACEMENT_EXAMPLE = getEmplacementExample();
const EMPLACEMENT_EXAMPLE_JSON = JSON.stringify(EMPLACEMENT_EXAMPLE);

const authHeadersJson = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

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
  const { user, updateUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const isParametres = location.pathname.includes('/parametres');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    raison_sociale: '',
    types_services_offerts: [],
    zones_couverture: [],
    annees_experience: '',
    certifications: [],
    assurance_valide: false,
    disponibilites: '{}',
    emplacement: '{}',
    tarif_horaire: '',
    abonnement_type: 'standard',
    abonnement_actif: true,
    abonnement_debut: '',
    abonnement_fin: '',
  });

  const [newService, setNewService] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const applyProfile = useCallback((profileData) => {
    const u = profileData.user || {};
    setFormData({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      telephone: u.telephone || '',
      raison_sociale: profileData.raison_sociale || '',
      types_services_offerts: Array.isArray(profileData.types_services_offerts)
        ? profileData.types_services_offerts
        : [],
      zones_couverture: Array.isArray(profileData.zones_couverture) ? profileData.zones_couverture : [],
      annees_experience:
        profileData.annees_experience != null && profileData.annees_experience !== ''
          ? String(profileData.annees_experience)
          : '',
      certifications: Array.isArray(profileData.certifications) ? profileData.certifications : [],
      assurance_valide: !!profileData.assurance_valide,
      disponibilites: JSON.stringify(profileData.disponibilites && typeof profileData.disponibilites === 'object' ? profileData.disponibilites : {}, null, 2),
      emplacement: JSON.stringify(profileData.emplacement && typeof profileData.emplacement === 'object' ? profileData.emplacement : {}, null, 2),
      tarif_horaire:
        profileData.tarif_horaire != null && profileData.tarif_horaire !== ''
          ? String(profileData.tarif_horaire)
          : '',
      abonnement_type: profileData.abonnement_type || 'standard',
      abonnement_actif: profileData.abonnement_actif !== false,
      abonnement_debut: profileData.abonnement_debut || '',
      abonnement_fin: profileData.abonnement_fin || '',
    });
  }, []);

  const loadProfile = useCallback(async () => {
    const response = await fetch(API_ENDPOINTS.USER.PROFILE, { headers: authHeadersJson() });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(parseApiErrors(err));
    }
    const profileData = await response.json();
    applyProfile(profileData);
  }, [applyProfile]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Afficher au moins les infos compte meme si l'API profil est indisponible.
    setFormData((prev) => ({
      ...prev,
      first_name: user.first_name || prev.first_name,
      last_name: user.last_name || prev.last_name,
      email: user.email || prev.email,
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addTag = (field, raw, clear) => {
    const v = raw.trim();
    if (!v) return;
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], v] }));
    clear('');
  };

  const removeTag = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      let disponibilitesObj;
      let emplacementObj;
      try {
        disponibilitesObj = JSON.parse(formData.disponibilites || '{}');
        if (disponibilitesObj === null || typeof disponibilitesObj !== 'object' || Array.isArray(disponibilitesObj)) {
          throw new Error();
        }
      } catch {
        setToast({ message: 'Disponibilités : JSON objet invalide.', type: 'error' });
        setSaving(false);
        return;
      }
      try {
        emplacementObj = JSON.parse(formData.emplacement || '{}');
        if (emplacementObj === null || typeof emplacementObj !== 'object' || Array.isArray(emplacementObj)) {
          throw new Error();
        }
      } catch {
        setToast({
          message: `Emplacement : JSON objet invalide. Exemple: ${EMPLACEMENT_EXAMPLE_JSON}`,
          type: 'error',
        });
        setSaving(false);
        return;
      }

      const meRes = await fetch(API_ENDPOINTS.USER.ME, {
        method: 'PATCH',
        headers: authHeadersJson(),
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          telephone: formData.telephone,
        }),
      });
      const meData = await meRes.json().catch(() => ({}));
      if (!meRes.ok) throw new Error(parseApiErrors(meData));
      updateUser(meData);

      const annees = formData.annees_experience === '' ? 0 : parseInt(formData.annees_experience, 10);
      const tarif =
        formData.tarif_horaire === '' || formData.tarif_horaire == null
          ? null
          : String(Number(formData.tarif_horaire));

      const profileRes = await fetch(API_ENDPOINTS.USER.PROFILE, {
        method: 'PATCH',
        headers: authHeadersJson(),
        body: JSON.stringify({
          raison_sociale: formData.raison_sociale,
          types_services_offerts: formData.types_services_offerts,
          zones_couverture: formData.zones_couverture,
          annees_experience: Number.isFinite(annees) ? annees : 0,
          certifications: formData.certifications,
          assurance_valide: formData.assurance_valide,
          disponibilites: disponibilitesObj,
          emplacement: emplacementObj,
          tarif_horaire: tarif,
        }),
      });
      const profileJson = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok) throw new Error(parseApiErrors(profileJson));

      await loadProfile();
      setEditing(false);
      setToast({ message: 'Profil mis à jour avec succès', type: 'success' });
    } catch (error) {
      setToast({
        message: error.message || 'Erreur lors de la mise à jour du profil',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setEditing(false);
    try {
      setLoading(true);
      await loadProfile();
    } catch {
      setToast({ message: 'Impossible de recharger le profil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  const emplacement = parseEmplacement(formData.emplacement);
  const mapUrl = emplacement
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${emplacement.longitude - 0.02}%2C${emplacement.latitude - 0.02}%2C${emplacement.longitude + 0.02}%2C${emplacement.latitude + 0.02}&layer=mapnik&marker=${emplacement.latitude}%2C${emplacement.longitude}`
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isParametres ? 'Paramètres du compte' : 'Mon profil fournisseur'}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {isParametres
                  ? 'Identité et coordonnées personnelles'
                  : 'Activité, zones, tarifs et visibilité matching'}
              </p>
              <Link
                to={isParametres ? '/fournisseur/profil' : '/fournisseur/parametres'}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                {isParametres ? (
                  <>
                    <FiBriefcase className="h-4 w-4" />
                    Profil fournisseur
                  </>
                ) : (
                  <>
                    <FiSettings className="h-4 w-4" />
                    Paramètres du compte
                  </>
                )}
              </Link>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <FiEdit2 className="mr-2 h-4 w-4" />
                Modifier
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isParametres && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Informations personnelles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Prénom</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-slate-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
            )}

            {!isParametres && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Profil fournisseur</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Raison sociale</label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="raison_sociale"
                      value={formData.raison_sociale}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Années d&apos;expérience</label>
                    <input
                      type="number"
                      name="annees_experience"
                      value={formData.annees_experience}
                      onChange={handleChange}
                      disabled={!editing}
                      min="0"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Tarif horaire (FCFA)</label>
                    <input
                      type="number"
                      name="tarif_horaire"
                      value={formData.tarif_horaire}
                      onChange={handleChange}
                      disabled={!editing}
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Abonnement matching</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        formData.abonnement_type === 'premium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {formData.abonnement_type === 'premium' ? 'Premium' : 'Standard'}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        formData.abonnement_actif
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {formData.abonnement_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Standard = bonus matching de base. Premium = bonus plus élevé (activation prochaine).
                  </p>
                  {(formData.abonnement_debut || formData.abonnement_fin) && (
                    <p className="mt-1 text-xs text-slate-500">
                      Période: {formData.abonnement_debut || '—'} → {formData.abonnement_fin || '—'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="assurance_valide"
                    type="checkbox"
                    name="assurance_valide"
                    checked={formData.assurance_valide}
                    onChange={handleChange}
                    disabled={!editing}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <label htmlFor="assurance_valide" className="text-sm font-medium text-slate-700">
                    Assurance valide
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Types de services offerts</label>
                  {editing && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag('types_services_offerts', newService, setNewService);
                          }
                        }}
                        placeholder="Ex. plomberie, électricité…"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => addTag('types_services_offerts', newService, setNewService)}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md"
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formData.types_services_offerts.map((t, index) => (
                      <span
                        key={`${t}-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {t}
                        {editing && (
                          <button
                            type="button"
                            onClick={() => removeTag('types_services_offerts', index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zones de couverture</label>
                  {editing && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newZone}
                        onChange={(e) => setNewZone(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag('zones_couverture', newZone, setNewZone);
                          }
                        }}
                        placeholder="Ex. Dakar…"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => addTag('zones_couverture', newZone, setNewZone)}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md"
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formData.zones_couverture.map((t, index) => (
                      <span
                        key={`${t}-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                      >
                        {t}
                        {editing && (
                          <button
                            type="button"
                            onClick={() => removeTag('zones_couverture', index)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  {editing && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag('certifications', newCertification, setNewCertification);
                          }
                        }}
                        placeholder="Ajouter une certification…"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => addTag('certifications', newCertification, setNewCertification)}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md"
                      >
                        Ajouter
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((certification, index) => (
                      <span
                        key={`${certification}-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        <FiAward className="mr-1 h-3 w-3" />
                        {certification}
                        {editing && (
                          <button
                            type="button"
                            onClick={() => removeTag('certifications', index)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emplacement (JSON objet)
                  </label>
                  <textarea
                    name="emplacement"
                    value={formData.emplacement}
                    onChange={handleChange}
                    disabled={!editing}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Exemple: {EMPLACEMENT_EXAMPLE_JSON}
                  </p>
                </div>

                {mapUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apercu carte (geolocalisation)
                    </label>
                    <div className="rounded-md overflow-hidden border border-gray-200">
                      <iframe
                        title="Carte emplacement fournisseur"
                        src={mapUrl}
                        className="w-full h-64"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilités (JSON objet)
                  </label>
                  <textarea
                    name="disponibilites"
                    value={formData.disponibilites}
                    onChange={handleChange}
                    disabled={!editing}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
            )}

            {editing && (
              <div className="flex items-center justify-end space-x-4 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MonProfil;
