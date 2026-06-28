#!/bin/bash
# Obtient un certificat via défi DNS (contourne le AAAA OVH qui bloque HTTP-01).
# Usage : cd /var/www/plateforme && bash deploy/ovh/setup-https-dns.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/plateforme}"
DOMAIN="${DOMAIN:-toghinis.net}"
WWW_DOMAIN="www.${DOMAIN}"
CERT_NAME="${CERT_NAME:-$DOMAIN}"
VPS_IP="${VPS_IP:-144.217.82.132}"

cd "$APP_DIR"

echo "=============================================="
echo " Certificat HTTPS via DNS (OVH)"
echo " Domaine : $DOMAIN"
echo "=============================================="
echo ""
echo "Ce script lance certbot en mode manuel."
echo "Vous devrez ajouter des enregistrements TXT dans OVH."
echo ""
echo "OVH Manager → Web Cloud → Noms de domaine → $DOMAIN → Zone DNS"
echo "Ajoutez une entrée TXT pour chaque valeur affichée par certbot."
echo ""
read -r -p "Appuyez sur Entrée pour lancer certbot..."

sudo certbot certonly --manual --preferred-challenges dns \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN" \
  --agree-tos \
  --register-unsafely-without-email \
  --manual-public-ip-logging-ok

if [ ! -f "/etc/letsencrypt/live/$CERT_NAME/fullchain.pem" ]; then
  echo "ERREUR: certificat non trouvé après certbot."
  exit 1
fi

echo ""
echo "=== Certificat obtenu — activation Nginx HTTPS ==="

if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  sudo certbot install --cert-name "$CERT_NAME" --nginx 2>/dev/null || true
fi
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

SSL_CONF="$APP_DIR/deploy/ovh/nginx-serviceconnect-ssl.conf"
sudo cp "$SSL_CONF" /etc/nginx/sites-available/plateforme
sudo sed -i "s/toghinis.net/$DOMAIN/g" /etc/nginx/sites-available/plateforme
sudo sed -i "s/144.217.82.132/$VPS_IP/g" /etc/nginx/sites-available/plateforme
sudo ln -sf /etc/nginx/sites-available/plateforme /etc/nginx/sites-enabled/plateforme
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

ENV_FILE="$APP_DIR/backend/.env"
if [ -f "$ENV_FILE" ]; then
  CORS_HTTPS="https://$DOMAIN,https://$WWW_DOMAIN,http://$VPS_IP"
  if grep -q '^CORS_ALLOWED_ORIGINS=' "$ENV_FILE"; then
    sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=$CORS_HTTPS|" "$ENV_FILE"
  else
    echo "CORS_ALLOWED_ORIGINS=$CORS_HTTPS" >> "$ENV_FILE"
  fi
  grep -q '^CORS_ALLOW_ALL_ORIGINS=' "$ENV_FILE" && \
    sed -i 's|^CORS_ALLOW_ALL_ORIGINS=.*|CORS_ALLOW_ALL_ORIGINS=False|' "$ENV_FILE"
fi

echo "REACT_APP_API_URL=https://$DOMAIN/api" > "$APP_DIR/frontend/.env.production"
cd "$APP_DIR/frontend"
npm run build

sudo systemctl restart plateforme
sudo systemctl reload nginx

echo ""
echo "=== Vérification ==="
sleep 2
curl -4sI "https://$DOMAIN/" | head -5 || true
echo ""
echo "Site : https://$DOMAIN"
echo ""
echo "Recommandé : supprimez quand même le AAAA dans OVH (2001:41d0:301::29)"
echo "pour éviter des problèmes futurs avec le renouvellement automatique."
