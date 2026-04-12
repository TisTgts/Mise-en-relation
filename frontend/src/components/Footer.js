import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">ServiceConnect</h3>
            <p className="text-gray-300">
              Plateforme de mise en relation pour tous types de services entre professionnels.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Liens utiles</h4>
            <ul className="space-y-2">
              <li><button className="text-gray-300 hover:text-white bg-transparent border-none cursor-pointer">À propos</button></li>
              <li><button className="text-gray-300 hover:text-white bg-transparent border-none cursor-pointer">Comment ça marche</button></li>
              <li><button className="text-gray-300 hover:text-white bg-transparent border-none cursor-pointer">Contact</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-gray-300">
              Ouagadougou, Burkina Faso<br />
              Email: contact@serviceconnect.bf<br />
              Téléphone: +226 XX XX XX XX
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 ServiceConnect. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
