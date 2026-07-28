# Despliegue — QuinList en quinlist.matubyte.com

Stack: **Vue 3 + Vite** (SPA) · **PM2** (sirve `dist/`) · **Nginx** (proxy + SSL)

## Requisitos en el servidor

- Ubuntu 22.04+ (o similar)
- Node.js **22+** (`node -v`)
- Nginx
- PM2 (`npm i -g pm2`)
- Git (opcional)

> **Importante:** los comandos se ejecutan **desde la carpeta del repo clonado** (ej. `~/apps/QuinList`), no desde `/var/www/quinlist` salvo que hayas clonado ahí. Debe existir `package.json`, `package-lock.json`, `src/`, `public/`, `ecosystem.config.cjs` y `deploy/`.

## Subir el código completo (desde tu PC)

```bash
# Opción A — rsync (recomendado)
rsync -avz --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  ./ root@TU_IP:/var/www/quinlist/

# Opción B — git en el servidor
cd /var/www/quinlist
git clone <url-del-repo> .
```

Comprueba en el servidor:

```bash
ls -la /var/www/quinlist/package.json
ls -la /var/www/quinlist/package-lock.json
ls -la /var/www/quinlist/ecosystem.config.cjs
```

## Instalación rápida (en el servidor)

```bash
# Ruta real del clone (ajusta si es distinta)
cd ~/apps/QuinList

chmod +x scripts/server-setup.sh scripts/install-nginx-quinlist.sh

# 1. Crear .env con tus VITE_MATUDB_*
cp .env.example .env
nano .env

# 2. Build + PM2
./scripts/server-setup.sh

# 3. Nginx (HTTP)
sudo ./scripts/install-nginx-quinlist.sh

# 4. SSL (cuando HTTP funcione)
sudo certbot --nginx -d quinlist.matubyte.com
```

En tu panel de dominio (`matubyte.com`), crea un registro **A**:

| Tipo | Nombre     | Valor        |
|------|------------|--------------|
| A    | quinlist   | IP del VPS   |

Espera propagación (5–30 min). Prueba: `ping quinlist.matubyte.com`

## 2. Subir el proyecto

```bash
sudo mkdir -p /var/www/quinlist
sudo chown -R $USER:$USER /var/www/quinlist
cd /var/www/quinlist

# Si usas git:
git clone <tu-repo> .
# O sube los archivos por SFTP/SCP a esta carpeta
```

## 3. Variables de entorno y build

```bash
cd /var/www/quinlist
cp .env.example .env
nano .env   # pegar VITE_MATUDB_* reales

npm ci
npm run build
```

> **Importante:** `VITE_*` se compilan en el build. En el servidor usamos **`.env`** (no `.env.production`). Si cambias `.env`, vuelve a ejecutar `npm run build` o `./deploy.sh`.

## 4. PM2

```bash
cd /var/www/quinlist
npm install serve --save

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # sigue las instrucciones que imprime (systemd)
```

Comprobar localmente en el servidor:

```bash
curl -I http://127.0.0.1:3012
```

## 5. Nginx

### Opción A — Solo HTTP (prueba rápida)

```bash
sudo cp deploy/nginx-quinlist-http-only.conf /etc/nginx/sites-available/quinlist.matubyte.com
sudo ln -sf /etc/nginx/sites-available/quinlist.matubyte.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Opción B — HTTPS con Let's Encrypt (recomendado)

1. Primero usa HTTP-only o deja el bloque 80 con `acme-challenge`.
2. Instala certbot:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d quinlist.matubyte.com
```

3. Copia la config completa con SSL:

```bash
sudo cp deploy/nginx-quinlist.matubyte.com.conf /etc/nginx/sites-available/quinlist.matubyte.com
sudo nginx -t && sudo systemctl reload nginx
```

Abre: **https://quinlist.matubyte.com**

## 6. Actualizar después de cambios

```bash
cd ~/apps/QuinList
./deploy.sh
```

O sin `git pull` (si subiste archivos por rsync):

```bash
./deploy.sh --no-pull
```

### Primera instalación (todo en uno)

```bash
cd ~/apps/QuinList
chmod +x deploy.sh
cp .env.example .env   # editar VITE_MATUDB_*
./deploy.sh --setup
sudo ./deploy.sh --nginx
sudo certbot --nginx -d quinlist.matubyte.com
```

## Comandos útiles

| Acción              | Comando                    |
|---------------------|----------------------------|
| Ver logs PM2        | `pm2 logs quinlist`        |
| Estado              | `pm2 status`               |
| Reiniciar app       | `pm2 restart quinlist`     |
| Probar nginx        | `sudo nginx -t`            |
| Recargar nginx      | `sudo systemctl reload nginx` |

## Notas

- El puerto **3012** es solo interno (localhost); Nginx es la cara pública (80/443).
- Vue Router usa `history` mode: PM2 `serve -s` y Nginx proxy ya envían todo a `index.html`.
- No subas `.env` con claves al repositorio; créalo solo en el servidor.
- Módulo de proyectos: controlado en `src/config/features.ts` (`PROJECTS_MODULE_ENABLED`).

## Alternativa: Nginx sirve estáticos sin PM2

Si prefieres solo Nginx (sin Node en runtime), en el `location /` del server HTTPS:

```nginx
root /var/www/quinlist/dist;
try_files $uri $uri/ /index.html;
```

En ese caso no necesitas PM2; el build se despliega directamente en `dist/`.

## Solución de problemas

### `ENOENT package.json` / `ecosystem.config.cjs not found`

Estás en el directorio equivocado (ej. `/var/www/quinlist` vacío). Ve al clone:

```bash
cd ~/apps/QuinList
ls package.json
```

### `npm ci` sin lockfile

```bash
npm install --legacy-peer-deps && npm run build
```

### Nginx roto (`sites-enabled/quinlist... No such file`)

```bash
sudo rm -f /etc/nginx/sites-enabled/quinlist.matubyte.com
sudo nginx -t && sudo systemctl reload nginx
```

Luego: `sudo ./scripts/install-nginx-quinlist.sh` (con el repo completo en el servidor).

### PM2 `quinlist not found`

```bash
cd ~/apps/QuinList && pm2 start ecosystem.config.cjs && pm2 save
```
