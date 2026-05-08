# Prompts, repères code et commandes à retenir

Fichier personnel pour **réutiliser des consignes** et **retrouver vite** commandes / zones du code. À compléter au fil du projet.

---

## Modèles de prompts (copier-coller et adapter)

### Travailler sur le matching (algo + API)

> « Analyse `backend/matching/services.py` et les vues sous `backend/matching/views.py`. Ne change que ce qui est nécessaire. Garde la compatibilité des endpoints `/api/matching/…`, documente les critères du score dans les réponses `details.meta` si tu ajoutes des champs. Lance `python manage.py test matching`. »

### Front admin (cohérence UI)

> « Modifie uniquement les fichiers sous `frontend/src/pages/administrateur/`. Style Tailwind aligné avec `AdminDashboard.js` (cartes `rounded-2xl`, bordures `slate`, accent `indigo`). Pas de refactor hors périmètre. »

### Base de données — vider les correspondances

> « Exécute ou documente `python manage.py clear_matching --yes` après confirmation utilisateur. »

---

## Commandes fréquentes

```bash
# Backend — racine : backend/
python manage.py runserver
python manage.py migrate
python manage.py test matching accounts services

# Supprimer tout l’historique de matching
python manage.py clear_matching --yes

# Frontend — racine : frontend/
npm start
npm run build
```

---

## Rappels techniques projet

### Utilisateur Django / DRF

- Champ canonique : **`type_utilisateur`** (`client` | `fournisseur` | `administrateur`).
- **`user_type`** est une **propriété** qui renvoie `type_utilisateur` — attention à ne pas mixer les deux dans les comparaisons sans vérifier les vues existantes.

### Matching — stockage actuel

- **`MatchingRun`** : `lance_par`, `lance_le`, **`correspondances`** (JSON liste de `{ besoin_id, prestation_id, score, details, calculated_at }`).
- Fusion « vue métier » : **`merge_effective_correspondences()`** dans `backend/matching/utils.py` (dernière version gagne par paire besoin/prestation).
- Référence admin pour détail/suppression : **`corr_ref`** du type `run_id:index`.

### Fichiers clés backend matching

| Fichier | Rôle |
|---------|------|
| `matching/services.py` | Algorithme (`MatchingService`), filtres durs + pondérations |
| `matching/views.py` | Endpoints REST |
| `matching/utils.py` | Création run, fusion, purge paire |
| `matching/presentation.py` | Format JSON stable des réponses « trouver correspondances » |
| `matching/management/commands/clear_matching.py` | Vidage des `MatchingRun` |

### Préfixe API

- Comptes : `/api/accounts/`
- Services : `/api/services/`
- Matching : `/api/matching/`

Exemples :

- `POST /api/matching/trouver-correspondances/besoin/<id>/`
- `POST /api/matching/admin/lancer-besoins/`
- `GET /api/matching/admin/correspondances/plates/`

### Frontend — configuration API

- `frontend/src/config/api.js` — constantes `API_ENDPOINTS`.
- Token : `localStorage.getItem('access_token')` (voir `adminService.js`, `authService`).

---

## Snippets utiles (référence rapide)

### Créer une entrée de correspondance (Python)

Utiliser **`correspondence_entry`** depuis `matching.utils` plutôt que de dupliquer la structure du JSON.

### Tests Django sur une app

```bash
python manage.py test matching.tests.MatchingServiceTests -v 2
```

---

## Espace libre — tes notes

*(Ajoute ici tes propres prompts efficaces, identifiants de comptes de **test** uniquement, ou liens internes.)*

- …
