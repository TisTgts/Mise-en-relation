import React, { useState, useEffect, useCallback } from 'react';
import { FiMail, FiPhone, FiBriefcase, FiAward, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../../config/api';
import Toast from '../../../components/Toast';

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

const MonProfil = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
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
    tarif_horaire: '',
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
      tarif_horaire:
        profileData.tarif_horaire != null && profileData.tarif_horaire !== ''
          ? String(profileData.tarif_horaire)
          : '',
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiEdit2 className="mr-2 h-4 w-4" />
                Modifier
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Profil fournisseur</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Raison sociale</label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="raison_sociale"
                      value={formData.raison_sociale}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Années d&apos;expérience</label>
                    <input
                      type="number"
                      name="annees_experience"
                      value={formData.annees_experience}
                      onChange={handleChange}
                      disabled={!editing}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarif horaire (FCFA)</label>
                    <input
                      type="number"
                      name="tarif_horaire"
                      value={formData.tarif_horaire}
                      onChange={handleChange}
                      disabled={!editing}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="assurance_valide"
                    type="checkbox"
                    name="assurance_valide"
                    checked={formData.assurance_valide}
                    onChange={handleChange}
                    disabled={!editing}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label htmlFor="assurance_valide" className="text-sm font-medium text-gray-700">
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

            {editing && (
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
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
