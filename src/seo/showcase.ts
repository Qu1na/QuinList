/**
 * Contenido visual de las 12 páginas de solución (menú “Soluciones” y página de cada una).
 *
 * Complementa src/seo/marketing.ts: aquí van el ícono, la descripción corta del menú, la
 * ilustración del producto, los datos clave y las funciones específicas de cada solución.
 * Igual que en marketing.ts: solo funciones que QuinList tiene de verdad.
 */

export type IconName =
  | 'FolderKanban'
  | 'LayoutGrid'
  | 'SquareChartGantt'
  | 'Wallet'
  | 'Bot'
  | 'ListChecks'
  | 'Workflow'
  | 'Briefcase'
  | 'HardHat'
  | 'Store'
  | 'CodeXml'
  | 'Globe'
  | 'Users'
  | 'CalendarDays'
  | 'Bell'
  | 'Shield'
  | 'Paperclip'
  | 'MessagesSquare'
  | 'Target'
  | 'TriangleAlert'
  | 'ChartColumn'
  | 'Clock'
  | 'Tags'
  | 'Link2'
  | 'Share2'
  | 'FileText'
  | 'Coins'
  | 'ChartPie'
  | 'TrendingUp'
  | 'Sparkles'
  | 'Zap'
  | 'Webhook'
  | 'Layers'
  | 'Flag'
  | 'Eye'
  | 'Smartphone'
  | 'Radio'
  | 'QrCode'
  | 'Rocket'
  | 'Bug'
  | 'Receipt'
  | 'Gauge'
  | 'Download'
  | 'Lock'
  | 'Milestone'
  | 'Lightbulb'
  | 'Camera'
  | 'Building2'
  | 'Timer'
  | 'ListFilter'

export type VisualKind =
  | 'dashboard'
  | 'kanban'
  | 'gantt'
  | 'finance'
  | 'ai'
  | 'tasks'
  | 'automation'
  | 'clients'
  | 'risks'
  | 'chat'

/** Paleta de acento por solución (solo decorativa: íconos y fondos suaves). */
export type Accent = 'coral' | 'sky' | 'emerald' | 'violet' | 'amber' | 'rose'

export interface Showcase {
  icon: IconName
  /** Descripción del menú: máximo ~55 caracteres. */
  menuDesc: string
  accent: Accent
  visual: VisualKind
  visualLabel: string
  facts: { value: string; label: string }[]
  featuresTitle: string
  features: { icon: IconName; title: string; text: string }[]
  idealFor: string[]
}

