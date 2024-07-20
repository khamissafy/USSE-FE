import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewChildren } from '@angular/core';
import { DevicesService } from '../devices.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { StepsComponent } from '../components/steps/steps.component';
import { DeviceData } from '../device';
import { SelectionModel } from '@angular/cdk/collections';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { DEVICESHEADERS } from '../constants/constants';
import * as saveAs from 'file-saver';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AddTLDeviceComponent } from '../components/telegramDevice/addTLDevice/addTLDevice.component';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent implements OnInit,OnDestroy{
  length:number;
  active:boolean=false;
  numRows;
  loading:boolean = true;
  delay:number;
  @Input() isCanceled:boolean;
  noData: boolean;
  sessionName:string;
  notFound: boolean=false;
  isReonnect:boolean=false;
  @ViewChild(MatPaginator)  paginator!: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild("search") search!:ElementRef
  deletedContacts:string[]=[];
  columns :FormControl;
  displayed: string[] = DEVICESHEADERS;
  displayedColumns: string[] = ['Device Name', 'Device Type', 'Number',"Create At", "Status","Delay Interval(s)","action"];
  dataSource:MatTableDataSource<DeviceData>;
  canEdit: any;
  email:string=this.authService.getUserInfo()?.email;
  isTrialCustomer:boolean;


  showsOptions: SelectOption[] = [
    { title: '10', value: 10 },
    { title: '50', value: 50 },
    { title: '100', value: 100 }


  ];
  showsSelectedOptions: any = new FormControl([]);

  displayForm = new FormGroup({
    showsSelectedOptions: this.showsSelectedOptions,

  });
  accordionData:any=[]
  selectedSortingName: string = 'name';
  selectedSortingType: string = 'ASC'
  orderedBy: string = '';
  topSortingOptions: any = [{ opitonName: 'name', lable: `${this.translate.instant('nameLabel')}`, isSelected: true }
    , { opitonName: 'createdAt', lable: `${this.translate.instant('CREATE_AT')}`, isSelected: false }]

  bottomSortingOptions: any = [{ opitonName: 'ASC', lable: `${this.translate.instant('ASCENDING')}`, isSelected: true },
  { opitonName: 'DEC', lable: `${this.translate.instant('DESCENDING')}`, isSelected: false }]

  isSmallScreen: boolean = false;
  destroy$: Subject<void> = new Subject<void>();
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  subscriptions: any=[];
  searchSub: any;
  selectedTimeZone:number=0;

  constructor(public dialog: MatDialog,
        private translate: TranslateService,
        private breakpointObserver: BreakpointObserver,
    private  toaster: ToasterServices,
    private authService:AuthService,
    private devicesService:DevicesService,
    private timeZoneService:TimeZoneServiceService
  ){
  }
  ngOnInit() {
    this.setTimeZone();
    this.breakpointObserver.observe(['(max-width: 768px)'])
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      this.isSmallScreen = result.matches;
      if(this.isSmallScreen){
        this.displayed=DEVICESHEADERS.slice(1)
      }
      else{
        this.displayed=DEVICESHEADERS

      }
      
    });
    this.getDevices();

        this.displayForm.patchValue({
          showsSelectedOptions: {
          title:'10',
          value:10,
          }
          })
    this.isTrialCustomer=this.authService.getSubscriptionState().isTrail ? this.authService.getSubscriptionState()?.isTrail : false;
    this.columns=new FormControl(this.displayedColumns)
    let permission =this.devicesService.DevicesPermission
    let customerId=this.authService.getUserInfo()?.customerId;

