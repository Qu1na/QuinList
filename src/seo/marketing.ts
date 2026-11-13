/**
 * Contenido comercial y SEO de QuinList (fuente única).
 *
 * Lo usan:
 *  - las vistas públicas (LandingView, MarketingPageView)
 *  - el prerender de build (scripts/prerender.mjs vía src/prerender/entry-server.ts)
 *  - sitemap.xml, robots.txt y llms.txt
 *
 * Regla de oro: aquí solo van funciones que QuinList tiene de verdad.
 * Si prometes algo que el producto no hace, pierdes al cliente y la confianza de Google y de las IA.
 */

export type MarketingKind = 'solucion' | 'industria' | 'comparativa' | 'pais' | 'guia' | 'precios'

export interface MarketingSection {
  heading: string
  body?: string[]
  bullets?: string[]
  steps?: { title: string; text: string }[]
}

export interface MarketingFaq {
  q: string
  a: string
}

export interface MarketingPage {
  path: string
  kind: MarketingKind
  /** Texto corto para menús y enlaces internos. */
  navLabel: string
  /** <title>: máximo ~60 caracteres. */
  title: string
  /** Meta description: máximo ~155 caracteres. */
  description: string
  keywords: string[]
  eyebrow: string
  h1: string
  intro: string
  highlights: string[]
  sections: MarketingSection[]
  comparison?: {
    caption: string
    headers: [string, string, string]
    rows: [string, string, string][]
  }
  faqs: MarketingFaq[]
  related: string[]
  country?: { name: string; code: string; currency: string; cities: string[] }
  /** Fecha de la última revisión del contenido (YYYY-MM-DD). */
  updated: string
  /** Aviso legal opcional (marcas de terceros). */
  disclaimer?: string
  /** Página índice que lista todas las páginas de su tipo (p. ej. /guias). */
  hub?: boolean
}

export const CONTENT_UPDATED = '2026-11-13'

export const PRODUCT = {
  name: 'QuinList',
  company: 'MatuByte S.A.S.',
  country: 'Colombia',
  url: 'https://quinlist.matubyte.com',
  email: 'contacto@matubyte.com',
  vipPriceUsd: 15,
  freeBoards: 1,
  freeProjects: 1,
  currencies: ['COP', 'USD', 'MXN', 'PEN', 'CLP', 'ARS', 'BRL', 'EUR', 'GBP'],
  oneLiner:
    'QuinList es un software de gestión de proyectos y finanzas para empresas, hecho en Colombia para equipos de Latinoamérica: une tareas, tableros Kanban, cronograma Gantt, presupuesto y rentabilidad, hitos, riesgos, chat de equipo y asistente de IA en un solo lugar.',
} as const

/* ------------------------------------------------------------------ */
/* Landing                                                              */
/* ------------------------------------------------------------------ */

export const landingFaqs: MarketingFaq[] = [
  {
    q: '¿Qué es QuinList?',
    a: 'QuinList es un software de gestión de proyectos en la nube para empresas, hecho por MatuByte S.A.S. en Colombia. Reúne tableros Kanban, tareas, cronograma Gantt, hitos, entregables, riesgos, presupuesto y finanzas del proyecto, chat de equipo, calendario, OKRs, reportes y un asistente de IA. Se usa desde el navegador, sin instalar nada.',
  },
  {
    q: '¿Para quién es QuinList?',
    a: 'Para equipos y empresas de Latinoamérica que hoy llevan sus proyectos en Excel, cuadernos, grupos de WhatsApp o carpetas de Google Drive: agencias, consultoras, constructoras, equipos de software, pymes y áreas de operaciones. Funciona igual para un equipo de 3 personas que para varias áreas de una empresa.',
  },
  {
    q: '¿Cuánto cuesta QuinList?',
    a: 'Hay un plan Gratis para siempre, con 1 tablero y 1 proyecto, sin tarjeta de crédito. El plan VIP cuesta 15 USD al mes e incluye tableros y proyectos ilimitados y el asistente de IA. El cobro se hace en pesos colombianos, a la tasa del día, a través de Landa Pay.',
  },
  {
    q: '¿En qué se diferencia de Trello, Asana o Monday?',
    a: 'QuinList está pensado para empresas de Latinoamérica: precio simple, soporte directo del equipo que lo construye y presupuesto del proyecto en tu moneda (COP, MXN, PEN, CLP, ARS, USD y más). Además del Kanban, cada proyecto trae finanzas (ingresos, egresos, flujo de caja y rentabilidad), cronograma Gantt, hitos, entregables y riesgos, sin integraciones extra.',
  },
  {
    q: '¿Puedo controlar el presupuesto de mis proyectos?',
    a: 'Sí. Cada proyecto tiene una caja con presupuesto base, ingresos y egresos por categoría, libro mayor con saldo acumulado, flujo de caja mensual y meta de rentabilidad. Cada proyecto puede usar su propia moneda.',
  },
  {
    q: '¿QuinList tiene inteligencia artificial?',
    a: 'Sí. El plan VIP incluye un asistente de IA que lee el contexto de tus tableros y proyectos y te ayuda a priorizar, resumir el avance, redactar tareas y detectar lo que está atrasado.',
  },
  {
    q: '¿Sirve para equipos remotos?',
    a: 'Sí. Todo se sincroniza en tiempo real: tableros, comentarios, chat de equipo con menciones y notificaciones. Funciona en cualquier navegador, desde computador o celular.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Cada espacio de trabajo tiene roles (Propietario, Administrador, Miembro y Observador), permisos por módulo e historial de actividad. Tú decides quién ve las finanzas, quién edita tareas y quién solo consulta.',
  },
]

/** Dolores que el cliente reconoce (sección problema del embudo). */
export const landingPains = [
  {
    title: 'El Excel tiene 14 versiones',
    text: '“Cronograma_final_v3_AHORA_SI.xlsx”. Nadie sabe cuál es la buena y cada quien actualiza la suya.',
  },
  {
    title: 'Las tareas se pierden en WhatsApp',
    text: 'Lo que se acordó en el grupo quedó enterrado entre audios y stickers. Nadie es responsable de nada.',
  },
  {
    title: 'Los archivos viven en mil carpetas',
    text: 'Contratos en Drive, fotos en el celular, notas en un cuaderno. Encontrar algo toma media mañana.',
  },
  {
    title: 'El presupuesto se descubre al final',
    text: 'Te enteras de que el proyecto perdió plata cuando ya se entregó. Sin flujo de caja, no hay forma de corregir a tiempo.',
  },
]

/** Antes / después: la promesa concreta. */
export const landingBeforeAfter: { before: string; after: string }[] = [
  { before: 'Excel compartido que nadie actualiza', after: 'Tablero Kanban en tiempo real' },
  { before: 'Tareas sueltas en WhatsApp', after: 'Cada tarea con responsable, fecha y prioridad' },
  { before: 'Carpetas de Drive desordenadas', after: 'Centro de archivos por proyecto' },
  { before: 'Cronograma en una presentación', after: 'Diagrama de Gantt que se actualiza solo' },
  { before: 'Gastos en un cuaderno', after: 'Presupuesto, flujo de caja y rentabilidad' },
  { before: 'Reunión para saber “cómo vamos”', after: 'Dashboard con el avance de cada proyecto' },
]

/* ------------------------------------------------------------------ */
/* Páginas comerciales / SEO                                            */
/* ------------------------------------------------------------------ */

const U = CONTENT_UPDATED

const CTA_FAQ_PRICE: MarketingFaq = {
  q: '¿Cuánto cuesta?',
  a: 'Puedes empezar gratis, sin tarjeta, con 1 tablero y 1 proyecto. El plan VIP cuesta 15 USD al mes e incluye tableros y proyectos ilimitados y el asistente de IA.',
}

function countryPage(input: {
  slug: string
  name: string
  code: string
  currency: string
  currencyName: string
  cities: string[]
  industries: string
  context: string
  paymentNote: string
  extraFaq: MarketingFaq
}): MarketingPage {
  return {
    path: `/software-gestion-de-proyectos/${input.slug}`,
    kind: 'pais',
    navLabel: input.name,
    title: `Software de gestión de proyectos en ${input.name} | QuinList`,
    description: `Gestiona proyectos en ${input.name} con QuinList: Kanban, cronograma Gantt y presupuesto en ${input.currency}. Plan gratis para siempre y VIP por 15 USD/mes.`,
    keywords: [
      `software de gestión de proyectos ${input.name}`,
      `gestor de proyectos ${input.name}`,
      `programa para gestionar proyectos ${input.name}`,
      `software para empresas ${input.name}`,
      `tablero kanban ${input.name}`,
      ...input.cities.map((c) => `software de proyectos ${c}`),
    ],
    eyebrow: `Gestión de proyectos · ${input.name}`,
    h1: `Software de gestión de proyectos para empresas de ${input.name}`,
    intro: `QuinList ayuda a equipos de ${input.cities.join(', ')} y todo ${input.name} a dejar el Excel y los grupos de WhatsApp. Planifica tareas, controla el presupuesto en ${input.currencyName} (${input.currency}) y sigue el avance de cada proyecto en tiempo real.`,
    highlights: [
      `Presupuesto y finanzas del proyecto en ${input.currency}`,
      'Soporte directo del equipo creador',
      'Plan gratis para siempre, sin tarjeta',
      'Funciona en el navegador, sin instalar nada',
    ],
    sections: [
      {
        heading: `Gestión de proyectos pensada para ${input.name}`,
        body: [input.context, input.industries],
      },
      {
        heading: `Tu presupuesto en ${input.currencyName}`,
        body: [
          `Cada proyecto de QuinList tiene su propia moneda. Configura el presupuesto base en ${input.currency}, registra ingresos y egresos por categoría y mira el saldo, el flujo de caja mensual y la rentabilidad sin fórmulas ni hojas de cálculo.`,
          'Si trabajas con clientes de otros países, cada proyecto puede usar una moneda distinta: COP, USD, MXN, PEN, CLP, ARS, BRL, EUR o GBP.',
        ],
      },
      {
        heading: 'Todo lo que tu equipo necesita en un solo lugar',
        bullets: [
          'Tableros Kanban con arrastrar y soltar, etiquetas, checklist, fechas límite y adjuntos',
          'Proyectos con tareas en vista lista, Kanban y cronograma (Gantt)',
          'Hitos, entregables con flujo de aprobación y matriz de riesgos e incidencias',
          'Chat de equipo con menciones, notificaciones y colaboración en tiempo real',
          'Calendario, eventos, OKRs y centro de métricas',
          'Roles y permisos: Propietario, Administrador, Miembro y Observador',
          'Asistente de IA para priorizar y resumir el avance (plan VIP)',
        ],
      },
      {
        heading: 'Precio claro, en dólares',
        body: [
          `El plan Gratis incluye 1 tablero y 1 proyecto, para siempre. El plan VIP cuesta 15 USD al mes con tableros y proyectos ilimitados y asistente de IA. ${input.paymentNote}`,
        ],
      },
    ],
    faqs: [
      {
        q: `¿QuinList funciona en ${input.name}?`,
        a: `Sí. QuinList es un software en la nube: se usa desde cualquier navegador en ${input.name} y el resto de Latinoamérica, sin instalar nada. La interfaz y el soporte están en español.`,
      },
      {
        q: `¿Puedo manejar el presupuesto en ${input.currency}?`,
        a: `Sí. Al crear un proyecto eliges la moneda (${input.currency} incluida) y todos los montos, el libro mayor, el flujo de caja y la rentabilidad se muestran en esa moneda.`,
      },
      input.extraFaq,
      CTA_FAQ_PRICE,
    ],
    related: [
      '/software-gestion-de-proyectos',
      '/control-de-presupuesto-de-proyectos',
      '/alternativa-a-excel-para-proyectos',
      '/precios',
    ],
    country: { name: input.name, code: input.code, currency: input.currency, cities: input.cities },
    updated: U,
  }
}

