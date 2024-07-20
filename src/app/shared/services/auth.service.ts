import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Login } from 'src/app/pages/login/component/login';
import { LoginService } from 'src/app/pages/login/login.service';
import { Permission, PermissionData, UserData, Users } from 'src/app/pages/users/users';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

import { PermissionsService } from './permissions.service';
import { PluginsService } from 'src/app/services/plugins.service';
import { LocalStorageService } from './localStorage.service';
import { TimeZoneServiceService } from './timeZoneService.service';
interface DeviceData {
  id: string,
  deviceName: string,
  deviceType: string,
  deviceNumber: string,
  createdAt: string,
  isConnected: boolean,
  instanceId:string,
  delayIntervalInSeconds:number,
  isDeleted: boolean,
  applicationUserId: string,
  host: string,
  password: string,
  port: string,
  systemID: string,
  lastUpdate: string,
  token: string
}
@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private api: string = environment.api;
  redirectUrl :any;
  allowedFileSize:any;
  selectedDeviceId:string="";
  code!:string;
  email:string;
  from!:string;
  accessToResetPass!:boolean;
  RoleAndRefreshtoken:any;
  userData!:UserData;
  resfreshToken!:string;
userInfo!:UserData;
subscriptionState:{
  isTrail:boolean,
  trialEndDate:string,
  messageCount:number

};
unAuthorized:boolean=false;
empty:number=0;
userPermissions:Permission
allPermissions:PermissionData[]

userData$:Observable<any>;
showWarning:number=0;
constructor(private loginService:LoginService,
  private http:HttpClient,
  private permissionService:PermissionsService,
  private localStorageService: LocalStorageService,
  private plugin:PluginsService,
  private timezoneService:TimeZoneServiceService
  ) {
    this.setRefreshToken();
    // this.getUserInfoFromRequest();
 }

 loadUserInfo(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (this.userInfo) {
      resolve(this.userInfo);
    } else if (this.checkExistenceAndValidation()) {
      const decryptedEmail = this.localStorageService.getDecryptedData('email');
      this.permissionService.getUserByEmail(decryptedEmail).subscribe(
        (res) => {
          const data={
            userName:res.contactName,
            organisationName:res.organisationName,
            id:res.id,
            email:res.email,
            token:res.token,
            customerId:res.customerId,
            apiToken:res.apiToken,
            maskType:res.maskType,
            phoneNumber:res.phoneNumber,
            timezone:res.timezone,
            countryCode:res.countryCode
            
          }
          this.updateUserInfo(data);
          if(res.customerId!=""){
            this.setFileSizeBasedOnSubscription("S");
          }
          else{
            const subType=res.subscriptions.find((subs)=>subs.name=="SUBSCRIPTION").value
            this.setFileSizeBasedOnSubscription(subType);
          }

          let isTrialUser:boolean;
          if(res.customerId!=""){
            isTrialUser=false;
            this.setFileSizeBasedOnSubscription("S");
      
          }
          else{
            const subType=res.subscriptions.find((subs)=>subs.name=="SUBSCRIPTION").value
            if(subType=="T"){
              isTrialUser=true;
            }
            else{
              isTrialUser=false;
            }
            this.setFileSizeBasedOnSubscription(subType);
          }
          this.setSubscriptionState({
            isTrail:isTrialUser,
            trialEndDate:res.trialEndDate,
            messageCount:res.messageCount
      
          })

          resolve(this.userInfo);
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject('User information not available');
    }
  });
}
setRedirectURL(routeName){
this.redirectUrl=routeName
}
getRedirectURL(){
  return this.redirectUrl
}
 getUserInfo(){
  return this.userInfo
 }
 updateUserInfo(data?){
  this.userInfo=data
  this.timezoneService.setTimezone(this.userInfo.timezone)

}

 updateUserPermisisons(permissions){
  this.allPermissions=permissions

}
updatePermissions(permisions:any){
  this.userPermissions=permisions
}

async getPermission() {
  return new Promise<void>((resolve) => {
    this.getUserDataObservable().subscribe((permissions) => {
      this.updateUserPermisisons(permissions)
      this.userPermissions = this.permissionService.executePermissions(permissions);
      resolve();
    });
  });
}
async hasPermission(routeName: string) {
  // this.permissions=this.permissionService.executePermissions(permissions);
  // this.authService.updatePermissions(this.permissions)
  const customerId = this.userInfo.customerId;
  if (customerId !== "" ){

    await this.getPermission();
    if (customerId !== "" && this.userPermissions) {
      if(routeName){

          return  routeName =="Users"? false :this.userPermissions[routeName]

        }
        else{
          return true;

        }
    }
    else {
      return true;
    }
  }

  else {
    return true;
  }
}

