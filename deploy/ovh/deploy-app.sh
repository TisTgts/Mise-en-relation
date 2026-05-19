#!/bin/bash
# Mise à jour de l'app après un git pull (à lancer sur le VPS)
set -e
APP_DIR=/var/www/plateforme
cd "$APP_DIR"

echo "=== Backend ==="
cd backend
source ../venv/bin/activate
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
deactivate

echo "=== Frontend ==="
cd ../frontend
npm ci
npm run build

echo "=== Redémarrage API ==="
sudo systemctl restart serviceconnect
sudo systemctl reload nginx

echo "=== Déploiement terminé ==="
