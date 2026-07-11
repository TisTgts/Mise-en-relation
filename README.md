# Mise en relation — Plateforme AppName

Plateforme web pour mettre en relation **clients** (besoins) et **fournisseurs** (prestations), avec **matching automatique**, administration et statistiques.

> Ce README est **enrichi au fil du projet**. Documentation détaillée : **`docs/GUIDE_DEVELOPPEUR.md`**, guides utilisateur dans **`docs/GUIDE_UTILISATEURS.md`**, repères rapides dans **`PROMPTS_ET_REFERENCE.md`**.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18, React Router 6, Tailwind CSS, Recharts |
| Backend | **Django 4.2**, **Django REST Framework 3.14**, JWT (`djangorestframework-simplejwt`) |
| Auth API | JWT personnalisé (`accounts.authentication.LenientJWTAuthentication`) |
| Filtres | `django-filter` |
| Base de données | **SQLite** par défaut (`backend/db.sqlite3`) ; **`psycopg2-binary`** présent pour PostgreSQL en prod |
| Ops (prévu) | **Gunicorn**, **WhiteNoise**, **Celery** + **Redis** (brokers configurés dans `settings.py` ; à brancher selon les besoins) |

API REST préfixée par **`/api/`**  
Exemple : `POST http://localhost:8000/api/accounts/login/`

---

## Configuration locale (extrait)

Fichier : `backend/transport_platform/settings.py`

| Paramètre | Valeur actuelle (dev) |
|-----------|------------------------|
| `LANGUAGE_CODE` | `fr-fr` |
| `TIME_ZONE` | issu de `pays/*.json` (défaut `Africa/Lome` via `COUNTRY_CODE` / `pays/active.json`) |
| `USE_TZ` | `True` |
| Pagination DRF | **20** éléments par page (`PAGE_SIZE`) |
| JWT access | ~**60** minutes |
| JWT refresh | **1** jour |
| CORS | Origines `localhost:3000` / `127.0.0.1:3000` (+ réglages ouverts en développement) |

⚠️ Avant toute mise en production : changer **`SECRET_KEY`**, désactiver **`DEBUG`**, resserrer **CORS**, définir **`ALLOWED_HOSTS`** et une base PostgreSQL adaptée.

---

## Structure du dépôt

```
mise_en_relation/
├── frontend/              # Create React App — proxy → http://localhost:8000
├── backend/
│   ├── transport_platform/   # settings, urls racine
│   ├── accounts/             # User JWT, profils client/fournisseur
│   ├── services/             # Catégories, besoins, prestations, transactions…
│   ├── matching/             # Algorithme, MatchingRun, commandes (clear_matching)
│   ├── manage.py
│   ├── db.sqlite3            # Base locale (ne pas committer si sensible)
│   └── requirements.txt
├── .vscode/               # tasks (npm start, migrate…) — optionnel
├── README.md
├── PROMPTS_ET_REFERENCE.md
└── …
```

---

## Prérequis

- **Node.js** (LTS recommandé) + **npm**
- **Python 3.10+** (testé avec **Python 3.13** sur ce dépôt)

---

## Installation et exécution locale

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows : venv\Scripts\activate
# Linux/macOS : source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # optionnel — accès /admin/ Django
python manage.py runserver
```

URL habituelle : **`http://127.0.0.1:8000/`**

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

URL : **`http://localhost:3000`** — le **`proxy`** du `package.json` redirige les requêtes vers le backend.

Variable optionnelle : **`REACT_APP_API_URL`** si tu ne passes pas par le proxy (ex. build avec API absolue).

### 3. VS Code / Cursor

Des **tâches** sont définies dans `.vscode/tasks.json`, par exemple :

- démarrer le frontend (`npm run start` dans `frontend`)
- exécuter les migrations Django dans `backend`

---

## Navigation applicative (aperçu)

Les routes exactes sont dans `frontend/src/App.js`. Exemples :

| Zone | Chemins (extraits) |
|------|---------------------|
| Admin | `/admin/dashboard`, `/admin/users`, `/admin/categories`, `/admin/transactions`, `/admin/correspondances`, `/admin/collaborations`, `/admin/messages`, `/admin/settings` |
| Client | `/client/dashboard`, `/client/mes-besoins`, `/client/matchings`, `/client/transactions`, `/client/messages`, `/client/mes-collaborations` |
| Fournisseur | `/fournisseur/dashboard`, `/fournisseur/mes-prestations`, `/fournisseur/transactions`, `/fournisseur/messages`, `/fournisseur/mes-collaborations` |

