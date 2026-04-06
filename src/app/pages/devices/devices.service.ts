import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';
import { CheckCon, DeviceData, Init } from './device';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PermissionData } from '../users/users';
import { PermissionsService } from 'src/app/shared/services/permissions.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  display:number=10;
  pageNum:number=0;
  orderedBy:string="";
  search:string="";
  DevicesPermission:PermissionData;
  telegramId:any;
  private api: string = environment.api;

constructor(private http:HttpClient,
  private authService:AuthService,
  private permissionService:PermissionsService) {
  if(authService.userInfo?.customerId!=""){
    authService.getUserDataObservable().subscribe(permissions => {
      this.DevicesPermission=permissions.find((e)=>e.name=="Devices");
    })
   }
   else{
     this.DevicesPermission={name:"Devices",value:"FullAccess"}
   }
}
getDevices(showsNum:number,pageNum:number,orderedBy:string,search:string):Observable<DeviceData[]>{
  return this.http.get<DeviceData[]>(`${this.api}Device/listDevices?take=${showsNum}&scroll=${pageNum}&orderedBy=${orderedBy}&search=${search}`)
}

initWhatsAppB(sessionName:string,port:number,serverId:number,host?:string):Observable<Init>{
  const query=sessionName && !host?
   `?sessionName=${sessionName}&port=${port}&serverId=${serverId}`
   :sessionName && host?
   `?sessionName=${sessionName}&port=${port}&host=${host}`
   :`?`

  return this.http.post<Init>(`${this.api}Device/InitializeWhatsappBisunessSession${query}`,"")
}

CheckWhatsappBisuness(sessionName:string,token:string,port:number,serverId:number):Observable<CheckCon>{
    const data={
      sessionName:sessionName,
      token:token,
      port:port,
      serverId: serverId
    }
  return this.http.post<CheckCon>(`${this.api}Device/CheckWhatsappBisunessSession`,data)

}
getDevicesCount():Observable<number>{
  return this.http.get<number>(`${this.api}Device/listDevicesCount`)
}

deleteDevice(id:string):Observable<DeviceData>{
  return this.http.put<DeviceData>(`${this.api}Device/deleteDevice?id=${id}`,"")
}
reconnectWPPDevice(id:string):Observable<any>{
  return this.http.put<any>(`${this.api}Device/reconnectWBSDevice?id=${id}`,"")
}

addNewWhatsappBisunessDevice(deviceName: string,phoneNumber: string,token: string,sessionName: string,port:number,serverId:number):Observable<any>{
  const data={
    deviceName: deviceName,
    phoneNumber: phoneNumber,
    token: token,
    sessionName: sessionName,
    port:port,
    serverId: serverId
  }
  return this.http.post<any>(`${this.api}Device/addNewWhatsappBisunessDevice`,data)
}

updateDeviceDelay(id:string ,delayIntervalInSeconds:number):Observable<DeviceData>{
  return this.http.put<DeviceData>(`${this.api}Device/updateDeviceDelay?id=${id}&delay=${delayIntervalInSeconds}`,"")
}
extractChats(deviceId: string): Observable<any> {
  const url = `${this.api}Device/extractChats?deviceId=${deviceId}`;
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  return this.http.get(url, {
    headers: headers,
    responseType: 'blob', // Set the responseType to 'blob'
  });
}
addTelegramDev(data):Observable<any>{
  return this.http.post<any>(`${this.api}Device/addNewTelgramDevice`,data)
}
reconnectTelegramDev(data):Observable<any>{
  return this.http.put<any>(`${this.api}Device/reconnectTelegramDevice`,data)
}}
