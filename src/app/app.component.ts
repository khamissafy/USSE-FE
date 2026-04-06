import { Component, HostBinding, HostListener, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PluginsService } from './services/plugins.service';
import { AuthService } from './shared/services/auth.service';
import { UsersService } from './pages/users/users.service';
import { TranslationService } from './shared/services/translation.service';
import { InitPaginationService } from './shared/services/initPagination.service';
import { PermissionsService } from './shared/services/permissions.service';
import { AuthSessionService } from './shared/services/auth-session.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit ,OnDestroy {
  title = 'pro2023';
  darkActive:boolean = false;
  currentLang:string;
  languageDirection: string;

  constructor(private plugin:PluginsService,
    public translate:TranslateService,
    private initPaginationService:InitPaginationService,
    private authService:AuthService,
    private authSession: AuthSessionService){
    this.currentLang = localStorage.getItem('currentLang') || 'en';
    this.translate.use(this.currentLang);
    document.documentElement.dir=  this.currentLang === 'ar' ? 'rtl' : 'ltr'
    let body:any = document.querySelector('body');
    body.classList.remove('rtl','ltr')
    body.classList.add(this.currentLang === 'ar' ? 'rtl' : 'ltr');
    initPaginationService.init();

  }
  ngOnDestroy(): void {
  }


  ngOnInit(): void {
    const t = this.authService.getAccessToken();
    if (t) {
      this.authSession.scheduleRefreshBeforeExpiry(t);
    }
    this.initMode();

  }

  initMode(){
    if (this.plugin.getData("dark") == true){
      this.darkActive=true;
      const body:any = document.querySelector("body");
      body.classList.toggle("dark");
    }
    if(this.plugin.getData("color-2") !=null){
      this.plugin.SetCssVar("--color-2",this.plugin.getData("color-2"))
      this.plugin.SetCssVar("--color-3",this.plugin.getData("color-3"))
    }
  }
  darkModeToggle(){
      const body:any = document.querySelector("body");
      if(body.classList.contains("dark")){
        this.darkActive = false;
        this.plugin.setData(this.darkActive,"dark")
        body.classList.toggle("dark");
      }else{
        this.darkActive = true;
        this.plugin.setData(this.darkActive,"dark")
        body.classList.toggle("dark");
      }
    }
    changeColor(primColor:string,subColor:string){
      this.plugin.setData(primColor,"color-2");
      this.plugin.setData(subColor,"color-3");
      this.plugin.SetCssVar("--color-2",primColor)
      this.plugin.SetCssVar("--color-3",subColor)
    }
}
