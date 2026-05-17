import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import { SharedModule } from 'src/app/shared/shared.module'
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component'
import { EvolutionDeviceService } from '../services/evolution-device.service'

export interface EvolutionStepsDialogData {
  deviceId?: string
}

@Component({
  selector: 'app-evolution-steps-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './evolution-steps-dialog.component.html',
  styleUrls: ['./evolution-steps-dialog.component.scss']
})
export class EvolutionStepsDialogComponent implements OnInit, OnDestroy {
  readonly form = this.fb.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(64)]],
    delayIntervalInSeconds: [0, [Validators.required, Validators.min(0)]]
  })

  steps = true
  isLoading = false
  scanDevice = false

  deviceId: string | null = null
  qrSrc: string | null = null
  pairCode: string | null = null
  isReconnect = false

  private pollInterval: any
  private retryCounter = 0
  private readonly POLL_MS = 5000
  private readonly MAX_RETRIES = 10

  constructor(
    private readonly fb: FormBuilder,
    private readonly devices: EvolutionDeviceService,
    private readonly toaster: ToasterServices,
    private readonly translate: TranslateService,
    public dialogRef: MatDialogRef<EvolutionStepsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EvolutionStepsDialogData
  ) {}

  ngOnInit(): void {
    if (this.data?.deviceId) {
      this.isReconnect = true
      this.deviceId = this.data.deviceId
      this.steps = false
      this.isLoading = true
      this.fetchQrForReconnect()
    }
  }

  ngOnDestroy(): void {
    this.stopPolling()
  }

  scanCode(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    this.steps = false
    this.isLoading = true
    this.startCreateFlow()
  }

  private startCreateFlow(): void {
    const { label, delayIntervalInSeconds } = this.form.getRawValue()
    this.devices.create(label, delayIntervalInSeconds).subscribe({
      next: (res) => {
        this.deviceId = res.deviceId
        this.applyPairing(res.pairing?.qrBase64, res.pairing?.pairCode)
        this.isLoading = false
        this.scanDevice = true
        this.startPolling()
      },
      error: () => {
        this.toaster.error(this.translate.instant('devices.evolution.errorGeneric'), true)
        this.onClose()
      }
    })
  }

  private fetchQrForReconnect(): void {
    this.devices.refreshPairing(this.deviceId!).subscribe({
      next: (r) => {
        this.applyPairing(r.pairing.qrBase64, r.pairing.pairCode)
        this.isLoading = false
        this.scanDevice = true
        this.startPolling()
      },
      error: () => {
        this.toaster.error(this.translate.instant('devices.evolution.errorGeneric'), true)
        this.onClose()
      }
    })
  }

  private applyPairing(b64: string | null | undefined, code: string | null | undefined): void {
    this.qrSrc = b64 ? (b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`) : null
    this.pairCode = code ?? null
  }

  private startPolling(): void {
    this.stopPolling()
    this.retryCounter = 0
    this.pollInterval = setInterval(() => {
      if (!this.deviceId) {
        return
      }
      this.devices.getById(this.deviceId).subscribe({
        next: (d) => {
          this.retryCounter++
          if (d.isConnected) {
            this.stopPolling()
            this.toaster.success(this.translate.instant('devices.evolution.connected'))
            this.onClose(true)
            return
          }
          if (this.retryCounter >= this.MAX_RETRIES) {
            this.retryCounter = 0
            this.regenerateQr()
          }
        },
        error: () => {
          this.onClose()
        }
      })
    }, this.POLL_MS)
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  private regenerateQr(): void {
    if (!this.deviceId) {
      return
    }
    this.devices.refreshPairing(this.deviceId).subscribe({
      next: (r) => {
        this.applyPairing(r.pairing.qrBase64, r.pairing.pairCode)
      },
      error: () => {}
    })
  }

  onClose(result?: any): void {
    this.dialogRef.close(result)
  }
}
