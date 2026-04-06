import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { resetFakeAsyncZone } from '@angular/core/testing';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { TranslateService } from '@ngx-translate/core';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input-gg';
import { Contacts } from 'src/app/pages/manage-contacts/contacts';
import { ListData } from 'src/app/pages/manage-contacts/list-data';
import { ManageContactsService } from 'src/app/pages/manage-contacts/manage-contacts.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { ContactsWarningComponent } from '../../contactsWarning/contactsWarning.component';
import { CountryService } from 'src/app/shared/services/country.service';
import { SelectComponent } from 'src/app/shared/components/select/component/select.component';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
interface ListContacts {
  list: any,
  contacts: Contacts[],
};
@Component({
  selector: 'app-select-contacts',
  templateUrl: './select-contacts.component.html',
  styleUrls: ['./select-contacts.component.scss']
})
export class SelectContactsComponent implements OnInit ,OnDestroy{

allLists:ListContacts[]=[];
allSelectedLists:ListContacts[]=[];
warningShown:boolean=false;
allContactsNumbers:string[]=[];
hocsNums:string[]=[];
shouldCloseAccordion:boolean=true;

sortBy;
@Output() allContactsFromChild = new EventEmitter<any>;

  selectedListsNum:number=0;
  LoadingText:string=this.translate.instant('Loading')
  contacts: Contacts[] = [];
  addedContacts: Contacts[] = [];
  allContactsData:Contacts[] = [];
  selectAllStatus:number=0;
  selectedContacts:number=0;
  allContacts:SelectOption[];
  contactsData = new FormControl([]);

  // // ngx-intl-tel
  separateDialCode = true;
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;

  addHocs:string[]=[];
  mobile: any = new FormControl('',[Validators.required]);

  searchForm=new FormGroup({
    contactsData:this.contactsData

  })

  form = new FormGroup({
    mobile: this.mobile,

  });
  @ViewChild(SelectComponent) usSelectComponent: SelectComponent;

  selectedCountryISO: any;
  searchSub: Subscription=null;
  constructor(private listService: ManageContactsService,
    private toaster:ToasterServices, 
    private translate:TranslateService,
    private dialog: MatDialog,
    private countryService:CountryService
  ) { }
  ngOnDestroy(): void {
if(this.searchSub){
  this.searchSub.unsubscribe()
}
  }

  ngOnInit() {
    this.setCountryBasedOnIP();
    this.getNonListContactsAndLists();
    this.getAllContacts();
  }
  ngAfterViewInit() {
    this.setupSearchSubscription();
  }
  setupSearchSubscription(): void {
  this.searchSub=this.usSelectComponent.onSearch
    .pipe(
      debounceTime(700),
      distinctUntilChanged(),
      switchMap(searchVal=>this.getAllContactsReq(searchVal))
    )
    .subscribe(res => {
    this.getAllContactsRes(res,true)
    });     
  }
  setCountryBasedOnIP(): void {
    this.countryService.selectedCodeISo.subscribe(
      (countryName)=>{
        this.selectedCountryISO=CountryISO[countryName]
      }
    )
  }
  getNonListContactsAndLists() {
    this.getNonListContacts().subscribe(
      (nonListContacts) => {
        if (nonListContacts.length > 0) {
          const defaultList = {
            id: null,
            name: this.translate.instant("contacts have no lists"),
            isExpanded: true,
            isChecked: "",
            totalContacts:nonListContacts.length,
            shoudBeClosed:false

          };

          this.allLists.push({
            list: defaultList,
            contacts: nonListContacts
          });
        }
  
        // Proceed to get the lists
        this.getLists();
      },
      (err) => {
        this.getLists();
        // Handle errors for getting non-list contacts
      }
    );
  }
  getNonListContacts() {
    return this.listService.getNonListContacts(false, 100, 0, "", "");
  }
  

  // get lists that contains contacts

