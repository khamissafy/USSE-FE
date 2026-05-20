import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ScheduledChangeDto } from 'src/app/models/billing/billing.models';
import { PLAN_NAMES } from 'src/app/models/billing/plan-names';

@Component({
  selector: 'app-scheduled-change-banner',
  template: `
    <div class="scheduled-banner" *ngIf="change">
      <div class="banner-icon">📅</div>
      <div class="banner-body">
        <strong>{{ 'billing_scheduled_change_title' | translate }}</strong>
        <span>
          {{ 'billing_scheduled_change_detail' | translate:{
            plan: change.targetPlan?.name || planNames[change.targetPlan?.id],
            date: change.effectiveAt | date:'mediumDate'
          } }}
        </span>
        <span class="reason-badge">{{ change.reason }}</span>
      </div>
      <button class="btn-cancel" (click)="cancelChange.emit()">
        {{ 'billing_cancel_scheduled_change' | translate }}
      </button>
    </div>
  `,
  styles: [`
    .scheduled-banner { display: flex; gap: 12px; align-items: center; padding: 12px 16px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; }
    .banner-icon { font-size: 1.4rem; }
    .banner-body { flex: 1; display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; }
    .reason-badge { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 0.75rem; background: #ffe0b2; color: #e65100; width: fit-content; }
    .btn-cancel { background: none; border: 1px solid #ef9a9a; color: #c62828; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; white-space: nowrap; }
    .btn-cancel:hover { background: #fce4ec; }
  `],
})
export class ScheduledChangeBannerComponent {
  @Input() change: ScheduledChangeDto | undefined | null;
  @Output() cancelChange = new EventEmitter<void>();
  readonly planNames = PLAN_NAMES;
}
