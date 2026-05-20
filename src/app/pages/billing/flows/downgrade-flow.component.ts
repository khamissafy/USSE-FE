import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BillingService } from 'src/app/services/billing.service';
import { BillingPeriod, DowngradeRequestDto, DowngradeResponseDto } from 'src/app/models/billing/billing.models';

interface DowngradePlanOption {
  id: number;
  name: string;
}

const ALL_PLANS: DowngradePlanOption[] = [
  { id: 1, name: 'Starter' },
  { id: 2, name: 'Basic' },
];

@Component({
  selector: 'app-downgrade-flow',
  templateUrl: './downgrade-flow.component.html',
  styleUrls: ['./downgrade-flow.component.scss'],
})
export class DowngradeFlowComponent {
  @Input() billingPeriod: BillingPeriod = 'Monthly';
  @Input() currentPlanId: number | undefined;
  @Output() downgraded = new EventEmitter<DowngradeResponseDto>();
  @Output() cancelled = new EventEmitter<void>();

  selectedPlanId: number | null = null;
  loading = false;
  result: DowngradeResponseDto | null = null;

  get lowerPlans(): DowngradePlanOption[] {
    if (!this.currentPlanId) return [];
    return ALL_PLANS.filter(p => p.id < this.currentPlanId!);
  }

  constructor(private readonly billing: BillingService) {}

  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
  }

  confirm(): void {
    if (!this.selectedPlanId || this.loading) return;
    this.loading = true;
    const req: DowngradeRequestDto = {
      targetPlanId: this.selectedPlanId,
      targetBillingPeriod: this.billingPeriod,
    };
    this.billing.downgrade(req).subscribe({
      next: (res) => {
        this.loading = false;
        this.result = res;
        this.downgraded.emit(res);
        this.billing.getState().subscribe();
      },
      error: () => { this.loading = false; },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
