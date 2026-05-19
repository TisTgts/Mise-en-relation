# OVHcloud — guide simple (première fois)

Projet **ServiceConnect** (Django + React).  
Ne lisez pas tout d’un coup : **une étape à la fois**.

**Exemples utilisés dans ce guide** (remplacez par les vôtres) :

| Élément | Exemple |
|---------|---------|
| IP du VPS | `144.217.82.132` |
| Domaine | `toghinis.net` |
| Utilisateur SSH | `ubuntu` |

Guide détaillé : [`GUIDE_OVH.md`](./GUIDE_OVH.md)

---

## PARTIE A — Tester l’app sur votre PC (avant OVH)

### A1 — Backend

PowerShell :

```powershell
cd C:\Users\korog\Desktop\Projet_TIS\mise_en_relation\backend
python manage.py runserver
```

Vous devez voir : `Starting development server at http://127.0.0.1:8000/`  
→ Laissez cette fenêtre **ouverte**.

### A2 — Frontend

Nouvelle fenêtre PowerShell :

```powershell
cd C:\Users\korog\Desktop\Projet_TIS\mise_en_relation\frontend
npm start
```

→ Navigateur : **http://localhost:3000**

**Tant que A1 et A2 ne marchent pas, inutile de déployer sur OVH.**

Alternative : double-clic sur `demarrer-local.ps1` à la racine du projet (backend seulement).

---

## PARTIE B — Ce qu’il faut avoir chez OVH

