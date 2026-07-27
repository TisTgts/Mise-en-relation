# Étude de l’application mobile

> **Plateforme toghinis.net** (`feature/code`) : marque **AppName**, API `https://toghinis.net/api`.  
> La plateforme sœur **toghinis.com** (`deploy/toghinis-com`) conserve la marque Toghinis et son propre déploiement.

**Document de synthèse — version claire et détaillée**  
**Projet :** plateforme de mise en relation clients ↔ fournisseurs  
**Marque (cette branche) :** AppName  
**Date :** juillet 2026  

---

## 1. Objet de cette étude

Cette étude explique, en termes simples, **pourquoi** et **comment** **et avec technologies** réaliser une application mobile pour Toghinis.

Elle répond aux questions suivantes :

1. Peut-on s’appuyer sur les APIs déjà existantes ?
2. Quelle technologie mobile choisir ?
3. Que faire sur le téléphone, et que garder sur le site web ?
4. Quelles étapes suivre pour aboutir à une application installable (Play Store) ?

Le public visé est à la fois technique et décisionnel : direction, produit, développement.

---

## 2. Conclusion en une phrase

**Oui, l’application mobile est faisable sans reconstruire le serveur.**  
La solution recommandée est **React Native avec Expo**, pour les utilisateurs **clients** et **fournisseurs**.  
Le site web actuel reste le meilleur outil pour l’**administration** et le **super-admin**.

---

## 3. Contexte du projet

### 3.1 Ce qu’est Toghinis aujourd’hui

Toghinis est une plateforme qui met en relation :

- des **clients**, qui publient des besoins de services ;
- des **fournisseurs**, qui proposent des prestations ;
- un moteur de **matching** pour trouver les meilleures correspondances ;
- un suivi des **collaborations** (devis, travail, validation, messages).

### 3.2 Technologies déjà en place

| Couche | Technologie |
|--------|-------------|
| Site web | React (Create React App) |
| Serveur / API | Django REST Framework |
| Authentification | JWT (jeton d’accès + jeton de renouvellement) |
| Marque / déploiement | Toghinis (`toghinis.com`) |

### 3.3 Idée centrale

Le serveur expose déjà une API REST.  
Une application mobile peut **consommer la même API**, comme le fait le site web.  
Il n’est donc **pas nécessaire** de réécrire tout le backend pour lancer le mobile.

---

## 4. Ce que l’existant permet déjà

| Élément déjà présent | Intérêt pour le mobile |
|----------------------|-------------------------|
| API REST (`/api/…`) | Réutilisable telle quelle (comptes, services, matching, messages) |
| Authentification JWT | Compatible mobile ; les jetons doivent être stockés de façon sécurisée (SecureStore), pas dans le stockage web classique |
| Services front (auth, besoins, prestations, messages) | La **logique métier** se réutilise ; l’interface se reconstruit pour le tactile |
| Géolocalisation | Remplacée par les modules natifs Expo (`expo-location`) |
| Messages et pièces jointes | Possibles via envoi multipart ; caméra et galerie à prévoir |
| Configuration multi-pays | Réutilisable via l’API `/api/config/country/` |
| Tableaux de bord admin (graphiques, listes denses) | **Peu adaptés au téléphone** → à laisser sur le web |

**En résumé :**  
pas de refonte serveur majeure.  
Il faut surtout un **nouveau client mobile**, plus quelques ajustements techniques de production (HTTPS, médias, notifications).

---

## 5. Comparaison des options techniques

Plusieurs approches sont possibles pour « avoir une app ». Elles ne se valent pas toutes pour Toghinis.

| Option | Réutilise le savoir React | Qualité d’expérience mobile | Effort | Publication Play / App Store | Verdict pour Toghinis |
|--------|---------------------------|-----------------------------|--------|------------------------------|------------------------|
| **PWA** (site web installable) | Très élevé | Moyenne | Faible | Limité | Utile pour un test rapide, moins solide sur le terrain |
| **Capacitor** (emballage du site web) | Très élevé | Moyenne à bonne | Faible à moyen | Oui | Intéressant seulement si le web est déjà pensé « mobile first » |
| **React Native + Expo** | Élevé (JS / React) | Très bonne | Moyen | Oui | **Meilleur équilibre** |
| **React Native sans Expo** | Élevé | Très bonne | Élevé | Oui | Plus complexe au démarrage, peu justifié |
| **Flutter** | Faible (nouveau langage Dart) | Excellente | Élevé | Oui | Solide, mais double stack à maintenir |
| **Natife (Kotlin / Swift)** | Aucun | Excellente | Très élevé | Oui | Trop coûteux alors qu’une API REST existe déjà |

### Lecture pratique

- L’équipe maîtrise déjà **React** et **Axios** → Expo permet de capitaliser sur ces compétences.
- En Afrique de l’Ouest, **Android** est prioritaire → Expo simplifie la génération d’APK et la publication Play Store (EAS).
- L’interface web actuelle (tableaux, admin) ne se copie pas telle quelle sur téléphone : on **reprend les parcours métier**, pas les pages desktop.

---

## 6. Recommandation produit et technique

### 6.1 Périmètre mobile

L’application mobile doit couvrir :

1. le rôle **client** ;
2. le rôle **fournisseur**.

Le site web conserve :

- la présentation / marketing ;
- l’espace **administrateur** ;
- l’espace **super-administrateur** ;
- l’usage bureau plus confortable pour les tâches de gestion.

### 6.2 Stack mobile recommandée

