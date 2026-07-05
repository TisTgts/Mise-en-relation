#!/bin/bash
# Active HTTPS (Let's Encrypt) + met à jour CORS et le build React.
# À lancer sur le VPS : cd /var/www/plateforme && bash deploy/ovh/setup-https.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/plateforme-com}"
DOMAIN="${DOMAIN:-toghinis.com}"
WWW_DOMAIN="www.${DOMAIN}"
VPS_IP="${VPS_IP:-144.217.82.132}"
CERT_NAME="${CERT_NAME:-$DOMAIN}"
NGINX_SITE="${NGINX_SITE:-plateforme-com}"
SERVICE="${SERVICE:-plateforme-com}"
CHALLENGE_DIR="$APP_DIR/certbot/.well-known/acme-challenge"

cd "$APP_DIR"

echo "=== Diagnostic rapide ==="
echo "Domaine : $DOMAIN"
echo "IP VPS  : $VPS_IP"

if ! command -v nginx >/dev/null; then
  echo "ERREUR: nginx absent. Installez-le d'abord (deploy/ovh/setup-vps.sh)."
  exit 1
fi

RESOLVED_IP="$(dig +short "$DOMAIN" A 2>/dev/null | tail -1 || true)"
if [ -n "$RESOLVED_IP" ] && [ "$RESOLVED_IP" != "$VPS_IP" ]; then
  echo "ERREUR: $DOMAIN pointe vers $RESOLVED_IP (attendu $VPS_IP)."
  echo "Corrigez la zone DNS OVH avant de continuer."
  exit 1
fi

AAAA_RECORD="$(dig +short "$DOMAIN" AAAA 2>/dev/null | head -1 || true)"
if [ -n "$AAAA_RECORD" ]; then
  echo ""
  echo "ERREUR: enregistrement AAAA actif ($AAAA_RECORD)."
  echo "Let's Encrypt peut valider via IPv6 et recevoir une mauvaise réponse (parking OVH)."
  echo "Supprimez les entrées AAAA pour @ et www dans OVH → Zone DNS, attendez 5 min, relancez."
  echo ""
  exit 1
fi

echo "=== Pare-feu (port 443) ==="
if command -v ufw >/dev/null; then
  sudo ufw allow 'Nginx Full' || true
fi

echo "=== Préparation certbot webroot ==="
sudo rm -rf "$CHALLENGE_DIR"
sudo mkdir -p "$CHALLENGE_DIR"
sudo chown -R ubuntu:ubuntu "$APP_DIR/certbot"

echo "=== Nginx HTTP (défi ACME) ==="
sudo cp "$APP_DIR/deploy/ovh/nginx-serviceconnect.conf" /etc/nginx/sites-available/$NGINX_SITE
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/$NGINX_SITE
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "=== Test défi ACME (avant certbot) ==="
TEST_FILE="preflight-$(date +%s)"
echo "ok-acme-test" > "$CHALLENGE_DIR/$TEST_FILE"
LOCAL="$(curl -fsS "http://127.0.0.1/.well-known/acme-challenge/$TEST_FILE" -H "Host: $DOMAIN" || true)"
REMOTE4="$(curl -4fsS "http://$DOMAIN/.well-known/acme-challenge/$TEST_FILE" || true)"
rm -f "$CHALLENGE_DIR/$TEST_FILE"

if [ "$LOCAL" != "ok-acme-test" ] || [ "$REMOTE4" != "ok-acme-test" ]; then
  echo "ERREUR: Nginx ne sert pas correctement /.well-known/acme-challenge/"
  echo "  local  : '$LOCAL'"
  echo "  distant: '$REMOTE4'"
  echo "Vérifiez /etc/nginx/sites-available/$NGINX_SITE"
  exit 1
fi
echo "Test ACME OK (IPv4)"

request_certificate() {
  sudo certbot certonly --webroot \
    -w "$APP_DIR/certbot" \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email
}

request_certificate_standalone() {
  echo "=== Fallback : certbot standalone (arrêt nginx temporaire) ==="
  sudo systemctl stop nginx
  sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email
  sudo systemctl start nginx
}

echo "=== Certificat Let's Encrypt ==="
sudo apt-get install -y certbot

if [ ! -f "/etc/letsencrypt/live/$CERT_NAME/fullchain.pem" ]; then
  sudo rm -rf "$CHALLENGE_DIR"/*
  sudo mkdir -p "$CHALLENGE_DIR"
  sudo chown -R ubuntu:ubuntu "$APP_DIR/certbot"

  if ! request_certificate; then
    echo "Webroot échoué — nouvel essai en mode standalone..."
    request_certificate_standalone || {
      echo "ERREUR certbot. Consultez : sudo tail -30 /var/log/letsencrypt/letsencrypt.log"
      exit 1
    }
  fi
else
  echo "Certificat déjà présent : /etc/letsencrypt/live/$CERT_NAME/"
  sudo certbot renew --dry-run || true
fi

if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  sudo certbot install --cert-name "$CERT_NAME" --nginx || true
fi
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

echo "=== Nginx HTTPS ==="
SSL_CONF="$APP_DIR/deploy/ovh/nginx-serviceconnect-ssl.conf"
if [ ! -f "$SSL_CONF" ]; then
  echo "ERREUR: $SSL_CONF introuvable."
  exit 1
fi
sudo cp "$SSL_CONF" /etc/nginx/sites-available/$NGINX_SITE
sudo sed -i "s/toghinis.com/$DOMAIN/g" /etc/nginx/sites-available/$NGINX_SITE
sudo sed -i "s/144.217.82.132/$VPS_IP/g" /etc/nginx/sites-available/$NGINX_SITE
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/$NGINX_SITE
sudo nginx -t
sudo systemctl reload nginx

echo "=== Backend .env (CORS HTTPS) ==="
ENV_FILE="$APP_DIR/backend/.env"
if [ -f "$ENV_FILE" ]; then
  CORS_HTTPS="https://$DOMAIN,https://$WWW_DOMAIN,http://$VPS_IP"
  if grep -q '^CORS_ALLOWED_ORIGINS=' "$ENV_FILE"; then
    sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=$CORS_HTTPS|" "$ENV_FILE"
  else
    echo "CORS_ALLOWED_ORIGINS=$CORS_HTTPS" >> "$ENV_FILE"
  fi
  if grep -q '^CORS_ALLOW_ALL_ORIGINS=' "$ENV_FILE"; then
    sed -i 's|^CORS_ALLOW_ALL_ORIGINS=.*|CORS_ALLOW_ALL_ORIGINS=False|' "$ENV_FILE"
  fi
  echo "CORS_ALLOWED_ORIGINS=$CORS_HTTPS"
else
  echo "ATTENTION: $ENV_FILE absent — configurez CORS manuellement."
fi

echo "=== Frontend .env.production ==="
echo "REACT_APP_API_URL=https://$DOMAIN/api" > "$APP_DIR/frontend/.env.production"
cat "$APP_DIR/frontend/.env.production"

echo "=== Build React + redémarrage ==="
cd "$APP_DIR/frontend"
npm ci
npm run build

sudo systemctl restart "$SERVICE"
sudo systemctl reload nginx

echo "=== Vérification ==="
sleep 2
curl -4sI "https://$DOMAIN/" | head -5 || true
curl -4sI "https://$DOMAIN/api/services/categories/" | head -5 || true

echo ""
echo "=== HTTPS activé ==="
echo "  Site : https://$DOMAIN"
echo "  API  : https://$DOMAIN/api/"
