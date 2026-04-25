import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { Campaigns, compaignDetails } from './campaigns';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PermissionData } from '../users/users';
import { ActivatedRoute } from '@angular/router';

export interface DevicesPermissions{deviceId:string,value:string}
@Injectable({
  providedIn: 'root'
})
export class CompaignsService  {
  private api: string = environment.api;

  /** Campaign APIs are on CampaignController (`/api/Campaign/...`), not MessageController. */
  private campaignUrl(action: string): string {
    return `${this.api}Campaign/${action}`;
  }

  display: number = 10;
  pageNum: number = 0;
  email: string = this.authService.getUserInfo()?.email;
  search: string = '';
  compaignssPermission: PermissionData[];

  /** Use BehaviorSubject so consumers can react once permissions are available. */
  private _devicesPermissions$ = new BehaviorSubject<DevicesPermissions[]>([]);
  readonly devicesPermissions$ = this._devicesPermissions$.asObservable();

  /** Synchronous snapshot for legacy callers; prefer devicesPermissions$ for new code. */
  get devicesPermissions(): DevicesPermissions[] { return this._devicesPermissions$.value; }

constructor(private http: HttpClient,
  private authService: AuthService,
  private route: ActivatedRoute
  ) {
  if (authService.userInfo?.customerId !== '') {
    authService.getUserDataObservable().subscribe(permissions => {
      this.compaignssPermission = authService.devicesPermissions(permissions, 'Campaigns');
      if (this.compaignssPermission) {
        this._devicesPermissions$.next(
          this.compaignssPermission.map((permission) => {
            const underscoreIndex = permission.name.indexOf('_');
            return {
              deviceId: permission.name.substring(underscoreIndex + 1),
              value: permission.value
            };
          })
        );
      }
    });
  }
}

getPermissionsFromRoute(): { name: string, value: string }[] | undefined {
  const data = this.route.snapshot.data;
  if (data && data['permissions']) {
    return data['permissions'];
  } else {
    return undefined;
  }
}
getCampaigns(showsNum:number,pageNum:number,search:string,deviceId:string):Observable<compaignDetails[]>{
  return this.http.get<compaignDetails[]>(`${this.campaignUrl('listCampaigns')}?take=${showsNum}&scroll=${pageNum}&search=${search}&deviceId=${deviceId}`)
}
compaignsCount(deviceId:string):Observable<number>{
  return this.http.get<number>(`${this.campaignUrl('listCampaignsCount')}?deviceId=${deviceId}`)
}

addMewCampain(data:any):Observable<any>{
  return this.http.post<any>(this.campaignUrl('createWhatsappBusinessCampaign'),data)
}
stopWhatsappBusinessCampaign(id:string):Observable<any>{
  return this.http.put<any>(`${this.campaignUrl('stopWhatsappBusinessCampaign')}?id=${id}`,'')  
}
getCampaignById(id:string):Observable<compaignDetails>{
  return this.http.get<compaignDetails>(`${this.campaignUrl('getCampaignById')}?id=${id}`).pipe(
    shareReplay()
  )
}

deleteWhatsappBusinessCampaign(id:string):Observable<any>{
  return this.http.put<any>(`${this.campaignUrl('deleteWhatsappBusinessCampaign')}?id=${id}`,'')  
}
updateDisplayNumber(displayNum: number) {
  this.display = displayNum;
}
getUpdatedDisplayNumber(): number {
  return this.display;
}
getLastCampaign():Observable<compaignDetails>{
  return this.http.get<compaignDetails>(this.campaignUrl('getLastCampaign')).pipe(
    shareReplay()
  );
}
filteredObject(data){
  const filteredKeys = Object.keys(data).filter(key => {
    const value = data[key];
  
    // Check if the value is not an empty array, not null, and not undefined
    return !((Array.isArray(value) && value.length === 0) || value === null || value === undefined || value === "");
  });
  
  // Create a new object with only the filtered keys
  return filteredKeys.reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {});
}
}
