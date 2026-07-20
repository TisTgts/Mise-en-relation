# Étude comparative — Application mobile Toghinis

Étude de faisabilité pour construire une application mobile qui consomme les APIs existantes de la plateforme de mise en relation (clients ↔ fournisseurs).

**Date :** juillet 2026  
**Stack actuelle :** React 18 (CRA) + Django REST Framework + JWT  
**Marque :** Toghinis

---

## 1. Verdict

Les APIs Django REST + JWT sont déjà **prêtes pour un client mobile**.  
La stack la plus adaptée au projet actuel est **React Native (Expo)** pour les rôles **client** et **fournisseur**, en gardant le **web React** pour **admin** et **super-admin**.

---

## 2. Ce que l’existant apporte

| Élément actuel | Impact mobile |
|----------------|---------------|
| API REST `/api/` (accounts, services, matching) | Réutilisable telle quelle |
| JWT (access ~60 min + refresh 1 jour) | Compatible ; stocker en **SecureStore**, pas `localStorage` |
| Axios + services front | Patterns réutilisables (auth, besoins, prestations, messages) |
| Géolocalisation (`navigator.geolocation`) | Remplacée par modules Expo Location |
| Messages + pièces jointes | OK via multipart ; UX upload / caméra native à prévoir |
| Multi-pays (`pays/*.json`) | Réutilisable (bundle ou `/api/config/country/`) |
| Admin + Recharts + tableaux | **Peu adaptés au mobile** → rester sur le web |
| Notifications in-app | Pas de push FCM / APNs aujourd’hui → à ajouter côté backend |

**Conclusion :** pas besoin de réécrire le backend. Il faut un **nouveau client mobile** et quelques **adaptations API / ops**.

Endpoints de référence côté front : `frontend/src/config/api.js`.

---

## 3. Comparatif des options

| Option | Réutilise le React actuel | Perf / UX native | Effort | Stores (Play / App) | Adapté à Toghinis ? |
|--------|---------------------------|------------------|--------|---------------------|---------------------|
| **PWA** (même React web) | ★★★★★ | ★★ | Faible | Non (ou limité) | Bon pour un **MVP rapide**, faible sur Android low-end / offline |
| **Capacitor** (wrapper du web) | ★★★★★ | ★★★ | Faible–moyen | Oui | OK si UI déjà mobile-first (ce n’est pas le cas) |
| **React Native + Expo** | ★★★★ (JS/React, pas le DOM) | ★★★★ | Moyen | Oui | **Meilleur équilibre** |
| **React Native CLI** (sans Expo) | ★★★★ | ★★★★★ | Élevé | Oui | Overkill au départ |
| **Flutter** | ★ (aucun) | ★★★★★ | Élevé | Oui | Solide, mais **nouvelle stack Dart** = coût équipe |
| **Native** (Kotlin / Swift) | ★ | ★★★★★ | Très élevé | Oui | Pas justifié avec une API REST existante |

### Lecture vs la tech actuelle

- **React + Axios déjà en place** → RN / Expo maximise le transfert de compétences (hooks, contextes, services API, logique métier).
- **TypeScript peu utiliséé** → Expo fonctionne très bien en JavaScript ; TypeScript optionnel plus tard.
- **Tailwind / CRA / Recharts** → ne se portent pas tels quels ; UI mobile à reconstruire (NativeWind possible pour garder l’esprit Tailwind).
- **Contexte Afrique de l’Ouest** → Android en priorité ; Expo simplifie le build Play Store (EAS).

---

## 4. Recommandation

### 4.1 Cible produit

1. **App mobile** : rôles `client` et `fournisseur` uniquement  
2. **Web actuel** : marketing + admin + super-admin (+ consultation desktop)

### 4.2 Stack mobile proposée

| Couche | Choix |
|--------|--------|
| Framework | **Expo (React Native)** |
| Navigation | React Navigation |
| HTTP | Axios (même schéma d’endpoints que `api.js`) |
| Auth tokens | SecureStore + refresh automatique |
| Géoloc / médias | `expo-location`, `expo-image-picker` / document picker |
| Notifications | `expo-notifications` + endpoint backend FCM (phase 2) |
| Pays | `/api/config/country/` (déjà disponible) |

