import { Component, Input } from '@angular/core';
import { SubscriptionDto } from 'src/app/models/billing/billing.models';

@Component({
  selector: 'app-plan-card',
  template: `
    <div class="plan-card" *ngIf="subscription">
      <div class="plan-header">
        <span class="plan-name">{{ subscription.planName }}</span>
        <span class="plan-status" [ngClass]="'status-' + subscription.status?.toLowerCase()">
          {{ subscription.status | translate }}
        </span>
      </div>
      <div class="plan-price">
        {{ subscription.priceAmountCents / 100 | number:'1.2-2' }} EGP /
        {{ subscription.billingPeriod | translate }}
      </div>
      <div class="plan-dates" *ngIf="subscription.currentCycleEnd">
        <span>{{ 'billing_next_renewal' | translate }}:</span>
        {{ (subscription.nextRenewalDate || subscription.currentCycleEnd) | date:'mediumDate' }}
      </div>
      <div class="plan-trial" *ngIf="subscription.trialEndsAt">
        <span class="trial-badge">{{ 'billing_trial' | translate }}</span>
        {{ 'billing_trial_ends' | translate }}: {{ subscription.trialEndsAt | date:'mediumDate' }}
      </div>
      <div class="plan-past-due" *ngIf="subscription.pastDueSince">
        <span class="past-due-badge">{{ 'billing_past_due' | translate }}</span>
        {{ 'billing_past_due_since' | translate }}: {{ subscription.pastDueSince | date:'mediumDate' }}
      </div>
    </div>
  `,
  styles: [`
    .plan-card { padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; }
    .plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .plan-name { font-size: 1.2rem; font-weight: 600; }
    .plan-status { padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-trial { background: #e3f2fd; color: #1565c0; }
    .status-pastdue { background: #fff3e0; color: #e65100; }
    .status-cancelled { background: #fce4ec; color: #b71c1c; }
    .status-expired { background: #f3e5f5; color: #6a1b9a; }
    .plan-price { font-size: 1rem; color: #555; margin-bottom: 8px; }
    .plan-dates { font-size: 0.9rem; color: #777; }
    .trial-badge, .past-due-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 6px; }
    .trial-badge { background: #bbdefb; color: #0d47a1; }
    .past-due-badge { background: #ffccbc; color: #bf360c; }
  `],
})
export class PlanCardComponent {
  @Input() subscription: SubscriptionDto | undefined | null;
}
