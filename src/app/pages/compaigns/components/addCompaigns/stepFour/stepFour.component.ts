import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter, AfterViewInit, Input, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CompaignsService } from '../../../compaigns.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { parse, addMinutes } from 'date-fns';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ContactsWarningComponent } from 'src/app/pages/messages/Components/contactsWarning/contactsWarning.component';
import { Subscription } from 'rxjs';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';

@Component({
  selector: 'app-stepFour',
  templateUrl: './stepFour.component.html',
  styleUrls: ['./stepFour.component.scss']
})
export class StepFourComponent implements OnInit, OnDestroy ,AfterViewInit{

  maxNum = 1000;
  minNum = 0;

  @ViewChild("timePicker1") timePicker1!: ElementRef;
  @ViewChild("timePicker2") timePicker2!: ElementRef;

  isRepeatable: boolean  ;
  isInterval: boolean ;

  disableInterval: boolean = true;
  disableRepeate: boolean = true;
  disable: boolean = true;
  isSendingOutTimeChecked: boolean = false;
  isIntervalChecked: boolean = true;
  utcTime1;
  utcTime2;
  @Input() lastCampaignData:{
    intervalFrom:number,
    intervalTo:number,
    repeatedDays:number,
    isRepeatable:boolean,
    isInterval:boolean,
    // maxPerDay:number,
    sendingoutFrom:string,
    sendingoutTo:string
  
  };
  toggleTime: boolean = false;
  time1: any = new FormControl({ value: '', disabled: true }, [Validators.required]);
  time2: any = new FormControl({ value: '', disabled: true }, [Validators.required]);
  intervalFrom: any = new FormControl({ value: 100, disabled: false }, [Validators.required]);
  intervalTo: any = new FormControl({ value: 180, disabled: false }, [Validators.required]);
  // maxPerDay: any = new FormControl({ value: 100, disabled: false }, [Validators.required]);
  repeatedDays: any = new FormControl({ value: 0, disabled: true }, [Validators.required]);
  selectedTime: Date = new Date();
  form: FormGroup;
  showCloseIntervalWarning:boolean=false;
  showIntervalRangeWarning:boolean=false;
  showTimeDifferenceWarning:boolean=false;


  fromLastCampaignSettings:{
    closeIntervalWarning:boolean,
    itervalRangeWarning:boolean,
    timeDifferenceWarning:boolean}=
    {
    closeIntervalWarning:false,
    itervalRangeWarning:false,
    timeDifferenceWarning:false,
  }
  @Output() formValidityChange = new EventEmitter<boolean>(true);
 
  subscriptions:Subscription[]=[];
  constructor(private fb: FormBuilder, private datePipe: DatePipe,
    private campaignServeice: CompaignsService,
    private authService: AuthService,
    private dialog: MatDialog,
    private timeZoneService:TimeZoneServiceService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group(
      {
        intervalFrom: this.intervalFrom,
        intervalTo: this.intervalTo,
        // maxPerDay: this.maxPerDay,
        repeatedDays: this.repeatedDays,
        time1: this.time1,
        time2: this.time2,
      },
      { validators: [this.intervalInvalid] }
    );
  }
  ngAfterViewInit(): void {
  }
  getDefaultLocalTime(): string {
    const now = new Date();
    now.setHours(12); // Set default hours to 12
    now.setMinutes(30); // Set default minutes to 30
    return this.datePipe.transform(now, 'HH:mm');
  }

