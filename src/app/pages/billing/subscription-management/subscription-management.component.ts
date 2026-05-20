import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BillingService } from 'src/app/services/billing.service';
import {
  BillingStateDto,
  BillingPeriod,
  TransactionDto,
} from 'src/app/models/billing/billing.models';

@Component({
  selector: 'app-subscription-management',
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.scss'],
})
export class SubscriptionManagementComponent implements OnInit, OnDestroy {
  state: BillingStateDto | null = null;
  transactions: TransactionDto[] = [];
  transactionsTotal = 0;
  transactionsPage = 1;
  loadingState = true;
  loadingTransactions = false;

  showUpgradeFlow = false;
  showDowngradeFlow = false;

  private stateSub?: Subscription;

  constructor(
    readonly billing: BillingService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.stateSub = this.billing.state$.subscribe((s) => {
      this.state = s;
      this.loadingState = false;
    });
    this.billing.getState().subscribe({ error: () => { this.loadingState = false; } });
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
  }

  loadTransactions(): void {
    this.loadingTransactions = true;
    this.billing.getTransactions({ page: this.transactionsPage }).subscribe({
      next: (page) => {
        this.transactions = page.items;
        this.transactionsTotal = page.total;
        this.loadingTransactions = false;
      },
      error: () => { this.loadingTransactions = false; },
    });
  }

  get billingPeriod(): BillingPeriod {
    return (this.state?.subscription as any)?.billingPeriod ?? 'Monthly';
  }

  get hasCard(): boolean {
    return !!this.state?.defaultPaymentMethod;
  }

  get currentPlanId(): number | undefined {
    return (this.state?.subscription as any)?.planId ?? (this.state?.subscription as any)?.plan?.id;
  }

  /** Paid plan = any plan other than the free Starter (id 1). */
  get isPaidPlan(): boolean {
    const id = this.currentPlanId;
    return id != null && id !== 1;
  }

  toggleUpgradeFlow(): void {
    this.showUpgradeFlow = !this.showUpgradeFlow;
    if (this.showUpgradeFlow) this.showDowngradeFlow = false;
  }

  toggleDowngradeFlow(): void {
    this.showDowngradeFlow = !this.showDowngradeFlow;
    if (this.showDowngradeFlow) this.showUpgradeFlow = false;
  }

  onUpgraded(): void {
    this.showUpgradeFlow = false;
    this.billing.getState().subscribe();
  }

  onDowngraded(): void {
    this.showDowngradeFlow = false;
  }

  onCancelScheduledChange(): void {
    this.billing.cancelScheduledChange().subscribe({
      next: () => this.billing.getState().subscribe(),
    });
  }

  onCancelSubscription(): void {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    this.billing.cancelSubscription().subscribe({
      next: () => this.billing.getState().subscribe(),
    });
  }

  nextPage(): void {
    this.transactionsPage++;
    this.loadTransactions();
  }

  prevPage(): void {
    if (this.transactionsPage > 1) {
      this.transactionsPage--;
      this.loadTransactions();
    }
  }
}
