import { SelectionModel } from '@angular/cdk/collections';
import { Component, ComponentFactoryResolver, ComponentRef, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { CONTACTSHEADERMobile } from '../../../constants/constants';
import { Contacts } from '../../../contacts';
import { ListData } from '../../../list-data';
import { ManageContactsService } from '../../../manage-contacts.service';
import { AddContactComponent } from '../../contacts/addContact/addContact.component';
import { AdditonalParamsComponent } from '../../contacts/additonalParams/additonalParams.component';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { ContactInfoComponent } from '../contact-info/contact-info.component';
import { NavActionsComponent } from 'src/app/shared/components/nav-actions/nav-actions.component';
import { UploadSheetComponent } from '../../importFiles/uploadSheet/uploadSheet.component';
import { ErrorsStatesComponent } from 'src/app/shared/components/bulkOperationModals/errorsStates/errorsStates.component';
import { RequestStateComponent } from 'src/app/shared/components/bulkOperationModals/requestState/requestState.component';
export interface ContactInfoContent {
  additionalParameters: { name: string; value: string }[];
  lists:string[];
  contactName: string;
  contactNumber: string;
  title:string;
}
@Component({
  selector: 'app-contacts-mobileView',
  templateUrl: './contacts-mobileView.component.html',
  styleUrls: ['./contacts-mobileView.component.scss']
})
export class ContactsMobileViewComponent implements OnInit {
  length:number;
  numRows;
  loading:boolean=true;
  cellClick:boolean=false;
  tableData:any=[];
  selectedItems:any=[]
  @Input() isCanceled:boolean;
  @ViewChild(MatPaginator)  paginator!: MatPaginator;
  @ViewChild("search") search!:ElementRef
  @ViewChild(MatSort) sort: MatSort;
  openedDialogs:any=[];
@Input() canEdit:boolean;
@Input() selectedTimeZone :number=0;
  listTableData:ListData[]=[]
  deletedContacts:string[]=[];
  canceledContacts:string[]=[];
  columns :FormControl;
  displayed: any[] = CONTACTSHEADERMobile;
  displayedColumns: string[] = ['select','Name', 'Mobile',"Lists",'Additional Parameters',"Create At","action"];
  dataSource:MatTableDataSource<Contacts>;
  selection = new SelectionModel<Contacts>(true, []);
  subscribtions:Subscription[]=[];
  @Input() listId:string="";
  isSearch: boolean;
  noData: boolean=false;
  notFound: boolean=false;
  display: number;

  dynamicComponentRef: ComponentRef<NavActionsComponent>;
  showsOptions:SelectOption[]=[
    {title:'10',value:10},
    {title:'50',value:50},
    {title:'100',value:100}


  ];
  showsSelectedOptions:any = new FormControl([]);

  form = new FormGroup({
    showsSelectedOptions:this.showsSelectedOptions,
   
  });
  navActionSubscriptions:Subscription[]=[];
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef }) dynamicComponentContainer: ViewContainerRef;
  
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  isChecked:boolean=false;
  pageIndex:number=0;
  
  selectedSortingName:string='name';
  selectedSortingType:string='ASC'
  orderedBy: string='';
  topSortingOptions:any=[{opitonName:'name' ,lable:`${this.translate.instant('nameLabel')}`, isSelected:true} 
                          , {opitonName:'createdAt' , lable:`${this.translate.instant('CREATE_AT')}`,isSelected:false}]
  
