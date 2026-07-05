#!/bin/bash
# Mise à jour toghinis.com après git pull (à lancer sur le VPS)
set -e
APP_DIR="${APP_DIR:-/var/www/plateforme-com}"
SERVICE="${SERVICE:-plateforme-com}"
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
if [ ! -f .env.production ]; then
  echo "ERREUR: frontend/.env.production absent."
  echo "Exemple: echo 'REACT_APP_API_URL=https://toghinis.com/api' > .env.production"
  exit 1
fi
echo "API frontend: $(grep REACT_APP_API_URL .env.production || true)"
npm ci
npm run build

echo "=== Redémarrage API ==="
sudo systemctl restart "$SERVICE"
sudo systemctl reload nginx

echo "=== Déploiement terminé (toghinis.com) ==="
echo "Pour repeupler la base demo : bash deploy/ovh/seed-db.sh"
