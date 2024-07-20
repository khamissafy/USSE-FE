import {  Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NbDateService } from '@nebular/theme';
import { DevicesService } from 'src/app/pages/devices/devices.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { DatePipe } from '@angular/common';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MessagesService } from '../../../messages.service';
import { DevicesPermissions } from 'src/app/pages/compaigns/compaigns.service';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';


@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.scss']
})
export class SendMessageComponent implements OnInit ,OnDestroy {
  @ViewChild("dateTime") dateTime!: ElementRef;
  devices:SelectOption[];
  deviceLoadingText:string='Loading ...';
  devicesData:any = new FormControl([]);
  dateFormControl:FormControl = new FormControl();
  @Output() isSelectedDevices = new EventEmitter<boolean>(true);

  // selectedDevices:string[]=[];
  deviceId:string;
  form = new FormGroup({
    devicesData:this.devicesData,
    dateFormControl:this.dateFormControl,

  });

utcDateTime;
timeSub$;
isUser: boolean;
  permission:DevicesPermissions[];
  sub: any;
  constructor(private devicesService:DevicesService,
    private dateService:NbDateService<Date>,
    private datePipe: DatePipe,
    private messageService:MessagesService,
    private authService:AuthService,
    private timeZoneService:TimeZoneServiceService,
  ) {

    // this.selectedDate=dateService.today();
   }
   
  ngOnInit() {
    this.getDevices();
    this.isSelectedDevices.emit(false);
    this.setDefaultTime();

    this.permission =this.messageService.devicesPermissions;
if(this.authService.getUserInfo()?.customerId!=""){
  this.isUser=true;
}
else{
  this.isUser=false;
}
  }

  setDefaultTime(){
    let currentTime = this.timeZoneService.getCurrentTime(this.timeZoneService.getTimezone());
    this.dateFormControl.setValue(currentTime);
    this.convertToUTC(this.dateFormControl)
  }
  convertToUTC(timecontrol) {
    const selectedTime =new Date(timecontrol.value);
    let timezone=this.timeZoneService.getTimezone(); 
    if (selectedTime) {
      if(timezone !== null)
        {  const utcTime = new Date(selectedTime.getTime() - timezone * 60 * 60 * 1000);
          this.utcDateTime = this.datePipe.transform(utcTime,`yyyy-MM-ddTHH:mm:ss`);

        }
        else{
          this.utcDateTime = this.datePipe.transform(selectedTime,`yyyy-MM-ddTHH:mm:ss`, 'UTC');
        }
    }
   
  }
  ngOnDestroy(): void {
    if(this.sub){
      this.sub.unsubscribe()
    }
  }

  getDevices(){

    this.authService.getDevices(this.authService.getUserInfo()?.email,10,0,"","").subscribe(
      (res)=>{
        let filterdDevices=this.isUser && this.permission? res.filter((dev)=>this.permission.find((devP)=>devP.deviceId==dev.id && devP.value=="FullAccess")):res;
        let activeDevices=filterdDevices.filter((r)=>r.isConnected)
        this.devices = activeDevices.map(res=>{
          return {
            title:res.deviceName,
            value:res.id,
            deviceIcon:res.deviceType
          }
        });
        
    
        if(activeDevices.length==0){
          this.deviceLoadingText='No Results'
        }
       },
       (err)=>{
        this.deviceLoadingText='No Results'

       })
  }

  onSelect(event){
    this.deviceId=event.value;
    // this.authService.selectedDeviceId=event.value

    this.isSelectedDevices.emit(true);

  }

}