bottomSortingOptions:any=[{opitonName:'ASC' ,lable:`${this.translate.instant('ASCENDING')}`, isSelected:true} ,
                            {opitonName:'DEC' , lable:`${this.translate.instant('DESCENDING')}`,isSelected:false}]
  searchSub: Subscription;

  constructor(public dialog: MatDialog,
    private toaster: ToasterServices,
    private listService:ManageContactsService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private authService:AuthService,
    private translationService:TranslationService,
    private drawerService: NzDrawerService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    this.display=listService.getUpdatedDisplayNumber()
    this.pageIndex=this.listService.pageNum;

    }
  ngAfterViewInit() {
  }


  getDataFromParent(data,search,isCancled,length){
    if(this.searchSub){
      this.searchSub.unsubscribe();
      this.searchSub=null;

      this.searchForm.patchValue({
        searchControl:''
      })
    }
    this.handleContactsResponse(data,search,isCancled,length);
    this.setupSearchSubscription()

  }
  ngOnInit() {
    this.form.patchValue({
      showsSelectedOptions: {
      title:String(this.listService.getUpdatedDisplayNumber()),
      value:this.listService.getUpdatedDisplayNumber(),
      }
      })
      if(this.isCanceled){
        if(!this.canEdit){
            this.displayedColumns = ['Name', 'Mobile',"Lists",'Additional Parameters',"Create At"];
    
          }
          else{
            this.displayedColumns= ['select','Name', 'Mobile',"Lists",'Additional Parameters',"Create At"];
    
          }
    
        }
    else{
      if(!this.canEdit){
        this.displayedColumns= ['select','Name', 'Mobile',"Lists",'Additional Parameters',"Create At"];

      }
    }

    // this.getContacts();
    this.columns=new FormControl(this.displayedColumns)

    this.selection.changed.subscribe(
      (res) => {

        if(res.source.selected.length  > 0 ){
        this.isChecked=true;

        }
        else{
          this.isChecked=false;

        }
     
      
      });
     
  }
  setupSearchSubscription(): void {
    this.searchSub= this.searchControl.valueChanges.pipe(
      debounceTime(700), // Wait for 1s pause in events
      distinctUntilChanged(), // Only emit if value is different from previous value
      switchMap(searchVal => this.getContactsReq(searchVal,this.isCanceled))
    ).subscribe(
      (res)=>{
        this.handleContactsResponse(res,this.searchControl.value,this.isCanceled)
      },
      (err)=>{
        this.loading = false;
        this.length=0;

       })
       this.subscribtions.push(this.searchSub)
  }
  getContactsReq(searchVal,canceled?){
    let shows=this.listService.display;
    let email=this.authService.getUserInfo()?.email;
    let orderedBy=this.orderedBy;
    let pageNumber=searchVal?0:this.pageIndex
    if(searchVal && this.paginator){
        this.paginator.pageIndex=0
    }
    this.loading = true;
    if(this.selection){
      this.selection.clear();
      this.isChecked=false   
      if(this.dynamicComponentRef){
        this.distroyDynamicComponent()
      }
     
  
  
    }
  return  this.listService.getContacts(email,canceled,shows,pageNumber,orderedBy,searchVal,this.listId)
  }
  
  handleContactsResponse(res: Contacts[], search: string,canceled,count?): void {
    this.numRows=res.length;
      
    this.tableData=res;
    if(search!=""){
      this.length=res.length;
      this.loading = false;
      if(this.length==0){
        this.notFound=true;
      }
      else{
        this.notFound=false;
      }
  }
  else{
    if(this.paginator){
      this.paginator.pageIndex=this.pageIndex
    }
    this.notFound=false;
    if(count){
      this.length=count;
      this.loading = false;
      if( this.length==0){
       this.noData=true;

     
     }
     else{
        this.noData=false;

    
      }
    }
    else{
      this.contactsCount(canceled);

    }

  }
  }

  getContacts(searchVal? ,canceled?){
    if(this.searchSub){
      this.searchSub.unsubscribe();
      this.searchSub=null;

      this.searchForm.patchValue({
        searchControl:''
      })
    }
  let search=searchVal ? searchVal : "";
  let isCanceledContacts=canceled? canceled :this.isCanceled
  this.loading = true;

   let sub1= this.getContactsReq(search,isCanceledContacts).subscribe(
      (res)=>{
       this.handleContactsResponse(res,search,isCanceledContacts)
       this.setupSearchSubscription();

       },
       (err)=>{
        this.loading = false;
        this.length=0;

      })
      this.subscribtions.push(sub1)
  }

  toggleTopSortingSelect(){
    this.topSortingOptions.forEach((option:{opitonName:string,isSelected:boolean })=>option.isSelected=!option.isSelected);
    this.selectedSortingName= this.topSortingOptions.find((option)=>option.isSelected).opitonName;
    this.changeSorting(this.selectedSortingName , this.selectedSortingType)
  }
