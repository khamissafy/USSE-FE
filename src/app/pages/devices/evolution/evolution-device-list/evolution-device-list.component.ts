import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { EvolutionConnectionState, EvolutionDeviceListItem } from '../models/evolution-device.models'
import { EvolutionDeviceService } from '../services/evolution-device.service'
import { EvolutionDeviceSignalrAdapter } from '../services/evolution-device-signalr.adapter'
import { EvolutionStepsDialogComponent } from '../evolution-steps-dialog/evolution-steps-dialog.component'

@Component({
  selector: 'app-evolution-device-list',
  templateUrl: './evolution-device-list.component.html',
  styleUrls: ['./evolution-device-list.component.scss']
})
export class EvolutionDeviceListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['label', 'instanceId', 'connection', 'lastUpdate', 'actions']
  items: EvolutionDeviceListItem[] = []
  loading = true
  /** Live hub state keyed by deviceId then instanceId */
  private readonly liveByDevice = new Map<string, EvolutionConnectionState>()
  private readonly liveByInstance = new Map<string, EvolutionConnectionState>()
  private readonly destroy$ = new Subject<void>()

  constructor(
    private readonly devices: EvolutionDeviceService,
    private readonly signalR: EvolutionDeviceSignalrAdapter,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.signalR.start()
    this.signalR.connectionState$.pipe(takeUntil(this.destroy$)).subscribe((ev) => {
      if (ev.deviceId) {
        this.liveByDevice.set(ev.deviceId, ev.state)
      }
      if (ev.instanceId) {
        this.liveByInstance.set(ev.instanceId, ev.state)
      }
    })
    this.reload()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.signalR.stop()
  }

  reload(): void {
    this.loading = true
    this.devices.list().subscribe({
      next: (rows) => {
        this.items = rows ?? []
        this.loading = false
      },
      error: () => {
        this.items = []
        this.loading = false
      }
    })
  }

  private openStepsDialog(deviceId?: string): void {
    const cfg = new MatDialogConfig()
    cfg.height = '95vh'
    cfg.width = '70vw'
    cfg.maxWidth = '100%'
    cfg.minWidth = '987px'
    cfg.maxHeight = '705px'
    cfg.disableClose = true
    cfg.data = deviceId ? { deviceId } : null
    const ref = this.dialog.open(EvolutionStepsDialogComponent, cfg)
    ref.afterClosed().subscribe((connected) => {
      if (connected) {
        this.reload()
      }
    })
  }

  openAddDialog(): void {
    this.openStepsDialog()
  }

  openReconnectDialog(row: EvolutionDeviceListItem): void {
    this.openStepsDialog(row.deviceId)
  }

  badgeState(row: EvolutionDeviceListItem): EvolutionConnectionState {
    return (
      this.liveByDevice.get(row.deviceId) ??
      this.liveByInstance.get(row.instanceId) ??
      (row.isConnected ? 'open' : 'close')
    )
  }

  badgeClass(row: EvolutionDeviceListItem): string {
    const s = this.badgeState(row)
    if (s === 'open') {
      return 'evo-badge evo-badge--open'
    }
    if (s === 'close') {
      return 'evo-badge evo-badge--close'
    }
    return 'evo-badge evo-badge--pending'
  }

  badgeLabel(row: EvolutionDeviceListItem): string {
    const s = this.badgeState(row)
    if (s === 'open') {
      return 'devices.evolution.connected'
    }
    if (s === 'close') {
      return 'devices.evolution.disconnected'
    }
    return 'devices.evolution.connecting'
  }
}
