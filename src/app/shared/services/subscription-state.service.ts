import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  SubscriptionState,
  SubscriptionPlanDto,
  SubscriptionBillingDto,
  SubscriptionUsageDto,
} from '../models/subscription';

@Injectable({ providedIn: 'root' })
export class SubscriptionStateService {
  private readonly _state$ = new BehaviorSubject<SubscriptionState | null>(null);

  readonly state$: Observable<SubscriptionState | null> = this._state$.asObservable();

  readonly plan$: Observable<SubscriptionPlanDto | null> = this.state$.pipe(
    map(s => s?.plan ?? null)
  );

  readonly billing$: Observable<SubscriptionBillingDto | null> = this.state$.pipe(
    map(s => s?.billing ?? null)
  );

  readonly usage$: Observable<SubscriptionUsageDto | null> = this.state$.pipe(
    map(s => s?.usage ?? null)
  );

  constructor(private readonly http: HttpClient) {}

  loadSnapshot(): Observable<SubscriptionState> {
    // ApiResultUnwrapInterceptor already unwraps { status: true, data: X } -> X,
    // so HttpClient delivers the SubscriptionState directly here.
    return this.http
      .get<SubscriptionState>(`${environment.api}Subscription/me`)
      .pipe(tap(state => this._state$.next(state)));
  }

  refreshSnapshot(): Observable<SubscriptionState> {
    return this.loadSnapshot();
  }

  /** Synchronous accessor for the last cached snapshot. */
  getCurrent(): SubscriptionState | null {
    return this._state$.value;
  }

  /** Effective limit = plan_limit + add-on (null plan_limit means unlimited → returns null). */
  private effectiveLimit(planValue: number | null, addonValue: number | null): number | null {
    if (planValue == null) return null;
    return planValue + (addonValue ?? 0);
  }

  /** True when current device count has reached the effective MaxDevices cap. */
  isAtDeviceLimit(): boolean {
    const s = this._state$.value;
    if (!s) return false;
    const cap = this.effectiveLimit(s.plan.maxDevices, s.addons.extraDevices);
    return cap != null && s.usage.deviceCount >= cap;
  }

  /** True when concurrent active campaign count has reached the effective cap (or feature disabled). */
  isAtCampaignLimit(): boolean {
    const s = this._state$.value;
    if (!s) return false;
    const cap = s.plan.maxActiveCampaigns;
    if (cap === 0) return true; // feature unavailable on this tier
    return cap != null && s.usage.activeCampaignCount >= cap;
  }

  /** True when an attempted campaign with `count` contacts would exceed the plan cap. */
  exceedsCampaignContacts(count: number): boolean {
    const s = this._state$.value;
    if (!s) return false;
    const cap = s.plan.maxContactsPerCampaign;
    return cap != null && count > cap;
  }

  /** True when current team-member count has reached the effective seat cap. */
  isAtSeatLimit(): boolean {
    const s = this._state$.value;
    if (!s) return false;
    const cap = this.effectiveLimit(s.plan.maxTeamMembers, s.addons.extraSeats);
    return cap != null && s.usage.teamMemberCount >= cap;
  }

  /** True when current bot count has reached the plan's maxBots cap (0 = unavailable). */
  isAtBotLimit(): boolean {
    const s = this._state$.value;
    if (!s) return false;
    const cap = s.plan.maxBots;
    if (cap === 0) return true;
    return cap != null && s.usage.botCount >= cap;
  }
}
