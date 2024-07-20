import { AfterViewInit, Component,  OnDestroy, OnInit, Output, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ActivatedRoute, Router } from '@angular/router';
import { Contacts } from 'src/app/pages/manage-contacts/contacts';
import { ListData } from 'src/app/pages/manage-contacts/list-data';
import { ManageContactsService } from 'src/app/pages/manage-contacts/manage-contacts.service';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';

import { ListContactsComponent } from '../components/list-contacts/list-contacts.component';
import { ContactListsComponent } from '../../../contacts/contactLists/contactLists.component';
import { TotalContacts } from '../totalContacts';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UploadSheetComponent } from '../../../importFiles/uploadSheet/uploadSheet.component';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsStatesComponent } from 'src/app/shared/components/bulkOperationModals/errorsStates/errorsStates.component';
import { RequestStateComponent } from 'src/app/shared/components/bulkOperationModals/requestState/requestState.component';
import { UnCancelContactsComponent } from '../../../contacts/unCancelContacts/unCancelContacts.component';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-list-details',
  templateUrl: './list-details.component.html',
  styleUrls: ['./list-details.component.scss']
})
export class ListDetailsComponent implements OnInit ,AfterViewInit , OnDestroy{
  listId:string;
  isChecked:Contacts[];
  list:ListData;
  count:TotalContacts;
  @ViewChild(ListContactsComponent) listContacts:ListContactsComponent;
  tabs=["contacts","canceled"];
  tab = this.tabs[0];
  canEdit: boolean;
  totalContacts:number;
  totalCanceledContacts:number;
  selectedTimeZone:number=0;
  sub:Subscription
  constructor(private activeRoute:ActivatedRoute,public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private listService:ManageContactsService,
    private router:Router,private authService:AuthService,
    private translate:TranslateService,
    private  toaster: ToasterServices,
    private timeZoneService:TimeZoneServiceService
  ) {
    activeRoute.paramMap.subscribe((data)=>
    {
    this.listId=data.get('id');

    })
  }
  ngAfterViewInit() {
    this.listContacts.count=this.count;
        }
        getWidth(element: HTMLElement) {

          return `${element.clientWidth}px`;
       }
  ngOnInit() {
    this.setTimeZone();

    this.getListData();
    let permission =this.listService.contactsPermissions

if(permission){
  if(permission.value=="ReadOnly" || permission.value =="None"){
    this.canEdit=false
  }
  else{
    this.canEdit=true
  }

}
else{

  this.canEdit=true
}

    }
    setTimeZone(){
      this.sub = this.timeZoneService.timezone$.subscribe(
        res=> this.selectedTimeZone=res
  
      )
    }
    getListData(){

      this.listService.getListById(this.listId).subscribe(
        (res)=>{
        this.list=res;
        this.count={totalContacts:this.list.totalContacts,totalCancelContacts:this.list.totalCancelContacts};
        this.totalContacts=this.list.totalContacts;
        this.totalCanceledContacts=this.list.totalCancelContacts;

        },

        (err)=>{
        })


    }
  changeModal(ev){
    this.tab=this.tabs[ev.index];
  
    this.listContacts.selection.clear();
    if(this.listContacts.length){

      // this.listContacts.paginator.pageSize=this.listService.display;
      // this.listContacts.paginator.pageIndex=this.listService.pageNum;
    }
  }
  backTolists(){
this.router.navigateByUrl('contacts?tab=lists')
  }

  onChecked(e){
    this.isChecked=e;

  }


