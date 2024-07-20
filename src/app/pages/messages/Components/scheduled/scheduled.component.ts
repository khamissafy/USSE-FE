import {AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {SelectionModel} from '@angular/cdk/collections';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import {  Shceduled, ShceduledData } from '../../message';
import { MessagesService } from '../../messages.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DisplayMessageComponent } from '../display-message/display-message.component';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { DevicesService } from 'src/app/pages/devices/devices.service';
import { DevicesPermissions } from 'src/app/pages/compaigns/compaigns.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SCHEDULED } from '../constants/messagesConst';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ScheduledMobileViewComponent } from '../../mobile-view/scheduled-mobileView/scheduled-mobileView.component';
import { arraysContainSameObjects } from 'src/app/shared/methods/arraysContainSameObjects';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';



@Component({
  selector: 'app-scheduled',
  templateUrl: './scheduled.component.html',
  styleUrls: ['./scheduled.component.scss']
})
export class ScheduledComponent implements OnInit ,AfterViewInit ,OnDestroy{
  length:number=0;
  numRows;
  loading:boolean=true;
  @Output() isChecked = new EventEmitter<ShceduledData[]>;
  @ViewChild(MatPaginator)  paginator!: MatPaginator;
  cellClick:boolean=false;
  columns :FormControl;
  displayed: string[] = SCHEDULED;
  displayedColumns: string[] = ['Device Name', 'Recipient', 'Messages', 'Created At','Scheduled At'];
  dataSource:MatTableDataSource<ShceduledData>;
  selection = new SelectionModel<ShceduledData>(true, []);

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
  pageNum: number;
  display: number;
 isSmallScreen: boolean = false;
 destroy$: Subject<void> = new Subject<void>();
 @Output() isOpenNewMessage= new EventEmitter<any>
  alldevices: any;
  @ViewChild(ScheduledMobileViewComponent) mobileView :ScheduledMobileViewComponent
  isDataCalledInMobile: boolean;
  selectedTimeZone:number=0;
  filteredDevices: any=[];

  constructor(private messageService:MessagesService,
    public dialog: MatDialog,
    private authService:AuthService,
    private translationService:TranslationService,
    private breakpointObserver: BreakpointObserver,
    private timeZoneService:TimeZoneServiceService
  ){
      this.display=this.messageService.getUpdatedDisplayNumber()
      this.pageNum=this.messageService.pageNum;
    }
  ngAfterViewInit(): void {
    if(this.paginator){
      this.paginator.pageSize=this.display
    }
    }
  ngOnInit() {
    this.setTimeZone();

    this.columns=new FormControl(this.displayedColumns)

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
      this.onChangeSecreanSizes();

    }
    setTimeZone(){
      let sub = this.timeZoneService.timezone$.subscribe(
        res=> this.selectedTimeZone=res
  
      )
      this.subscribtions.push(sub)
    }
    onChangeSecreanSizes(){
      this.breakpointObserver.observe(['(max-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isSmallScreen = result.matches;
        if(!this.isSmallScreen){
          this.selection.clear()

            if(this.dataSource){
  
            if(!arraysContainSameObjects(this.dataSource.data,this.mobileView?.messagesTableData)){
              if(this.mobileView?.filteredDevices.length>1){
                this.getDevices()
              }
              else{
                this.handleResponce(this.mobileView?.alldevices,this.mobileView?.messagesTableData,this.mobileView?.length)
                this.getFilterationFromChild(this.mobileView?.devicesData,this.mobileView?.filteredDevices)

              }
            }
          }
           else{
            if(!this.isDataCalledInMobile){
              this.getDevices()
            }
            else{
              if(this.mobileView?.filteredDevices.length>1){
                this.getDevices()
              }
              else{
                this.handleResponce(this.mobileView?.alldevices,this.mobileView?.messagesTableData,this.mobileView?.length)
                this.getFilterationFromChild(this.mobileView?.devicesData,this.mobileView?.filteredDevices)

              }

            }
          } 
        }
        else{
  
            if(this.dataSource){
              setTimeout(() => {
                this.mobileView?.handleResponce(this.alldevices,this.dataSource.data,this.length)
                this.mobileView.getFilterationFromParent(this.devicesData,this.filteredDevices)

            }, 0);
            }
            else{
              setTimeout(() => {
  
                this.mobileView?.getDevices()
                this.isDataCalledInMobile=true;
  
              }, 0);
            }
          
          
        }
      });
    }
    getFilterationFromChild(selectedDevices,devicesArr){
      setTimeout(() => {
          this.filteredDevices=devicesArr;
    
          this.form.patchValue({
            devicesData:selectedDevices.value
          })
    
         
        
      }, 0);
   
    
    }
    openNewMessage(event){
      this.isOpenNewMessage.emit(event)
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
        this.dataSource=new MatTableDataSource<ShceduledData>(messages)
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
      this.pageNum=0;
      this.getMessages(this.filteredDevices)  
  
    }
    deselectDev(device){
      this.filteredDevices.splice(this.filteredDevices.indexOf(device.value),1)
      if(this.paginator){
        this.paginator.pageIndex=0
      }
      this.pageNum=0;
      this.getMessages(this.filteredDevices )  
    }
    getMessages(deviceId?:string[]){
      let shows=this.messageService.display;
      let email=this.messageService.email;
      this.loading=true;
      let messagesSub=this.messageService.getScheduledMessages(email,shows,this.pageNum,deviceId).subscribe(
        (res)=>{
          this.numRows=res.data.length;
          this.dataSource=new MatTableDataSource<ShceduledData>(res.data);
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

    getMessagesCount(deviceId){
      let email=this.messageService.email;
      this.messageService.listScheduledMessagesCount(email,deviceId).subscribe(
        (res)=>{
          this.length=res;
          this.loading = false;
        }
        ,(err)=>{
          this.loading = false;
          this.length=0;
          this.noData=true;
        }
      )

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

      onPageChange(event){
        this.messageService.display=event.pageSize;
        this.selection.clear();
        this.pageNum=event.pageIndex;
        this.messageService.updateDisplayNumber(event.pageSize)
        this.getMessages(this.filteredDevices);

      }

      onCellClick(recipient){
        const currentLang=this.translationService.getCurrentLanguage()

        const dialogConfig=new MatDialogConfig();
        dialogConfig.height='100vh';
        dialogConfig.width='25vw';
        dialogConfig.maxWidth='450px';
        dialogConfig.disableClose = true;
        dialogConfig.position =  currentLang=='en'?{ right: '2px'} :{ left: '2px'} ;
        dialogConfig.direction = currentLang=='en'? "ltr" :"rtl";
        dialogConfig.minWidth='300px'
        dialogConfig.data={
          recipients:recipient,
          isScheduleN:true
        };
        dialogConfig.panelClass = 'custom-mat-dialog-container';

        const dialogRef = this.dialog.open(DisplayMessageComponent,dialogConfig);

        dialogRef.afterClosed().subscribe(result => {
          if(result){
          }

        });
      }

      displayMessage(row){
        if(!this.cellClick){
          const currentLang=this.translationService.getCurrentLanguage()
          const dialogConfig=new MatDialogConfig();
          dialogConfig.height='100vh';
          dialogConfig.width='25vw';
          dialogConfig.maxWidth='450px';
          dialogConfig.minWidth='300px'
          dialogConfig.disableClose = true;
          dialogConfig.panelClass = 'custom-mat-dialog-container';
          dialogConfig.position =  currentLang=='en'?{ right: '2px'} :{ left: '2px'} ;
          dialogConfig.direction = currentLang=='en'? "ltr" :"rtl";
          dialogConfig.data={
            schedule:row,
            isScheduleM:true
          };
          const dialogRef = this.dialog.open(DisplayMessageComponent,dialogConfig);

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
      this.selection.clear()
    }
}


