import { ToasterServices } from './../../../../../shared/components/us-toaster/us-toaster.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit,Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ManageContactsService } from '../../../manage-contacts.service';
import { ListData } from '../../../list-data';
import { TranslateService } from '@ngx-translate/core';
import { PluginsService } from 'src/app/services/plugins.service';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-addList',
  templateUrl: './addList.component.html',
  styleUrls: ['./addList.component.scss']
})
export class AddListComponent implements OnInit {
  email:string=this.authService.getUserInfo()?.email
  isLoading = false
  name:any = new FormControl('',[Validators.required,Validators.pattern(this.plugin.notStartWithSpaceReg)]);
  form = new FormGroup({
    name:this.name
  });

  isEdit:boolean =false

  constructor(
    private plugin:PluginsService,
    private toaster: ToasterServices,
    private listService:ManageContactsService,
    public dialogRef: MatDialogRef<AddListComponent>,
    private translate: TranslateService,
    private authService:AuthService,
    @Inject(MAT_DIALOG_DATA) public data: ListData,
  ) { }

  ngOnInit() {
    if(this.data){
      this.isEdit = true
      this.fillingData()
    }else{
      this.isEdit = false
    }
  }
  fillingData(){
    this.form.patchValue({
      name: this.data.name
    })
  }
  submitAdd(){
    this.isLoading = true

    this.listService.addList(this.form.value.name).subscribe(
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
  submitEdit(){
    this.isLoading = true
    this.listService.updateList(this.data.id,this.form.value.name).subscribe(
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
  onClose(data?): void {
    this.dialogRef.close(data);
  }
}

