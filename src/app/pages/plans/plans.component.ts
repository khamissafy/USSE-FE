import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SubscriptionPlanDto, PlanFeatureKey } from 'src/app/shared/models/subscription';

interface ApiResponse<T> {
  status: boolean;
  data: T;
}

/** All features shown in the comparison matrix with their display label key. */
const ALL_FEATURES: { key: PlanFeatureKey; label: string }[] = [
  { key: 'aiBot',                   label: 'feature_ai_bot' },
  { key: 'aiActionTriggers',        label: 'feature_ai_action_triggers' },
  { key: 'campaignScheduling',      label: 'feature_campaign_scheduling' },
  { key: 'agentAssignment',         label: 'feature_agent_assignment' },
  { key: 'sharedInboxFull',         label: 'feature_shared_inbox_full' },
  { key: 'webhookCustomerEvents',   label: 'feature_webhook_customer_events' },
  { key: 'dataExportCsv',           label: 'feature_data_export_csv' },
  { key: 'dataExportExcel',         label: 'feature_data_export_excel' },
  { key: 'advancedAnalytics',       label: 'feature_advanced_analytics' },
  { key: 'botAnalytics',            label: 'feature_bot_analytics' },
  { key: 'prioritySupport',         label: 'feature_priority_support' },
  { key: 'customAiPrompts',         label: 'feature_custom_ai_prompts' },
  { key: 'crmIntegration',          label: 'feature_crm_integration' },
  { key: 'whiteLabel',              label: 'feature_white_label' },
  { key: 'onPremiseDeploy',         label: 'feature_on_premise_deploy' },
  { key: 'dedicatedAccountManager', label: 'feature_dedicated_account_manager' },
  { key: 'sla999',                  label: 'feature_sla_999' },
];

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
})
export class PlansComponent implements OnInit {
  plans: SubscriptionPlanDto[] = [];
  allFeatures = ALL_FEATURES;
  billingPeriod: 'Monthly' | 'Annual' = 'Monthly';
  loading = true;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<ApiResponse<SubscriptionPlanDto[]>>(`${environment.api}Subscription/plans`)
      .pipe(map(r => r.data))
      .subscribe({
        next: plans => {
          this.plans = plans;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  toggleBilling(): void {
    this.billingPeriod = this.billingPeriod === 'Monthly' ? 'Annual' : 'Monthly';
  }

  displayPrice(plan: SubscriptionPlanDto): string {
    if (plan.tier === 'Enterprise') return 'Custom';
    if (plan.tier === 'Starter') return 'Free';
    const price =
      this.billingPeriod === 'Monthly'
        ? plan.priceUsdMonthly
        : plan.priceUsdAnnualMonthly;
    return price !== null ? `$${price}/mo` : 'Custom';
  }

  hasFeature(plan: SubscriptionPlanDto, key: PlanFeatureKey): boolean {
    return plan.features.includes(key);
  }

  signupUrl(plan: SubscriptionPlanDto): string {
    if (plan.tier === 'Starter') return '/register';
    if (plan.tier === 'Enterprise') return 'mailto:sales@qweira.com';
    return `/register?tier=${plan.tier}&period=${this.billingPeriod}`;
  }

  ctaLabel(plan: SubscriptionPlanDto): string {
    if (plan.tier === 'Starter') return 'get_started_free';
    if (plan.tier === 'Enterprise') return 'contact_sales';
    return plan.trialDays > 0 ? 'start_free_trial' : 'subscribe_now';
  }
}
