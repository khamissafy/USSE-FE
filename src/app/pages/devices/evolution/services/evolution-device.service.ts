import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from 'src/environments/environment'
import {
  EvolutionConnectionState,
  EvolutionDeviceCreateRequest,
  EvolutionDeviceCreateResponse,
  EvolutionDeviceDetail,
  EvolutionDeviceListItem,
  EvolutionPairing
} from '../models/evolution-device.models'

@Injectable({ providedIn: 'root' })
export class EvolutionDeviceService {
  private readonly base = `${environment.api}EvolutionDevices`

  constructor(private readonly http: HttpClient) {}

  create(label: string, delayIntervalInSeconds: number): Observable<EvolutionDeviceCreateResponse> {
    const body: EvolutionDeviceCreateRequest = { label, delayIntervalInSeconds }
    return this.http.post<EvolutionDeviceCreateResponse>(this.base, body)
  }

  list(): Observable<EvolutionDeviceListItem[]> {
    return this.http.get<EvolutionDeviceListItem[]>(this.base)
  }

  getById(deviceId: string): Observable<EvolutionDeviceDetail> {
    return this.http.get<EvolutionDeviceDetail>(`${this.base}/${encodeURIComponent(deviceId)}`)
  }

  refreshPairing(deviceId: string): Observable<{ deviceId: string; pairing: EvolutionPairing }> {
    return this.http.post<{ deviceId: string; pairing: EvolutionPairing }>(
      `${this.base}/${encodeURIComponent(deviceId)}/pairing/refresh`,
      ''
    )
  }

  restart(deviceId: string): Observable<{ deviceId: string; state: EvolutionConnectionState }> {
    return this.http.post<{ deviceId: string; state: EvolutionConnectionState }>(
      `${this.base}/${encodeURIComponent(deviceId)}/restart`,
      ''
    )
  }

  logout(deviceId: string): Observable<{ deviceId: string; state: EvolutionConnectionState }> {
    return this.http.post<{ deviceId: string; state: EvolutionConnectionState }>(
      `${this.base}/${encodeURIComponent(deviceId)}/logout`,
      ''
    )
  }

  softDelete(deviceId: string): Observable<{ deviceId: string; isDeleted: boolean }> {
    return this.http.delete<{ deviceId: string; isDeleted: boolean }>(
      `${this.base}/${encodeURIComponent(deviceId)}`
    )
  }
}
