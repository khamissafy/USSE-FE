import { SelectionModel } from '@angular/cdk/collections';
import { Component, ComponentFactoryResolver, ComponentRef, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import {FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { LISTHEADERSMobile } from '../../../constants/constants';
import { ListData } from '../../../list-data';
import { ManageContactsService } from '../../../manage-contacts.service';
import { AddListComponent } from '../../lists/addList/addList.component';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { NavActionsComponent } from 'src/app/shared/components/nav-actions/nav-actions.component';

@Component({
  selector: 'app-lists-mobileView',
  templateUrl: './lists-mobileView.component.html',
  styleUrls: ['./lists-mobileView.component.scss']
})
export class ListsMobileViewComponent implements OnInit {
  tableData:any=[]
  length:number=0;
  active:boolean=false;
  numRows;
  loading:boolean=true;
  subscribtions:Subscription[]=[];
  selectedItems:any=[]
  @ViewChild(MatPaginator)  paginator!: MatPaginator;
  @ViewChild("search") search!:ElementRef;
  noData: boolean=false;
  notFound: boolean=false;
  columns :FormControl;
  @ViewChild(MatSort) sort: MatSort;
  displayed: any[] = LISTHEADERSMobile;
  listTableData:ListData[]=[]
  displayedColumns: string[] = ['select', 'Name', 'Create At', 'Total Contacts',"edit"];
  dataSource:MatTableDataSource<ListData>;
  deletedLists:string[]=[];
  // dataSource = new MatTableDataSource<any>(this.listTableData);
  selection = new SelectionModel<any>(true, []);
  @Input()canEdit:boolean;
  cellClick:boolean;
  display: number;
  pageNum:number;
  openedDialogs:any=[];
  dynamicComponentRef: ComponentRef<NavActionsComponent>;
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef }) dynamicComponentContainer: ViewContainerRef;
  navActionSubscriptions:Subscription[]=[];
  orderedBy: string='';
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  searchSub: any;
  @Input() selectedTimeZone :number=0;

  constructor(public dialog: MatDialog,
    private toaster: ToasterServices,
    private listService:ManageContactsService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private authService:AuthService,
    private router:Router,
    private componentFactoryResolver: ComponentFactoryResolver) {
      this.display=this.listService.getUpdatedDisplayNumber();
      this.pageNum=this.listService.pageNum;
  }
  isChecked:boolean=false;
  showsOptions:SelectOption[]=[
    {title:'10',value:10},
    {title:'50',value:50},
    {title:'100',value:100}


  ];
  showsSelectedOptions:any = new FormControl([]);

  form = new FormGroup({
    showsSelectedOptions:this.showsSelectedOptions,
   
  });

  selectedSortingName:string='name';
  selectedSortingType:string='ASC'

  topSortingOptions:any=[{opitonName:'name' ,lable:`${this.translate.instant('nameLabel')}`, isSelected:true} 
                          , {opitonName:'createdAt' , lable:`${this.translate.instant('CREATE_AT')}`,isSelected:false}]
  
bottomSortingOptions:any=[{opitonName:'ASC' ,lable:`${this.translate.instant('ASCENDING')}`, isSelected:true} ,
                            {opitonName:'DEC' , lable:`${this.translate.instant('DESCENDING')}`,isSelected:false}]

  ngOnInit() {
    this.form.patchValue({
      showsSelectedOptions: {
      title:String(this.listService.getUpdatedDisplayNumber()),
      value:this.listService.getUpdatedDisplayNumber(),
      

      }

      })
    // this.getListData();
    if(!this.canEdit){
      this.displayedColumns = [ 'Name', 'Create At', 'Total Contacts'];

    }

    this.columns=new FormControl(this.displayedColumns)
    this.selection.changed.subscribe(
      (res) => {
        if(res.source.selected.length){
          this.isChecked=true
        }
        else{
          this.isChecked=false;
        }
      });

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
this.getListData();
}

  ngAfterViewInit() {
  }
getListsCount(){
  this.loading=true;

  let email=this.authService.getUserInfo()?.email;

 let sub1= this.listService.ListsCount(email).subscribe(
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
    });
 
  this.subscribtions.push(sub1)
}
setupSearchSubscription(): void {
  this.searchSub = this.searchControl.valueChanges.pipe(
    debounceTime(700), // Wait for 1s pause in events
    distinctUntilChanged(), // Only emit if value is different from previous value
    switchMap(searchVal => this.getListsReq(searchVal))
  ).subscribe(
    res => this.handleGetListsResponse(res, this.searchControl.value),
    err => this.handleError()
  );
  this.subscribtions.push(this.searchSub);
}
getListsReq(searchVal: string) {
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
  return this.listService.getList(email, shows, pageNumber, orderedBy, search);
}

