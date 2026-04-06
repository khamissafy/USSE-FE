import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ManageContactsService } from '../../../manage-contacts.service';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-unCancelContacts',
  templateUrl: './unCancelContacts.component.html',
  styleUrls: ['./unCancelContacts.component.scss']
})
export class UnCancelContactsComponent implements OnInit {
  isLoading:boolean;
  email:string=this.authService.getUserInfo()?.email;
  contactsIds:string[]=[];
  constructor(   
    private listService:ManageContactsService,
    private authService:AuthService,
    public dialogRef: MatDialogRef<UnCancelContactsComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any) { }

  ngOnInit() {
    if(this.data){
      this.contactsIds=this.data.contactsData.contacts.map(res => res.id)
    }
  }
  submit(){
    this.isLoading = true;
    this.listService.unCancelContacts(this.contactsIds).subscribe(
      (res) => {
        this.isLoading = false;
        if(res.numberOfErrors === 0){
          this.onClose({errors:'noErrors' , data:this.contactsIds});
        }
        else{
          let errorObject =res;
          this.onClose({errors:errorObject , data:this.contactsIds});
        }      

      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    )
  }
  onClose(data?):void {
    this.dialogRef.close(data);
  }
}
