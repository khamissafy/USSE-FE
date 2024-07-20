import { Component, OnInit, Renderer2 } from '@angular/core';
import { PluginsService } from 'src/app/services/plugins.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SettingComponent } from '../components/setting/setting.component';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UsersService } from 'src/app/pages/users/users.service';
import { Permission } from 'src/app/pages/users/users';
import { PermissionsService } from 'src/app/shared/services/permissions.service';
import { ConfirmLogOutComponent } from '../components/confirmLogOut/confirmLogOut.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})

export class SideBarComponent implements OnInit {
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
  constructor(public plugin:PluginsService,
     public dialog: MatDialog ,
     private authService:AuthService,
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
    dialogConfig.height = this.isUser ? '50vw' : '83vh';

    dialogConfig.maxHeight = this.isUser ?'415px' : '738px';
    dialogConfig.minHeight = this.isUser ?'415px' :  '620px';
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
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.maxHeight='355px'
   
    const dialogRef = this.dialog.open(ConfirmLogOutComponent,dialogConfig);
   
  }
  
}
