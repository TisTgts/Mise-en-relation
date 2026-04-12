// Script de test pour déboguer les catégories
// À exécuter dans la console du navigateur

async function testCategories() {
  console.log('=== Test des catégories ===');
  
  // 1. Vérifier l'URL de l'endpoint
  const API_ENDPOINTS = {
    SERVICES: {
      CATEGORIES: '/api/services/categories/'
    }
  };
  
  console.log('Endpoint URL:', API_ENDPOINTS.SERVICES.CATEGORIES);
  
  // 2. Tester avec fetch simple
  try {
    console.log('Test avec fetch simple...');
    const response = await fetch(API_ENDPOINTS.SERVICES.CATEGORIES);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Data reçue:', data);
      console.log('Nombre de catégories:', data.results?.length || data.length || 0);
    } else {
      console.error('Erreur HTTP:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Erreur fetch:', error);
  }
  
  // 3. Tester avec URL complète
  try {
    console.log('Test avec URL complète...');
    const fullUrl = 'http://localhost:8000/api/services/categories/';
    console.log('Full URL:', fullUrl);
    
    const response = await fetch(fullUrl);
    console.log('Full URL response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Full URL data:', data);
    } else {
      console.error('Erreur full URL:', response.status);
    }
  } catch (error) {
    console.error('Erreur full URL:', error);
  }
  
  // 4. Vérifier localStorage
  console.log('Token dans localStorage:', localStorage.getItem('access_token') ? 'Présent' : 'Absent');
  console.log('Type utilisateur:', localStorage.getItem('type_utilisateur'));
}

// Exporter pour utilisation dans la console
window.testCategories = testCategories;

console.log('Fonction testCategories() disponible. Exécutez testCategories() dans la console.');
