import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, shareReplay } from 'rxjs';
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

  display:number=10;
  pageNum:number=0;
  email:string=this.authService.getUserInfo()?.email;
  search:string="";
  compaignssPermission:PermissionData[];
  devicesPermissions:DevicesPermissions[];
constructor(private http:HttpClient,
  private authService:AuthService,
  private route: ActivatedRoute
  ) {


  if(authService.userInfo?.customerId!=""){

authService.getUserDataObservable().subscribe(permissions => {

      this.compaignssPermission=authService.devicesPermissions(permissions,"Campaigns");
      if(this.compaignssPermission){
        this.devicesPermissions=this.compaignssPermission.map((permission)=>{

          let name=permission.name
          const underscoreIndex = permission.name.indexOf("_");
          let deviceId=name.substring(underscoreIndex + 1)

          return {
            deviceId:deviceId,
            value:permission.value
          }
        })
      }

    });


  }

}
getPermissionsFromRoute(): { name: string, value: string }[] | undefined {
  const data = this.route.snapshot.data;
  if (data && data['permissions']) {
    return data['permissions'];
  } else {
    return undefined; // Handle the case where permissions are not available
  }
}
getCampaigns(showsNum:number,pageNum:number,search:string,deviceId:string):Observable<compaignDetails[]>{
  return this.http.get<compaignDetails[]>(`${this.api}Message/listCampaigns?take=${showsNum}&scroll=${pageNum}&search=${search}&deviceId=${deviceId}`)
}
compaignsCount(deviceId:string):Observable<number>{
  return this.http.get<number>(`${this.api}Message/listCampaignsCount?deviceId=${deviceId}`)
}

addMewCampain(data:any):Observable<any>{
  return this.http.post<any>(`${this.api}Message/createWhatsappBusinessCampaign`,data)
}
stopWhatsappBusinessCampaign(id:string):Observable<any>{
  return this.http.put<any>(`${this.api}Message/stopWhatsappBusinessCampaign?id=${id}`,'')
}
getCampaignById(id:string):Observable<compaignDetails>{
  return this.http.get<compaignDetails>(`${this.api}Message/getCampaignById?id=${id}`).pipe(
    shareReplay()
  )
}

deleteWhatsappBusinessCampaign(id:string):Observable<any>{
  return this.http.put<any>(`${this.api}Message/deleteWhatsappBusinessCampaign?id=${id}`,'')
}
updateDisplayNumber(displayNum){
  displayNum=this.display;
 }
getUpdatedDisplayNumber(){
  return this.display
}
getLastCampaign():Observable<compaignDetails>{
  return this.http.get<compaignDetails>(`${this.api}Message/getLastCampaign`).pipe(
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
