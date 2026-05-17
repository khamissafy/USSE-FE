import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { VerifyService } from './verify.service';
import { LoginService } from '../../login.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UsersService } from 'src/app/pages/users/users.service';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { AuthSessionService } from 'src/app/shared/services/auth-session.service';
import { SubscriptionStateService } from 'src/app/shared/services/subscription-state.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss']
})
export class VerifyComponent implements OnInit ,AfterViewInit,OnDestroy{
  verificationForm: FormGroup;
  isLoading:boolean=false;
  digitIndexes: number[] = [0, 1, 2, 3, 4, 5];
  loading: boolean;
  invalid:boolean=false;
  constructor(private loginService:LoginService,
    private authService:AuthService,
    private router:Router,
    private formBuilder: FormBuilder,
    private userServiece:UsersService,
    private verificatioinService:VerifyService,
    private languageService:TranslationService,
    private authSession: AuthSessionService,
    private subscriptionState: SubscriptionStateService) {
    this.verificationForm = this.formBuilder.group({
      digit0: ['', Validators.required],
      digit1: ['', Validators.required],
      digit2: ['', Validators.required],
      digit3: ['', Validators.required],
      digit4: ['', Validators.required],
      digit5: ['', Validators.required]
    });
    window.addEventListener('beforeunload', this.clearLocalStorage);
  }

  clearLocalStorage() {
    // Clear the local storage when the 'beforeunload' event is triggered
    localStorage.removeItem("email")
    this.router.navigateByUrl("/login")
  }

  ngOnDestroy() {
    // Remove the event listener when the component is destroyed
    window.removeEventListener('beforeunload', this.clearLocalStorage);
  }

  ngOnInit(): void {
    this.authService.setAccessToReset(false)

  }

  ngAfterViewInit(): void {
    this.setFocus(0);
  }
  onDigitInput(event: any, digitIndex: number) {
    const nextDigitIndex = digitIndex + 1;
    const enteredDigit = event.target.value;
    
    // Remove non-numeric characters and limit input to a single character
    const cleanedInput = enteredDigit.replace(/\D/g, '').substr(0, 1);
    this.verificationForm.controls[`digit${digitIndex}`].setValue(cleanedInput);
  
    // If a digit is entered, move focus to the next input field
    if (cleanedInput && nextDigitIndex < this.digitIndexes.length) {
      this.setFocus(nextDigitIndex);
    }
  
    this.checkVerificationCode();
  }
  onDigitPaste(event: any) {
    event.preventDefault();
    const pastedCode = event.clipboardData.getData('text/plain').replace(/\D/g, '').substr(0, 6);
    for (let i = 0; i < pastedCode.length; i++) {
      this.verificationForm.controls[`digit${i}`].setValue(pastedCode[i]);
      this.setFocus(i+1);

    }
    this.checkVerificationCode();
  } 
  // onDigitInput(event: any, digitIndex: number) {
  //   const nextDigitIndex = digitIndex + 1;

  //   const enteredDigit = event.target.value;
  //   if (!isNaN(enteredDigit) && enteredDigit.length === 1) {
  //     this.verificationForm.controls[`digit${digitIndex}`].setValue(enteredDigit);

  //     if (nextDigitIndex < this.digitIndexes.length) {
  //       this.setFocus(nextDigitIndex);
  //     }
  //   }

  //   this.checkVerificationCode();
  // }


  setFocus(digitIndex: number) {
    const inputId = `digitInput${digitIndex}`;
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  }
  onKeyDown(event: KeyboardEvent, digitIndex: number) {
    if (event.key === 'Backspace') {
      this.onDeleteKey(digitIndex);
    }
  }

  onDeleteKey(digitIndex: number) {
    const prevDigitIndex = digitIndex - 1;

    if (prevDigitIndex >= 0) {
      this.verificationForm.controls[`digit${digitIndex}`].setValue('');

      this.setFocus(prevDigitIndex);
    }
  }

  checkVerificationCode() {


    const code = Object.keys(this.verificationForm.controls)
      .map(key => this.verificationForm.controls[key].value)
      .join('');
    if (code.length === 6) {
      const from =this.authService.getFromValue();
      if(from == "login" || from == "signUp"){
        
        // Send verification request using code
        this.isLoading=true
  
        this.verificatioinService.confirmEmail(code, this.authService.getUserData()?.token).subscribe(
          (res)=>{
            this.isLoading=false

            this.invalid=false;
  
            // update local storage
            this.authService.saveDataToLocalStorage(this.authService.getUserData());
            this.authService.updateUserInfo(this.authService.getUserData())
            const t = this.authService.getAccessToken();
            if (t) {
              this.authSession.scheduleRefreshBeforeExpiry(t);
            }
            this.subscriptionState.loadSnapshot().subscribe();
            this.languageService.setAppDirection();

            this.router.navigateByUrl('devices')
          },
          (err)=>{
            this.isLoading=false
  
            this.invalid=true;
          }
        )
      }
      else{
        this.isLoading=true

        this.verificatioinService.confirmCode(code,this.authService.getEmail()).subscribe(
          (res)=>{
            this.isLoading=false
  
            this.invalid=false;
            this.authService.setCode(code);
            this.authService.setAccessToReset(true)
            this.router.navigateByUrl('change-Passward')

          }
        )

      }

    }
  }
  refreshToken() {
    this.loginService.refreshToken().subscribe(
      (res) => {
        this.authService.setAccessToken(res.token);
        this.authSession.scheduleRefreshBeforeExpiry(res.token);
      },
      () => {}
    );
  }
  resetData(){
    this.verificationForm.setValue({
      digit0: '',
      digit1: '',
      digit2: '',
      digit3: '',
      digit4: '',
      digit5: ''
    });
    this.invalid=false;
  }
  reSendCode(){
    const email=this.authService.getUserData().email;
    this.loading=true;
  this.resetData();
    this.loginService.sendEmailCode(email).subscribe(

      (res)=>{

        this.loading=false;

      },
      (err)=>{
        this.loading=false;
      }
    )

  }
 
  // ngOnDestroy() {
  //   console.log("destroyed")
  //   if(!this.verified){
  //     localStorage.removeItem("email")
  //   }
  // }
}