toggleBottomSortingSelect(){
  this.bottomSortingOptions.forEach((option:{opitonName:string,isSelected:boolean })=>option.isSelected=!option.isSelected);
  this.selectedSortingType= this.bottomSortingOptions.find((option)=>option.isSelected).opitonName;
  this.changeSorting(this.selectedSortingName , this.selectedSortingType)

}
changeSorting(selectedSortingName ,selectedSortingType){
let sorting=`${selectedSortingName}${selectedSortingType}`;
this.orderedBy=sorting;
this.selection.clear();
this.getContacts();
}

  
  // Modify your existing method to handle selected row logic
  selectedRow(event: Event, element: any) {
    // Your existing selectedRow logic
  }
  selectAllRows(){
    this.selection.select(...this.tableData);
    if (this.dynamicComponentRef && this.selection.selected.length  > 0 ) {
      this.dynamicComponentRef.instance.selectedItems=this.selection.selected;
      this.selectedItems=this.selection.selected;
      this.dynamicComponentRef.instance.selectedItemsCount = this.selection.selected.length;
    }
  }
  createDynamicComponent(selectedContacts) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(NavActionsComponent);
    this.dynamicComponentContainer.clear();
  
    const componentRef = this.dynamicComponentContainer.createComponent(componentFactory);
    const navActionsComponentInstance: NavActionsComponent = componentRef.instance;
    navActionsComponentInstance.selectedItems = selectedContacts;
    this.selectedItems=selectedContacts;
    navActionsComponentInstance.canEdit = this.canEdit;

    navActionsComponentInstance.componentName =this.isCanceled? 'canceledContacts' : 'contacts';

    // Assign the componentRef to this.dynamicComponentRef
    this.dynamicComponentRef = componentRef;
  
    // Pass selected row data to the dynamic component
    let sub1 = navActionsComponentInstance.selectAllEvent.subscribe(() => {
      // Logic to handle "Select All" event
      this.selectAllRows();
    });
    let sub2 = navActionsComponentInstance.deselectAllEvent.subscribe((res) => {
     if(res){
      this.distroyDynamicComponent();
      // this.selectionData.emit(this.selection);
    }
    });
    let sub3 =  navActionsComponentInstance.updateData.subscribe((res) => {
      if(res){
        this.pageIndex=0;
        this.getContacts();
        this.distroyDynamicComponent();
        
      }
    });
    let sub4 = navActionsComponentInstance.updateCanceledData.subscribe((res)=>{
      if(res){
        this.getContacts('',true);
        this.distroyDynamicComponent();
        this.unCancelSnackBar();
      }
    })
    let sub5 = navActionsComponentInstance.unDoDeleteItem.subscribe((res)=>{
      if(res){
        this.getContacts();
        this.distroyDynamicComponent();
        this.openSnackBar()
      }
    })
    this.navActionSubscriptions.push(sub1,sub2,sub3,sub4,sub5)

  }
