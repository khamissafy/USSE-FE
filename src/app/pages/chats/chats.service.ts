import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { ChatById, Chats } from './interfaces/Chats';
import * as signalR from "@microsoft/signalr";
import { AuthService } from 'src/app/shared/services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class ChatsService {
  private api: string = `${environment.api}Chat`;
  private signalRlink = `${environment.signalR}`
  private hubConnection: signalR.HubConnection;
  /** Initial value null so subscribers can ignore the first emission until a real event arrives */
  receivedMessages = new BehaviorSubject<{ userEmail: string; message: string } | null>(null);
  updatedStatus = new BehaviorSubject<{ userEmail: string; message: string } | null>(null);
  receivedMessages$: Observable<{ userEmail: string; message: string } | null> = this.receivedMessages.asObservable();
  updatedStatus$: Observable<{ userEmail: string; message: string } | null> = this.updatedStatus.asObservable();

  private connectionState = new BehaviorSubject<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);
  /** Emits SignalR hub connection state for UI (e.g. disconnected banner). */
  connectionState$: Observable<signalR.HubConnectionState> = this.connectionState.asObservable();


constructor(private http:HttpClient, private auth: AuthService) { 


}
startConnection(){
  if (this.hubConnection) {
    this.hubConnection.off('ReceiveMessage');
    this.hubConnection.off('StatusUpdate');
    void this.hubConnection.stop();
  }
  this.createConnection();
  this.onReceiveMessage();
  this.onStatusChange();

}
private createConnection() {
  this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(this.signalRlink, {
      withCredentials: true,
      accessTokenFactory: () => Promise.resolve(this.auth.getAccessToken() ?? ''),
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .build();

  this.hubConnection.onreconnecting((err) => {
    console.warn('SignalR reconnecting', err);
    this.connectionState.next(signalR.HubConnectionState.Reconnecting);
  });
  this.hubConnection.onreconnected((connectionId) => {
    console.log('SignalR reconnected', connectionId);
    this.connectionState.next(this.hubConnection.state);
  });
  this.hubConnection.onclose((err) => {
    console.error('SignalR connection closed', err);
    this.connectionState.next(signalR.HubConnectionState.Disconnected);
  });

  this.startHubConnection();
}

private startHubConnection (): void {
  this.connectionState.next(signalR.HubConnectionState.Connecting);
  this.hubConnection
    .start()
    .then(() => {
      console.log('SignalR connection started');
      console.log('[SIGNALR-DIAG] Hub connected, connectionId=', this.hubConnection.connectionId);
      this.connectionState.next(this.hubConnection.state);
    })
    .catch(err => {
      console.error('[SIGNALR-DIAG] Hub start FAILED:', err);
      console.error('SignalR start failed', err);
      this.connectionState.next(signalR.HubConnectionState.Disconnected);
    });
}
public onReceiveMessage = ()=>{
  this.hubConnection.off('ReceiveMessage');
  this.hubConnection.on('ReceiveMessage',(email,message)=>{
    console.log('[SIGNALR-DIAG] ReceiveMessage event fired, email=', email);
    this.receivedMessages.next({userEmail:email,message:message});

  })
}

public onStatusChange = ()=>{
  this.hubConnection.off('StatusUpdate');
  this.hubConnection.on('StatusUpdate',(email,message)=>{
    console.log('[SIGNALR-DIAG] StatusUpdate event fired, email=', email);
    this.updatedStatus.next({userEmail:email,message:message});

  })
}
closeConnection(){
  if(this.hubConnection){
    void this.hubConnection.stop();
    this.connectionState.next(signalR.HubConnectionState.Disconnected);
  }

}
listChats(showsNum:number,pageNum:number,search:string,deviceId:string[]):Observable<Chats>{
  let params = new HttpParams()
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
  
  const apiUrl = `${this.api}/listChats`;

  return this.http.get<Chats>(apiUrl, { params: params });


}
deleteChat(id:string):Observable<any>{
  return this.http.put<any>(`${this.api}/deleteChat?id=${id}`,null)
}
updateChat(chat):Observable<any>{
  return this.http.put<any>(`${this.api}/updateChat`,chat)
}
addNewChat(chat):Observable<any>{
  return this.http.post<any>(`${this.api}/addNewChat`,chat)
}
getChatById(chatId:string,showsNum:number,pageNum:number,search:string,deviceId:string):Observable<ChatById[]>{
  return this.http.get<ChatById[]>(`${this.api}/getChatById?take=${showsNum}&scroll=${pageNum}&search=${search}&deviceId=${deviceId}&chatId=${chatId}`).pipe(
    shareReplay()
    )
}
markChatAsRead(chatId:string):Observable<any>{
  return this.http.put<any>(`${this.api}/markChatAsRead?id=${chatId}`,null)
}
}
