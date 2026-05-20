import { Injectable, OnDestroy } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { SignalrService } from 'src/app/shared/services/signalr.service'
import {
  BillingStateDto,
  CheckoutRequestDto,
  CheckoutResponseDto,
  DowngradeRequestDto,
  DowngradeResponseDto,
  TransactionDto,
  TransactionFilter,
  TransactionPageDto,
  UpgradeRequestDto,
  UpgradeResponseDto,
} from 'src/app/models/billing/billing.models'

@Injectable({ providedIn: 'root' })
export class BillingService implements OnDestroy {
  private readonly api = `${environment.api}billing`

  /** Current billing state; null until first load. */
  private readonly _state = new BehaviorSubject<BillingStateDto | null>(null)
  readonly state$: Observable<BillingStateDto | null> = this._state.asObservable()

  private signalrSub?: Subscription

  constructor(
    private readonly http: HttpClient,
    private readonly signalr: SignalrService,
  ) {
    this.signalr.start()
    this.signalrSub = this.signalr.billingStateChanged$.subscribe(() => {
      this.refreshState()
    })
  }

  ngOnDestroy(): void {
    this.signalrSub?.unsubscribe()
    this.signalr.stop()
  }

  /** Load billing state from the server and push into state$. */
  getState(): Observable<BillingStateDto> {
    const req = this.http.get<BillingStateDto>(`${this.api}/state`)
    req.subscribe({
      next: (state) => this._state.next(state),
      error: () => { /* error surfaced by ErrorInterceptorService */ },
    })
    return req
  }

  /** Start a checkout session. */
  startCheckout(request: CheckoutRequestDto): Observable<CheckoutResponseDto> {
    return this.http.post<any>(`${this.api}/checkout`, request).pipe(map(adaptCheckoutResponse))
  }

  /** Fetch paginated transaction history. */
  getTransactions(filter: TransactionFilter = {}): Observable<TransactionPageDto> {
    let params = new HttpParams()
    if (filter.page != null) params = params.set('page', filter.page)
    if (filter.pageSize != null) params = params.set('pageSize', filter.pageSize)
    if (filter.status) params = params.set('status', filter.status)
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate)
    if (filter.toDate) params = params.set('toDate', filter.toDate)
    // BE returns PagedResult<List<TransactionDto>> which the ApiResultUnwrapInterceptor
    // strips down to just the items array. Adapt to the page shape the UI expects.
    return this.http.get<TransactionDto[] | TransactionPageDto>(`${this.api}/transactions`, { params, observe: 'response' }).pipe(
      map((resp) => {
        const body = (resp.body ?? []) as TransactionDto[] | TransactionPageDto
        if (Array.isArray(body)) {
          const total = Number(resp.headers.get('X-Records-Total') ?? body.length)
          return {
            page: filter.page ?? 1,
            pageSize: filter.pageSize ?? 20,
            total,
            items: body,
          } as TransactionPageDto
        }
        return body as TransactionPageDto
      }),
    )
  }

  /** Mid-cycle plan upgrade. */
  upgrade(request: UpgradeRequestDto): Observable<UpgradeResponseDto> {
    return this.http.post<UpgradeResponseDto>(`${this.api}/upgrade`, request)
  }

  /** Schedule a plan downgrade at cycle end. */
  downgrade(request: DowngradeRequestDto): Observable<DowngradeResponseDto> {
    return this.http.post<DowngradeResponseDto>(`${this.api}/downgrade`, request)
  }

  /** Cancel the pending scheduled change. */
  cancelScheduledChange(): Observable<{ cancelledChangeId: string; status: string }> {
    return this.http.post<{ cancelledChangeId: string; status: string }>(
      `${this.api}/scheduled-change/cancel`, {})
  }

  /** Cancel-at-period-end. */
  cancelSubscription(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.api}/cancel`, { confirm: true })
  }

  /** Initiate add-card tokenisation flow; returns iframe checkout. */
  addPaymentMethod(): Observable<CheckoutResponseDto> {
    return this.http.post<any>(`${this.api}/payment-methods`, {}).pipe(map(adaptCheckoutResponse))
  }

  /** Remove a saved payment method. */
  removePaymentMethod(id: string): Observable<{ status: string }> {
    return this.http.delete<{ status: string }>(`${this.api}/payment-methods/${id}`)
  }

  /** Fetch receipt HTML as a Blob (auth header attached by interceptor). */
  getReceipt(transactionId: string): Observable<Blob> {
    return this.http.get(`${this.api}/transactions/${transactionId}/receipt`, { responseType: 'blob' })
  }



  /** Refresh state silently (used after SignalR push). */
  private refreshState(): void {
    this.http.get<BillingStateDto>(`${this.api}/state`).subscribe({
      next: (state) => this._state.next(state),
      error: () => { /* silently ignored; UI retains last known state */ },
    })
  }
}

/**
 * BE returns CheckoutResponseDto flat: { type, orderId, iframeUrl, walletRedirectUrl,
 * fawryReference, fawryExpiresAt, preAuthAmountCents }. The FE UI expects a nested
 * { orderId, checkout: { type, ... } } shape — adapt here so call sites stay clean.
 */
function adaptCheckoutResponse(raw: any): CheckoutResponseDto {
  if (!raw) {
    return { orderId: '', checkout: { type: 'iframe', iframeUrl: '', expiresAt: '' } as any }
  }
  if (raw.checkout) return raw as CheckoutResponseDto

  const type = (raw.type ?? '').toString().toLowerCase()
  const orderId = raw.orderId ?? raw.OrderId ?? ''
  let checkout: any
  switch (type) {
    case 'iframe':
      checkout = { type: 'iframe', iframeUrl: raw.iframeUrl ?? raw.IframeUrl ?? '', expiresAt: '' }
      break
    case 'redirect':
      checkout = { type: 'redirect', redirectUrl: raw.walletRedirectUrl ?? raw.WalletRedirectUrl ?? '', expiresAt: '' }
      break
    case 'fawry':
      checkout = {
        type: 'fawry',
        fawryReference: raw.fawryReference ?? raw.FawryReference ?? '',
        amountCents: raw.preAuthAmountCents ?? raw.PreAuthAmountCents ?? 0,
        expiresAt: raw.fawryExpiresAt ?? raw.FawryExpiresAt ?? '',
        instructionsLocaleAr: '',
        instructionsLocaleEn: '',
      }
      break
    case 'saved-token-charge':
    case 'saved_token':
      checkout = { type: 'saved-token-charge', transactionId: orderId, status: 'Captured' }
      break
    default:
      checkout = { type: 'iframe', iframeUrl: raw.iframeUrl ?? '', expiresAt: '' }
  }
  return { orderId, checkout }
}
