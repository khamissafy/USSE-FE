import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { BillingRoutingModule } from './billing-routing.module';

import { CheckoutComponent } from './checkout/checkout.component';
import { ResultComponent } from './result/result.component';
import { SubscriptionManagementComponent } from './subscription-management/subscription-management.component';

import { PlanCardComponent } from './components/plan-card.component';
import { TransactionRowComponent } from './components/transaction-row.component';
import { CardOnFileComponent } from './components/card-on-file.component';
import { ScheduledChangeBannerComponent } from './components/scheduled-change-banner.component';
import { ReceiptDownloadComponent } from './components/receipt-download.component';

import { UpgradeFlowComponent } from './flows/upgrade-flow.component';
import { DowngradeFlowComponent } from './flows/downgrade-flow.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    BillingRoutingModule,
  ],
  declarations: [
    CheckoutComponent,
    ResultComponent,
    SubscriptionManagementComponent,
    PlanCardComponent,
    TransactionRowComponent,
    CardOnFileComponent,
    ScheduledChangeBannerComponent,
    ReceiptDownloadComponent,
    UpgradeFlowComponent,
    DowngradeFlowComponent,
  ],
})
export class BillingModule {}
