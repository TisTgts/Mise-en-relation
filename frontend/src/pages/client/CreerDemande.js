import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import demandesService from '../../services/demandesService';
import categoriesService from '../../services/categoriesService';
import { FiSave, FiX } from 'react-icons/fi';

const CreerDemande = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    intitule: '',
    description: '',
    categorie: '',
    type_service: '',
    exigences: {},
    lieu_intervention: '',
    date_souhaitee: '',
    date_limite: '',
    urgence: 'normale',
    budget: '',
    flexible: false,
    statut: 'ouverte'
  });

  const [exigenceField, setExigenceField] = useState({ key: '', value: '' });

  useEffect(() => {
    if (!isAuthenticated || user?.type_utilisateur !== 'fournisseur') {
      navigate('/login');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, user, navigate]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.getAllCategories();
      console.log('Catégories reçues dans CreerDemande:', data);
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleExigenceAdd = () => {
    if (exigenceField.key && exigenceField.value) {
      setFormData(prev => ({
        ...prev,
        exigences: {
          ...prev.exigences,
          [exigenceField.key]: exigenceField.value
        }
      }));
      setExigenceField({ key: '', value: '' });
    }
  };

  const handleExigenceRemove = (key) => {
    setFormData(prev => {
      const newExigences = { ...prev.exigences };
      delete newExigences[key];
      return {
        ...prev,
        exigences: newExigences
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.intitule.trim()) {
      newErrors.intitule = "L'intitulé est obligatoire";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }
    
    if (!formData.categorie) {
      newErrors.categorie = 'La catégorie est obligatoire';
    }
    
    if (!formData.type_service.trim()) {
      newErrors.type_service = 'Le type de service est obligatoire';
    }
    
    if (!formData.lieu_intervention.trim()) {
      newErrors.lieu_intervention = 'Le lieu d\'intervention est obligatoire';
    }
    
    if (!formData.budget || formData.budget <= 0) {
      newErrors.budget = 'Le budget est invalide';
    }
    
    if (!formData.date_souhaitee) {
      newErrors.date_souhaitee = 'La date souhaitée est obligatoire';
    }
    
    if (!formData.date_limite) {
      newErrors.date_limite = 'La date limite est obligatoire';
    }
    
    if (formData.date_souhaitee && formData.date_limite && new Date(formData.date_souhaitee) > new Date(formData.date_limite)) {
      newErrors.date_limite = 'La date limite doit être postérieure à la date souhaitée';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const demandeData = {
        ...formData,
        budget: parseFloat(formData.budget)
      };
      
      await demandesService.createDemande(demandeData);
      
      // Rediriger vers le dashboard du fournisseur
      navigate('/fournisseur/dashboard');
      
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      setErrors({ 
        submit: error.message || 'Une erreur est survenue lors de la création de la demande' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Créer une nouvelle demande
          </h1>
          <p className="mt-2 text-gray-600">
            Décrivez le service dont vous avez besoin
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            {/* Informations générales */}
            <div className="space-y-6">
              <div>
                <label htmlFor="intitule" className="block text-sm font-medium text-gray-700">
                  Intitulé de la demande *
                </label>
                <input
                  type="text"
                  id="intitule"
                  name="intitule"
                  value={formData.intitule}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.intitule ? 'border-red-300' : ''
                  }`}
                  placeholder="Ex: Transport de matières premières"
                />
                {errors.intitule && (
                  <p className="mt-1 text-sm text-red-600">{errors.intitule}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.description ? 'border-red-300' : ''
                  }`}
                  placeholder="Décrivez en détail votre besoin..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="categorie" className="block text-sm font-medium text-gray-700">
                    Catégorie *
                  </label>
                  <select
                    id="categorie"
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.categorie ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {Array.isArray(categories) && categories.map((categorie) => (
                      <option key={categorie.id} value={categorie.id}>
                        {categorie.nom}
                      </option>
                    ))}
                  </select>
                  {errors.categorie && (
                    <p className="mt-1 text-sm text-red-600">{errors.categorie}</p>
                  )}
                  {/* Debug info */}
                  <p className="mt-1 text-xs text-gray-500">
                    Debug: {Array.isArray(categories) ? `${categories.length} catégories trouvées` : 'Chargement...'}
                  </p>
                </div>

                <div>
                  <label htmlFor="type_service" className="block text-sm font-medium text-gray-700">
                    Type de service *
                  </label>
                  <input
                    type="text"
                    id="type_service"
                    name="type_service"
                    value={formData.type_service}
                    onChange={handleChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.type_service ? 'border-red-300' : ''
                    }`}
                    placeholder="Ex: Transport routier"
                  />
                  {errors.type_service && (
                    <p className="mt-1 text-sm text-red-600">{errors.type_service}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Exigences */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Exigences spécifiques</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Exigence"
                  value={exigenceField.key}
                  onChange={(e) => setExigenceField(prev => ({ ...prev, key: e.target.value }))}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Détail"
                  value={exigenceField.value}
                  onChange={(e) => setExigenceField(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleExigenceAdd}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Ajouter
                </button>
              </div>
              
              <div className="space-y-2">
                {Object.entries(formData.exigences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">
                      <strong>{key}:</strong> {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExigenceRemove(key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lieu et dates */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lieu et Planning</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="lieu_intervention" className="block text-sm font-medium text-gray-700">
                  Lieu d'intervention *
                </label>
                <input
                  type="text"
                  id="lieu_intervention"
                  name="lieu_intervention"
                  value={formData.lieu_intervention}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.lieu_intervention ? 'border-red-300' : ''
                  }`}
                  placeholder="Ex: Ouagadougou, Bobo-Dioulasso"
                />
                {errors.lieu_intervention && (
                  <p className="mt-1 text-sm text-red-600">{errors.lieu_intervention}</p>
                )}
              </div>

              <div>
                <label htmlFor="urgence" className="block text-sm font-medium text-gray-700">
                  Niveau d'urgence
                </label>
                <select
                  id="urgence"
                  name="urgence"
                  value={formData.urgence}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="normale">Normale</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                </select>
              </div>

              <div>
                <label htmlFor="date_souhaitee" className="block text-sm font-medium text-gray-700">
                  Date souhaitée *
                </label>
                <input
                  type="datetime-local"
                  id="date_souhaitee"
                  name="date_souhaitee"
                  value={formData.date_souhaitee}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.date_souhaitee ? 'border-red-300' : ''
                  }`}
                />
                {errors.date_souhaitee && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_souhaitee}</p>
                )}
              </div>

              <div>
                <label htmlFor="date_limite" className="block text-sm font-medium text-gray-700">
                  Date limite *
                </label>
                <input
                  type="datetime-local"
                  id="date_limite"
                  name="date_limite"
                  value={formData.date_limite}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.date_limite ? 'border-red-300' : ''
                  }`}
                />
                {errors.date_limite && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_limite}</p>
                )}
              </div>
            </div>
          </div>

          {/* Budget et options */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Budget et Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                  Budget (FCFA) *
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.budget ? 'border-red-300' : ''
                  }`}
                  placeholder="100000"
                />
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
                )}
              </div>

              <div>
                <label htmlFor="statut" className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <select
                  id="statut"
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="ouverte">Ouverte</option>
                  <option value="fermee">Fermée</option>
                  <option value="en_cours">En cours</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="flexible"
                  checked={formData.flexible}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Budget flexible (négociable)
                </span>
              </label>
            </div>
          </div>

          {/* Erreurs générales */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/fournisseur/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <FiSave className="mr-2" />
              )}
              {loading ? 'Création en cours...' : 'Créer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreerDemande;
