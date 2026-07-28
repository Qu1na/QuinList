#!/usr/bin/env bash
# Instala site nginx para quinlist (HTTP). Ejecutar con sudo.
set -euo pipefail

SITE_NAME="quinlist.matubyte.com"
CONF_SRC="$(cd "$(dirname "$0")/.." && pwd)/deploy/nginx-quinlist-http-only.conf"
CONF_DST="/etc/nginx/sites-available/${SITE_NAME}"

if [[ ! -f "$CONF_SRC" ]]; then
  echo "ERROR: No se encuentra $CONF_SRC"
  echo "Asegúrate de haber subido la carpeta deploy/ al servidor."
  exit 1
fi

# Quitar enlace roto si existe
rm -f "/etc/nginx/sites-enabled/${SITE_NAME}"

cp "$CONF_SRC" "$CONF_DST"
ln -sf "$CONF_DST" "/etc/nginx/sites-enabled/${SITE_NAME}"

nginx -t
systemctl reload nginx

echo "Nginx OK para ${SITE_NAME} (HTTP → puerto 3012)"
