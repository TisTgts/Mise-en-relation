# Tests End-to-End (Playwright)

Suite de tests E2E **totalement isolée** du code applicatif. Rien ici ne modifie
le frontend ni le backend : ce dossier a son propre `package.json` et ses propres
dépendances.

## Pré-requis

1. **Backend** lancé sur `http://localhost:8000` avec la base peuplée :

   ```bash
   cd ../backend
   python manage.py migrate
   python manage.py seed_db        # crée les comptes de démo (mot de passe : demo1234)
   python manage.py runserver
   ```

2. **Frontend** : démarré automatiquement par Playwright (`npm start` dans `../frontend`).
   S'il tourne déjà sur `http://localhost:3000`, il est réutilisé.

3. **Limites de débit (throttling) assouplies en local.** La suite enchaîne beaucoup
   de requêtes ; avec le plafond de prod (`user: 1000/hour`) des exécutions répétées
   finissent par renvoyer des `429`. Le fichier `backend/.env` (local uniquement,
   non committé) fixe donc des valeurs élevées :

   ```env
   THROTTLE_LOGIN=1000/min
   THROTTLE_REGISTER=1000/min
   THROTTLE_TOKEN_REFRESH=1000/min
   THROTTLE_ANON=1000000/hour
   THROTTLE_USER=1000000/hour
   ```

   La production (OVH) garde ses propres valeurs strictes dans son `.env`.
   Si vous modifiez `.env`, **redémarrez le backend** pour le prendre en compte.

## Installation (une seule fois)

```bash
cd e2e
npm install
npm run install:browser   # télécharge Chromium pour Playwright
```

## Lancer les tests

```bash
npm test                  # toute la suite
npm run test:headed       # avec navigateur visible
npm run test:ui           # mode interactif (debug)

npm run test:public       # pages publiques + connexion + contrôle d'accès
npm run test:client       # espace client (navigation + gestion des besoins)
npm run test:fournisseur  # espace fournisseur (navigation + gestion des prestations)
npm run test:admin        # espace admin (navigation + utilisateurs/premium + catégories)
npm run test:workflow     # parcours métier complet de bout en bout (piloté API)

npm run report            # ouvre le dernier rapport HTML
```

## Comptes utilisés

| Rôle          | Email                  | Mot de passe |
| ------------- | ---------------------- | ------------ |
| Client        | client@demo.local      | demo1234     |
| Fournisseur   | fournisseur@demo.local | demo1234     |
| Administrateur| admin@demo.local       | demo1234     |

Surchargeables via variables d'environnement : `E2E_CLIENT_EMAIL`,
`E2E_FOURNISSEUR_EMAIL`, `E2E_ADMIN_EMAIL`, `E2E_PASSWORD`,
`E2E_BASE_URL`, `E2E_API_URL`, `E2E_NO_WEBSERVER=1`.

## Organisation

```
e2e/
├── playwright.config.js        # config (projets par rôle, webServer frontend)
├── tests/
│   ├── helpers/                # identifiants, connexion UI, contexte API authentifié
│   ├── auth.setup.js           # connexion + sauvegarde de session par rôle
│   ├── shared/
│   │   ├── public.spec.js      # pages publiques (accueil, connexion, inscription)
│   │   ├── auth-flow.spec.js   # connexion / erreurs / persistance
│   │   └── access-control.spec.js  # routes protégées + redirections
│   ├── client/
│   │   ├── navigation.spec.js  # navigation + cloisonnement
│   │   └── besoins.spec.js     # CRUD des besoins
│   ├── fournisseur/
│   │   ├── navigation.spec.js  # navigation + cloisonnement
│   │   └── prestations.spec.js # CRUD des prestations
│   ├── admin/
│   │   ├── navigation.spec.js  # navigation + cloisonnement
│   │   ├── users.spec.js       # recherche, détails, activation Premium
│   │   └── categories.spec.js  # CRUD catégories + sous-catégories
│   └── workflow/
│       └── full-lifecycle.spec.js  # parcours métier complet (piloté API)
└── .auth/                      # états de session générés (gitignored)
```

## Couverture fonctionnelle

**Partagé**
- Rendu des pages publiques (accueil, connexion, inscription).
- Connexion des 3 rôles + redirection vers le bon tableau de bord.
- Identifiants invalides → message d'erreur, pas de redirection.
- Persistance de la session après rechargement.
- Routes protégées → redirection vers `/login` si non connecté.
- Cloisonnement des rôles (un client ne peut pas atteindre l'admin, etc.).

**Client**
- Navigation latérale + mémorisation du repli du menu.
- Création d'un besoin, validation du formulaire vide, recherche/détail,
  ouverture de la modification, suppression depuis le détail.

**Fournisseur**
- Navigation latérale + cloisonnement.
- Création d'une prestation, validation, recherche/détail, suppression.

**Administrateur**
- Navigation latérale + cloisonnement.
- Recherche d'utilisateurs, panneau de détails, filtre « Clients Premium »,
  activation/retrait du Premium (aller-retour) avec confirmation.
- Création/suppression de catégories et de sous-catégories.

**Workflow complet (piloté API)**
- besoin (sur devis) → prestation → collaboration → devis proposé → devis accepté
  → travail terminé → vérification client → demande de validation admin
  → finalisation admin → transaction « terminée ».
