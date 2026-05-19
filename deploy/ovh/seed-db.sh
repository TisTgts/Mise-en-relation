#!/bin/bash
# Peuple (ou réinitialise) la base sur le VPS OVH — PostgreSQL
# Usage sur le VPS :
#   cd /var/www/plateforme && bash deploy/ovh/seed-db.sh
#
# Prérequis : code à jour (git pull), backend/.env avec DATABASE_URL
set -e

APP_DIR=/var/www/plateforme
cd "$APP_DIR"

echo "=== Arrêt API (libère les connexions PostgreSQL) ==="
sudo systemctl stop plateforme

echo "=== Migrations + peuplement demo ==="
cd backend
source ../venv/bin/activate
pip install -q -r requirements.txt
python manage.py migrate --no-input
python manage.py seed_db --reset
deactivate

echo "=== Redémarrage API ==="
sudo systemctl start plateforme
sudo systemctl reload nginx

echo ""
echo "=== Seed terminé ==="
echo "Mot de passe des comptes demo : demo1234"
echo "Liste : utilisateurs_identifiants.md (à la racine du dépôt)"