if(permission){
  if(permission.value=="ReadOnly" || permission.value =="None"){
    this.canEdit=false
  }
  else{
    this.canEdit=true
  }

}
else{

  this.canEdit=true
}
this.displayedColumns=this.canEdit?['Device Name', 'Device Type', 'Number',"Create At", "Status","Delay Interval(s)","action"]:['Device Name', 'Device Type', 'Number',"Create At", "Status"];
  }
  setTimeZone(){
    let sub = this.timeZoneService.timezone$.subscribe(
      res=> this.selectedTimeZone=res

    )
    this.subscriptions.push(sub)
  }
  getWidth(element: HTMLElement) {
    return `${element.clientWidth}px`;

 }
 getDevicesReq(searchVal?){
    let shows=this.devicesService.display;
    let pageNum=searchVal? 0 : this.devicesService.pageNum;
    let email=this.authService.getUserInfo()?.email;
    let orderedBy=this.orderedBy;
    let search=searchVal?searchVal:"";
    this.loading = true;
    this.isReonnect=false;
  if(searchVal && this.paginator){
      this.paginator.pageIndex=0
    }
    
    return this.devicesService.getDevices(email,shows,pageNum,orderedBy,search)
 }
 handleGetDevicesResponce(res,search){
  this.numRows=res.length;
  this.loading = false;
  this.dataSource=new MatTableDataSource<DeviceData>(res);
  if(search!=""){
    this.length=res.length;
    if(this.length==0){
      this.notFound=true;
    }
    else{
      this.notFound=false;
    }
}
else{
  if(this.paginator)
  {
    this.paginator.pageIndex=this.devicesService.pageNum

  }
  this.notFound=false;
  this.getDevicesCount();

}
 }
 handleError(){
  this.loading = false;
  this.length=0;
  this.noData=true;
 }
 setupSearchSubscription(): void {
  this.searchSub = this.searchControl.valueChanges.pipe(
    debounceTime(700), // Wait for 1s pause in events
    distinctUntilChanged(), // Only emit if value is different from previous value
    switchMap(searchVal => this.getDevicesReq(searchVal))
  ).subscribe(
    res => this.handleGetDevicesResponce(res,this.searchControl.value),
    err => this.handleError()
  );
  this.subscriptions.push(this.searchSub);
}
  getDevices(searchVal?){
    if(this.searchSub){
      this.searchSub.unsubscribe();
      this.searchSub=null;

      this.searchForm.patchValue({
        searchControl:''
      })
    }
    let search=searchVal?searchVal:"";
    this.getDevicesReq(search).subscribe(
      (res)=>{
       this.handleGetDevicesResponce(res,search);
       this.setupSearchSubscription()
       },
       (err)=>{
       this.handleError()
       })
  }

  onSortChange(event){
    let sorting = event.active=='Device Name' && event.direction=='asc'?'nameASC':
                  event.active=='Device Name' && event.direction=='desc'?'nameDEC':

                  event.active=='Create At' && event.direction=='asc'?'createdAtASC':
                  event.active=='Create At' && event.direction=='desc'?'createdAtDEC':
                  '';
    this.devicesService.orderedBy=sorting;

    this.getDevices();
  }



  getDevicesCount(){
    this.loading = true;
    this.devicesService.getDevicesCount(this.authService.getUserInfo()?.email).subscribe(
      (res)=>{
       this.length=res;
       this.loading = false;
       if( this.length==0){
        this.noData=true;

      
      }
      else{
         this.noData=false;

     
       }
       },
       (err)=>{
        
        this.loading = false;
        this.length=0;
        this.noData=true;
       })
  }

  changeColumns(event){
    if(this.canEdit){

      this.displayedColumns=[...event,'action']
    }
else{
  this.displayedColumns=[...event]

}

  }

toggleTopSortingSelect(){
  this.topSortingOptions.forEach((option:{opitonName:string,isSelected:boolean })=>option.isSelected=!option.isSelected);
  this.selectedSortingName= this.topSortingOptions.find((option)=>option.isSelected).opitonName;
  this.changeSorting(this.selectedSortingName , this.selectedSortingType)
}
toggleBottomSortingSelect(){
  this.bottomSortingOptions.forEach((option:{opitonName:string,isSelected:boolean })=>option.isSelected=!option.isSelected);
  this.selectedSortingType= this.bottomSortingOptions.find((option)=>option.isSelected).opitonName;
  this.changeSorting(this.selectedSortingName , this.selectedSortingType)

}
changeSorting(selectedSortingName ,selectedSortingType){
let sorting=`${selectedSortingName}${selectedSortingType}`;
this.orderedBy=sorting;
this.getDevices();
}
onPageSizeChange(event) {
  this.devicesService.pageNum = 0;
  this.devicesService.display=event.value;
  if (this.paginator) {
    this.paginator.pageSize = event.value;
    this.paginator.pageIndex = 0;
  }
  this.getDevices();
}

