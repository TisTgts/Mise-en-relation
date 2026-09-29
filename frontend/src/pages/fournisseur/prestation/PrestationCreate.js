import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import prestationsService from '../../../services/prestationsService';
import categoriesService from '../../../services/categoriesService';
import PrestationFormFields from '../../../components/forms/PrestationFormFields';
import { friendlyErrorMessage } from '../../../utils/apiErrors';
import { buildPrestationPayload, todayInput, validatePrestation } from '../../../utils/prestationForm';

const PrestationCreate = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    categorie: '',
    type_prestation: '',
    intitule: '',
    description: '',
    caracteristiques: {},
    zones_intervention: [],
    disponibilite_debut: todayInput(),
    disponibilite_fin: '',
    mode_tarification: 'devis',
    tarif_min: '',
    tarif_max: '',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.type_utilisateur !== 'fournisseur') {
      navigate('/login');
      return;
    }
    categoriesService
      .getAllCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : data?.results || []))
      .catch(() => setCategories([]));
  }, [isAuthenticated, user, navigate]);

  const setField = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'categorie') {
        next.type_prestation = '';
        next.caracteristiques = {};
      }
      if (name === 'mode_tarification' && value === 'devis') {
        next.tarif_min = '';
        next.tarif_max = '';
      }
      return next;
    });
    if (errors[name] || errors.submit) {
      setErrors((prev) => ({ ...prev, [name]: '', submit: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validatePrestation(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await prestationsService.createPrestation(buildPrestationPayload(formData));
      navigate('/fournisseur/dashboard');
    } catch (error) {
      setErrors({
        ...(error?.fieldErrors || {}),
        submit: friendlyErrorMessage(error, "La prestation n'a pas pu être publiée. Vérifiez le formulaire puis réessayez."),
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle prestation</h1>
          <p className="mt-2 text-gray-600">
            Présentez le service que vous proposez : il sera proposé aux clients qui ont un besoin correspondant.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <PrestationFormFields formData={formData} setField={setField} errors={errors} categories={categories} />

          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

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
              {loading ? 'Publication en cours...' : 'Publier la prestation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrestationCreate;
