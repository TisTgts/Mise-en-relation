import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import prestationsService from '../../../services/prestationsService';
import categoriesService from '../../../services/categoriesService';
import { FiSave, FiX, FiMapPin } from 'react-icons/fi';

const PrestationCreate = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    intitule: '',
    description: '',
    categorie: '',
    type_prestation: '',
    caracteristiques: {},
    zones_intervention: [],
    disponibilite_debut: '',
    disponibilite_fin: '',
    mode_tarification: 'forfait',
    tarif_min: '',
    tarif_max: '',
    statut: 'active'
  });

  const [caracteristiqueField, setCaracteristiqueField] = useState({ key: '', value: '' });
  const [zoneField, setZoneField] = useState('');

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
      console.log('Catégories reçues dans PrestationCreate:', data);
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: value
      };
      if (name === 'mode_tarification' && value === 'devis') {
        next.tarif_min = '';
        next.tarif_max = '';
      }
      return next;
    });
    
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCaracteristiqueAdd = () => {
    if (caracteristiqueField.key && caracteristiqueField.value) {
      setFormData(prev => ({
        ...prev,
        caracteristiques: {
          ...prev.caracteristiques,
          [caracteristiqueField.key]: caracteristiqueField.value
        }
      }));
      setCaracteristiqueField({ key: '', value: '' });
    }
  };

  const handleCaracteristiqueRemove = (key) => {
    setFormData(prev => {
      const newCaracteristiques = { ...prev.caracteristiques };
      delete newCaracteristiques[key];
      return {
        ...prev,
        caracteristiques: newCaracteristiques
      };
    });
  };

  const handleZoneAdd = () => {
    if (zoneField && !formData.zones_intervention.includes(zoneField)) {
      setFormData(prev => ({
        ...prev,
        zones_intervention: [...prev.zones_intervention, zoneField]
      }));
      setZoneField('');
    }
  };

  const handleZoneRemove = (zone) => {
    setFormData(prev => ({
      ...prev,
      zones_intervention: prev.zones_intervention.filter(z => z !== zone)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const isDevisMode = formData.mode_tarification === 'devis';
    
    if (!formData.intitule.trim()) {
      newErrors.intitule = "L'intitulé est obligatoire";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }
    
    if (!formData.categorie) {
      newErrors.categorie = 'La catégorie est obligatoire';
    }
    
    if (!formData.type_prestation.trim()) {
      newErrors.type_prestation = 'Le type de prestation est obligatoire';
    }
    
    if (!isDevisMode && !formData.tarif_min && !formData.tarif_max) {
      newErrors.tarif_min = 'Indiquez au moins un tarif (minimum ou maximum)';
    }

    if (formData.tarif_min && parseFloat(formData.tarif_min) <= 0) {
      newErrors.tarif_min = 'Le tarif minimum est invalide';
    }
    
    if (formData.tarif_max && parseFloat(formData.tarif_max) <= 0) {
      newErrors.tarif_max = 'Le tarif maximum est invalide';
    }
    
    if (formData.tarif_min && formData.tarif_max && parseFloat(formData.tarif_min) > parseFloat(formData.tarif_max)) {
      newErrors.tarif_max = 'Le tarif maximum doit être supérieur au tarif minimum';
    }
    
    if (!formData.disponibilite_debut) {
      newErrors.disponibilite_debut = 'La date de début de disponibilité est obligatoire';
    }
    
    if (!formData.disponibilite_fin) {
      newErrors.disponibilite_fin = 'La date de fin de disponibilité est obligatoire';
    }
    
    if (formData.zones_intervention.length === 0) {
      newErrors.zones_intervention = 'Au moins une zone d\'intervention est requise';
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
      const prestationData = {
        ...formData,
        tarif_min: formData.mode_tarification === 'devis' || !formData.tarif_min ? null : parseFloat(formData.tarif_min),
        tarif_max: formData.mode_tarification === 'devis' || !formData.tarif_max ? null : parseFloat(formData.tarif_max)
      };
      
      await prestationsService.createPrestation(prestationData);
      
      // Rediriger vers le dashboard du fournisseur
      navigate('/fournisseur/dashboard');
      
    } catch (error) {
      console.error('Erreur lors de la création de la prestation:', error);
      setErrors({ 
        submit: error.message || 'Une erreur est survenue lors de la création de la prestation' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Créer une nouvelle prestation
          </h1>
          <p className="mt-2 text-gray-600">
            Décrivez le service que vous souhaitez offrir
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            {/* Informations générales */}
            <div className="space-y-6">
              <div>
                <label htmlFor="intitule" className="block text-sm font-medium text-gray-700">
                  Intitulé de la prestation *
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
                  placeholder="Ex: Transport de marchandises"
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
                  placeholder="Décrivez en détail votre prestation..."
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
                  <label htmlFor="type_prestation" className="block text-sm font-medium text-gray-700">
                    Type de prestation *
                  </label>
                  <input
                    type="text"
                    id="type_prestation"
                    name="type_prestation"
                    value={formData.type_prestation}
                    onChange={handleChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.type_prestation ? 'border-red-300' : ''
                    }`}
                    placeholder="Ex: Transport routier"
                  />
                  {errors.type_prestation && (
                    <p className="mt-1 text-sm text-red-600">{errors.type_prestation}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Caractéristiques</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Caractéristique"
                  value={caracteristiqueField.key}
                  onChange={(e) => setCaracteristiqueField(prev => ({ ...prev, key: e.target.value }))}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Valeur"
                  value={caracteristiqueField.value}
                  onChange={(e) => setCaracteristiqueField(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleCaracteristiqueAdd}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Ajouter
                </button>
              </div>
              
              <div className="space-y-2">
                {Object.entries(formData.caracteristiques).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">
                      <strong>{key}:</strong> {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCaracteristiqueRemove(key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zones d'intervention */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Zones d'intervention *</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter une zone"
                  value={zoneField}
                  onChange={(e) => setZoneField(e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleZoneAdd}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Ajouter
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.zones_intervention.map((zone) => (
                  <span key={zone} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                    <FiMapPin className="mr-1" />
                    {zone}
                    <button
                      type="button"
                      onClick={() => handleZoneRemove(zone)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
              {errors.zones_intervention && (
                <p className="mt-1 text-sm text-red-600">{errors.zones_intervention}</p>
              )}
            </div>
          </div>

          {/* Disponibilité et tarification */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Disponibilité et Tarification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="disponibilite_debut" className="block text-sm font-medium text-gray-700">
                  Date de début de disponibilité *
                </label>
                <input
                  type="datetime-local"
                  id="disponibilite_debut"
                  name="disponibilite_debut"
                  value={formData.disponibilite_debut}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.disponibilite_debut ? 'border-red-300' : ''
                  }`}
                />
                {errors.disponibilite_debut && (
                  <p className="mt-1 text-sm text-red-600">{errors.disponibilite_debut}</p>
                )}
              </div>

              <div>
                <label htmlFor="disponibilite_fin" className="block text-sm font-medium text-gray-700">
                  Date de fin de disponibilité *
                </label>
                <input
                  type="datetime-local"
                  id="disponibilite_fin"
                  name="disponibilite_fin"
                  value={formData.disponibilite_fin}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.disponibilite_fin ? 'border-red-300' : ''
                  }`}
                />
                {errors.disponibilite_fin && (
                  <p className="mt-1 text-sm text-red-600">{errors.disponibilite_fin}</p>
                )}
              </div>

              <div>
                <label htmlFor="mode_tarification" className="block text-sm font-medium text-gray-700">
                  Mode de tarification
                </label>
                <select
                  id="mode_tarification"
                  name="mode_tarification"
                  value={formData.mode_tarification}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="forfait">Forfait (prix package)</option>
                  <option value="horaire">À l&apos;heure</option>
                  <option value="devis">Sur devis (chiffrage après étude)</option>
                </select>
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">En attente</option>
                </select>
              </div>

              {formData.mode_tarification === 'devis' ? (
                <div className="md:col-span-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
                  Cette prestation est en mode devis: vous pouvez créer l'offre sans renseigner de tarifs minimum/maximum.
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="tarif_min" className="block text-sm font-medium text-gray-700">
                      Tarif minimum (FCFA)
                    </label>
                    <input
                      type="number"
                      id="tarif_min"
                      name="tarif_min"
                      value={formData.tarif_min}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.tarif_min ? 'border-red-300' : ''
                      }`}
                      placeholder="50000"
                    />
                    {errors.tarif_min && (
                      <p className="mt-1 text-sm text-red-600">{errors.tarif_min}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="tarif_max" className="block text-sm font-medium text-gray-700">
                      Tarif maximum (FCFA)
                    </label>
                    <input
                      type="number"
                      id="tarif_max"
                      name="tarif_max"
                      value={formData.tarif_max}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.tarif_max ? 'border-red-300' : ''
                      }`}
                      placeholder="100000"
                    />
                    {errors.tarif_max && (
                      <p className="mt-1 text-sm text-red-600">{errors.tarif_max}</p>
                    )}
                  </div>
                </>
              )}
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
              {loading ? 'Création en cours...' : 'Créer la prestation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrestationCreate;
