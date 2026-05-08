import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';
import demandesService from '../../../services/demandesService';
import categoriesService from '../../../services/categoriesService';

const normalizeCategoryNameBesoinEdit = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' et ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

const BESOIN_EDIT_CATEGORY_ALIASES = {
  'transport logistique': 'transport et logistique',
  'transport et logistique': 'transport et logistique',
  'informatique digital': 'informatique et digital',
  'informatique et digital': 'informatique et digital',
  'btp travaux': 'btp et travaux',
  'btp et travaux': 'btp et travaux',
  'maintenance reparation': 'maintenance et reparation',
  'maintenance et reparation': 'maintenance et reparation',
};

const BESOIN_EDIT_CATEGORY_CONFIGS = {
    'transport et logistique': {
      serviceTypes: ['Livraison urbaine', 'Transport interurbain', 'Déménagement', 'Messagerie', 'Stockage'],
      specificFields: [
        { key: 'type_marchandise', label: 'Type de marchandise' },
        { key: 'volume_estime', label: 'Volume estimé' },
        { key: 'distance_estimee_km', label: 'Distance estimée (km)', type: 'number' },
        { key: 'date_depart_souhaitee', label: 'Date de départ souhaitée', type: 'date' }
      ]
    },
    'informatique et digital': {
      serviceTypes: ['Développement web', 'Développement logiciel', 'Support informatique', 'Maintenance IT', 'Cybersécurité'],
      specificFields: [
        { key: 'contexte_technique', label: 'Contexte technique' },
        { key: 'stack_souhaitee', label: 'Stack souhaitée' },
        { key: 'niveau_securite', label: 'Niveau de sécurité', options: ['Standard', 'Renforcé', 'Critique'] },
        { key: 'support_requis', label: 'Support après livraison', options: ['Aucun', '1 mois', '3 mois', '6 mois'] }
      ]
    },
    'btp et travaux': {
      serviceTypes: ['Plomberie', 'Électricité', 'Maçonnerie', 'Peinture', 'Rénovation'],
      specificFields: [
        { key: 'surface_estimee_m2', label: 'Surface estimée (m²)', type: 'number' },
        { key: 'materiaux_fournis_par', label: 'Matériaux fournis par', options: ['Client', 'Fournisseur', 'À définir'] },
        { key: 'contraintes_site', label: 'Contraintes du site' },
        { key: 'permis_autorisation', label: 'Permis / autorisation', options: ['Déjà disponible', 'À obtenir', 'Non requis'] }
      ]
    },
    'maintenance et reparation': {
      serviceTypes: ['Maintenance climatisation', 'Réparation électroménager', 'Maintenance préventive', 'Dépannage urgent', 'Contrat de maintenance'],
      specificFields: [
        { key: 'equipement_concerne', label: 'Équipement concerné' },
        { key: 'marque_modele', label: 'Marque / modèle' },
        { key: 'panne_constatee', label: 'Panne constatée' },
        { key: 'frequence_intervention', label: 'Fréquence d’intervention', options: ['Ponctuelle', 'Mensuelle', 'Trimestrielle', 'Semestrielle'] }
      ]
    }
};

const BesoinEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [besoin, setBesoin] = useState(null);
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
    statut: 'ouverte',
    mode_budget: 'budget_fixe',
    budget: '',
    flexible: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const besoinData = await demandesService.getDemandeById(id);
        setBesoin(besoinData);
        
        // Récupérer les catégories via le service centralisé
        const categoriesData = await categoriesService.getAllCategories();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        
        // Initialiser le formulaire
        setFormData({
          categorie: besoinData.categorie?.id ?? besoinData.categorie ?? '',
          intitule: besoinData.intitule || '',
          description: besoinData.description || '',
          type_service: besoinData.type_service || '',
          exigences: besoinData.exigences || {},
          lieu_intervention: besoinData.lieu_intervention || '',
          date_souhaitee: besoinData.date_souhaitee ? 
            new Date(besoinData.date_souhaitee).toISOString().split('T')[0] : '',
          date_limite: besoinData.date_limite ? 
            new Date(besoinData.date_limite).toISOString().split('T')[0] : '',
          urgence: besoinData.urgence || 'normale',
          statut: besoinData.statut || 'ouverte',
          mode_budget: besoinData.mode_budget || 'budget_fixe',
          budget: besoinData.budget || '',
          flexible: besoinData.flexible || false
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

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(formData.categorie)),
    [categories, formData.categorie]
  );

  const categoryConfig = useMemo(() => {
    const normalized = normalizeCategoryNameBesoinEdit(selectedCategory?.nom || '');
    const canonical = BESOIN_EDIT_CATEGORY_ALIASES[normalized] || normalized;
    return BESOIN_EDIT_CATEGORY_CONFIGS[canonical] || null;
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
  };

  const handleExigenceChange = (key, value) => {
    setFormData((prev) => {
      const nextExigences = { ...(prev.exigences || {}) };
      if (value == null || value === '') {
        delete nextExigences[key];
      } else {
        nextExigences[key] = value;
      }
      return {
        ...prev,
        exigences: nextExigences
      };
    });
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
      const parsedCategorie =
        formData.categorie === '' || formData.categorie == null
          ? null
          : Number(formData.categorie);
      const submitData = {
        ...formData,
        categorie: Number.isNaN(parsedCategorie) ? null : parsedCategorie,
        intitule: (formData.intitule || '').trim(),
        description: (formData.description || '').trim(),
        type_service: (formData.type_service || '').trim(),
        statut: formData.statut || 'ouverte',
        exigences: formData.exigences && typeof formData.exigences === 'object' ? formData.exigences : {},
        budget: formData.mode_budget === 'sur_devis'
          ? null
          : (formData.budget ? parseFloat(formData.budget) : null),
        date_souhaitee: formData.date_souhaitee || null,
        date_limite: formData.date_limite || null
      };
      
      await demandesService.updateDemande(id, submitData);
      navigate(`/client/besoins/${id}`);
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err?.message || 'Impossible de mettre à jour le besoin');
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

  if (error || !besoin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-lg">{error || 'Besoin non trouvé'}</div>
              <Link
                to="/client/mes-besoins"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour à mes besoins
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/client/besoins/${id}`}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Modifier le besoin</h1>
                <p className="mt-1 text-sm text-slate-600">{formData.intitule}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Catégorie *
                </label>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Type de service *
                </label>
                {categoryConfig?.serviceTypes?.length ? (
                  <select
                    name="type_service"
                    value={formData.type_service}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    name="type_service"
                    value={formData.type_service}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Maintenance informatique, Nettoyage..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Intitulé du besoin *
              </label>
              <input
                type="text"
                name="intitule"
                value={formData.intitule}
                onChange={handleChange}
                required
                placeholder="Décrivez brièvement votre besoin"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description détaillée *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Décrivez en détail votre besoin, les tâches à accomplir, les objectifs..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Exigences spécifiques */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Exigences spécifiques</label>
                {!categoryConfig && (
                  <button
                    type="button"
                    onClick={addExigence}
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ajouter une exigence
                  </button>
                )}
              </div>

              {categoryConfig ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {categoryConfig.specificFields.map((field) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-sm text-slate-700">{field.label}</label>
                      {field.options ? (
                        <select
                          value={formData.exigences?.[field.key] || ''}
                          onChange={(e) => handleExigenceChange(field.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Sélectionner</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={formData.exigences?.[field.key] || ''}
                          onChange={(e) => handleExigenceChange(field.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(formData.exigences).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleExigenceChange(key, e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeExigence(key)}
                        className="inline-flex items-center rounded-lg border border-red-300 bg-white p-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.exigences).length === 0 && (
                    <p className="text-sm text-slate-500">Aucune exigence spécifique définie</p>
                  )}
                </div>
              )}
            </div>

            {/* Logistique */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Lieu d'intervention *
                </label>
                <input
                  type="text"
                  name="lieu_intervention"
                  value={formData.lieu_intervention}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Paris 75001, Sur site, À distance..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Niveau d'urgence *
                </label>
                <select
                  name="urgence"
                  value={formData.urgence}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Statut du besoin
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ouverte">Ouverte</option>
                  <option value="en_cours">En cours</option>
                  <option value="pourvue">Pourvue</option>
                  <option value="annulee">Annulée</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Choisissez "Ouverte" pour republier le besoin et relancer la mise en relation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date souhaitée
                </label>
                <input
                  type="date"
                  name="date_souhaitee"
                  value={formData.date_souhaitee}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date limite
                </label>
                <input
                  type="date"
                  name="date_limite"
                  value={formData.date_limite}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mode de prix
                </label>
                <select
                  name="mode_budget"
                  value={formData.mode_budget}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="budget_fixe">Budget fixe</option>
                  <option value="sur_devis">Sur devis (proposition fournisseur)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Budget (FCFA) {formData.mode_budget === 'budget_fixe' ? '*' : '(optionnel)'}
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Ex: 50000"
                  min="0"
                  step="1000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {formData.mode_budget === 'sur_devis' && (
                  <p className="mt-1 text-xs text-slate-500">
                    Le prix final sera validé via devis client/fournisseur.
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="flexible"
                  id="flexible"
                  checked={formData.flexible}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="flexible" className="ml-2 block text-sm text-slate-700">
                  Budget flexible
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 border-t border-slate-200 pt-6">
              <Link
                to={`/client/besoins/${id}`}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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

export default BesoinEdit;