  getLists(orderBy?:string) {
    let sorting=orderBy?orderBy:"";
    this.listService.getList(500, 0,sorting,"").subscribe(
      (res) => {

        let filteredLlist = res.filter((e) => e.totalContacts != 0);
        this.allLists=[]
        filteredLlist.map((list)=>{
          list.isExpanded=true;
          list.shoudBeClosed=false;

          this.allLists.push({
            list:list,
            contacts:[]

          })
        })
        this.selectAllStatus=0;
        this.selectedListsNum=0;
            },
      (err) => {

      }
    )
  }
  async fetchListContacts(list,isCheck): Promise<Contacts[]> {
    try {
      const res = await this.listService.getContacts(false, 50, 0, "", "", list.id).toPromise();
      const contacts = res as Contacts[];
      contacts.map((contact) => {

        if(isCheck){
          this.addContactNumber(contact);
          


        }
        
        contact.isChecked = isCheck?"checked":"";
                                  });
      return contacts;
    } catch (error) {
      // Handle errors if needed
      throw error;
    }
  }
setSelections(listContacts:ListContacts){
     listContacts.contacts.map((con)=>{
          if(this.addedContacts.find((cont)=>cont.id==con.id)){
            con.isChecked="checked";
            listContacts.list.contactsNum++;
          }
          else{
            con.isChecked="";
          }
        })

        if(listContacts.list.contactsNum==listContacts.contacts.length){
          // listContacts.list.isChecked="checked";
          this.onSelectList("checked",listContacts)
          let found=this.allSelectedLists.find((listContact)=>listContact.list.id==listContacts.list.id);
          if(!found)
            {

              this.allSelectedLists.push(listContacts)
            }
        }
        else{
          listContacts.list.isChecked=""
        }
        if(this.allSelectedLists.length==this.allLists.length){
          this.selectAllStatus=2
        }
        else if(this.allSelectedLists.length==0){
          this.selectAllStatus=0
        }
        else{
          this.selectAllStatus=1
        }
}
   getListContacts(listContacts:ListContacts,isCheck){
    // this.resetSelectedLists()
    if(listContacts.contacts.length==0 ){
      this.fetchListContacts(listContacts.list,isCheck).then((contacts) => {

        listContacts.contacts=contacts;
        listContacts.list.contactsNum=0;
        this.setSelections(listContacts)

      }).catch((error) => {
        // Handle errors if needed
      });
    }
    this.resetSelectedLists()

}
toggle(){
  this.shouldCloseAccordion=!this.shouldCloseAccordion
}

onAccordionOpened(listContacts:ListContacts) {
 
  if(listContacts.contacts.length==0 && listContacts.list.isExpanded){

    this.getListContacts(listContacts,false);
    listContacts.list.shoudBeClosed=true;

  }
  else if(listContacts.contacts.length!=0 && listContacts.list.isExpanded){
    listContacts.list.shoudBeClosed=true;

    listContacts.contacts.map((contact)=>{
      if(this.addedContacts.find((cont)=>cont.id==contact.id)){
        contact.isChecked="checked";
        listContacts.list.contactsNum++;
      }
      else{
        contact.isChecked="";
      }
    })
  }
 
  else{
    this.getListContacts(listContacts,true)
  }


}

checkIfListFound(list){
  let foundList=this.allSelectedLists.find((listContact)=>listContact.list.id==list.id);
  return foundList

}
resetSelectedLists(){

  this.allLists.map((listContact)=>{
    listContact.list.isChecked="";
    listContact.contacts.map((cont)=>cont.isChecked="")
    if(listContact.contacts .length > 0){
      listContact.list.contactsNum=0;
      listContact.contacts.map((contact)=> {
        if(this.addedContacts.find((con)=>con.id==contact.id)){
          contact.isChecked="checked"
          listContact.list.contactsNum++;

        }
        else{
          contact.isChecked=""
        }

      }

      )
    }
    if(listContact.list.contactsNum==listContact.contacts.length){
      listContact.list.isChecked="checked"
    }
  })
}
onSelectList(state,listContacts:ListContacts){
  listContacts.list.isExpanded=false;
  
  this.changeListSelectionState(state,listContacts);


  if(state=="checked"){

    // listContacts.contacts.map((contact)=>this.removeContact(contact))
    listContacts.contacts.map((contact)=>{this.addContactNumber(contact);
    })
    let found=this.allSelectedLists.find((listContact)=>listContact.list.id==listContacts.list.id);
    if(!found)
      {

        this.allSelectedLists.push(listContacts)
      }
  }
  else{
    listContacts.list.shoudBeClosed=true;
    listContacts.contacts.map((contact)=>this.removeContact(contact));


    // this.allSelectedLists.splice(this.allSelectedLists.indexOf(listContacts),1);

   this.resetSelectedLists();
   listContacts.list.isChecked="";
  this.selectedListsNum--;

  listContacts.contacts.map((contact)=>contact.isChecked="")

    if(this.selectedListsNum==0){
      this.selectAllStatus=0
    }
    else if(this.addedContacts.length==0){
      this.selectAllStatus=0;
      this.selectedListsNum=0;
    }
    else{
      this.selectAllStatus=1
    }

  }
  

}
onClose(event:string){
  this.searchForm.patchValue({
    contactsData:[]
  })
  this.allContacts=[];

}
changeListSelectionState(state,listContacts:ListContacts){

  if(state=="checked"){

    listContacts.list.isChecked="checked";
    this.selectedListsNum++;
    listContacts.contacts.map((contact)=>contact.isChecked="checked")
      if(this.selectedListsNum==this.allLists.length){
        this.selectAllStatus=2
      }


      else
      {
        this.selectAllStatus=1
      }

  }

else{

}

}
onHeaderClick(event: Event,state): void {
  if(state==""){

    event.stopPropagation();
  }
}





onSelectContact(state, listContact,contact:Contacts){
  if(!listContact.list.contactsNum){
    listContact.list.contactsNum=0
  }

  if(state=="checked"){
    contact.isChecked="checked";

    listContact.list.contactsNum++;


                this.addContactNumber(contact);

              if(listContact.list.contactsNum==listContact.contacts.length){
                this.onSelectList("checked",listContact);
                this.resetSelectedLists();

            



              }



      }
  else{
    contact.isChecked="";

    listContact.contactsNum--;
    if( listContact.contactsNum==0){
      // this.allSelectedLists.splice(this.allSelectedLists.indexOf(listContact),1);
      this.selectedListsNum--;
      listContact.list.isChecked=""
    }
    this.removeContact(contact)


  }
}

removeContact(contact:Contacts){
  if(this.searchForm.value.contactsData.length!=0){
    let found = this.searchForm.value.contactsData.find((con)=>con.value==contact.id);
    if(found){
      this.searchForm.value.contactsData.splice(this.searchForm.value.contactsData.indexOf(found),1)

    }
    let filtered=this.searchForm.value.contactsData;
    this.searchForm.patchValue({
      contactsData:filtered
    })
  }
  let found=this.addedContacts.find((con)=>con.id==contact.id);
  if(found){
    this.addedContacts.splice(this.addedContacts.indexOf(found),1);
  }

  this.resetSelectedLists()
  if(this.selectedListsNum==0){
    this.selectAllStatus=0
  }
  else if(this.addedContacts.length==0){
    this.selectAllStatus=0;
    this.selectedListsNum=0;
  }
  else{
    this.selectAllStatus=1
  }
  if(this.addedContacts.length==0){
    this.selectedListsNum=0;
    this.selectAllStatus=0;
    this.allSelectedLists=[];

  }
  this.emitContacts();

  // this.addedContacts.splice(this.addedContacts.indexOf(contact),1);

  // this.allSelectedLists.map((listContact)=>listContact.contacts.map((contact)=>this.addedContacts.includes(contact)?contact.isChecked="checked":contact.isChecked=""))


}



addContactNumber(contact:Contacts){

  let found=this.addedContacts.find((con)=>con.id==contact.id);
  if(!found){
    this.addedContacts.push(contact);
    // this.addedContacts=Array.from(new Set(this.addedContacts.map(obj => JSON.stringify(obj)))).map(str => JSON.parse(str));
  }
  //  let allAddedContacts=this.addedContacts
  //  allAddedContacts.push(contact);
  //  this.addedContacts= this.filterContacts(allAddedContacts);


  //     console.log("after filtering",this.addedContacts)
  this.emitContacts();

    if(this.addedContacts.find((contact)=>this.addHocs.includes(contact.mobileNumber))){


        this.addHocs.splice(this.addHocs.indexOf(contact.mobileNumber),1)
    }
this.checkValidContactsCount();

}
checkValidContactsCount(){
  let totalLength = [...this.addedContacts,...this.addHocs].length;
  if(totalLength > 20 && !this.warningShown){
    this.warningShown=true;
    this.showWarningModal()
  }
}
showWarningModal(){
  const dialogConfig=new MatDialogConfig();
  dialogConfig.disableClose = true;
  dialogConfig.height='50vh';
  dialogConfig.width='44vw';
  dialogConfig.minHeight='480px';
  dialogConfig.maxWidth='100%';
  dialogConfig.minWidth='530px';
  dialogConfig.data='contacts_count_warning';
  dialogConfig.panelClass="contacts_count_warning"

  const dialogRef = this.dialog.open(ContactsWarningComponent,dialogConfig);
 
}
filterContacts(contacts:Contacts[]){
  let filteredContacts=Array.from(new Set(contacts.map(obj => JSON.stringify(obj)))).map(str => JSON.parse(str));

  // this.emitContacts();
return filteredContacts

}
addHocNumber(){
  let contactsNum=this.addedContacts.map((contact)=>{return contact.mobileNumber});
  let foundContact=contactsNum.find((cont)=>this.form.value.mobile.e164Number.substring(1)==cont)
  if(foundContact){
    this.toaster.warning(`${this.translate.instant('This number alraedy exists')}`)

}

else{
  if(!this.addHocs.find((hoc)=>this.form.value.mobile.e164Number.substring(1)==hoc)){

    this.addHocs.push(this.form.value.mobile.e164Number.substring(1));
  }
  else{
    this.toaster.warning(`${this.translate.instant('This number alraedy exists')}`)

  }
  this.form.patchValue({
    mobile:''
  })}
  this.checkValidContactsCount();
  this.emitContacts();

  // this.hocsNum.emit(this.addHocs)
}

