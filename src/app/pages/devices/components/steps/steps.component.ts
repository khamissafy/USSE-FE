import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { DevicesService } from '../../devices.service';
import { Subscription, interval, switchMap, takeUntil, timer } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { AuthService } from 'src/app/shared/services/auth.service';


@Component({
  selector: 'app-steps',
  templateUrl: './steps.component.html',
  styleUrls: ['./steps.component.scss']
})
export class StepsComponent implements OnInit ,OnDestroy {
  email:string=this.authService.getUserInfo()?.email;

steps:boolean=true;
isLoading:boolean=false;
addDevice:boolean=false;
scanDevice:boolean=false;

onlyScan:boolean;
wBstatus:boolean=false;
initSuccB:boolean=false;
sessionNB:string;
portWB:number;
servierIDwB:number;
tokenB:string;
qrCode:string="";
host:string;
check;
private initSessionSubscription: Subscription;
private checkStatusSubscription: Subscription;
retryCounter:number = 0;

  constructor(private devicesService:DevicesService,
    private  toaster: ToasterServices,
    public dialogRef: MatDialogRef<StepsComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any,
    private authService:AuthService,
    ) { }

  ngOnInit() {
    this.onlyScan=this.data?true:false;


    if(this.onlyScan){
      this.steps=false;
      this.isLoading=true;
      this.addDevice=false;
      this.scanDevice=false;
      this.sessionNB=this.data.sessionName,
      this.servierIDwB=undefined;
      this.host=this.data.device.host;
      this.portWB=this.data.device.port
      this.initSessionAndCheckStatus();
    }
    else{
      this.steps=true;
      this.isLoading=false;
      this.addDevice=false;
      this.scanDevice=false;
    }

  }

scanCode(){
this.isLoading=true;
this.addDevice=false;
this.steps=false;
this.initSessionAndCheckStatus();


}
onAddClose(event){
  if(event){
    this.onClose(true)
  }
  else{
    this.onClose(false)
  }
}

initSessionAndCheckStatus(){
  this.initSessionSubscription= this.devicesService.initWhatsAppB(this.sessionNB,this.portWB,this.servierIDwB,this.host).subscribe(
  (res)=>{
          this.isLoading=false;
          this.addDevice=false;
          this.steps=false;
          this.scanDevice=true;


          this.sessionNB=res.sessionName;
          this.tokenB=res.token;
          this.initSuccB=res.isSuccess;
          this.portWB=res.port;
          this.servierIDwB=res.serverId

          let data='data:image/png;base64,';
          let code=res.base64.includes(data)? res.base64.replace(data,""):res.base64;

          this.qrCode=`${data}${code}`;

        this.checkStatus();


  },
  (err)=>{

    this.onClose()

  }
)
}


checkWhatsappB(){
  if(this.wBstatus ){
    clearInterval(this.check);
    this.retryCounter=0;
    this.isLoading=false;
    this.addDevice=!this.onlyScan;
    this.steps=false;
    this.scanDevice=false;
    if(!this.addDevice){
      this.onClose(this.data)
    }
  }
  else if(!this.wBstatus&& this.retryCounter>=10){
    clearInterval(this.check);
    this.retryCounter=0;
    this.initSessionAndCheckStatus();

  }
}
checkStatus(){
    this.check=setInterval(()=>{

    this.checkStatusSubscription = this.devicesService.CheckWhatsappBisuness(this.sessionNB,this.tokenB,this.portWB,this.servierIDwB).subscribe(
        (res)=>{
          this.wBstatus=res.status;
          this.retryCounter++;
          this.checkWhatsappB();
        },
        (err)=>{
          this.onClose()
        }
      )
    },2000) ;
}
onClose(data?) {
  this.dialogRef.close(data);
}

ngOnDestroy(): void {
  clearInterval(this.check);
  // Unsubscribe to avoid memory leaks
  this.initSessionSubscription?.unsubscribe();
  this.checkStatusSubscription?.unsubscribe();
}

}
