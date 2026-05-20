import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingService } from 'src/app/services/billing.service';
import { BillingPeriod, IframeCheckout, UpgradeRequestDto, UpgradeResponseDto } from 'src/app/models/billing/billing.models';
import { PLAN_NAMES } from 'src/app/models/billing/plan-names';

interface UpgradePlanOption {
  id: number;
  name: string;
  descKey: string;
}

const ALL_UPGRADE_PLANS: UpgradePlanOption[] = [
  { id: 2, name: PLAN_NAMES[2], descKey: 'billing_upgrade_plan_basic' },
  { id: 3, name: PLAN_NAMES[3], descKey: 'billing_upgrade_plan_growth' },
  { id: 4, name: PLAN_NAMES[4], descKey: 'billing_upgrade_plan_enterprise' },
];

@Component({
  selector: 'app-upgrade-flow',
  templateUrl: './upgrade-flow.component.html',
  styleUrls: ['./upgrade-flow.component.scss'],
})
export class UpgradeFlowComponent {
  @Input() currentPlanId: number | undefined;
  @Input() billingPeriod: BillingPeriod = 'Monthly';
  @Input() hasCard = false;
  @Output() upgraded = new EventEmitter<UpgradeResponseDto>();
  @Output() cancelled = new EventEmitter<void>();

  selectedPlanId: number | null = null;
  loading = false;
  result: UpgradeResponseDto | null = null;

  constructor(private readonly billing: BillingService) {}

  get higherPlans(): UpgradePlanOption[] {
    if (this.currentPlanId == null) return ALL_UPGRADE_PLANS;
    return ALL_UPGRADE_PLANS.filter(p => p.id > this.currentPlanId!);
  }

  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
  }

  confirm(): void {
    if (!this.selectedPlanId || this.loading) return;
    this.loading = true;
    const req: UpgradeRequestDto = {
      targetPlanId: this.selectedPlanId,
      targetBillingPeriod: this.billingPeriod,
      useSavedPaymentMethod: this.hasCard,
    };
    this.billing.upgrade(req).subscribe({
      next: (res) => {
        this.loading = false;
        this.result = res;
        if (res.checkout?.type === 'iframe') {
          window.location.assign((res.checkout as IframeCheckout).iframeUrl);
        } else {
          this.upgraded.emit(res);
        }
      },
      error: () => { this.loading = false; },
    });
  }

  cancel(): void {
    if (this.result) {
      this.upgraded.emit(this.result);
    } else {
      this.cancelled.emit();
    }
  }
}
