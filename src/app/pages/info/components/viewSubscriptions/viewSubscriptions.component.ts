import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { SubscriptionStateService } from 'src/app/shared/services/subscription-state.service';
import { PlanFeatureKey, SubscriptionState } from 'src/app/shared/models/subscription';

/** All 18 feature flags displayed on the info page. */
const FEATURE_LIST: { key: PlanFeatureKey; label: string }[] = [
  { key: 'aiBot',                   label: 'feature_ai_bot' },
  { key: 'aiActionTriggers',        label: 'feature_ai_action_triggers' },
  { key: 'campaignScheduling',      label: 'feature_campaign_scheduling' },
  { key: 'agentAssignment',         label: 'feature_agent_assignment' },
  { key: 'sharedInboxFull',         label: 'feature_shared_inbox_full' },
  { key: 'webhookCustomerEvents',   label: 'feature_webhook_customer_events' },
  { key: 'dataExportCsv',           label: 'feature_data_export_csv' },
  { key: 'dataExportExcel',         label: 'feature_data_export_excel' },
  { key: 'prioritySupport',         label: 'feature_priority_support' },
  { key: 'whiteLabel',              label: 'feature_white_label' },
  { key: 'onPremiseDeploy',         label: 'feature_on_premise_deploy' },
  { key: 'crmIntegration',          label: 'feature_crm_integration' },
  { key: 'customAiPrompts',         label: 'feature_custom_ai_prompts' },
  { key: 'dedicatedAccountManager', label: 'feature_dedicated_account_manager' },
  { key: 'sla999',                  label: 'feature_sla_999' },
  { key: 'advancedAnalytics',       label: 'feature_advanced_analytics' },
  { key: 'botAnalytics',            label: 'feature_bot_analytics' },
  { key: 'knowledgeBase',           label: 'feature_knowledge_base' },
];

@Component({
  selector: 'app-viewSubscriptions',
  templateUrl: './viewSubscriptions.component.html',
  styleUrls: ['./viewSubscriptions.component.scss']
})
export class ViewSubscriptionsComponent implements OnInit, OnDestroy {

  readonly featureList = FEATURE_LIST;
  state: SubscriptionState | null = null;

  private readonly _destroy$ = new Subject<void>();
  private _pollSub: Subscription | null = null;

  constructor(private readonly subscriptionState: SubscriptionStateService) {}

  ngOnInit(): void {
    // Initial load plus a 60-second polling interval to keep data fresh.
    this._pollSub = interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() => this.subscriptionState.refreshSnapshot()),
        takeUntil(this._destroy$)
      )
      .subscribe({
        next: state => (this.state = state),
        error: () => {
          // Fall back to cached state if the refresh call fails.
          this.subscriptionState.state$
            .pipe(takeUntil(this._destroy$))
            .subscribe(s => (this.state = s));
        },
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /** Computes usage percentage for progress bars; caps at 100 so bar never overflows. */
  usagePct(used: number, limit: number | null): number {
    if (limit === null || limit === 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  }

  /** Returns 'warn' (≥80%) or 'accent' (≥100%) colour class for progress bars. */
  barColor(used: number, limit: number | null): string {
    if (limit === null) return 'primary';
    const pct = (used / limit) * 100;
    if (pct >= 100) return 'warn';
    if (pct >= 80) return 'accent';
    return 'primary';
  }

  /** Converts raw KB bytes to display MB (2 dp). */
  bytesToMb(bytes: number): string {
    return (bytes / 1_048_576).toFixed(2);
  }

  /** Days remaining until trial ends (0 when expired). */
  trialDaysRemaining(trialEndsAt: string | null): number {
    if (!trialEndsAt) return 0;
    const diff = new Date(trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  /** Formats a price as a display string; null → 'Custom'. */
  formatPrice(amount: number | null, currency: string): string {
    if (amount === null) return 'Custom';
    return `${amount} ${currency}`;
  }
}
