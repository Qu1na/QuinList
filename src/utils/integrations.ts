export type IntegrationType = 'google_calendar' | 'slack' | 'github' | 'ics_export' | 'webhook'

export interface BoardIntegration {
  type: IntegrationType
  enabled: boolean
  config: Record<string, string>
}

export const INTEGRATION_META: Record<
  IntegrationType,
  { name: string; description: string; icon: string; color: string }
> = {
  google_calendar: {
    name: 'Google Calendar',
    description: 'Sincroniza fechas límite con Google Calendar',
    icon: '📅',
    color: '#4285F4',
  },
  slack: {
    name: 'Slack',
    description: 'Notificaciones en tu canal de Slack vía webhook',
    icon: '💬',
    color: '#4A154B',
  },
  github: {
    name: 'GitHub',
    description: 'Vincula commits y PRs con tarjetas',
    icon: '🐙',
    color: '#24292F',
  },
  ics_export: {
    name: 'Calendario ICS',
    description: 'Exporta fechas límite como archivo .ics',
    icon: '📆',
    color: '#0F9D58',
  },
  webhook: {
    name: 'Webhook personalizado',
    description: 'Envía eventos a cualquier URL (Zapier, Make, n8n)',
    icon: '🔗',
    color: '#6366F1',
  },
}

export {
  BOARD_BACKGROUNDS,
  getBoardBackground,
  getBoardBackgroundStyle,
  getBoardBackgroundThumbStyle,
  type BoardBackgroundId,
} from './boardBackgrounds'
