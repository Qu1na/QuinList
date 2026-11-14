/**
 * Blog de QuinList: segmentos (categorías) y entradas.
 *
 * Cada entrada se arma con bloques (párrafo, subtítulo, lista, tabla, consejo, CTA…).
 * Lo usan la vista del blog, el prerender (HTML estático), el sitemap, el RSS y llms.txt.
 *
 * Para publicar una entrada nueva: agrégala a `blogPosts`, corre `npm run build` y pide la
 * indexación de la URL en Search Console. Solo afirma lo que QuinList hace de verdad.
 */
import type { IconName } from '@/seo/showcase'
import type { MarketingFaq } from '@/seo/marketing'

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'tip'; title: string; text: string }
  | { type: 'table'; caption: string; headers: string[]; rows: string[][] }
  | { type: 'cta'; text: string; to: string; label: string }

export interface BlogSegment {
  slug: string
  name: string
  /** Descripción corta para tarjetas y meta description. */
  description: string
  icon: IconName
  /** Color de la portada (decorativo). */
  cover: 'blue' | 'lavender' | 'navy' | 'fog'
}

export interface BlogPost {
  slug: string
  segment: string
  /** <title> (máx. ~60 caracteres). */
  title: string
  /** Meta description (120–155 caracteres). */
  description: string
  h1: string
  excerpt: string
  keywords: string[]
  published: string
  updated: string
  body: BlogBlock[]
  faqs: MarketingFaq[]
  /** Páginas de producto relacionadas (enlazado interno). */
  related: string[]
}

export const BLOG_UPDATED = '2026-11-14'

export const blogSegments: BlogSegment[] = [
  {
    slug: 'gestion-de-proyectos',
    name: 'Gestión de proyectos',
    description: 'Planificar, priorizar y entregar a tiempo: métodos prácticos para equipos que manejan varios proyectos.',
    icon: 'FolderKanban',
    cover: 'blue',
  },
  {
    slug: 'finanzas-de-proyectos',
    name: 'Finanzas de proyectos',
    description: 'Presupuesto, cobros, flujo de caja y rentabilidad: cómo saber si un proyecto te está dejando plata.',
    icon: 'Coins',
    cover: 'lavender',
  },
  {
    slug: 'equipos-y-productividad',
    name: 'Equipos y productividad',
    description: 'Coordinar personas sin perseguirlas: delegar, comunicar y trabajar en equipo, en oficina o remoto.',
    icon: 'Users',
    cover: 'navy',
  },
  {
    slug: 'herramientas',
    name: 'Herramientas y comparativas',
    description: 'Excel, Kanban, Gantt y software: qué herramienta conviene según el tamaño y el tipo de tu equipo.',
    icon: 'Layers',
    cover: 'fog',
  },
]

/* ------------------------------------------------------------------ */
/* Ayudas para escribir entradas                                       */
/* ------------------------------------------------------------------ */

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const p = (text: string): BlogBlock => ({ type: 'p', text })
const h2 = (text: string): BlogBlock => ({ type: 'h2', text, id: slugify(text) })
const h3 = (text: string): BlogBlock => ({ type: 'h3', text })
const ul = (...items: string[]): BlogBlock => ({ type: 'ul', items })
const ol = (...items: string[]): BlogBlock => ({ type: 'ol', items })
const tip = (title: string, text: string): BlogBlock => ({ type: 'tip', title, text })
const quote = (text: string): BlogBlock => ({ type: 'quote', text })
const cta = (text: string, to = '/register?plan=free', label = 'Empieza gratis'): BlogBlock => ({
  type: 'cta',
  text,
  to,
  label,
})

/* ------------------------------------------------------------------ */
/* Entradas                                                            */
/* ------------------------------------------------------------------ */

