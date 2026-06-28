#!/bin/bash
# Diagnostic HTTPS depuis le VPS ou en local (curl requis)
DOMAIN="${1:-toghinis.net}"
VPS_IP="${2:-144.217.82.132}"

echo "=== DNS ==="
echo -n "$DOMAIN A     : "; dig +short "$DOMAIN" A | tr '\n' ' '; echo
echo -n "www.$DOMAIN A : "; dig +short "www.$DOMAIN" A | tr '\n' ' '; echo
echo -n "$DOMAIN AAAA  : "; dig +short "$DOMAIN" AAAA | tr '\n' ' '; echo
echo "Attendu A : $VPS_IP"

echo ""
echo "=== Ports (depuis cette machine) ==="
for url in "http://$DOMAIN/" "https://$DOMAIN/" "http://$VPS_IP/" "https://$VPS_IP/"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "ERR")
  echo "$url → HTTP $code"
done

echo ""
echo "=== Nginx (sur le VPS uniquement) ==="
if [ -f /etc/nginx/sites-available/plateforme ]; then
  grep -E 'listen |server_name |ssl_certificate' /etc/nginx/sites-available/plateforme || true
  sudo nginx -t 2>&1 || true
else
  echo "(fichier /etc/nginx/sites-available/plateforme absent — pas sur le VPS ?)"
fi

echo ""
echo "=== Certbot (sur le VPS uniquement) ==="
if command -v certbot >/dev/null; then
  sudo certbot certificates 2>/dev/null | head -20 || true
else
  echo "certbot non installé"
fi

echo ""
echo "=== Frontend API URL (sur le VPS) ==="
if [ -f /var/www/plateforme/frontend/.env.production ]; then
  cat /var/www/plateforme/frontend/.env.production
else
  echo ".env.production absent"
fi
