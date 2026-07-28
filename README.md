# QuinList

Gestión de proyectos tipo Kanban enfocada en equipos latinoamericanos. Mejor que Trello: interfaz en español, permisos por rol y notificaciones en tiempo real.

## MVP incluido

- Espacios de trabajo (Workspaces)
- Tableros con listas configurables
- Tarjetas con drag & drop
- Comentarios, etiquetas, prioridad y fecha límite
- Checklist y archivos adjuntos
- Usuarios con permisos (Propietario, Admin, Miembro, Observador)
- Notificaciones en tiempo real (toast + panel)

## Inicio rápido

```sh
npm install --legacy-peer-deps
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) e inicia sesión con uno de los usuarios demo.

### Usuarios demo

| Usuario | Rol | Email |
|---------|-----|-------|
| Alula García | Propietario | alula@quinlist.app |
| Carlos Mendoza | Admin | carlos@quinlist.app |
| Sofía Herrera | Observador | sofia@quinlist.app |

## Stack

- Vue 3 + TypeScript + Vite
- **Tailwind CSS v4** — estilos utilitarios
- **Lucide Icons** (`@lucide/vue`) — iconografía
- **MatuDB** (`@devjuanes/matuclient`) — base de datos, auth y tiempo real
- Pinia (estado)
- Vue Router
- vuedraggable (drag & drop)

## MatuDB (producción)

1. Crea un proyecto en MatuDB y ejecuta el schema en `docs/schema.sql`
2. Copia `.env.example` a `.env` y completa las credenciales:

```env
VITE_MATUDB_URL=http://matudb.com:3001
VITE_MATUDB_PROJECT_ID=tu-project-id
VITE_MATUDB_API_KEY=mb_xxxx
```

> **Importante:** `app.matudb.com` no resuelve en DNS. Usa `http://matudb.com:3001` (cloud) o `http://localhost:3001` (local).

3. Reinicia el servidor de desarrollo (`npm run dev`)
4. Regístrate en `/login` — se creará tu espacio y tablero inicial vacío

Si ves errores de CORS, agrega `http://localhost:5173` en `CORS_ORIGINS` del servidor MatuDB.

Sin `.env`, la app funciona en **modo demo** con localStorage.

## Próximos pasos

- Backend con API REST + WebSockets (Supabase o Node.js)
- Autenticación real (OAuth, email)
- Múltiples tableros por workspace
- Reportes y roadmap
