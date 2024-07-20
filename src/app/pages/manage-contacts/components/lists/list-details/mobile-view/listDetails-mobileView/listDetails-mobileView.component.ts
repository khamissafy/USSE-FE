import { SelectionModel } from '@angular/cdk/collections';
import { Component, ComponentFactoryResolver, ComponentRef, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { LISTDETAILSHEADERS } from 'src/app/pages/manage-contacts/constants/constants';
import { Contacts } from 'src/app/pages/manage-contacts/contacts';
import { ListData } from 'src/app/pages/manage-contacts/list-data';
import { ManageContactsService } from 'src/app/pages/manage-contacts/manage-contacts.service';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { AddContactComponent } from '../../../../contacts/addContact/addContact.component';
import { AdditonalParamsComponent } from '../../../../contacts/additonalParams/additonalParams.component';
import { ContactsComponent } from '../../../../contacts/contacts.component';
import { TotalContacts } from '../../totalContacts';
import { NavActionsComponent } from 'src/app/shared/components/nav-actions/nav-actions.component';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { TranslateService } from '@ngx-translate/core';
import { ContactListsComponent } from '../../../../contacts/contactLists/contactLists.component';
import { RequestStateComponent } from 'src/app/shared/components/bulkOperationModals/requestState/requestState.component';
import { ErrorsStatesComponent } from 'src/app/shared/components/bulkOperationModals/errorsStates/errorsStates.component';
import { UploadSheetComponent } from '../../../../importFiles/uploadSheet/uploadSheet.component';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { ContactInfoComponent } from '../../../../mobile view/contact-info/contact-info.component';
import { ContactInfoContent } from '../../../../mobile view/contacts-mobileView/contacts-mobileView.component';

@Component({
  selector: 'app-listDetails-mobileView',
  templateUrl: './listDetails-mobileView.component.html',
  styleUrls: ['./listDetails-mobileView.component.scss']
})
export class ListDetailsMobileViewComponent implements OnInit ,OnChanges ,OnDestroy {
  listId:string;
  length:number;
  active:boolean=false;
  ListContacts:Contacts[];
  numRows;
  notFound:boolean;
  noData:boolean;
  cellClick:boolean=false;
  loading:boolean=false;
  subscribtions:Subscription[]=[];
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  @Input() isCanceled:boolean;
  @Input() count:TotalContacts={totalContacts:0,totalCancelContacts:0};
  @Input() listData:any
  @ViewChild(MatPaginator)  paginator!: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild("search") search!:ElementRef;
  @Output() updatedCount= new EventEmitter<number>;
  listTableData:any=[]
  deletedContacts:string[]=[];
  columns :FormControl;
  displayed: string[] = LISTDETAILSHEADERS.slice(1);
  displayedColumns: string[] = ['select','Name','Mobile',"Create At",'Additional Parameters',"action"];
  dataSource:MatTableDataSource<Contacts>;
  selection = new SelectionModel<any>(true, []);
  
    display: number;
    pageNum: number;
   
  dynamicComponentRef: ComponentRef<NavActionsComponent>;
  showsOptions:SelectOption[]=[
    {title:'10',value:10},
    {title:'50',value:50},
    {title:'100',value:100}


  ];
  showsSelectedOptions:any = new FormControl([]);
  @Input() canEdit:boolean;
  form = new FormGroup({
    showsSelectedOptions:this.showsSelectedOptions,
   
  });
  navActionSubscriptions:Subscription[]=[];
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef }) dynamicComponentContainer: ViewContainerRef;
  openedDialogs:any=[];
  pageIndex:number=0;
  
  selectedSortingName:string='name';
  selectedSortingType:string='ASC'
  orderedBy: string='';
  topSortingOptions:any=[{opitonName:'name' ,lable:`${this.translate.instant('nameLabel')}`, isSelected:true} 
                          , {opitonName:'createdAt' , lable:`${this.translate.instant('CREATE_AT')}`,isSelected:false}]
  
