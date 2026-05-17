import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component'
import { EvolutionConnectionEvent, EvolutionDeviceDetail, EvolutionStatusUpdate } from '../models/evolution-device.models'
import { EvolutionDeviceService } from '../services/evolution-device.service'
import { EvolutionDeviceSignalrAdapter } from '../services/evolution-device-signalr.adapter'
import {
  EvolutionConfirmDialogComponent,
  EvolutionConfirmDialogData
} from '../evolution-confirm-dialog/evolution-confirm-dialog.component'
import { EvolutionStepsDialogComponent } from '../evolution-steps-dialog/evolution-steps-dialog.component'

@Component({
  selector: 'app-evolution-device-detail',
  templateUrl: './evolution-device-detail.component.html',
  styleUrls: ['./evolution-device-detail.component.scss']
})
export class EvolutionDeviceDetailComponent implements OnInit, OnDestroy {
  deviceId: string | null = null
  detail?: EvolutionDeviceDetail
  loading = true
  recentConnection: EvolutionConnectionEvent[] = []
  recentStatus: EvolutionStatusUpdate[] = []
  private readonly destroy$ = new Subject<void>()
  private readonly maxPanel = 25

  constructor(
    private readonly route: ActivatedRoute,
    private readonly devices: EvolutionDeviceService,
    private readonly signalR: EvolutionDeviceSignalrAdapter,
    private readonly dialog: MatDialog,
    private readonly toaster: ToasterServices,
    private readonly translate: TranslateService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.signalR.start()
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((pm) => {
      const id = pm.get('deviceId')
      this.deviceId = id
      this.recentConnection = []
      this.recentStatus = []
      if (id) {
        this.reload()
      }
    })

    this.signalR.connectionState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ev) => {
        if (!this.deviceId) {
          return
        }
        if (ev.deviceId === this.deviceId || ev.instanceId === this.detail?.instanceId) {
          this.pushConn(ev)
          if (this.detail) {
            this.detail = { ...this.detail, isConnected: ev.state === 'open' }
          }
        }
      })

    this.signalR.statusUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((st) => {
        this.pushStatus(st)
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.signalR.stop()
  }

  private pushConn(ev: EvolutionConnectionEvent): void {
    this.recentConnection = [ev, ...this.recentConnection].slice(0, this.maxPanel)
  }

  private pushStatus(st: EvolutionStatusUpdate): void {
    this.recentStatus = [st, ...this.recentStatus].slice(0, this.maxPanel)
  }

  reload(): void {
    if (!this.deviceId) {
      return
    }
    this.loading = true
    this.devices.getById(this.deviceId).subscribe({
      next: (d) => {
        this.detail = d
        this.loading = false
      },
      error: () => {
        this.loading = false
        this.toaster.error(this.translate.instant('devices.evolution.errorGeneric'), true)
      }
    })
  }

  reconnect(): void {
    if (!this.deviceId) {
      return
    }
    const cfg = new MatDialogConfig()
    cfg.height = '95vh'
    cfg.width = '70vw'
    cfg.maxWidth = '100%'
    cfg.minWidth = '987px'
    cfg.maxHeight = '705px'
    cfg.disableClose = true
    cfg.data = { deviceId: this.deviceId }
    const ref = this.dialog.open(EvolutionStepsDialogComponent, cfg)
    ref.afterClosed().subscribe((connected) => {
      if (connected) {
        this.reload()
      }
    })
  }

  private confirm(data: EvolutionConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open(EvolutionConfirmDialogComponent, {
      width: '420px',
      data
    })
    return new Promise((resolve) => {
      ref.afterClosed().subscribe((v) => resolve(!!v))
    })
  }

  async restart(): Promise<void> {
    if (!this.deviceId) {
      return
    }
    const ok = await this.confirm({
      titleKey: 'devices.evolution.restart',
      messageKey: 'devices.evolution.confirmRestart',
      confirmKey: 'devices.evolution.restart'
    })
    if (!ok) {
      return
    }
    this.devices.restart(this.deviceId).subscribe({
      next: () => {
        this.reload()
      },
      error: () => {
        this.toaster.error(this.translate.instant('devices.evolution.errorGeneric'), true)
      }
    })
  }

  async logout(): Promise<void> {
    if (!this.deviceId) {
      return
    }
    const ok = await this.confirm({
      titleKey: 'devices.evolution.logout',
      messageKey: 'devices.evolution.confirmLogout',
      confirmKey: 'devices.evolution.logout'
    })
    if (!ok) {
      return
    }
    this.devices.logout(this.deviceId).subscribe({
      next: () => {
        this.reload()
      },
      error: () => {
        this.toaster.error(this.translate.instant('devices.evolution.errorGeneric'), true)
      }
    })
  }

  async softDelete(): Promise<void> {
    if (!this.deviceId) {
      return
    }
    const ok = await this.confirm({
      titleKey: 'devices.evolution.delete',
      messageKey: 'devices.evolution.confirmDelete',
      confirmKey: 'devices.evolution.delete'
    })
    if (!ok) {
      return
    }
    this.devices.softDelete(this.deviceId).subscribe({
      next: () => {
        this.toaster.success(this.translate.instant('devices.evolution.deleteSuccess'))
        void this.router.navigate(['/devices/evolution'])
      },
      error: () => {
        this.toaster.error(this.translate.instant('devices.evolution.errorGeneric'), true)
      }
    })
  }
}
