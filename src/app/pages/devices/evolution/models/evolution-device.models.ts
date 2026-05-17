export type EvolutionConnectionState = 'open' | 'close' | 'qr' | 'connecting' | 'pairing'

export interface EvolutionPairing {
  qrBase64: string | null
  pairCode: string | null
  expiresAt: string | null
}

export interface EvolutionDeviceCreateRequest {
  label: string
  delayIntervalInSeconds: number
}

export interface EvolutionDeviceCreateResponse {
  deviceId: string
  deviceType: 'EVO'
  instanceId: string
  pairing: EvolutionPairing
  isConnected: boolean
  lastUpdate: string
}

export interface EvolutionDeviceListItem {
  deviceId: string
  label: string
  instanceId: string
  isConnected: boolean
  lastUpdate: string
  delayIntervalInSeconds: number
}

export interface EvolutionDeviceDetail extends EvolutionDeviceListItem {
  pairing?: EvolutionPairing
}

export interface EvolutionIncomingMessage {
  msgSource: 'EVO'
  instanceId: string
  deviceId?: string
  from: string
  body: string
  messageId: string
  timestamp: string
}

export interface EvolutionStatusUpdate {
  msgSource: 'EVO'
  canonicalMessageId: string
  eventType: 'sent' | 'delivered' | 'read' | 'failed' | 'permanent_failure'
  evolutionMessageId?: string
  timestamp: string
}

export interface EvolutionConnectionEvent {
  msgSource: 'EVO'
  instanceId: string
  deviceId?: string
  state: EvolutionConnectionState
  timestamp: string
}
