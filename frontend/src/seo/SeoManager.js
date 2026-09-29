import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_NAME } from '../config/branding';
import COUNTRY from '../pays';

const SITE_URL = 'https://toghinis.net';
const COUNTRY_NAME = COUNTRY?.name || 'Togo';

const DEFAULT_DESCRIPTION = `${APP_NAME} met en relation clients et prestataires au ${COUNTRY_NAME} : transport et logistique, BTP, informatique, maintenance et réparation. Publiez votre besoin gratuitement et recevez des propositions adaptées.`;

const PUBLIC_PAGES = {
  '/': {
    title: `${APP_NAME} – Trouvez le bon prestataire de services au ${COUNTRY_NAME}`,
    description: DEFAULT_DESCRIPTION,
  },
  '/services': {
    title: `Nos services : transport, BTP, informatique, maintenance | ${APP_NAME}`,
    description: `Découvrez les services proposés sur ${APP_NAME} au ${COUNTRY_NAME} : livraison et déménagement, construction et plomberie, sites internet et réseaux, réparation de climatiseurs et d'appareils.`,
  },
  '/register': {
    title: `Créer un compte gratuit | ${APP_NAME}`,
    description: `Inscrivez-vous gratuitement sur ${APP_NAME} comme client pour trouver un prestataire, ou comme professionnel pour recevoir des demandes de clients au ${COUNTRY_NAME}.`,
  },
  '/login': {
    title: `Se connecter | ${APP_NAME}`,
    description: `Connectez-vous à votre espace ${APP_NAME} pour suivre vos besoins, vos prestations et vos échanges.`,
  },
  '/cgu': {
    title: `Conditions générales d'utilisation | ${APP_NAME}`,
    description: `Les règles d'utilisation de la plateforme ${APP_NAME}.`,
  },
  '/confidentialite': {
    title: `Politique de confidentialité | ${APP_NAME}`,
    description: `Comment ${APP_NAME} collecte, utilise et protège vos données personnelles.`,
  },
  '/forgot-password': { title: `Mot de passe oublié | ${APP_NAME}`, noindex: true },
  '/reset-password': { title: `Nouveau mot de passe | ${APP_NAME}`, noindex: true },
};

const PRIVATE_PREFIXES = ['/admin', '/super-admin', '/client', '/fournisseur', '/dashboard', '/test-dashboard'];

const isPrivate = (path) => PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));

function metaFor(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (PUBLIC_PAGES[path]) return { ...PUBLIC_PAGES[path], path };
  if (isPrivate(path)) return { title: `Mon espace | ${APP_NAME}`, noindex: true, path };
  return { title: `Page introuvable | ${APP_NAME}`, noindex: true, path };
}

function upsert(selector, create, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(create);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

const setMeta = (name, content) => upsert(`meta[name="${name}"]`, 'meta', { name, content });
const setProperty = (property, content) => upsert(`meta[property="${property}"]`, 'meta', { property, content });

/** Met à jour titre, description, canonique et indexation à chaque changement de page. */
export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description = DEFAULT_DESCRIPTION, noindex, path } = metaFor(pathname);
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;

    document.title = title;
    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setProperty('og:title', title);
    setProperty('og:description', description);
    setProperty('og:url', url);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (noindex) {
      canonical?.remove();
    } else {
      upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
    }
  }, [pathname]);

  return null;
}
