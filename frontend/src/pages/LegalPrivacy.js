import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_CONTACT_EMAIL } from '../config/branding';

const SECTIONS = [
  {
    title: '1. Responsable du traitement',
    body: `${APP_NAME} traite vos données personnelles pour fournir le service de mise en relation (site web et application mobile). Contact confidentialité / support : ${APP_CONTACT_EMAIL}.`,
  },
  {
    title: '2. Données collectées',
    body: 'Compte (identité, email, téléphone), profils métier, besoins et prestations, messages et pièces jointes, données techniques (jetons de session, tokens push), et données de localisation lorsque vous les fournissez.',
  },
  {
    title: '3. Finalités',
    body: 'Création et gestion de compte, matching, collaborations, messagerie, notifications, sécurité (prévention de fraude, reset mot de passe), support et amélioration du service. Nous ne vendons pas vos données à des tiers.',
  },
  {
    title: '4. Bases et cadre juridique',
    body: 'Traitements fondés sur l’exécution du service, votre consentement le cas échéant (ex. notifications), et nos intérêts légitimes de sécurité. Cadre notamment la loi togolaise n° 2019-014 et les textes applicables au Burkina Faso.',
  },
  {
    title: '5. Conservation et sécurité',
    body: 'Les données sont conservées le temps nécessaire au service et aux obligations légales. Les échanges API sont protégés (HTTPS en production) ; les sessions peuvent être révoquées (déconnexion, reset mot de passe, suppression de compte).',
  },
  {
    title: '6. Vos droits',
    body: 'Accès, rectification, opposition, limitation et effacement dans les limites prévues. Vous pouvez mettre à jour votre profil et demander la suppression / anonymisation de votre compte depuis l’app ou l’espace web (paramètres).',
  },
  {
    title: '7. Contact',
    body: `Pour exercer vos droits ou poser une question : ${APP_CONTACT_EMAIL}.`,
  },
];

const LegalPrivacy = () => (
  <div className="bg-slate-50 py-12">
    <div className="container mx-auto max-w-3xl px-4">
      <p className="text-sm font-medium text-indigo-600">Documents légaux</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Politique de confidentialité</h1>
      <p className="mt-3 text-sm text-slate-600">
        Dernière mise à jour : 15 septembre 2026 · Version 1.0 · Périmètre : site et application {APP_NAME}.
      </p>
      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{s.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-600">
        Voir aussi la{' '}
        <Link to="/cgu" className="font-semibold text-indigo-600 hover:underline">
          politique d’usage
        </Link>
        .
      </p>
    </div>
  </div>
);

export default LegalPrivacy;
