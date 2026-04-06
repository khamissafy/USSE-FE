import { Component, OnInit } from '@angular/core';
import { Info } from '../../interfaces/info';
import { InfoService } from '../../info.service';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-viewSubscriptions',
  templateUrl: './viewSubscriptions.component.html',
  styleUrls: ['./viewSubscriptions.component.scss']
})
export class ViewSubscriptionsComponent implements OnInit {
userSubscripitons:Info;
email:string=this.authService.getUserInfo()?.email
fullDetails:any=[]
extraParameters:{name:string , price:number}[]=[];
totalPrice:number=0;
  constructor(private infoService:InfoService ,
    private authService:AuthService ) { }

  ngOnInit() {
    this.getSubscriptions()
  }
  getSubscriptions(){
    this.infoService.getUserSubscribtion().subscribe(
      (res)=>{
        this.userSubscripitons=res;
        this.fullDetails=[
          { name: "subscription", value:  this.userSubscripitons.subscribtionName },
          { name: "USERS", value: `${ this.userSubscripitons.currentUsersCount} / ${ this.userSubscripitons.maxUsersCount}` },
          { name: "devicesLabel", value: `${ this.userSubscripitons.currentDevicesCount} / ${ this.userSubscripitons.maxDevicesCount}` },
          // { name: "Bots", value: "0 / 10" }, // Add other properties accordingly
          { name: "Automations",value:  `${ this.userSubscripitons.currentAutomationsCount} / ${ this.userSubscripitons.maxAutomationsCount}` },
          { name: "API Support", value:  this.userSubscripitons.isAPIEnabled ? "Enabled" : "Disabled" },
          { name: "MESSAGES_LABEL", value: `${ this.userSubscripitons.currentMessagesCount} / ${ this.userSubscripitons.maxMessagesCount}` },
        ];
        this.extraParameters=this.userSubscripitons.additionalFeature;
        this.totalPrice=this.userSubscripitons.subscriptionPrice;
        this.extraParameters.forEach((param)=>{
          this.totalPrice+=param.price;
        })
      }
    )
  }
}
