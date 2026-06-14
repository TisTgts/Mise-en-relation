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
if [ ! -f .env.production ]; then
  echo "ERREUR: frontend/.env.production absent."
  echo "Exemple: echo 'REACT_APP_API_URL=https://toghinis.net/api' > .env.production"
  exit 1
fi
echo "API frontend: $(grep REACT_APP_API_URL .env.production || true)"
npm ci
npm run build

echo "=== Redémarrage API ==="
sudo systemctl restart plateforme
sudo systemctl reload nginx

echo "=== Déploiement terminé ==="
echo "Pour repeupler la base demo : bash deploy/ovh/seed-db.sh"
