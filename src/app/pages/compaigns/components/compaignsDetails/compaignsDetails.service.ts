import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { CompaignStat, CompainMessages } from '../../campaigns';
import { AuthService } from 'src/app/shared/services/auth.service';



@Injectable({
  providedIn: 'root'
})
export class CompaignsDetailsService {
  display:number=10;
  pageNum:number=0;
  // email:string=this.authService.getUserInfo()?.email;
  private api: string = environment.api;

  constructor(private http:HttpClient,private authService:AuthService) {

  }
  getCampaignStat(id:string,email:string):Observable<CompaignStat>{
    return this.http.get<CompaignStat>(`${this.api}Message/getCampaignStat?id=${id}&email=${email}`);
  }

  listCampaignMessages(id: string, email: string, showsNum: number, pageNum: number, StatusFilters?: number[]): Observable<CompainMessages[]> {
    let params = new HttpParams()
      .set('id', id)
      .set('email', email)
      .set('take', showsNum.toString())
      .set('scroll', pageNum.toString());
  
    // Check if StatusFilters is provided and is an array
    if (StatusFilters && Array.isArray(StatusFilters)) {
      StatusFilters.forEach((filter) => {
        params = params.append('StatusFilters', filter.toString());
      });
    }
  
    const apiUrl = `${this.api}Message/listCampaignMessages`;
  
    return this.http.get<CompainMessages[]>(apiUrl, { params: params });
  }
  listCampaignMessagesCount(id: string, StatusFilters?: number[]): Observable<number> {
    let params = new HttpParams().set('id', id);
  
    // Check if StatusFilters is provided and is an array
    if (StatusFilters && Array.isArray(StatusFilters)) {
      StatusFilters.forEach((filter) => {
        params = params.append('StatusFilters', filter.toString());
      });
    }
  
    const apiUrl = `${this.api}Message/listCampaignMessagesCount`;
  
    return this.http.get<number>(apiUrl, { params: params });
  }
  resendCampaignFailedMessages(data):Observable<any>{
    return this.http.post<any>(`${this.api}Message/resendCampaignFailedMessages`,data);
  }
  convertUTCToLocal(utcTime: string,timezone): string {
    const [hoursStr, minutesStr] = utcTime.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
  
    // Get the current date and time in UTC
    const utcDate = new Date(Date.UTC(0, 0, 0, hours, minutes));
  if(timezone){

    utcDate.setHours(utcDate.getUTCHours() + timezone);
    
    
    let hour = utcDate.getHours();
    // Convert hours to 12-hour format and determine AM/PM
    const amPm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Handle 0 as 12 for 12-hour format

    // Add leading '0' if the hour is less than 10
    const formattedHour = hour < 10 ? '0' + hour : hour;

    // Create a formatted date string
    const formattedTime = `${formattedHour}:${minutes} ${amPm}`;
    // Return local hours and minutes as a string
    return formattedTime;
  }
  else{
    const timezoneOffset = new Date().getTimezoneOffset();

  // Adjust hours and minutes for the local time zone offset
  const localHours = (utcDate.getUTCHours() - Math.floor(timezoneOffset / 60)).toString().padStart(2, '0');
  const localMinutes = (utcDate.getUTCMinutes() - (timezoneOffset % 60)).toString().padStart(2, '0');

  // Return local hours and minutes as a string
  return `${localHours}:${localMinutes}`;
  }
  }
}