distroyDynamicComponent(){
  this.selection.clear();
  this.dynamicComponentContainer.clear();
  this.dynamicComponentRef = null;
  this.navActionSubscriptions.map((sub)=>sub.unsubscribe());
}
onCheckboxChange(event,element: any) {
  if(event.checked == false && this.dynamicComponentRef){
    if(this.isCanceled){
      this.dynamicComponentRef.instance.showCanceledContactsMenueItems();
    }
    else{
        this.dynamicComponentRef.instance.showContactsMenueItems();

     

    }
  }
  if(this.selection.selected.length  > 0 && !this.dynamicComponentRef){
    this.createDynamicComponent(this.selection.selected);
    this.dynamicComponentRef.instance.selectedItemsCount = this.selection.selected.length;

    // this.selectionData.emit(this.selection);

  }
  else if(this.selection.selected.length  === 0 && this.dynamicComponentRef){
    this.distroyDynamicComponent()

    // this.selectionData.emit(this.selection);
  }
  if (this.dynamicComponentRef && this.selection.selected.length  > 0 ) {
    this.dynamicComponentRef.instance.selectedItems=this.selection.selected;
    this.selectedItems=this.selection.selected;

    this.dynamicComponentRef.instance.selectedItemsCount = this.selection.selected.length;
  }
}



  onSelect(event){
    this.listService.display=event.value;
    this.listService.updateDisplayNumber(event.value)
    this.pageIndex=0; 
    if(this.paginator){
      this.paginator.pageSize = event.value;
      this.paginator.pageIndex=0;
    }
  
    this.getContacts();

  }
  
  unCancelSnackBar(){
    let selectedItems = this.selectedItems.map((cont)=>cont.id)
    let message = `${selectedItems.length} ${this.translate.instant('Item(s) UnCanceled')}`;
    let action =this.translate.instant("Undo")
    let snackBarRef=this.snackBar.open(message,action,{duration:4000});
    snackBarRef.onAction().subscribe(()=>{
      this.cancelContacts();
  
    })
  }
    openSnackBar(){
      let selectedItems = this.selectedItems.map((cont)=>cont.id)
      let message = `${selectedItems.length} ${this.translate.instant('Item(s) Deleted')}`;
      let action =this.translate.instant("Undo")
      let snackBarRef=this.snackBar.open(message,action,{duration:4000});
      snackBarRef.onAction().subscribe(()=>{
        this.undoDelete();
      })
    }
    cancelContacts(){
      let email=this.authService.getUserInfo()?.email;
      let selectedItems = this.selectedItems.map((cont)=>cont.id)
      this.listService.cancelContacts(email,selectedItems).subscribe(
        (res)=>{
  
          this.getContacts("",true);
          this.selection.clear();
          this.selectedItems=[]
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
        },
        (err)=>{
  
  
  
        }
      )
    }
    undoDelete(){
      let email=this.authService.getUserInfo()?.email;
      let selectedItems = this.selectedItems.map((cont)=>cont.id)
      this.listService.unDeleteContact(email,selectedItems).subscribe(
        (res)=>{
  
          this.getContacts();
          this.selection.clear();
          this.selectedItems=[]
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
        },
        (err)=>{
  
  
  
        }
      )
  
    }
  
  contactsCount(isCancel){
    let email=this.authService.getUserInfo()?.email;
    this.loading=true;

    let sub2=this.listService.contactsCount(email,isCancel).subscribe(

      (res)=>{
        this.length=res;
        this.loading = false;
        if( this.length==0){
         this.noData=true;
 
       
       }
       else{
          this.noData=false;
 
      
        }
        },
        (err)=>{
         
         this.loading = false;
         this.length=0;
         this.noData=true;
        })
this.subscribtions.push(sub2)

  }


  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;

    const numRows =  this.numRows;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {

      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  onSortChange(event){
    let sorting = event.active=='Name' && event.direction=='asc'?'nameASC':
                  event.active=='Name' && event.direction=='desc'?'nameDEC':

                  event.active=='Create At' && event.direction=='asc'?'createdAtASC':
                  event.active=='Create At' && event.direction=='desc'?'createdAtDEC':
                  '';
    this.listService.orderedBy=sorting;
    this.selection.clear();

    this.getContacts();


  }
  onRowClick(row:any){}

  addOrUpdateContact(data?){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='75vh';
    dialogConfig.width='90vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='80%';
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'custom-mat-dialog-container';
    if(data){
      dialogConfig.data= {contacts:data,listDetails:false};

    }
    const dialogRef = this.dialog.open(AddContactComponent,dialogConfig);
    this.selection.clear();
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getContacts();
            }


    });
