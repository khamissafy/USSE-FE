import { Component, Inject, OnInit ,OnDestroy} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Message, Shceduled, ShceduledData, messageData } from '../../message';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';
export interface Display{
  message?:messageData,
  isScheduleM?:boolean,
  isScheduleN?:boolean,
  schedule?:ShceduledData,
  recipients?:{number:string} [],
  template?:any
}
@Component({
  selector: 'app-display-message',
  templateUrl: './display-message.component.html',
  styleUrls: ['./display-message.component.scss']
})
export class DisplayMessageComponent implements OnInit ,OnDestroy{
message:messageData;
userName:any;
schedule:ShceduledData;
test:string= "6781dde0-7946-4d49-ad27-a95421f19ff8.jpg";
isScheduleN:boolean=false;
isScheduleM:boolean=false;
template:any;
isTemplate:boolean;
selectedTimeZone:number=0;
sub:any;
recipients:any;
  constructor( public dialogRef: MatDialogRef<DisplayMessageComponent>
            ,@Inject(MAT_DIALOG_DATA) public data:Display,
            private timeZoneService:TimeZoneServiceService
          ) { }
  ngOnInit() {
    this.setTimeZone();
    this.isScheduleM=this.data?.isScheduleM?true:false;
    this.isScheduleN=this.data?.isScheduleN?true:false;
    if(this.isScheduleN){
      this.recipients=this.data.recipients;
      this.isTemplate=false;
    }
    if(this.data.message){
      this.isTemplate=false;

      if(parseInt(this.data.message.chat.chatName)){

        this.userName=this.data.message.chat.chatName.substring(this.data.message.targetPhoneNumber.length-2);
      }
      else{

       this.userName= this.data.message.chat.chatName.trim().split(" ",2).map((e)=>e.charAt(0).toUpperCase()).join("");

      }
      this.message=this.data.message;
    }
    if(this.data.schedule){
            this.schedule=this.data.schedule;
            this.isTemplate=false;

    }
    if(this.data.template){
      this.isTemplate=true;

      this.template=this.data.template;
    }
    // console.log("last nums",this.lastTwoNums)
    // console.log(this.test.split(".").pop())

  }
  setTimeZone(){
    this.sub = this.timeZoneService.timezone$.subscribe(
      res=> this.selectedTimeZone=res

    )
  }
  onClose(data?) {
    this.dialogRef.close(data);
  }
  ngOnDestroy(){
    if(this.sub){
      this.sub.unsubscribe()

    }
  }
}
