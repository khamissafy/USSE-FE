import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaymentMethodDto } from 'src/app/models/billing/billing.models';

@Component({
  selector: 'app-card-on-file',
  template: `
    <div class="card-on-file" *ngIf="method; else noCard">
      <div class="card-info">
        <span class="card-brand">{{ method.brand | titlecase }}</span>
        <span class="card-pan">{{ method.maskedPan }}</span>
        <span class="card-expiry">{{ method.expiryMonth }}/{{ method.expiryYear }}</span>
        <span class="card-status" [ngClass]="'status-' + method.status?.toLowerCase()">
          {{ method.status }}
        </span>
      </div>
      <div class="card-actions">
        <button class="btn-link" (click)="change.emit()">{{ 'billing_change_card' | translate }}</button>
        <button class="btn-link btn-danger" (click)="remove.emit(method.id)">
          {{ 'billing_remove_card' | translate }}
        </button>
      </div>
    </div>
    <ng-template #noCard>
      <div class="no-card">
        <span>{{ 'billing_no_card_on_file' | translate }}</span>
        <button class="btn-link" (click)="change.emit()">{{ 'billing_add_card' | translate }}</button>
      </div>
    </ng-template>
  `,
  styles: [`
    .card-on-file { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; }
    .card-info { display: flex; gap: 12px; align-items: center; font-size: 0.95rem; }
    .card-brand { font-weight: 600; text-transform: capitalize; }
    .card-pan { letter-spacing: 1px; }
    .card-expiry { color: #777; }
    .card-status { padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-expired { background: #fce4ec; color: #b71c1c; }
    .card-actions { display: flex; gap: 8px; }
    .btn-link { background: none; border: none; color: #1976d2; cursor: pointer; font-size: 0.85rem; padding: 4px; text-decoration: underline; }
    .btn-danger { color: #c62828; }
    .no-card { display: flex; gap: 12px; align-items: center; color: #777; font-size: 0.9rem; }
  `],
})
export class CardOnFileComponent {
  @Input() method: PaymentMethodDto | undefined | null;
  @Output() change = new EventEmitter<void>();
  @Output() remove = new EventEmitter<string>();
}
