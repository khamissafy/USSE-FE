import { Component, Input } from '@angular/core';
import { TransactionDto } from 'src/app/models/billing/billing.models';
import { BillingService } from 'src/app/services/billing.service';

@Component({
  selector: 'app-transaction-row',
  template: `
    <tr *ngIf="transaction">
      <td>{{ transaction.createdAt | date:'mediumDate' }}</td>
      <td>{{ transaction.purpose }}</td>
      <td>{{ transaction.method }}</td>
      <td>{{ transaction.amountCents / 100 | number:'1.2-2' }} {{ transaction.currency }}</td>
      <td>
        <span class="tx-status" [ngClass]="'status-' + transaction.status?.toLowerCase()">
          {{ transaction.status }}
        </span>
      </td>
      <td>
        <app-receipt-download [transactionId]="transaction.id"></app-receipt-download>
      </td>
    </tr>
  `,
  styles: [`
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tx-status { padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; font-weight: 500; }
    .status-paid { background: #e8f5e9; color: #2e7d32; }
    .status-pending { background: #fff8e1; color: #f57f17; }
    .status-failed { background: #fce4ec; color: #b71c1c; }
    .status-refunded { background: #f3e5f5; color: #6a1b9a; }
  `],
})
export class TransactionRowComponent {
  @Input() transaction: TransactionDto | undefined;

  constructor(readonly billing: BillingService) {}
}
