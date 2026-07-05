#!/bin/bash
# Peuple (ou réinitialise) la base toghinis.com sur le VPS OVH
# Usage : cd /var/www/plateforme-com && bash deploy/ovh/seed-db.sh
set -e

APP_DIR="${APP_DIR:-/var/www/plateforme-com}"
SERVICE="${SERVICE:-plateforme-com}"
cd "$APP_DIR"

echo "=== Arrêt API (libère les connexions PostgreSQL) ==="
sudo systemctl stop "$SERVICE"

echo "=== Migrations + peuplement demo ==="
cd backend
source ../venv/bin/activate
pip install -q -r requirements.txt
python manage.py migrate --no-input
python manage.py seed_db --reset
deactivate

echo "=== Redémarrage API ==="
sudo systemctl start "$SERVICE"
sudo systemctl reload nginx

echo ""
echo "=== Seed terminé (toghinis.com) ==="
echo "Mot de passe des comptes demo : demo1234"
