import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { ManageContactsService } from '../../../manage-contacts.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FileFieldsComponent } from '../fileFields/fileFields.component';
import { ListData } from '../../../list-data';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BulkOperations } from 'src/app/shared/interfaces/bulkOperations';
import { noWhitespaceValidator } from 'src/app/shared/methods/noWhiteSpaceValidator';

export interface files{
  name:string,
  type:string,
  url:string,
  size:number,
  excelData: string[][],
}
@Component({
  selector: 'app-uploadSheet',
  templateUrl: './uploadSheet.component.html',
  styleUrls: ['./uploadSheet.component.scss']
})
export class UploadSheetComponent implements OnInit {
  fileData:files[]=[];
  isLoading:boolean;
  loading:boolean;
  listId:string;
  showLists:boolean=true;
  listsArr:SelectOption[]
  listsLoadingText:string='Loading ...';
  isDisabled:boolean=true;
  disableButton:boolean=false;
  containsHeadear:boolean=true;
  addNewList:boolean=false;
  selectedLists:any = new FormControl([]);
  listName = new FormControl('',[Validators.required , noWhitespaceValidator]);
  addedList:ListData;
  vcfFile:boolean;
  isExcelfFile:boolean;
  form = new FormGroup({
    selectedLists:this.selectedLists,
    listName:this.listName

  });
  fileType:string;
  constructor(  private toaster: ToasterServices,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data:any,
    private listService:ManageContactsService,
    private translate: TranslateService,
    private authService:AuthService,
    public dialogRef: MatDialogRef<UploadSheetComponent>,
    ) { }

  ngOnInit() {
    if(this.data){
 
        if(this.data.filetype =='vcf'){
          this.fileType='vcf'
          this.vcfFile=true;
          this.isExcelfFile=false

        }
        else{  
          this.vcfFile=false;
          this.isExcelfFile=true

          this.fileType='.xlsx, .xls'

         
        }


        if(this.data.listId){

          this.listId=this.data.listId;
          this.showLists=false;
        }
        else{
          this.showLists=true;
          this.getLists();
        }
      
      }
      
    
    }
 
  
  getLists(lisname?:string){
    this.listService.getList(100,0,"","").subscribe(
       (res)=>{
        let allLists=res;
        this.listsArr = res.map(res=>{
          return {
            title:res.name,
            value:res.id
          }
        })
        if(res.length==0){
          this.listsLoadingText='No Results'
        }
         if(res.length!=0 && lisname){
          this.addedList=allLists.find((listData)=>listData.name==lisname);
          this.form.patchValue({
            selectedLists: {
              title:this.addedList?.name,
              value:this.addedList?.id
            }
          });
          this.listId=this.addedList.id
        }


        },
        (err)=>{
          this.listsLoadingText='No Results'
          // this.onClose(false);
          // this.toaster.error("Error")

        })
    }

  uploadVCFfile(){
    this.loading=true;
    let data;
    if(this.listId){
      data={
        file:this.fileData[0].url,
        email:this.authService.getUserInfo()?.email,
        fileType:"vcf",
        listId:[this.listId],
      }
    }
    else{
      data={
        file:this.fileData[0].url,
        email:this.authService.getUserInfo()?.email,
        fileType:"vcf",
      }
    }
    this.listService.importFile(data).subscribe(
      (res : BulkOperations)=>{
        this.loading=false;
        
       
        if(res.numberOfErrors === 0){
          this.onClose('noErrors');
        }
        else{
          let errorObject =res;
          this.onClose(errorObject);
        }
      },
      (err)=>{
        this.loading=false;
        this.onClose();
      }
    )
    
  }
    goToFileSetting(){
      const dialogConfig=new MatDialogConfig();
      if(this.data.mobileView)
      {
        dialogConfig.height='80vh';
        dialogConfig.width='45vw';
        dialogConfig.maxWidth='100%';
        dialogConfig.minWidth='100%';
        dialogConfig.minHeight='470px';
        dialogConfig.disableClose = true;
        dialogConfig.panelClass = 'custom-mat-dialog-container';

      }
      else{
        dialogConfig.height='80vh';
        dialogConfig.width='60vw';
        dialogConfig.maxWidth='100%';
        dialogConfig.minWidth='465px';
        dialogConfig.disableClose = true;
      }
      
      dialogConfig.data={
        rowData:this.fileData[0].excelData[0],
        withHeader:this.containsHeadear,
        listId:this.listId,
        base64:this.fileData[0].url


      }


      const dialogRef = this.dialog.open(FileFieldsComponent,dialogConfig);


      dialogRef.afterClosed().subscribe(result => {
        if(result){

            this.onClose(result)

        }


      });

  }
  onSelect(event){
this.listId=event.value
  }
  clearForm(){
    this.form.patchValue({
      listName:""
    })
  }
  submitAddList(){
    this.isLoading = true

    this.listService.addList(this.form.value.listName).subscribe(
      (res)=>{
        this.clearForm();

        this.isLoading = false;

        this.addNewList=false;
                this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));

        this.getLists(this.form.value.listName)
      },
      (err)=>{
        this.addNewList=false;

        this.isLoading = false
      }
    )

  }
  cancelAddList(){
    this.addNewList=false;
    this.clearForm();
  }
  onFileChange(e){
    this.isDisabled=false;
  }
  onFileDelete(e){
    if(e){
      this.isDisabled=true;
    }

  }

  onCheck(state){
    if(state=="checked"){
      this.containsHeadear=true;
    }
    else{
      this.containsHeadear=false;

    }

  }
  onClose(data?):void {
    this.dialogRef.close(data);
  }
}
