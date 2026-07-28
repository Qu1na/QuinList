#!/usr/bin/env bash
# QuinList — instalación en servidor (ejecutar DESDE la carpeta del repo, ej. ~/apps/QuinList)
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "==> Directorio: $APP_DIR"

if [[ ! -f package.json ]]; then
  echo "ERROR: No hay package.json aquí."
  echo "Sube TODO el proyecto (incl. package.json, package-lock.json, src/, public/, deploy/, ecosystem.config.cjs)."
  echo "Ejemplo desde tu PC:"
  echo "  cd ~/apps/QuinList   # o la ruta donde clonaste el repo"
  exit 1
fi

if [[ ! -f .env ]] && [[ -f .env.example ]]; then
  cp .env.example .env
  echo "Creado .env — edítalo con tus VITE_MATUDB_* antes del build."
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "ERROR: Falta .env en el servidor."
  exit 1
fi

if [[ -f .env.production ]]; then
  echo "==> Desactivando .env.production (usamos .env)..."
  mv .env.production .env.production.disabled 2>/dev/null || rm -f .env.production
fi

if [[ ! -f package-lock.json ]]; then
  echo "==> Sin package-lock.json, usando npm install..."
  npm install --legacy-peer-deps
else
  npm ci --legacy-peer-deps
fi

npm run build

if ! command -v pm2 >/dev/null; then
  npm install -g pm2
fi

pm2 delete quinlist 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "OK. App en http://127.0.0.1:3012"
echo "Siguiente: sudo ./deploy.sh --nginx  (o ver docs/deployment.md)"
