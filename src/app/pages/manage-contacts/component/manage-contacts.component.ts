import { ToasterServices } from './../../../shared/components/us-toaster/us-toaster.component';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddListComponent } from '../components/lists/addList/addList.component';
import { ListsComponent } from '../components/lists/lists.component';
import { ContactsComponent } from '../components/contacts/contacts.component';
import { ManageContactsService } from '../manage-contacts.service';
import { AddContactComponent } from '../components/contacts/addContact/addContact.component';
import { ContactListsComponent } from '../components/contacts/contactLists/contactLists.component';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UploadSheetComponent } from '../components/importFiles/uploadSheet/uploadSheet.component';
import { Router, ActivatedRoute } from '@angular/router';
import { ErrorsStatesComponent } from 'src/app/shared/components/bulkOperationModals/errorsStates/errorsStates.component';
import { RequestStateComponent } from 'src/app/shared/components/bulkOperationModals/requestState/requestState.component';
import { TranslateService } from '@ngx-translate/core';
import { UnCancelContactsComponent } from '../components/contacts/unCancelContacts/unCancelContacts.component';

@Component({
  selector: 'app-manage-contacts',
  templateUrl: './manage-contacts.component.html',
  styleUrls: ['./manage-contacts.component.scss'],

})
export class ManageContactsComponent implements OnInit, AfterViewInit,OnDestroy{
  tabs=["contacts","lists","cancel"];
  tabsArr=[
    {
      title:'CONTACTS',
      tab:'contacts',
      image:'assets/icons/contacts.svg',
      canceled:false

    },
    {
      title:'LISTS',
      tab:'lists',
      image:'assets/icons/lists.svg'

    },
    {
      title:'CANCELED_CONTACTS',
      tab:'cancel',
      image:'assets/icons/unsubscribe.svg',
      canceled:true


    }
  ]
  selectedTab;
  routingObservable;
  selectedTabIndex=0

  tab = this.tabs[0];
  added:boolean=false;
  isDelete;
  isChecked;
  @ViewChild(ListsComponent) lists:ListsComponent;
  @ViewChild(ContactsComponent) contacts:ContactsComponent;


  isCanceled:boolean=false;
  canEdit: boolean;

  constructor(public dialog: MatDialog,
    private  toaster: ToasterServices,
    private router:Router,
    private activatedRouter:ActivatedRoute,
    private listService:ManageContactsService,
    private authService:AuthService,
    private translate:TranslateService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef){
      this.initRouting()


  }
  initRouting() {
    this.routingObservable = this.activatedRouter.queryParams.subscribe(params => {
      if (params["tab"]) {
        const requestedTab = params["tab"].replace(/[\s]/g);
        const tabIndex = this.tabs.findIndex(tab => tab === requestedTab);
  
        if (tabIndex !== -1) {
          // Valid tab, update accordingly
          this.selectedTab = requestedTab;
          this.selectedTabIndex = tabIndex;
  
          if (this.selectedTab === "cancel") {
            this.isCanceled = true;
          } else {
            this.isCanceled = false;
          }
        } else {
          // Invalid tab, default to the first tab
          this.selectedTab = this.tabs[0];
          this.selectedTabIndex = 0;
          this.isCanceled = false;
  
          // Update the URL with the default tab
          this.updateQueryParams();
        }
      } 
      else {
        // No tab parameter, default to the first tab
        this.selectedTab = "contacts";
        this.selectedTabIndex = 0;
        this.isCanceled = false;
        this.updateQueryParams();

      }
    });
  }
  ngAfterViewInit() {

  }
  getWidth(element: HTMLElement) {

    return `${element.clientWidth}px`;
 }
 
