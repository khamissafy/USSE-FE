import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';


import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResetPassService {
  private api: string = environment.api;

  constructor(private http:HttpClient) { }
  changePassword(email:string, code:string, newPassword:string):Observable<any>{
    return this.http.put<any>(`${this.api}Auth/changePassword`, { email, code, newPassword })
  }

}