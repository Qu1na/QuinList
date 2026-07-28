# Gestión de Proyectos — Documentación de soporte

Módulo independiente de Tableros Kanban en QuinList. Persistencia actual: `localStorage` (`quinlist_projects_data_v2`). Schema SQL en `docs/schema.sql` listo para MatuDB.

## Moneda

| Configuración | Detalle |
|---------------|---------|
| **Por defecto** | Peso colombiano (`COP`) |
| **Dónde configurar** | Configuración del proyecto → Moneda del proyecto |
| **Al crear** | Paso 2 del wizard (junto al presupuesto) |
| **Base de datos** | Columna `currency` en tabla `projects` (default `'COP'`) |
| **Monedas soportadas** | COP, USD, EUR, MXN, ARS, CLP, PEN, BRL, GBP |

Todos los montos usan `formatMoney()` con la moneda del proyecto.

---

## Creación de proyecto

| Requisito | Soporte |
|-----------|---------|
| Presupuesto inicial obligatorio | Wizard 2 pasos en `/projects` → Paso 2 exige monto > 0 |
| Edición posterior del presupuesto | Pestaña **Información** y **Finanzas → Ajustar presupuesto base** |
| Meta de rentabilidad | Opcional al crear; editable en Información y Finanzas |

**Fórmula de saldo:** `Saldo = Presupuesto base + Ingresos − Egresos`

---

## Módulos y funcionalidades

### Dashboard
- Avance % (tareas completadas / total)
- KPIs: estado, tareas pendientes/completadas
- Accesos rápidos a hitos, riesgos, tareas, finanzas
- Próximos vencimientos y actividad reciente

### Información general
- CRUD completo: nombre, descripción, cliente, responsable, prioridad, estado, categoría, etiquetas, fechas
- Presupuesto inicial y meta de rentabilidad

### Tareas
- Vistas: Lista, Kanban (drag & drop), Cronograma
- Panel lateral de edición (título, descripción, estado, prioridad, fechas)
- Búsqueda y filtro por estado
- **Abrir en Tablero**: crea/vincula tarjeta Kanban sin modificar el módulo de tableros

### Cronograma (Gantt)
- Escala mensual, línea de hoy, colores por estado
- Barras por fechas de inicio/fin de tareas

### Finanzas (Caja del proyecto)
| Función | Descripción |
|---------|-------------|
| Cuenta del proyecto | Tarjeta estilo banco con saldo, presupuesto base y flujo neto |
| Ingresos / Egresos | Movimientos con categoría, método de pago, referencia/comprobante, notas |
| Libro mayor | Tabla con saldo acumulado (running balance) por movimiento |
| Flujo de caja | Gráfico mensual (ingresos − egresos) |
| Por categoría | Desglose de egresos (donut + tabla) |
| KPIs | Ingresos, egresos, % consumo presupuesto, rentabilidad |

**Categorías predefinidas:**
- Ingresos: Anticipo cliente, Facturación, Hito completado, Reembolso, Otros
- Egresos: Personal, Herramientas, Servicios, Infraestructura, Marketing, Viajes, Otros

**Métodos de pago:** Transferencia, Efectivo, Tarjeta, Factura, Cheque, Otro

### Hitos
- Timeline visual con progreso %
- Crear con fecha de vencimiento
- Editar título, descripción, fecha
- Marcar completado / eliminar

### Equipo
- Añadir miembros del workspace
- Roles: Propietario, Administrador, Miembro, Observador
- Permisos granulares: Tareas, Finanzas, Equipo
- Edición y eliminación de miembros

### Entregables
- Tabla con responsable, hito vinculado, fecha, estado
- Flujo de estados: Pendiente → En progreso → Entregado → Aprobado
- Crear y eliminar

### Riesgos e incidencias
- Tipos: Riesgo / Incidencia
- Severidad: Baja, Media, Alta, Crítica
- Estados: Abierto, Mitigado, Cerrado
- Plan de mitigación y responsable
- KPIs de riesgos abiertos y críticos

### Documentación
- Documentos con título, contenido y categoría
- Crear, editar y eliminar

### Centro de archivos
- Agrega adjuntos de tareas y documentos
- Búsqueda y filtro por fuente
- Vista previa de imágenes, ver y descargar

### Actividad
- Historial cronológico de todas las acciones del proyecto

### Reportes
- Gráficos por estado y prioridad de tareas
- Resumen financiero integrado

### Configuración
- Tablero Kanban vinculado
- Rentabilidad objetivo
- Eliminar proyecto (zona de peligro)

---

## Avance automático

```
Avance % = (tareas con status "done" / total tareas) × 100
```

---

## Integración con Kanban

- Campo `project.boardId` — tablero vinculado al proyecto
- Campo `task.boardCardId` — tarjeta vinculada a tarea
- Al usar "Abrir en Tablero": crea tablero con listas por defecto si no existe, crea tarjeta y abre el modal

---

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `src/types/projects.ts` | Tipos del dominio |
| `src/stores/projects.ts` | Store Pinia (CRUD) |
| `src/utils/projectFinance.ts` | Lógica financiera (libro mayor, flujo) |
| `src/utils/projectStats.ts` | Avance, vencimientos, archivos |
| `src/services/projectData.ts` | Persistencia + migración v1→v2 |
| `src/components/projects/tabs/*` | UI de cada módulo |
| `docs/schema.sql` | Tablas MatuDB |

---

## Migración de datos

Al cargar, `projectData.ts` migra automáticamente:
- `quinlist_projects_data` → `quinlist_projects_data_v2`
- Costos sin `type` → `expense`
- Campos nuevos con valores por defecto

---

## Próximo paso (MatuDB)

Ejecutar las sentencias `ALTER TABLE` y tablas de `docs/schema.sql` en MatuDB, luego conectar `projectData.ts` siguiendo el patrón de `matuData.ts`.
