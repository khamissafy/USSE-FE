import { Component, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { environment } from '@env/environment';
import { PluginsService } from 'src/app/services/plugins.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { ConfirmLogOutComponent } from 'src/app/shared/components/side-bar/components/confirmLogOut/confirmLogOut.component';
import { SettingComponent } from 'src/app/shared/components/side-bar/components/setting/setting.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PermissionsService } from 'src/app/shared/services/permissions.service';
import { Permission } from '../users/users';
import { NzDrawerRef } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnDestroy{
  userName:string=this.authService.getUserInfo()?.userName;
  chars:string=this.userName?.split(" ",2).map((e)=>e.charAt(0).toUpperCase()).join("");
  frontVersion:string=environment.version;
  backVersion:string="";
  role:string=localStorage.getItem("role")
  show:boolean=false;
  listsArr:SelectOption[]
  displaySetting:boolean=false;
  permissions:Permission;
  isUser:boolean;
  openedDialogs:any=[];

  constructor(public plugin:PluginsService,
     public dialog: MatDialog ,
     private authService:AuthService,
     private drawerRef: NzDrawerRef,
     private permissionService:PermissionsService) {}
 
  ngOnInit(): void {
   this.getBackEndVerison();
    if(this.authService.getUserInfo()?.customerId!=""){
      this.isUser=true;
      this.authService.getUserDataObservable().subscribe(permissions => {
        this.permissions=this.permissionService.executePermissions(permissions);
      })
      // let email=this.authService.getUserInfo()?.email;
      // this.getUserPermisisons(email);
    }
    else{
      this.isUser=false;
this.permissions={
  Templates:true,
  Bots:true,
  Devices:true,
  Contacts:true
    }

  }}
  //  console.log(res) 
  getBackEndVerison(){
    this.authService.getBackEndVersion().subscribe(
      (res)=>{;
        this.backVersion=`V${res.version}`}
    )
  }
//   getUserPermisisons(email){
//       this.userServiece.getUserByEmail(email).subscribe(
//         (res)=>{
// this.authService.userPermissions=res;
// console.log(res.permissions)
//           this.permissions=this.userServiece.executePermissions(res.permissions);

//           console.log(this.permissions)
//         },
//         (err)=>{}
//       )

//   }
  showOptions(){this.show=!this.show;}
  openSettingModal(){

    //this.displaySetting=true;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.height = this.isUser ? '50vh' : '77vh';
    dialogConfig.disableClose = true;
    dialogConfig.panelClass='settings-modal'

    const dialogRef = this.dialog.open(SettingComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
     this.userName=this.authService.getUserInfo()?.userName
     this.chars=this.userName?.split(" ",2).map((e)=>e.charAt(0).toUpperCase()).join("");
    });

  }

  openLogOutConfirmation(){

    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='54vh';
    dialogConfig.width='90vw';
    dialogConfig.maxWidth='600px';
    dialogConfig.minWidth='200px';
    dialogConfig.maxHeight='400px';
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'custom-mat-dialog-container';
   
    const dialogRef = this.dialog.open(ConfirmLogOutComponent,dialogConfig);

  }
  closeDrawerAndNavigate(){
    // Close the drawer
    this.drawerRef.close();
  }
  ngOnDestroy(): void {
  }
}
