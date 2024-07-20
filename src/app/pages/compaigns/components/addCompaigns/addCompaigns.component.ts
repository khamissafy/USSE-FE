import { Component, EventEmitter, OnInit, Output, ViewChild, } from '@angular/core';
import { ListData } from 'src/app/pages/manage-contacts/list-data';
import { CompaignsService } from '../../compaigns.service';
import { WriteMessageComponent } from 'src/app/pages/messages/Components/new-message/write-message/write-message.component';
import { StepThreeComponent } from './stepThree/stepThree.component';
import { StepFourComponent } from './stepFour/stepFour.component';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CampaignActionsComponent } from './campaign actions/component/campaignActions/campaignActions.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ConfirmaionsComponent } from './confirmaions/confirmaions.component';
import { ExpectedCampEndTimeComponent } from './expectedCampEndTime/expectedCampEndTime.component';
import { MatStepper } from '@angular/material/stepper';
// import { WriteMessageComponent } from 'src/app/pages/messages/Components/new-message/write-message/write-message.component';
@Component({
  selector: 'app-addCompaigns',
  templateUrl: './addCompaigns.component.html',
  styleUrls: ['./addCompaigns.component.scss']
})

export class AddCompaignsComponent implements OnInit {
  attachments:string[]=[];
  @ViewChild(WriteMessageComponent) writeMessage:WriteMessageComponent;
  @ViewChild(StepThreeComponent) stepThreeComponent:StepThreeComponent;
  @ViewChild(StepFourComponent) stepFourComponent:StepFourComponent;
  @ViewChild(CampaignActionsComponent) campaignActions:CampaignActionsComponent;

  @Output() back = new EventEmitter<boolean>;
  isLoading = false;
  isRepeatable: boolean;
  isInterval:boolean;
  repeatedDays: number;
  intervalFrom: any;
  intervalTo: any;
  blackoutFrom: any;
  blackoutTo: any;
  // maxPerDay: number;
  message:string="";
  lists:string[]=[];
  dateTime:string;
  deviceId:string;
  compaignName:string;
  numErr:number=0;
  stepTwoValidate: boolean = true;
  stepThreeValidate: boolean = true;
  stepFourValidate: boolean = true;
  deviceSelected:boolean=false;
  step1:boolean=true;
step2:boolean=false;
step3:boolean=false;
step4:boolean=false;
sendingTimeOutFrom:any;
sendingTimeOutTo:any;
lastCampaignData:{
  intervalFrom:number,
  intervalTo:number,
  repeatedDays:number,
  isRepeatable:boolean,
  isInterval:boolean,
  // maxPerDay:number,
  sendingoutFrom:any,
  sendingoutTo:any

};
actions:any=[];
  showWarningMsg: boolean=false;
  MessageAfterTimeOut : any = new FormControl('');
  sessionTimeOut: any = new FormControl(15);
  email:string=this.authService.getUserInfo()?.email
  CampArr:SelectOption[]
  selectedCampaigns = new FormControl([]);
  form = new FormGroup({
    MessageAfterTimeOut:this.MessageAfterTimeOut,
    sessionTimeOut:this.sessionTimeOut,
    selectedCampaigns:this.selectedCampaigns,

  });
  listsLoadingText:string=this.translate.instant('Loading')
  selectedCampaignActions:any=[];
  campaignId:string;
  stepFiveValidate: boolean;
  step5: boolean;
  @ViewChild('stepper') stepper: MatStepper;
  totalContacts:number=0;
  constructor(private compaignsService:CompaignsService,
    private toasterService:ToasterServices,
    private translate: TranslateService,
    public dialog: MatDialog,
    private authService:AuthService){
  }
  ngOnInit() {
this.getLastCampaignData();
  }
  getLists(listsData){
    this.lists=listsData.map((list:ListData)=>{
      this.totalContacts += list.totalContacts
      return list.id
    }
    );
  }

