import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Info } from './interfaces/info';

@Injectable({
  providedIn: 'root'
})
export class   InfoService {
  
  private api: string = environment.api;

constructor(private http:HttpClient,
) {
}
getUserSubscribtion():Observable<Info>{
  return this.http.get<Info>(`${this.api}Auth/getUserSubscription`)
}

}
