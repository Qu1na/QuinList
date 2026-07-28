# Almacenamiento de archivos (MatuDB)

QuinList usa **Project Storage** de MatuDB para adjuntos de tarjetas y chat.

## Cómo funciona MatuDB

| Acción | Endpoint | Auth |
|--------|----------|------|
| Subir | `POST /api/projects/{projectId}/storage/upload` | API key o JWT |
| Ver / descargar | `GET /api/projects/{projectId}/storage/{filename}` | **Público** |
| Eliminar | `DELETE /api/projects/{projectId}/storage/{filename}` | API key o JWT |

- El servidor guarda cada archivo con un **nombre UUID** en disco (ej. `a1b2c3d4-e5f6.png`).
- La respuesta del upload incluye la **URL pública** lista para usar en `<img src>` o enlaces.
- No hay carpetas físicas en el storage: la organización lógica va en el campo `original`.

## Estructura lógica en QuinList

```
quinlist/boards/{boardId}/cards/{cardId}/{timestamp}-{nombre}.ext
quinlist/boards/{boardId}/chat/{timestamp}-{nombre}.ext
```

Ejemplo de `original` en MatuDB:

```
quinlist/boards/abc123/cards/def456/1712345678900-informe.pdf
```

## Qué guardamos en la tarjeta (`cards.attachments`)

```json
{
  "id": "local-id",
  "name": "informe.pdf",
  "type": "application/pdf",
  "size": 204800,
  "url": "https://db.matudb.com/api/projects/{projectId}/storage/{uuid}.pdf",
  "storageFilename": "{uuid}.pdf",
  "uploadedAt": "2026-07-27T...",
  "uploadedBy": "user-id"
}
```

- **`url`** — URL pública devuelta por MatuDB al subir. Se usa directamente para ver y descargar.
- **`storageFilename`** — Nombre UUID en el servidor. Se usa para eliminar el archivo.

## Variables de entorno

```env
VITE_MATUDB_URL=https://db.matudb.com
VITE_MATUDB_PROJECT_ID=...
VITE_MATUDB_API_KEY=...
```

## Modo demo (sin MatuDB)

Si no hay MatuDB configurado, los archivos se guardan como **Data URL** en localStorage (solo desarrollo).

## Migración

No se requiere migración SQL. Los adjuntos siguen en `cards.attachments` (JSONB).

Archivos subidos con la versión anterior (rutas con `/` en la URL) pueden no abrirse; vuelve a subirlos para obtener la URL pública correcta.