onPageChange(event){
  this.devicesService.display=event.pageSize;
  this.devicesService.pageNum=event.pageIndex;
  this.getDevices();
}
  onSearch(event:any){
    this.getDevices(event.value);
  }
  exportChats(device:DeviceData){
    this.devicesService.extractChats(this.email,device.id).subscribe(
      (response: any) => {
        // Use FileSaver.js to save the Excel file
        let filename;
        if(device.deviceType=='TL'){
           filename = `${device.deviceName} telegram chats.xlsx`; // Set your desired filename and extension

        }
        if(device.deviceType=='WBS' || device.deviceType=='OWA' ){
          filename = `${device.deviceName} whatsapp chats.xlsx`;
         } // Set your desired filename and extension
        saveAs(response, filename);
      }
    )
  }
  reconnect(device:DeviceData){
    this.loading=true;
    this.isReonnect=true;
    this.devicesService.reconnectWPPDevice(device.id,this.email).subscribe(
      (res)=>{
        this.getDevices();
      },
      (error) => {
        this.loading=false;
        this.openStepsModal({sessionName:device.instanceId,device:device})
      }
    )
  }

  openStepsModal(data?){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='95vh';
    dialogConfig.width='70vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='987px';
    dialogConfig.maxHeight='705px';
    dialogConfig.disableClose = true;
    if(data){
      dialogConfig.data=data
    }
    const dialogRef = this.dialog.open(StepsComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(data){

           this.reconnect(data.device)
        }
                this.toaster.success( this.translate.instant("COMMON.SUCC_MSG"));

      }
      this.getDevices();

    });


  }

  updateDeviceDelay(id: string) {

     //console.log(this.delay)
    this.devicesService.updateDeviceDelay(this.authService.getUserInfo()?.email, id, this.delay).subscribe(
      (res) => {

        this.delay=  res.delayIntervalInSeconds ;
        this.getDevices()
         // console.log(res);
        }


    )
  }
  reconnectTlDev(element:DeviceData){
    this.loading=true;
    let data:any={
      id:element.id,
      email: this.email,
      deviceName:element.deviceName,
      phoneNumber:element.deviceNumber,
      token:element.token ,
      sessionName: element.instanceId,
      code: null,
      password: null
    }
    this.devicesService.telegramId=element.id;
    this.devicesService.reconnectTelegramDev(data).subscribe(
      (res)=>{
        this.getDevices();
        this.devicesService.telegramId=''
        this.loading=false;
      },
      (err)=>{
        if(this.dataNeeded(err.error.msg)){
          this.addTLDevice({deviceTl:element,error:err.error})
        }
        this.loading=false;
      }
    )
  }
  dataNeeded(msg:any){
    return msg.includes('Error! Code Needed') ||
    msg.includes('Error! Password Needed')  || 
    msg.includes('Error! Password Needed') || 
    msg.includes('PHONE_PASSWORD_INVALID') ||
    msg.includes('PHONE_CODE_INVALID')
    
  }
  addTLDevice(element?){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.height='fit-content';
    dialogConfig.width='fit-content';
    // dialogConfig.panelClass='custom-dialog-preview'
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='833px';
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'responsive-dialog-for-TL';
    if(element){
      dialogConfig.data=element;

    }
    const dialogRef = this.dialog.open(AddTLDeviceComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getDevices();
        this.loading=false;

      }
      else{
        this.loading=false;
      }
    });

  }
  openDeleteModal(id:string){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.panelClass='custom-dialog-delete-style'

    dialogConfig.data =
    {
      deviceData:{deviceId:id}
    }
    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(id== this.authService.selectedDeviceId){
          this.authService.selectedDeviceId="";
        }
        this.getDevices();
      }
    });
  }
  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
    this.devicesService.display=10;
    this.devicesService.pageNum=0;
    this.devicesService.orderedBy='';
    this.devicesService.search='';
    this.subscriptions.map(e=>e.unsubscribe());

  };
}