  ngOnInit() {
    this.setDefaultTime();
    let formSubscription = this.form.valueChanges.subscribe(() => {
      
      this.checkValidIntervalRange(this.form.get("intervalFrom").value,this.form.get("intervalTo").value)
     
      this.formValidityChange.emit(this.form.valid);
    });
    this.utcTime1 = this.convertToUTC(this.time1);
    this.utcTime2 = this.convertToUTC(this.time2);

let time1Sub$ = this.time1.valueChanges.subscribe(res => {
  this.utcTime1 = this.convertToUTC(this.time1);
  this.checkValidTimeDifference(this.time1,this.time2)
});
let time2Sub$ = this.time2.valueChanges.subscribe(res => {
  this.utcTime2 = this.convertToUTC(this.time2);
  this.checkValidTimeDifference(this.time1,this.time2)

});
this.subscriptions.push(time1Sub$,time2Sub$,formSubscription)

  }
// set default campain settings
setDefaultTime() {
  if(this.lastCampaignData ){
      this.form.patchValue({
        intervalFrom:this.lastCampaignData.intervalFrom,
        intervalTo:this.lastCampaignData.intervalTo,
        // maxPerDay:this.lastCampaignData.maxPerDay,
        repeatedDays:this.lastCampaignData.repeatedDays,
        time1:this.lastCampaignData.sendingoutFrom,
        time2:this.lastCampaignData.sendingoutTo
      }
    
      )
      this.isRepeatable=this.lastCampaignData.isRepeatable;
      if(this.isRepeatable){
        this.repeatedDays.enable();
      }
      
      this.isInterval=this.lastCampaignData.isInterval;
      if(!this.isInterval){
        this.intervalFrom.disable();
        this.intervalTo.disable();
        if(!this.showCloseIntervalWarning){
          this.fromLastCampaignSettings.closeIntervalWarning=true;
          // warning modal will open with message close interval warning
          this.showCloseIntervalWarning=true;
        }
      }
          // warning modal will open with message invalid interval range warning
      this.checkValidIntervalRange(this.form.get("intervalFrom").value,this.form.get("intervalTo").value , true)
    
      this.isIntervalChecked=this.lastCampaignData.isInterval;
      if(this.timesAreSame(this.time1,this.time2)){
        this.isSendingOutTimeChecked=false;
        this.setTimeToDefault()
        this.time1.disable();
        this.time2.disable();
      }
      else{
        this.isSendingOutTimeChecked=true;
        this.time1.enable();
        this.time2.enable();
        // warning modal will open with message time difference warning
      this.checkValidTimeDifference(this.time1,this.time2 , true);
      
      
      }
  
    this.showModalsInParallel()
  }

  else{
    this.isRepeatable= false;
    this.isInterval= true;
    this.setTimeToDefault()
  }
  }

  ngOnDestroy(): void {
  this.subscriptions.map((sub)=>sub.unsubscribe())

  }
  setTimeToDefault(){
    const defaultTime = new Date();
      defaultTime.setHours(9, 0, 0); 
      
      this.time1.setValue(defaultTime);
      this.time2.setValue(defaultTime);
  }
  onOkClick(timePicker): void {
  // Force update the form control value
  this.convertToUTC(timePicker)
  this.cdr.detectChanges();  // Manually trigger change detection

  // Close the time picker
  timePicker.close();
  }
  setTimeToNow(timecontrol){
    let currentTime = this.timeZoneService.getCurrentTime(this.timeZoneService.getTimezone());
    timecontrol.setValue(currentTime)
  }
  intervalInvalid(formGroup: FormGroup) {
    const intervalFrom = formGroup.get('intervalFrom')!.value;
    const intervalTo = formGroup.get('intervalTo')!.value;
  
    if (intervalFrom && intervalTo && parseInt(intervalFrom, 10) < parseInt(intervalTo, 10)) {
      return null; // Valid
    } else {
      return { intervalInvalid: true }; // Invalid
    }
  }
  checkValidIntervalRange(intFrom , intTo , fromLastCamp?){
    if((intFrom < 100|| intTo < 180 ) && !this.showIntervalRangeWarning){
      this.showIntervalRangeWarning=true;
      if(fromLastCamp){
        this.fromLastCampaignSettings.itervalRangeWarning=true;
      }
      else{
        this.showWarningModal('interval_warning');
      }
    }
  }
  showWarningModal(warningMsg,onCloseCallback?){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='45vh';
    dialogConfig.minHeight='380px';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='608px';
    dialogConfig.data=warningMsg;
    dialogConfig.panelClass='custom-dialog-warning-modal'
    const dialogRef = this.dialog.open(ContactsWarningComponent,dialogConfig);
    // Subscribe to the afterClosed event to execute the callback function after closing the modal
  dialogRef.afterClosed().subscribe(() => {
    if (onCloseCallback) {
      onCloseCallback();
    }
  });
   
  }
 

