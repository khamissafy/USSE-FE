import { SignupService } from './../signup.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PluginsService } from 'src/app/services/plugins.service';
import { LoginService } from '../../login/login.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CountryService } from 'src/app/shared/services/country.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit ,OnDestroy{
  isVisiblePass =false;
  isLoading = false
  userInfo:any;
  language:string=localStorage.getItem("currentLang")=="ar"?"العربية":"English";
  currentLang:string;
  form:any;
  contactName:any;
  organisationName:any;
  email:any;
  password:any;
  confirm:any;
  loading;
  supscription: any;
  valid: boolean;
  countryCode:string;
  constructor(private plugin:PluginsService,
    private signupService:SignupService,
    private router:Router,
    private authService:AuthService,
    private loginService:LoginService,
    private countryService:CountryService
    ) { }

  ngOnInit(): void {
  this.getCountryCode();
    // controls
    this.initFormControles()
    //form creation
    this.createForm();
    this.supscription=this.form.valueChanges.subscribe(
      (res)=>{
        if(this.form.get('password').value === this.form.get('confirm').value){
          this.valid=true;
        }
        else{
          this.valid=false;
        }
      }
      )
  }
  getWidth(element: HTMLElement) {

    return `${element.clientWidth}px`;
  }
  switchLanguage(lang: string) {
    localStorage.setItem("currentLang",lang);
    location.reload()
  
  }
  initFormControles(){
    this.contactName = new FormControl('',[Validators.required]);
    this.organisationName = new FormControl('');
    this.email=new FormControl('',[Validators.required,Validators.pattern(this.plugin.emailReg)]);
    this.password = new FormControl('',[Validators.required,Validators.pattern(this.plugin.passReg)]);
    this.confirm = new FormControl('',[Validators.required,Validators.pattern(this.plugin.passReg)]);

  }
  createForm(){
    this.form = new FormGroup({
      contactName: this.contactName ,
      organisationName: this.organisationName ,
      email: this.email ,
      password: this.password,
      confirm: this.confirm

    })
  }
  signUp(){
    this.loading =true;

    const data={
      contactName: this.contactName.value ,
      organisationName: this.contactName.value ,
      email: this.email.value ,
      password: this.password.value,
      countryCode:this.countryCode
    }
    this.signupService.register(data).subscribe(
      (res)=>{


        this.userInfo={userName:res.contactName,
          organisationName:res.organisationName,
          id:res.id,
          email:res.email,
          token:res.token,
          customerId:res.customerId,
          apiToken:res.apiToken,
          maskType:res.maskType,
          phoneNumber:res.phoneNumber,
          timezone:res.timeZone,
          roles:res.roles[0],
          countryCode:res.countryCode

        }
        let isTrialUser:boolean;
        if(res.customerId!=""){
          isTrialUser=false;
          this.authService.setFileSizeBasedOnSubscription("S");
    
        }
        else{
          const subType=res.subscriptions.find((subs)=>subs.name=="SUBSCRIPTION").value
          if(subType=="T"){
            isTrialUser=true;
          }
          else{
            isTrialUser=false;
          }
          this.authService.setFileSizeBasedOnSubscription(subType);
        }
        this.authService.setSubscriptionState({
          isTrail:isTrialUser,
          trialEndDate:res.trialEndDate,
          messageCount:res.messageCount
    
        })
           // Store the refresh token in a cookie

          
           this.authService.setUserData(this.userInfo,res.refreshToken);
           this.authService.setFromValue("signUp")

      this.sendCode();

      },
      (err)=>{
        this.loading=false

      }
    )
  }

  getCountryCode(){
    this.countryService.getCountryCode().subscribe(
      (res:string)=>{
        if(res=='+20'){
        this.countryCode='2'
        }
        else{
          this.countryCode=res.slice(1);
        }
       
      
      }
    )
  }
  // refreshToken() {
  //   let token=this.loginService.getCookieValue('refreshToken')
  //   this.loginService.refreshToken(token).subscribe(
  //     (res) => {
  //       // Update the refresh token in the cookie
  //       this.loginService.storeRefreshTokenInCookie(res.refreshToken);
  //     },
  //     (err) => {
  //       console.log(err);
  //     }
  //   );
  // }

  sendCode(){
    this.loginService.sendEmailCode(this.form.value.email).subscribe(

      (res)=>{

        this.router.navigateByUrl('verification')
        this.loading=false;


      },
      (err)=>{
        this.loading=false;
      }
    )

  }

  ngOnDestroy() {
    this.supscription.unsubscribe()
   
    
  }
}

// pass ["aaddsDD@dsfd23"],

