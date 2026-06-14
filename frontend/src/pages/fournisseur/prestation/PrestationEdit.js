import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import prestationsService from '../../../services/prestationsService';
import categoriesService from '../../../services/categoriesService';
import Toast from '../../../components/Toast';

const PrestationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prestation, setPrestation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Formulaire
  const [formData, setFormData] = useState({
    categorie: '',
    intitule: '',
    description: '',
    type_prestation: '',
    caracteristiques: {},
    zones_intervention: [],
    disponibilite_debut: '',
    disponibilite_fin: '',
    mode_tarification: 'fixe',
    tarif_min: '',
    tarif_max: '',
    statut: 'active'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer la prestation
        const prestationData = await prestationsService.getPrestationById(id);
        setPrestation(prestationData);
        
        // Récupérer les catégories
        const categoriesResponse = await categoriesService.getAllCategories();
        setCategories(categoriesResponse.results || categoriesResponse);
        
        // Initialiser le formulaire
        setFormData({
          categorie: prestationData.categorie?.id || prestationData.categorie || '',
          intitule: prestationData.intitule || '',
          description: prestationData.description || '',
          type_prestation: prestationData.type_prestation || '',
          caracteristiques: prestationData.caracteristiques || {},
          zones_intervention: prestationData.zones_intervention || [],
          disponibilite_debut: prestationData.disponibilite_debut ? 
            new Date(prestationData.disponibilite_debut).toISOString().split('T')[0] : '',
          disponibilite_fin: prestationData.disponibilite_fin ? 
            new Date(prestationData.disponibilite_fin).toISOString().split('T')[0] : '',
          mode_tarification: prestationData.mode_tarification || 'fixe',
          tarif_min: prestationData.tarif_min || '',
          tarif_max: prestationData.tarif_max || '',
          statut: prestationData.statut || 'active'
        });
        
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

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
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateTarification = () => {
    const nextErrors = {};
    const isDevisMode = formData.mode_tarification === 'devis';

    if (!isDevisMode && !formData.tarif_min && !formData.tarif_max) {
      nextErrors.tarif_min = 'Indiquez au moins un tarif (minimum ou maximum)';
    }

    if (formData.tarif_min && parseFloat(formData.tarif_min) <= 0) {
      nextErrors.tarif_min = 'Le tarif minimum est invalide';
    }
    if (formData.tarif_max && parseFloat(formData.tarif_max) <= 0) {
      nextErrors.tarif_max = 'Le tarif maximum est invalide';
    }
    if (
      formData.tarif_min &&
      formData.tarif_max &&
      parseFloat(formData.tarif_min) > parseFloat(formData.tarif_max)
    ) {
      nextErrors.tarif_max = 'Le tarif maximum doit être supérieur au tarif minimum';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCaracteristiqueChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      caracteristiques: {
        ...prev.caracteristiques,
        [key]: value
      }
    }));
  };

  const addCaracteristique = () => {
    const newKey = `caracteristique_${Object.keys(formData.caracteristiques).length + 1}`;
    handleCaracteristiqueChange(newKey, '');
  };

  const removeCaracteristique = (key) => {
    const newCaracteristiques = { ...formData.caracteristiques };
    delete newCaracteristiques[key];
    setFormData(prev => ({ ...prev, caracteristiques: newCaracteristiques }));
  };

  const handleZoneChange = (index, value) => {
    const newZones = [...formData.zones_intervention];
    newZones[index] = value;
    setFormData(prev => ({ ...prev, zones_intervention: newZones }));
  };

  const addZone = () => {
    setFormData(prev => ({
      ...prev,
      zones_intervention: [...prev.zones_intervention, '']
    }));
  };

  const removeZone = (index) => {
    const newZones = formData.zones_intervention.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, zones_intervention: newZones }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateTarification()) return;
    
    try {
      setSaving(true);
      
      // Préparer les données
      const submitData = {
        ...formData,
        tarif_min: formData.tarif_min ? parseFloat(formData.tarif_min) : null,
        tarif_max: formData.tarif_max ? parseFloat(formData.tarif_max) : null,
        disponibilite_debut: formData.disponibilite_debut || null,
        disponibilite_fin: formData.disponibilite_fin || null,
        zones_intervention: formData.zones_intervention.filter(zone => zone.trim() !== '')
      };
      
      await prestationsService.updatePrestation(id, submitData);
      
      setToast({
        message: 'Prestation mise à jour avec succès',
        type: 'success'
      });
      
      setTimeout(() => {
        navigate(`/fournisseur/prestation/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setToast({
        message: err?.message || 'Erreur lors de la mise à jour de la prestation',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !prestation) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-lg">{error || 'Prestation non trouvée'}</div>
              <Link
                to="/fournisseur/dashboard"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour aux prestations
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/fournisseur/prestation/${id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Modifier la prestation</h1>
                <p className="text-gray-600 mt-1">{formData.intitule}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(categorie => (
                    <option key={categorie.id} value={categorie.id}>
                      {categorie.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de prestation *
                </label>
                <input
                  type="text"
                  name="type_prestation"
                  value={formData.type_prestation}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Développement web, Nettoyage..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intitulé de la prestation *
              </label>
              <input
                type="text"
                name="intitule"
                value={formData.intitule}
                onChange={handleChange}
                required
                placeholder="Décrivez brièvement votre service"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description détaillée *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Décrivez en détail votre prestation, les compétences requises, les livrables..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Caractéristiques techniques */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Caractéristiques techniques
                </label>
                <button
                  type="button"
                  onClick={addCaracteristique}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiPlus className="mr-2 h-4 w-4" />
                  Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(formData.caracteristiques).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleCaracteristiqueChange(key, e.target.value)}
                      placeholder="Ex: Langage: JavaScript, Outils: React..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeCaracteristique(key)}
                      className="inline-flex items-center p-2 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {Object.keys(formData.caracteristiques).length === 0 && (
                  <p className="text-gray-500 text-sm">Aucune caractéristique technique définie</p>
                )}
              </div>
            </div>

            {/* Zones d'intervention */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Zones d'intervention
                </label>
                <button
                  type="button"
                  onClick={addZone}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FiPlus className="mr-2 h-4 w-4" />
                  Ajouter une zone
                </button>
              </div>
              <div className="space-y-3">
                {formData.zones_intervention.map((zone, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={zone}
                      onChange={(e) => handleZoneChange(index, e.target.value)}
                      placeholder="Ex: Paris, Lyon, Marseille..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeZone(index)}
                      className="inline-flex items-center p-2 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {formData.zones_intervention.length === 0 && (
                  <p className="text-gray-500 text-sm">Aucune zone d'intervention définie</p>
                )}
              </div>
            </div>

            {/* Disponibilités et tarifs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début de disponibilité
                </label>
                <input
                  type="date"
                  name="disponibilite_debut"
                  value={formData.disponibilite_debut}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin de disponibilité
                </label>
                <input
                  type="date"
                  name="disponibilite_fin"
                  value={formData.disponibilite_fin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de tarification *
                </label>
                <select
                  name="mode_tarification"
                  value={formData.mode_tarification}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="fixe">Tarif fixe</option>
                  <option value="forfait">Forfait (prix package)</option>
                  <option value="fixe">Forfait (tarif fixe)</option>
                  <option value="horaire">À l&apos;heure</option>
                  <option value="devis">Sur devis (chiffrage après étude)</option>
                </select>
              </div>

              {formData.mode_tarification === 'devis' ? (
                <div className="md:col-span-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
                  Mode devis actif: les tarifs minimum/maximum sont optionnels.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarif minimum (FCFA)
                    </label>
                    <input
                      type="number"
                      name="tarif_min"
                      value={formData.tarif_min}
                      onChange={handleChange}
                      placeholder="Ex: 50000"
                      min="0"
                      step="1000"
                      className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${formErrors.tarif_min ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {formErrors.tarif_min && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.tarif_min}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarif maximum (FCFA)
                    </label>
                    <input
                      type="number"
                      name="tarif_max"
                      value={formData.tarif_max}
                      onChange={handleChange}
                      placeholder="Ex: 100000"
                      min="0"
                      step="1000"
                      className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${formErrors.tarif_max ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {formErrors.tarif_max && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.tarif_max}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut *
              </label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to={`/fournisseur/prestation/${id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </Link>
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
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
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

export default PrestationEdit;