export const marketingPages: MarketingPage[] = [
  /* ---------------------------- Soluciones ---------------------------- */
  {
    path: '/software-gestion-de-proyectos',
    kind: 'solucion',
    navLabel: 'Software de gestión de proyectos',
    title: 'Software de gestión de proyectos para empresas | QuinList',
    description:
      'Software de gestión de proyectos para empresas de Latinoamérica: Kanban, Gantt, presupuesto, riesgos, chat e IA en un solo lugar. Empieza gratis.',
    keywords: [
      'software de gestión de proyectos',
      'programa para gestionar proyectos',
      'herramienta de gestión de proyectos',
      'software de gestión de proyectos para empresas',
      'gestor de proyectos online',
      'plataforma de gestión de proyectos',
    ],
    eyebrow: 'Gestión de proyectos',
    h1: 'El software de gestión de proyectos que controla tareas y dinero',
    intro:
      'QuinList reúne en una sola plataforma todo lo que hoy tienes repartido en Excel, WhatsApp, cuadernos y carpetas de Drive: tareas, cronograma, presupuesto, entregables, riesgos, archivos y la conversación del equipo.',
    highlights: [
      'Kanban, lista y Gantt para cada proyecto',
      'Presupuesto, flujo de caja y rentabilidad',
      'Roles y permisos por módulo',
      'Plan gratis para siempre',
    ],
    sections: [
      {
        heading: '¿Qué es un software de gestión de proyectos?',
        body: [
          'Un software de gestión de proyectos es una herramienta donde el equipo planifica el trabajo, asigna responsables, define fechas y sigue el avance en tiempo real. Reemplaza las hojas de cálculo compartidas y los mensajes sueltos por un sistema único donde todos ven lo mismo.',
          'La diferencia con una lista de tareas es el contexto: en QuinList cada proyecto tiene su dashboard, su cronograma, su dinero, sus documentos y su historial. Sabes qué falta, quién lo tiene, cuánto se ha gastado y qué riesgo puede retrasar la entrega.',
        ],
      },
      {
        heading: 'Los módulos de cada proyecto',
        bullets: [
          'Dashboard: avance en %, tareas pendientes, próximos vencimientos y actividad reciente',
          'Tareas en vista lista, Kanban con arrastrar y soltar, y cronograma tipo Gantt',
          'Hitos con línea de tiempo y progreso',
          'Entregables con estados Pendiente, En progreso, Entregado y Aprobado',
          'Riesgos e incidencias con severidad, responsable y plan de mitigación',
          'Finanzas: presupuesto base, ingresos, egresos, libro mayor, flujo de caja y rentabilidad',
          'Documentación, centro de archivos y registro de actividad',
          'Reportes por estado, prioridad y resumen financiero',
        ],
      },
      {
        heading: 'Cómo empezar en 3 pasos',
        steps: [
          {
            title: 'Crea tu cuenta gratis',
            text: 'Regístrate con tu correo o con Google. No pedimos tarjeta.',
          },
          {
            title: 'Crea tu primer proyecto',
            text: 'Define nombre, cliente, fechas, presupuesto y moneda en un asistente de dos pasos.',
          },
          {
            title: 'Invita a tu equipo',
            text: 'Comparte un enlace o un código QR, asigna roles y empieza a mover tareas.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Cuál es el mejor software de gestión de proyectos para una empresa en Latinoamérica?',
        a: 'Depende de tu equipo. Si buscas una sola herramienta con presupuesto del proyecto en moneda local, Kanban, Gantt, riesgos y chat en un solo lugar, QuinList está hecho para eso y tiene plan gratis para probarlo.',
      },
      {
        q: '¿Necesito instalar algo?',
        a: 'No. QuinList funciona en el navegador, desde computador, tablet o celular.',
      },
      {
        q: '¿Cuántas personas pueden usarlo?',
        a: 'Puedes invitar a tu equipo a tu espacio de trabajo y asignar a cada persona un rol: Propietario, Administrador, Miembro u Observador.',
      },
      CTA_FAQ_PRICE,
    ],
    related: [
      '/tablero-kanban-online',
      '/diagrama-de-gantt-online',
      '/control-de-presupuesto-de-proyectos',
      '/alternativa-a-excel-para-proyectos',
    ],
    updated: U,
  },
  {
    path: '/tablero-kanban-online',
    kind: 'solucion',
    navLabel: 'Tablero Kanban online',
    title: 'Tablero Kanban online gratis para equipos | QuinList',
    description:
      'Crea tableros Kanban online gratis: arrastra tarjetas, asigna responsables, fechas, etiquetas y checklist. Colaboración en tiempo real, sin instalar nada.',
    keywords: [
      'tablero kanban online',
      'tablero kanban gratis',
      'kanban en español',
      'metodología kanban',
      'herramienta kanban',
      'tablero de tareas online',
    ],
    eyebrow: 'Kanban',
    h1: 'Tablero Kanban online gratis para tu equipo',
    intro:
      'Visualiza el trabajo de tu equipo en columnas, mueve tarjetas con arrastrar y soltar y mira en segundos qué está por hacer, qué está en curso y qué ya se terminó.',
    highlights: [
      'Arrastrar y soltar',
      'Responsables, fechas y prioridad',
      'Checklist, etiquetas y adjuntos',
      'Cambios en tiempo real',
    ],
    sections: [
      {
        heading: '¿Qué es un tablero Kanban?',
        body: [
          'Kanban es un método visual para gestionar el trabajo. Cada tarea es una tarjeta y cada columna es una etapa: por ejemplo Por hacer, En curso y Hecho. Al mover las tarjetas, todo el equipo ve el estado real del trabajo sin necesidad de reuniones.',
          'Funciona para desarrollo de software, marketing, ventas, soporte, operaciones y cualquier equipo que tenga trabajo que fluye por etapas.',
        ],
      },
      {
        heading: 'Lo que puedes hacer con el Kanban de QuinList',
        bullets: [
          'Listas configurables con el flujo de tu equipo',
          'Tarjetas con descripción, responsable, fecha límite, prioridad y etiquetas',
          'Checklist dentro de cada tarjeta',
          'Comentarios, menciones y archivos adjuntos',
          'Notificaciones cuando te asignan o te mencionan',
          'Enlaces de invitación y código QR para sumar al equipo',
          'Tarjetas conectadas a las tareas de un proyecto',
        ],
      },
      {
        heading: 'Kanban + proyectos: lo mejor de los dos mundos',
        body: [
          'En la mayoría de herramientas el Kanban se queda solo. En QuinList cualquier tarea de un proyecto se puede abrir en un tablero, y el proyecto sigue mostrando su cronograma, su presupuesto y sus entregables. El equipo trabaja en el tablero; la dirección mira el proyecto completo.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿El tablero Kanban es gratis?',
        a: 'Sí. El plan Gratis incluye 1 tablero Kanban para siempre. El plan VIP (15 USD/mes) incluye tableros ilimitados.',
      },
      {
        q: '¿Varias personas pueden editar el tablero a la vez?',
        a: 'Sí. Los cambios se ven en tiempo real para todos los miembros del tablero.',
      },
      {
        q: '¿Puedo usar Kanban con metodología Scrum?',
        a: 'Sí. Puedes crear columnas para tu sprint (Backlog, Sprint, En curso, Revisión, Hecho) y usar etiquetas y prioridades para ordenar el trabajo.',
      },
    ],
    related: [
      '/software-gestion-de-tareas',
      '/alternativa-a-trello',
      '/software-gestion-de-proyectos',
      '/precios',
    ],
    updated: U,
  },
  {
    path: '/diagrama-de-gantt-online',
    kind: 'solucion',
    navLabel: 'Diagrama de Gantt online',
    title: 'Diagrama de Gantt online para tus proyectos | QuinList',
    description:
      'Haz el cronograma de tu proyecto con un diagrama de Gantt online: tareas con fecha de inicio y fin, hitos y línea de hoy. Gratis para empezar.',
    keywords: [
      'diagrama de gantt online',
      'cronograma de proyecto',
      'gantt gratis',
      'cronograma de actividades',
      'programa para hacer cronogramas',
      'línea de tiempo de proyecto',
    ],
    eyebrow: 'Cronograma',
    h1: 'Diagrama de Gantt online para el cronograma de tus proyectos',
    intro:
      'Deja de dibujar el cronograma en Excel o en una presentación. En QuinList el diagrama de Gantt se arma solo con las fechas de inicio y fin de tus tareas y se actualiza cada vez que el equipo avanza.',
    highlights: ['Escala mensual', 'Línea de “hoy”', 'Colores por estado', 'Hitos con progreso'],
    sections: [
      {
        heading: '¿Qué es un diagrama de Gantt?',
        body: [
          'Es una gráfica de barras horizontales donde cada barra es una tarea y su largo es la duración. Permite ver de un vistazo qué se hace primero, qué se cruza y qué está atrasado respecto a la fecha de hoy.',
        ],
      },
      {
        heading: 'Cronograma conectado con el resto del proyecto',
        bullets: [
          'Las barras salen de las fechas reales de cada tarea',
          'Colores según el estado: pendiente, en curso, completada',
          'Línea de hoy para detectar atrasos al instante',
          'Hitos con fecha de vencimiento y porcentaje de avance',
          'Misma tarea visible en lista, Kanban y Gantt',
        ],
      },
      {
        heading: 'Cómo hacer un cronograma en QuinList',
        steps: [
          {
            title: 'Lista las tareas',
            text: 'Crea las tareas del proyecto con responsable y prioridad.',
          },
          { title: 'Asigna fechas', text: 'Pon fecha de inicio y de fin a cada tarea.' },
          {
            title: 'Abre el cronograma',
            text: 'La vista Gantt aparece lista. Ajusta fechas cuando cambie el plan.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: '¿El diagrama de Gantt se actualiza solo?',
        a: 'Sí. Se construye con las fechas de las tareas, así que cualquier cambio en una tarea se refleja en el cronograma.',
      },
      {
        q: '¿Puedo ver el cronograma y el Kanban del mismo proyecto?',
        a: 'Sí. Las tareas de un proyecto se ven en lista, en Kanban y en cronograma. Es la misma información en tres vistas.',
      },
    ],
    related: [
      '/guias/como-hacer-un-cronograma-de-proyecto',
      '/software-gestion-de-proyectos',
      '/gestion-de-proyectos-de-construccion',
    ],
    updated: U,
  },
  {
    path: '/control-de-presupuesto-de-proyectos',
    kind: 'solucion',
    navLabel: 'Control de presupuesto',
    title: 'Control de presupuesto de proyectos y flujo de caja | QuinList',
    description:
      'Controla el presupuesto de cada proyecto: ingresos, egresos, libro mayor, flujo de caja y rentabilidad en tu moneda. Sin fórmulas de Excel.',
    keywords: [
      'control de presupuesto de proyectos',
      'flujo de caja de un proyecto',
      'rentabilidad de proyectos',
      'control de gastos de proyectos',
      'presupuesto de obra',
      'finanzas de proyectos',
    ],
    eyebrow: 'Finanzas del proyecto',
    h1: 'Control de presupuesto de proyectos, sin hojas de cálculo',
    intro:
      'La mayoría de herramientas de proyectos solo cuentan tareas. QuinList también cuenta el dinero: cada proyecto tiene su caja con presupuesto base, ingresos, egresos, flujo de caja y rentabilidad.',
    highlights: [
      'Libro mayor con saldo acumulado',
      'Flujo de caja mensual',
      'Gastos por categoría',
      'Meta de rentabilidad',
    ],
    sections: [
      {
        heading: 'La caja de cada proyecto',
        body: [
          'Al crear un proyecto defines el presupuesto base y la moneda. Desde ahí, cada ingreso (anticipo del cliente, facturación, hito completado, reembolso) y cada egreso (personal, herramientas, servicios, infraestructura, marketing, viajes) queda registrado con su método de pago, referencia o comprobante y notas.',
          'El saldo se calcula solo: Saldo = Presupuesto base + Ingresos − Egresos.',
        ],
      },
      {
        heading: 'Qué ves en el módulo de finanzas',
        bullets: [
          'Tarjeta del proyecto con saldo, presupuesto base y flujo neto',
          'Libro mayor con saldo acumulado movimiento por movimiento',
          'Gráfico de flujo de caja mensual',
          'Desglose de egresos por categoría',
          'KPIs: ingresos, egresos, % de presupuesto consumido y rentabilidad',
          'Permisos: decide quién puede ver y editar las finanzas',
        ],
      },
      {
        heading: 'Por qué importa',
        body: [
          'Un proyecto puede ir a tiempo y aun así perder plata. Ver el consumo del presupuesto mientras avanzan las tareas te permite renegociar, recortar o facturar un hito antes de que sea tarde.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿En qué monedas puedo llevar el presupuesto?',
        a: 'COP, USD, MXN, PEN, CLP, ARS, BRL, EUR y GBP. Cada proyecto tiene su propia moneda.',
      },
      {
        q: '¿Reemplaza a mi software contable?',
        a: 'No. QuinList controla las finanzas operativas de cada proyecto (presupuesto, gastos, flujo y rentabilidad). La contabilidad formal y la facturación electrónica siguen en tu sistema contable.',
      },
      {
        q: '¿Puedo ocultar las finanzas a parte del equipo?',
        a: 'Sí. Los permisos por módulo permiten que alguien trabaje en las tareas sin ver el dinero del proyecto.',
      },
    ],
    related: [
      '/gestion-de-proyectos-de-construccion',
      '/gestion-de-proyectos-para-agencias',
      '/software-gestion-de-proyectos',
    ],
    updated: U,
  },
  {
    path: '/gestion-de-proyectos-con-ia',
    kind: 'solucion',
    navLabel: 'Gestión de proyectos con IA',
    title: 'Gestión de proyectos con inteligencia artificial | QuinList',
    description:
      'Asistente de IA que conoce tus tableros y proyectos: prioriza, resume el avance, redacta tareas y detecta atrasos. Incluido en el plan VIP de QuinList.',
    keywords: [
      'gestión de proyectos con ia',
      'inteligencia artificial para proyectos',
      'asistente ia para equipos',
      'ia para productividad',
      'software de proyectos con inteligencia artificial',
    ],
    eyebrow: 'Inteligencia artificial',
    h1: 'Gestión de proyectos con inteligencia artificial',
    intro:
      'El asistente de IA de QuinList lee el estado de tus tableros y proyectos —tarjetas abiertas, tareas completadas, proyectos en curso— y te responde con ese contexto. No tienes que copiar y pegar nada.',
    highlights: [
      'Conoce tu espacio de trabajo',
      'Prioriza lo urgente',
      'Resume el avance',
      'Redacta tareas',
    ],
    sections: [
      {
        heading: 'Qué le puedes pedir',
        bullets: [
          '“¿Qué está atrasado esta semana?”',
          '“Resume el avance del proyecto para el cliente.”',
          '“Divide esta tarea grande en pasos.”',
          '“¿En qué debería enfocarse el equipo hoy?”',
          '“Redacta la descripción de esta tarjeta.”',
        ],
      },
      {
        heading: 'IA con contexto, no un chat genérico',
        body: [
          'Un chat de IA común no sabe nada de tu empresa. El asistente de QuinList recibe un resumen de tus tableros y proyectos del espacio de trabajo actual, así que sus respuestas parten de tu realidad.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿El asistente de IA está en el plan gratis?',
        a: 'No. El asistente de IA está incluido en el plan VIP, que cuesta 15 USD al mes.',
      },
      {
        q: '¿Qué información usa la IA?',
        a: 'Usa un resumen del espacio de trabajo en el que estás: nombres de tableros y proyectos, tarjetas abiertas y conteo de tareas. Solo se envía cuando haces una pregunta.',
      },
    ],
    related: ['/precios', '/software-gestion-de-proyectos', '/software-gestion-de-tareas'],
    updated: U,
  },
  {
    path: '/software-gestion-de-tareas',
    kind: 'solucion',
    navLabel: 'Gestión de tareas',
    title: 'Software de gestión de tareas para equipos | QuinList',
    description:
      'Organiza las tareas de tu equipo: responsables, fechas límite, prioridades, checklist y recordatorios. Avance y reportes que se calculan solos.',
    keywords: [
      'software de gestión de tareas',
      'gestor de tareas para equipos',
      'app de tareas para empresas',
      'organizar tareas del equipo',
      'asignar tareas a empleados',
      'seguimiento de tareas',
    ],
    eyebrow: 'Tareas y seguimiento',
    h1: 'Software de gestión de tareas que hace el seguimiento por ti',
    intro:
      'Cada tarea con un dueño, una fecha y una prioridad. QuinList avisa lo que vence, calcula el avance del proyecto y arma los reportes, para que no tengas que perseguir a nadie por WhatsApp.',
    highlights: [
      'Responsable y fecha límite',
      'Notificaciones automáticas',
      'Avance calculado solo',
      'Reportes al instante',
    ],
    sections: [
      {
        heading: 'Lo que QuinList hace automáticamente',
        bullets: [
          'Calcula el % de avance de cada proyecto según las tareas completadas',
          'Muestra los próximos vencimientos en el dashboard del proyecto',
          'Notifica cuando te asignan una tarea o te mencionan',
          'Registra cada cambio en el historial de actividad',
          'Genera gráficos por estado y prioridad, y las tareas completadas de la semana',
          'Recalcula el saldo y el flujo de caja con cada movimiento',
        ],
      },
      {
        heading: 'Tres vistas para las mismas tareas',
        body: [
          'Lista para revisar y filtrar, Kanban para mover el trabajo y cronograma para ver fechas. Cada persona usa la vista que le sirve y todos ven la misma información.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Puedo asignar una tarea a varias personas?',
        a: 'Cada tarea tiene un responsable principal para que siempre haya alguien a cargo, y puedes mencionar a otras personas en los comentarios.',
      },
      {
        q: '¿Recibo avisos de las tareas?',
        a: 'Sí. QuinList envía notificaciones dentro de la app cuando te asignan una tarea o te mencionan.',
      },
    ],
    related: [
      '/tablero-kanban-online',
      '/gestion-de-proyectos-con-ia',
      '/software-de-proyectos-para-pymes',
    ],
    updated: U,
  },

  {
    path: '/automatizacion-de-proyectos',
    kind: 'solucion',
    navLabel: 'Automatización e integraciones',
    title: 'Automatización de proyectos: Slack, webhooks y n8n | QuinList',
    description:
      'Automatiza el seguimiento de tus proyectos: avisos en Slack, webhooks a Zapier, Make o n8n, calendario .ics y avance calculado solo.',
    keywords: [
      'automatización de proyectos',
      'automatizar tareas del equipo',
      'integración con slack',
      'webhooks zapier make n8n',
      'automatización de flujos de trabajo',
    ],
    eyebrow: 'Automatización',
    h1: 'Automatiza el seguimiento de tus proyectos',
    intro:
      'Menos trabajo manual, menos mensajes de “¿cómo vas?”. QuinList calcula el avance, el saldo y los reportes por su cuenta, y avisa a Slack o a tus herramientas de automatización cada vez que el trabajo se mueve.',
    highlights: ['Avisos en Slack', 'Webhooks a Zapier, Make y n8n', 'Exportación .ics', 'Cálculos automáticos'],
    sections: [
      {
        heading: 'Lo que pasa solo, sin que nadie lo haga',
        bullets: [
          'El % de avance del proyecto se recalcula con cada tarea completada',
          'El saldo, el libro mayor y el flujo de caja se actualizan con cada ingreso o egreso',
          'Los reportes por estado y prioridad se generan al instante',
          'Notificaciones dentro de la app cuando te asignan o te mencionan',
          'Historial de actividad con cada cambio registrado',
        ],
      },
      {
        heading: 'Conecta tus tableros con otras herramientas',
        body: [
          'Cada tablero tiene un panel de integraciones. Activa Slack y recibe en tu canal un aviso cuando una tarjeta cambia de columna o recibe un comentario.',
          'Con el webhook personalizado, QuinList envía esos mismos eventos a cualquier URL. Así conectas Zapier, Make o n8n y armas tus propios flujos: crear una fila en una hoja de cálculo cuando algo se termina, avisar por correo a un cliente o registrar el cambio en tu CRM.',
          'También puedes exportar las fechas límite del tablero como archivo .ics e importarlas en Google Calendar, Outlook o Apple Calendar.',
        ],
      },
      {
        heading: 'Cómo activar un webhook',
        steps: [
          { title: 'Abre el tablero', text: 'Entra al panel de integraciones desde la barra del tablero.' },
          { title: 'Activa Slack o Webhook', text: 'Pega la URL del webhook de Slack, Zapier, Make o n8n.' },
          { title: 'Mueve una tarjeta', text: 'El evento llega con el tablero, la tarjeta, el usuario y la hora.' },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué eventos envía QuinList por webhook?',
        a: 'Hoy envía un evento cuando una tarjeta se mueve de columna y cuando se agrega un comentario, con el nombre del tablero, la tarjeta, el usuario y la fecha.',
      },
      {
        q: '¿Funciona con n8n, Make o Zapier?',
        a: 'Sí. Cualquier herramienta que reciba webhooks por URL puede recibir los eventos de QuinList.',
      },
      CTA_FAQ_PRICE,
    ],
    related: ['/software-gestion-de-tareas', '/tablero-kanban-online', '/gestion-de-proyectos-con-ia'],
    updated: U,
    disclaimer:
      'Slack, Zapier, Make y n8n son marcas de sus respectivos dueños. QuinList no está afiliado a estas empresas.',
  },

  /* ---------------------------- Industrias ---------------------------- */
  {
    path: '/gestion-de-proyectos-para-agencias',
    kind: 'industria',
    navLabel: 'Agencias y consultoras',
    title: 'Gestión de proyectos para agencias y consultoras | QuinList',
    description:
      'Gestiona los proyectos de tus clientes: un espacio por cliente, entregables con aprobación, presupuesto y rentabilidad por proyecto. Empieza gratis.',
    keywords: [
      'software para agencias de marketing',
      'gestión de proyectos para agencias',
      'software para consultoras',
      'gestión de clientes y proyectos',
      'rentabilidad por cliente',
    ],
    eyebrow: 'Agencias y consultoras',
    h1: 'Gestión de proyectos para agencias y consultoras',
    intro:
      'Cuando manejas diez clientes a la vez, el Excel no alcanza. QuinList te da un proyecto por cliente con sus tareas, entregables, presupuesto y archivos, y te dice cuáles proyectos te dejan plata.',
    highlights: [
      'Proyecto por cliente',
      'Entregables con aprobación',
      'Rentabilidad por proyecto',
      'Enlace para compartir con el cliente',
    ],
    sections: [
      {
        heading: 'Pensado para el día a día de una agencia',
        bullets: [
          'Datos del cliente, responsable, prioridad y categoría en cada proyecto',
          'Entregables con estados Pendiente → En progreso → Entregado → Aprobado',
          'Hitos para facturar por avance',
          'Ingresos por anticipo, facturación o hito completado',
          'Enlace público para mostrar el avance al cliente sin darle acceso a todo',
          'Chat de equipo para no mezclar el trabajo con WhatsApp personal',
        ],
      },
      {
        heading: 'Sabe qué cliente es rentable',
        body: [
          'Registra las horas, herramientas y servicios que cuesta cada cuenta. QuinList calcula la rentabilidad del proyecto contra la meta que definas, para que sepas dónde ajustar precios.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Puedo mostrarle el avance al cliente?',
        a: 'Sí. Puedes compartir un proyecto con un enlace público de solo lectura.',
      },
      CTA_FAQ_PRICE,
    ],
    related: [
      '/control-de-presupuesto-de-proyectos',
      '/alternativa-a-asana-y-monday',
      '/software-gestion-de-proyectos',
    ],
    updated: U,
  },
  {
    path: '/gestion-de-proyectos-de-construccion',
    kind: 'industria',
    navLabel: 'Construcción y obras',
    title: 'Software para gestión de proyectos de construcción | QuinList',
    description:
      'Controla tus obras: cronograma Gantt, presupuesto de obra, gastos por categoría, riesgos, entregables y fotos de avance en un solo lugar.',
    keywords: [
      'software para construcción',
      'gestión de proyectos de construcción',
      'control de obra',
      'presupuesto de obra',
      'cronograma de obra',
      'software para constructoras',
    ],
    eyebrow: 'Construcción y obras',
    h1: 'Software para la gestión de proyectos de construcción',
    intro:
      'Obra, presupuesto y equipo en el mismo lugar. Lleva el cronograma, los gastos, los riesgos y las evidencias de cada frente de trabajo sin depender de cuadernos ni de fotos sueltas en el celular.',
    highlights: [
      'Cronograma de obra (Gantt)',
      'Presupuesto y gastos',
      'Riesgos e incidencias',
      'Archivos y fotos de avance',
    ],
    sections: [
      {
        heading: 'Cómo lo usan las constructoras',
        bullets: [
          'Un proyecto por obra, con cliente, responsable y fechas',
          'Cronograma con las actividades y los hitos de la obra',
          'Egresos por categoría: personal, materiales y servicios, viajes',
          'Riesgos e incidencias con severidad (baja a crítica) y plan de mitigación',
          'Entregables con aprobación para cada etapa',
          'Centro de archivos con planos, actas y fotos de avance',
        ],
      },
      {
        heading: 'El presupuesto de obra, al día',
        body: [
          'El libro mayor muestra el saldo después de cada compra o pago. Ves el porcentaje del presupuesto consumido frente al avance de la obra y detectas a tiempo cuándo una obra se va a pasar.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Sirve para varias obras a la vez?',
        a: 'Sí. Cada obra es un proyecto independiente con su cronograma, presupuesto y equipo. El plan VIP permite proyectos ilimitados.',
      },
      {
        q: '¿Se puede usar desde el celular en la obra?',
        a: 'Sí. QuinList funciona en el navegador del celular para revisar tareas, subir archivos y comentar.',
      },
    ],
    related: [
      '/control-de-presupuesto-de-proyectos',
      '/diagrama-de-gantt-online',
      '/software-gestion-de-proyectos',
    ],
    updated: U,
  },
  {
    path: '/software-de-proyectos-para-pymes',
    kind: 'industria',
    navLabel: 'Pymes',
    title: 'Software de gestión de proyectos para pymes | QuinList',
    description:
      'El software de proyectos que una pyme sí puede usar: fácil de usar, con plan gratis y VIP de 15 USD/mes. Tareas, Kanban, presupuesto y equipo.',
    keywords: [
      'software para pymes',
      'gestión de proyectos para pymes',
      'software empresarial para pequeñas empresas',
      'herramientas para pymes',
      'organizar mi empresa',
    ],
    eyebrow: 'Pymes',
    h1: 'Software de gestión de proyectos para pymes',
    intro:
      'Las pymes no necesitan un sistema que tome meses implementar. Necesitan que el equipo deje de perder tareas y que el dueño sepa cómo va cada proyecto. QuinList se aprende en una tarde.',
    highlights: [
      'Se aprende en una tarde',
      'Plan gratis para siempre',
      'VIP por 15 USD/mes',
      'Soporte directo',
    ],
    sections: [
      {
        heading: 'Por qué las pymes eligen QuinList',
        bullets: [
          'Interfaz simple: el equipo lo usa sin capacitación',
          'Un solo pago de 15 USD al mes en el plan VIP',
          'Kanban, proyectos, chat de equipo y calendario en una sola herramienta',
          'Roles para separar lo que ve el dueño, el administrador y el equipo',
          'Presupuesto por proyecto en tu moneda',
        ],
      },
      {
        heading: 'Del caos al orden en una semana',
        steps: [
          {
            title: 'Día 1',
            text: 'Crea tu espacio y pasa las tareas del Excel o del grupo de WhatsApp a un tablero.',
          },
          {
            title: 'Día 2',
            text: 'Invita al equipo con un enlace y asigna responsables y fechas.',
          },
          {
            title: 'Día 5',
            text: 'Revisa el dashboard: ya sabes qué está atrasado sin preguntar.',
          },
        ],
      },
    ],
    faqs: [CTA_FAQ_PRICE, landingFaqs[6]!],
    related: ['/alternativa-a-excel-para-proyectos', '/software-gestion-de-tareas', '/precios'],
    updated: U,
  },

  {
    path: '/gestion-de-proyectos-de-software',
    kind: 'industria',
    navLabel: 'Equipos de software',
    title: 'Gestión de proyectos de software y desarrollo | QuinList',
    description:
      'Organiza sprints, incidencias y lanzamientos de tu equipo de desarrollo: Kanban, releases, OKRs y webhooks a Slack. Empieza gratis.',
    keywords: [
      'gestión de proyectos de software',
      'software para equipos de desarrollo',
      'gestión de sprints',
      'herramienta scrum',
      'seguimiento de incidencias',
    ],
    eyebrow: 'Equipos de software',
    h1: 'Gestión de proyectos de software para equipos de desarrollo',
    intro:
      'Sprints, incidencias, lanzamientos y objetivos en una sola herramienta. QuinList le da a tu equipo de desarrollo un tablero ágil y a la dirección una vista clara de fechas, riesgos y presupuesto.',
    highlights: ['Kanban para sprints', 'Incidencias y lanzamientos', 'OKRs del equipo', 'Webhooks a Slack'],
    sections: [
      {
        heading: 'Cómo lo usa un equipo de desarrollo',
        bullets: [
          'Tablero por sprint con columnas Backlog, En curso, Revisión y Hecho',
          'Prioridad, etiquetas (frontend, backend, UX) y checklist en cada tarjeta',
          'Módulo de incidencias para registrar errores y solicitudes',
          'Módulo de lanzamientos para planear versiones',
          'OKRs trimestrales para alinear el trabajo con los objetivos',
          'Avisos a Slack o webhooks cuando una tarjeta cambia de columna',
        ],
      },
      {
        heading: 'Para clientes y software a la medida',
        body: [
          'Si desarrollas software para clientes, crea un proyecto por contrato con hitos, entregables con aprobación, presupuesto y rentabilidad. El cliente puede ver el avance con un enlace público de solo lectura.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Sirve para trabajar con Scrum?',
        a: 'Sí. Puedes armar un tablero por sprint con tus columnas, prioridades y etiquetas, y usar los OKRs para los objetivos del trimestre.',
      },
      {
        q: '¿Se integra con GitHub?',
        a: 'Hoy no hay sincronización con GitHub. Puedes enviar los eventos del tablero a Slack o a cualquier URL con webhooks y conectarlos con n8n, Make o Zapier.',
      },
    ],
    related: ['/tablero-kanban-online', '/automatizacion-de-proyectos', '/guias/que-es-la-metodologia-kanban'],
    updated: U,
  },
  {
    path: '/gestion-de-proyectos-para-equipos-remotos',
    kind: 'industria',
    navLabel: 'Equipos remotos',
    title: 'Gestión de proyectos para equipos remotos | QuinList',
    description:
      'Coordina a tu equipo remoto o híbrido: tableros en tiempo real, chat con menciones, calendario y avance visible sin reuniones de seguimiento.',
    keywords: [
      'herramientas para equipos remotos',
      'gestión de equipos remotos',
      'trabajo remoto gestión de proyectos',
      'colaboración en tiempo real',
      'equipos híbridos',
    ],
    eyebrow: 'Trabajo remoto',
    h1: 'Gestión de proyectos para equipos remotos e híbridos',
    intro:
      'Cuando el equipo no comparte oficina, lo que no está escrito se pierde. QuinList junta las tareas, la conversación y el avance en un lugar que todos ven en tiempo real, desde cualquier ciudad.',
    highlights: ['Cambios en tiempo real', 'Chat con menciones', 'Presencia en línea', 'Menos reuniones'],
    sections: [
      {
        heading: 'Lo que necesita un equipo remoto',
        bullets: [
          'Tableros que se actualizan en tiempo real para todos',
          'Chat de equipo con canales, menciones y presencia en línea',
          'Comentarios en cada tarea para que las decisiones queden escritas',
          'Notificaciones cuando te asignan o te mencionan',
          'Calendario de eventos y vencimientos compartido',
          'Dashboard de avance para saber cómo va el proyecto sin una reunión',
        ],
      },
      {
        heading: 'Reglas simples para que funcione',
        steps: [
          { title: 'Todo trabajo es una tarjeta', text: 'Si no está en el tablero, no existe.' },
          { title: 'Un responsable por tarea', text: 'Siempre hay a quién preguntar.' },
          { title: 'Decisiones en comentarios', text: 'Nada importante se queda en un audio.' },
          { title: 'Revisión diaria de 10 minutos', text: 'Cada quien mueve sus tarjetas al empezar el día.' },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Funciona con personas en distintos países?',
        a: 'Sí. QuinList es una herramienta en la nube: todo el equipo ve los mismos tableros en tiempo real desde cualquier país.',
      },
    ],
    related: ['/software-gestion-de-tareas', '/tablero-kanban-online', '/guias/como-organizar-proyectos-de-una-empresa'],
    updated: U,
  },

  /* ---------------------------- Comparativas ---------------------------- */
  {
    path: '/alternativa-a-excel-para-proyectos',
    kind: 'comparativa',
    navLabel: 'Alternativa a Excel',
    title: 'Alternativa a Excel para gestionar proyectos | QuinList',
    description:
      '¿Tus proyectos viven en Excel, cuadernos y carpetas de Drive? Pásate a QuinList: tareas, cronograma y presupuesto en tiempo real. Empieza gratis.',
    keywords: [
      'alternativa a excel para proyectos',
      'dejar de usar excel',
      'gestionar proyectos sin excel',
      'plantilla de proyectos excel',
      'organizar proyectos en google drive',
    ],
    eyebrow: 'Excel, cuadernos y Drive',
    h1: 'La alternativa a Excel para gestionar tus proyectos',
    intro:
      'Excel es excelente para calcular, pero no para coordinar personas. Si tu equipo trabaja con un archivo compartido, un cuaderno y una carpeta de Drive, QuinList es el siguiente paso natural.',
    highlights: [
      'Una sola versión de la verdad',
      'Responsables y fechas',
      'Avisos automáticos',
      'Presupuesto sin fórmulas',
    ],
    sections: [
      {
        heading: 'Señales de que tu empresa ya superó el Excel',
        bullets: [
          'Hay varias versiones del mismo archivo y nadie sabe cuál es la última',
          'Preguntas por WhatsApp “¿cómo vas con…?” todos los días',
          'Los archivos del proyecto están repartidos entre Drive, el correo y el celular',
          'Te enteras de los atrasos cuando el cliente se queja',
          'El presupuesto se revisa al final, no durante el proyecto',
        ],
      },
      {
        heading: 'Cómo pasarte de Excel a QuinList',
        steps: [
          {
            title: 'Crea el proyecto',
            text: 'Usa el mismo nombre, cliente, fechas y presupuesto de tu hoja.',
          },
          {
            title: 'Pasa las filas a tareas',
            text: 'Cada fila de tu Excel se vuelve una tarea con responsable y fecha.',
          },
          {
            title: 'Sube los archivos clave',
            text: 'Adjunta los documentos a las tareas o a la documentación del proyecto.',
          },
          {
            title: 'Invita al equipo',
            text: 'Desde ese día, el estado del proyecto se actualiza solo.',
          },
        ],
      },
    ],
    comparison: {
      caption: 'Excel y carpetas frente a QuinList',
      headers: ['Necesidad', 'Excel + Drive + WhatsApp', 'QuinList'],
      rows: [
        ['Saber quién hace qué', 'Columna que nadie actualiza', 'Responsable en cada tarea'],
        ['Ver el avance', 'Hay que preguntar', 'Dashboard con % de avance'],
        ['Cronograma', 'Barras pintadas a mano', 'Gantt automático'],
        ['Presupuesto', 'Fórmulas frágiles', 'Libro mayor y flujo de caja'],
        ['Archivos', 'Carpetas sueltas', 'Centro de archivos por proyecto'],
        ['Conversación', 'Grupo de WhatsApp', 'Comentarios y chat del equipo'],
        ['Historial', 'No existe', 'Registro de actividad'],
      ],
    },
    faqs: [
      {
        q: '¿Puedo seguir usando Excel para algunas cosas?',
        a: 'Claro. Excel sigue siendo útil para análisis puntuales. QuinList reemplaza la parte de coordinar al equipo, seguir tareas y controlar el presupuesto del proyecto.',
      },
      CTA_FAQ_PRICE,
    ],
    related: [
      '/guias/como-organizar-proyectos-de-una-empresa',
      '/software-de-proyectos-para-pymes',
      '/software-gestion-de-proyectos',
    ],
    updated: U,
    disclaimer:
      'Excel es una marca registrada de Microsoft Corporation. Google Drive es una marca de Google LLC. QuinList no está afiliado a estas empresas.',
  },
  {
    path: '/alternativa-a-trello',
    kind: 'comparativa',
    navLabel: 'Alternativa a Trello',
    title: 'Alternativa a Trello con gestión de proyectos | QuinList',
    description:
      'Si te gusta el Kanban de Trello pero necesitas cronograma, presupuesto, riesgos y chat, prueba QuinList: Kanban + gestión de proyectos completa.',
    keywords: [
      'alternativa a trello',
      'trello en español',
      'mejor que trello',
      'trello vs quinlist',
      'herramienta tipo trello',
    ],
    eyebrow: 'Comparativa',
    h1: 'Una alternativa a Trello con gestión de proyectos completa',
    intro:
      'Trello popularizó el tablero Kanban. QuinList mantiene esa experiencia simple de mover tarjetas y le suma lo que un proyecto real necesita: cronograma, presupuesto, entregables, riesgos y chat de equipo.',
    highlights: [
      'Mismo Kanban sencillo',
      'Más módulos de proyecto',
      'Finanzas incluidas',
      'Hecho en Latinoamérica',
    ],
    sections: [
      {
        heading: 'Cuándo conviene QuinList',
        bullets: [
          'Necesitas controlar el presupuesto del proyecto además de las tareas',
          'Quieres cronograma Gantt sin instalar complementos',
          'Quieres soporte directo del equipo que construye la herramienta',
          'Quieres el chat del equipo junto al trabajo',
        ],
      },
      {
        heading: 'Cuándo puede convenir Trello',
        body: [
          'Si solo necesitas un tablero personal muy sencillo y ya usas el ecosistema de Atlassian, Trello puede ser suficiente. QuinList brilla cuando el tablero hace parte de un proyecto con fechas, dinero y entregables.',
        ],
      },
    ],
    comparison: {
      caption: 'Funciones incluidas en QuinList',
      headers: ['Función', 'Trello', 'QuinList'],
      rows: [
        ['Tablero Kanban', 'Sí', 'Sí'],
        ['Presupuesto y flujo de caja por proyecto', 'No es su enfoque', 'Incluido'],
        ['Cronograma Gantt', 'Según plan', 'Incluido en proyectos'],
        ['Riesgos y entregables', 'No es su enfoque', 'Incluido'],
        ['Chat de equipo', 'No incluido', 'Incluido'],
        ['Asistente de IA', 'Según plan', 'Plan VIP'],
      ],
    },
    faqs: [
      {
        q: '¿Puedo pasar mis tableros de Trello a QuinList?',
        a: 'Hoy puedes recrear tus listas y tarjetas en QuinList en pocos minutos. Si tienes muchos tableros, escríbenos a contacto@matubyte.com y te ayudamos.',
      },
      CTA_FAQ_PRICE,
    ],
    related: [
      '/tablero-kanban-online',
      '/alternativa-a-asana-y-monday',
      '/software-gestion-de-proyectos',
    ],
    updated: U,
    disclaimer:
      'Trello es una marca registrada de Atlassian. La comparación refleja el enfoque general de cada producto y puede cambiar; revisa el sitio oficial de cada herramienta. QuinList no está afiliado a Atlassian.',
  },
  {
    path: '/alternativa-a-asana-y-monday',
    kind: 'comparativa',
    navLabel: 'Alternativa a Asana y Monday',
    title: 'Alternativa a Asana y Monday para Latinoamérica | QuinList',
    description:
      'Una alternativa a Asana y Monday con precio simple de 15 USD/mes y finanzas del proyecto incluidas. Pensada para equipos de Latinoamérica.',
    keywords: [
      'alternativa a asana',
      'alternativa a monday',
      'asana en español',
      'monday alternativa barata',
      'software de proyectos latinoamérica',
    ],
    eyebrow: 'Comparativa',
    h1: 'Una alternativa a Asana y Monday hecha para Latinoamérica',
    intro:
      'Asana y Monday son herramientas potentes y muy completas. QuinList se enfoca en lo que piden los equipos de la región: precio simple, soporte cercano y el dinero del proyecto junto a las tareas.',
    highlights: [
      'Precio simple: 15 USD/mes',
      'Finanzas del proyecto',
      'Moneda local',
      'Soporte cercano',
    ],
    sections: [
      {
        heading: 'Lo que hace distinto a QuinList',
        bullets: [
          'Precio fijo del plan VIP: 15 USD al mes, sin módulos extra',
          'Presupuesto, ingresos, egresos y rentabilidad en cada proyecto',
          'Moneda por proyecto: COP, MXN, PEN, CLP, ARS, USD y más',
          'Chat de equipo integrado',
          'Equipo detrás del producto en Colombia, en tu zona horaria',
        ],
      },
      {
        heading: 'Cuándo conviene una herramienta global',
        body: [
          'Si tu empresa ya tiene cientos de integraciones conectadas o necesita flujos muy específicos de gran corporación, una herramienta global puede convenir. Para equipos que quieren ordenarse rápido y controlar tiempos y dinero, QuinList es más directo.',
        ],
      },
    ],
    faqs: [CTA_FAQ_PRICE, landingFaqs[3]!],
    related: ['/alternativa-a-trello', '/control-de-presupuesto-de-proyectos', '/precios'],
    updated: U,
    disclaimer:
      'Asana es una marca registrada de Asana, Inc. Monday.com es una marca registrada de monday.com Ltd. QuinList no está afiliado a estas empresas. Revisa el sitio oficial de cada herramienta para ver sus funciones y precios actuales.',
  },

  /* ---------------------------- Países ---------------------------- */
  countryPage({
    slug: 'colombia',
    name: 'Colombia',
    code: 'CO',
    currency: 'COP',
    currencyName: 'pesos colombianos',
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga'],
    context:
      'QuinList nace en Colombia, en MatuByte S.A.S. Lo construimos para la forma en que trabajan los equipos colombianos: proyectos con anticipo del cliente, pagos por hito y mucha coordinación por WhatsApp que conviene pasar a un sistema ordenado.',
    industries:
      'Lo usan agencias de marketing y desarrollo, constructoras y contratistas, consultoras, equipos de tecnología y pymes de servicios que necesitan ver tareas y dinero en el mismo lugar.',
    paymentNote: 'En Colombia pagas en pesos, a la tasa del día, a través de Landa Pay.',
    extraFaq: {
      q: '¿QuinList es una empresa colombiana?',
      a: 'Sí. QuinList es un producto de MatuByte S.A.S., empresa colombiana. El soporte es en español y en hora de Colombia.',
    },
  }),
  countryPage({
    slug: 'mexico',
    name: 'México',
    code: 'MX',
    currency: 'MXN',
    currencyName: 'pesos mexicanos',
    cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Querétaro'],
    context:
      'En México muchos equipos trabajan con clientes en varias ciudades y zonas horarias. Con QuinList todo el equipo ve el mismo tablero en tiempo real, sin importar si está en CDMX, Monterrey o trabajando remoto.',
    industries:
      'Es útil para agencias, despachos de consultoría, desarrolladoras de software, constructoras y áreas de operaciones de empresas medianas que quieren pasar de Excel a un sistema claro.',
    paymentNote: 'El precio se publica en dólares para que sea el mismo en toda la región.',
    extraFaq: {
      q: '¿Puedo usar QuinList con clientes de Estados Unidos?',
      a: 'Sí. Cada proyecto puede tener su propia moneda, así que puedes llevar unos proyectos en MXN y otros en USD.',
    },
  }),
  countryPage({
    slug: 'peru',
    name: 'Perú',
    code: 'PE',
    currency: 'PEN',
    currencyName: 'soles',
    cities: ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Piura'],
    context:
      'Equipos de Lima a Arequipa usan QuinList para ordenar proyectos que antes vivían en cuadernos y hojas de cálculo. El presupuesto se lleva en soles y el avance se ve sin pedir reportes.',
    industries:
      'Funciona para constructoras, consultoras, agencias, equipos de minería y energía que coordinan contratistas, y pymes de servicios.',
    paymentNote: 'El precio se publica en dólares para que sea el mismo en toda la región.',
    extraFaq: {
      q: '¿Puedo llevar proyectos en soles y en dólares?',
      a: 'Sí. Cada proyecto tiene su moneda: puedes tener unos en PEN y otros en USD dentro del mismo espacio de trabajo.',
    },
  }),
  countryPage({
    slug: 'ecuador',
    name: 'Ecuador',
    code: 'EC',
    currency: 'USD',
    currencyName: 'dólares',
    cities: ['Quito', 'Guayaquil', 'Cuenca', 'Manta', 'Loja'],
    context:
      'Como en Ecuador la moneda es el dólar, el precio de QuinList en USD es directo: sin conversiones. El presupuesto de cada proyecto también se lleva en dólares.',
    industries:
      'Lo aprovechan agencias, constructoras, exportadoras que coordinan logística, consultoras y equipos de tecnología en Quito, Guayaquil y Cuenca.',
    paymentNote: 'Como el precio está en dólares, en Ecuador no hay conversión de moneda.',
    extraFaq: {
      q: '¿Hay soporte en horario de Ecuador?',
      a: 'Sí. Ecuador y Colombia comparten zona horaria, así que el soporte en español funciona en tu mismo horario.',
    },
  }),
  countryPage({
    slug: 'chile',
    name: 'Chile',
    code: 'CL',
    currency: 'CLP',
    currencyName: 'pesos chilenos',
    cities: ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'La Serena'],
    context:
      'En Chile QuinList ayuda a equipos que necesitan ordenar varios proyectos al mismo tiempo, con presupuesto en pesos chilenos y responsables claros para cada entrega.',
    industries:
      'Sirve a constructoras, consultoras de ingeniería, agencias, empresas de servicios y equipos de software en Santiago y regiones.',
    paymentNote: 'El precio se publica en dólares para que sea el mismo en toda la región.',
    extraFaq: {
      q: '¿Funciona para equipos en regiones?',
      a: 'Sí. Al ser una herramienta en la nube, el equipo en terreno y el de la oficina ven la misma información en tiempo real.',
    },
  }),
  countryPage({
    slug: 'argentina',
    name: 'Argentina',
    code: 'AR',
    currency: 'ARS',
    currencyName: 'pesos argentinos',
    cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'],
    context:
      'En un contexto donde los precios cambian rápido, ver el presupuesto del proyecto en tiempo real vale oro. QuinList te deja llevar proyectos en pesos argentinos o en dólares, y comparar lo gastado contra lo planeado en cualquier momento.',
    industries:
      'Lo usan agencias y estudios, software factories, consultoras, constructoras y pymes que trabajan con clientes locales y del exterior.',
    paymentNote: 'El precio se publica en dólares para que sea el mismo en toda la región.',
    extraFaq: {
      q: '¿Puedo tener proyectos en pesos y en dólares?',
      a: 'Sí. Cada proyecto tiene su propia moneda: ARS para clientes locales y USD para clientes del exterior, en el mismo espacio de trabajo.',
    },
  }),

  /* ---------------------------- Guías ---------------------------- */
  {
    path: '/guias/como-organizar-proyectos-de-una-empresa',
    kind: 'guia',
    navLabel: 'Cómo organizar los proyectos de una empresa',
    title: 'Cómo organizar los proyectos de tu empresa | QuinList',
    description:
      'Guía práctica para organizar los proyectos de tu empresa: de Excel, cuadernos y Drive a un sistema claro con responsables, fechas y presupuesto.',
    keywords: [
      'cómo organizar proyectos',
      'cómo organizar los proyectos de una empresa',
      'organizar el trabajo del equipo',
      'gestión de proyectos paso a paso',
      'cómo llevar el control de proyectos',
    ],
    eyebrow: 'Guía',
    h1: 'Cómo organizar los proyectos de tu empresa en 7 pasos',
    intro:
      'Si tus proyectos viven entre un Excel, un cuaderno, un grupo de WhatsApp y varias carpetas de Drive, esta guía es para ti. Son siete pasos que puedes aplicar con cualquier herramienta, y al final te mostramos cómo hacerlo en QuinList.',
    highlights: ['7 pasos prácticos', 'Sirve para cualquier equipo', 'Lectura de 6 minutos'],
    sections: [
      {
        heading: '1. Haz un inventario de todos los proyectos',
        body: [
          'Escribe en una sola lista todo lo que está abierto: proyectos de clientes, proyectos internos y “cosas pendientes” que en realidad son proyectos. Para cada uno anota cliente, responsable y fecha de entrega. Muchas empresas descubren aquí que tienen el doble de proyectos de los que creían.',
        ],
      },
      {
        heading: '2. Define un responsable por proyecto y por tarea',
        body: [
          'Un proyecto con tres responsables no tiene ninguno. Asigna una persona que responda por cada proyecto y una por cada tarea. Los demás pueden colaborar, pero hay un nombre al que preguntar.',
        ],
      },
      {
        heading: '3. Parte cada proyecto en entregables e hitos',
        body: [
          'Un entregable es algo que el cliente recibe y aprueba. Un hito es un punto de control con fecha. Si un proyecto no tiene hitos, solo sabrás que va mal al final.',
        ],
      },
      {
        heading: '4. Convierte los entregables en tareas con fecha',
        body: [
          'Cada entregable se divide en tareas pequeñas, de uno a cinco días, con fecha de inicio y fin. Esas fechas son las que arman tu cronograma.',
        ],
      },
      {
        heading: '5. Visualiza el flujo con un tablero Kanban',
        body: [
          'Usa columnas como Por hacer, En curso, En revisión y Hecho. Revisar el tablero diez minutos al día reemplaza la mayoría de reuniones de “¿cómo vamos?”.',
        ],
      },
      {
        heading: '6. Controla el dinero mientras avanzas',
        body: [
          'Define el presupuesto base y registra cada ingreso y egreso apenas ocurre. Compara el porcentaje de presupuesto consumido con el porcentaje de avance: si gastaste el 70% y vas en el 40%, hay que actuar ya.',
        ],
      },
      {
        heading: '7. Centraliza archivos y conversaciones',
        body: [
          'Los documentos van con el proyecto o con la tarea, no en carpetas sueltas. Las decisiones quedan en los comentarios, no en audios de WhatsApp.',
        ],
      },
      {
        heading: 'Cómo aplicar estos pasos en QuinList',
        steps: [
          {
            title: 'Crea un proyecto por cada ítem del inventario',
            text: 'Con cliente, responsable, fechas, presupuesto y moneda.',
          },
          {
            title: 'Agrega hitos, entregables y tareas',
            text: 'El cronograma Gantt se arma solo con las fechas.',
          },
          {
            title: 'Abre las tareas en un tablero',
            text: 'El equipo trabaja en Kanban y tú ves el proyecto completo.',
          },
          {
            title: 'Registra ingresos y egresos',
            text: 'El saldo, el flujo de caja y la rentabilidad se calculan solos.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Cuál es la mejor forma de organizar proyectos en una empresa pequeña?',
        a: 'Una lista única de proyectos, un responsable por proyecto y por tarea, entregables con fecha y un tablero Kanban que el equipo revise a diario. Una herramienta como QuinList junta todo eso en un solo lugar.',
      },
      {
        q: '¿Es mejor Excel o un software de gestión de proyectos?',
        a: 'Excel funciona para una persona. Cuando varias personas trabajan en varios proyectos, un software de gestión de proyectos evita versiones duplicadas, asigna responsables y muestra el avance en tiempo real.',
      },
    ],
    related: [
      '/alternativa-a-excel-para-proyectos',
      '/guias/como-hacer-un-cronograma-de-proyecto',
      '/software-gestion-de-proyectos',
    ],
    updated: U,
  },
  {
    path: '/guias/como-hacer-un-cronograma-de-proyecto',
    kind: 'guia',
    navLabel: 'Cómo hacer un cronograma de proyecto',
    title: 'Cómo hacer un cronograma de proyecto paso a paso | QuinList',
    description:
      'Aprende a hacer un cronograma de proyecto: lista de actividades, duración, dependencias, hitos y diagrama de Gantt. Con ejemplo práctico.',
    keywords: [
      'cómo hacer un cronograma de proyecto',
      'cronograma de actividades',
      'cómo hacer un diagrama de gantt',
      'ejemplo de cronograma de proyecto',
      'planificación de proyectos',
    ],
    eyebrow: 'Guía',
    h1: 'Cómo hacer un cronograma de proyecto, paso a paso',
    intro:
      'Un buen cronograma responde tres preguntas: qué se hace, en qué orden y para cuándo. Esta guía te lleva de una lista de actividades a un diagrama de Gantt que el equipo puede seguir.',
    highlights: ['Con ejemplo práctico', '5 pasos', 'Lectura de 5 minutos'],
    sections: [
      {
        heading: '1. Lista todas las actividades',
        body: [
          'Escribe todo lo que hay que hacer para terminar el proyecto. Si una actividad tarda más de dos semanas, divídela. Ejemplo para el lanzamiento de una página web: brief, diseño, contenido, desarrollo, pruebas, publicación.',
        ],
      },
      {
        heading: '2. Estima la duración de cada una',
        body: [
          'Pregunta a quien la va a hacer. Usa días hábiles y agrega un margen del 10 al 20% en las actividades con más incertidumbre.',
        ],
      },
      {
        heading: '3. Ordena por dependencias',
        body: [
          'Algunas actividades no pueden empezar hasta que otra termine: no se desarrolla sin diseño aprobado. Ordénalas y marca cuáles pueden ir en paralelo.',
        ],
      },
      {
        heading: '4. Marca los hitos',
        body: [
          'Los hitos son puntos de control con fecha: diseño aprobado, versión de pruebas, lanzamiento. Son los momentos para revisar el avance con el cliente o la dirección.',
        ],
      },
      {
        heading: '5. Dibuja el diagrama de Gantt y mantenlo vivo',
        body: [
          'Pon cada actividad como una barra entre su fecha de inicio y de fin. El error más común es hacer el cronograma una vez y no volver a mirarlo. Un cronograma sirve si se actualiza cuando cambia la realidad.',
        ],
      },
      {
        heading: 'Hazlo en QuinList en minutos',
        steps: [
          { title: 'Crea el proyecto', text: 'Con fecha de inicio y de entrega.' },
          {
            title: 'Agrega las tareas con fechas',
            text: 'Cada tarea con responsable, inicio y fin.',
          },
          { title: 'Crea los hitos', text: 'Con su fecha de vencimiento.' },
          {
            title: 'Abre la vista de cronograma',
            text: 'El Gantt aparece con la línea de hoy y colores por estado.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué debe tener un cronograma de proyecto?',
        a: 'Actividades, duración, fechas de inicio y fin, responsables, dependencias e hitos.',
      },
      {
        q: '¿Qué diferencia hay entre cronograma y diagrama de Gantt?',
        a: 'El cronograma es el plan de actividades y fechas. El diagrama de Gantt es la forma gráfica más usada para mostrarlo, con barras en una línea de tiempo.',
      },
    ],
    related: [
      '/diagrama-de-gantt-online',
      '/guias/como-organizar-proyectos-de-una-empresa',
      '/software-gestion-de-proyectos',
    ],
    updated: U,
  },

  {
    path: '/guias/que-es-la-metodologia-kanban',
    kind: 'guia',
    navLabel: 'Qué es la metodología Kanban',
    title: 'Qué es Kanban: metodología, tablero y ejemplos | QuinList',
    description:
      'Qué es la metodología Kanban, cómo funciona un tablero Kanban, sus principios, límites de trabajo en curso y un ejemplo para empezar hoy.',
    keywords: ['qué es kanban', 'metodología kanban', 'tablero kanban ejemplo', 'principios de kanban', 'kanban vs scrum'],
    eyebrow: 'Guía',
    h1: 'Qué es la metodología Kanban y cómo usarla en tu equipo',
    intro:
      'Kanban es un método visual para gestionar el trabajo: cada tarea es una tarjeta que avanza por columnas que representan etapas. Nació en las fábricas de Toyota y hoy lo usan equipos de software, marketing, operaciones y servicios.',
    highlights: ['Definición y origen', 'Principios', 'Ejemplo práctico'],
    sections: [
      {
        heading: 'Cómo funciona un tablero Kanban',
        body: [
          'Un tablero Kanban tiene columnas, como Por hacer, En curso y Hecho, y tarjetas que representan tareas. Cuando alguien empieza una tarea, mueve su tarjeta a En curso; cuando la termina, a Hecho. Con mirar el tablero, todo el equipo sabe el estado real del trabajo.',
        ],
      },
      {
        heading: 'Los 4 principios de Kanban',
        bullets: [
          'Visualizar el trabajo: todo lo que el equipo hace está en el tablero',
          'Limitar el trabajo en curso: pocas tareas a la vez se terminan más rápido',
          'Gestionar el flujo: detectar dónde se acumulan las tarjetas y destrabar',
          'Mejorar de forma continua: ajustar columnas y reglas con lo aprendido',
        ],
      },
      {
        heading: 'Kanban o Scrum',
        body: [
          'Scrum trabaja en ciclos fijos (sprints) con roles definidos. Kanban es un flujo continuo sin sprints obligatorios. Muchos equipos combinan los dos: planean por sprints y ejecutan en un tablero Kanban.',
        ],
      },
      {
        heading: 'Arma tu primer tablero Kanban en QuinList',
        steps: [
          { title: 'Crea un tablero', text: 'Con las columnas Por hacer, En curso, En revisión y Hecho.' },
          { title: 'Agrega las tareas', text: 'Una tarjeta por tarea, con responsable, fecha y prioridad.' },
          { title: 'Fija un límite', text: 'Acuerden un máximo de tarjetas En curso por persona.' },
          { title: 'Revisa a diario', text: 'Diez minutos al día moviendo tarjetas reemplazan muchas reuniones.' },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué significa Kanban?',
        a: 'Kanban es una palabra japonesa que significa “tarjeta visual” o “letrero”. En gestión de proyectos se refiere al método de organizar el trabajo con tarjetas en columnas.',
      },
      {
        q: '¿Kanban sirve para equipos que no son de software?',
        a: 'Sí. Funciona para cualquier trabajo que pase por etapas: ventas, marketing, soporte, compras, obras o atención al cliente.',
      },
    ],
    related: ['/tablero-kanban-online', '/gestion-de-proyectos-de-software', '/guias/como-organizar-proyectos-de-una-empresa'],
    updated: U,
  },
  {
    path: '/guias/como-calcular-la-rentabilidad-de-un-proyecto',
    kind: 'guia',
    navLabel: 'Cómo calcular la rentabilidad de un proyecto',
    title: 'Cómo calcular la rentabilidad de un proyecto | QuinList',
    description:
      'Fórmula para calcular la rentabilidad de un proyecto, con ejemplo paso a paso: ingresos, costos, margen y cómo controlarla mientras avanzas.',
    keywords: [
      'rentabilidad de un proyecto',
      'cómo calcular la rentabilidad',
      'margen de un proyecto',
      'fórmula de rentabilidad',
      'costos de un proyecto',
    ],
    eyebrow: 'Guía',
    h1: 'Cómo calcular la rentabilidad de un proyecto (con ejemplo)',
    intro:
      'La rentabilidad de un proyecto es el porcentaje de ganancia que queda después de restar sus costos a sus ingresos. Calcularla al final sirve de poco: el valor está en seguirla mientras el proyecto avanza.',
    highlights: ['Fórmula simple', 'Ejemplo con números', 'Cómo controlarla'],
    sections: [
      {
        heading: 'La fórmula',
        body: [
          'Rentabilidad (%) = (Ingresos del proyecto − Costos del proyecto) ÷ Ingresos del proyecto × 100.',
          'Los ingresos son lo que el cliente paga: anticipos, facturas por hito y pagos finales. Los costos son todo lo que gastas para entregar: personal, materiales, herramientas, servicios y viajes.',
        ],
      },
      {
        heading: 'Ejemplo',
        bullets: [
          'Contrato con el cliente: 40.000.000',
          'Personal: 18.000.000',
          'Materiales y servicios: 9.000.000',
          'Herramientas y viajes: 3.000.000',
          'Costos totales: 30.000.000',
          'Rentabilidad: (40.000.000 − 30.000.000) ÷ 40.000.000 × 100 = 25%',
        ],
      },
      {
        heading: 'Cómo protegerla durante el proyecto',
        body: [
          'Compara el porcentaje del presupuesto consumido con el porcentaje de avance. Si llevas el 70% del gasto y el 40% del trabajo, la rentabilidad final va a caer. Detectarlo a tiempo te deja renegociar alcance, facturar un hito o recortar costos.',
        ],
      },
      {
        heading: 'Hazlo automático en QuinList',
        steps: [
          { title: 'Define presupuesto y meta', text: 'Al crear el proyecto, pon el presupuesto base y la rentabilidad objetivo.' },
          { title: 'Registra ingresos y egresos', text: 'Cada movimiento con su categoría y comprobante.' },
          { title: 'Mira los indicadores', text: 'Saldo, flujo de caja y rentabilidad se calculan solos.' },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué es una buena rentabilidad para un proyecto?',
        a: 'Depende del sector y del tipo de contrato. Lo importante es fijar una meta antes de empezar y medirla durante el proyecto, no solo al final.',
      },
      {
        q: '¿Cuál es la diferencia entre margen y rentabilidad?',
        a: 'En el día a día se usan como sinónimos. En rigor, el margen compara la ganancia con los ingresos, y la rentabilidad sobre la inversión la compara con lo invertido.',
      },
    ],
    related: ['/control-de-presupuesto-de-proyectos', '/gestion-de-proyectos-para-agencias', '/gestion-de-proyectos-de-construccion'],
    updated: U,
  },
  {
    path: '/guias/matriz-de-riesgos-de-un-proyecto',
    kind: 'guia',
    navLabel: 'Matriz de riesgos de un proyecto',
    title: 'Matriz de riesgos de un proyecto: cómo hacerla | QuinList',
    description:
      'Cómo hacer una matriz de riesgos para tu proyecto: identificar, calificar por probabilidad e impacto, planes de mitigación y seguimiento.',
    keywords: [
      'matriz de riesgos',
      'matriz de riesgos de un proyecto',
      'gestión de riesgos',
      'plan de mitigación',
      'ejemplo de matriz de riesgos',
    ],
    eyebrow: 'Guía',
    h1: 'Cómo hacer la matriz de riesgos de un proyecto',
    intro:
      'Una matriz de riesgos es una lista de lo que podría salir mal en un proyecto, calificado por probabilidad e impacto, con un responsable y un plan para cada riesgo. Sirve para actuar antes de que el problema llegue al cliente.',
    highlights: ['Paso a paso', 'Ejemplos de riesgos', 'Plan de mitigación'],
    sections: [
      {
        heading: '1. Identifica los riesgos',
        body: [
          'Reúne al equipo 30 minutos y pregunta: ¿qué podría retrasar, encarecer o arruinar este proyecto? Ejemplos: el cliente tarda en aprobar, un proveedor no entrega, una persona clave se ausenta, el alcance crece sin pagar más.',
        ],
      },
      {
        heading: '2. Califica cada riesgo',
        body: [
          'Dale a cada riesgo una severidad según su probabilidad y su impacto. Una escala simple funciona bien: baja, media, alta y crítica.',
        ],
      },
      {
        heading: '3. Define responsable y estrategia',
        bullets: [
          'Evitar: cambiar el plan para que el riesgo no ocurra',
          'Reducir: bajar la probabilidad o el impacto',
          'Transferir: pasar el riesgo a un tercero (seguro, contrato)',
          'Aceptar: asumirlo y tener un plan de contingencia',
        ],
      },
      {
        heading: '4. Haz seguimiento',
        body: [
          'Revisa la matriz cada semana. Cuando un riesgo ocurre se convierte en incidencia y necesita acción inmediata; cuando deja de ser probable, se cierra.',
        ],
      },
      {
        heading: 'Tu matriz de riesgos en QuinList',
        steps: [
          { title: 'Abre el módulo de riesgos', text: 'Dentro de cada proyecto.' },
          { title: 'Registra riesgo o incidencia', text: 'Con severidad, responsable y plan de mitigación.' },
          { title: 'Actualiza el estado', text: 'Abierto, mitigado o cerrado. Los riesgos críticos se ven en los indicadores.' },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué diferencia hay entre riesgo e incidencia?',
        a: 'Un riesgo es algo que podría pasar. Una incidencia es algo que ya pasó y está afectando el proyecto.',
      },
      {
        q: '¿Cada cuánto se revisa la matriz de riesgos?',
        a: 'En la mayoría de proyectos basta con una revisión semanal, y siempre que cambie el alcance o aparezca un problema nuevo.',
      },
    ],
    related: ['/gestion-de-proyectos-de-construccion', '/software-gestion-de-proyectos', '/guias/como-organizar-proyectos-de-una-empresa'],
    updated: U,
  },
  {
    path: '/guias/que-son-los-okr',
    kind: 'guia',
    navLabel: 'Qué son los OKR',
    title: 'Qué son los OKR: ejemplos para tu empresa | QuinList',
    description:
      'Qué son los OKR (objetivos y resultados clave), cómo escribirlos, ejemplos para ventas, marketing y operaciones, y cómo hacerles seguimiento.',
    keywords: ['qué son los okr', 'okr ejemplos', 'objetivos y resultados clave', 'cómo definir okr', 'okr para empresas'],
    eyebrow: 'Guía',
    h1: 'Qué son los OKR y cómo usarlos en tu empresa',
    intro:
      'OKR significa “Objetivos y Resultados Clave”. Es un método para fijar metas: un objetivo claro y de 2 a 5 resultados medibles que dicen si lo lograste. Se definen por trimestre, semestre o año.',
    highlights: ['Definición', 'Ejemplos por área', 'Errores comunes'],
    sections: [
      {
        heading: 'Cómo se escribe un OKR',
        body: [
          'El objetivo es cualitativo y claro: “Ser la opción preferida de las pymes de la ciudad”. Los resultados clave son números: “Pasar de 40 a 70 clientes activos”, “Subir la satisfacción de 7,5 a 8,5”.',
        ],
      },
      {
        heading: 'Ejemplos por área',
        bullets: [
          'Ventas, aumentar la recurrencia: 30% de clientes renuevan; 15 contratos nuevos.',
          'Marketing, ser visibles en Google: 5.000 visitas orgánicas al mes; 200 registros.',
          'Operaciones, entregar a tiempo: 90% de proyectos en fecha; 0 incidencias críticas abiertas.',
        ],
      },
      {
        heading: 'Errores comunes',
        bullets: [
          'Poner tareas como resultados clave (“hacer una campaña” no es un resultado)',
          'Tener demasiados objetivos: con 2 o 3 por periodo basta',
          'Definirlos y no revisarlos hasta el final del periodo',
        ],
      },
      {
        heading: 'OKRs en QuinList',
        steps: [
          { title: 'Crea el objetivo', text: 'Elige periodo trimestral, semestral o anual.' },
          { title: 'Agrega los resultados clave', text: 'Con su meta numérica.' },
          { title: 'Actualiza el avance', text: 'Revisa el progreso junto a tus tableros y proyectos.' },
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué diferencia hay entre OKR y KPI?',
        a: 'Un KPI mide la salud de algo de forma continua, como las ventas del mes. Un OKR es una meta de mejora para un periodo, y sus resultados clave suelen usar KPIs.',
      },
    ],
    related: ['/software-gestion-de-proyectos', '/guias/como-organizar-proyectos-de-una-empresa', '/software-de-proyectos-para-pymes'],
    updated: U,
  },
  {
    path: '/guias',
    kind: 'guia',
    hub: true,
    navLabel: 'Todas las guías',
    title: 'Guías de gestión de proyectos para empresas | QuinList',
    description:
      'Guías prácticas y gratuitas de gestión de proyectos: organizar el trabajo, cronogramas, Kanban, rentabilidad, riesgos y OKR, con ejemplos.',
    keywords: [
      'guías de gestión de proyectos',
      'cómo gestionar proyectos',
      'gestión de proyectos para principiantes',
      'aprender gestión de proyectos',
    ],
    eyebrow: 'Guías',
    h1: 'Guías prácticas de gestión de proyectos',
    intro:
      'Artículos cortos y aplicables para ordenar los proyectos de tu empresa, con o sin software. Cada guía termina con un paso a paso para hacerlo en QuinList.',
    highlights: ['Gratis', 'Con ejemplos', 'Para cualquier equipo'],
    sections: [
      {
        heading: 'Por dónde empezar',
        body: [
          'Si tus proyectos viven en Excel o en WhatsApp, empieza por la guía de cómo organizar los proyectos de una empresa. Si ya tienes un orden básico, sigue con el cronograma, el Kanban y el control de la rentabilidad.',
        ],
      },
    ],
    faqs: [],
    related: [],
    updated: U,
  },

  /* ---------------------------- Precios ---------------------------- */
  {
    path: '/precios',
    kind: 'precios',
    navLabel: 'Precios',
    title: 'Precios de QuinList: plan Gratis y VIP por 15 USD/mes',
    description:
      'QuinList tiene plan Gratis para siempre (1 tablero y 1 proyecto) y plan VIP por 15 USD al mes con todo ilimitado y asistente de IA. Sin contratos.',
    keywords: [
      'precio software gestión de proyectos',
      'software de proyectos barato',
      'quinlist precio',
      'gestor de proyectos gratis',
      'software de proyectos gratis',
    ],
    eyebrow: 'Precios',
    h1: 'Precios simples: empieza gratis, crece con VIP',
    intro:
      'Sin cotizaciones ni letra pequeña. Usa QuinList gratis el tiempo que quieras y pasa a VIP cuando tu equipo necesite más tableros, más proyectos y el asistente de IA.',
    highlights: [
      'Plan Gratis para siempre',
      'VIP: 15 USD al mes',
      'Sin tarjeta para empezar',
      'Cancela cuando quieras',
    ],
    sections: [
      {
        heading: 'Qué incluye cada plan',
        bullets: [
          'Gratis: 1 tablero Kanban y 1 proyecto con todos sus módulos',
          'Gratis: chat de equipo, calendario, notificaciones y roles',
          'VIP: tableros ilimitados',
          'VIP: proyectos ilimitados',
          'VIP: asistente de IA',
        ],
      },
      {
        heading: 'Cómo se paga',
        body: [
          'El plan VIP cuesta 15 USD al mes. El cobro se hace en pesos colombianos a la tasa del día, a través de Landa Pay.',
        ],
      },
    ],
    faqs: [
      {
        q: '¿El plan gratis tiene fecha de vencimiento?',
        a: 'No. El plan Gratis es para siempre, con 1 tablero y 1 proyecto.',
      },
      {
        q: '¿Necesito tarjeta de crédito para empezar?',
        a: 'No. Creas tu cuenta y empiezas en el plan Gratis sin tarjeta.',
      },
      {
        q: '¿Puedo cancelar el plan VIP?',
        a: 'Sí. Es una suscripción mensual sin contrato de permanencia.',
      },
      {
        q: '¿Tienen planes para empresas grandes?',
        a: 'Escríbenos a contacto@matubyte.com y armamos una propuesta para tu empresa.',
      },
    ],
    related: [
      '/software-gestion-de-proyectos',
      '/gestion-de-proyectos-con-ia',
      '/software-de-proyectos-para-pymes',
    ],
    updated: U,
  },
]

export const marketingPageByPath: Record<string, MarketingPage> = Object.fromEntries(
  marketingPages.map((p) => [p.path, p]),
)

export function getMarketingPage(path: string): MarketingPage | undefined {
  const key = path.split('?')[0]!.replace(/\/$/, '') || '/'
  return marketingPageByPath[key]
}

export const marketingGroups: { title: string; kind: MarketingKind }[] = [
  { title: 'Soluciones', kind: 'solucion' },
  { title: 'Para tu equipo', kind: 'industria' },
  { title: 'Comparativas', kind: 'comparativa' },
  { title: 'Países', kind: 'pais' },
  { title: 'Guías', kind: 'guia' },
]

export function pagesOfKind(kind: MarketingKind) {
  return marketingPages.filter((p) => p.kind === kind)
}