---

## API (modules principaux)

Préfixe global : **`/api/`**

| Module | Préfixe | Exemples d’endpoints |
|--------|---------|----------------------|
| Accounts | `/api/accounts/` | `login/`, `register/`, `me/`, `token/refresh/` |
| Services | `/api/services/` | `categories/`, `prestations/`, `besoins/`, `transactions/`, `messages/` |
| Matching | `/api/matching/` | `scores/`, `trouver-correspondances/...`, `admin/correspondances/`, `client/confirmer-match/` |

---

## Fonctionnalités principales

- **Authentification** : inscription / connexion ; jetons JWT stockés côté front (**`access_token`** dans `localStorage`).
- **Rôles** : `client`, `fournisseur`, `administrateur` (`type_utilisateur` ; alias **`user_type`** sur le modèle).
- **Catalogue métier** : catégories / sous-catégories, **besoins**, **prestations**.
- **Matching** : score multi-critères ; persistance par **`MatchingRun`** (une exécution = une ligne + tableau JSON des paires). Voir module `backend/matching/`.
- **Interface admin** : tableau de bord (graphiques), lancement du matching, gestion des données et vue correspondances par besoin.

---

## Commandes Django utiles

| Commande | Rôle |
|----------|------|
| `python manage.py migrate` | Appliquer les migrations |
| `python manage.py makemigrations` | Créer des migrations après changement de modèles |
| `python manage.py test matching` | Tests du module matching |
| `python manage.py clear_matching --yes` | Supprime **toutes** les lignes **`MatchingRun`** |
| `python manage.py seed_db` | Données de démo (implémentation projet) |
| `python manage.py seed_togo_demo` | Jeu de démo du **pays actif** (`pays/*.json`) |
| `python manage.py check_admins` | Vérification liée aux comptes administrateurs |

---

## Pays (multi-cibles)

Configs dans **`pays/`** (source de vérité) : `tg.json`, `bf.json`, `active.json`.

| Sélection | Variable / fichier |
|-----------|-------------------|
| Backend | `COUNTRY_CODE` (env) sinon `pays/active.json` |
| Frontend | `REACT_APP_COUNTRY` sinon `frontend/src/pays/active.js` |

Après modification des JSON racine :

```bash
node scripts/sync-pays.js
```

API lecture seule : `GET /api/config/country/`

---

## Dépannage rapide

| Symptôme | Piste |
|----------|--------|
| Erreur CORS ou API inaccessible | Vérifier que le backend tourne sur **8000** et le front sur **3000** ; consulter `CORS_*` dans `settings.py`. |
| **401** sur les routes protégées | Token expiré ou absent : se reconnecter ; durée d’access token ~60 min. |
| Données matching incohérentes après tests | `python manage.py clear_matching --yes` puis relancer un matching propre. |
| Pagination : « je ne vois pas tout » | L’API pagine par **20** ; le service admin utilise déjà la pagination pour certains listages (`fetchAllPaginated`). |

---

## Tests

```bash
cd backend
python manage.py test                    # tout le projet
python manage.py test matching           # app matching
python manage.py test matching.tests.MatchingServiceTests -v 2   # ciblé
```

Frontend (CRA) :

```bash
cd frontend
npm test
```

---

## Contribution / bonnes pratiques

- Une PR ou un commit = un **sujet clair** ; éviter les fichiers `__pycache__` et `db.sqlite3` personnels dans Git si la politique du repo l’interdit.
- **`pip freeze`** n’est pas utilisé comme source de vérité : les versions sont dans **`requirements.txt`**.
- Documenter les **nouvelles variables d’environnement** ou endpoints dans ce README ou dans **`PROMPTS_ET_REFERENCE.md`**.

### Hygiène Git recommandée

Ajouter (ou vérifier) dans `.gitignore` :

- `**/__pycache__/`
- `*.pyc`
- `backend/db.sqlite3` (si base locale non versionnée dans votre workflow)
- `~$*.docx`
- `~WRL*.tmp`
- `frontend/build/`

---

## Évolution de ce document *(à compléter au fur et à mesure)*

- [ ] URL et procédure de **déploiement** (Docker, PaaS, variables prod).
- [ ] Schéma ou lien vers la **documentation API** (OpenAPI / export Postman).
- [ ] Stratégie **sauvegardes** base de données.
- [ ] Activation réelle des **tâches Celery** si le projet les utilise.

---

## Licence / projet

**Projet TIS** — usage selon les règles de votre organisation.
