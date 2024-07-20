import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { ManageContactsService } from '../../../manage-contacts.service';
import { AddContactComponent } from '../addContact/addContact.component';
import { MatTableDataSource } from '@angular/material/table';
import { ListData } from '../../../list-data';
import { MatSort, Sort } from '@angular/material/sort';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import { Contacts } from '../../../contacts';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';

interface CheckedCont{
  list:string[],
  contacts:Contacts[],
  listDetails:boolean

}
@Component({
  selector: 'app-contactLists',
  templateUrl: './contactLists.component.html',
  styleUrls: ['./contactLists.component.scss']
})
export class ContactListsComponent implements OnInit ,AfterViewInit ,OnDestroy{
  isLoading = false;
  numRows;
  dataSource:MatTableDataSource<ListData|Contacts>;
  @ViewChild(MatSort) sort=new MatSort;
  isFromListDetails:boolean;
  displayedColumns: string[] = ['select', 'name', "totalContacts"];
  listTableData:ListData[]=[];
  loading:boolean=true;
  listIds:string[]=[];
  contactsIds:string[];
  contacts:boolean=false;
  selection = new SelectionModel<any>(true, []);
  noData:boolean=false;
  searchSub: Subscription;
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  constructor(
    private toaster: ToasterServices,
    private listService:ManageContactsService,
    public dialogRef: MatDialogRef<AddContactComponent>,
    private translate: TranslateService,
    private authService:AuthService,
    @Inject(MAT_DIALOG_DATA) public data: CheckedCont,
  ) { }
  ngOnDestroy(): void {
    if(this.searchSub){
      this.searchSub.unsubscribe();
    }
  }


  ngAfterViewInit() {
  }
  ngOnInit() {
    this.contactsIds=this.data.contacts.map(res=>res.id);


    // get selected data from table
    this.selection.changed.subscribe(
      (res) => {

        if(res.source.selected.length){
          this.contacts=true;

            if(this.data.listDetails){
              this.contactsIds=res.source.selected.map((e)=>e.id);
              this.isFromListDetails=true;
            }
            else{
              this.listIds=res.source.selected.map((e)=>e.id);
              this.isFromListDetails=false
            }

        }
        else{
          if(this.data.listDetails){
            this.contactsIds=[];
            this.isFromListDetails=true;


          }
          else{
            this.listIds=[];
            this.isFromListDetails=false;

          }
          this.contacts=false;

        }
      });

    // if this component is opened from ListDetailsComponent
      if(this.data.listDetails)
      {
        this.isFromListDetails=true;

        this.displayedColumns= ['select', 'name'];
        this.getContactsData();
        this.listIds=this.data.list;
      }

      else
      {
        this.isFromListDetails=false;

        this.displayedColumns= ['select', 'name', "totalContacts"];

      this.getListData();
    }
this.setupSearchSubscription();
      }
getDataReq(searchVal){
  let sup$;
  if(this.selection){
    this.selection.clear();
  }
if(!this.isFromListDetails){
  // for lists
  let shows=100;
  let pageNum=this.listService.pageNum;
  let email=this.authService.getUserInfo()?.email;
  let orderedBy="";
  let search=searchVal?searchVal:"";
  
sup$= this.listService.getList(email,shows,pageNum,orderedBy,search)
}
else{
  let shows=50;
  let pageNum=0;
  let email=this.authService.getUserInfo()?.email;
  let orderedBy="";
  let search=searchVal?searchVal:"";

  sup$=  this.listService.getContacts(email,false,shows,pageNum,orderedBy,search,"")
}
return sup$
}
handleGetDataRes(res){
if(!this.isFromListDetails){
  this.loading=false;
  this.numRows=res.length;
  if(res.length == 0){
    this.noData=true;
  }
  else{
    this.noData=false;

  }
this.dataSource=new MatTableDataSource<ListData>(res)
}
else{
  this.loading=false;
  const filterdContacts = res.filter((obj) => !this.data.contacts.map(res=>res.id).includes(obj.id));
  this.contactsIds=filterdContacts.map((e)=>e.id);
  if(filterdContacts.length == 0){
    this.noData=true;
  }
  else{
    this.noData=false;

  }

  if(this.data.listDetails){
    this.numRows=this.contactsIds.length;

  }
  else{
    
    this.numRows=res.length;

  }
this.dataSource=new MatTableDataSource<Contacts>(filterdContacts)
}
}
handleError(){
  this.loading=false;
  this.noData=true;

  this.onClose();
}
getListData(searchVal?){
  let search=searchVal?searchVal:"";

    this.getDataReq(search).subscribe(
      (res)=>{
      this.handleGetDataRes(res)
      },
      (err)=>{
     this.handleError()
      })
}
getContactsData(searchVal?){

  let search=searchVal?searchVal:"";

   this.getDataReq(search).subscribe(
    res=>this.handleGetDataRes(res),
    err=>this.handleError()
   )
}

setupSearchSubscription(): void {
  this.searchSub = this.searchControl.valueChanges.pipe(
    debounceTime(700), // Wait for 1s pause in events
    distinctUntilChanged(), // Only emit if value is different from previous value
    switchMap(searchVal => this.getDataReq(searchVal))
  ).subscribe(
    res => this.handleGetDataRes(res),
    err => this.handleError()
  );

}

onSearch(search){
  

    if(this.isFromListDetails){
      this.getContactsData(search.value)
    }
    else{
      this.getListData(search.value)
    }
  
}
  onClose(data?): void {

    this.dialogRef.close(data);

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
  onSortChange(e) {
    this.dataSource.sort=this.sort

  }

  submitAdd(){
    this.isLoading = true
    this.listService.addOrMoveContacts(this.contactsIds,this.listIds,this.authService.getUserInfo()?.email).subscribe(
      (res)=>{
        this.isLoading = false
        if(res.numberOfErrors === 0){
          this.onClose('noErrors');
        }
        else{
          let errorObject =res;
          this.onClose(errorObject);
        }
      
                  },
      (err)=>{
        this.isLoading = false
        this.onClose(false);
      }
    )
  }
}