| Besoin | Choix |
|--------|--------|
| Framework | **Expo (React Native)** |
| Navigation | React Navigation (onglets + écrans) |
| Appels API | Axios (mêmes endpoints que le web) |
| Stockage des jetons | SecureStore + renouvellement automatique |
| Localisation | `expo-location` |
| Photos / documents | `expo-image-picker`, sélecteur de documents |
| Notifications | `expo-notifications` (+ enregistrement côté serveur) |
| Pays / villes | API `/api/config/country/` |

### 6.3 Pourquoi ne pas se contenter d’une PWA ?

Une PWA peut servir de **phase d’essai**.  
En revanche, elle est plus limitée pour :

- une installation claire comme « vraie application » ;
- la géolocalisation fiable ;
- la caméra ;
- les notifications push ;
- la perception de sérieux auprès des fournisseurs sur le terrain.

### 6.4 Pourquoi ne pas choisir Flutter tout de suite ?

Flutter est excellent.  
Mais il impose un **nouveau langage** et une **deuxième équipe de compétences**, alors que le web Toghinis est déjà en React.  
Le coût de maintenance (web React + mobile Dart) n’apporte pas de gain métier immédiat.

---

## 7. Adaptations serveur recommandées

Sans ces points, l’app peut marcher en local, mais rester fragile en production.

1. **HTTPS et hôtes autorisés**  
   L’application mobile doit appeler une URL stable du type `https://toghinis.com/api`.

2. **Gestion robuste des jetons JWT**  
   Renouvellement automatique du jeton d’accès ; session sécurisée sur l’appareil.

3. **Réponses API adaptées au mobile**  
   Pagination (environ 20 éléments) ; éviter les gros payloads conçus pour l’admin.

4. **Fichiers et médias**  
   URLs absolues pour les pièces jointes (`/media/…`).

5. **Notifications push (phase suivante)**  
   Enregistrer le jeton de l’appareil et envoyer une alerte lors d’un nouveau message, devis ou match.

6. **Versionnement d’API (optionnel)**  
   Prévoir `/api/v1/` plus tard pour faire évoluer le serveur sans casser le web et le mobile en même temps.

Les briques métier déjà présentes (matching, transactions, messagerie, authentification) restent **réutilisables**.

---

## 8. Ce qu’il ne faut pas recopier tel quel du web

| Sur le site web | Sur le mobile |
|-----------------|---------------|
| `localStorage` | SecureStore (coffre sécurisé de l’appareil) |
| React Router + pages larges | React Navigation + écrans courts |
| Barre latérale / tableau de bord dense | Onglets du bas (Accueil, Besoins ou Prestations, Collaborations, Messages, Profil) |
| Graphiques d’administration | Hors périmètre mobile |
| Styles Tailwind « page web » | Composants natifs (StyleSheet) |
| Carte OpenStreetMap en iframe | Carte native ou ouverture externe |

**Principe :** réutiliser la **logique métier**, reconstruire l’**expérience tactile**.

---

## 9. Feuille de route proposée

| Phase | Durée indicative | Objectif |
|-------|------------------|----------|
| **Phase 0** | 1 à 2 semaines | Prototype : connexion + listes (besoins / prestations) pour valider l’API |
| **Phase 1** | 4 à 8 semaines | Application complète client / fournisseur : profils, création, matching, collaborations, messages |
| **Phase 2** | Selon priorités | Géolocalisation fine, pièces jointes, notifications push, confort hors ligne léger |
| **Phase 3** | Selon priorités | Builds de production (EAS) → publication Play Store (prioritaire), App Store si besoin |

**Ordre de grandeur :**  
pour un premier livrable Android client + fournisseur, compter environ **1 à 2 mois** pour un développeur React déjà familier du projet, **si** l’administration reste sur le web.

---

## 10. État d’avancement (juillet 2026)

Une application Expo a été démarrée dans le dossier **`mobile/`** (SDK 54).

Fonctionnalités déjà présentes ou avancées :

- connexion / inscription / mot de passe oublié ;
- espaces client et fournisseur ;
- besoins, prestations, matching ;
- collaborations (devis, validation, clôture) ;
- messages et pièces jointes ;
- profil, localisation (villes / quartiers), avis ;
- mesures de sécurité (HTTPS en production, SecureStore, validation des fichiers) ;
- préparation du build APK (EAS).

L’API de production utilisée par l’app est :  
**`https://toghinis.com/api`**

---

## 11. Synthèse décisionnelle

| Question | Réponse |
|----------|---------|
| Les APIs suffisent-elles pour une app mobile ? | **Oui** |
| Faut-il changer Django en profondeur ? | **Non** (ajustements ciblés) |
| Quelle stack mobile choisir ? | **Expo / React Native** |
| Alternative ultra-rapide pour tester ? | **PWA**, puis passage à Expo |
| Faut-il garder le site web ? | **Oui**, surtout pour l’administration |
| Qui utilise l’app mobile ? | **Clients** et **fournisseurs** |

---

## 12. Références internes du dépôt

| Élément | Emplacement |
|---------|-------------|
| Application mobile | `mobile/` |
| Endpoints web | `frontend/src/config/api.js` |
| Endpoints mobile | `mobile/src/config/api.js` |
| Authentification | `backend/accounts/` |
| Matching | `backend/matching/` |
| Configuration pays | `pays/`, `/api/config/country/` |
| Guide développeur | `docs/GUIDE_DEVELOPPEUR.md` |
| README projet | `README.md` |
| README mobile | `mobile/README.md` |

---

*Document préparé pour Toghinis — étude application mobile, version accessible et professionnelle.*
