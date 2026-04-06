import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { FormControl, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { ListData } from '../../../list-data';
import { ManageContactsService } from '../../../manage-contacts.service';
import { AddListComponent } from '../../lists/addList/addList.component';
import { Contacts } from '../../../contacts';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input-gg';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PluginsService } from 'src/app/services/plugins.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CountryService } from 'src/app/shared/services/country.service';

interface CheckedCont{
  contacts:Contacts,
  listDetails:boolean,
  list:ListData

}
@Component({
  selector: 'app-addContact',
  templateUrl: './addContact.component.html',
  styleUrls: ['./addContact.component.scss']
})
export class AddContactComponent implements OnInit,OnDestroy{
// isChanged:boolean=false;
listsLoadingText:string=this.translate.instant('Loading')
email:string=this.authService.getUserInfo()?.email;
  // lists: ListData[] ;
  listsArr:SelectOption[]
  // ngx-intl-tel
  separateDialCode = true;
	SearchCountryField = SearchCountryField;
	CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  selectedCountryISO: any;

  isLoading = false;

  selectedLists = new FormControl([]);
  name:any = new FormControl('',[Validators.required,Validators.pattern(this.plugin.notStartWithSpaceReg)]);
  mobile:any = new FormControl('',[Validators.required]);
  fieldName:any=new FormControl('',[Validators.required]);
  value:any=new FormControl('',[Validators.required]);

  form = new FormGroup({
    name:this.name,
    mobile:this.mobile,
    selectedLists:this.selectedLists,


  });
  form2 = new FormGroup({
    fieldName:this.fieldName,
    value:this.value

  });
  isEdit:boolean =false

oldData;
invalidName:boolean;
additionalParameters:{name:string, value:string}[]=[];
cachedFields:{name:string, value:string}[]=[];
isFromListDetails:boolean;
subscribe:Subscription;
showInputs:boolean=false;
  // listsIds:string[]=[""];
  constructor(
    private plugin:PluginsService,
    private toaster: ToasterServices,
    private listService:ManageContactsService,
    public dialogRef: MatDialogRef<AddContactComponent>,
    private authService:AuthService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data:CheckedCont,
    private countryService:CountryService
  ) {
  }


  ngOnInit() { 
    this.setCountryBasedOnIP();
    this.subscribe= this.form2.valueChanges.subscribe(()=>{
      this.invalidName=this.checkIfFieldFound(this.form2.value.fieldName)

    })
    this.getLists();
    if(this.data){
      if(this.data.listDetails){
        this.isFromListDetails=true;
      }
      else{
        this.isFromListDetails=false;
      }
      this.isEdit = true
      this.fillingData();
      // this.listsIds=this.data.lists.map((e)=>e.id)
      // this.listsIds=this.data.contacts.lists.map((e)=>e.id);

      this.selectedLists=new FormControl(this.data.contacts.lists)


    }else{
      this.isEdit = false;
    }
  }
  setCountryBasedOnIP(): void {
    this.countryService.selectedCodeISo.subscribe(
      (countryName)=>{
        this.selectedCountryISO=CountryISO[countryName]
      }
    )
  }



