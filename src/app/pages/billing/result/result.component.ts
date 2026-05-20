import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { BillingService } from 'src/app/services/billing.service';
import { BillingStateDto, TransactionStatus } from 'src/app/models/billing/billing.models';

type ResultState = 'pending' | 'paid' | 'failed' | 'timeout';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss'],
})
export class ResultComponent implements OnInit, OnDestroy {
  orderId: string = '';
  resultState: ResultState = 'pending';
  billingState: BillingStateDto | null = null;

  private stateSub?: Subscription;
  private pollSub?: Subscription;
  private pollActive = true;
  private readonly pollMaxSeconds = 60;
  private pollElapsed = 0;

  constructor(
    private readonly billing: BillingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // Paymob can call us in two shapes:
    //   /billing/result/<orderId>                       — our intention.redirection_url
    //   /billing/result?id=<txn>&success=true&...       — Paymob dashboard default
    this.orderId = this.route.snapshot.paramMap.get('orderId') ?? '';

    // Optimistic UI: if the callback already says success=true, surface "paid" while we
    // wait for the webhook to land and SignalR to confirm. If the webhook eventually
    // updates state to Active, we stay paid. If it fails, polling will flip us to failed.
    const successFlag = this.route.snapshot.queryParamMap.get('success');
    const pendingFlag = this.route.snapshot.queryParamMap.get('pending');
    if (successFlag === 'true' && pendingFlag !== 'true') {
      this.resultState = 'paid';
    } else if (successFlag === 'false') {
      this.resultState = 'failed';
    }

    // Primary: listen to SignalR-driven state$
    this.stateSub = this.billing.state$.subscribe((state) => {
      if (!state) return;
      this.billingState = state;
      this.applyState(state);
    });

    // Load current state immediately
    this.billing.getState().subscribe();

    // Fallback: poll every 3 s for up to 60 s
    this.pollSub = interval(3000)
      .pipe(takeWhile(() => this.pollActive && this.pollElapsed < this.pollMaxSeconds))
      .subscribe(() => {
        this.pollElapsed += 3;
        if (this.resultState === 'pending') {
          this.billing.getState().subscribe();
        }
        if (this.pollElapsed >= this.pollMaxSeconds && this.resultState === 'pending') {
          this.resultState = 'timeout';
          this.pollActive = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.pollActive = false;
    this.stateSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  get transaction() {
    // Find the transaction linked to this order in the last known state
    // The state$ refresh after webhook will update this automatically
    return null; // detailed transaction lookup is in the transaction-history endpoint
  }

  backToDashboard(): void {
    void this.router.navigate(['/info']);
  }

  retryCheckout(): void {
    void this.router.navigate(['/billing/checkout']);
  }

  private applyState(state: BillingStateDto): void {
    // Consider paid when the subscription is Active (Trial→Active transition confirms payment)
    const status = state.subscription?.status;
    if (status === 'Active') {
      this.resultState = 'paid';
      this.pollActive = false;
    }
    // If there's a recent failed-renewal indicator, consider failed
    if (state.subscription?.failedRenewalAttempts > 0 && status !== 'Active') {
      this.resultState = 'failed';
      this.pollActive = false;
    }
  }
}