  filesUrls(e){
    this.attachments=e;
  }
  stepTwoValidation(validity: boolean) {
    this.stepTwoValidate = validity;
  }
  stepThreeValidation(validity: boolean) {
    this.stepThreeValidate = validity;
  }
  stepFourValidation(validity: boolean) {
    this.stepFourValidate = validity;
  }
  stepFiveValidation(validity: boolean) {
    this.stepFiveValidate = validity;
  }

toSecondStep(){
  this.step2=true;


}

toThirdStep(data){
  this.step3=true;
  this.message=data.message;
  this.attachments=data.files
  // this.message=this.writeMessage.form.value.message;

  // this.attachments=this.writeMessage.fileData.map((file)=>file.url);

}
getLastCampaignData(){
  this.compaignsService.getLastCampaign(this.authService.getUserInfo().email).subscribe(
    (res)=>{
      if(res){
       this.lastCampaignData=res;
       this.lastCampaignData.sendingoutFrom=this.convertUTCToLocal(this.lastCampaignData.sendingoutFrom)
       this.lastCampaignData.sendingoutTo=this.convertUTCToLocal(this.lastCampaignData.sendingoutTo)
      }
 
      
    }
  )
}
toStepFour(){
  this.step4=true;
  this.deviceId=this.stepThreeComponent.deviceId?this.stepThreeComponent.deviceId:"";
  this.dateTime=`${this.stepThreeComponent.utcDateTime}Z`;
  this.compaignName=this.stepThreeComponent.form.value.compainName;
 
}
toStepFive(){
  this.isRepeatable=this.stepFourComponent.isRepeatable;
  this.isInterval=this.stepFourComponent.isInterval;
  
  this.repeatedDays=this.stepFourComponent.form.get("repeatedDays").value;
  this.intervalFrom = this.stepFourComponent.form.get("intervalFrom").value;
  this.intervalTo=this.stepFourComponent.form.get("intervalTo").value;
  this.blackoutFrom=this.stepFourComponent.utcTime1;
  this.blackoutTo=this.stepFourComponent.utcTime2;
  // this.maxPerDay=this.stepFourComponent.form.get("maxPerDay").value;
  this.stepFourComponent.convertToUTC(this.blackoutFrom);

  this.calulateCampExpectedTime()


}


calulateCampExpectedTime(){
  let startDate = this.stepFourComponent.time1;
  let endDate = this.stepFourComponent.time2;

  // Calculate the total time window in seconds
  const timeDiffInHours = !this.stepFourComponent.timesAreSame(startDate,endDate) ? this.calculateTimeDifference(startDate.value , endDate.value) : 24;
  
  // Calculate the interval average
  let intervalAvg = this.isInterval ? (parseInt(this.intervalFrom, 10) + parseInt(this.intervalTo, 10)) / 2 : 1;

  // Calculate the expected time for sending messages within the time window
  let expectedTimeInSeconds = this.totalContacts * intervalAvg;
  
   // Extracting the integer part using Math.floor
   let numOfDays =this.calculateTime(expectedTimeInSeconds , timeDiffInHours).days;
   let numOfHours = this.calculateTime(expectedTimeInSeconds , timeDiffInHours).remainingHours;
   let numOfMinutes = this.calculateTime(expectedTimeInSeconds , timeDiffInHours).remainingMinutes;
   let numOfSeconds =this.calculateTime(expectedTimeInSeconds , timeDiffInHours).remainingSeconds
   // Format the result as a string
  let formattedTime = '';
 
   if (numOfDays > 0) {
     formattedTime += `${numOfDays} ${this.translate.instant('days')} `;
   }
 
   if (numOfHours > 0) {
     formattedTime += `${Math.floor(numOfHours)} ${this.translate.instant('hours')} `;
   }
 
   if (numOfMinutes > 0) {
     formattedTime += `${numOfMinutes} ${this.translate.instant('minutes')}`;
   }
   if(numOfMinutes <= 0 && numOfSeconds > 0){
    formattedTime += `${numOfMinutes} ${this.translate.instant('seconds')}`;

   }
   if(numOfMinutes <= 0 && numOfSeconds <= 0 ){
    formattedTime += `0 ${this.translate.instant('seconds')}`;

   }
   

  this.openCampExpectedTimeModal(formattedTime);
}


calculateTime(numberOfSeconds: number, hoursPerDay: number) {
  // Given values
  const secondsPerHour = 3600;
  const secondsPerMinute = 60;

  // Calculate estimated time in hours
  const estimatedTimeInHours: number = numberOfSeconds / secondsPerHour;

  // Calculate days, remaining hours, and remaining minutes
  const days: number = Math.floor(estimatedTimeInHours / hoursPerDay);
  const remainingHours: number = Math.floor(estimatedTimeInHours % hoursPerDay);
  const remainingMinutes: number = Math.floor((estimatedTimeInHours % 1) * secondsPerHour / secondsPerMinute);

  const remainingSeconds: number = Math.round((estimatedTimeInHours % 1) * secondsPerHour % secondsPerMinute);


  // Return the result as an instance of the TimeResult interface
  return {
    days: days,
    remainingHours: remainingHours,
    remainingMinutes: remainingMinutes,
    remainingSeconds: remainingSeconds
  };
}


calculateTimeDifference(startDate: Date, endDate: Date): number {
  // Make a copy of the start date to avoid modifying the original object
  const start = new Date(startDate);

  // If end date is before start date, assume it's on the next day
  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  // Calculate the difference in milliseconds
  const timeDiff = Math.abs(endDate.getTime() - start.getTime());

  // Convert the difference to hours
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  return hoursDiff;
}
openCampExpectedTimeModal(data){

  const dialogConfig=new MatDialogConfig();
  dialogConfig.disableClose = true;
  dialogConfig.height='49vh';
  dialogConfig.width='55vw';
  dialogConfig.minHeight='350px';
  dialogConfig.maxWidth='100%';
  dialogConfig.minWidth='585px';
  dialogConfig.panelClass='custom-responsive-modal'
  dialogConfig.data=data;
  const dialogRef = this.dialog.open(ExpectedCampEndTimeComponent,dialogConfig);
  dialogRef.afterClosed().subscribe(result => {
    if(result){
      this.step5=true;
      this.stepper.next();
    }
  
  });

}

setActions(event){
  this.actions=event
    }
addCampaign(){
this.isLoading = true;

const data={
  campaignName: this.compaignName,
  scheduledAt: this.dateTime,
  isRepeatable: this.isRepeatable,
  repeatedDays: this.repeatedDays,
  intervalFrom: this.intervalFrom,
  intervalTo: this.intervalTo,
  sendingoutFrom: this.blackoutFrom,
  sendingoutTo: this.blackoutTo,
  maxPerDay: 100000,
  attachments: this.attachments,
  lists: this.lists,
  email: this.authService.getUserInfo()?.email,
  msgBody: this.message,
  deviceId: this.deviceId,
  isInterval: this.isInterval,
  sessionTimeOutMessage:this.form.value.MessageAfterTimeOut,
  sessionTimeOutMinutes: this.form.value.sessionTimeOut,
  actions:this.actions
}

// // Filter the object keys based on values or non-empty arrays
// const filteredKeys = Object.keys(data).filter(key => {
//   const value = data[key];

//   // Check if the value is not an empty array, not null, and not undefined
//   return !((Array.isArray(value) && value.length === 0) || value === null || value === undefined);
// });

// // Create a new object with only the filtered keys
// const filteredData = filteredKeys.reduce((acc, key) => {
//   acc[key] = data[key];
//   return acc;
// }, {});

if(this.attachments.length>0){
  this.showWarningMsg=true;
}
else{
  this.showWarningMsg=false;

}
// console.log(this.compaignsService.filteredObject(data));

this.compaignsService.addMewCampain(this.compaignsService.filteredObject(data)).subscribe(
  (res)=>{
    this.toasterService.success("Success");
    this.back.emit(true)
    this.isLoading = false
    
  },
  (err)=>{

    this.back.emit(true)
    this.isLoading = false;
    
  }


)

}
convertUTCToLocal(utcTime: string): Date {
  const [hoursStr, minutesStr] = utcTime.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  const utcDate = new Date();
  utcDate.setUTCHours(hours, minutes);
  // Convert UTC time to local time
  return utcDate;
}
  }

