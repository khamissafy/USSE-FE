export type SubscriptionTier = 'Starter' | 'Basic' | 'Growth' | 'Pro' | 'Enterprise';
export type SubscriptionStatusKind = 'Trial' | 'Active' | 'Suspended' | 'Expired' | 'Grace';
export type BillingPeriod = 'Monthly' | 'Annual';
export type Currency = 'USD' | 'EGP';

// Recorded on Device entity for routing/reporting only; not gated by plan (FR-006).
export type DeviceType = 'Wa' | 'Tg' | 'Smpp' | 'OfficialApi';

export type PlanFeatureKey =
  | 'aiBot'
  | 'aiActionTriggers'
  | 'campaignScheduling'
  | 'agentAssignment'
  | 'sharedInboxFull'
  | 'webhookCustomerEvents'
  | 'dataExportCsv'
  | 'dataExportExcel'
  | 'prioritySupport'
  | 'whiteLabel'
  | 'onPremiseDeploy'
  | 'crmIntegration'
  | 'customAiPrompts'
  | 'dedicatedAccountManager'
  | 'sla999'
  | 'advancedAnalytics'
  | 'botAnalytics'
  | 'knowledgeBase';

export interface SubscriptionPlanDto {
  tier: SubscriptionTier;
  displayName: string;
  maxDevices: number | null;
  maxOutgoingMessagesPerCycle: number | null;
  fairUseDailyPerDevice: number | null;
  maxBots: number | null;
  allowsAiBot: boolean;
  aiModelTier: string | null;
  maxKnowledgeBaseMb: number | null;
  maxWorkflowActions: number | null;
  maxActiveCampaigns: number | null;
  maxContactsPerCampaign: number | null;
  maxTeamMembers: number | null;
  features: PlanFeatureKey[];
  priceUsdMonthly: number | null;
  priceUsdAnnualMonthly: number | null;
  priceEgpMonthly: number | null;
  priceEgpAnnualMonthly: number | null;
  trialDays: number;
}

export interface SubscriptionBillingDto {
  status: SubscriptionStatusKind;
  currency: Currency;
  billingPeriod: BillingPeriod;
  priceAmount: number | null;
  nextRenewalAmount: number | null;
  nextRenewalDate: string | null;
  trialEndsAt: string | null;
  cycleStartDate: string;
  nextCycleStartDate: string;
}

export interface SubscriptionUsageDto {
  outgoingMessageCount: number;
  activeCampaignCount: number;
  deviceCount: number;
  botCount: number;
  knowledgeBaseBytesUsed: number;
  teamMemberCount: number;
}

export interface SubscriptionState {
  plan: SubscriptionPlanDto;
  billing: SubscriptionBillingDto;
  usage: SubscriptionUsageDto;
  isInGrace: boolean;
  graceVectors: string[];
  addons: {
    extraDevices: number | null;
    extraSeats: number | null;
    extraKnowledgeBaseMb: number | null;
    officialApiDevices: number | null;
  };
}
