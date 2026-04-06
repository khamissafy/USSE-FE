import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';

import { Observable } from 'rxjs';
import { CheckCon, Templates, Init, TemplateData } from './templates';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PermissionData } from '../users/users';
@Injectable({
  providedIn: 'root',
})
export class TemplatesService {
  showsNum:number=10;
  pageNum:number=0;
  email:string=this.authService.getUserInfo()?.email;
  orderedBy:string="";
  search:string="";
  TemplatesPermission:PermissionData;
  private api: string = environment.api;

constructor(private http:HttpClient,private authService:AuthService) {
  if(authService.userInfo?.customerId!=""){
    authService.getUserDataObservable().subscribe(permissions => {
      this.TemplatesPermission=permissions.find((e)=>e.name=="Templates");
    })
   }
   else{
     this.TemplatesPermission={name:"Templates",value:"FullAccess"}
   }
 }

getTemplates(showsNum:number,pageNum:number,orderedBy:string,search:string):Observable<Templates[]>{
  return this.http.get<Templates[]>(`${this.api}Template/listTemplates?take=${showsNum}&scroll=${pageNum}&orderedBy=${orderedBy}&search=${search}`)
}

deleteTemplates(id:string):Observable<Templates>{
  return this.http.delete<Templates>(`${this.api}Template/deleteTemplate?id=${id}`)
}
listTemplatesCount():Observable<number>{
  return this.http.get<number>(`${this.api}Template/listTemplatesCount`)
}







addTemplate(templateName:string,messageBody:string,attachments:string[]):Observable<Templates>{
  const data=attachments.length!=0?{
    templateName: templateName,
    messageBody: messageBody,
    attachments:attachments
  }:{
    templateName: templateName,
    messageBody: messageBody,
  }
  return this.http.post<Templates>(`${this.api}Template/addNewTemplate`,data)
}





updateTemplate(id:string,templateName:string,messageBody:string, attachments:string[]):Observable<any>{
  const data=attachments.length!=0?{
    id:id,
    templateName: templateName,
    messageBody: messageBody,
    attachments:attachments
  }:{
    id:id,
    templateName: templateName,
    messageBody: messageBody,
  }
  return this.http.put(`${this.api}Template/updateTemplate`,data)
}
















getTemplateById(id:string):Observable<TemplateData>{
  return this.http.get<TemplateData>(`${this.api}Template/getTemplateById?id=${id}`)
}


calculateFileSizeInKB(base64String: string): number {
  let base64=base64String.substring(base64String.indexOf(",")+1,base64String.length+1)
  // Decode the Base64 string to binary data
  const binaryData = atob(base64);

  // Calculate the length of the binary data
  const fileSizeInBytes = binaryData.length;

  // Convert the file size to kilobytes (KB)
  const fileSizeInKB = fileSizeInBytes / 1024;

  return fileSizeInKB;
}
extractTypeFromBase64(base64String: string):string{
  let type =base64String.substring(base64String.indexOf(":")+1,base64String.indexOf(";") );
  return type
}
}