bottomSortingOptions:any=[{opitonName:'ASC' ,lable:`${this.translate.instant('ASCENDING')}`, isSelected:true} ,
                            {opitonName:'DEC' , lable:`${this.translate.instant('DESCENDING')}`,isSelected:false}]
  selectedItems: any[];
  isChecked: boolean;
  searchSub: any;
  @Input() selectedTimeZone :number=0;

  constructor(private activeRoute:ActivatedRoute,public dialog: MatDialog,
    private toaster: ToasterServices,
    private listService:ManageContactsService,
    private snackBar: MatSnackBar, 
    private authService:AuthService,
    private translationService:TranslationService,
    private translate: TranslateService,
    private drawerService: NzDrawerService,
    private componentFactoryResolver: ComponentFactoryResolver
    ) {
      this.display=listService.getUpdatedDisplayNumber()
      this.pageNum=this.listService.pageNum;
    activeRoute.paramMap.subscribe((data)=>
    {
    this.listId=data.get('id')
    })
  }
    ngOnChanges() {
        this.length=this.count?.totalContacts
      if(this.length == 0){
        this.noData=true
      }
      else{
        this.noData=false;
      }
      
    }
  
  ngOnInit() {
    this.form.patchValue({
      showsSelectedOptions: {
      title:String(this.listService.getUpdatedDisplayNumber()),
      value:this.listService.getUpdatedDisplayNumber(),
      }
      })
    
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
      if(!this.canEdit){
        this.displayedColumns= ['select','Name', 'Mobile','Additional Parameters',"Create At"];

      }
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
selectAllRows(){
  this.selection.select(...this.listTableData);
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

  navActionsComponentInstance.componentName =this.isCanceled? 'canceledContacts' : 'listDetails';
  navActionsComponentInstance.listId=this.listId
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
      this.getListData();
      this.distroyDynamicComponent();
      
    }
  });
  let sub4 = navActionsComponentInstance.updateCanceledData.subscribe((res)=>{
    if(res){
      this.pageIndex=0;
      this.getContacts();
      this.getListData();
      this.distroyDynamicComponent();
    
    }
  })

  this.navActionSubscriptions.push(sub1,sub2,sub3,sub4)

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
    this.dynamicComponentRef.instance.showListDetailsMenueItems();

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

setupSearchSubscription(): void {
  this.searchSub = this.searchControl.valueChanges.pipe(
    debounceTime(700), // Wait for 1s pause in events
    distinctUntilChanged(), // Only emit if value is different from previous value
    switchMap(searchVal => this.getContactsReq(searchVal))
  ).subscribe(
    res => this.handleGetContactsResponse(res, this.searchControl.value),
    err => this.handleError()
  );
  this.subscribtions.push(this.searchSub);
}

getContactsReq(searchVal: string) {
  const shows = this.listService.display;
  const email = this.authService.getUserInfo()?.email;
  const orderedBy = this.orderedBy;
  const search = searchVal || '';
  const pageNumber = searchVal ? 0 : this.pageNum;

  if (searchVal && this.paginator) {
    this.paginator.pageIndex = 0;
  }
  if(this.selection){
    this.selection.clear();
    this.isChecked=false   
    if(this.dynamicComponentRef){
      this.distroyDynamicComponent()
    }
   


  }
  return this.listService.getContacts(email, this.isCanceled, shows, pageNumber, orderedBy, search, this.listId);
}

getContacts(searchVal?: string): void {
 if(this.searchSub){
    this.searchSub.unsubscribe();
    this.searchSub=null;

    this.searchForm.patchValue({
      searchControl:''
    })
  }
  this.loading = true;
  const sub1 = this.getContactsReq(searchVal).subscribe(
    (res) => {
      this.handleGetContactsResponse(res, searchVal);
      this.setupSearchSubscription();

    },
       err => this.handleError()
  );
  this.subscribtions.push(sub1);
}
getDataFromParent(data,search,length){
  if(this.searchSub){
    this.searchSub.unsubscribe();
    this.searchSub=null;

    this.searchForm.patchValue({
      searchControl:''
    })
  }
  this.handleGetContactsResponse(data,search,length)
  this.setupSearchSubscription()

}
handleGetContactsResponse(res: Contacts[], searchVal: string,count?): void {
  if(count){
    this.length=count
  }
  else{
    if (this.isCanceled) {
      this.length = this.count?.totalCancelContacts;
    } else {
      this.length = this.count?.totalContacts;
    }
  
  }


  this.noData = this.length === 0;

  this.numRows = res.length;
  this.ListContacts = res;
  this.listTableData = res;
  this.dataSource = new MatTableDataSource<Contacts>(res);
  this.loading = false;

  if (searchVal) {
    this.length = res.length;
    this.notFound = this.length === 0;
  } else {
    if (this.paginator) {
      this.paginator.pageIndex = this.pageNum;
    }
    this.notFound = false;
  }
}

