# AppName Mobile

Application Expo **SDK 54** — expérience complète **client** et **fournisseur** (plateforme toghinis.net).

## Parcours

### Client
- Accueil (KPI + besoins récents)
- Création / détail besoin
- Matching + confirmation
- Collaborations (devis, vérif, clôture)
- Messages fil de discussion
- Profil éditable

### Fournisseur
- Accueil prestations
- Création / détail prestation
- Collaborations (proposer devis, travail terminé)
- Messages + profil

## Lancer

```powershell
powershell -ExecutionPolicy Bypass -File demarrer-local.ps1
# Debug: Django + Mobile  (F5)
# ou
powershell -ExecutionPolicy Bypass -File demarrer-mobile.ps1
```

Comptes démo : voir `utilisateurs_identifiants.md` à la racine du projet.

## API

Par défaut l’app appelle l’API hébergée :

`https://toghinis.net/api`

Fichier `mobile/.env` :

```env
EXPO_PUBLIC_API_URL=https://toghinis.net/api
```

Pour le développement local (Django sur le PC) :

```powershell
powershell -ExecutionPolicy Bypass -File demarrer-mobile.ps1 -Local
```

## Stack

React Native + Expo 54, React Navigation, Axios, SecureStore, LinearGradient, Haptics.

## Pièces jointes (messages)

Dans un fil de discussion, touchez **📎** pour envoyer une photo ou un document (max 10 Mo). Les images s’affichent inline ; les autres fichiers s’ouvrent dans le navigateur.

## Notifications

- **Local** : si l’app est en arrière-plan, un contrôle périodique des messages non lus déclenche une notification locale.
- **Push distantes** : nécessitent un build APK/IPA (pas Expo Go) + projet EAS lié (`eas init`) + endpoint backend pour enregistrer le token Expo (à venir côté Django).

## Build APK Android (EAS)

Pour installer l’app sans Expo Go :

```powershell
cd mobile
npm install -g eas-cli
eas login
eas init          # une seule fois — lie le projet Expo
powershell -ExecutionPolicy Bypass -File build-apk.ps1
# ou
npm run build:apk
```

Le build se fait dans le cloud Expo. À la fin, un lien de téléchargement **APK** est fourni (profil `preview`).

Variables d’environnement du build : `EXPO_PUBLIC_API_URL=https://toghinis.net/api` (défini dans `eas.json`).

Pour le Play Store (AAB) : `npm run build:apk:prod` (profil `production`).
