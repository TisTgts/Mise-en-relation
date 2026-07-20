# Déployer Toghinis sur toghinis.com

Branche Git : **`deploy/toghinis-com`**

Cette branche coexiste avec **toghinis.net** (`feature/code`) sur le **même VPS** grâce à des chemins, ports et services distincts.

## Différences avec toghinis.net

| | toghinis.net | toghinis.com |
|--|--------------|--------------|
| Branche | `feature/code` | `deploy/toghinis-com` |
| Nom affiché | AppName | **Toghinis** |
| Couleurs | Bleu / indigo | **Ambre / orange** |
| Dossier VPS | `/var/www/plateforme` | `/var/www/plateforme-com` |
| Gunicorn | port 8000 | port **8001** |
| Service systemd | `plateforme` | `plateforme-com` |
| Nginx | `sites-available/plateforme` | `sites-available/plateforme-com` |
| Base PostgreSQL | `plateforme_db` | `plateforme_com_db` |

## Prérequis

1. **toghinis.net** déjà opérationnel sur le VPS (144.217.82.132)
2. Zone DNS **toghinis.com** : enregistrements **A** pour `@` et `www` → `144.217.82.132`
3. **Pas d'enregistrement AAAA** sur `@` et `www` (bloque Let's Encrypt)

## 1. Cloner la branche sur le VPS

```bash
cd /var/www
sudo git clone -b deploy/toghinis-com https://github.com/TisTgts/Mise-en-relation.git plateforme-com
sudo chown -R ubuntu:ubuntu plateforme-com
cd plateforme-com
```

## 2. Environnement Python

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
deactivate
```

## 3. Base PostgreSQL dédiée

```bash
sudo -u postgres psql -c "CREATE USER tis_com WITH PASSWORD 'VOTRE_MOT_DE_PASSE';"
sudo -u postgres psql -c "CREATE DATABASE plateforme_com_db OWNER tis_com;"
```

Copier `backend/.env.example` vers `backend/.env` et adapter `SECRET_KEY` et le mot de passe.

## 4. Migrations et build initial

```bash
cd /var/www/plateforme-com/backend
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --no-input
deactivate

    echo 'REACT_APP_API_URL=https://toghinis.com/api' > ../frontend/.env.production
    cd ../frontend && npm ci && npm run build
```

## 5. Service Gunicorn (port 8001)

```bash
sudo mkdir -p /var/log/plateforme-com
sudo chown ubuntu:ubuntu /var/log/plateforme-com
sudo cp /var/www/plateforme-com/deploy/ovh/gunicorn.service /etc/systemd/system/plateforme-com.service
sudo systemctl daemon-reload
sudo systemctl enable --now plateforme-com
```

## 6. Nginx + HTTPS

```bash
cd /var/www/plateforme-com
bash deploy/ovh/setup-https.sh
```

En cas de blocage AAAA OVH :

```bash
bash deploy/ovh/setup-https-dns.sh
```

Diagnostic :

```bash
bash deploy/ovh/check-https.sh toghinis.com 144.217.82.132
```

## 7. Peuplement demo (optionnel)

```bash
cd /var/www/plateforme-com && bash deploy/ovh/seed-db.sh
```

## Mises à jour

```bash
cd /var/www/plateforme-com
git pull origin deploy/toghinis-com
bash deploy/ovh/deploy-app.sh
```

## Modifier le branding

| Fichier | Contenu |
|---------|---------|
| `frontend/src/config/branding.js` | Nom, tagline, email |
| `frontend/tailwind.config.js` | Palette ambre (primary, indigo, blue) |
| `frontend/public/index.html` | Titre navigateur, theme-color |

Les classes `indigo-*` dans l'interface sont remappées vers l'ambre via Tailwind — pas besoin de modifier chaque composant.
