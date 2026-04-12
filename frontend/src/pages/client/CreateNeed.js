import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiUpload, FiMapPin, FiClock, FiDollarSign, FiAlertTriangle, FiFileText, FiCalendar, FiCheckCircle, FiPlus, FiMinus } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const CreateNeed = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    service_type: '',
    requirements: {
      specifications: '',
      deliverables: [''],
      timeline: ''
    },
    service_location: '',
    preferred_date: '',
    deadline: '',
    urgency: 'medium',
    budget: '',
    is_flexible: false,
    attachments: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Utiliser l'API publique qui ne nécessite pas d'authentification
      const response = await fetch('/api/services/categories/public/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Categories response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Categories data received:', data);
      
      // Utiliser les résultats de l'API publique
      setCategories(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    
    if (!formData.category) {
      newErrors.category = 'La catégorie est requise';
    }
    
    if (!formData.service_type.trim()) {
      newErrors.service_type = 'Le type de service est requis';
    }
    
    if (!formData.service_location.trim()) {
      newErrors.service_location = 'Le lieu de service est requis';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'La date limite est requise';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = 'La date limite doit être dans le futur';
      }
    }
    
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Le budget doit être supérieur à 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Effacer l'erreur lorsque l'utilisateur corrige le champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (child === 'deliverables') {
        const deliverables = value.split(',').map(item => item.trim()).filter(item => item);
        setFormData(prev => ({
          ...prev,
          requirements: {
            ...prev.requirements,
            deliverables
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          requirements: {
            ...prev.requirements,
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleDeliverableChange = (index, value) => {
    const newDeliverables = [...formData.requirements.deliverables];
    newDeliverables[index] = value;
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        deliverables: newDeliverables
      }
    }));
  };

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        deliverables: [...prev.requirements.deliverables, '']
      }
    }));
  };

  const removeDeliverable = (index) => {
    const newDeliverables = formData.requirements.deliverables.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        deliverables: newDeliverables
      }
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileData = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file: file
    }));
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...fileData]
    }));
  };

  const removeAttachment = (index) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Préparer les données pour l'API
      const submissionData = {
        ...formData,
        budget: parseFloat(formData.budget),
        preferred_date: formData.preferred_date || null,
        // Nettoyer les livrables vides
        requirements: {
          ...formData.requirements,
          deliverables: formData.requirements.deliverables.filter(d => d.trim() !== '')
        }
      };
      
      console.log('Données envoyées:', submissionData);
      
      const response = await fetch('/api/services/needs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setSubmitting(false);
        
        // Redirection après 2 secondes
        setTimeout(() => {
          window.location.href = '/dashboard/client';
        }, 2000);
      } else {
        setSubmitting(false);
        
        // Gérer les erreurs de validation Django
        if (responseData.errors) {
          const apiErrors = {};
          Object.keys(responseData.errors).forEach(key => {
            apiErrors[key] = responseData.errors[key][0];
          });
          setErrors(apiErrors);
        } else {
          setErrors({ 
            submit: responseData.message || 'Erreur lors de la création du besoin' 
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création du besoin:', error);
      setSubmitting(false);
      setErrors({ 
        submit: 'Erreur de connexion. Veuillez réessayer.' 
      });
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-300';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Besoin créé avec succès!</h2>
          <p className="text-gray-600 mb-4">Votre besoin a été publié et les fournisseurs pourront maintenant y répondre.</p>
          <p className="text-sm text-gray-500">Redirection vers votre dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Publier un besoin</h1>
            <p className="text-gray-600 mt-1">Trouvez les meilleurs fournisseurs pour vos besoins</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Message d'erreur global */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FiAlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-700">{errors.submit}</span>
                </div>
              </div>
            )}

            {/* Informations de base */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Informations de base</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du besoin *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Transport de marchandises"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {Array.isArray(categories) && categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description détaillée *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Décrivez votre besoin en détail..."
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de service *
                  </label>
                  <input
                    type="text"
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.service_type ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Transport"
                  />
                  {errors.service_type && (
                    <p className="text-red-600 text-sm mt-1">{errors.service_type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu du service *
                  </label>
                  <input
                    type="text"
                    name="service_location"
                    value={formData.service_location}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.service_location ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Ouagadougou, Zone industrielle"
                  />
                  {errors.service_location && (
                    <p className="text-red-600 text-sm mt-1">{errors.service_location}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Exigences */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Exigences spécifiques</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécifications techniques
                </label>
                <textarea
                  name="requirements.specifications"
                  value={formData.requirements.specifications}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Camion de 10 tonnes, Chauffeur expérimenté, Assurance complète"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Livrables attendus
                </label>
                {formData.requirements.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={deliverable}
                      onChange={(e) => handleDeliverableChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: Livraison à destination"
                    />
                    {formData.requirements.deliverables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDeliverable(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <FiMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDeliverable}
                  className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  Ajouter un livrable
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délais souhaités
                </label>
                <textarea
                  name="requirements.timeline"
                  value={formData.requirements.timeline}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Livraison sous 48h, Disponibilité week-end"
                />
              </div>
            </div>

            {/* Calendrier et budget */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Calendrier et budget</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date préférée
                  </label>
                  <input
                    type="datetime-local"
                    name="preferred_date"
                    value={formData.preferred_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite *
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.deadline ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.deadline && (
                    <p className="text-red-600 text-sm mt-1">{errors.deadline}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (XOF) *
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="1000"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.budget ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="500000"
                  />
                  {errors.budget && (
                    <p className="text-red-600 text-sm mt-1">{errors.budget}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgence *
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      getUrgencyColor(formData.urgency)
                    }`}
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_flexible"
                      checked={formData.is_flexible}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Budget négociable
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pièces jointes
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FiUpload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <p className="text-sm text-gray-600">
                      Cliquez pour uploader des documents (PDF, DOC, Images)
                    </p>
                  </label>
                  
                  {formData.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="flex items-center">
                            <FiFileText className="h-4 w-4 mr-2" />
                            <span>{file.name}</span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publication...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FiSave className="h-4 w-4 mr-2" />
                    Publier le besoin
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateNeed;
