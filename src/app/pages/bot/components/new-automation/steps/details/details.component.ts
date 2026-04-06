import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Automation } from 'src/app/pages/bot/interfaces/automation';
import { DevicesService } from 'src/app/pages/devices/devices.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {
  devices:SelectOption[];
  deviceLoadingText:string='Loading ...';
  devicesData:any = new FormControl([]);
  deviceId:string="";
  message = new FormControl('');
  sessionTimeOut: any = new FormControl(15);
  email:string=this.authService.getUserInfo()?.email;

  form = new FormGroup({
    devicesData:this.devicesData,
    message:this.message,
    sessionTimeOut:this.sessionTimeOut
  });
  minNum = 0;
  @Input() automationData:Automation;
  @Output() deviceIdToParent = new EventEmitter<string>;
  constructor(private devicesService:DevicesService,
    private authService:AuthService
    ) { }

  ngOnInit() {
    this.getDevices();
    if(this.automationData){
      this.form.patchValue(
        {
          message:this.automationData.sessionTimeOutResponseContent,
          sessionTimeOut:this.automationData.sessionTimeOutMinutes,
        }
      )
    }
  }
  getDevices(){

    this.authService.getDevices(10,0,"","").subscribe(
      (res)=>{

        let activeDevices=res.filter((r)=>r.isConnected)
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
        if(this.automationData){
          let allDevices=res;
            let selectedDevice= allDevices.find((device)=>device.id == this.automationData.deviceid);
            this.form.patchValue(
              {
                devicesData: {
                  title:selectedDevice.deviceName,
                  value:selectedDevice.id,
                  deviceIcon:selectedDevice.deviceType
        
                  }
              }
            )
            this.deviceId=this.automationData.deviceid
            this.deviceIdToParent.emit(this.deviceId)
        }
      },
      (err)=>{
        this.deviceLoadingText='No Results'

      })
  }
  onSelect(event){
    this.deviceId=event.value;
    this.deviceIdToParent.emit(this.deviceId)

  }
}
