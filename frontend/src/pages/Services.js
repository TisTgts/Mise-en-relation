import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiCompass,
  FiMapPin,
  FiMessageCircle,
  FiMonitor,
  FiSettings,
  FiShield,
  FiTarget,
  FiTool,
  FiTruck,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, APP_TAGLINE } from '../config/branding';
import { COPY, COUNTRY } from '../pays';

const SERVICE_TYPES = [
  {
    id: 'transport',
    icon: FiTruck,
    title: 'Transport & logistique',
    tagline: 'Déplacer, livrer, organiser vos flux',
    description:
      'Mettez en relation clients et transporteurs pour des livraisons urbaines, du fret inter-villes ou la location de véhicules avec chauffeur. La plateforme tient compte des zones couvertes et des délais.',
    examples: COPY.transport_examples || [
      'Livraison marchandises',
      'Déménagement',
      'Location camion + chauffeur',
    ],
    forWho: 'Commerçants, PME, particuliers, exploitants de flotte',
  },
  {
    id: 'btp',
    icon: FiTool,
    title: 'BTP & travaux',
    tagline: 'Construire, rénover, aménager en confiance',
    description:
      'Trouvez des entreprises ou artisans qualifiés pour gros œuvre, second œuvre, finitions ou travaux publics. Chaque besoin est structuré : budget, lieu, délai, pièces jointes.',
    examples: ['Rénovation boutique', 'Construction hangar', 'Plomberie & électricité'],
    forWho: 'Promoteurs, commerces, administrations locales',
  },
  {
    id: 'digital',
    icon: FiMonitor,
    title: 'Informatique & digital',
    tagline: 'Sites web, apps, réseaux, accompagnement numérique',
    description:
      `Connectez-vous à des prestataires pour création de sites, maintenance IT, formation bureautique ou déploiement d’outils métiers adaptés au ${COPY.services_context || 'contexte local'}.`,
    examples: ['Site vitrine PME', 'Maintenance parc informatique', 'Community management'],
    forWho: 'Start-ups, associations, commerces, institutions',
  },
  {
    id: 'maintenance',
    icon: FiSettings,
    title: 'Maintenance & réparation',
    tagline: 'Entretenir, dépanner, prolonger la vie de vos équipements',
    description:
      'Climatisation, groupes électrogènes, matériel industriel ou domestique : publiez un besoin précis et recevez des profils qui interviennent dans votre zone.',
    examples: ['Dépannage climatisation', 'Réparation génératrice', 'Contrat maintenance annuel'],
    forWho: 'Industries, hôtels, particuliers, collectivités',
  },
  {
    id: 'entreprises',
    icon: FiBriefcase,
    title: 'Services aux entreprises',
    tagline: 'Comptabilité, RH, conseil, sécurité, nettoyage…',
    description:
      'Externalisez des fonctions support ou opérationnelles auprès de prestataires vérifiés. Idéal pour les structures qui veulent gagner du temps sans perdre en qualité.',
    examples: ['Tenue de comptabilité', 'Gardiennage & sécurité', 'Nettoyage locaux professionnels'],
    forWho: 'PME, ONG, cabinets, commerces de taille moyenne',
  },
  {
    id: 'autres',
    icon: FiCompass,
    title: 'Autres prestations',
    tagline: 'Un besoin spécifique ? La plateforme s’adapte',
    description:
      'Événementiel, formation, design, traduction, agriculture… Si votre demande ne rentre pas dans une case, décrivez-la : le moteur de matching analyse l’intention et le contexte.',
    examples: ['Organisation événement', 'Formation équipe', 'Conseil agricole'],
    forWho: 'Tous profils avec un besoin clair à exprimer',
  },
];

const CASE_STUDY = {
  title: 'Cas pratique : de l’idée au chantier livré',
  client: COPY.case_study_client,
  need: 'Rénover sa boutique (peinture, électricité, enseigne) avant la saison des fêtes, budget maîtrisé, délai 3 semaines.',
  steps: [
    {
      label: 'Besoin publié en 10 minutes',
      detail: `Fatimata décrit les travaux, joint des photos, indique son budget et la zone (${COPY.case_study_zone}).`,
    },
    {
      label: '3 prestataires recommandés',
      detail: `${APP_NAME} propose des entreprises BTP actives sur sa zone, avec prestations alignées sur « rénovation commerce ».`,
    },
    {
      label: 'Échanges & devis dans la messagerie',
      detail: 'Elle compare les propositions, pose des questions et valide un devis sans quitter la plateforme.',
    },
    {
      label: 'Suivi jusqu’à la réception',
      detail: 'La transaction est suivie étape par étape : démarrage, avancement, livraison — transparence pour les deux parties.',
    },
  ],
  outcome: 'Chantier terminé à temps, boutique rouverte avec une vitrine refaite — Fatimata recommande la plateforme à deux collègues commerçants.',
};

