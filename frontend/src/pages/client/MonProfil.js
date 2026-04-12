import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiEdit, FiSave, FiCamera } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const MonProfil = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    raison_sociale: '',
    secteur: '',
    description: '',
    telephone: '',
    adresse: '',
    site_web: '',
    annee_creation: '',
    taille_entreprise: '',
    budget_mensuel: '',
    frequence_services: ''
  });

  useEffect(() => {
    if (user) {
      // Charger les données du profil depuis l'API
      const fetchProfile = async () => {
        try {
          const response = await fetch('/api/accounts/profile/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            setFormData({
              raison_sociale: profileData.raison_sociale || '',
              secteur: profileData.secteur || '',
              description: profileData.description || '',
              telephone: profileData.telephone || '',
              adresse: profileData.adresse || '',
              site_web: profileData.site_web || '',
              annee_creation: profileData.annee_creation || '',
              taille_entreprise: profileData.taille_entreprise || '',
              budget_mensuel: profileData.budget_mensuel || '',
              frequence_services: profileData.frequence_services || ''
            });
          }
        } catch (error) {
          console.error('Erreur lors du chargement du profil:', error);
        }
      };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/accounts/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
      window.location.href = '/login';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            <p className="text-gray-600 mt-1">Gérez vos informations personnelles</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiUser className="mr-2 h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations de base */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulaire */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations entreprise */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de l'entreprise</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison sociale *
                    </label>
                    <input
                      type="text"
                      name="raison_sociale"
                      value={formData.raison_sociale}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteur d'activité *
                    </label>
                    <input
                      type="text"
                      name="secteur"
                      value={formData.secteur}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Décrivez votre entreprise et vos services..."
                  />
                </div>
              </div>

              {/* Coordonnées */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Coordonnées</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <input
                    type="url"
                    name="site_web"
                    value={formData.site_web}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://"
                  />
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informations supplémentaires</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Année de création
                    </label>
                    <input
                      type="number"
                      name="annee_creation"
                      value={formData.annee_creation}
                      onChange={handleChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille de l'entreprise
                    </label>
                    <select
                      name="taille_entreprise"
                      value={formData.taille_entreprise}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Sélectionner</option>
                      <option value="TPE">Très Petite Entreprise (TPE)</option>
                      <option value="PME">Petite et Moyenne Entreprise (PME)</option>
                      <option value="GE">Grande Entreprise (GE)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget mensuel moyen
                    </label>
                    <input
                      type="text"
                      name="budget_mensuel"
                      value={formData.budget_mensuel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: 50 000 - 200 000 FCFA"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence des services
                    </label>
                    <select
                      name="frequence_services"
                      value={formData.frequence_services}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Sélectionner</option>
                      <option value="occasionnel">Occasionnel</option>
                      <option value="mensuel">Mensuel</option>
                      <option value="trimestriel">Trimestriel</option>
                      <option value="annuel">Annuel</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? (
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
            </form>

            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiSave className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Profil mis à jour avec succès !
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Carte de profil */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Photo de profil</h3>
            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-32 w-32 rounded-full bg-gray-300 flex items-center justify-center">
                  {user?.first_name ? (
                    <span className="text-2xl font-bold text-gray-600">
                      {user.first_name[0].toUpperCase()}
                    </span>
                  ) : (
                    <FiUser className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FiCamera className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <FiEdit className="mr-2 h-4 w-4" />
                Changer la photo
              </button>
            </div>
          </div>

          {/* Informations du compte */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du compte</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <FiMail className="mr-3 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FiUser className="mr-3 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Type de compte</p>
                  <p className="text-sm text-gray-600 capitalize">{user?.type_utilisateur}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FiPhone className="mr-3 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Téléphone</p>
                  <p className="text-sm text-gray-600">{formData.telephone || 'Non renseigné'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FiMapPin className="mr-3 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Adresse</p>
                  <p className="text-sm text-gray-600">{formData.adresse || 'Non renseignée'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MonProfil;
