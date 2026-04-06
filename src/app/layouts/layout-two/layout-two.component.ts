import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-layout-two',
  templateUrl: './layout-two.component.html',
  styleUrls: ['./layout-two.component.scss']
})
export class LayoutTwoComponent implements OnInit {
  showTrialHintMessage:boolean=false;
  showDeviceWarningMessage:boolean=false;
  activeSidebar= false;
  warningMessage:string="";
  constructor(private render:Renderer2,
      private authService:AuthService,
      private translate:TranslateService) { }

  ngOnInit(): void {
    this.getDevices()
  
  
    this.showTrialHintMessage=this.authService.getSubscriptionState().isTrail ? this.authService.getSubscriptionState()?.isTrail : false;

   
  }
  setWarningMessage(numOfInactiveDev?){
    if(numOfInactiveDev){
      this.translate.get('device_inactive_warning', {numOfInactiveDev}).subscribe((res: string) => {
        this.warningMessage = res;
      });
    }
    else{
      this.warningMessage = this.translate.instant('no_devices_warning');

    }

  
  }
  getDevices(){
    this.authService.getDevices(100,0,"","").subscribe(
      (res)=>{
        let alldevices=res;
        let numberOfInactiveDevices = alldevices.filter((dev)=>dev.isConnected == false).length;
        if(numberOfInactiveDevices > 0) {
          if(this.authService.getShownNumber() < 1){
            this.authService.setShownNumber(1);
            this.setWarningMessage(numberOfInactiveDevices)
            this.showDeviceWarningMessage = true;
          }
        }
        if(alldevices.length == 0){
          if(this.authService.getShownNumber() < 1){
            this.authService.setShownNumber(1);
            this.setWarningMessage(numberOfInactiveDevices)
            this.showDeviceWarningMessage = true;
          }
          
        }

      }
      )
  }
  sidebarTogg(){
    this.activeSidebar = !this.activeSidebar;
  }
  SidebarToggleHov(sidebar:any){
    sidebar.classList.toggle("close-sidebar")
  }
  prepareRoute(outlet: RouterOutlet) {
    return outlet &&
      outlet.activatedRouteData &&
      outlet.activatedRouteData['animationState'];
   }

}
