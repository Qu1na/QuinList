#!/usr/bin/env bash
# QuinList — despliegue en producción (ejecutar en el servidor, desde la raíz del repo)
#
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh              # actualizar: git pull + build + pm2 restart
#   ./deploy.sh --setup      # primera vez (deps, build, pm2 start)
#   ./deploy.sh --no-pull    # build sin git pull
#   sudo ./deploy.sh --nginx # instalar site nginx (HTTP)
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

APP_NAME="quinlist"
APP_PORT="3012"
DOMAIN="quinlist.matubyte.com"

DO_PULL=true
DO_SETUP=false
DO_NGINX=false

usage() {
  cat <<EOF
QuinList — deploy

  ./deploy.sh              Actualizar app (git pull + build + pm2 restart)
  ./deploy.sh --setup      Primera instalación (crea .env, deps, build, pm2)
  ./deploy.sh --no-pull    Build y reinicio sin git pull
  sudo ./deploy.sh --nginx Instalar config nginx HTTP (proxy → :${APP_PORT})

Después del primer deploy con HTTP:
  sudo certbot --nginx -d ${DOMAIN}
  sudo cp deploy/nginx-quinlist.matubyte.com.conf /etc/nginx/sites-available/${DOMAIN}
  sudo nginx -t && sudo systemctl reload nginx
EOF
}

for arg in "$@"; do
  case "$arg" in
    --setup) DO_SETUP=true ;;
    --no-pull) DO_PULL=false ;;
    --nginx) DO_NGINX=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $arg"; usage; exit 1 ;;
  esac
done

require_package_json() {
  if [[ ! -f package.json ]]; then
    echo "ERROR: No hay package.json en $APP_DIR"
    echo "Clona o sube el proyecto completo antes de desplegar."
    exit 1
  fi
}

ensure_env() {
  if [[ ! -f .env.production ]]; then
    if [[ -f .env.production.example ]]; then
      cp .env.production.example .env.production
      echo "Creado .env.production desde el ejemplo."
      echo "Edita VITE_MATUDB_* y vuelve a ejecutar deploy."
      exit 1
    fi
    echo "ERROR: Falta .env.production (copia .env.production.example)."
    exit 1
  fi
}

install_deps() {
  if [[ ! -f package-lock.json ]]; then
    echo "==> Sin package-lock.json, usando npm install..."
    npm install --legacy-peer-deps
  else
    echo "==> npm ci..."
    npm ci --legacy-peer-deps
  fi
}

build_app() {
  echo "==> Build de producción..."
  npm run build
}

ensure_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "==> Instalando PM2..."
    npm install -g pm2
  fi
}

start_pm2() {
  ensure_pm2
  echo "==> PM2 start ${APP_NAME}..."
  pm2 delete "$APP_NAME" 2>/dev/null || true
  pm2 start ecosystem.config.cjs
  pm2 save
}

restart_pm2() {
  ensure_pm2
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    echo "==> PM2 restart ${APP_NAME}..."
    pm2 restart "$APP_NAME"
  else
    echo "==> PM2 no encontró ${APP_NAME}, iniciando..."
    pm2 start ecosystem.config.cjs
    pm2 save
  fi
}

verify_local() {
  echo "==> Verificando http://127.0.0.1:${APP_PORT}..."
  if curl -sf -o /dev/null -I "http://127.0.0.1:${APP_PORT}"; then
    echo "OK — app respondiendo en puerto ${APP_PORT}"
  else
    echo "AVISO: no hubo respuesta en :${APP_PORT}. Revisa: pm2 logs ${APP_NAME}"
  fi
}

install_nginx() {
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "ERROR: --nginx requiere sudo."
    exit 1
  fi
  bash "$APP_DIR/scripts/install-nginx-quinlist.sh"
}

git_pull() {
  if [[ -d .git ]] && command -v git >/dev/null 2>&1; then
    echo "==> git pull..."
    git pull --ff-only
  else
    echo "==> Sin repo git, omitiendo pull."
  fi
}

# --- Nginx only ---
if $DO_NGINX; then
  install_nginx
  exit 0
fi

require_package_json
ensure_env

if $DO_SETUP; then
  echo "==> Setup inicial QuinList en $APP_DIR"
  install_deps
  build_app
  start_pm2
  verify_local
  echo ""
  echo "Setup listo. Siguiente paso:"
  echo "  sudo ./deploy.sh --nginx"
  echo "  sudo certbot --nginx -d ${DOMAIN}"
  exit 0
fi

# --- Deploy / update ---
echo "==> Deploy QuinList en $APP_DIR"

if $DO_PULL; then
  git_pull
fi

install_deps
build_app
restart_pm2
verify_local

echo ""
echo "Deploy completado — https://${DOMAIN}"
