# Héberger AppName sur OVHcloud

Ce guide suppose un **VPS OVH** (Ubuntu 22.04 / 24.04). C’est la formule adaptée à Django + React.

> L’**hébergement web mutualisé** OVH (Perso/Pro, PHP) n’est **pas** adapté à ce projet.

**Première fois ?** Suivez plutôt [`ETAPES_SIMPLES.md`](./ETAPES_SIMPLES.md) (plus détaillé, dépannage SSH inclus).  
Ce fichier est la **référence complète** pour qui a déjà un VPS fonctionnel.

**Exemples** : IP `144.217.82.132` · domaine `toghinis.net` · utilisateur `ubuntu`

---

## Prérequis OVH

| Élément | Où le trouver |
|---------|----------------|
| VPS | **Bare Metal Cloud** → **Serveurs privés virtuels** |
| Domaine | **Web Cloud** → **Noms de domaine** |
| IP, mot de passe SSH | E-mail « Votre VPS est prêt » |

---

## 1. Connexion SSH (Windows)

```powershell
ssh ubuntu@144.217.82.132
```

- Mot de passe : mail OVH (rien ne s’affiche en tapant)
- Image **Ubuntu** → utilisateur **`ubuntu`** (pas `debian`)
- Si échec : console **KVM** dans le manager, ou [`ETAPES_SIMPLES.md` — Partie C](./ETAPES_SIMPLES.md#partie-c--se-connecter-au-vps-ssh)

---

## 2. Préparer le serveur (une fois)

Sur le VPS :

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

PostgreSQL :

```bash
sudo -u postgres psql -c "CREATE USER tis WITH PASSWORD 'CHOISIR_UN_MOT_DE_PASSE_FORT';"
sudo -u postgres psql -c "CREATE DATABASE plateforme_db OWNER tis;"
```

`DATABASE_URL` (dans `backend/.env`) :

```text
postgres://tis:CHOISIR_UN_MOT_DE_PASSE_FORT@localhost:5432/plateforme_db
```

> Si le mot de passe contient `@`, `#`, `&`, etc., encodez-le dans l’URL ou utilisez un mot de passe sans caractères spéciaux.

> Option : `sudo bash deploy/ovh/setup-vps.sh` (pare-feu + paquets de base), puis Node 20 comme ci-dessus.

---

## 3. Récupérer le projet avec Git (recommandé)

Dépôt du projet : **https://github.com/TisTgts/Mise-en-relation.git**  
Branche de travail : **`feature/code`**

### 3A — Sur votre PC : envoyer le code sur GitHub

Dans PowerShell, à la racine du projet :

```powershell
cd C:\Users\korog\Desktop\Projet_TIS\mise_en_relation
git status
git add .
git commit -m "Deploy OVH: guides, settings, deploy"
git push origin feature/code
```

> Ne commitez **jamais** `backend/.env` (mots de passe). Vérifiez que `.gitignore` l’exclut.

Si `git push` demande un login GitHub : utilisez un **Personal Access Token** comme mot de passe, ou configurez [GitHub CLI](https://cli.github.com/).

### 3B — Sur le VPS : cloner le dépôt

Connecté en SSH (`ssh ubuntu@144.217.82.132`) :

```bash
sudo mkdir -p /var/www/plateforme
sudo chown -R ubuntu:ubuntu /var/www/plateforme
cd /var/www/plateforme
git clone -b feature/code https://github.com/TisTgts/Mise-en-relation.git .
```

Le point **`.`** à la fin clone **dans** `/var/www/plateforme` (sans sous-dossier en plus).

Vérification :

```bash
ls /var/www/plateforme
# doit afficher : backend  frontend  deploy  README.md  ...
```

### 3C — Mises à jour plus tard (sur le VPS)

```bash
cd /var/www/plateforme
git pull origin feature/code
bash deploy/ovh/deploy-app.sh
```

### Variante : copie `scp` (sans Git)

<details>
<summary>Cliquer pour afficher scp</summary>

**PC :**

```powershell
scp -r C:\Users\korog\Desktop\Projet_TIS\mise_en_relation ubuntu@144.217.82.132:~/plateforme
```

**VPS :**

```bash
sudo mkdir -p /var/www
sudo mv ~/plateforme /var/www/plateforme
sudo chown -R ubuntu:ubuntu /var/www/plateforme
```

</details>

---

## 4. Environnement Python

```bash
cd /var/www/plateforme
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
deactivate
```

---

## 5. Fichier `backend/.env`

```bash
nano /var/www/plateforme/backend/.env
```

Exemple (avant HTTPS, gardez `http://` dans CORS) :

```env
SECRET_KEY=qhEZ6PRBQA3BtQuUitvKOiae1kccfcd9tEfJokgk_MX1rCLW2BxIUtWTj_g12YwoFTQ
DEBUG=False
ALLOWED_HOSTS=144.217.82.132,toghinis.net,www.toghinis.net

DATABASE_URL=postgres://tis:tis&db$26@localhost:5432/plateforme_db

CORS_ALLOWED_ORIGINS=http://144.217.82.132,http://toghinis.net,http://www.toghinis.net
CORS_ALLOW_ALL_ORIGINS=False

JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Modèle : `backend/.env.example`

---

## 6. Django

```bash
cd /var/www/plateforme/backend
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --no-input
python manage.py createsuperuser
deactivate
```

---

## 7. Build React

```bash
cd /var/www/plateforme/frontend
echo "REACT_APP_API_URL=http://144.217.82.132/api" > .env.production
npm ci
npm run build
```

Après HTTPS : `REACT_APP_API_URL=https://toghinis.net/api` puis `npm run build`.

---

## 8. Gunicorn (systemd)

Dossier du projet : **`/var/www/plateforme`**  
Nom du service : **`plateforme`** (cohérent avec votre dossier)

```bash
sudo cp /var/www/plateforme/deploy/ovh/gunicorn.service /etc/systemd/system/plateforme.service
sudo mkdir -p /var/log/plateforme
sudo chown ubuntu:ubuntu /var/log/plateforme
sudo mkdir -p /var/www/plateforme/backend/media
sudo chown -R ubuntu:ubuntu /var/www/plateforme/backend/media
sudo systemctl daemon-reload
sudo systemctl enable plateforme
sudo systemctl start plateforme
sudo systemctl status plateforme
```

Attendu : **`active (running)`**.

> Si vous aviez créé un ancien service `serviceconnect` :  
> `sudo systemctl disable --now serviceconnect`

---

## 9. Nginx

```bash
sudo cp /var/www/plateforme/deploy/ovh/nginx-serviceconnect.conf /etc/nginx/sites-available/plateforme
sudo nano /etc/nginx/sites-available/plateforme
```

Remplacez `VOTRE_DOMAINE.fr` par `toghinis.net` et ajoutez l’IP dans `server_name` si besoin :

```nginx
server_name 144.217.82.132 toghinis.net www.toghinis.net;
```

Puis :

```bash
sudo ln -sf /etc/nginx/sites-available/plateforme /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10. Domaine (zone DNS OVH)

**Web Cloud** → domaine → **Zone DNS** :

| Type | Sous-domaine | Cible |
|------|--------------|-------|
| A | @ | `144.217.82.132` |
| A | www | `144.217.82.132` |

---

## 11. HTTPS (Let’s Encrypt)

### 11A — Vérifier le DNS (important)

Sur le VPS :

```bash
dig +short toghinis.net A
dig +short www.toghinis.net A
dig +short toghinis.net AAAA
```

Les enregistrements **A** doivent afficher **`144.217.82.132`**.  
Si un **AAAA** (IPv6) pointe ailleurs, supprimez-le dans la zone DNS OVH ou pointez-le vers ce VPS.

Dans **OVH** → **toghinis.net** → **Zone DNS** : pas de redirection « parking », pas de CDN devant le VPS.

### 11B — Corriger Nginx pour le défi ACME

L’erreur *« key authorization file did not match »* vient souvent de `try_files … /index.html` qui intercepte `/.well-known/`.

```bash
sudo mkdir -p /var/www/plateforme/certbot/.well-known/acme-challenge
sudo chown -R ubuntu:ubuntu /var/www/plateforme/certbot
```

Mettez à jour la config Nginx (le fichier modèle contient déjà le bloc `acme-challenge`) :

```bash
sudo cp /var/www/plateforme/deploy/ovh/nginx-serviceconnect.conf /etc/nginx/sites-available/plateforme
sudo nano /etc/nginx/sites-available/plateforme
# server_name 144.217.82.132 toghinis.net www.toghinis.net;
sudo nginx -t
sudo systemctl reload nginx
```

Vérifiez que le bloc suivant est **au-dessus** de `location /` :

```nginx
location ^~ /.well-known/acme-challenge/ {
    root /var/www/plateforme/certbot;
    default_type "text/plain";
    try_files $uri =404;
}
```

### 11C — Obtenir le certificat (méthode webroot, recommandée)

```bash
sudo apt install -y certbot
sudo certbot certonly --webroot \
  -w /var/www/plateforme/certbot \
  -d toghinis.net \
  -d www.toghinis.net
```

Puis installer la config HTTPS dans Nginx :

```bash
sudo certbot --nginx -d toghinis.net -d www.toghinis.net
```

Si `--nginx` échoue encore, configurez SSL à la main ou relancez seulement :

```bash
sudo certbot install --cert-name toghinis.net
```

> Évitez plusieurs `certbot --nginx` d’affilée après un échec : attendez 1 minute, corrigez Nginx, puis utilisez **webroot** ci-dessus.

### 11D — Après le certificat

Mettre à jour `backend/.env` (`CORS` en `https://`), `frontend/.env.production`, puis :

```bash
cd /var/www/plateforme/frontend && npm run build
sudo systemctl reload nginx
```

---

## Vérifications

| Test | URL |
|------|-----|
| Site React | http://144.217.82.132 ou https://toghinis.net |
| API | …/api/ |
| Admin | …/admin/ |

Logs :

```bash
sudo journalctl -u plateforme -f
sudo tail -f /var/log/nginx/error.log
```

---

## Mises à jour

```bash
cd /var/www/plateforme
git pull
bash deploy/ovh/deploy-app.sh
```

---

## Peupler / réinitialiser la base (données demo)

Sur le VPS, après avoir poussé le code (`seed_business_data.py`, `seed_users.json`) :

```bash
cd /var/www/plateforme
git pull origin feature/code
bash deploy/ovh/seed-db.sh
```

Ce script :

1. Arrête Gunicorn (`plateforme`)
2. Lance `migrate` puis `python manage.py seed_db --reset` (PostgreSQL : `flush` + données demo)
3. Redémarre l’API

Comptes : mot de passe **`demo1234`** — voir `utilisateurs_identifiants.md` à la racine du dépôt.

> **Attention** : `--reset` **efface toutes les données** de production sur le VPS (utilisateurs réels inclus). À n’utiliser qu’en environnement de démo / test.

---

## Fichiers de ce dossier

| Fichier | Rôle |
|---------|------|
| [`ETAPES_SIMPLES.md`](./ETAPES_SIMPLES.md) | Guide pas à pas (débutant) |
| [`nginx-serviceconnect.conf`](./nginx-serviceconnect.conf) | Config Nginx |
| [`gunicorn.service`](./gunicorn.service) | Service systemd |
| [`setup-vps.sh`](./setup-vps.sh) | Préparation VPS (optionnel) |
| [`deploy-app.sh`](./deploy-app.sh) | Mise à jour après `git pull` |
| [`seed-db.sh`](./seed-db.sh) | Peuplement demo (`seed_db --reset`) sur PostgreSQL |

---

## Identifiants → variables

| Source OVH | Variable / usage |
|------------|------------------|
| IP VPS | `ALLOWED_HOSTS`, DNS A, Nginx `server_name` |
| Login SSH | `ssh ubuntu@IP` |
| Domaine | `CORS_ALLOWED_ORIGINS`, `REACT_APP_API_URL` |
| PostgreSQL (créé par vous) | `DATABASE_URL` |
| SECRET_KEY (générée) | `backend/.env` |