  async fetchAllContacts(search:string): Promise<Contacts[]> {
    try {
      const res = await this.listService.getContacts(false,50,0,"",search,"").toPromise();
      const contacts = res as Contacts[];

      return contacts;
    } catch (error) {
      // Handle errors if needed
      throw error;
    }

  }
  getAllContactsReq(search){
    return this.listService.getContacts(false,50,0,"",search,"")
  }
  getAllContactsRes(res,search){
    this.allContactsData=res;
      if(search){

        this.allContacts=this.allContactsData.map(res=>{
          return {
            title:res.name,
            value:res.id
          }
        })
        let selectedContacts=this.allContactsData.filter((contact)=>this.addedContacts.find((con)=>con.id==contact.id));
        this.searchForm.patchValue({
          contactsData:selectedContacts.map((res)=>{
            return{
              title:res.name,
              value:res.id
            }
          })
        })
        if(this.allContactsData.length==0){
          this.LoadingText=this.translate.instant('No Results')
        }
      }
      else{
        this.allContacts=[];
      }
  }
getAllContacts(search?:string){
  let searchVal=search?search:""

  
  this.getAllContactsReq(search).subscribe(
    (res)=>{
      this.getAllContactsRes(res,search)
}
  )
}
// // on select all lists
selectAllLists(state){
  if(state=="checked"){
  this.selectAllContacts();
  }
  else{
    this.onDeselectAllLists()
  }


}

// // on deselect all lists
onDeselectAllLists(){

  this.addedContacts=[];
  this.allSelectedLists=[];

  this.allLists.map((listContact)=>{
    listContact.list.isChecked='';
    listContact.list.isExpanded=true;
    listContact.contacts.map((contact)=>{
      this.removeContact(contact);
      contact.isChecked=''})

   })
   this.selectAllStatus=0;
   this.selectedListsNum=0;
   this.emitContacts();

}

selectAllContacts(){
  this.emitContacts();

  this.addedContacts=[];
  this.allSelectedLists=[];
 this.allLists.map((listContact)=>{

  this.getListContacts(listContact,true);
  listContact.list.shoudBeClosed=false;
  this.onSelectList("checked",listContact)

 })
 this.allSelectedLists=this.allLists

}
onSearch(event:string){
 
  // console.log('event',event)
  // setTimeout(() => {
  //   this.getAllContacts(event)

  // }, 1000);
}
onSelect(event:any){
  let contact=this.allContactsData.find((contact)=>contact.id==event.value)
this.resetSelectedLists();

  this.addContactNumber(contact)

}
onDeSelect(event:any){
  let contact=this.allContactsData.find((contact)=>contact.id==event.value);
  this.resetSelectedLists()

 this.removeContact(contact)
}
onSelectAll(event:any){
  this.allContactsData.map((cont)=>this.addContactNumber(cont));

  this.resetSelectedLists()

  // this.addedContacts=this.allContactsData;
  this.emitContacts();

}
onDeSelectAll(event:any){
  let contacts=this.searchForm.value.contactsData.map((res)=>{
    return this.allContactsData.find((cont)=>cont.id==res.value)
  })
  contacts.map((cont)=>this.removeContact(cont))
  // this.addedContacts=[];
  this.resetSelectedLists()

  this.emitContacts();

}
getAllContactsData(){
return [...this.addedContacts.map((e)=>e.mobileNumber),...this.addHocs.map((hoc)=>`+${hoc}`)]
}
allContactsToParent(){
this.allContactsFromChild.emit(this.getAllContactsData())
}
emitContacts(){
let allSelected=[...this.addedContacts.map((e)=>e.mobileNumber),...this.addHocs.map((hoc)=>`+${hoc}`)];


}
removeNum(num:string){
  this.addHocs.splice(this.addHocs.indexOf(num),1);
  // this.hocsNum.emit(this.addHocs)
  this.emitContacts();

}


// // on clear all data
clearContacts(){

  this.addedContacts=[];
  this.addHocs=[];
  this.selectedListsNum=0;
  this.selectAllStatus=0;
  this.allLists.map((listcontact)=>{
    listcontact.list.isChecked="";
    listcontact.contacts.map((contact)=>contact.isChecked="")
  })
    // this.hocsNum.emit(this.addHocs)
    this.emitContacts();


}



}


