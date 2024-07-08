import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Message, Shceduled } from './message';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PermissionData } from '../users/users';
import { DevicesPermissions } from '../compaigns/compaigns.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  display:number=10;
    pageNum:number=0;
    messageasPermission:PermissionData[];
    devicesPermissions:DevicesPermissions[];
    email:string=this.authService.getUserInfo()?.email;
    orderedBy:string="";
    search:string="";
    msgCategory:string="inbox";
    selectedDeviceId:string="";
    private api: string = environment.api;

constructor(private http:HttpClient,private authService:AuthService) {
  if(authService.userInfo?.customerId!=""){
  //   console.log("permissions from messages",authService.usersPermissions)
  //   this.messageasPermission=authService.devicesPermissions(authService.usersPermissions,"Messages");
  //   if(this.messageasPermission){
  //     this.devicesPermissions=this.messageasPermission.map((permission)=>{

  //       let name=permission.name
  //       const underscoreIndex = permission.name.indexOf("_");
  //       let deviceId=name.substring(underscoreIndex + 1)

  //       return {
  //         deviceId:deviceId,
  //         value:permission.value
  //       }
  //     })
  //     console.log(this.devicesPermissions)
  //   }
  authService.getUserDataObservable().subscribe(permissions => {

      this.messageasPermission=authService.devicesPermissions(permissions,"Messages");
      if(this.messageasPermission){
        this.devicesPermissions=this.messageasPermission.map((permission)=>{

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


getMessages(email: string, msgCategory: string, showsNum: number, pageNum: number, search: string, deviceId: string[], StatusFilters?: number[]): Observable<Message> {
  let params = new HttpParams()
    .set('email', email)
    .set('msgCategory', msgCategory)
    .set('take', showsNum.toString())
    .set('scroll', pageNum.toString())
    .set('search', search)
    if (deviceId ) {
      if (Array.isArray(deviceId) && deviceId.length > 0){
        deviceId.forEach((filter) => {
          params = params.append('deviceId', filter);
        });
      }
    
    }
  // Check if StatusFilters is provided and is an array
  if (StatusFilters && Array.isArray(StatusFilters)) {
    StatusFilters.forEach((filter) => {
      params = params.append('StatusFilters', filter.toString());
    });
  }
 
  
  const apiUrl = `${this.api}Message/listMessages`;

  return this.http.get<Message>(apiUrl, { params: params });
}
getMessagesCount(email: string, msgCategory: string, deviceId: string, StatusFilters?: number[]): Observable<number> {
  let params = new HttpParams()
    .set('email', email)
    .set('msgCategory', msgCategory)
    .set('deviceId', deviceId);

  // Check if StatusFilters is provided and is an array
  if (StatusFilters && Array.isArray(StatusFilters)) {
    StatusFilters.forEach((filter) => {
      params = params.append('StatusFilters', filter.toString());
    });
  }

  const apiUrl = `${this.api}Message/listMessagesCount`;

  return this.http.get<number>(apiUrl, { params: params });
}

getScheduledMessages(email:string,showsNum:number,pageNum:number,deviceId:string[]):Observable<Shceduled>{
  
  let params = new HttpParams()
  .set('email', email)
  .set('take', showsNum.toString())
  .set('scroll', pageNum.toString())
  if (deviceId ) {
    if (Array.isArray(deviceId) && deviceId.length > 0){
      deviceId.forEach((filter) => {
        params = params.append('deviceId', filter);
      });
    }
  
  }
  
  const apiUrl = `${this.api}Message/listScheduledMessages`;

  return this.http.get<Shceduled>(apiUrl, { params: params });

}

listScheduledMessagesCount(email:string,deviceId:string):Observable<number>{
  return this.http.get<number>(`${this.api}Message/listScheduledMessagesCount?email=${email}&deviceId=${deviceId}`)
}
deleteMessage(ids:string[]):Observable<any>{


  return this.http.put<number>(`${this.api}Message/deleteMessage?email=${this.email}`,ids)

}

sendWhatsappBusinessMessage( deviceid: string,
  targetPhoneNumber: string[],
  msgBody: string,
  scheduledAt:string,
  email: string,
  attachments:string[],
  chatMsg?:{channelType:number,groupName:string}):Observable<any>{

  let data:any=attachments.length!=0?{
    deviceid: deviceid,
    targetPhoneNumber: targetPhoneNumber,
    attachments:attachments,
    msgBody: msgBody,
    scheduledAt:scheduledAt,
    email: email
  }:{
    deviceid: deviceid,
    targetPhoneNumber: targetPhoneNumber,
    msgBody: msgBody,
    scheduledAt:scheduledAt,
    email: email
  }
  if(chatMsg){
    data.channelType=chatMsg.channelType;
    data.groupName=chatMsg.groupName
  }
  return this.http.post<any>(`${this.api}Message/sendWhatsappBusinessMessage`,data)

}
updateDisplayNumber(displayNum){
  displayNum=this.display;
 }
getUpdatedDisplayNumber(){
  return this.display
}
ressendFailedMessages(data):Observable<any>{
  return this.http.post<any>(`${this.api}Message/resendFailedMessages`,data);
}
}
