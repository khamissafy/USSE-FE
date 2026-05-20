import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Login } from './component/login';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private api: string = environment.api;

  userInfo: any;
  constructor(private http: HttpClient) {}

  login(data: unknown): Observable<Login> {
    return this.http.post<Login>(`${this.api}Auth/login`, data);
  }

  /** Uses HttpClient (unwrap + cookies). */
  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.api}Auth/refreshToken`, {});
  }

  sendEmailCode(email: string): Observable<any> {
    return this.http.post<any>(`${this.api}Auth/sendEmailCode?email=${email}`, '');
  }

  /** No-op: refresh token is HttpOnly server cookie only. */
  clearStoredRefreshToken(): void {}

  /** Revokes the HttpOnly refresh cookie on the server. */
  revokeToken(): Observable<any> {
    return this.http.post<any>(`${this.api}Auth/revokeToken`, {});
  }
}
