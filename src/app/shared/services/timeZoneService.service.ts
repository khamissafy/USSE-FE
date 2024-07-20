import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimeZoneServiceService {

constructor(    private datePipe: DatePipe,
) {

 }
private timezoneSubject = new BehaviorSubject<number>(0); // Default to UTC
timezone$: Observable<number> = this.timezoneSubject.asObservable().pipe(shareReplay());

setTimezone(timezone: any) {
  let timeZoneOffset = (timezone !== null && timezone !== undefined) ? parseInt(timezone) : null;
  this.timezoneSubject.next(timeZoneOffset);
}

getTimezone(): number {
  return this.timezoneSubject.value;
}


// Method to convert the current UTC time to a specific timezone offset
getCurrentTime(timezoneOffset): Date {
  if(timezoneOffset !== null)
    { const timezoneValue = timezoneOffset;
      const sign = timezoneValue >= 0 ? '+' : '-';
      const timezone = `UTC${sign}${Math.abs(timezoneValue)}`;
    return new Date(this.datePipe.transform(new Date(),`yyyy-MM-ddTHH:mm:ss`, timezone))

    }
    else{
      return new Date();
    }
   
}
}
