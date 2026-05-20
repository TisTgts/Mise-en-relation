import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_CONTACT_EMAIL } from '../config/branding';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">{APP_NAME}</h3>
            <p className="text-gray-300">
              Plateforme de mise en relation pour tous types de services entre professionnels.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Liens utiles</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white">Accueil</Link></li>
              <li><Link to="/services" className="text-gray-300 hover:text-white">Services</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-white">Connexion</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-gray-300">
              Ouagadougou, Burkina Faso<br />
              Email: {APP_CONTACT_EMAIL}<br />
              Téléphone: +226 XX XX XX XX
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 {APP_NAME}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