getListData(searchVal?: string): void {
  if(this.searchSub){
    this.searchSub.unsubscribe();
    this.searchSub=null;

    this.searchForm.patchValue({
      searchControl:''
    })
  }
  this.loading = true;
  let search=searchVal ? searchVal : "";

  const sub2 = this.getListsReq(search).subscribe(
    (res) => {
      this.handleGetListsResponse(res, search);
      this.setupSearchSubscription();


    },
    err => this.handleError()
  );
  this.subscribtions.push(sub2);
}
getDataFromParent(data,search,length){
  if(this.searchSub){
    this.searchSub.unsubscribe();
    this.searchSub=null;

    this.searchForm.patchValue({
      searchControl:''
    })
  }
  this.handleGetListsResponse(data,search,length)
  this.setupSearchSubscription()

}
handleGetListsResponse(res: ListData[], searchVal: string,count?): void {
  this.numRows = res.length;
  this.dataSource = new MatTableDataSource<ListData>(res);
  this.tableData = res;
  this.tableData.forEach(element => {
    element.defaultExpanded = true; // Set to true or false based on your logic
  });

  if (searchVal) {
    this.length = res.length;
    this.loading = false;
    this.notFound = this.length === 0;
  } else {
    if (this.paginator) {
      this.paginator.pageIndex = this.pageNum;
    }
    this.notFound = false;
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
      this.getListsCount();

    }
  }
}

handleError(): void {
  this.loading = false;
  this.length = 0;
}

createDynamicComponent(selectedLists) {
  const componentFactory = this.componentFactoryResolver.resolveComponentFactory(NavActionsComponent);
  this.dynamicComponentContainer.clear();

  const componentRef = this.dynamicComponentContainer.createComponent(componentFactory);
  const navActionsComponentInstance: NavActionsComponent = componentRef.instance;
  navActionsComponentInstance.selectedItems = selectedLists;
  this.selectedItems=selectedLists;
  navActionsComponentInstance.componentName ='lists';

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
      this.distroyDynamicComponent();
      this.pageNum=0;

      this.getListData();
    }
  });
  let sub4 = navActionsComponentInstance.unDoDeleteItem.subscribe((res)=>{
    if(res){
      this.getListData();
      this.distroyDynamicComponent();
      this.openSnackBar()
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
  this.dynamicComponentRef.instance.showListsMenueItems();
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
selectAllRows(){
  this.selection.select(...this.tableData);
  if (this.dynamicComponentRef && this.selection.selected.length  > 0 ) {
    this.dynamicComponentRef.instance.selectedItems=this.selection.selected;
    this.selectedItems=this.selection.selected;
    this.dynamicComponentRef.instance.selectedItemsCount = this.selection.selected.length;
  }
}
  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;

    const numRows =  this.numRows;
    return numSelected === numRows;
  }
  onSelect(event){
    this.listService.display=event.value;
    this.listService.updateDisplayNumber(event.value)
    if(this.paginator){
      this.paginator.pageSize = event.value;
      this.paginator.pageIndex=0;
    }
   
    this.pageNum=0; 
    
    this.getListData();

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
  undoDelete(){
    let email=this.authService.getUserInfo()?.email;
    let selectedItems = this.selectedItems.map((cont)=>cont.id)
    this.listService.unDeleteList(email,selectedItems).subscribe(
      (res)=>{
        this.getListData();
        this.selectedItems=[]
        this.selection.clear();
        this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));


      },
      (err)=>{

      }
    )

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
   applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  onSortChange(event){
    let sorting = event.active=='Name' && event.direction=='asc'?'nameASC':
                  event.active=='Name' && event.direction=='desc'?'nameDEC':

                  event.active=='Create At' && event.direction=='asc'?'createdAtASC':
                  event.active=='Create At' && event.direction=='desc'?'createdAtDEC':
                  '';
    this.listService.orderedBy=sorting;
    this.selection.clear();
    this.getListData();

  }
  onRowClick(row:any){}

  openAddOrUpdateList(data?){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='65vh';
    dialogConfig.width='90vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='80%';
    dialogConfig.maxHeight='435px'
    dialogConfig.disableClose = true;
      if(data){
        dialogConfig.data= data;

      }
    const dialogRef = this.dialog.open(AddListComponent,dialogConfig);
    this.selection.clear();
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getListData()
      }
    });
    this.openedDialogs.push(dialogRef)

  }
  onPageChange(event){

    this.pageNum=event.pageIndex;
    this.selection.clear();

    this.listService.updateDisplayNumber(event.pageSize)

    this.getListData();
  }

  toggleActive(data?){
    if(data){
    }
    this.active=!this.active;
  }
  selectedRow(event){
  }

  changeColumns(event){
    if(this.canEdit){
      this.displayedColumns=['select',...event,'edit']
    }
    else{
      this.displayedColumns=[...event]
    }



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

  navigateTo(id:string){
  
    if(!this.cellClick){
    this.router.navigateByUrl(`list/${id}`)
    }
  }

}