export const blogPosts: BlogPost[] = [
  /* ===================== Gestión de proyectos ===================== */
  {
    slug: 'senales-de-que-necesitas-un-software-de-proyectos',
    segment: 'gestion-de-proyectos',
    title: '7 señales de que necesitas un software de proyectos',
    description:
      'Versiones duplicadas, tareas perdidas en WhatsApp y presupuestos que se descubren al final. Siete señales de que tu equipo ya superó el Excel.',
    h1: '7 señales de que tu empresa ya necesita un software de gestión de proyectos',
    excerpt:
      'Si reconoces tres o más de estas situaciones, tu equipo está perdiendo horas y plata por no tener un sistema. Te contamos cómo detectarlo y por dónde empezar.',
    keywords: ['software de gestión de proyectos', 'cuándo usar software de proyectos', 'dejar el excel', 'organizar proyectos'],
    published: '2026-11-03',
    updated: '2026-11-03',
    body: [
      p('La mayoría de empresas no decide “comprar un software de proyectos” un día cualquiera. Llega un momento en que el desorden empieza a costar: una entrega tarde, un cliente molesto, un mes en que no cuadran los números. Estas son las señales más comunes de que ese momento ya llegó.'),
      h2('1. Hay varias versiones del mismo archivo'),
      p('“Cronograma_final_v3”, “Cronograma_final_v3_AHORA_SI”, “Cronograma (copia)”. Cuando nadie está seguro de cuál es la versión buena, cada persona trabaja con información distinta y las decisiones se toman sobre datos viejos.'),
      h2('2. Preguntas “¿cómo vas con…?” todos los días'),
      p('Si para saber el estado de un proyecto tienes que escribirle a cada persona, el avance no es visible. Un tablero compartido responde esa pregunta sin interrumpir a nadie.'),
      h2('3. Las tareas se acuerdan en WhatsApp y se pierden'),
      p('Lo que se habló en el grupo queda enterrado entre audios, fotos y stickers. Una tarea sin responsable ni fecha, en la práctica, no existe.'),
      h2('4. Los archivos del proyecto están regados'),
      p('Contratos en el correo, planos en Drive, fotos en el celular de alguien. Encontrar un documento toma media mañana y siempre falta algo.'),
      h2('5. Te enteras de los atrasos cuando el cliente reclama'),
      p('Sin fechas visibles ni una línea de tiempo, los retrasos se descubren tarde, cuando ya no hay margen para corregir.'),
      h2('6. El presupuesto se revisa al final'),
      p('Un proyecto puede ir a tiempo y aun así perder plata. Si solo sabes cuánto gastaste cuando el proyecto terminó, no puedes renegociar ni recortar a tiempo.'),
      h2('7. Todo depende de una sola persona'),
      p('Si el proyecto se detiene cuando una persona se enferma o sale de vacaciones, la información vive en su cabeza y no en un sistema.'),
      tip('¿Cuántas marcaste?', 'Con tres o más señales, ordenar el trabajo en una herramienta te va a devolver horas cada semana. No necesitas cambiar todo de golpe: empieza con un solo proyecto.'),
      h2('Por dónde empezar'),
      ol(
        'Elige el proyecto que más dolores de cabeza te da hoy.',
        'Pasa sus tareas a un tablero, cada una con responsable y fecha.',
        'Invita solo a las personas de ese proyecto.',
        'Revisen el tablero 10 minutos al día durante dos semanas.',
        'Cuando funcione, suma el siguiente proyecto.',
      ),
      cta('Prueba con tu proyecto más desordenado. El plan Gratis incluye 1 tablero y 1 proyecto, sin tarjeta.'),
    ],
    faqs: [
      {
        q: '¿Qué tamaño debe tener una empresa para usar un software de proyectos?',
        a: 'No hay un mínimo. Desde que dos o más personas trabajan en el mismo proyecto, tener las tareas, fechas y archivos en un solo lugar ahorra tiempo y errores.',
      },
      {
        q: '¿Hay que dejar el Excel por completo?',
        a: 'No. Excel sigue siendo útil para análisis puntuales. Lo que conviene mover a un software es la coordinación: quién hace qué, para cuándo y cómo va.',
      },
    ],
    related: ['/alternativa-a-excel-para-proyectos', '/software-gestion-de-proyectos', '/software-de-proyectos-para-pymes'],
  },
  {
    slug: 'como-priorizar-tareas-cuando-todo-es-urgente',
    segment: 'gestion-de-proyectos',
    title: 'Cómo priorizar tareas cuando todo es urgente',
    description:
      'Un método simple para decidir qué hacer primero cuando todo parece urgente: urgencia vs. importancia, límites de trabajo y prioridades visibles.',
    h1: 'Cómo priorizar tareas cuando todo parece urgente',
    excerpt:
      'Cuando todo es prioridad, nada lo es. Te mostramos una forma práctica de ordenar el trabajo del equipo y decir “esto va primero” con argumentos.',
    keywords: ['cómo priorizar tareas', 'matriz de eisenhower', 'priorización de tareas', 'gestión del tiempo en equipos'],
    published: '2026-11-06',
    updated: '2026-11-06',
    body: [
      p('Priorizar no es hacer más rápido; es decidir qué no se hace hoy. El problema en muchos equipos es que cada tarea llega marcada como urgente y no hay un criterio común para ordenarlas.'),
      h2('Separa lo urgente de lo importante'),
      p('Una herramienta clásica es la matriz de urgencia e importancia (conocida como matriz de Eisenhower). Clasifica cada tarea en uno de cuatro grupos:'),
      {
        type: 'table',
        caption: 'Matriz de urgencia e importancia',
        headers: ['', 'Urgente', 'No urgente'],
        rows: [
          ['Importante', 'Hazlo ya (entregas con fecha, incidencias)', 'Planéalo (mejoras, preparación)'],
          ['No importante', 'Delégalo (pedidos menores)', 'Elimínalo o déjalo para después'],
        ],
      },
      p('La mayoría de equipos vive en el cuadrante “urgente”. El objetivo es pasar más tiempo en “importante, no urgente”: es donde se evitan los incendios de mañana.'),
      h2('Usa pocos niveles de prioridad'),
      p('Si tienes ocho niveles de prioridad, nadie los usa bien. Con tres o cuatro (por ejemplo: baja, media, alta y crítica) es suficiente para que el equipo entienda qué va primero.'),
      h2('Limita el trabajo en curso'),
      p('Empezar muchas cosas a la vez da la sensación de avanzar, pero retrasa todo. Acuerden un máximo de tareas “en curso” por persona; hasta que no se termine una, no se empieza otra.'),
      tip('Regla práctica', 'Si una persona tiene más de tres tarjetas en curso, pregúntale cuál puede terminar hoy antes de asignarle algo nuevo.'),
      h2('Haz visible la prioridad'),
      ul(
        'Marca la prioridad en cada tarea, no en un mensaje aparte.',
        'Ordena la columna “Por hacer” de arriba (más importante) a abajo.',
        'Revisa las prioridades una vez por semana con el equipo.',
        'Cuando entre algo urgente, decidan juntos qué sale para hacerle espacio.',
      ),
      h2('Cómo se ve en QuinList'),
      p('Cada tarjeta y cada tarea tiene prioridad, responsable y fecha límite. En los reportes ves las tareas por prioridad y estado, y el tablero muestra qué está en curso para detectar cuando alguien tiene demasiado.'),
      cta('Ordena las prioridades de tu equipo en un tablero visible para todos.'),
    ],
    faqs: [
      {
        q: '¿Qué es la matriz de Eisenhower?',
        a: 'Es una forma de clasificar tareas según si son urgentes y si son importantes, para decidir qué hacer ya, qué planear, qué delegar y qué eliminar.',
      },
      {
        q: '¿Cada cuánto se deben revisar las prioridades?',
        a: 'Una revisión semanal corta funciona para la mayoría de equipos, más un ajuste cada vez que entra un pedido urgente que cambia el plan.',
      },
    ],
    related: ['/software-gestion-de-tareas', '/tablero-kanban-online', '/guias/que-es-la-metodologia-kanban'],
  },
  {
    slug: 'reunion-de-seguimiento-de-15-minutos',
    segment: 'gestion-de-proyectos',
    title: 'Reunión de seguimiento de 15 minutos: guía práctica',
    description:
      'Cómo hacer una reunión de seguimiento de proyectos de 15 minutos: agenda fija, tablero en pantalla, bloqueos primero y decisiones por escrito.',
    h1: 'Cómo hacer una reunión de seguimiento de proyecto en 15 minutos',
    excerpt:
      'Las reuniones de seguimiento largas no son señal de compromiso: son señal de que falta información visible. Esta es una agenda que cabe en 15 minutos.',
    keywords: ['reunión de seguimiento de proyectos', 'daily meeting', 'reuniones efectivas', 'seguimiento de proyectos'],
    published: '2026-11-10',
    updated: '2026-11-10',
    body: [
      p('Una reunión de seguimiento sirve para una sola cosa: destrabar el trabajo. Si se usa para que cada persona cuente lo que hizo, se alarga y pierde valor. La información de “qué hice” debería estar ya en el tablero.'),
      h2('La agenda de 15 minutos'),
      ol(
        'Minutos 0–3: abran el tablero en pantalla y miren qué cambió desde ayer.',
        'Minutos 3–9: bloqueos. ¿Qué tarea está detenida y qué necesita para avanzar?',
        'Minutos 9–12: fechas en riesgo. ¿Qué vence esta semana y no va a llegar?',
        'Minutos 12–15: decisiones y responsables. Cada acuerdo queda escrito en una tarea.',
      ),
      tip('La regla de oro', 'Si un tema necesita más de dos minutos de discusión, se agenda aparte con las personas involucradas. La reunión de seguimiento no es para resolver, es para destrabar.'),
      h2('Lo que debe estar listo antes'),
      ul(
        'Cada persona actualizó sus tarjetas antes de la reunión.',
        'Las tareas tienen fecha y responsable.',
        'Los riesgos conocidos están registrados con su severidad.',
      ),
      h2('Errores comunes'),
      ul(
        'Hacer la reunión sin mirar el tablero.',
        'Repasar tareas que van bien en lugar de enfocarse en las detenidas.',
        'Tomar decisiones que no quedan escritas en ningún lado.',
        'Invitar a personas que no tienen nada que destrabar.',
      ),
      h2('Con QuinList'),
      p('El dashboard del proyecto muestra el avance, las tareas pendientes y los próximos vencimientos; el módulo de riesgos muestra qué está abierto y con qué severidad. Con eso en pantalla, la reunión arranca con los datos ya sobre la mesa.'),
      cta('Ten el avance del proyecto en pantalla en tu próxima reunión.'),
    ],
    faqs: [
      {
        q: '¿Cada cuánto conviene hacer reuniones de seguimiento?',
        a: 'Depende del ritmo del proyecto. Equipos con entregas diarias suelen hacerla cada día; para proyectos largos, dos o tres veces por semana es suficiente.',
      },
    ],
    related: ['/software-gestion-de-proyectos', '/gestion-de-proyectos-para-equipos-remotos', '/guias/matriz-de-riesgos-de-un-proyecto'],
  },

  /* ===================== Finanzas de proyectos ===================== */
  {
    slug: 'como-cobrar-por-hitos-a-tus-clientes',
    segment: 'finanzas-de-proyectos',
    title: 'Cómo cobrar por hitos a tus clientes',
    description:
      'Cobrar por hitos protege tu flujo de caja: cómo definir hitos facturables, cuánto pedir de anticipo y cómo hacer seguimiento a los pagos del proyecto.',
    h1: 'Cómo cobrar por hitos a tus clientes y cuidar tu flujo de caja',
    excerpt:
      'Cobrar todo al final es financiar el proyecto de tu cliente. Te explicamos cómo partir el pago en hitos claros que el cliente acepte y que protejan tu caja.',
    keywords: ['cobrar por hitos', 'pagos por avance', 'anticipo de proyecto', 'flujo de caja de proyectos'],
    published: '2026-11-04',
    updated: '2026-11-04',
    body: [
      p('Cuando un proyecto se cobra al final, tu empresa pone la plata de nómina, materiales y herramientas durante semanas o meses. Cobrar por hitos reparte ese esfuerzo y te da señales tempranas: si un hito no se aprueba, algo anda mal.'),
      h2('Qué es un hito facturable'),
      p('Es un punto del proyecto con un entregable concreto que el cliente puede revisar y aprobar. “Diseño aprobado”, “Versión de pruebas entregada” u “Obra gris terminada” son buenos hitos. “Avance del 50%” no lo es: es difícil de verificar.'),
      h2('Una estructura de pagos común'),
      {
        type: 'table',
        caption: 'Ejemplo de estructura de cobro por hitos',
        headers: ['Momento', 'Qué se entrega', 'Pago'],
        rows: [
          ['Firma', 'Contrato y plan de trabajo', 'Anticipo'],
          ['Hito 1', 'Primer entregable aprobado', 'Pago parcial'],
          ['Hito 2', 'Entregable principal aprobado', 'Pago parcial'],
          ['Cierre', 'Entrega final y acta de cierre', 'Saldo'],
        ],
      },
      p('Los porcentajes dependen de tu sector y de lo que puedas negociar. Lo importante es que el anticipo cubra los costos de arranque y que ningún tramo deje a tu empresa financiando demasiado tiempo.'),
      h2('Cómo hacer que el cliente lo acepte'),
      ul(
        'Define los hitos en el contrato, con el entregable de cada uno.',
        'Muestra el avance: un cliente que ve el progreso paga con más tranquilidad.',
        'Pide la aprobación de cada entregable por escrito.',
        'Factura apenas se aprueba el hito, no al final del mes.',
      ),
      tip('Comparte el avance', 'Un enlace de solo lectura al proyecto evita los correos de “¿cómo van?” y hace evidente cuándo se cumplió un hito.'),
      h2('Haz seguimiento a los pagos'),
      p('Registra cada ingreso apenas llega: anticipo, facturación o pago por hito completado. Así sabes en todo momento cuánto has recibido, cuánto has gastado y cuál es el saldo real del proyecto.'),
      h2('Cómo se hace en QuinList'),
      p('Cada proyecto tiene hitos con fecha y avance, entregables con estados (pendiente, en progreso, entregado, aprobado) y un módulo de finanzas donde registras los ingresos por anticipo, facturación o hito completado. El saldo y el flujo de caja se calculan solos.'),
      cta('Lleva los hitos y los pagos de tus proyectos en un solo lugar.', '/control-de-presupuesto-de-proyectos', 'Ver control de presupuesto'),
    ],
    faqs: [
      {
        q: '¿Cuánto anticipo se debe pedir?',
        a: 'No hay una regla única; depende del sector y del cliente. Como criterio, el anticipo debería cubrir al menos los costos de arranque del proyecto.',
      },
      {
        q: '¿Qué pasa si el cliente no aprueba un hito?',
        a: 'Revisen juntos qué falta según lo definido en el contrato. Por eso es clave que cada hito tenga un entregable concreto y verificable.',
      },
    ],
    related: ['/control-de-presupuesto-de-proyectos', '/gestion-de-proyectos-para-agencias', '/guias/como-calcular-la-rentabilidad-de-un-proyecto'],
  },
  {
    slug: 'errores-al-presupuestar-un-proyecto',
    segment: 'finanzas-de-proyectos',
    title: '6 errores al presupuestar un proyecto (y cómo evitarlos)',
    description:
      'Costos ocultos, cero margen para imprevistos y presupuestos que nadie revisa. Seis errores comunes al presupuestar un proyecto y cómo corregirlos.',
    h1: '6 errores comunes al presupuestar un proyecto y cómo evitarlos',
    excerpt:
      'La mayoría de proyectos que pierden plata no lo hacen por un gran error, sino por varios pequeños en el presupuesto. Estos son los más comunes.',
    keywords: ['presupuesto de un proyecto', 'cómo presupuestar un proyecto', 'errores de presupuesto', 'costos de un proyecto'],
    published: '2026-11-08',
    updated: '2026-11-08',
    body: [
      p('Un buen presupuesto no es el más barato ni el más alto: es el que refleja de verdad lo que cuesta entregar el proyecto y deja un margen sano. Estos errores son los que más se repiten.'),
      h2('1. Presupuestar solo las horas visibles'),
      p('Se cuenta el tiempo de producción, pero no el de reuniones, revisiones, cambios y coordinación. Ese tiempo existe y alguien lo paga.'),
      h2('2. No dejar margen para imprevistos'),
      p('Siempre aparece algo: un cambio del cliente, un proveedor que se retrasa, un material que sube de precio. Incluye una reserva explícita para contingencias.'),
      h2('3. Olvidar los costos indirectos'),
      ul('Herramientas y licencias.', 'Transporte y viajes.', 'Servicios externos.', 'Parte de los gastos fijos de la empresa.'),
      h2('4. No definir el alcance por escrito'),
      p('Si no está claro qué incluye el proyecto, cada pedido nuevo parece “parte de lo acordado”. Un alcance escrito permite cobrar los cambios.'),
      h2('5. Presupuestar en una moneda y gastar en otra'),
      p('Si cobras en una moneda y algunos costos están en otra, las variaciones del tipo de cambio pueden comerse tu margen. Define la moneda del proyecto y registra los gastos en ella.'),
      h2('6. Hacer el presupuesto y no volver a mirarlo'),
      p('El error más caro. Compara el porcentaje de presupuesto consumido con el porcentaje de avance: si gastaste el 70% y vas en el 40%, hay que actuar ya.'),
      tip('Un indicador que lo resume', 'Presupuesto consumido vs. avance del proyecto. Si el primero va muy por delante del segundo, la rentabilidad está en riesgo.'),
      h2('Cómo ayuda QuinList'),
      p('Defines el presupuesto base y la moneda al crear el proyecto. Cada egreso queda registrado con su categoría y comprobante, y ves el saldo, el flujo de caja, el porcentaje de presupuesto consumido y la rentabilidad frente a tu meta.'),
      cta('Controla el presupuesto mientras el proyecto avanza, no al final.', '/control-de-presupuesto-de-proyectos', 'Ver cómo funciona'),
    ],
    faqs: [
      {
        q: '¿Cuánto margen de contingencia se recomienda?',
        a: 'Depende de la incertidumbre del proyecto. Proyectos conocidos y repetitivos necesitan menos; proyectos nuevos o con muchos proveedores, más.',
      },
    ],
    related: ['/control-de-presupuesto-de-proyectos', '/gestion-de-proyectos-de-construccion', '/guias/como-calcular-la-rentabilidad-de-un-proyecto'],
  },

  /* ===================== Equipos y productividad ===================== */
  {
    slug: 'de-whatsapp-a-un-sistema-de-trabajo',
    segment: 'equipos-y-productividad',
    title: 'Cómo pasar la coordinación de WhatsApp a un sistema',
    description:
      'WhatsApp sirve para conversar, no para gestionar tareas. Un plan de cuatro semanas para mover la coordinación del equipo a un sistema sin traumas.',
    h1: 'Cómo pasar la coordinación del equipo de WhatsApp a un sistema de trabajo',
    excerpt:
      'Nadie quiere abandonar WhatsApp, y no hace falta. Lo que sí conviene sacar de ahí son las tareas, las fechas y las decisiones. Aquí tienes un plan paso a paso.',
    keywords: ['dejar de usar whatsapp para trabajar', 'coordinar equipo de trabajo', 'herramientas de colaboración', 'organizar tareas del equipo'],
    published: '2026-11-05',
    updated: '2026-11-05',
    body: [
      p('WhatsApp es excelente para una pregunta rápida. El problema es cuando se vuelve el lugar donde se asignan tareas, se aprueban entregables y se comparten archivos. Ahí la información se pierde entre cientos de mensajes.'),
      h2('Qué sí y qué no dejar en WhatsApp'),
      {
        type: 'table',
        caption: 'Qué va en cada lugar',
        headers: ['Tipo de información', 'WhatsApp', 'Sistema de trabajo'],
        rows: [
          ['Pregunta rápida o aviso urgente', 'Sí', 'Opcional'],
          ['Tarea con responsable y fecha', 'No', 'Sí'],
          ['Aprobación de un entregable', 'No', 'Sí'],
          ['Archivos del proyecto', 'No', 'Sí'],
          ['Decisiones que hay que recordar', 'No', 'Sí'],
        ],
      },
      h2('Plan de cuatro semanas'),
      h3('Semana 1: un proyecto piloto'),
      p('Elige un solo proyecto y pasa sus tareas a un tablero. Cada tarea con responsable, fecha y prioridad.'),
      h3('Semana 2: la regla del enlace'),
      p('Cuando alguien pida algo por WhatsApp, la respuesta es: “créalo como tarea y me mencionas”. Al principio cuesta; a los pocos días se vuelve costumbre.'),
      h3('Semana 3: archivos y decisiones'),
      p('Los documentos se adjuntan a la tarea y las decisiones se escriben en los comentarios. Si no está en el sistema, no se acordó.'),
      h3('Semana 4: chat del equipo'),
      p('Las conversaciones del proyecto pasan al chat del equipo, junto al trabajo. WhatsApp queda para lo personal y lo verdaderamente urgente.'),
      tip('Da el ejemplo', 'El cambio funciona cuando el líder es el primero en crear tareas y responder en el sistema, no por WhatsApp.'),
      h2('Cómo lo resuelve QuinList'),
      p('Tableros con tareas asignadas, comentarios y menciones en cada tarjeta, archivos adjuntos, notificaciones cuando te asignan algo y un chat de equipo con canales. Todo queda junto al trabajo y con historial.'),
      cta('Saca las tareas de tu equipo del grupo de WhatsApp.'),
    ],
    faqs: [
      {
        q: '¿Hay que prohibir WhatsApp en el trabajo?',
        a: 'No. Funciona bien para avisos rápidos. Lo que conviene mover a un sistema son las tareas, los archivos y las decisiones que hay que poder encontrar después.',
      },
    ],
    related: ['/gestion-de-proyectos-para-equipos-remotos', '/software-gestion-de-tareas', '/alternativa-a-excel-para-proyectos'],
  },
  {
    slug: 'como-delegar-tareas-sin-perder-el-control',
    segment: 'equipos-y-productividad',
    title: 'Cómo delegar tareas sin perder el control',
    description:
      'Delegar no es soltar y olvidar. Cómo asignar tareas con resultado claro, fecha y nivel de autonomía, y hacer seguimiento sin microgestionar.',
    h1: 'Cómo delegar tareas en tu equipo sin perder el control',
    excerpt:
      'Muchos líderes no delegan porque sienten que pierden el control. El secreto no es delegar menos, sino delegar mejor: con claridad y visibilidad.',
    keywords: ['cómo delegar tareas', 'delegar en el equipo', 'liderazgo de equipos', 'asignar tareas a empleados'],
    published: '2026-11-12',
    updated: '2026-11-12',
    body: [
      p('Si todo pasa por tus manos, tú eres el cuello de botella. Delegar bien libera tu tiempo para lo que solo tú puedes hacer y hace crecer a tu equipo.'),
      h2('Los cinco elementos de una tarea bien delegada'),
      ol(
        'Resultado esperado: qué debe existir cuando la tarea esté terminada.',
        'Responsable: una sola persona a cargo.',
        'Fecha límite: cuándo se necesita, y por qué.',
        'Contexto: archivos, antecedentes y a quién preguntar.',
        'Nivel de autonomía: ¿decide sola, propone opciones o consulta antes?',
      ),
      h2('Define el nivel de autonomía'),
      p('Muchos problemas al delegar vienen de no aclarar cuánto puede decidir la otra persona. Dilo explícitamente: “decide tú”, “tráeme dos opciones” o “consúltame antes de enviar”.'),
      h2('Seguimiento sin microgestión'),
      ul(
        'Mira el tablero en lugar de preguntar “¿cómo vas?”.',
        'Acuerda puntos de revisión, no revisiones constantes.',
        'Pide visibilidad del avance con checklist dentro de la tarea.',
        'Interviene solo cuando una fecha está en riesgo o hay un bloqueo.',
      ),
      quote('Delegar la tarea no es delegar la responsabilidad del resultado. Lo que cambia es que ahora tu trabajo es quitar obstáculos.'),
      h2('Cómo se ve en QuinList'),
      p('Cada tarea tiene responsable, fecha, prioridad, descripción, checklist y adjuntos. Los roles y permisos definen quién puede editar qué, y el historial de actividad muestra cada cambio sin que tengas que preguntar.'),
      cta('Delega con claridad y mira el avance sin perseguir a nadie.'),
    ],
    faqs: [
      {
        q: '¿Qué tareas no se deben delegar?',
        a: 'Las que dependen de tu criterio único o de tu rol: decisiones estratégicas, conversaciones delicadas con personas del equipo y compromisos clave con clientes.',
      },
    ],
    related: ['/software-gestion-de-tareas', '/software-de-proyectos-para-pymes', '/guias/como-organizar-proyectos-de-una-empresa'],
  },

  /* ===================== Herramientas y comparativas ===================== */
  {
    slug: 'excel-vs-software-de-gestion-de-proyectos',
    segment: 'herramientas',
    title: 'Excel vs. software de gestión de proyectos',
    description:
      '¿Excel o un software de gestión de proyectos? Comparamos colaboración, seguimiento, cronograma, presupuesto e historial para que decidas con criterio.',
    h1: 'Excel vs. software de gestión de proyectos: cuándo usar cada uno',
    excerpt:
      'Excel no es el enemigo: es una gran herramienta para calcular. Pero coordinar personas es otro trabajo. Comparamos ambos para que sepas cuándo dar el paso.',
    keywords: ['excel vs software de proyectos', 'gestionar proyectos en excel', 'plantilla de proyectos excel', 'software de gestión de proyectos'],
    published: '2026-11-07',
    updated: '2026-11-07',
    body: [
      p('Casi todas las empresas empiezan a gestionar proyectos en Excel. Tiene sentido: ya lo conocen y es flexible. El problema aparece cuando varias personas necesitan trabajar sobre la misma información al mismo tiempo.'),
      h2('Comparación directa'),
      {
        type: 'table',
        caption: 'Excel frente a un software de gestión de proyectos',
        headers: ['Necesidad', 'Excel', 'Software de proyectos'],
        rows: [
          ['Calcular y analizar datos', 'Excelente', 'Suficiente'],
          ['Varias personas editando a la vez', 'Se complica', 'Diseñado para eso'],
          ['Saber quién hace qué', 'Columna manual', 'Responsable por tarea'],
          ['Avisos y notificaciones', 'No', 'Sí'],
          ['Cronograma', 'Barras dibujadas a mano', 'Gantt automático'],
          ['Historial de cambios', 'Limitado', 'Registro de actividad'],
          ['Archivos y conversaciones', 'En otro lado', 'Junto a cada tarea'],
        ],
      },
      h2('Cuándo Excel es suficiente'),
      ul('Trabajas solo o con una persona más.', 'El proyecto es corto y con pocas tareas.', 'Necesitas hacer cálculos o análisis puntuales.'),
      h2('Cuándo conviene un software'),
      ul(
        'Varias personas trabajan en varios proyectos a la vez.',
        'Necesitas ver el avance sin preguntar a cada uno.',
        'Hay fechas, entregables y clientes que esperan.',
        'Quieres controlar el presupuesto mientras el proyecto avanza.',
      ),
      tip('No es todo o nada', 'Puedes seguir usando Excel para análisis y usar el software para coordinar. Lo importante es que la información del día a día viva en un solo lugar.'),
      cta('Lleva tu Excel de proyectos a un tablero en una tarde.', '/alternativa-a-excel-para-proyectos', 'Ver cómo pasar de Excel'),
    ],
    faqs: [
      {
        q: '¿Puedo seguir usando mis plantillas de Excel?',
        a: 'Sí, para análisis puntuales. Para coordinar, cada fila de tu plantilla puede convertirse en una tarea con responsable y fecha en el software.',
      },
    ],
    related: ['/alternativa-a-excel-para-proyectos', '/guias/como-organizar-proyectos-de-una-empresa', '/software-gestion-de-proyectos'],
  },
  {
    slug: 'kanban-o-gantt-cual-usar',
    segment: 'herramientas',
    title: 'Kanban o Gantt: cuál usar en tu proyecto',
    description:
      'Kanban muestra el flujo del trabajo; Gantt muestra el tiempo. Cuándo conviene cada uno y por qué muchos equipos usan los dos sobre las mismas tareas.',
    h1: 'Kanban o diagrama de Gantt: cuál usar en tu proyecto',
    excerpt:
      'No son rivales. Kanban responde “¿en qué estado está el trabajo?” y Gantt responde “¿llegamos a tiempo?”. Te explicamos cuándo usar cada uno.',
    keywords: ['kanban vs gantt', 'diagrama de gantt o kanban', 'tablero kanban', 'cronograma de proyecto'],
    published: '2026-11-13',
    updated: '2026-11-13',
    body: [
      p('Kanban y Gantt son dos formas de ver el mismo trabajo. Elegir uno u otro depende de qué pregunta necesitas responder con más frecuencia.'),
      h2('Kanban: el estado del trabajo'),
      p('Un tablero Kanban organiza las tareas en columnas por etapa (por hacer, en curso, hecho). Es ideal para el día a día del equipo: se ve qué está detenido y quién tiene demasiado.'),
      h2('Gantt: el tiempo del proyecto'),
      p('Un diagrama de Gantt muestra cada tarea como una barra en una línea de tiempo. Es ideal para planear, ver dependencias y detectar si el proyecto va a llegar a la fecha.'),
      {
        type: 'table',
        caption: 'Kanban frente a Gantt',
        headers: ['', 'Kanban', 'Gantt'],
        rows: [
          ['Pregunta que responde', '¿En qué estado está el trabajo?', '¿Llegamos a tiempo?'],
          ['Mejor para', 'Ejecución diaria', 'Planeación y fechas'],
          ['Quién lo mira más', 'El equipo', 'Dirección y cliente'],
          ['Tipo de trabajo', 'Flujo continuo', 'Proyectos con fecha de entrega'],
        ],
      },
      h2('Por qué usar los dos'),
      p('El equipo trabaja moviendo tarjetas; la dirección revisa el cronograma. Si ambas vistas salen de las mismas tareas, nadie tiene que actualizar dos herramientas.'),
      tip('Consejo', 'Pon fecha de inicio y fin a las tareas aunque trabajes en Kanban. Así el cronograma se arma solo cuando lo necesites.'),
      h2('En QuinList'),
      p('Las tareas de un proyecto se ven en lista, en Kanban y en cronograma tipo Gantt. Es la misma información en tres vistas: mueves una tarjeta y el resto se actualiza.'),
      cta('Mira tus tareas en Kanban y en Gantt sin duplicar trabajo.', '/diagrama-de-gantt-online', 'Ver el diagrama de Gantt'),
    ],
    faqs: [
      {
        q: '¿Kanban sirve para proyectos con fecha de entrega?',
        a: 'Sí, siempre que las tareas tengan fecha límite. Para ver si el conjunto va a llegar a tiempo, ayuda complementarlo con un cronograma.',
      },
    ],
    related: ['/tablero-kanban-online', '/diagrama-de-gantt-online', '/guias/como-hacer-un-cronograma-de-proyecto'],
  },
]

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */

