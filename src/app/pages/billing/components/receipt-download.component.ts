import { Component, Input } from '@angular/core';
import { BillingService } from 'src/app/services/billing.service';

@Component({
  selector: 'app-receipt-download',
  template: `
    <button *ngIf="transactionId"
       (click)="download()"
       [disabled]="loading"
       class="receipt-btn"
       [title]="'billing_download_receipt' | translate">
      <span *ngIf="loading" class="spinner">⏳</span>
      <span *ngIf="!loading">⬇ {{ 'billing_receipt' | translate }}</span>
    </button>
  `,
  styles: [`
    .receipt-btn { background: none; border: none; color: #1976d2; cursor: pointer; font-size: 0.85rem; padding: 0; }
    .receipt-btn:hover:not(:disabled) { text-decoration: underline; }
    .receipt-btn:disabled { opacity: 0.6; cursor: wait; }
  `],
})
export class ReceiptDownloadComponent {
  @Input() transactionId: string | undefined;
  loading = false;

  constructor(private readonly billing: BillingService) {}

  download(): void {
    if (!this.transactionId || this.loading) return;
    this.loading = true;
    this.billing.getReceipt(this.transactionId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
