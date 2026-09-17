import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_CONTACT_EMAIL } from '../config/branding';

const SECTIONS = [
  {
    title: '1. Objet et acceptation',
    body: `${APP_NAME} met à disposition une plateforme de mise en relation entre clients et fournisseurs de services (site web et application mobile). L’utilisation du service vaut acceptation de la présente politique d’usage et de la politique de confidentialité.`,
  },
  {
    title: '2. Nature du service',
    body: `${APP_NAME} facilite la rencontre, le matching, la messagerie et le suivi des collaborations. Sauf mention contraire écrite, ${APP_NAME} n’est pas partie au contrat de prestation conclu entre le client et le fournisseur, et n’est pas un établissement de paiement.`,
  },
  {
    title: '3. Compte utilisateur',
    body: 'Vous êtes responsable de la confidentialité de vos identifiants et de l’exactitude des informations publiées. Un compte peut être suspendu en cas de non-respect des règles (fraude, abus, contenus illicites, usurpation, etc.).',
  },
  {
    title: '4. Contenu et comportements',
    body: 'Il est interdit de publier des contenus illicites, trompeurs ou portant atteinte aux droits de tiers, de harceler d’autres utilisateurs, ou d’utiliser la Plateforme à des fins autres que la mise en relation professionnelle prévue.',
  },
  {
    title: '5. Collaborations et paiements',
    body: 'Les conditions commerciales (prix, délais, qualité) sont convenues entre les parties. Les avis doivent rester factuels et loyaux. Les litiges métier se règlent prioritairement entre client et fournisseur.',
  },
  {
    title: '6. Suspension et suppression',
    body: 'Vous pouvez demander la suppression / anonymisation de votre compte depuis l’application ou l’espace web (paramètres), sous réserve des obligations légales de conservation. Nous pouvons également suspendre un compte en cas de manquement grave.',
  },
  {
    title: '7. Contact',
    body: `Pour toute question : ${APP_CONTACT_EMAIL}. La politique de confidentialité décrit le traitement des données personnelles.`,
  },
];

const LegalUsage = () => (
  <div className="bg-slate-50 py-12">
    <div className="container mx-auto max-w-3xl px-4">
      <p className="text-sm font-medium text-indigo-600">Documents légaux</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Politique d’usage</h1>
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
        <Link to="/confidentialite" className="font-semibold text-indigo-600 hover:underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  </div>
);

export default LegalUsage;
