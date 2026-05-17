import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'

export interface EvolutionConfirmDialogData {
  titleKey: string
  messageKey: string
  confirmKey: string
}

@Component({
  selector: 'app-evolution-confirm-dialog',
  templateUrl: './evolution-confirm-dialog.component.html',
  styleUrls: ['./evolution-confirm-dialog.component.scss']
})
export class EvolutionConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: EvolutionConfirmDialogData) {}
}