  showModalsInParallel() {
    const modalFlags = [
      { flag: 'closeIntervalWarning', message: 'close_interval_warning' },
      { flag: 'itervalRangeWarning', message: 'interval_warning' },
      { flag: 'timeDifferenceWarning', message: 'time_difference_warning_msg' }
    ];
  
    // Process the modal flags one by one
    this.processModalFlags(modalFlags);
  }
  
  // Recursive function to process modal flags one by one
  processModalFlags(modalFlags: { flag: string, message: string }[]) {
    if (modalFlags.length === 0) {
      // All modals processed
      return;
    }
  
    const { flag, message } = modalFlags[0];
  
    if (this.fromLastCampaignSettings[flag]) {
      this.showWarningModal(message, () => {
        // Continue to the next modal in the sequence
        modalFlags.shift(); // Remove the processed flag
        this.processModalFlags(modalFlags);
      });
  
      // Set the flag to false after showing the modal
      this.fromLastCampaignSettings[flag] = false;
    } else {
      // Move to the next modal in the sequence
      modalFlags.shift();
      this.processModalFlags(modalFlags);
    }
  }

  timesAreSame(time1: FormControl, time2: FormControl): boolean {
    const date1: Date = time1.value;
    const date2: Date = time2.value;
  
    return (
      date1.getHours() === date2.getHours() &&
      date1.getMinutes() === date2.getMinutes() &&
      date1.getSeconds() === date2.getSeconds()
    );
  }
  checkValidTimeDifference(time1: FormControl, time2: FormControl , fromLastCamp?) {
  
    const date1: Date = time1.value;
    const date2: Date = time2.value;
    if(date1 && date2){
      const timeDifference = Math.abs(date1.getTime() - date2.getTime()) / 1000; // Difference in seconds
  
      if (timeDifference < 80 && !this.showTimeDifferenceWarning && !this.timesAreSame(time1, time2)) {
        this.showTimeDifferenceWarning = true;
        if(fromLastCamp){
          this.fromLastCampaignSettings.timeDifferenceWarning=true;
        }
        else{
          this.showWarningModal('time_difference_warning_msg');
  
        }
      }
    }
   
  }
  convertToUTC(timecontrol: any): any {
    const selectedTime = timecontrol.value;
    let timezone = this.timeZoneService.getTimezone();
   
    if (selectedTime) {
       if(timezone !== null){
       const utcTime = new Date(selectedTime.getTime() - timezone * 60 * 60 * 1000);
  
      const utcDateTime = this.datePipe.transform(utcTime, 'HH:mm:ss');
      return utcDateTime;
    }
     else{
      const timeOnly = new Date();
      timeOnly.setHours(selectedTime.getHours());
      timeOnly.setMinutes(selectedTime.getMinutes());
      timeOnly.setSeconds(selectedTime.getSeconds());

      const utcTime = this.datePipe.transform(timeOnly, 'HH:mm:ss', 'UTC');

      return utcTime;
     }
    }
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
  onSwitcherChange(e, data) {
    for (let item of data) {
      e.target.checked ? item.enable() : item.disable();
   
    }
    if(!this.isInterval){
      if(!this.showCloseIntervalWarning){
        this.showWarningModal('close_interval_warning');
        this.showCloseIntervalWarning=true;
      }
    }
    if(!this.isSendingOutTimeChecked){
      this.setTimeToDefault()
    }
  }

  toggleInterval() {
    this.disableInterval = !this.disableInterval;
  }

  toggleRepeate() {
    this.disableRepeate = !this.disableRepeate;
  }

  changeValue() {
    if (this.isRepeatable) {
      this.form.get('repeatedDays')?.setValue(1);
    } else {
      this.form.get('repeatedDays')?.setValue(0);
    }
  }
}
