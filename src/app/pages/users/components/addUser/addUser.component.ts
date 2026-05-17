import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { DeviceSections, DevicesData } from '../../users';
import { SignupService } from 'src/app/pages/signup/signup.service';
import { PluginsService } from 'src/app/services/plugins.service';
import { UsersService } from '../../users.service';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { TranslateService } from '@ngx-translate/core';
import { SubscriptionStateService } from 'src/app/shared/services/subscription-state.service';

export interface TestData{
  deviceId:string,
  deviceValue:string
}
export interface AccessLevels{
  value:string,
  checked:boolean
  // state:string
}

@Component({

    selector: 'app-addUser',
    templateUrl: './addUser.component.html',
    styleUrls: ['./addUser.component.scss'],
   // standalone: true,
    //imports: [MatCardModule, MatCheckboxModule, FormsModule, MatRadioModule ,MatSelectModule]

})
export class AddUserComponent implements OnInit {
  form:any;
  contactName:any;
  email:any;
  password:any;

  userPermisions:DevicesData[];
  userPermisions$:{name:string,value:string}[]=[]

  sharedPermisions:DeviceSections[];
  sharedPermisions$:{name:string,value:string}[]=[]
  isLoading: boolean;

    constructor(public dialogRef: MatDialogRef<AddUserComponent>,
      private translate: TranslateService,

      private plugin:PluginsService,private toaster: ToasterServices,
    private signupService:SignupService,private userService:UsersService,
    private subscriptionState: SubscriptionStateService) {
    }
  ngOnInit() {
     // controls
     this.initFormControles()
     //form creation
     this.createForm();
  }
  initFormControles(){
    this.contactName = new FormControl('',[Validators.required]);
    this.email=new FormControl('',[Validators.required,Validators.pattern(this.plugin.emailReg)]);
    this.password = new FormControl('',[Validators.required,Validators.pattern(this.plugin.passReg)]);

  }
  createForm(){
    this.form = new FormGroup({
      contactName: this.contactName ,
      email: this.email ,
      password: this.password,

    })
  }

    submitAdd() {
      if (this.subscriptionState.isAtSeatLimit()) {
        const msg = `You have reached the Seats limit for your current plan. <a href="/plans" style="text-decoration:underline;font-weight:600">Upgrade Plan</a>`;
        this.toaster.warning(msg, true);
        return;
      }
      let allPermisions=this.preparePermisions();
      const data={
        contactName: this.contactName.value ,
        organisationName:this.userService.organizationName  ,
        email: this.email.value ,
        password: this.password.value,
        customerId:this.userService.id,
        permissions:allPermisions
      }
      this.isLoading = true;

      this.signupService.register(data).subscribe(
        (res) => {
          this.isLoading = false;
          this.onClose(true);
                  this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));

        },
        (err) => {
          this.isLoading = false;
          this.onClose(false);
        }
      )
      console.log("all permisions",data)
    }


    onClose(data?): void {
        this.dialogRef.close(data);
    }


    addPermissions(event){
      this.userPermisions=event;

    }
    addSharedPermisions(event){
        this.sharedPermisions=event;
    }

    preparePermisions(){

      this.userPermisions$=[];
      if(this.userPermisions){

        this.userPermisions.map((permission)=>{
          let sectionName;
          let deviceId=permission.deviceId;
          let accessValue;

          permission.sectionsLevels.map((level)=>{
            sectionName=level.section.label
            accessValue=level.accessLevels.find((l)=>l.checked).value;
           this.userPermisions$.push(this.createAccessLevels(sectionName,accessValue,deviceId)) ;

          })})
          ;
      }
      this.sharedPermisions$=[];
      this.sharedPermisions.map((permision)=>{
        let sectionName = permision.section.label;
        let accesValue = permision.accessLevels.find((l)=>l.checked).value;
        this.sharedPermisions$.push(this.createAccessLevels(sectionName,accesValue))
      });
      return [...this.userPermisions$,...this.sharedPermisions$]
    }
    createAccessLevels(name:string,value:string,deviceId?:string){
      if(deviceId){
        return {
          name:`${name}_${deviceId}`,
          value:value
        }
      }
      else{
        return {
          name:name,
          value:value
        }
      }

    }

}
