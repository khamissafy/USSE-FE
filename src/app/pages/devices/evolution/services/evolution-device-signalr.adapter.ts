import { Injectable } from '@angular/core'
import * as signalR from '@microsoft/signalr'
import { AuthService } from 'src/app/shared/services/auth.service'
import { environment } from 'src/environments/environment'
import { Observable, Subject } from 'rxjs'
import {
  EvolutionConnectionEvent,
  EvolutionConnectionState,
  EvolutionIncomingMessage,
  EvolutionStatusUpdate
} from '../models/evolution-device.models'

function parseJson(value: unknown): unknown | null {
  if (typeof value !== 'string') {
    return null
  }
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function mapMessageStatusToEventType(status: number): EvolutionStatusUpdate['eventType'] | null {
  if (status === 1) {
    return 'sent'
  }
  if (status === 2) {
    return 'delivered'
  }
  if (status === 3) {
    return 'read'
  }
  if (status === 4) {
    return 'failed'
  }
  if (status >= 5) {
    return 'permanent_failure'
  }
  return null
}

function asConnectionState(v: unknown): EvolutionConnectionState | null {
  if (v === 'open' || v === 'close' || v === 'qr' || v === 'connecting' || v === 'pairing') {
    return v
  }
  return null
}

/**
 * Dedicated SignalR hub client for Evolution (EVO) events. Filters hub payloads by `msgSource === 'EVO'`.
 * Ref-counted {@link start}/{@link stop} so nested feature routes can share one hub connection.
 */
@Injectable({ providedIn: 'root' })
export class EvolutionDeviceSignalrAdapter {
  private readonly signalRUrl = `${environment.signalR}`
  private hubConnection?: signalR.HubConnection
  private refCount = 0

  private readonly incomingSubject = new Subject<EvolutionIncomingMessage>()
  private readonly statusUpdateSubject = new Subject<EvolutionStatusUpdate>()
  private readonly connectionStateSubject = new Subject<EvolutionConnectionEvent>()

  readonly incoming$: Observable<EvolutionIncomingMessage> = this.incomingSubject.asObservable()
  readonly statusUpdate$: Observable<EvolutionStatusUpdate> = this.statusUpdateSubject.asObservable()
  readonly connectionState$: Observable<EvolutionConnectionEvent> = this.connectionStateSubject.asObservable()

  constructor(private readonly auth: AuthService) {}

  start(): void {
    this.refCount++
    if (this.refCount !== 1) {
      return
    }
    this.createConnection()
  }

  stop(): void {
    if (this.refCount > 0) {
      this.refCount--
    }
    if (this.refCount === 0) {
      void this.hubConnection?.stop()
      this.hubConnection = undefined
    }
  }

  private createConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.off('ReceiveMessage')
      this.hubConnection.off('StatusUpdate')
      void this.hubConnection.stop()
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.signalRUrl, {
        withCredentials: true,
        accessTokenFactory: () => Promise.resolve(this.auth.getAccessToken() ?? '')
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build()

    this.hubConnection.off('ReceiveMessage')
    this.hubConnection.on('ReceiveMessage', (_email: string, messageJson: string) => {
      const parsed = parseJson(messageJson)
      this.tryEmitIncoming(parsed)
    })

    this.hubConnection.off('StatusUpdate')
    this.hubConnection.on('StatusUpdate', (_userKey: string, messageJson: string) => {
      const parsed = parseJson(messageJson)
      this.tryEmitFromStatusPayload(parsed)
    })

    void this.hubConnection
      .start()
      .then(() => {
        /* connected */
      })
      .catch(() => {
        /* logged by runtime; connection may retry */
      })
  }

  private tryEmitIncoming(parsed: unknown): void {
    if (!isRecord(parsed)) {
      return
    }
    const msgSource = parsed['msgSource']
    const msgType = parsed['msgType']
    const isEvo = msgSource === 'EVO' || msgType === 'EVO'
    if (!isEvo) {
      return
    }
    const instanceId = String(parsed['instanceId'] ?? parsed['evolutionInstanceId'] ?? '')
    if (!instanceId) {
      return
    }
    const incoming: EvolutionIncomingMessage = {
      msgSource: 'EVO',
      instanceId,
      deviceId: parsed['deviceId'] != null ? String(parsed['deviceId']) : undefined,
      from: String(parsed['from'] ?? parsed['senderNumber'] ?? parsed['fromNumber'] ?? ''),
      body: String(parsed['body'] ?? parsed['message'] ?? parsed['content'] ?? ''),
      messageId: String(parsed['messageId'] ?? parsed['id'] ?? ''),
      timestamp: String(parsed['timestamp'] ?? parsed['createdAt'] ?? new Date().toISOString())
    }
    this.incomingSubject.next(incoming)
  }

  private tryEmitFromStatusPayload(parsed: unknown): void {
    if (!isRecord(parsed)) {
      return
    }
    const msgSource = parsed['msgSource']
    const msgType = parsed['msgType']
    const isEvo = msgSource === 'EVO' || msgType === 'EVO'
    if (!isEvo) {
      return
    }

    const ts = String(parsed['timestamp'] ?? parsed['updatedAt'] ?? new Date().toISOString())
    const instanceId = String(parsed['instanceId'] ?? parsed['evolutionInstanceId'] ?? '')

    const stateRaw = parsed['state']
    const conn = asConnectionState(stateRaw)
    if (conn) {
      this.connectionStateSubject.next({
        msgSource: 'EVO',
        instanceId,
        deviceId: parsed['deviceId'] != null ? String(parsed['deviceId']) : undefined,
        state: conn,
        timestamp: ts
      })
      return
    }

    if (typeof parsed['isConnected'] === 'boolean') {
      const mapped: EvolutionConnectionState = parsed['isConnected'] ? 'open' : 'close'
      this.connectionStateSubject.next({
        msgSource: 'EVO',
        instanceId,
        deviceId: parsed['deviceId'] != null ? String(parsed['deviceId']) : undefined,
        state: mapped,
        timestamp: ts
      })
      return
    }

    const eventType = parsed['eventType']
    if (
      eventType === 'sent' ||
      eventType === 'delivered' ||
      eventType === 'read' ||
      eventType === 'failed' ||
      eventType === 'permanent_failure'
    ) {
      const canonicalMessageId = String(parsed['canonicalMessageId'] ?? parsed['id'] ?? '')
      if (!canonicalMessageId) {
        return
      }
      const su: EvolutionStatusUpdate = {
        msgSource: 'EVO',
        canonicalMessageId,
        eventType,
        evolutionMessageId:
          parsed['evolutionMessageId'] != null ? String(parsed['evolutionMessageId']) : undefined,
        timestamp: ts
      }
      this.statusUpdateSubject.next(su)
      return
    }

    const statusNum = typeof parsed['status'] === 'number' ? (parsed['status'] as number) : null
    if (statusNum != null) {
      const mapped = mapMessageStatusToEventType(statusNum)
      if (!mapped) {
        return
      }
      const canonicalMessageId = String(parsed['id'] ?? parsed['messageId'] ?? '')
      if (!canonicalMessageId) {
        return
      }
      this.statusUpdateSubject.next({
        msgSource: 'EVO',
        canonicalMessageId,
        eventType: mapped,
        evolutionMessageId:
          parsed['wppMessageRef'] != null ? String(parsed['wppMessageRef']) : undefined,
        timestamp: ts
      })
    }
  }
}
