# QuinList — Arquitectura de datos y sincronización

## Principios

1. **MatuDB es la única fuente de verdad** cuando `VITE_MATUDB_*` está configurado.
2. **Realtime incremental** — nunca recargar datasets completos por un evento de una fila.
3. **Sin polling, sin auto-refresh, sin `setTimeout` para simular carga.**
4. **Los modales solo se cierran por acción del usuario** — no por re-renders ni realtime.
5. **Los toasts son pasivos** — no mutan estado global ni cierran UI.

## Flujo de datos

```
MatuDB (postgres_changes)
        ↓
  normalizeRealtimePayload()
        ↓
  applyRealtimePayload()  ← compara updated_at (no sobrescribe estado más nuevo)
        ↓
  Pinia stores (única copia en memoria)
        ↓
  Vue components (computed, sin copias duplicadas)
```

## Módulos

| Módulo | Store | Realtime | Persistencia |
|--------|-------|----------|--------------|
| Tableros | `quinlist` | `cards`, `lists` → parcial; estructural → debounced reload | MatuDB |
| Proyectos | `projects` | `subscribeWorkspaceProjectsRealtime` incremental | MatuDB |
| Notificaciones | `notifications` | Propio (no vía quinlist) | MatuDB |
| Chat tablero | `boardChat` | Propio | MatuDB |
| Presencia | `boardPresence` / `projectPresence` | Propio | MatuDB |

## Qué NO hacer

- ❌ `reloadFromDb()` en cada evento realtime de presence/chat/notifications
- ❌ `localStorage` como backup en modo Matu (solo demo offline)
- ❌ `restoreSnapshot()` cuando el guardado en servidor fue exitoso
- ❌ `subscribeProjectsRealtime` con callback de reload completo
- ❌ Duplicar canales realtime para la misma tabla

## Escrituras locales

1. Mutación optimista en Pinia
2. `saveNow()` → `syncProjectToMatu` / `saveRecord` (upsert, sin deleteOrphans rutinario)
3. Suprimir eco realtime propio 4s (`suppressRealtime`)
4. Borrados explícitos con `deleteProjectEntity`

## Modales

- `ui.activeModal` — modales globales (crear tablero, confirm, etc.)
- `ui.selectedCardId` — CardModal usa snapshot congelado si el card desaparece temporalmente del store
- Modales de proyecto — estado local `showModal` en cada tab

## Indicadores del dashboard

Todos los KPIs se calculan desde `projects` store (`projectStats.ts`) — nunca valores hardcodeados.

## Modo demo (sin Matu)

`localStorage` + `SEED_DATA` solo cuando `!isMatuConfigured()`.
