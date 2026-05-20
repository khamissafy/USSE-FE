import { Injectable, OnDestroy } from '@angular/core'
import * as signalR from '@microsoft/signalr'
import { Observable, Subject } from 'rxjs'
import { AuthService } from './auth.service'
import { environment } from 'src/environments/environment'
import { BillingStateChangedEvent } from 'src/app/models/billing/billing.models'

/**
 * Central SignalR hub client. Manages a single connection shared across
 * features that need server-push events (billing, future expansions).
 * Ref-counted via start()/stop() — connect on first consumer, disconnect
 * when the last consumer stops.
 */
@Injectable({ providedIn: 'root' })
export class SignalrService implements OnDestroy {
  private readonly hubUrl = environment.signalR
  private hubConnection?: signalR.HubConnection
  private refCount = 0

  private readonly _billingStateChanged = new Subject<BillingStateChangedEvent>()

  /** Emits every `BillingStateChanged` event received from the hub. */
  readonly billingStateChanged$: Observable<BillingStateChangedEvent> =
    this._billingStateChanged.asObservable()

  constructor(private readonly auth: AuthService) {}

  /** Increment ref-count and connect on first call. */
  start(): void {
    this.refCount++
    if (this.refCount !== 1) {
      return
    }
    this.connect()
  }

  /** Decrement ref-count and disconnect when it reaches zero. */
  stop(): void {
    if (this.refCount > 0) {
      this.refCount--
    }
    if (this.refCount === 0) {
      void this.hubConnection?.stop()
      this.hubConnection = undefined
    }
  }

  ngOnDestroy(): void {
    this.refCount = 0
    void this.hubConnection?.stop()
    this._billingStateChanged.complete()
  }

  private connect(): void {
    if (this.hubConnection) {
      this.hubConnection.off('BillingStateChanged')
      void this.hubConnection.stop()
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        withCredentials: true,
        accessTokenFactory: () => Promise.resolve(this.auth.getAccessToken() ?? ''),
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build()

    this.hubConnection.on('BillingStateChanged', (payload: BillingStateChangedEvent) => {
      this._billingStateChanged.next(payload)
    })

    void this.hubConnection
      .start()
      .catch(() => {
        /* connection retried automatically by withAutomaticReconnect */
      })
  }
}
