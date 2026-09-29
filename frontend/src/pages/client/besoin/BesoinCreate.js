import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import categoriesService from '../../../services/categoriesService';
import demandesService from '../../../services/demandesService';
import { COPY } from '../../../pays';
import { friendlyErrorMessage } from '../../../utils/apiErrors';

const BesoinCreate = () => {
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
    mode_budget: 'budget_fixe',
    budget: '',
    flexible: false,
    statut: 'ouverte'
  });

  useEffect(() => {
    if (!isAuthenticated || user?.type_utilisateur !== 'client') {
      navigate('/login');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, user, navigate]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.getAllCategories();
      setCategories(data);
    } catch (_error) {
      setCategories([]);
    }
  };

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(formData.categorie)),
    [categories, formData.categorie]
  );

  const categoryConfig = useMemo(() => {
    const specificFields = selectedCategory?.champs_specifiques || [];
    const serviceTypes = selectedCategory?.types_service_suggeres || [];
    if (!specificFields.length && !serviceTypes.length) return null;
    return { specificFields, serviceTypes };
  }, [selectedCategory]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'categorie') {
        next.type_service = '';
        next.exigences = {};
      }
      return next;
    });

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSpecificFieldChange = (key, value) => {
    setFormData((prev) => {
      const newExigences = { ...prev.exigences };
      if (value === '' || value == null) {
        delete newExigences[key];
      } else {
        newExigences[key] = value;
      }
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
    
    if (formData.mode_budget === 'budget_fixe' && (!formData.budget || formData.budget <= 0)) {
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
    
    if (categoryConfig?.specificFields?.length) {
      categoryConfig.specificFields.forEach((field) => {
        if (field.required && !String(formData.exigences?.[field.key] || '').trim()) {
          newErrors[field.key] = 'Cette information est obligatoire';
        }
      });
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
        budget: formData.mode_budget === 'sur_devis'
          ? null
          : parseFloat(formData.budget)
      };
      
      const created = await demandesService.createDemande(demandeData);
      const newId = created?.id;
      const qs = new URLSearchParams({ hint: 'matching' });
      if (newId != null) qs.set('besoin', String(newId));
      navigate(`/client/mes-besoins?${qs.toString()}`);
      
    } catch (error) {
      setErrors({
        ...(error?.fieldErrors || {}),
        submit: friendlyErrorMessage(error, "Le besoin n'a pas pu être publié. Vérifiez le formulaire puis réessayez."),
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
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="max-w-5xl">
        {/* En-tête */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            Créer un nouveau besoin
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Décrivez le service dont vous avez besoin
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Informations générales */}
            <div className="space-y-6">
              <div>
                <label htmlFor="intitule" className="block text-sm font-medium text-slate-700">
                  Intitulé du besoin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="intitule"
                  name="intitule"
                  value={formData.intitule}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.intitule ? 'form-field-error' : ''
                  }`}
                  placeholder="Ex: Transport de matières premières"
                />
                {errors.intitule && (
                  <p className="mt-1 text-sm text-red-600">{errors.intitule}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.description ? 'form-field-error' : ''
                  }`}
                  placeholder="Décrivez en détail votre besoin..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="categorie" className="block text-sm font-medium text-slate-700">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categorie"
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleChange}
                    className={`form-select ${
                      errors.categorie ? 'form-field-error' : ''
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
                  <p className="mt-1 text-xs text-slate-500">
                    {Array.isArray(categories) ? `${categories.length} catégorie(s) disponible(s)` : 'Chargement des catégories...'}
                  </p>
                </div>

                <div>
                  <label htmlFor="type_service" className="block text-sm font-medium text-slate-700">
                    Type de service <span className="text-red-500">*</span>
                  </label>
                  {categoryConfig?.serviceTypes?.length ? (
                    <select
                      id="type_service"
                      name="type_service"
                      value={formData.type_service}
                      onChange={handleChange}
                      className={`form-select ${
                        errors.type_service ? 'form-field-error' : ''
                      }`}
                    >
                      <option value="">Sélectionner un type</option>
                      {categoryConfig.serviceTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value="Autre">Autre</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="type_service"
                      name="type_service"
                      value={formData.type_service}
                      onChange={handleChange}
                      className={`form-input ${
                        errors.type_service ? 'form-field-error' : ''
                      }`}
                      placeholder="Ex: Transport routier"
                    />
                  )}
                  {errors.type_service && (
                    <p className="mt-1 text-sm text-red-600">{errors.type_service}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {categoryConfig?.specificFields?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Quelques précisions</h3>
              <p className="mb-4 text-sm text-slate-500">
                Ces réponses aident les prestataires à comprendre votre besoin et à vous faire un prix juste.
              </p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {categoryConfig.specificFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700">
                      {field.label}{field.required && <> <span className="text-red-500">*</span></>}
                    </label>
                    {field.options ? (
                      <select
                        value={formData.exigences?.[field.key] || ''}
                        onChange={(e) => handleSpecificFieldChange(field.key, e.target.value)}
                        className={`form-select ${
                          errors[field.key] ? 'form-field-error' : ''
                        }`}
                      >
                        <option value="">Choisir une réponse</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={formData.exigences?.[field.key] || ''}
                        onChange={(e) => handleSpecificFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={`form-input ${
                          errors[field.key] ? 'form-field-error' : ''
                        }`}
                      />
                    )}
                    {field.help && !errors[field.key] && (
                      <p className="mt-1 text-xs text-slate-500">{field.help}</p>
                    )}
                    {errors[field.key] && (
                      <p className="mt-1 text-sm text-red-600">{errors[field.key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lieu et dates */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Lieu et Planning</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="lieu_intervention" className="block text-sm font-medium text-slate-700">
                  Lieu d'intervention <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lieu_intervention"
                  name="lieu_intervention"
                  value={formData.lieu_intervention}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.lieu_intervention ? 'form-field-error' : ''
                  }`}
                  placeholder={COPY.cities_placeholder || 'Ex: ville1, ville2'}
                />
                {errors.lieu_intervention && (
                  <p className="mt-1 text-sm text-red-600">{errors.lieu_intervention}</p>
                )}
              </div>

              <div>
                <label htmlFor="urgence" className="block text-sm font-medium text-slate-700">
                  Niveau d'urgence
                </label>
                <select
                  id="urgence"
                  name="urgence"
                  value={formData.urgence}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label htmlFor="date_souhaitee" className="block text-sm font-medium text-slate-700">
                  Date souhaitée <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="date_souhaitee"
                  name="date_souhaitee"
                  value={formData.date_souhaitee}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.date_souhaitee ? 'form-field-error' : ''
                  }`}
                />
                {errors.date_souhaitee && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_souhaitee}</p>
                )}
              </div>

              <div>
                <label htmlFor="date_limite" className="block text-sm font-medium text-slate-700">
                  Date limite <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="date_limite"
                  name="date_limite"
                  value={formData.date_limite}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.date_limite ? 'form-field-error' : ''
                  }`}
                />
                {errors.date_limite && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_limite}</p>
                )}
              </div>
            </div>
          </div>

          {/* Budget et options */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Budget et Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="mode_budget" className="block text-sm font-medium text-slate-700">
                  Mode de prix
                </label>
                <select
                  id="mode_budget"
                  name="mode_budget"
                  value={formData.mode_budget}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="budget_fixe">Budget fixe — prix connu ou fourchette</option>
                  <option value="sur_devis">Sur devis — les fournisseurs chiffrent avant validation</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-slate-700">
                  Budget (FCFA) {formData.mode_budget === 'budget_fixe' ? <span className="text-red-500">*</span> : '(optionnel)'}
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.budget ? 'form-field-error' : ''
                  }`}
                  placeholder={formData.mode_budget === 'sur_devis' ? 'Optionnel' : '100000'}
                />
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
                )}
                {formData.mode_budget === 'sur_devis' && (
                  <p className="mt-1 text-xs text-slate-500">
                    Après le matching, chaque fournisseur pourra proposer un devis. Vous le comparerez
                    puis validerez avant de confirmer la collaboration.
                  </p>
                )}
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
                <span className="ml-2 text-sm text-slate-700">
                  Budget flexible (négociable)
                </span>
              </label>
            </div>
          </div>

          {/* Erreurs générales */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/client/mes-besoins')}
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <FiSave className="mr-2" />
              )}
              {loading ? 'Création en cours...' : 'Créer le besoin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BesoinCreate;
