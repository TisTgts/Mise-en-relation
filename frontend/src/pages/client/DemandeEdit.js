import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';
import demandesService from '../../services/demandesService';

const DemandeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Formulaire
  const [formData, setFormData] = useState({
    categorie: '',
    intitule: '',
    description: '',
    type_service: '',
    exigences: {},
    lieu_intervention: '',
    date_souhaitee: '',
    date_limite: '',
    urgence: 'normale',
    budget: '',
    flexible: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer la demande
        const demandeData = await demandesService.getDemandeById(id);
        setDemande(demandeData);
        
        // Récupérer les catégories
        const categoriesResponse = await fetch('/api/services/categories/');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.results || categoriesData);
        
        // Initialiser le formulaire
        setFormData({
          categorie: demandeData.categorie?.id || '',
          intitule: demandeData.intitule || '',
          description: demandeData.description || '',
          type_service: demandeData.type_service || '',
          exigences: demandeData.exigences || {},
          lieu_intervention: demandeData.lieu_intervention || '',
          date_souhaitee: demandeData.date_souhaitee ? 
            new Date(demandeData.date_souhaitee).toISOString().split('T')[0] : '',
          date_limite: demandeData.date_limite ? 
            new Date(demandeData.date_limite).toISOString().split('T')[0] : '',
          urgence: demandeData.urgence || 'normale',
          budget: demandeData.budget || '',
          flexible: demandeData.flexible || false
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
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExigenceChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      exigences: {
        ...prev.exigences,
        [key]: value
      }
    }));
  };

  const addExigence = () => {
    const newKey = `exigence_${Object.keys(formData.exigences).length + 1}`;
    handleExigenceChange(newKey, '');
  };

  const removeExigence = (key) => {
    const newExigences = { ...formData.exigences };
    delete newExigences[key];
    setFormData(prev => ({ ...prev, exigences: newExigences }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Préparer les données
      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        date_souhaitee: formData.date_souhaitee || null,
        date_limite: formData.date_limite || null
      };
      
      await demandesService.updateDemande(id, submitData);
      navigate(`/fournisseur/demandes/${id}`);
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Impossible de mettre à jour la demande');
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

  if (error || !demande) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-lg">{error || 'Demande non trouvée'}</div>
              <Link
                to="/fournisseur/mes-demandes"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour aux demandes
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
                to={`/fournisseur/demandes/${id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Modifier la demande</h1>
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
                  Type de service *
                </label>
                <input
                  type="text"
                  name="type_service"
                  value={formData.type_service}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Maintenance informatique, Nettoyage..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intitulé de la demande *
              </label>
              <input
                type="text"
                name="intitule"
                value={formData.intitule}
                onChange={handleChange}
                required
                placeholder="Décrivez brièvement votre besoin"
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
                placeholder="Décrivez en détail votre besoin, les tâches à accomplir, les objectifs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Exigences spécifiques */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Exigences spécifiques
                </label>
                <button
                  type="button"
                  onClick={addExigence}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Ajouter une exigence
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(formData.exigences).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleExigenceChange(key, e.target.value)}
                      placeholder="Ex: Certification requise, Matériel spécifique..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeExigence(key)}
                      className="inline-flex items-center p-2 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {Object.keys(formData.exigences).length === 0 && (
                  <p className="text-gray-500 text-sm">Aucune exigence spécifique définie</p>
                )}
              </div>
            </div>

            {/* Logistique */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu d'intervention *
                </label>
                <input
                  type="text"
                  name="lieu_intervention"
                  value={formData.lieu_intervention}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Paris 75001, Sur site, À distance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau d'urgence *
                </label>
                <select
                  name="urgence"
                  value={formData.urgence}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date souhaitée
                </label>
                <input
                  type="date"
                  name="date_souhaitee"
                  value={formData.date_souhaitee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date limite
                </label>
                <input
                  type="date"
                  name="date_limite"
                  value={formData.date_limite}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (FCFA)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Ex: 50000"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="flexible"
                  id="flexible"
                  checked={formData.flexible}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="flexible" className="ml-2 block text-sm text-gray-700">
                  Budget flexible
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to={`/fournisseur/demandes/${id}`}
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
    </div>
  );
};

export default DemandeEdit;
