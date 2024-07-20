import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { DevicesPermissions } from 'src/app/pages/compaigns/compaigns.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { SCHEDULED } from '../../Components/constants/messagesConst';
import { DisplayMessageComponent } from '../../Components/display-message/display-message.component';
import { Shceduled } from '../../message';
import { MessagesService } from '../../messages.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-scheduled-mobileView',
  templateUrl: './scheduled-mobileView.component.html',
  styleUrls: ['./scheduled-mobileView.component.scss']
})
export class ScheduledMobileViewComponent implements OnInit ,OnDestroy{
    length:number=0;
    numRows;
    loading:boolean=true;
    @Output() isChecked = new EventEmitter<Shceduled[]>;
    @Output() isOpenNewMessage = new EventEmitter<boolean>;
    @Output() selectedDeviceId = new EventEmitter<string>;
    openedDialogs:any=[];
    @ViewChild(MatPaginator)  paginator!: MatPaginator;
    cellClick:boolean=false;
    columns :FormControl;
    displayed: string[] = SCHEDULED.filter((_, index) => index !== SCHEDULED.length -1);
    displayedColumns: string[] = ['Device Name', 'Recipient', 'Messages', 'Created At','Scheduled At'];
    dataSource:MatTableDataSource<Shceduled>;
    selection = new SelectionModel<Shceduled>(true, []);
    messagesTableData:any=[]

    // devices
    devices:SelectOption[];
    deviceLoadingText:string='Loading';
    devicesData :any= new FormControl([]);
    form = new FormGroup({
      devicesData:this.devicesData,
    });
    deviceId:string;
    subscribtions:Subscription[]=[];
    noData: boolean;
    isUser: boolean;
    permission:DevicesPermissions[];
    pageIndex: number;
    display: number;
    showsOptions:SelectOption[]=[
      {title:'10',value:10},
      {title:'50',value:50},
      {title:'100',value:100}
  
  
    ];
    showsSelectedOptions:any = new FormControl([]);
    selectedSortingName:string='name';
    selectedSortingType:string='ASC'
    orderedBy: string='';
    topSortingOptions:any=[{opitonName:'name' ,lable:`${this.translate.instant('nameLabel')}`, isSelected:true} 
                            , {opitonName:'createdAt' , lable:`${this.translate.instant('CREATE_AT')}`,isSelected:false}]
    
  bottomSortingOptions:any=[{opitonName:'ASC' ,lable:`${this.translate.instant('ASCENDING')}`, isSelected:true} ,
                              {opitonName:'DEC' , lable:`${this.translate.instant('DESCENDING')}`,isSelected:false}]
  
    displayForm = new FormGroup({
      showsSelectedOptions:this.showsSelectedOptions,
     
    });
  alldevices: any;
  @Input() selectedTimeZone :number=0;
  filteredDevices: any=[];

