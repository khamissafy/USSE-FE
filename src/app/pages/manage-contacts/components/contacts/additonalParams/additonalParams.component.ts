import { Component, Inject, OnInit,OnDestroy } from '@angular/core';
import { Contacts } from '../../../contacts';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';

@Component({
  selector: 'app-additonalParams',
  templateUrl: './additonalParams.component.html',
  styleUrls: ['./additonalParams.component.scss']
})
export class AdditonalParamsComponent implements OnInit ,OnDestroy{
contact:Contacts;
selectedTimeZone:number=0;
sub:any;
  constructor(public dialogRef: MatDialogRef<AdditonalParamsComponent>
    ,@Inject(MAT_DIALOG_DATA) public data:Contacts,
    private timeZoneService:TimeZoneServiceService) { }

  ngOnInit() {
    this.setTimeZone();

    this.contact=this.data
  }
  setTimeZone(){
    this.sub = this.timeZoneService.timezone$.subscribe(
      res=> this.selectedTimeZone=res

    )
  }
  onClose(data?) {
    this.dialogRef.close(data);
  }
  ngOnDestroy(){
    if(this.sub){
      this.sub.unsubscribe()

    }
  }
}
