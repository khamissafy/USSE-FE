import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SubscriptionStateService } from '../services/subscription-state.service';
import { PlanFeatureKey } from '../models/subscription';

/**
 * Structural directive that renders the embedded template only when the
 * authenticated user's subscription plan includes the requested feature.
 *
 * Usage:
 *   <div *appHasFeature="'aiBot'">AI-only content</div>
 *
 * The element is removed from the DOM entirely when the feature is absent,
 * making it safe for feature-gating entire sections without additional
 * CSS or conditional checks.
 */
@Directive({ selector: '[appHasFeature]' })
export class HasFeatureDirective implements OnInit, OnDestroy {
  /** The feature key to test (camelCase, matches PlanFeatureKey). */
  @Input('appHasFeature') featureKey: PlanFeatureKey | '' = '';

  private _sub: Subscription | null = null;
  private _hasView = false;

  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainer: ViewContainerRef,
    private readonly subscriptionState: SubscriptionStateService
  ) {}

  ngOnInit(): void {
    this._sub = this.subscriptionState.plan$.subscribe(plan => {
      const hasFeature =
        !!this.featureKey &&
        !!plan &&
        plan.features.includes(this.featureKey as PlanFeatureKey);

      if (hasFeature && !this._hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this._hasView = true;
      } else if (!hasFeature && this._hasView) {
        this.viewContainer.clear();
        this._hasView = false;
      }
    });
  }

  ngOnDestroy(): void {
    this._sub?.unsubscribe();
  }
}