  fillingData(){
    this.form.patchValue({
      name: this.data.contacts.name,
      mobile:`+${this.data.contacts.mobileNumber}`,
     
    });
    this.additionalParameters=this.data.contacts.additionalContactParameter;


  }
checkIfFieldFound(name){
  let found= this.additionalParameters.find((param)=>param.name==name)
  return found? true: false

}
  getLists(){
  this.listService.getList(100,0,"","").subscribe(
     (res)=>{
      if(this.data){
        let dataLists;
        let lists=[];
        if(this.data.listDetails){

          lists.push(this.data.list);
          dataLists=lists;
        }
        else{
          dataLists=this.data.contacts.lists;
        }


      let resList=res
      const listsMap = new Map();

      dataLists.forEach(list => listsMap.set(list.id, list));

      resList.forEach(list => {
        const exists = listsMap.has(list.id);

        if (!exists) {
          listsMap.set(list.id, list);
        }
      })
      let allLists=[]
      listsMap.forEach(list => allLists.push(list));
      // this.lists=allLists
      this.listsArr = allLists.map(res=>{
        return {
          title:res.name,
          value:res.id
        }
      })
      if(this.data.listDetails){
        this.form.patchValue({
          selectedLists: lists.map(res=>{
            return {
              title:res.name,
              value:res.id
            }
          })
        })
      }
      else{
        this.form.patchValue({
          selectedLists: this.data.contacts?.lists.map(res=>{
            return {
              title:res.name,
              value:res.id
            }
          })
        })
      }


      }
      else{
        // this.lists=res;
        this.listsArr = res.map(res=>{
          return {
            title:res.name,
            value:res.id
          }
        })
      }
      if(res.length==0){
        this.listsLoadingText=this.translate.instant('No Results')
      }
      },
      (err)=>{
        // this.onClose(false);
        // this.toaster.error("Error")
        this.listsLoadingText=this.translate.instant('No Results')

      })
  }
  remove(i){
    this.cachedFields.push(this.additionalParameters[i]);
    this.additionalParameters.splice(i,1);
  }
  addParameters() {
    this.showInputs = false;
  
    const newParameter = { name: this.form2.value.fieldName, value: this.form2.value.value };
    this.additionalParameters = [...this.additionalParameters, newParameter];
  
    // Clear the form values
    this.form2.patchValue({
      fieldName: "",
      value: ""
    });
  
    // Manually trigger change detection
    this.cdr.detectChanges();
  }
  cancel(){
    
    this.showInputs=false;
    this.form2.patchValue({
      fieldName:"",
      value:""
    })

  }
  submitAdd(){
    this.isLoading = true
    let name =this.form.value.name;
   
    let mobile=this.form.value.mobile.e164Number;
    let listsIds = this.form.value.selectedLists.map((e)=>e.value);

    this.listService.addContact(name,mobile,listsIds,this.additionalParameters).subscribe(
      (res)=>{
        this.isLoading = false
        this.onClose(true);
        this.toaster.success( this.translate.instant("COMMON.SUCC_ADD"));
      },
      (err)=>{
        this.isLoading = false
        this.onClose(false);
        // this.toaster.error( this.translate.instant("COMMON.ERR"))
      }
    )

  }


  submitEdit(){
    let listsIds = this.form.value.selectedLists.map((e)=>e.value);

    let data:any={
      id:this.data.contacts.id,
      name :this.form.value.name,
      mobileNumber:this.form.value.mobile.e164Number,
      additionalContactParameters: this.additionalParameters

    }

    this.isLoading = true
    if(this.data.listDetails){
      this.listService.updateContact(data).subscribe(

        (res)=>{
          this.isLoading = false
          this.onClose(true);
                  this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));

        },
        (err)=>{
          this.isLoading = false
          this.onClose(false);
        }
      )
    }
    else{
      data={
        id:this.data.contacts.id,
        name :this.form.value.name,
        mobileNumber:this.form.value.mobile.e164Number,
        newListId:listsIds,
        additionalContactParameters: this.additionalParameters
      }

      this.listService.updateContact(data).subscribe(

        (res)=>{
          this.isLoading = false
          this.onClose(true);
                  this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));

        },
        (err)=>{
          this.isLoading = false
          this.onClose(false);
        }
      )
    }

  }
  onClose(data?):void {
    if(this.cachedFields.length>0){
      this.cachedFields.map((field)=>this.additionalParameters.push(field))
    }
    this.dialogRef.close(data);
  }
  changeLists(event){

    // this.listsIds=event.map((e)=>e.id)
  }
  ngOnDestroy() {
    this.subscribe.unsubscribe()
  }
  onSearch(){
    this.listsLoadingText=this.translate.instant('No Results')
  }
}
