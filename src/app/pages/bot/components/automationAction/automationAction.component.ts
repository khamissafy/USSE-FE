import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BotService } from '../../bot.service';
import { TranslateService } from '@ngx-translate/core';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';

@Component({
  selector: 'app-automationAction',
  templateUrl: './automationAction.component.html',
  styleUrls: ['./automationAction.component.scss']
})
export class AutomationActionComponent implements OnInit {
  isLoading:boolean;
  isStop:boolean;
  isStart:boolean;
  constructor(public dialogRef: MatDialogRef<AutomationActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService:AuthService,
    private botService:BotService,
    private translate:TranslateService,
    private toaster: ToasterServices) { }

  ngOnInit() {
    if(this.data.action=="stop"){
      this.isStop=true;
      this.isStart=false;
    }
    else{
      this.isStart=true;
      this.isStop=false;
    }
  }
  stopAutomation(){
    this.botService.stopWhatsappBusinessAutomation(this.data.id).subscribe(
      (res) => {
        this.isLoading = false

        this.onClose(true);

        this.toaster.success(this.translate.instant("COMMON.SUCC_MSG"))


      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    
    )
    
  }
  startAutomation(){
    this.botService.startWhatsappBusinessAutomation(this.data.id).subscribe(
      (res) => {
        this.isLoading = false

        this.onClose(true);

        this.toaster.success(this.translate.instant("COMMON.SUCC_MSG"))


      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    
    )
  }
  submit() {
    this.isLoading = true;
    if(this.data.action == 'start'){
      this.startAutomation()
    }
    else{
      this.stopAutomation();
    }
  }
    
  onClose(data?): void {
    this.dialogRef.close(data);
}
}
