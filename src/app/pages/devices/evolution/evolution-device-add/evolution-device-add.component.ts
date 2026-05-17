import { Component, OnDestroy, OnInit } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subject, Subscription, interval } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component'
import { EvolutionDeviceCreateResponse, EvolutionPairing } from '../models/evolution-device.models'
import { EvolutionDeviceService } from '../services/evolution-device.service'
import { EvolutionDeviceSignalrAdapter } from '../services/evolution-device-signalr.adapter'
import { SubscriptionStateService } from 'src/app/shared/services/subscription-state.service'

@Component({
  selector: 'app-evolution-device-add',
  templateUrl: './evolution-device-add.component.html',
  styleUrls: ['./evolution-device-add.component.scss']
})
export class EvolutionDeviceAddComponent implements OnInit, OnDestroy {
  readonly form = this.fb.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(64)]],
    delayIntervalInSeconds: [0, [Validators.required, Validators.min(0)]]
  })

  created?: EvolutionDeviceCreateResponse
  secondsLeft: number | null = null
  pairingExpired = false
  connected = false
  private countdownSub?: Subscription
  private readonly destroy$ = new Subject<void>()

  constructor(
    private readonly fb: FormBuilder,
    private readonly devices: EvolutionDeviceService,
    private readonly signalR: EvolutionDeviceSignalrAdapter,
    private readonly toaster: ToasterServices,
    private readonly translate: TranslateService,
    private readonly router: Router,
    private readonly subscriptionState: SubscriptionStateService
  ) {}

  ngOnInit(): void {
    this.signalR.start()
    this.signalR.connectionState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ev) => {
        if (!this.created) {
          return
        }
        const matchInstance = ev.instanceId === this.created.instanceId
        const matchDevice = ev.deviceId === this.created.deviceId
        if (!matchInstance && !matchDevice) {
          return
        }
        if (ev.state === 'open') {
          this.connected = true
          this.toaster.success(this.translate.instant('devices.evolution.connected'))
          void this.router.navigate(['/devices/evolution', this.created.deviceId])
          return
        }
        if (ev.state === 'qr' || ev.state === 'close') {
          this.pairingExpired = true
        }
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.countdownSub?.unsubscribe()
    this.signalR.stop()
  }

  get qrSrc(): string | null {
    const b64 = this.created?.pairing?.qrBase64
    if (!b64) {
      return null
    }
    return b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`
  }

  get pairCode(): string | null {
    return this.created?.pairing?.pairCode ?? null
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    if (this.subscriptionState.isAtDeviceLimit()) {
      const msg = `You have reached the Devices limit for your current plan. <a href="/plans" style="text-decoration:underline;font-weight:600">Upgrade Plan</a>`
      this.toaster.warning(msg, true)
      return
    }
    const { label, delayIntervalInSeconds } = this.form.getRawValue()
    this.devices.create(label, delayIntervalInSeconds).subscribe({
      next: (res) => {
        this.created = res
        this.pairingExpired = false
        this.connected = false
        this.toaster.success(this.translate.instant('devices.evolution.createSuccess'))
        this.startCountdown(res.pairing)
      },
      error: () => {
        this.toaster.error(this.translate.instant('devices.evolution.errorGeneric'), true)
      }
    })
  }

  private startCountdown(pairing: EvolutionPairing): void {
    this.countdownSub?.unsubscribe()
    this.secondsLeft = null
    const exp = pairing.expiresAt
    if (!exp) {
      return
    }
    const end = new Date(exp).getTime()
    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000))
      this.secondsLeft = left
      if (left <= 0) {
        this.pairingExpired = true
        this.countdownSub?.unsubscribe()
      }
    }
    tick()
    this.countdownSub = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => tick())
  }

  regenerate(): void {
    if (!this.created) {
      return
    }
    this.devices.refreshPairing(this.created.deviceId).subscribe({
      next: (r) => {
        this.created = {
          ...this.created,
          pairing: r.pairing
        }
        this.pairingExpired = false
        this.startCountdown(r.pairing)
      },
      error: () => {
        this.toaster.error(this.translate.instant('devices.evolution.errorGeneric'), true)
      }
    })
  }
}
