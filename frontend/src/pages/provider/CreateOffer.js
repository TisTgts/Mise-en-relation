import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiUpload, FiMapPin, FiClock, FiDollarSign, FiAlertTriangle, FiFileText, FiPlus, FiMinus, FiCheckCircle, FiStar } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const CreateOffer = () => {
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
    specifications: {
      capacity: '',
      vehicle_type: '',
      equipment: ['']
    },
    service_areas: [''],
    availability_start: '',
    availability_end: '',
    pricing_model: 'fixed',
    price_range_min: '',
    price_range_max: '',
    experience_level: 'intermediate',
    status: 'active',
    is_featured: false,
    is_verified: false,
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
    
    if (!formData.availability_start) {
      newErrors.availability_start = 'La date de début est requise';
    }
    
    if (!formData.availability_end) {
      newErrors.availability_end = 'La date de fin est requise';
    } else if (formData.availability_start) {
      const startDate = new Date(formData.availability_start);
      const endDate = new Date(formData.availability_end);
      if (endDate <= startDate) {
        newErrors.availability_end = 'La date de fin doit être après la date de début';
      }
    }
    
    if (!formData.price_range_min || parseFloat(formData.price_range_min) <= 0) {
      newErrors.price_range_min = 'Le prix minimum doit être supérieur à 0';
    }
    
    if (!formData.price_range_max || parseFloat(formData.price_range_max) <= 0) {
      newErrors.price_range_max = 'Le prix maximum doit être supérieur à 0';
    }
    
    if (formData.price_range_min && formData.price_range_max) {
      const min = parseFloat(formData.price_range_min);
      const max = parseFloat(formData.price_range_max);
      if (min >= max) {
        newErrors.price_range_max = 'Le prix maximum doit être supérieur au prix minimum';
      }
    }
    
    // Vérifier qu'il y a au moins une zone de service
    const validServiceAreas = formData.service_areas.filter(area => area.trim() !== '');
    if (validServiceAreas.length === 0) {
      newErrors.service_areas = 'Au moins une zone de service est requise';
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
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleEquipmentChange = (index, value) => {
    const newEquipment = [...formData.specifications.equipment];
    newEquipment[index] = value;
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        equipment: newEquipment
      }
    }));
  };

  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        equipment: [...prev.specifications.equipment, '']
      }
    }));
  };

  const removeEquipment = (index) => {
    const newEquipment = formData.specifications.equipment.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        equipment: newEquipment
      }
    }));
  };

  const handleServiceAreaChange = (index, value) => {
    const newServiceAreas = [...formData.service_areas];
    newServiceAreas[index] = value;
    setFormData(prev => ({
      ...prev,
      service_areas: newServiceAreas
    }));
  };

  const addServiceArea = () => {
    setFormData(prev => ({
      ...prev,
      service_areas: [...prev.service_areas, '']
    }));
  };

  const removeServiceArea = (index) => {
    const newServiceAreas = formData.service_areas.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      service_areas: newServiceAreas
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
        price_range_min: parseFloat(formData.price_range_min),
        price_range_max: parseFloat(formData.price_range_max),
        // Nettoyer les équipements et zones de service vides
        specifications: {
          ...formData.specifications,
          equipment: formData.specifications.equipment.filter(e => e.trim() !== '')
        },
        service_areas: formData.service_areas.filter(area => area.trim() !== '')
      };
      
      console.log('Données envoyées:', submissionData);
      
      const response = await fetch('/api/services/offers/', {
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
          window.location.href = '/dashboard/provider';
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
            submit: responseData.message || 'Erreur lors de la création de l\'offre' 
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'offre:', error);
      setSubmitting(false);
      setErrors({ 
        submit: 'Erreur de connexion. Veuillez réessayer.' 
      });
    }
  };

  const getExperienceColor = (level) => {
    switch (level) {
      case 'beginner': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'intermediate': return 'text-green-600 bg-green-100 border-green-300';
      case 'expert': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'master': return 'text-orange-600 bg-orange-100 border-orange-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getExperienceText = (level) => {
    switch (level) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'expert': return 'Expert';
      case 'master': return 'Maître';
      default: return level;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Offre créée avec succès!</h2>
          <p className="text-gray-600 mb-4">Votre offre est maintenant visible par les clients qui peuvent vous contacter.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Créer une offre</h1>
            <p className="text-gray-600 mt-1">Trouvez des clients pour vos services</p>
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
                    Titre de l'offre *
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
                  placeholder="Décrivez votre offre en détail..."
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
                    Niveau d'expérience
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      getExperienceColor(formData.experience_level)
                    }`}
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="expert">Expert</option>
                    <option value="master">Maître</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Spécifications */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Spécifications techniques</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacité
                  </label>
                  <input
                    type="text"
                    name="specifications.capacity"
                    value={formData.specifications.capacity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: 10 tonnes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de véhicule/équipement
                  </label>
                  <input
                    type="text"
                    name="specifications.vehicle_type"
                    value={formData.specifications.vehicle_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: Camion bache"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipements disponibles
                </label>
                {formData.specifications.equipment.map((equipment, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={equipment}
                      onChange={(e) => handleEquipmentChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: Grue de chargement"
                    />
                    {formData.specifications.equipment.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEquipment(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <FiMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEquipment}
                  className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  Ajouter un équipement
                </button>
              </div>
            </div>

            {/* Zones de service */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Zones de service</h2>
              
              <div>
                {formData.service_areas.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 relative">
                      <FiMapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => handleServiceAreaChange(index, e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.service_areas && index === 0 ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ex: Ouagadougou"
                      />
                    </div>
                    {formData.service_areas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceArea(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <FiMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {errors.service_areas && (
                  <p className="text-red-600 text-sm mt-1">{errors.service_areas}</p>
                )}
                <button
                  type="button"
                  onClick={addServiceArea}
                  className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  Ajouter une zone
                </button>
              </div>
            </div>

            {/* Disponibilité et prix */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Disponibilité et tarification</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="datetime-local"
                    name="availability_start"
                    value={formData.availability_start}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.availability_start ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.availability_start && (
                    <p className="text-red-600 text-sm mt-1">{errors.availability_start}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin *
                  </label>
                  <input
                    type="datetime-local"
                    name="availability_end"
                    value={formData.availability_end}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.availability_end ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.availability_end && (
                    <p className="text-red-600 text-sm mt-1">{errors.availability_end}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modèle de prix *
                  </label>
                  <select
                    name="pricing_model"
                    value={formData.pricing_model}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="fixed">Prix fixe</option>
                    <option value="hourly">Par heure</option>
                    <option value="daily">Par jour</option>
                    <option value="per_project">Par projet</option>
                    <option value="per_ton">Par tonne</option>
                    <option value="per_km">Par kilomètre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix minimum (XOF) *
                  </label>
                  <input
                    type="number"
                    name="price_range_min"
                    value={formData.price_range_min}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="1000"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.price_range_min ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="250000"
                  />
                  {errors.price_range_min && (
                    <p className="text-red-600 text-sm mt-1">{errors.price_range_min}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix maximum (XOF) *
                  </label>
                  <input
                    type="number"
                    name="price_range_max"
                    value={formData.price_range_max}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="1000"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.price_range_max ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="300000"
                  />
                  {errors.price_range_max && (
                    <p className="text-red-600 text-sm mt-1">{errors.price_range_max}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Options de publication</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <FiStar className="h-4 w-4 mr-1 text-yellow-500" />
                      Mettre en avant
                    </div>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={(e) => handleInputChange({ target: { name: 'status', value: e.target.checked ? 'active' : 'inactive' } })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Activer immédiatement
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_verified"
                    checked={formData.is_verified}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Offre vérifiée
                  </label>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Documents et pièces jointes</h2>
              
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
                    <p className="text-xs text-gray-500 mt-1">
                      Max: 10MB par fichier
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
                    Publier l'offre
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

export default CreateOffer;
