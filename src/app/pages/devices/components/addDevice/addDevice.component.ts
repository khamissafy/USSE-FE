import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { DevicesService } from '../../devices.service';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input-gg';
import { CountryService } from 'src/app/shared/services/country.service';

@Component({
  selector: 'app-addDevice',
  templateUrl: './addDevice.component.html',
  styleUrls: ['./addDevice.component.scss']
})
export class AddDeviceComponent implements OnInit {
  isLoading = false;
  @Input() sessionName:string;
  @Input() token:string;
  @Input() port:number;
  @Input() serverId:number;
  @Output() isClose = new EventEmitter<boolean>;

  deviceName:any = new FormControl('',[Validators.required]);
  mobile:any = new FormControl('',[Validators.required]);
 // ngx-intl-tel
 separateDialCode = true;
 SearchCountryField = SearchCountryField;
 CountryISO = CountryISO;
 PhoneNumberFormat = PhoneNumberFormat;
 
  form = new FormGroup({
    deviceName:this.deviceName,
    mobile:this.mobile

  });
  selectedCountryISO: any;
  constructor(    private toaster: ToasterServices,
    private devicesService:DevicesService,
    private authService:AuthService,
    private countryService:CountryService
  ) { }

  ngOnInit() {
    this.setCountryBasedOnIP();
  }
  setCountryBasedOnIP(): void {
    this.countryService.selectedCodeISo.subscribe(
      (countryName)=>{
        this.selectedCountryISO=CountryISO[countryName]
      }
    )
  }
  submitAdd(){

    this.isLoading=true;
    let deviceN=this.form.value.deviceName;
    let phoneNumber=this.form.value.mobile.e164Number;
    this.devicesService.addNewWhatsappBisunessDevice(deviceN,phoneNumber,this.token,this.sessionName,this.port,this.serverId).subscribe(
      (res)=>{
        this.isLoading = false;
        this.isClose.emit(true);
        this.toaster.success("Device Added Successfully")
                  },
      (err)=>{
        this.isLoading = false;
        this.isClose.emit(false);
            }
    )
  }
}
