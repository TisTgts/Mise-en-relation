import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiAward, FiEdit2, FiCamera, FiSave, FiX, FiStar, FiCalendar, FiGlobe, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/Toast';

const MonProfil = () => {
  const { user, updateUser } = useAuth();
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
    description: '',
    adresse: '',
    site_web: '',
    annees_experience: '',
    specialites: [],
    certifications: [],
    disponibilites: '',
    tarif_horaire: '',
    mode_tarification: 'horaire'
  });

  const [newSpecialite, setNewSpecialite] = useState('');
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        console.log('MonProfil (prestataire) - user:', user);
        
        // Récupérer le profil complet depuis l'API
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/accounts/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('MonProfil (prestataire) - profileData:', profileData);
          
          setFormData({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: profileData.email || '',
            telephone: profileData.telephone || '',
            raison_sociale: profileData.profile_prestataire?.raison_sociale || '',
            description: profileData.profile_prestataire?.description || '',
            adresse: profileData.profile_prestataire?.adresse || '',
            site_web: profileData.profile_prestataire?.site_web || '',
            annees_experience: profileData.profile_prestataire?.annees_experience || '',
            specialites: profileData.profile_prestataire?.specialites || [],
            certifications: profileData.profile_prestataire?.certifications || [],
            disponibilites: profileData.profile_prestataire?.disponibilites || '',
            tarif_horaire: profileData.profile_prestataire?.tarif_horaire || '',
            mode_tarification: profileData.profile_prestataire?.mode_tarification || 'horaire'
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        setToast({
          message: 'Erreur lors du chargement du profil',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSpecialite = () => {
    if (newSpecialite.trim()) {
      setFormData(prev => ({
        ...prev,
        specialites: [...prev.specialites, newSpecialite.trim()]
      }));
      setNewSpecialite('');
    }
  };

  const handleRemoveSpecialite = (index) => {
    setFormData(prev => ({
      ...prev,
      specialites: prev.specialites.filter((_, i) => i !== index)
    }));
  };

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/accounts/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          telephone: formData.telephone,
          profile_prestataire: {
            raison_sociale: formData.raison_sociale,
            description: formData.description,
            adresse: formData.adresse,
            site_web: formData.site_web,
            annees_experience: formData.annees_experience,
            specialites: formData.specialites,
            certifications: formData.certifications,
            disponibilites: formData.disponibilites,
            tarif_horaire: formData.tarif_horaire,
            mode_tarification: formData.mode_tarification
          }
        })
      });

      if (response.ok) {
        const updatedData = await response.json();
        updateUser(updatedData);
        setEditing(false);
        setToast({
          message: 'Profil mis à jour avec succès',
          type: 'success'
        });
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      setToast({
        message: 'Erreur lors de la mise à jour du profil',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Recharger les données originales
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiEdit2 className="mr-2 h-4 w-4" />
                Modifier
              </button>
            )}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
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

            {/* Informations professionnelles */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations professionnelles</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison sociale
                  </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={!editing}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    placeholder="Décrivez votre activité, vos compétences, votre expérience..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                        disabled={!editing}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site web
                    </label>
                    <input
                      type="url"
                      name="site_web"
                      value={formData.site_web}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Compétences et expérience */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Compétences et expérience</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Années d'expérience
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarif horaire (FCFA)
                    </label>
                    <input
                      type="number"
                      name="tarif_horaire"
                      value={formData.tarif_horaire}
                      onChange={handleChange}
                      disabled={!editing}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Spécialités */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécialités
                  </label>
                  {editing ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newSpecialite}
                          onChange={(e) => setNewSpecialite(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialite())}
                          placeholder="Ajouter une spécialité..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddSpecialite}
                          className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        >
                          Ajouter
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialites.map((specialite, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {specialite}
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecialite(index)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.specialites.map((specialite, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {specialite}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications
                  </label>
                  {editing ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                          placeholder="Ajouter une certification..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCertification}
                          className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        >
                          Ajouter
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.certifications.map((certification, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                          >
                            <FiAward className="mr-1 h-3 w-3" />
                            {certification}
                            <button
                              type="button"
                              onClick={() => handleRemoveCertification(index)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((certification, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                        >
                          <FiAward className="mr-1 h-3 w-3" />
                          {certification}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enregistrement...
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
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MonProfil;
