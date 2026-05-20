import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillingService } from 'src/app/services/billing.service';
import {
  CheckoutRequestDto,
  CheckoutResponseDto,
  FawryCheckout,
  IframeCheckout,
  PaymentMethod,
  BillingPeriod,
} from 'src/app/models/billing/billing.models';

interface PlanOption {
  id: number;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;

  fawryData: FawryCheckout | null = null;
  pendingOrderId: string | null = null;

  readonly methods: { value: PaymentMethod; labelKey: string }[] = [
    { value: 'Card',       labelKey: 'checkout_method_card' },
    { value: 'Wallet',     labelKey: 'checkout_method_wallet' },
    { value: 'Fawry',      labelKey: 'checkout_method_fawry' },
    { value: 'SavedToken', labelKey: 'checkout_method_saved_token' },
  ];

  readonly periods: { value: BillingPeriod; labelKey: string }[] = [
    { value: 'Monthly', labelKey: 'billing_period_monthly' },
    { value: 'Annual',  labelKey: 'billing_period_annual' },
  ];

  constructor(
    private readonly billing: BillingService,
    private readonly router: Router,
    private readonly fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      planId:        [null],
      billingPeriod: ['Monthly', Validators.required],
      method:        ['Card', Validators.required],
      walletPhone:   [null],
    });
  }

  ngOnInit(): void {
    // Load current subscription state to pre-fill plan if available
    this.billing.getState().subscribe({
      next: (state) => {
        if (state?.subscription?.planId) {
          this.form.patchValue({ planId: state.subscription.planId });
        }
      },
      error: () => {},
    });
  }

  ngOnDestroy(): void {}

  get selectedMethod(): PaymentMethod {
    return this.form.get('method')?.value as PaymentMethod;
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      return;
    }
    this.submitting = true;
    this.fawryData = null;

    const req: CheckoutRequestDto = {
      planId:        this.form.value.planId,
      billingPeriod: this.form.value.billingPeriod,
      method:        this.form.value.method,
      walletPhone:   this.form.value.walletPhone ?? null,
    };

    this.billing.startCheckout(req).subscribe({
      next: (res) => this.handleResponse(res),
      error: () => {
        this.submitting = false;
      },
    });
  }

  private handleResponse(res: CheckoutResponseDto): void {
    this.submitting = false;
    const checkout = res.checkout;

    switch (checkout.type) {
      case 'iframe':
        window.location.assign((checkout as IframeCheckout).iframeUrl);
        break;
      case 'redirect':
        window.location.assign((checkout as { redirectUrl: string }).redirectUrl);
        break;
      case 'fawry':
        this.fawryData = checkout as FawryCheckout;
        break;
      case 'saved-token-charge':
        this.pendingOrderId = res.orderId;
        void this.router.navigate(['/billing/result', res.orderId]);
        break;
    }
  }
}
