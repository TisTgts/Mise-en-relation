import React from 'react';
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiCompass,
  FiFileText,
  FiMapPin,
  FiMessageCircle,
  FiSearch,
  FiShield,
  FiTarget,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { APP_NAME } from '../config/branding';
import { COPY } from '../pays';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardPathForRole } from '../utils/roles';

const STEPS = [
  {
    num: '1',
    title: 'Créez votre compte',
    text: 'Inscrivez-vous en tant que client (vous avez un besoin) ou fournisseur (vous proposez un service).',
  },
  {
    num: '2',
    title: 'Publiez ou décrivez votre offre',
    text: 'Le client décrit son besoin ; le fournisseur présente ses prestations et zones d’intervention.',
  },
  {
    num: '3',
    title: 'Recevez des correspondances',
    text: 'Notre moteur de matching propose les paires les plus pertinentes selon le domaine, la zone et le budget.',
  },
  {
    num: '4',
    title: 'Collaborez en toute clarté',
    text: 'Échangez par messages, suivez la transaction et validez chaque étape jusqu’à la fin du projet.',
  },
];

const DOMAINS = [
  'Transport & logistique',
  'BTP & travaux',
  'Informatique & digital',
  'Maintenance & réparation',
  'Services aux entreprises',
  'Autres prestations',
];

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const dashboardPath = dashboardPathForRole(user?.type_utilisateur);

  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = e.target.search.value;
    navigate(`/services${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-700 to-blue-800 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-blue-300 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-indigo-50">
              <FiMapPin className="h-4 w-4" aria-hidden />
              {COPY.home_badge}
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              La plateforme qui met en relation
              <span className="block text-indigo-200">clients et fournisseurs de services</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-indigo-100 md:text-xl">
              Vous avez un <strong className="font-semibold text-white">besoin</strong> à confier ou une{' '}
              <strong className="font-semibold text-white">prestation</strong> à proposer ? {APP_NAME} vous aide
              à trouver le bon partenaire, échanger sereinement et suivre votre projet du début à la fin.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl" aria-label="Rechercher un service">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  name="search"
                  placeholder="Ex. plomberie, transport, site web, maintenance…"
                  className="w-full rounded-2xl border-0 py-4 pl-12 pr-32 text-base text-slate-900 shadow-lg focus:ring-4 focus:ring-indigo-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Explorer
                </button>
              </div>
            </form>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-indigo-100">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
                <FiZap className="h-4 w-4" /> Matching intelligent
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
                <FiMessageCircle className="h-4 w-4" /> Messagerie intégrée
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
                <FiShield className="h-4 w-4" /> Suivi des transactions
              </span>
            </div>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              {isAuthenticated ? (
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-800 shadow-md transition hover:bg-indigo-50"
                >
                  Accéder à mon espace
                  <FiArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register?type=client"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-800 shadow-md transition hover:bg-indigo-50"
                  >
                    <FiUsers className="h-5 w-5" />
                    J’ai un besoin
                  </Link>
                  <Link
                    to="/register?type=fournisseur"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <FiBriefcase className="h-5 w-5" />
                    Je propose un service
                  </Link>
                </>
              )}
            </div>

            {!isAuthenticated && (
              <p className="mt-6 text-sm text-indigo-200">
                Déjà inscrit ?{' '}
                <Link to="/login" className="font-semibold text-white underline underline-offset-2 hover:text-indigo-100">
                  Connectez-vous
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Pour qui ? */}
      <section className="border-b border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Pour qui est {APP_NAME} ?</h2>
            <p className="mt-3 text-lg text-slate-600">
              Deux profils, un même objectif : une mise en relation claire et efficace.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-600 p-3 text-white">
                <FiUsers className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Vous êtes client</h3>
              <p className="mt-2 text-slate-600">
                Entreprise ou particulier, vous cherchez quelqu’un pour réaliser un service précis.
              </p>
              <ul className="mt-6 space-y-3 text-slate-700">
                {[
                  'Publiez un besoin détaillé (description, lieu, budget, urgence)',
                  'Consultez les fournisseurs recommandés par le matching',
                  'Échangez et validez la prestation dans un espace dédié',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated && (
                <Link
                  to="/register?type=client"
                  className="mt-8 inline-flex items-center gap-2 font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  Créer mon compte client
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-8 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-emerald-600 p-3 text-white">
                <FiBriefcase className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Vous êtes fournisseur</h3>
              <p className="mt-2 text-slate-600">
                Professionnel ou entreprise, vous proposez des prestations et souhaitez trouver de nouveaux clients.
              </p>
              <ul className="mt-6 space-y-3 text-slate-700">
                {[
                  'Présentez vos prestations et zones d’intervention',
                  'Recevez des demandes alignées avec votre activité',
                  'Gérez vos collaborations et transactions au même endroit',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated && (
                <Link
                  to="/register?type=fournisseur"
                  className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  Créer mon compte fournisseur
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Comment ça marche ?</h2>
            <p className="mt-3 text-lg text-slate-600">
              Quatre étapes simples, sans prise de tête.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                  {step.num}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domaines */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Tous types de services</h2>
              <p className="mt-2 max-w-xl text-slate-600">
                Transport, BTP, numérique, maintenance… Le matching tient compte de votre domaine et de votre localisation.
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex shrink-0 items-center font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Découvrir nos services
              <FiArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {DOMAINS.map((label) => (
              <Link
                key={label}
                to={`/services?search=${encodeURIComponent(label.split(' ')[0].toLowerCase())}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi nous */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Pourquoi passer par {APP_NAME} ?</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FiTarget className="mb-3 h-8 w-8 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Matching pertinent</h3>
              <p className="mt-2 text-sm text-slate-600">
                Chaque besoin est comparé aux prestations selon le métier, la zone géographique, le budget et la disponibilité.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FiCompass className="mb-3 h-8 w-8 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Tout au même endroit</h3>
              <p className="mt-2 text-sm text-slate-600">
                Besoins, prestations, messages et suivi de transaction : fini les échanges dispersés sur plusieurs outils.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FiFileText className="mb-3 h-8 w-8 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Parcours transparent</h3>
              <p className="mt-2 text-sm text-slate-600">
                De la publication du besoin à la validation du travail, chaque étape est tracée pour client et fournisseur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-r from-indigo-700 to-blue-800 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold md:text-4xl">Prêt à commencer ?</h2>
          <p className="mt-4 text-lg text-indigo-100">
            L’inscription est gratuite. Choisissez votre profil et publiez votre premier besoin ou votre première prestation en quelques minutes.
          </p>
          {!isAuthenticated && (
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="rounded-xl bg-white px-8 py-3.5 font-semibold text-indigo-800 shadow-md transition hover:bg-indigo-50"
              >
                Créer un compte gratuitement
              </Link>
              <Link
                to="/login"
                className="rounded-xl border-2 border-white px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                J’ai déjà un compte
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
