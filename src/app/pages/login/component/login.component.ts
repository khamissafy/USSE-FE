import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoginService } from '../login.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PluginsService } from 'src/app/services/plugins.service';
import { UserData } from '../../users/users';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { TranslationService } from 'src/app/shared/services/translation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent  implements OnInit,OnDestroy {
email:any ;
password:any;
form: FormGroup;
loading;
invalid:boolean=false;
hintMessage:string;
userInfo:any;
language:string=localStorage.getItem("currentLang")=="ar"?"العربية":"English";
currentLang:string;
emailSubscription: Subscription;
unsubscribe$ = new Subject<void>();
  constructor(private plugin:PluginsService,
    private authService:AuthService,
    private loginService:LoginService,
    private router:Router,
    private languageService:TranslationService) {

  }
  ngOnInit() {
    this.email=new FormControl('',[Validators.required,Validators.pattern(this.plugin.emailReg)]);
    this.password =new FormControl('',[Validators.required,Validators.pattern(this.plugin.passReg)])
    this.form=new FormGroup(
      {
        email:this.email,
        password:this.password
      }
    )
    this.emailSubscription = this.email.valueChanges
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe(value => {
      this.unsubscribe$.next(); // Signal to unsubscribe
      this.email.setValue(value.trim(), { emitEvent: false });
      this.email.updateValueAndValidity();
    });
  }
  getWidth(element: HTMLElement) {

    return `${element.clientWidth}px`;
  }
  switchLanguage(lang: string) {
    localStorage.setItem("currentLang",lang);
    location.reload()
  
  }
  login(){
    this.loading=true
    this.loginService.login(this.form.value).subscribe(
  (res)=>{

        // Store the refresh token in a cookie

    this.userInfo={
      userName:res.contactName,
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
    
  
    // check autheraization

    if(!res.isEmailAuthonticated){
      this.authService.setUserData(this.userInfo,res.refreshToken);
      // localStorage.removeItem("email")
      // localStorage.setItem("email",res.email)
      this.authService.setFromValue("login")

      this.sendCode();

    }
   else if(res.isEmailAuthonticated && (res.isActive || res.isTrial)){
      // update local storage
      this.authService.saveDataToLocalStorage(this.userInfo);
      this.authService.updateUserInfo(this.userInfo);
  
      this.loginService.storeRefreshTokenInCookie(res.refreshToken);
      this.authService.setRefreshToken()

      
        this.languageService.setAppDirection();
        
        this.router.navigateByUrl('devices')


    }
    else if(!res.isActive ){

      this.hintMessage="Your account is not active , please contact the support to activate it";
      this.loading=false;
      this.invalid=true;
    }

  else{

    this.hintMessage="We can't logged you in ";
    this.loading=false;
    this.invalid=(!res.isActive && !res.isTrial)?true:false;

  }






  },
  (err)=>{
    this.loading=false;
    this.invalid=true;
    this.hintMessage="Email or password is wrong"

  }
)

  }


  refreshToken() {
    let token=this.loginService.getCookieValue('refreshToken')
    this.loginService.refreshToken(token).subscribe(
      (res) => {
        // Update the refresh token in the cookie
        this.loginService.storeRefreshTokenInCookie(res.refreshToken);
        this.authService.setRefreshToken();

      },
      (err) => {
      }
    );
  }

  sendCode(){
    this.loginService.sendEmailCode(this.form.value.email).subscribe(

      (res)=>{

        this.loading=false;
        this.router.navigateByUrl('verification')

      },
      (err)=>{
        this.loading=false;
      }
    )

  }


  ngOnDestroy() {
    this.unsubscribe$.next();
  this.unsubscribe$.complete();
    if (this.emailSubscription) {
      this.emailSubscription.unsubscribe();
    }}

  
}