// help to acces to reset passward page from
setAccessToReset(access){
  this.accessToResetPass=access
  }

getAccessToReset(){
  return this.accessToResetPass
  }
// help to get code from verification page to reset passward page
setCode(code){
  this.code=code
}
getCode(){
  return this.code
}
// get email after login or signup to be used in verification page 
setEmail(email){
this.email=email
}
getEmail(){
return this.email
}

// from variable used verification page to detect which funcion will be used (is it from login or forgot passward or signup)
setFromValue(from){
  this.from=from
}
getFromValue(){
  return this.from
}

setRoleAndRefreshtoken(role,refreshToken){
this.RoleAndRefreshtoken={

}
}

setUserDataObservable(observable:Observable<Users>):any{
  this.userData$=observable.pipe(
    map(res=>res.permissions)

  )
}
getUserDataObservable(){
  return this.userData$
  }


isLoggedIn(){

return this.checkExistenceAndValidation()

}

saveDataToLocalStorage(data){
  // encrypt email and save to local storage 

  localStorage.setItem("token",data.token)
  this.localStorageService.saveEncryptedData("email", data.email);
  localStorage.setItem("role",data.roles)

  // this.loginService.storeRefreshTokenInCookie(data.refreshToken);




}

 
 
 checkExistenceAndValidation(){
  if(localStorage.getItem("token") && this.loginService.getCookieValue("refreshToken") && localStorage.getItem("email")){
    const decryptedEmail = this.localStorageService.getDecryptedData("email");
    return this.isEmailValid(decryptedEmail)
  }

  else{
    return false
  }
}
isEmailValid(email:string){
  return this.plugin.emailReg.test(email)
}

clearUserInfo(){
  let localData=['email',"token"]
  localData.map((key)=>localStorage.removeItem(key));
  this.loginService.removeCookie("refreshToken")

}
// setting user data from login or signup components
setUserData(userData:any,token:any){
  this.userData=userData;
  this.resfreshToken=token;
  }
// get user data
getUserData(){
  return this.userData
}
setRefreshToken(){
  if(this.loginService.getCookieValue("refreshToken")){

    this.resfreshToken=this.loginService.getCookieValue("refreshToken")
  }

}
getRefreshToken(){
  return this.resfreshToken

}

devicesPermissions(permissions:PermissionData[],name:string){
  let modulePermissions=permissions.filter((permission)=>permission.name.split("_")[0]==name)
  return modulePermissions
  }


  getDevices(email:string,showsNum:number,pageNum:number,orderedBy:string,search:string):Observable<DeviceData[]>{
    return this.http.get<DeviceData[]>(`${this.api}Device/listDevices?email=${email}&take=${showsNum}&scroll=${pageNum}&orderedBy=${orderedBy}&search=${search}`)
  }
  editProfile(data):Observable<any>{
    return this.http.put<any>(`${this.api}Auth/editProfile`,data)
  }

 getBackEndVersion()
 :Observable<any>{
  return this.http.get<any>(`${this.api}Auth/getVersion`)
}

setFileSizeBasedOnSubscription(subscripionType:string){
  if(subscripionType=="T"){
    this.allowedFileSize=5
  }
  else{
    this.allowedFileSize=15
  }
}
getAllowedFileSize(){
  return this.allowedFileSize
}
setSubscriptionState(state){
this.subscriptionState=state;
this.subscriptionState.trialEndDate=this.convertUtcDateToLocal(this.subscriptionState.trialEndDate)

}
getSubscriptionState(){

  return this.subscriptionState;
}
setShownNumber(num){
  this.showWarning+=num;
}
getShownNumber(){
  return this.showWarning
}
convertUtcDateToLocal(utcDate){
  if (utcDate) {
    utcDate = utcDate.indexOf('Z') > -1 ? utcDate : (utcDate + 'Z');
      const localDate = new Date(utcDate);
      
      const day = localDate.getDate();
      const month = localDate.getMonth() + 1; // Months are 0-indexed, so add 1
      const year = localDate.getFullYear();
  
      // Create a formatted date string
      const formattedDate = `${day}/${month}/${year}`;
  
      return formattedDate;
  }
  else{
    return ""
  }
}
  }
