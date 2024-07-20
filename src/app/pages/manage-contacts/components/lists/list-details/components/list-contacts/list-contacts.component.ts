import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { Contacts } from 'src/app/pages/manage-contacts/contacts';
import { ListData } from 'src/app/pages/manage-contacts/list-data';
import { ManageContactsService } from 'src/app/pages/manage-contacts/manage-contacts.service';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { AddContactComponent } from '../../../../contacts/addContact/addContact.component';
import { ContactsComponent } from '../../../../contacts/contacts.component';
import { TotalContacts } from '../../totalContacts';
import { LISTDETAILSHEADERS } from 'src/app/pages/manage-contacts/constants/constants';
import { AuthService } from 'src/app/shared/services/auth.service';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { AdditonalParamsComponent } from '../../../../contacts/additonalParams/additonalParams.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ListDetailsMobileViewComponent } from '../../mobile-view/listDetails-mobileView/listDetails-mobileView.component';

@Component({
selector: 'app-list-contacts',
templateUrl: './list-contacts.component.html',
styleUrls: ['./list-contacts.component.scss']
})
export class ListContactsComponent implements OnInit ,OnChanges ,AfterViewInit ,OnDestroy{
listId:string;
length:number;
active:boolean=false;
ListContacts:Contacts[];
numRows;
cellClick:boolean=false;
loading:boolean=true;
subscribtions:Subscription[]=[];
WrapperScrollLeft =0;
WrapperOffsetWidth =250;
@Output() isChecked = new EventEmitter<ListData[]>;
@Input() isCanceled:boolean;
@Input() canEdit:boolean;
@Input() count:TotalContacts={totalContacts:0,totalCancelContacts:0};
@Input() listData:any
@ViewChild(MatPaginator)  paginator!: MatPaginator;
@ViewChild(MatSort) sort: MatSort;
@ViewChild("search") search!:ElementRef;
@Output() updatedCount= new EventEmitter<number>;
listTableData:ListData[]=[]
deletedContacts:string[]=[];
columns :FormControl;
displayed: string[] = LISTDETAILSHEADERS;
displayedColumns: string[] = ['select','Name','Mobile',"Create At",'Additional Parameters',"action"];
dataSource:MatTableDataSource<Contacts>;
// dataSource = new MatTableDataSource<any>(this.listTableData);
selection = new SelectionModel<any>(true, []);
notFound:boolean;
noData:boolean;
@ViewChild(ContactsComponent) contacts:ContactsComponent;
  display: number;
  pageNum: number;

  isSmallScreen: boolean = false;
  destroy$: Subject<void> = new Subject<void>();
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  searchSub: any;
  @ViewChild(ListDetailsMobileViewComponent) mobileView :ListDetailsMobileViewComponent
  isDataCalledInMobile: any;
  @Input() selectedTimeZone :number=0;

constructor(private activeRoute:ActivatedRoute,public dialog: MatDialog,
  private toaster: ToasterServices,
  private listService:ManageContactsService,
  private snackBar: MatSnackBar, 
  private authService:AuthService,
  private translationService:TranslationService,
  private breakpointObserver: BreakpointObserver

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
  }
  ngAfterViewInit() {
    if(this.paginator){
      this.paginator.pageSize=this.display
    }
  }
ngOnInit() {

  this.columns=new FormControl(this.displayedColumns)
  if(!this.canEdit){
    this.displayedColumns= ['select','Name', 'Mobile','Additional Parameters',"Create At"];

  }
this.selection.changed.subscribe(
  (res) => {

    if(res.source.selected.length){

      this.isChecked.emit(res.source.selected)
    }
    else{
      this.isChecked.emit()
    }
  });
  this.onChangeSecreanSizes()
}


onChangeSecreanSizes(){
  this.breakpointObserver.observe(['(max-width: 768px)'])
  .pipe(takeUntil(this.destroy$))
  .subscribe(result => {
    this.isSmallScreen = result.matches;
    if(!this.isSmallScreen){
      this.selection.clear();
      if(this.dataSource){
        if(!this.listService.arraysContainSameObjects(this.dataSource.data,this.mobileView.listTableData)){
          if(this.mobileView.searchControl.value){
            this.getContacts();
          }
          else{
            this.getDataFromChild(this.mobileView?.listTableData,'',this.mobileView.length)

          }

        }
      }
       else{

        if(!this.isDataCalledInMobile){
          this.getContacts();

        }
        else{
          if(this.mobileView.searchControl.value){
            this.getContacts();

          }
          else{
            this.getDataFromChild(this.mobileView?.listTableData,'',this.mobileView.length)

          }


        }
       } 
    

    }
    else{
        if(this.dataSource){

          setTimeout(() => {
            if(this.searchControl.value){
              this.mobileView?.getContacts('');

            }
            else{
              this.mobileView?.getDataFromParent(this.dataSource.data,'',this.length)  

            }


        }, 0);
        }
        else{
          setTimeout(() => {

            this.mobileView?.getContacts('');
            this.isDataCalledInMobile=true;

          }, 0);
        }
      
      
    }
  });
}
getDataFromChild(data,search,length){
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
  const orderedBy = this.listService.orderedBy;
  const search = searchVal || '';
  const pageNumber = searchVal ? 0 : this.pageNum;

  if (searchVal && this.paginator) {
    this.paginator.pageIndex = 0;
  }
  if(this.selection){
    this.selection.clear();
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

    openEditModal(data?){
      const dialogConfig=new MatDialogConfig();
      dialogConfig.disableClose = true;
      dialogConfig.height='88vh';
      dialogConfig.width='45vw';
      dialogConfig.maxWidth='100%';
      dialogConfig.minWidth='465px';
      dialogConfig.data= {contacts:data,listDetails:true,list:this.listData};
      const dialogRef = this.dialog.open(AddContactComponent,dialogConfig);
      this.selection.clear();
      dialogRef.afterClosed().subscribe(result => {
        if(result){
          this.getContacts();
          this.getListData();
              }

      });

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
    updateTotalContacts(event){
      this.updatedCount.emit(event)

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
    showAdditionalParams(contacts,length){
      if(!this.cellClick && length > 0){
        const currentLang=this.translationService.getCurrentLanguage()
        const dialogConfig=new MatDialogConfig();
        dialogConfig.height='100vh';
        dialogConfig.width='25vw';
        dialogConfig.maxWidth='100%';
        // dialogConfig.minWidth='200px';
        dialogConfig.disableClose = true;
        dialogConfig.position =  currentLang=='en'?{ right: '2px'} :{ left: '2px'} ;
        dialogConfig.direction = currentLang=='en'? "ltr" :"rtl";
        dialogConfig.data=contacts;
        const dialogRef = this.dialog.open(AdditonalParamsComponent,dialogConfig);
    
        dialogRef.afterClosed().subscribe(result => {
          if(result){
          }
    
        });
      }
    }
    ngOnDestroy(){
      this.destroy$.next();
      this.destroy$.complete();
      this.selection.clear();
    
      this.subscribtions.map(e=>e.unsubscribe());
    }
}
