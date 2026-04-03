import { Injectable } from '@angular/core';
import { environment as env } from '@env/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Login } from '../login/component/login';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  private api: string = environment.api;

constructor(private http:HttpClient) { }

  register(data):Observable<Login>{

    return this.http.post<Login>(`${this.api}Auth/register`,data)
  }

}