this.openedDialogs.push(dialogRef)
  }
  onPageChange(event){
    this.pageIndex=event.pageIndex;
    this.selection.clear();
    this.getContacts();

  }

  onSearch(event:any){
    this.selection.clear();

    this.getContacts(event.value);
  }


  exportAllAs(fileType){
    this.listService.exportAllContacts(fileType).subscribe(
      (res)=>{
        this.listService.exportFileData(res,fileType);

    },
      (err)=>{
      }

    )
  }

  changeColumns(event){
    if(this.canEdit){
  
      if(this.isCanceled){
        this.displayedColumns=['select',...event]
  
      }
      else{
        this.displayedColumns=['select',...event,'action']
      }
    }
  else{
    if(this.isCanceled){
      this.displayedColumns=[...event]
  
    }
    else{
      this.displayedColumns=['select',...event]
  
    }
  
  }
  }
showLists(element:Contacts){
  if(element.lists && element.lists?.length > 0){
    let listNames=element.lists.map((list)=>list.name)
    const placement = 'bottom'; // Set the placement to 'bottom' for bottom-to-top transition

    const drawerRef = this.drawerService.create<ContactInfoComponent, ContactInfoContent>({
      nzHeight: '40vh',
      nzWidth:'100vw',
      nzClosable: true,
      nzContent: ContactInfoComponent,
      nzPlacement: placement,
      nzWrapClassName: 'bottom-drawer',
      nzContentParams: {
        lists: listNames,
        contactName: element.name,
        contactNumber: element.mobileNumber,
        title:"LISTS"
      }
    });
    this.openedDialogs.push(drawerRef)

  }
  

}
showAdditionalParameters(element:Contacts){
  if(element.additionalContactParameter && element.additionalContactParameter?.length > 0){
    const placement = 'bottom'; // Set the placement to 'bottom' for bottom-to-top transition

    const drawerRef = this.drawerService.create<ContactInfoComponent, ContactInfoContent>({
      nzHeight: '40vh',
      nzWidth:'100vw',
      nzClosable: true,
      nzContent: ContactInfoComponent,
      nzPlacement: placement,
      nzWrapClassName: 'bottom-drawer',
      nzContentParams: {
        additionalParameters: element.additionalContactParameter,
        contactName: element.name,
        contactNumber: element.mobileNumber,
        title:"Additional Parameters"
      }
    });
    this.openedDialogs.push(drawerRef)
  }

}
openImportModal(filetype){
  const dialogConfig=new MatDialogConfig();
  dialogConfig.height='80vh';
  dialogConfig.width='45vw';
  dialogConfig.maxWidth='100%';
  dialogConfig.minWidth='100%';
  dialogConfig.minHeight='470px';
  dialogConfig.disableClose = true;
  dialogConfig.panelClass = 'custom-mat-dialog-container';
  dialogConfig.data={filetype:filetype,mobileView:true}

  const dialogRef = this.dialog.open(UploadSheetComponent,dialogConfig);
  
  this.selection.clear();
  dialogRef.afterClosed().subscribe(result => {
    if(result){
      if(result){
        if(result == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.getContacts();
        }
        else{
          this.openRequestStateModal(result);
        }
      }
    }
  });
}
openRequestStateModal(data ){
  const dialogConfig=new MatDialogConfig();
  dialogConfig.height='48vh';
  dialogConfig.width='100%';
  dialogConfig.maxWidth='330px';
  dialogConfig.minWidth='100%';
  dialogConfig.minHeight='320px'
  dialogConfig.disableClose = true;
  dialogConfig.data=data;
  dialogConfig.panelClass = 'custom-mat-dialog-container';
  const dialogRef = this.dialog.open(RequestStateComponent,dialogConfig);
  
  dialogRef.afterClosed().subscribe(result => {
    if(result){
      this.openErrorsViewrModal(data )
    }
    else{
      this.getContacts();
    }
  })

  }
  openErrorsViewrModal(result){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='430px';
    dialogConfig.width='100%';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='100%';
    dialogConfig.disableClose = true;
    dialogConfig.data=result
    dialogConfig.panelClass = 'custom-mat-dialog-container';

    const dialogRef = this.dialog.open(ErrorsStatesComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      this.getContacts();


     
    })
  }
ngOnDestroy(){
  this.openedDialogs.forEach((dialog)=>{
    if(dialog){
      dialog.close();
    }
  })
  this.selection.clear();

  this.subscribtions.map(e=>e.unsubscribe());
}

}