### 4.3 Pourquoi pas PWA seule ?

Utile en **phase 0** (tests terrain), mais limitée pour : installation native, GPS fiable, caméra, push, perception « vraie app » chez les fournisseurs terrain.

### 4.4 Pourquoi pas Flutter ?

Excellent techniquement, mais perte du capital React et double charge de maintenance (web React + mobile Dart) sans gain métier immédiat.

---

## 5. Adaptations backend (légères)

Sans ces points, l’app marchera en local mais sera fragile en production :

1. **HTTPS + `ALLOWED_HOSTS`** — URL API fixe (`https://…/api`). Une app native ne s’appuie pas sur CORS comme un navigateur.
2. **JWT** — refresh robuste ; éventuellement allonger le refresh ou refresh silencieux en foreground.
3. **Pagination / payloads** — pagination actuelle (20) adaptée au mobile ; éviter les payloads admin lourds.
4. **Médias** — URLs absolues pour `/media/` (pièces jointes).
5. **Push (phase 2)** — modèle `DeviceToken` + envoi sur nouveau message / devis / match.
6. **Versioning API** (optionnel) — `/api/v1/` pour évoluer sans casser web + mobile.

Le matching, les transactions, la messagerie et l’auth sont **réutilisables sans refonte**.

---

## 6. Ce qu’il ne faut pas porter tel quel

| Web actuel | Mobile |
|------------|--------|
| `localStorage` | SecureStore |
| React Router + pages larges | React Navigation + écrans courts |
| Layout dashboard / TopBar | Bottom tabs (Besoins / Matchings / Messages / Profil) |
| Recharts admin | Hors scope mobile |
| Tailwind DOM | StyleSheet / NativeWind |
| OpenStreetMap iframe | Map native ou lien externe |

On **réutilise la logique** (services, flux devis, matching), pas le markup.

---

## 7. Feuille de route

| Phase | Durée indicative | Livrable |
|-------|------------------|----------|
| **0** | 1–2 semaines | PWA responsive « app-like » *ou* prototype Expo : login + listes besoins / prestations (validation API) |
| **1** | 4–8 semaines | Expo : auth, profils, CRUD besoins / prestations, matching, transactions de base, messages |
| **2** | — | Géoloc fine, pièces jointes, push, polish offline léger |
| **3** | — | Builds EAS → Play Store (prioritaire), App Store si besoin |

**Effort typique** pour un premier store Android client + fournisseur : **1–2 mois** pour un développeur React déjà familier du projet, si le scope admin reste sur le web.

---

## 8. Synthèse

| Question | Réponse |
|----------|---------|
| Les APIs suffisent-elles ? | **Oui** |
| Faut-il changer Django ? | **Non** (ajustements mineurs) |
| Stack mobile adaptée à l’existant ? | **Expo / React Native** |
| Alternative MVP ultra-rapide ? | **PWA**, puis bascule Expo |
| Garder le web ? | **Oui**, surtout admin |

---

## 9. Implémentation démarrée

App Expo dans **`mobile/`** — **SDK 54** (compatible Expo Go store).

- Auth JWT (SecureStore / fallback web) + refresh
- Navigation client / fournisseur
- Listes besoins, prestations, messages, profil
- Lancement : `demarrer-mobile.ps1` (+ backend `demarrer-local.ps1`)

Voir : `mobile/README.md`

### Suites possibles

- Création / édition besoins & prestations
- Matching & transactions (devis)
- Checklist backend (HTTPS, médias, tokens, push)
- Géoloc + push notifications

---

## Références internes

| Élément | Chemin |
|---------|--------|
| App mobile Expo | `mobile/` (SDK 54) |
| Endpoints front web | `frontend/src/config/api.js` |
| Endpoints mobile | `mobile/src/config/api.js` |
| Auth JWT | `backend/accounts/` + `LenientJWTAuthentication` |
| Matching | `backend/matching/` |
| Config pays | `pays/`, `/api/config/country/` |
| Guide développeur | `docs/GUIDE_DEVELOPPEUR.md` |
| README projet | `README.md` |