export function postPath(post: BlogPost) {
  return `/blog/${post.segment}/${post.slug}`
}

export function segmentPath(segment: BlogSegment) {
  return `/blog/${segment.slug}`
}

export function getSegment(slug: string) {
  return blogSegments.find((s) => s.slug === slug)
}

/** Entradas ordenadas de la más reciente a la más antigua. */
export const sortedPosts = [...blogPosts].sort((a, b) => b.published.localeCompare(a.published))

export function postsOfSegment(slug: string) {
  return sortedPosts.filter((p) => p.segment === slug)
}

export function getPostByPath(path: string) {
  const key = path.replace(/\/$/, '')
  return blogPosts.find((p) => postPath(p) === key)
}

export function getSegmentByPath(path: string) {
  const key = path.replace(/\/$/, '')
  return blogSegments.find((s) => segmentPath(s) === key)
}

export function readingMinutes(post: BlogPost) {
  const text = post.body
    .map((b) => {
      if (b.type === 'ul' || b.type === 'ol') return b.items.join(' ')
      if (b.type === 'table') return b.rows.flat().join(' ')
      if (b.type === 'tip') return `${b.title} ${b.text}`
      return 'text' in b ? b.text : ''
    })
    .join(' ')
  return Math.max(2, Math.round(text.split(/\s+/).length / 200))
}

export function relatedPosts(post: BlogPost, limit = 3) {
  const same = sortedPosts.filter((p) => p.segment === post.segment && p.slug !== post.slug)
  const others = sortedPosts.filter((p) => p.segment !== post.segment)
  return [...same, ...others].slice(0, limit)
}

export const BLOG_PATHS = ['/blog', ...blogSegments.map(segmentPath), ...blogPosts.map(postPath)]