  ngOnInit() {
    let permission =this.listService.contactsPermissions
    let customerId=this.authService.getUserInfo()?.customerId;

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
  openAddListModal(){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='85vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.maxHeight='630px';
    dialogConfig.disableClose = true;

    const dialogRef = this.dialog.open(AddListComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.lists.getListData();
      }

    });

  }
  openAddContactModal(){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='88vh';
    dialogConfig.width='45vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='833px';
    dialogConfig.disableClose = true;

    const dialogRef = this.dialog.open(AddContactComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.contacts.getContacts();
      }
    });
  }


  onDeleteChange(e){
    this.isDelete = e;
  }
  onChecked(e){
    this.isChecked=e;

  }
  // deleteCanceled(e){
  //   this.isCanceled=e
  // }
  openDeleteModal(){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.data = {
      listsData:{lists:this.isDelete}
    };
    dialogConfig.disableClose = true;

    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.lists.deletedLists=result.data;
        

        if(result.errors == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.lists.openSnackBar();
          this.lists.pageNum=0
          this.lists.getListData();
        }
        else{
          this.openRequestStateModal(result ,'deleteList');
        }

      }
      this.lists.selection.clear();

    });
  }

  openImportModal(filetype){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='80vh';
    dialogConfig.width='60vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.disableClose = true;
    dialogConfig.data={filetype:filetype}

    const dialogRef = this.dialog.open(UploadSheetComponent,dialogConfig);
    
    this.contacts.selection.clear();
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.contacts.getContacts();
        }
        else{
          this.openRequestStateModal(result ,'importContacts');
        }
        



      }


    });
  }
  openRequestStateModal(data , operation){
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
        this.openErrorsViewrModal(data , operation)
      }
      else{
        if(operation == 'importContacts' || operation ==  'addContactsToLists' || operation ==  'removeLists'){
          this.contacts.getContacts();
        }
        if(operation == 'deleteContact'){
          this.contacts.getContacts();
          
          this.contacts.openSnackBar();
        }
        if(operation == 'deleteList'){
          this.lists.openSnackBar();
          this.lists.getListData();
        }
        if(operation == 'unCancelContacts'){
          this.contacts.getContacts("",true);
          
          this.contacts.unCancelSnackBar();
        }

      }
    })

    }
  
    openErrorsViewrModal(result , operation){
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
        if(operation == 'importContacts' || operation ==  'addContactsToLists' || operation ==  'removeLists'){
          this.contacts.getContacts();
        }

        if(operation == 'deleteContact')
        {
          this.contacts.getContacts();
          this.contacts.openSnackBar();
        }
        if(operation == 'deleteList'){
          this.lists.openSnackBar();
          this.lists.getListData();
        }
        if(operation == 'unCancelContacts'){
          this.contacts.getContacts("",true);
          
          this.contacts.unCancelSnackBar();
        }
      })
    }

  openDeleteConModal(){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.disableClose = true;

    dialogConfig.data =
    {
      contactsData: {contacts:this.isChecked,remove:false}
    }


    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);


    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.contacts.deletedContacts=result.data;
        if(result.errors == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.contacts.pageNum=0

          this.contacts.getContacts();
          
          this.contacts.openSnackBar();
        }
        else{
          this.openRequestStateModal(result ,'deleteContact');
        }

     

      }

      this.contacts.selection.clear();

    });
  }


  removeLists(){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';

    dialogConfig.disableClose = true;
    dialogConfig.data =
    {
      contactsData:{contacts:this.isChecked,remove:true}
    }
    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.contacts.getContacts();
        }
        else{
          this.openRequestStateModal(result ,'removeLists');
        }
      }

      this.contacts.selection.clear();

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

    dialogConfig.data = {contacts:this.isChecked , listDetails:false};
    const dialogRef = this.dialog.open(ContactListsComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.contacts.getContacts();
        }
        else{
          this.openRequestStateModal(result ,'addContactsToLists');
        }

      }
      this.contacts.selection.clear();

    });

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
      if(result){
        this.contacts.canceledContacts=result.data;
        if(result.errors == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.lists.pageNum=0
          this.contacts.getContacts("" ,true);
          
          this.contacts.unCancelSnackBar();
        }
        else{
          this.openRequestStateModal(result ,'unCancelContacts');
        }

     

      }

      this.contacts.selection.clear();

    });
  }
  updateQueryParams(){
    this.router.navigateByUrl("/contacts?tab="+this.selectedTab)
  }
  changeModal(ev){
    this.selectedTab = this.tabs[ev.index];
    if(this.selectedTab=="cancel"){
      this.isCanceled=true;
    }
    else{
      this.isCanceled=false;

    }
    this.updateQueryParams();
    // this.listService.display=10;
    // this.listService.pageNum=0;
    // this.listService.orderedBy='';
    this.listService.search='';
    this.cdr.detectChanges(); 
 
  }
  // exportAllContacts(){
  //   this.listService.exportAllContacts().subscribe(
  //     (res)=>{
  //       this.listService.exportFileData(res);

  //   },
  //     (err)=>{
  //     }

  //   )
  // }
  exportAllAs(fileType){
    this.listService.exportAllContacts(fileType).subscribe(
      (res)=>{
        this.listService.exportFileData(res,fileType);

    },
      (err)=>{
      }

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
        this.contacts.selection.clear()
      },
      (err)=>{
      }
    )
  }
  // exportSelectedContacts(){
  //   let exporedContacts=this.isChecked.map((contact)=>{
  //     return{
  //       name: contact.name,
  //       mobileNumber: contact.mobileNumber,
  //       companyName:contact.companyName ,
  //       note: contact.note
  //     }
  //   })
  //   this.listService.exportSelectedContacts(exporedContacts).subscribe(
  //     (res)=>{
  //       this.listService.exportFileData(res);
  //       this.contacts.selection.clear()
  //     },
  //     (err)=>{
  //     }
  //   )
  // }
  ngOnDestroy(): void {
    // this.listService.display=10;
    // this.listService.pageNum=0;
    // this.listService.orderedBy='';
    this.listService.search='';
    this.routingObservable.unsubscribe()
  }
}
