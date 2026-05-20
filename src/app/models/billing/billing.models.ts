// ── Billing Domain Models ────────────────────────────────────────────────────
// Mirror the response shapes from contracts/http-billing-api.md §1, §2, §4, §12

export type SubscriptionStatus = 'Trial' | 'Active' | 'PastDue' | 'Cancelled' | 'Expired' | 'Grace' | 'Suspended';
export type BillingPeriod = 'Monthly' | 'Annual';
export type PaymentMethod = 'Card' | 'Wallet' | 'Fawry' | 'SavedToken';
export type TransactionStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Disputed';
export type CheckoutType = 'iframe' | 'redirect' | 'fawry' | 'saved-token-charge';
export type BillingStateChangedKind =
  | 'TransactionUpdated'
  | 'SubscriptionUpdated'
  | 'PaymentMethodUpdated'
  | 'ScheduledChangeUpdated';

// ── §1: GET /api/billing/state ───────────────────────────────────────────────

export interface PlanRef {
  id: number;
  name: string;
  code: string;
}

export interface SubscriptionDto {
  planId: number;
  planName: string;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod;
  currency: string;
  priceAmountCents: number;
  currentCycleStart: string;
  currentCycleEnd: string;
  trialEndsAt: string | null;
  pastDueSince: string | null;
  failedRenewalAttempts: number;
  nextRenewalDate: string;
  nextRenewalAmountCents: number;
}

export interface PaymentMethodDto {
  id: string;
  brand: string;
  maskedPan: string;
  expiryMonth: number;
  expiryYear: number;
  status: string;
}

export interface ScheduledChangeDto {
  id: string;
  targetPlan: PlanRef;
  targetBillingPeriod: BillingPeriod;
  effectiveAt: string;
  reason: string;
}

export interface OpenFawryOrderDto {
  orderId: string;
  fawryReference: string;
  expiresAt: string;
  amountCents: number;
}

export interface BillingStateDto {
  subscription: SubscriptionDto;
  defaultPaymentMethod: PaymentMethodDto | null;
  scheduledChange: ScheduledChangeDto | null;
  openFawryOrder: OpenFawryOrderDto | null;
}

// ── §2: GET /api/billing/transactions ────────────────────────────────────────

export interface TransactionDto {
  id: string;
  providerOrderId: string;
  providerTransactionId: string;
  method: PaymentMethod;
  status: TransactionStatus;
  amountCents: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  purpose: string;
  receiptUrl: string;
}

export interface TransactionPageDto {
  page: number;
  pageSize: number;
  total: number;
  items: TransactionDto[];
}

export interface TransactionFilter {
  page?: number;
  pageSize?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

// ── §4: POST /api/billing/checkout ───────────────────────────────────────────

export interface CheckoutRequestDto {
  planId: number;
  billingPeriod: BillingPeriod;
  method: PaymentMethod;
  savedPaymentMethodId?: string | null;
  walletPhone?: string | null;
}

export interface IframeCheckout {
  type: 'iframe';
  iframeUrl: string;
  expiresAt: string;
}

export interface RedirectCheckout {
  type: 'redirect';
  redirectUrl: string;
  expiresAt: string;
}

export interface FawryCheckout {
  type: 'fawry';
  fawryReference: string;
  amountCents: number;
  expiresAt: string;
  instructionsLocaleAr: string;
  instructionsLocaleEn: string;
}

export interface SavedTokenCheckout {
  type: 'saved-token-charge';
  transactionId: string;
  status: TransactionStatus;
}

export type CheckoutDetails = IframeCheckout | RedirectCheckout | FawryCheckout | SavedTokenCheckout;

export interface CheckoutResponseDto {
  orderId: string;
  providerOrderId?: string;
  checkout: CheckoutDetails;
}

// ── §5: POST /api/billing/upgrade ────────────────────────────────────────────

export interface UpgradeRequestDto {
  targetPlanId: number;
  targetBillingPeriod: BillingPeriod;
  useSavedPaymentMethod: boolean;
  savedPaymentMethodId?: string | null;
}

export interface UpgradeQuoteDto {
  currentPlan: string;
  targetPlan: string;
  daysRemaining: number;
  cycleLengthDays: number;
  prorationAmountCents: number;
  currency: string;
  appliedWithoutCharge: boolean;
}

export interface UpgradeOrderDto {
  orderId: string;
  transactionId: string | null;
  status: string;
}

export interface UpgradeResponseDto {
  quote: UpgradeQuoteDto;
  order: UpgradeOrderDto | null;
  checkout: CheckoutDetails | null;
  supersededScheduledChange: { id: string; wasCancelled: boolean } | null;
}

// ── §6: POST /api/billing/downgrade ──────────────────────────────────────────

export interface DowngradeRequestDto {
  targetPlanId: number;
  targetBillingPeriod: BillingPeriod;
}

export interface DowngradeResponseDto {
  scheduledChange: ScheduledChangeDto & {
    currentBillingPeriod: string;
    originalCycleStart: string;
    noRefundDisclosure: string;
    noRefundDisclosureAr: string;
  };
  supersededScheduledChange: { id: string; wasCancelled: boolean } | null;
}

// ── §12: SignalR BillingStateChanged event ───────────────────────────────────

export interface BillingStateChangedEvent {
  kind: BillingStateChangedKind;
  subscriptionId: number;
  transactionId: string | null;
  status: string;
  occurredAt: string;
}
