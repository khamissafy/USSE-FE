import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input-gg';
import { PluginsService } from 'src/app/services/plugins.service';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CountryService } from 'src/app/shared/services/country.service';
import { DevicesService } from '../../../devices.service';
import { DeviceData } from '../../../device';
import { SubscriptionStateService } from 'src/app/shared/services/subscription-state.service';

@Component({
  selector: 'app-addTLDevice',
  templateUrl: './addTLDevice.component.html',
  styleUrls: ['./addTLDevice.component.scss']
})
export class AddTLDeviceComponent implements OnInit {
  deviceName: any = new FormControl('', [Validators.required, Validators.pattern(this.plugin.notStartWithSpaceReg)]);
  phoneNumber: any = new FormControl('', [Validators.required]);
  appID: any = new FormControl('', [Validators.required]);
  appHash: any = new FormControl('', [Validators.required]);
  code: any = new FormControl(null);
  pass: any = new FormControl(null);
  form = new FormGroup({
    deviceName: this.deviceName,
    phoneNumber:this.phoneNumber,
    appID:this.appID,
    appHash:this.appHash,
    code:this.code,
    pass:this.pass
  })
  codeNeeded:boolean;
  passNeeded:boolean;
  email:any=this.authService.getUserInfo()?.email
    // ngx-intl-tel
    separateDialCode = true;
    SearchCountryField = SearchCountryField;
    CountryISO = CountryISO;
    PhoneNumberFormat = PhoneNumberFormat;
    selectedCountryISO: any;
    isLoading:any;
    isIvalidCode:boolean;
    isInvalidPass:boolean;
    isReconnect:boolean;
    showSteps:boolean=false;
  constructor(public dialogRef: MatDialogRef<AddTLDeviceComponent>,
    private plugin: PluginsService,
    private toaster: ToasterServices,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data:any,
    private countryService:CountryService,
    private authService:AuthService,
    private deviceService:DevicesService,
    private subscriptionState: SubscriptionStateService

  ) { }

  ngOnInit() {
    if(this.data){
      this.isReconnect=true;
      this.fillFormBasedOnData(this.data);
      this.showSteps=false;
    }
    else{
      this.isReconnect=false;
      this.showSteps=true;
    }
    this.setCountryBasedOnIP();

  }
  hideSteps($event){
    this.showSteps=false;
  }
  fillFormBasedOnData(element){
    let devData:DeviceData=element.deviceTl;
    this.form.patchValue({
      deviceName:devData.deviceName,
      phoneNumber:devData.deviceNumber,
      appHash:devData.token,
      appID:devData.instanceId,
    })
    this.deviceService.telegramId=devData.id;
    this.checkError(element.error)


  }
  setCountryBasedOnIP(): void {
    this.countryService.selectedCodeISo.subscribe(
      (countryName)=>{
        this.selectedCountryISO=CountryISO[countryName]
      }
    )
  }
  submit(){
    // Only block on add (new device); reconnects do not consume a new device slot.
    if (!this.isReconnect && this.subscriptionState.isAtDeviceLimit()) {
      const msg = `You have reached the Devices limit for your current plan. <a href="/plans" style="text-decoration:underline;font-weight:600">Upgrade Plan</a>`;
      this.toaster.warning(msg, true);
      return;
    }
    this.isLoading=true;
    let data:any={
      email: this.email,
      deviceName: this.form.value.deviceName,
      phoneNumber: this.form.value.phoneNumber.e164Number.split('+').join('').trim(),
      token: this.form.value.appHash,
      sessionName: this.form.value.appID,
      code: this.form.value.code,
      password: this.form.value.pass
    }
    if(this.deviceService.telegramId){
      data.id=this.deviceService.telegramId
    }
    if(this.isReconnect){
      this.deviceService.reconnectTelegramDev(data).subscribe(
        (res)=>{
          this.deviceService.telegramId=''

        this.onClose(res)
        },
        (err)=>{
          this.checkError(err.error)
        }
      )
    }
    else{
      this.deviceService.addTelegramDev(data).subscribe(
        (res)=>{
          this.deviceService.telegramId=''

        this.onClose(res)
        },
        (err)=>{
          this.checkError(err.error)
        }
      )
    }
  
  }
  checkError(data:any){
    this.isLoading=false;

    if(data?.msg.includes('Error! Code Needed')){
      this.codeNeeded=true;
    }
    if(data.msg.includes('Error! Password Needed')){
      this.passNeeded=true;
    }
    if(!this.deviceService.telegramId)
      {
        this.deviceService.telegramId=data.id;
        
      }
      this.isInvalidPass=(data.msg.includes('PHONE_PASSWORD_INVALID'));
      this.isIvalidCode=(data.msg.includes('PHONE_CODE_INVALID'))
    
    
    this.updateValidators();
  }
  updateValidators(): void {
    if (this.codeNeeded) {
      this.form.get('code').setValidators([Validators.required]);
    } else {
      this.form.get('code').clearValidators();
    }
    this.form.get('code').updateValueAndValidity();

    if (this.passNeeded) {
      this.form.get('pass').setValidators([Validators.required]);
    } else {
      this.form.get('pass').clearValidators();
    }
    this.form.get('pass').updateValueAndValidity();
  }
  onClose(data?) {
    this.dialogRef.close(data)
  }
}
