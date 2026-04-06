import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';


import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VerifyService {
  private api: string = environment.api;

  constructor(private http:HttpClient) { }

  // confirmEmail(code:string,token:string):Observable<any>{
  //   const refreshToken = localStorage.getItem("token")
  //   const headers = new HttpHeaders({
  //     'Authorization': `Bearer ${refreshToken}`
  //   });

  //   return this.http.put(`${env.api}Auth/confirmEmail?code=${code}&token=${token}`,"",{headers})
  // }
  confirmEmail(code:string, token?: string | null):Observable<any>{
    const data = token ? { token } : {};
    return this.http.put(`${this.api}Auth/confirmEmail?code=${code}`, data)
  }
  confirmCode(code:string,email:string):Observable<any>{
    return this.http.put(`${this.api}Auth/confirmCode`, { code, email })
  }
}
