import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SubscriptionManagementComponent } from './subscription-management/subscription-management.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ResultComponent } from './result/result.component';

const routes: Routes = [
  { path: '', component: SubscriptionManagementComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'result/:orderId', component: ResultComponent },
  // Fallback for Paymob's default callback that appends query params instead of a path
  // segment (e.g. /billing/result?id=...&success=true). We rely on SignalR + state polling
  // inside ResultComponent — no orderId is required to know whether the user's plan changed.
  { path: 'result', component: ResultComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BillingRoutingModule {}