    constructor(private messageService:MessagesService,
      public dialog: MatDialog,
      private authService:AuthService,
      private translate:TranslateService,
      private translationService:TranslationService){
        this.display=this.messageService.getUpdatedDisplayNumber()
        this.pageIndex=this.messageService.pageNum;
      }
    ngAfterViewInit(): void {
      }
      getFilterationFromParent(selectedDevices,devicesArr){
        console.log(
              {
                    selectedDevices:selectedDevices.value,
                    devicesArr:devicesArr
                  }
                  )
        setTimeout(() => {
       
            this.filteredDevices=devicesArr;
      
            this.form.patchValue({
              devicesData:selectedDevices.value
            })
      
           
          
        }, 0);
     
      
      }
    ngOnInit() {
    
      this.columns=new FormControl(this.displayedColumns)
      this.displayForm.patchValue({
        showsSelectedOptions: {
        title:String(this.messageService.getUpdatedDisplayNumber()),
        value:this.messageService.getUpdatedDisplayNumber(),
        }
        })
      this.selection.changed.subscribe(
        (res) => {
  
          if(res.source.selected.length){
  
            this.isChecked.emit(res.source.selected)
          }
          else{
            this.isChecked.emit()
          }
        });
  
  
        this.permission =this.messageService.devicesPermissions;
        if(this.authService.getUserInfo()?.customerId!=""){
          this.isUser=true;
        }
        else{
          this.isUser=false;
        }
  // get device's messages
  
  
      }
      openNewMessage(){
        this.isOpenNewMessage.emit(true)
      }
      handleResponce(res,messages?,length?){
        this.alldevices=res;
        if(this.permission){
  
          this.alldevices.map((device)=>
          {
            let found =this.permission.find((devP)=>devP.deviceId==device.id && devP.value=="None");
            if(found){
              this.alldevices.splice(this.alldevices.indexOf(device),1)
            }
          }
          )
        }
  
        this.devices = this.alldevices.map(res=>{
          return {
            title:res.deviceName,
            value:res.id,
            deviceIcon:res.deviceType
          }
        });
        if(this.devices.length==0){
          this.loading = false;
          this.length=0;
          this.noData=true;
          this.deviceLoadingText='No Results'

        }
        else{
          this.noData=false
  
          this.deviceId=res[0].id;
  
          // if(this.authService.selectedDeviceId ==""){
  
          //   this.form.patchValue({
          //   devicesData: {
          //   title:this.alldevices[0]?.deviceName,
          //   value:this.alldevices[0]?.id,
          //   deviceIcon:this.alldevices[0].deviceType
          //   }
  
          //   })
          // }
          // else{
          //   let selected= this.devices.find((device)=>device.value==this.authService.selectedDeviceId)
          //   this.deviceId=this.authService.selectedDeviceId;
          //   this.form.patchValue({
          //     devicesData: {
          //     title:selected.title,
          //     value:selected?.value,
          //     deviceIcon:selected.deviceIcon
          //     }
  
          //     })
          // }
          if(messages){
            this.numRows=res.length;
            this.loading = false;
            this.messagesTableData=messages
            this.length=length
           }
           else{
            this.getMessages();
           }
      }
      }
   // get devices data
   getDevices(){
    this.authService.getDevices(this.authService.getUserInfo()?.email,10,0,"","").subscribe(
      (res)=>{
        this.handleResponce(res)
      },
      (err)=>{
        this.loading = false;
        this.length=0;
        this.noData=true;
      }
    )
  }
  onSelectDev(device){
    this.filteredDevices.push(device.value);
    if(this.paginator){
      this.paginator.pageIndex=0
    }
    this.pageIndex=0;
    this.getMessages(this.filteredDevices)  

  }
  deselectDev(device){
    this.filteredDevices.splice(this.filteredDevices.indexOf(device.value),1)
    if(this.paginator){
      this.paginator.pageIndex=0
    }
    this.pageIndex=0;
    this.getMessages(this.filteredDevices )  
  }
      getMessages(deviceId?:string[]){
        let shows=this.messageService.display;
        let email=this.messageService.email;
        this.loading=true;
        let messagesSub=this.messageService.getScheduledMessages(email,shows,this.pageIndex,deviceId).subscribe(
          (res)=>{
            this.numRows=res.data.length;
            this.messagesTableData=res.data
            this.length=res.count;
            this.loading = false;

          },
          (err)=>{
           this.loading = false;
           this.length=0;
           this.noData=true;
  
          }
        )
        this.subscribtions.push(messagesSub)
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
  
      checkboxLabel(row?): string {
        if (!row) {
          return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
      }
  
      changeColumns(event){
        //  change displayed column based on component type
        this.displayedColumns=[...event]
  
        }
        onPageSizeChange(event){
          this.messageService.display=event.value;
          this.messageService.updateDisplayNumber(event.value)
          this.pageIndex=0; 
          if(this.paginator)
          {
            this.paginator.pageSize = event.value;
         
            this.paginator.pageIndex=0;
          }
        
          this.getMessages(this.filteredDevices);
  
        }
        onPageChange(event){
          this.pageIndex=event.pageIndex;
          this.selection.clear();
          this.getMessages(this.filteredDevices);
  
        }
  
        showRecepients(recipient){
          const currentLang=this.translationService.getCurrentLanguage()

          const dialogConfig=new MatDialogConfig();
          dialogConfig.height='60vh';
          dialogConfig.width='100vw';
          dialogConfig.maxWidth='100%';
          dialogConfig.minWidth='100%';
          dialogConfig.disableClose = true;
          dialogConfig.position = { bottom: '0'} ;
          dialogConfig.direction = currentLang=='en'? "ltr" :"rtl";
          dialogConfig.panelClass ='bottom-to-top-dialog';
          dialogConfig.data={
            recipients:recipient,
            isScheduleN:true
          };
          const dialogRef = this.dialog.open(DisplayMessageComponent,dialogConfig);

          dialogRef.afterClosed().subscribe(result => {
            if(result){
            }
  
          });
          this.openedDialogs.push(dialogRef)
        }
  
        displayMessage(row){
       
            const currentLang=this.translationService.getCurrentLanguage()
            const dialogConfig=new MatDialogConfig();
            dialogConfig.height='60vh';
            dialogConfig.width='100vw';
            dialogConfig.maxWidth='100%';
            dialogConfig.minWidth='100%';
            dialogConfig.disableClose = true;
            dialogConfig.position = { bottom: '0'} ;
            dialogConfig.direction = currentLang=='en'? "ltr" :"rtl";
            dialogConfig.panelClass ='bottom-to-top-dialog';
      
            dialogConfig.data={
              schedule:row,
              isScheduleM:true
            };
            const dialogRef = this.dialog.open(DisplayMessageComponent,dialogConfig);
  
            dialogRef.afterClosed().subscribe(result => {
              if(result){
              }
  
            });
            this.openedDialogs.push(dialogRef)

          }
  
          ngOnDestroy(){
            this.openedDialogs.forEach((dialog)=>{
              if(dialog){
                dialog.close();
              }
            })
            this.subscribtions.map(e=>e.unsubscribe());
          } 
  
  }