handleError(): void {
  this.loading = false;
  this.length = 0;
  this.noData = true;
}


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

updateContact(data?){
    const dialogConfig=new MatDialogConfig();
  dialogConfig.height='75vh';
  dialogConfig.width='90vw';
  dialogConfig.maxWidth='100%';
  dialogConfig.minWidth='80%';
  dialogConfig.disableClose = true;
  dialogConfig.panelClass = 'custom-mat-dialog-container';
  if(data){
  dialogConfig.data= {contacts:data,listDetails:true,list:this.listData};
  }
  const dialogRef = this.dialog.open(AddContactComponent,dialogConfig);
  this.selection.clear();
  dialogRef.afterClosed().subscribe(result => {
    if(result){
      this.getContacts();
      this.getListData();
          }

  });
  this.openedDialogs.push(dialogRef)

}
addContact(){
  const dialogConfig=new MatDialogConfig();
  dialogConfig.height='75vh';
  dialogConfig.width='90vw';
  dialogConfig.maxWidth='100%';
  dialogConfig.minWidth='80%'; 
  dialogConfig.maxHeight='85vh';
  dialogConfig.minHeight='470px'
  dialogConfig.disableClose = true;
  dialogConfig.panelClass = 'custom-mat-dialog-container';

  dialogConfig.data = {list:[this.listId],contacts:this.ListContacts, listDetails:true};
  const dialogRef = this.dialog.open(ContactListsComponent,dialogConfig);

  dialogRef.afterClosed().subscribe(result => {
    if(result){
      if(result == 'noErrors'){
        this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
        this.getListData();
        this.getContacts();        
      }
      else{
        this.openRequestStateModal(result );
      }    
    }
    this.selection.clear();

  });
  this.openedDialogs.push(dialogRef)

}
openRequestStateModal(data,){
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
      this.openErrorsViewrModal(data)
    }
    else{
        this.getListData();
        this.getContacts(); 
      

    }
  })
  this.openedDialogs.push(dialogRef)

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
    this.getListData();
    this.getContacts(); 

  })
  this.openedDialogs.push(dialogRef)

}

onPageChange(event){
  this.listService.display=event.pageSize;
  this.pageNum=event.pageIndex;
  this.listService.updateDisplayNumber(event.pageSize)
  this.selection.clear();

  this.getContacts();

}
onSearch(event:any){
  this.selection.clear();

  this.getContacts(event.value);
}
toggleActive(data?){
  if(data){
  }
  this.active=!this.active;
}
changeColumns(event){

  if(this.canEdit){
    this.displayedColumns=['select',...event,'action']
  }

else{
  this.displayedColumns=['select',...event]

}

}
getListData(){

  this.listService.getListById(this.listId).subscribe(
    (res)=>{
    this.count={totalContacts:res.totalContacts,totalCancelContacts:res.totalCancelContacts};
    this.updatedCount.emit(res.totalContacts)
    if(this.isCanceled){
      this.length=this.count?.totalCancelContacts;
    }
    else{
      this.length=this.count?.totalContacts;

    }
    },

    (err)=>{
    })


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
  dialogConfig.data={filetype:filetype,listId:this.listId,mobileView:true};
  
    const dialogRef = this.dialog.open(UploadSheetComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result == 'noErrors'){
          this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));
          this.getListData();
          this.getContacts();        
        }
        else{
          this.openRequestStateModal(result );
        }    
      }
      this.selection.clear();
  
    });
    this.openedDialogs.push(dialogRef)

  }
  
exportAllAs(fileType){
  this.listService.exportContactsInList(this.listId,fileType).subscribe(
    (res)=>{this.listService.exportFileData(res,fileType)},
    (err)=>{}
  )
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
  