  updateTotalContacts(event){
    this.totalContacts=event
  }
  openDeleteConModal(){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.data =
    {
      contactsData: {contacts:this.isChecked,remove:false}
    }

    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);


    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result.errors == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          
          this.getListData();
          this.listContacts.pageNum=0;
          this.listContacts.getContacts();        
        }
        else{
          this.openRequestStateModal(result );
        }
      }

      this.listContacts.selection.clear();

    });
  }

  openContactLists(){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='70vh';
    dialogConfig.width='40vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.maxHeight='85vh';
    dialogConfig.disableClose = true;

    dialogConfig.data = {list:[this.listContacts.listId],contacts:this.listContacts.ListContacts, listDetails:true};
    const dialogRef = this.dialog.open(ContactListsComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.getListData();
          this.listContacts.getContacts();        
        }
        else{
          this.openRequestStateModal(result );
        }
       

      }
      this.listContacts.selection.clear();

    });

  }

  openRequestStateModal(data,){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='38vh';
    dialogConfig.width='42vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.minHeight='396px'
    dialogConfig.disableClose = true;
    dialogConfig.data=data;

    dialogConfig.panelClass = 'custom-mat-dialog-container';
    const dialogRef = this.dialog.open(RequestStateComponent,dialogConfig);
    
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.openErrorsViewrModal(data)
      }
      else{
         this.getListData();
          this.listContacts.getContacts(); 
        

      }
    })

    }
  
    openErrorsViewrModal(result){
      const dialogConfig=new MatDialogConfig();
      dialogConfig.height='87vh';
      dialogConfig.minHeight='560px'
      dialogConfig.width='56vw';
      dialogConfig.maxWidth='100%';
      dialogConfig.minWidth='565px';
      dialogConfig.disableClose = true;
      dialogConfig.data=result
  
      const dialogRef = this.dialog.open(ErrorsStatesComponent,dialogConfig);
      dialogRef.afterClosed().subscribe(result => {
        this.getListData();
        this.listContacts.getContacts(); 
  
      })
    }

  openImportModal(filetype){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='80vh';
    dialogConfig.width='60vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.disableClose = true;
    dialogConfig.data={filetype:filetype,listId:this.listId}

    const dialogRef = this.dialog.open(UploadSheetComponent,dialogConfig);

    this.listContacts.selection.clear();
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.getListData();
          this.listContacts.getContacts();
    
        }
        else{
          this.openRequestStateModal(result );
        }
      }


    });
  }

  removeContacts(){
 const dialogConfig=new MatDialogConfig();
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.disableClose = true;

    dialogConfig.data = {
      listsData:{contacts:this.isChecked,list:[this.listId]}
    };
    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.getListData();
          this.listContacts.pageNum=0
          this.listContacts.getContacts();        
        }
        else{
          this.openRequestStateModal(result );
        }

      }
      this.listContacts.selection.clear();

    });
  }
exportAllContactsAs(fileType){
  this.listService.exportContactsInList(this.listId,fileType).subscribe(
    (res)=>{this.listService.exportFileData(res,fileType)},
    (err)=>{}
  )
}

exportSelectedContactsAs(fileType){
  let exporedContacts=this.isChecked.map((contact)=>{
    return{
      name: contact.name,
      mobileNumber: contact.mobileNumber,
    
    }
  })
  this.listService.exportSelectedContacts(exporedContacts,fileType).subscribe(
    (res)=>{
      this.listService.exportFileData(res,fileType);
      this.listContacts.selection.clear();

    },
    (err)=>{;
    }
  )
}
openUnCancelContactsModal(){
  const dialogConfig=new MatDialogConfig();
  dialogConfig.height='45vh';
  dialogConfig.width='35vw';
  dialogConfig.maxWidth='100%';
  dialogConfig.minWidth='512px';
  dialogConfig.disableClose = true;
  dialogConfig.data =
  {
    contactsData: {contacts:this.isChecked}
  }


  const dialogRef = this.dialog.open(UnCancelContactsComponent,dialogConfig);

  dialogRef.afterClosed().subscribe(result => {
    if(result == 'noErrors'){
      this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
      this.getListData();
      this.listContacts.getContacts();        
    }
    else{
      this.openRequestStateModal(result );
    }
    this.listContacts.selection.clear();

    })

 

}

ngOnDestroy(): void {
  if(this.sub){
    this.sub.unsubscribe()
  }
  // this.listService.display=10;
  // this.listService.pageNum=0;
  // this.listService.orderedBy='';
  // this.listService.search='';
}
}
