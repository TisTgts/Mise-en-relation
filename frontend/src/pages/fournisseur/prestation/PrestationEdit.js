import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import prestationsService from '../../../services/prestationsService';
import categoriesService from '../../../services/categoriesService';
import Toast from '../../../components/Toast';
import PrestationFormFields from '../../../components/forms/PrestationFormFields';
import { friendlyErrorMessage } from '../../../utils/apiErrors';
import { buildPrestationPayload, toDateInput, todayInput, validatePrestation } from '../../../utils/prestationForm';

const STATUT_OPTIONS = [
  { value: 'active', label: 'Visible par les clients' },
  { value: 'inactive', label: 'En pause (masquée)' },
];

const STATUT_LABELS = {
  en_cours: 'En cours (collaboration active)',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

const PrestationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prestation, setPrestation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    categorie: '',
    type_prestation: '',
    intitule: '',
    description: '',
    caracteristiques: {},
    zones_intervention: [],
    disponibilite_debut: '',
    disponibilite_fin: '',
    mode_tarification: 'devis',
    tarif_min: '',
    tarif_max: '',
    statut: 'active',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [data, categoriesResponse] = await Promise.all([
          prestationsService.getPrestationById(id),
          categoriesService.getAllCategories(),
        ]);
        setPrestation(data);
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse?.results || []);
        setFormData({
          categorie: data.categorie?.id || data.categorie || '',
          type_prestation: data.type_prestation || '',
          intitule: data.intitule || '',
          description: data.description || '',
          caracteristiques:
            data.caracteristiques && typeof data.caracteristiques === 'object' && !Array.isArray(data.caracteristiques)
              ? data.caracteristiques
              : {},
          zones_intervention: Array.isArray(data.zones_intervention) ? data.zones_intervention.filter(Boolean) : [],
          disponibilite_debut: toDateInput(data.disponibilite_debut) || todayInput(),
          disponibilite_fin: toDateInput(data.disponibilite_fin),
          mode_tarification: data.mode_tarification || 'devis',
          tarif_min: data.tarif_min ?? '',
          tarif_max: data.tarif_max ?? '',
          statut: data.statut || 'active',
        });
      } catch (err) {
        setError(friendlyErrorMessage(err, 'Impossible de charger cette prestation. Réessayez dans un instant.'));
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

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
    const nextErrors = validatePrestation(formData, { minDescription: 1 });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      const payload = buildPrestationPayload(formData);
      if (STATUT_OPTIONS.some((o) => o.value === formData.statut)) {
        payload.statut = formData.statut;
      }
      await prestationsService.updatePrestation(id, payload);
      setToast({ message: 'Prestation mise à jour.', type: 'success' });
      setTimeout(() => navigate(`/fournisseur/prestation/${id}`), 1200);
    } catch (err) {
      const message = friendlyErrorMessage(err, "Les modifications n'ont pas pu être enregistrées. Réessayez.");
      setErrors({ ...(err?.fieldErrors || {}), submit: message });
      setToast({ message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error || !prestation) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-lg">{error || 'Prestation introuvable.'}</div>
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

  const statutOptions = STATUT_OPTIONS.some((o) => o.value === formData.statut)
    ? STATUT_OPTIONS
    : [{ value: formData.statut, label: STATUT_LABELS[formData.statut] || formData.statut }, ...STATUT_OPTIONS];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
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
              <p className="text-gray-600 mt-1">{prestation.intitule}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <PrestationFormFields formData={formData} setField={setField} errors={errors} categories={categories}>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Visibilité</h3>
              <select
                id="statut"
                value={formData.statut}
                onChange={(e) => setField('statut', e.target.value)}
                className="form-select mt-4 md:w-1/2"
              >
                {statutOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Une prestation en pause n&apos;est plus proposée aux clients, mais vous pouvez la réactiver à tout moment.
              </p>
            </div>
          </PrestationFormFields>

          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4">
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PrestationEdit;