Dans [OVH Manager](https://www.ovh.com/manager/) :

| Produit | Où le trouver | Obligatoire ? |
|---------|---------------|---------------|
| **VPS** | **Bare Metal Cloud** → **Serveurs privés virtuels** | **Oui** |
| **Nom de domaine** | **Web Cloud** → **Noms de domaine** | Recommandé |
| **Hébergement web** Perso/Pro (PHP) | **Web Cloud** → **Hébergements** | **Non** (pas adapté à Django) |

- Si **VPS = aucun résultat** → commandez un **VPS Starter** + image **Ubuntu 22.04** ou **24.04**.
- Un **domaine seul** (ex. `toghinis.net`) ne suffit pas : il faut un **VPS** pour faire tourner l’application.

---

## PARTIE C — Se connecter au VPS (SSH)

### C1 — Connexion

PowerShell (remplacez l’IP) :

```powershell
ssh ubuntu@144.217.82.132
```

- Premier contact : tapez `yes`
- Mot de passe : celui du **mail OVH** « Votre VPS est prêt » (rien ne s’affiche en tapant, c’est normal)

### C2 — Messages d’erreur fréquents

| Message | Signification | Que faire |
|---------|---------------|-----------|
| `Connection timed out` | Réseau / pare-feu / mauvaise IP | Vérifier que le VPS est **Actif** dans le manager ; ouvrir le **port 22** dans le pare-feu OVH ; essayer `ssh -4 ubuntu@IP` |
| `Permission denied` | Bon serveur, **mauvais mot de passe** | Mot de passe du mail OVH ou **Réinitialiser le mot de passe** dans le manager |
| `Connection closed` | Souvent mauvais utilisateur (`debian` sur Ubuntu) | Utiliser **`ubuntu`**, pas `debian` |
| `TcpTestSucceeded : True` mais SSH timeout | Souvent pare-feu **Windows** | Autoriser `C:\Windows\System32\OpenSSH\ssh.exe` en sortie ; essayer [PuTTY](https://www.putty.org/) |

### C3 — Console KVM (si SSH refuse)

1. Manager → **Bare Metal Cloud** → **VPS** → votre serveur  
2. Bouton **Console KVM** / **KVM**  
3. Login : `ubuntu` + mot de passe du mail OVH  

Vous pouvez faire **toutes les étapes suivantes** depuis la KVM si SSH Windows ne marche pas.

### C4 — Vous êtes connecté quand vous voyez

```text
ubuntu@vps-xxxxx:~$
```

---

## PARTIE D — Installation sur le VPS (une fois connecté)

> Remplacez `144.217.82.132`, `toghinis.net` et `MON_MOT_DE_PASSE_DB` par vos valeurs.

---

### Étape 1 — Installer les outils

Collez sur le **VPS** :

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Attendre la fin (5–10 min).

---

### Étape 2 — Créer la base PostgreSQL

Choisissez un mot de passe fort pour la base (`MON_MOT_DE_PASSE_DB`) :

```bash
sudo -u postgres psql -c "CREATE USER tis WITH PASSWORD 'MON_MOT_DE_PASSE_DB';"
sudo -u postgres psql -c "CREATE DATABASE plateforme_db OWNER tis;"
```

---

### Étape 3 — Récupérer le projet avec Git

**Dépôt :** https://github.com/TisTgts/Mise-en-relation.git  
**Branche :** `feature/code`

#### 3A — Sur votre PC (pousser le code)

```powershell
cd C:\Users\korog\Desktop\Projet_TIS\mise_en_relation
git add .
git commit -m "Deploy OVH"
git push origin feature/code
```

Ne pas commiter `backend/.env` (secrets).

#### 3B — Sur le VPS (cloner)

```bash
sudo mkdir -p /var/www/plateforme
sudo chown -R ubuntu:ubuntu /var/www/plateforme
cd /var/www/plateforme
git clone -b feature/code https://github.com/TisTgts/Mise-en-relation.git .
ls
```

Vous devez voir `backend`, `frontend`, `deploy`, etc.

#### Mises à jour ultérieures

```bash
cd /var/www/plateforme
git pull origin feature/code
bash deploy/ovh/deploy-app.sh
```

<details><summary>Variante scp (sans Git)</summary>

```powershell
scp -r C:\Users\korog\Desktop\Projet_TIS\mise_en_relation ubuntu@144.217.82.132:~/plateforme
```

```bash
sudo mkdir -p /var/www
sudo mv ~/plateforme /var/www/plateforme
sudo chown -R ubuntu:ubuntu /var/www/plateforme
```

</details>

---

### Étape 4 — Fichier `backend/.env`

Sur le **VPS** :

```bash
nano /var/www/plateforme/backend/.env
```

Contenu (à adapter) :

```env
SECRET_KEY=COLLEZ_ICI_UNE_CLE_ALEATOIRE
DEBUG=False
ALLOWED_HOSTS=144.217.82.132,toghinis.net,www.toghinis.net

DATABASE_URL=postgres://tis:MON_MOT_DE_PASSE_DB@localhost:5432/plateforme_db

CORS_ALLOWED_ORIGINS=http://144.217.82.132,http://toghinis.net,http://www.toghinis.net
CORS_ALLOW_ALL_ORIGINS=False

JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

Générer une `SECRET_KEY` :

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Dans nano : **Ctrl+O** → Entrée → **Ctrl+X**.

Modèle local : `backend/.env.example`

---

### Étape 5 — Backend Django

```bash
cd /var/www/plateforme
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py collectstatic --no-input
python manage.py createsuperuser
deactivate
```

---

### Étape 6 — Build du frontend React

```bash
cd /var/www/plateforme/frontend
echo "REACT_APP_API_URL=http://144.217.82.132/api" > .env.production
npm ci
npm run build
```

Après configuration du domaine : remplacez par `http://toghinis.net/api` puis refaites `npm run build`.

---

### Étape 7 — Service API (Gunicorn)

```bash
sudo mkdir -p /var/log/serviceconnect
sudo chown ubuntu:ubuntu /var/log/serviceconnect

sudo tee /etc/systemd/system/serviceconnect.service > /dev/null << 'EOF'
[Unit]
Description=ServiceConnect Django
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/plateforme/backend
EnvironmentFile=/var/www/plateforme/backend/.env
ExecStart=/var/www/plateforme/venv/bin/gunicorn transport_platform.wsgi:application --bind 127.0.0.1:8000 --workers 2 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable serviceconnect
sudo systemctl start serviceconnect
sudo systemctl status serviceconnect
```

Résultat attendu : **`active (running)`**.

---

### Étape 8 — Nginx (site + API)

```bash
sudo tee /etc/nginx/sites-available/serviceconnect > /dev/null << 'EOF'
server {
    listen 80;
    server_name 144.217.82.132 toghinis.net www.toghinis.net;

    client_max_body_size 20M;

    location /media/ {
        alias /var/www/plateforme/backend/media/;
    }

    location /static/ {
        alias /var/www/plateforme/backend/staticfiles/;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/plateforme/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/serviceconnect /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Fichier modèle : [`nginx-serviceconnect.conf`](./nginx-serviceconnect.conf)

---

### Étape 9 — Tester dans le navigateur

| URL | Attendu |
|-----|---------|
| http://144.217.82.132 | Page d’accueil React |
| http://144.217.82.132/api/ | Réponse API |
| http://144.217.82.132/admin/ | Connexion admin Django |

---

### Étape 10 — Domaine OVH + HTTPS

**Zone DNS** (Manager → **Web Cloud** → **toghinis.net** → **Zone DNS**) :

| Type | Sous-domaine | Cible |
|------|--------------|-------|
| A | `@` | `144.217.82.132` |
| A | `www` | `144.217.82.132` |

Attendre la propagation DNS (souvent &lt; 1 h).

**Certificat HTTPS** (sur le VPS, quand le domaine pointe vers le VPS) :

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d toghinis.net -d www.toghinis.net
```

Puis mettre à jour :

- `backend/.env` → `CORS_ALLOWED_ORIGINS` en **https://**
- `frontend/.env.production` → `REACT_APP_API_URL=https://toghinis.net/api`
- Rebuild : `cd /var/www/plateforme/frontend && npm run build`
- `sudo systemctl reload nginx`

---

## PARTIE E — Mises à jour ultérieures

Sur le VPS, après un `git pull` ou une nouvelle copie :

```bash
cd /var/www/plateforme
bash deploy/ovh/deploy-app.sh
```

---

## PARTIE F — Dépannage rapide

| Problème | Commande / action |
|----------|-------------------|
| API ne répond pas | `sudo systemctl status serviceconnect` |
| Logs API | `sudo journalctl -u serviceconnect -f` |
| Logs Nginx | `sudo tail -f /var/log/nginx/error.log` |
| Page blanche React | Vérifier `npm run build` et le dossier `frontend/build` |
| Erreur CORS | Vérifier `CORS_ALLOWED_ORIGINS` dans `backend/.env` |
| 502 Bad Gateway | Gunicorn arrêté → `sudo systemctl restart serviceconnect` |

---

## Schéma récapitulatif

```text
PC (dev)                    VPS OVH
────────                    ────────
localhost:3000  ──dev──►    (plus tard)
                            Nginx :80
                              ├─ /      → React (build)
                              ├─ /api/  → Gunicorn → Django
                              └─ /admin/→ Django
                            PostgreSQL (local)
toghinis.net ──DNS A──►     144.217.82.132
```

---

## Fichiers utiles dans ce dossier

| Fichier | Rôle |
|---------|------|
| [`GUIDE_OVH.md`](./GUIDE_OVH.md) | Guide complet |
| [`nginx-serviceconnect.conf`](./nginx-serviceconnect.conf) | Config Nginx |
| [`gunicorn.service`](./gunicorn.service) | Service systemd |
| [`setup-vps.sh`](./setup-vps.sh) | Installation initiale (optionnel) |
| [`deploy-app.sh`](./deploy-app.sh) | Mise à jour après modification du code |
