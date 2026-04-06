import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { Users } from './users';
import { AuthService } from 'src/app/shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api: string = environment.api;

  display:number=10;
  pageNum:number=0;
  orderedBy:string="";
  search:string="";
  email:string=this.authService.getUserInfo()?.email
  organizationName:string=this.authService.getUserInfo()?.organisationName;
  id:string=this.authService.getUserInfo()?.id;
  constructor(private http:HttpClient,private authService:AuthService) {}


  listCustomersUsers(showsNum:number,pageNum:number,orderedBy:string,search:string):Observable<Users[]>{
    return this.http.get<Users[]>(`${this.api}Auth/listCustomersUsers?take=${showsNum}&scroll=${pageNum}&orderedBy=${orderedBy}&search=${search}`)
  }

  listCustomersUsersCount():Observable<number>{
    return this.http.get<number>(`${this.api}Auth/listCustomersUsersCount`)
  }
  editUserPermissions(data):Observable<any>{

    return this.http.patch<any>(`${this.api}Auth/editUserPermissions`,data)
  }

 getUserByEmail(email:string):Observable<Users>{
  return this.http.get<Users>(`${this.api}Auth/getUserByEmail?Email=${email}`)
}

deleteUser(customerEmail:string, userEmail:string):Observable<any>{
  return this.http.put<any>(`${this.api}Auth/deleteUser`, { userEmail, customerEmail })
  }

unDeleteUser(customerEmail:string, userEmail:string):Observable<any>{
  return this.http.put<any>(`${this.api}Auth/unDeleteUser`, { userEmail, customerEmail })
  }
  

}