const WHY_JOIN = {
  client: {
    title: 'Vous avez un besoin ?',
    points: [
      'Publiez une demande structurée (lieu, budget, urgence, pièces jointes).',
      'Recevez des correspondances pertinentes, pas une liste au hasard.',
      'Échangez et validez dans un espace sécurisé, avec historique des messages.',
      'Suivez l’avancement de la prestation jusqu’à la clôture.',
    ],
  },
  fournisseur: {
    title: 'Vous proposez un service ?',
    points: [
      'Visibilité auprès de clients qui cherchent activement votre domaine.',
      'Profil fournisseur : prestations, zones d’intervention, tarification claire.',
      'Demandes qualifiées qui correspondent à ce que vous proposez réellement.',
      'Outils de gestion : messages, transactions, collaborations au même endroit.',
    ],
  },
};

const Services = () => {
  const [searchParams] = useSearchParams();
  const highlightQuery = (searchParams.get('search') ?? '').trim().toLowerCase();
  const { isAuthenticated, user } = useAuth();
  const domainsRef = useRef(null);

  const highlightedId = useMemo(() => {
    if (!highlightQuery) return null;
    const match = SERVICE_TYPES.find(
      (s) =>
        s.title.toLowerCase().includes(highlightQuery) ||
        s.description.toLowerCase().includes(highlightQuery) ||
        s.examples.some((e) => e.toLowerCase().includes(highlightQuery))
    );
    return match?.id ?? null;
  }, [highlightQuery]);

  useEffect(() => {
    if (highlightedId && domainsRef.current) {
      const el = document.getElementById(`service-${highlightedId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedId]);

  const registerClient = '/register?type=client';
  const registerFournisseur = '/register?type=fournisseur';

  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-indigo-900/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
            aria-hidden
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-16 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 backdrop-blur-sm">
              <FiMapPin className="h-3.5 w-3.5" aria-hidden />
              {COPY.services_badge || COUNTRY.name} · {APP_TAGLINE}
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Tous les services,
              <span className="mt-1 block bg-gradient-to-r from-indigo-200 to-blue-200 bg-clip-text text-transparent">
                une seule plateforme
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-indigo-100/95 sm:text-lg">
              {APP_NAME} couvre six grands univers de prestations. Explorez les domaines, parcourez un cas réel au{' '}
              {COPY.services_intro || COUNTRY.name} et voyez comment clients et fournisseurs y trouvent leur compte.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: FiZap, label: '6 domaines' },
                { icon: FiTarget, label: 'Matching ciblé' },
                { icon: FiShield, label: 'Suivi transparent' },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-indigo-50"
                >
                  <Icon className="h-3.5 w-3.5 text-indigo-300" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            {highlightQuery && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                <FiCompass className="h-4 w-4 shrink-0" aria-hidden />
                « {highlightQuery} »
                {highlightedId ? ' — mis en avant dans la liste' : ''}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#domaines"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-900 shadow-lg transition hover:bg-indigo-50"
              >
                Explorer les domaines
                <FiArrowRight className="h-4 w-4" aria-hidden />
              </a>
              {!isAuthenticated ? (
                <>
                  <Link
                    to={registerClient}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <FiUsers className="h-4 w-4" />
                    J&apos;ai un besoin
                  </Link>
                  <Link
                    to={registerFournisseur}
                    className="text-sm font-medium text-indigo-200 underline-offset-2 hover:text-white hover:underline"
                  >
                    Je propose un service →
                  </Link>
                </>
              ) : (
                <Link
                  to={
                    user?.type_utilisateur === 'fournisseur'
                      ? '/fournisseur/dashboard'
                      : user?.type_utilisateur === 'administrateur'
                        ? '/admin/dashboard'
                        : '/client/dashboard'
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Mon espace
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-10 lg:mt-0">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-indigo-300/90 lg:text-left">
              Aperçu des univers couverts
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {SERVICE_TYPES.map(({ id, icon: Icon, title, tagline }) => (
                <a
                  key={id}
                  href={`#service-${id}`}
                  className={`group flex flex-col rounded-xl border p-3.5 transition sm:p-4 ${
                    highlightedId === id
                      ? 'border-amber-400/60 bg-amber-400/15 ring-1 ring-amber-400/40'
                      : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/40 text-white transition group-hover:bg-indigo-500">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="mt-2 text-sm font-semibold leading-snug text-white">{title}</span>
                  <span className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-indigo-200/80">{tagline}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Types de services */}
      <section id="domaines" ref={domainsRef} className="scroll-mt-20 py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Six grands univers de prestations</h2>
            <p className="mt-3 text-lg text-slate-600">
              Chaque domaine est pensé pour le matching : catégorie, zone géographique, budget et description de votre
              besoin ou de votre offre.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {SERVICE_TYPES.map((service) => {
              const Icon = service.icon;
              const isHighlighted = highlightedId === service.id;
              return (
                <article
                  key={service.id}
                  id={`service-${service.id}`}
                  className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition ${
                    isHighlighted
                      ? 'border-indigo-400 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{service.tagline}</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{service.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{service.description}</p>
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500">Exemples concrets</p>
                    <ul className="mt-2 space-y-1">
                      {service.examples.map((ex) => (
                        <li key={ex} className="flex items-start gap-2 text-sm text-slate-700">
                          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Pour qui :</span> {service.forWho}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cas pratique */}
      <section className="border-y border-slate-200 bg-white py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white shadow-xl">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-10 lg:p-12">
                <p className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-100">
                  <FiZap className="h-3.5 w-3.5" />
                  Cas pratique
                </p>
                <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">{CASE_STUDY.title}</h2>
                <p className="mt-4 text-indigo-100">
                  <strong className="text-white">{CASE_STUDY.client}</strong> — {CASE_STUDY.need}
                </p>
                <p className="mt-6 rounded-xl bg-white/10 p-4 text-sm leading-relaxed text-indigo-50">
                  <FiTarget className="mb-2 inline h-5 w-5 text-amber-300" /> Résultat : {CASE_STUDY.outcome}
                </p>
              </div>
              <div className="border-t border-white/10 bg-white/5 p-8 sm:p-10 lg:border-l lg:border-t-0">
                <ol className="space-y-6">
                  {CASE_STUDY.steps.map((step, i) => (
                    <li key={step.label} className="flex gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{step.label}</p>
                        <p className="mt-1 text-sm text-indigo-100/90">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi nous rejoindre */}
      <section className="py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Pourquoi rejoindre {APP_NAME} ?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
              Une seule plateforme pour publier, matcher, échanger et suivre — que vous cherchiez ou que vous proposiez.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white p-8">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-600 p-3 text-white">
                <FiUsers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{WHY_JOIN.client.title}</h3>
              <ul className="mt-5 space-y-3">
                {WHY_JOIN.client.points.map((pt) => (
                  <li key={pt} className="flex gap-3 text-sm text-slate-700">
                    <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    {pt}
                  </li>
                ))}
              </ul>
              {!isAuthenticated && (
                <Link
                  to={registerClient}
                  className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Créer un compte client
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-8">
              <div className="mb-4 inline-flex rounded-xl bg-emerald-600 p-3 text-white">
                <FiBriefcase className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{WHY_JOIN.fournisseur.title}</h3>
              <ul className="mt-5 space-y-3">
                {WHY_JOIN.fournisseur.points.map((pt) => (
                  <li key={pt} className="flex gap-3 text-sm text-slate-700">
                    <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    {pt}
                  </li>
                ))}
              </ul>
              {!isAuthenticated && (
                <Link
                  to={registerFournisseur}
                  className="mt-6 inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Créer un compte fournisseur
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: FiTarget, label: 'Matching intelligent', sub: 'Domaine, zone, budget' },
              { icon: FiMessageCircle, label: 'Messagerie intégrée', sub: 'Historique des échanges' },
              { icon: FiShield, label: 'Suivi des transactions', sub: 'Étapes claires et traçables' },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
              >
                <Icon className="h-8 w-8 shrink-0 text-indigo-600" />
                <div>
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-indigo-700 py-14 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Prêt à passer à l&apos;action ?</h2>
          <p className="mt-3 text-indigo-100">
            Rejoignez les clients et fournisseurs qui structurent leurs projets sur {APP_NAME}.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Link
                to={
                  user?.type_utilisateur === 'fournisseur'
                    ? '/fournisseur/dashboard'
                    : user?.type_utilisateur === 'administrateur'
                      ? '/admin/dashboard'
                      : '/client/dashboard'
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-indigo-800 transition hover:bg-indigo-50"
              >
                Accéder à mon espace
                <FiArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  to={registerClient}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-indigo-800 transition hover:bg-indigo-50"
                >
                  Inscription client
                </Link>
                <Link
                  to={registerFournisseur}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white px-8 py-3.5 font-semibold transition hover:bg-white/10"
                >
                  Inscription fournisseur
                </Link>
              </>
            )}
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-medium text-indigo-100 underline-offset-2 hover:underline"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