export const showcaseByPath: Record<string, Showcase> = {
  '/software-gestion-de-proyectos': {
    icon: 'FolderKanban',
    menuDesc: 'Tareas, cronograma, dinero y equipo juntos',
    accent: 'coral',
    visual: 'dashboard',
    visualLabel: 'Dashboard de un proyecto en QuinList con avance, tareas pendientes y próximos vencimientos',
    facts: [
      { value: '16', label: 'módulos por proyecto' },
      { value: '3', label: 'vistas: lista, Kanban y Gantt' },
      { value: '9', label: 'monedas para el presupuesto' },
      { value: '0 USD', label: 'para empezar' },
    ],
    featuresTitle: 'Un proyecto completo, no solo una lista de tareas',
    features: [
      { icon: 'Gauge', title: 'Dashboard de avance', text: 'Porcentaje de avance, tareas pendientes y próximos vencimientos al abrir el proyecto.' },
      { icon: 'SquareChartGantt', title: 'Lista, Kanban y Gantt', text: 'Las mismas tareas en tres vistas. Cada persona trabaja como le sirve.' },
      { icon: 'Milestone', title: 'Hitos y entregables', text: 'Puntos de control con fecha y entregables con flujo de aprobación.' },
      { icon: 'TriangleAlert', title: 'Riesgos e incidencias', text: 'Severidad, responsable y plan de mitigación antes de que el problema crezca.' },
      { icon: 'Wallet', title: 'Finanzas del proyecto', text: 'Presupuesto, ingresos, egresos, flujo de caja y rentabilidad.' },
      { icon: 'FileText', title: 'Documentos y archivos', text: 'Documentación, centro de archivos y actividad de todo el proyecto.' },
    ],
    idealFor: ['Pymes', 'Agencias', 'Constructoras', 'Consultoras', 'Equipos de tecnología'],
  },
  '/tablero-kanban-online': {
    icon: 'LayoutGrid',
    menuDesc: 'Arrastra tarjetas y mira el trabajo en vivo',
    accent: 'sky',
    visual: 'kanban',
    visualLabel: 'Tablero Kanban de QuinList con columnas Por hacer, En curso y Hecho',
    facts: [
      { value: '1', label: 'tablero gratis para siempre' },
      { value: '∞', label: 'tableros en VIP' },
      { value: 'Live', label: 'cambios en tiempo real' },
      { value: 'QR', label: 'invitación por enlace o código' },
    ],
    featuresTitle: 'Todo lo que una tarjeta necesita',
    features: [
      { icon: 'Users', title: 'Responsables', text: 'Cada tarjeta con dueño claro para que nada quede en el aire.' },
      { icon: 'Clock', title: 'Fechas y prioridad', text: 'Fecha límite y nivel de prioridad visibles en el tablero.' },
      { icon: 'ListChecks', title: 'Checklist', text: 'Divide la tarjeta en pasos y marca el avance.' },
      { icon: 'Tags', title: 'Etiquetas', text: 'Clasifica por área, cliente o tipo de trabajo.' },
      { icon: 'MessagesSquare', title: 'Comentarios y menciones', text: 'La conversación queda dentro de la tarjeta, no en WhatsApp.' },
      { icon: 'Paperclip', title: 'Adjuntos', text: 'Documentos e imágenes donde se necesitan.' },
    ],
    idealFor: ['Marketing', 'Ventas', 'Soporte', 'Desarrollo', 'Operaciones'],
  },
  '/diagrama-de-gantt-online': {
    icon: 'SquareChartGantt',
    menuDesc: 'Cronogramas que se actualizan solos',
    accent: 'violet',
    visual: 'gantt',
    visualLabel: 'Diagrama de Gantt de QuinList con tareas en barras, hitos y línea de hoy',
    facts: [
      { value: '0', label: 'barras dibujadas a mano' },
      { value: 'Hoy', label: 'línea para ver atrasos' },
      { value: '3', label: 'vistas de la misma tarea' },
      { value: '%', label: 'avance por hito' },
    ],
    featuresTitle: 'Un cronograma vivo, conectado al trabajo real',
    features: [
      { icon: 'SquareChartGantt', title: 'Barras automáticas', text: 'Salen de la fecha de inicio y fin de cada tarea.' },
      { icon: 'Flag', title: 'Línea de hoy', text: 'Ves de inmediato qué va atrasado respecto a la fecha actual.' },
      { icon: 'Layers', title: 'Colores por estado', text: 'Pendiente, en curso y completada se distinguen sin leer.' },
      { icon: 'Milestone', title: 'Hitos con progreso', text: 'Puntos de control con fecha y porcentaje de avance.' },
      { icon: 'CalendarDays', title: 'Escala mensual', text: 'Una vista clara para proyectos de semanas o de meses.' },
      { icon: 'LayoutGrid', title: 'Conectado al Kanban', text: 'Mueves una tarea en el tablero y el cronograma lo refleja.' },
    ],
    idealFor: ['Obras', 'Lanzamientos', 'Eventos', 'Implementaciones', 'Consultorías'],
  },
  '/control-de-presupuesto-de-proyectos': {
    icon: 'Wallet',
    menuDesc: 'Ingresos, gastos, flujo de caja y rentabilidad',
    accent: 'emerald',
    visual: 'finance',
    visualLabel: 'Módulo de finanzas de un proyecto en QuinList con saldo, presupuesto y movimientos',
    facts: [
      { value: '9', label: 'monedas por proyecto' },
      { value: '7', label: 'categorías de egreso' },
      { value: '5', label: 'tipos de ingreso' },
      { value: '0', label: 'fórmulas de Excel' },
    ],
    featuresTitle: 'La caja de cada proyecto, al día',
    features: [
      { icon: 'Coins', title: 'Presupuesto base', text: 'Defínelo al crear el proyecto, en la moneda de tu cliente.' },
      { icon: 'Receipt', title: 'Ingresos y egresos', text: 'Con categoría, método de pago, comprobante y notas.' },
      { icon: 'FileText', title: 'Libro mayor', text: 'Saldo acumulado movimiento por movimiento.' },
      { icon: 'ChartColumn', title: 'Flujo de caja mensual', text: 'Gráfico de ingresos menos egresos mes a mes.' },
      { icon: 'ChartPie', title: 'Gastos por categoría', text: 'Personal, herramientas, servicios, marketing, viajes y más.' },
      { icon: 'TrendingUp', title: 'Rentabilidad', text: 'Compárala contra tu meta mientras el proyecto avanza.' },
    ],
    idealFor: ['Agencias', 'Constructoras', 'Consultoras', 'Software a la medida', 'Eventos'],
  },
  '/gestion-de-proyectos-con-ia': {
    icon: 'Bot',
    menuDesc: 'Un asistente que conoce tus proyectos',
    accent: 'violet',
    visual: 'ai',
    visualLabel: 'Asistente de IA de QuinList respondiendo qué tareas están atrasadas',
    facts: [
      { value: '1 clic', label: 'sin copiar ni pegar contexto' },
      { value: 'Contexto', label: 'de tus tableros y proyectos' },
      { value: 'VIP', label: 'incluido en el plan' },
      { value: '15 USD', label: 'al mes, todo incluido' },
    ],
    featuresTitle: 'Pregúntale lo que le preguntarías a tu PM',
    features: [
      { icon: 'TriangleAlert', title: 'Detecta atrasos', text: '“¿Qué está atrasado esta semana?”' },
      { icon: 'Target', title: 'Prioriza', text: '“¿En qué debería enfocarse el equipo hoy?”' },
      { icon: 'FileText', title: 'Resume el avance', text: '“Resume el proyecto para enviárselo al cliente.”' },
      { icon: 'ListChecks', title: 'Divide tareas', text: '“Parte esta tarea grande en pasos.”' },
      { icon: 'Sparkles', title: 'Redacta', text: '“Escribe la descripción de esta tarjeta.”' },
      { icon: 'Lock', title: 'Contexto acotado', text: 'Solo usa el resumen del espacio de trabajo en el que estás.' },
    ],
    idealFor: ['Gerentes de proyecto', 'Dueños de pyme', 'Líderes de equipo', 'Consultores'],
  },
  '/software-gestion-de-tareas': {
    icon: 'ListChecks',
    menuDesc: 'Responsables, fechas y avisos automáticos',
    accent: 'sky',
    visual: 'tasks',
    visualLabel: 'Lista de tareas en QuinList con responsables, fechas y prioridades',
    facts: [
      { value: '1', label: 'responsable por tarea' },
      { value: '3', label: 'vistas: lista, Kanban y Gantt' },
      { value: 'Auto', label: 'avance y reportes' },
      { value: '4', label: 'roles con permisos' },
    ],
    featuresTitle: 'El seguimiento se hace solo',
    features: [
      { icon: 'Users', title: 'Asignación clara', text: 'Cada tarea con un responsable y fecha límite.' },
      { icon: 'Bell', title: 'Notificaciones', text: 'Avisos cuando te asignan o te mencionan.' },
      { icon: 'Gauge', title: 'Avance automático', text: 'El % del proyecto se recalcula con cada tarea completada.' },
      { icon: 'ChartColumn', title: 'Reportes al instante', text: 'Por estado, prioridad y completadas de la semana.' },
      { icon: 'ListFilter', title: 'Búsqueda y filtros', text: 'Encuentra cualquier tarea por estado en segundos.' },
      { icon: 'Clock', title: 'Historial', text: 'Cada cambio queda registrado en la actividad.' },
    ],
    idealFor: ['Equipos de operaciones', 'Pymes', 'Áreas administrativas', 'Equipos remotos'],
  },
  '/automatizacion-de-proyectos': {
    icon: 'Workflow',
    menuDesc: 'Slack, webhooks, n8n, Make y Zapier',
    accent: 'amber',
    visual: 'automation',
    visualLabel: 'Flujo de automatización: una tarjeta movida en QuinList envía un aviso a Slack y a n8n',
    facts: [
      { value: '2', label: 'eventos: mover y comentar' },
      { value: 'Slack', label: 'avisos en tu canal' },
      { value: 'Webhook', label: 'a cualquier URL' },
      { value: '.ics', label: 'calendario exportable' },
    ],
    featuresTitle: 'Menos trabajo manual, más flujo',
    features: [
      { icon: 'Webhook', title: 'Webhook personalizado', text: 'Envía los eventos del tablero a cualquier URL.' },
      { icon: 'MessagesSquare', title: 'Avisos en Slack', text: 'Tu canal se entera cuando una tarjeta avanza.' },
      { icon: 'Zap', title: 'n8n, Make y Zapier', text: 'Arma flujos con las herramientas que ya usas.' },
      { icon: 'Download', title: 'Exportación .ics', text: 'Lleva las fechas límite a Google Calendar u Outlook.' },
      { icon: 'Gauge', title: 'Cálculos automáticos', text: 'Avance, saldo, flujo de caja y reportes sin fórmulas.' },
      { icon: 'Bell', title: 'Notificaciones', text: 'Asignaciones y menciones dentro de la app.' },
    ],
    idealFor: ['Equipos técnicos', 'Operaciones', 'Agencias', 'Equipos que ya usan Slack'],
  },
  '/gestion-de-proyectos-para-agencias': {
    icon: 'Briefcase',
    menuDesc: 'Un proyecto por cliente y su rentabilidad',
    accent: 'rose',
    visual: 'clients',
    visualLabel: 'Proyectos por cliente en QuinList con estado y rentabilidad',
    facts: [
      { value: '1', label: 'proyecto por cliente' },
      { value: '4', label: 'estados de entregable' },
      { value: 'Link', label: 'público para el cliente' },
      { value: '%', label: 'rentabilidad por cuenta' },
    ],
    featuresTitle: 'Hecho para el ritmo de una agencia',
    features: [
      { icon: 'Building2', title: 'Ficha del cliente', text: 'Cliente, responsable, prioridad y categoría en cada proyecto.' },
      { icon: 'Milestone', title: 'Entregables con aprobación', text: 'Pendiente → En progreso → Entregado → Aprobado.' },
      { icon: 'Receipt', title: 'Facturación por hito', text: 'Registra anticipos, facturas y pagos por hito completado.' },
      { icon: 'TrendingUp', title: 'Rentabilidad por cuenta', text: 'Sabe qué clientes te dejan plata y cuáles no.' },
      { icon: 'Share2', title: 'Enlace para el cliente', text: 'Muestra el avance en solo lectura, sin darle acceso a todo.' },
      { icon: 'MessagesSquare', title: 'Chat del equipo', text: 'Separa el trabajo del WhatsApp personal.' },
    ],
    idealFor: ['Agencias de marketing', 'Estudios de diseño', 'Consultoras', 'Productoras'],
  },
  '/gestion-de-proyectos-de-construccion': {
    icon: 'HardHat',
    menuDesc: 'Obras, presupuesto, riesgos y evidencias',
    accent: 'amber',
    visual: 'risks',
    visualLabel: 'Riesgos e incidencias de una obra en QuinList con severidad y responsable',
    facts: [
      { value: '1', label: 'proyecto por obra' },
      { value: '4', label: 'niveles de severidad' },
      { value: 'Gantt', label: 'cronograma de obra' },
      { value: 'Móvil', label: 'desde la obra' },
    ],
    featuresTitle: 'La obra, el presupuesto y el equipo en un lugar',
    features: [
      { icon: 'SquareChartGantt', title: 'Cronograma de obra', text: 'Actividades e hitos con línea de hoy para ver atrasos.' },
      { icon: 'Coins', title: 'Presupuesto de obra', text: 'Materiales, personal y servicios con saldo al día.' },
      { icon: 'TriangleAlert', title: 'Riesgos e incidencias', text: 'De baja a crítica, con plan de mitigación.' },
      { icon: 'Camera', title: 'Evidencias', text: 'Planos, actas y fotos de avance en el centro de archivos.' },
      { icon: 'Milestone', title: 'Entregas por etapa', text: 'Entregables con aprobación para cada fase.' },
      { icon: 'Smartphone', title: 'Desde el celular', text: 'Revisa tareas y sube archivos desde el frente de obra.' },
    ],
    idealFor: ['Constructoras', 'Contratistas', 'Remodelaciones', 'Ingeniería', 'Interventorías'],
  },
  '/software-de-proyectos-para-pymes': {
    icon: 'Store',
    menuDesc: 'Simple, económico y listo en una tarde',
    accent: 'coral',
    visual: 'dashboard',
    visualLabel: 'Resumen de proyectos de una pyme en QuinList',
    facts: [
      { value: '0 USD', label: 'plan gratis para siempre' },
      { value: '15 USD', label: 'al mes el plan VIP' },
      { value: '1 tarde', label: 'para aprenderlo' },
      { value: '4', label: 'roles para tu equipo' },
    ],
    featuresTitle: 'Lo que una pyme necesita, sin lo que sobra',
    features: [
      { icon: 'Lightbulb', title: 'Fácil de aprender', text: 'El equipo lo usa sin capacitación.' },
      { icon: 'Coins', title: 'Precio simple', text: 'Gratis para empezar y 15 USD al mes en VIP.' },
      { icon: 'LayoutGrid', title: 'Kanban y proyectos', text: 'Del tablero diario al proyecto completo.' },
      { icon: 'Wallet', title: 'Dinero del proyecto', text: 'Presupuesto en tu moneda, sin hojas de cálculo.' },
      { icon: 'Shield', title: 'Roles', text: 'Separa lo que ve el dueño, el administrador y el equipo.' },
      { icon: 'MessagesSquare', title: 'Chat de equipo', text: 'Las tareas dejan de perderse en WhatsApp.' },
    ],
    idealFor: ['Servicios', 'Comercio', 'Manufactura', 'Distribuidoras', 'Emprendimientos'],
  },
  '/gestion-de-proyectos-de-software': {
    icon: 'CodeXml',
    menuDesc: 'Sprints, incidencias y lanzamientos',
    accent: 'sky',
    visual: 'kanban',
    visualLabel: 'Tablero de sprint de un equipo de desarrollo en QuinList',
    facts: [
      { value: 'Sprint', label: 'tableros por ciclo' },
      { value: 'OKR', label: 'objetivos del trimestre' },
      { value: 'Webhook', label: 'a Slack y n8n' },
      { value: 'Link', label: 'avance para el cliente' },
    ],
    featuresTitle: 'Del backlog al lanzamiento',
    features: [
      { icon: 'LayoutGrid', title: 'Tablero de sprint', text: 'Backlog, En curso, Revisión y Hecho con tus columnas.' },
      { icon: 'Bug', title: 'Incidencias', text: 'Registra errores y solicitudes en su propio módulo.' },
      { icon: 'Rocket', title: 'Lanzamientos', text: 'Planea versiones y lo que entra en cada una.' },
      { icon: 'Target', title: 'OKRs', text: 'Objetivos trimestrales, semestrales o anuales.' },
      { icon: 'Webhook', title: 'Eventos a Slack', text: 'Avisos cuando una tarjeta cambia de columna.' },
      { icon: 'Wallet', title: 'Contratos con clientes', text: 'Hitos, entregables y rentabilidad del desarrollo a la medida.' },
    ],
    idealFor: ['Software factories', 'Startups', 'Equipos de producto', 'Freelancers'],
  },
  '/gestion-de-proyectos-para-equipos-remotos': {
    icon: 'Globe',
    menuDesc: 'Tiempo real, chat y menos reuniones',
    accent: 'emerald',
    visual: 'chat',
    visualLabel: 'Chat de equipo de QuinList con menciones y personas en línea',
    facts: [
      { value: 'Live', label: 'tableros en tiempo real' },
      { value: '@', label: 'menciones en el chat' },
      { value: '●', label: 'presencia en línea' },
      { value: 'Web', label: 'desde cualquier país' },
    ],
    featuresTitle: 'Trabajar a distancia, sin perder el hilo',
    features: [
      { icon: 'Radio', title: 'Tiempo real', text: 'Todo el equipo ve los mismos cambios al instante.' },
      { icon: 'MessagesSquare', title: 'Chat con canales', text: 'Menciones, presencia y mensajes junto al trabajo.' },
      { icon: 'Eye', title: 'Avance visible', text: 'Dashboard de proyecto sin reuniones de seguimiento.' },
      { icon: 'CalendarDays', title: 'Calendario compartido', text: 'Eventos y vencimientos para todo el equipo.' },
      { icon: 'Bell', title: 'Notificaciones', text: 'Nadie se pierde una asignación o una mención.' },
      { icon: 'QrCode', title: 'Invitación fácil', text: 'Suma personas con un enlace o un código QR.' },
    ],
    idealFor: ['Equipos híbridos', 'Startups', 'Agencias remotas', 'Empresas con sedes'],
  },
}

export function getShowcase(path: string): Showcase | undefined {
  return showcaseByPath[path]
}
