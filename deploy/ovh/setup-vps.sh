#!/bin/bash
# Installation initiale sur VPS OVH (Ubuntu 22.04 / 24.04)
# Exécuter en root ou avec sudo : bash setup-vps.sh
set -e

echo "=== Mise à jour système ==="
apt update && apt upgrade -y

echo "=== Paquets nécessaires ==="
apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib \
    git certbot python3-certbot-nginx ufw nodejs npm

echo "=== PostgreSQL : base et utilisateur ==="
echo "Créez manuellement si besoin :"
echo "  sudo -u postgres psql"
echo "  CREATE USER tis WITH PASSWORD 'MOT_DE_PASSE_FORT';"
echo "  CREATE DATABASE plateforme_db OWNER tis;"
echo "  \\q"

echo "=== Dossiers application ==="
mkdir -p /var/www/plateforme
mkdir -p /var/log/plateforme
chown -R ubuntu:ubuntu /var/log/plateforme

echo "=== Pare-feu (SSH + HTTP + HTTPS) ==="
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "=== Terminé ==="
echo "Prochaines étapes :"
echo "  1. Cloner le projet dans /var/www/plateforme"
echo "  2. Configurer backend/.env"
echo "  3. Voir deploy/ovh/GUIDE_OVH.md"
