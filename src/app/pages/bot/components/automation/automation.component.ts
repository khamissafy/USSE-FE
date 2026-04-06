import { Component, EventEmitter, OnInit, Output, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BotService } from '../../bot.service';
import { FormControl, FormGroup } from '@angular/forms';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { AutomationActionComponent } from '../automationAction/automationAction.component';
import * as QRCode from 'qrcode-generator';
import { saveAs } from 'file-saver';
import { DeviceData } from 'src/app/pages/devices/device';
import { Automation } from '../../interfaces/automation';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { ContactInfoComponent } from 'src/app/pages/manage-contacts/components/mobile view/contact-info/contact-info.component';
import { ContactInfoContent } from 'src/app/pages/manage-contacts/components/mobile view/contacts-mobileView/contacts-mobileView.component';
@Component({
  selector: 'app-automation',
  templateUrl: './automation.component.html',
  styleUrls: ['./automation.component.scss']
})
export class AutomationComponent implements OnInit,AfterViewInit ,OnDestroy {
  displayedColumns: string[] = ['Reorder','Name', 'Criterias','Status','Operations'];
  displayed:any=[
    {
      title:"criteria",
      value:"Criterias"
    },
    {
      title:"status",
      value:"Status"
    },
    {
      title:"CREATE_AT",
      value:"Operations"
    },
  ];
  columns :FormControl;
  openedDialogs:any=[]
  dataSource :MatTableDataSource<any>;
  length:number=0;
  id:number=0;
  loading:boolean=true;
  @Output() openNewAutomation = new EventEmitter<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  devices:SelectOption[];
  email:string=this.authService.getUserInfo()?.email;
  deviceLoadingText:string='Loading ...';
  devicesData :any= new FormControl([]);
  form = new FormGroup({
    devicesData:this.devicesData,
  });
  deviceId:string;
  pageNum: any=0;
  notFound: boolean;
  noData: boolean;
  display:number=10;
  search:string="";
  deviceNumber:string;
  alldevices:DeviceData[]=[];
  WrapperScrollLeft =0;
  WrapperOffsetWidth =250;

  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  searchSub: Subscription;
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
  subscriptions:any=[]
  constructor(private botService : BotService ,
    private authService:AuthService,
    public dialog: MatDialog, 
    private translate: TranslateService,
    private breakpointObserver: BreakpointObserver,
    private drawerService: NzDrawerService,

    ) { }
    ngOnDestroy(): void {
      this.destroy$.next();
        this.destroy$.complete();
        this.subscriptions.map(e=>e.unsubscribe());

    }
    ngAfterViewInit() {
    if(this.dataSource){
    
      this.dataSource.paginator = this.paginator;
    }
    }
  ngOnInit() {
    this.breakpointObserver.observe(['(max-width: 768px)'])
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      this.isSmallScreen = result.matches;

      if(!this.isSmallScreen){
        this.openedDialogs.map((dialog)=>{
          if(dialog){
            dialog.close();
          }
        })

      }
      
    });
    this.getDevices();

        this.displayForm.patchValue({
          showsSelectedOptions: {
          title:'10',
          value:10,
          }
          })
    this.columns=new FormControl(this.displayedColumns)

  }
  onListDrop(event: CdkDragDrop<string[]>) {
    const data = [...this.dataSource.data];
    moveItemInArray (data, event.previousIndex, event.currentIndex);
    this.dataSource.data = data;
    this.accordionData=data
    let orderedData=this.dataSource.data.map((automation, index)=>{
      return {
        automationId:automation.id,
        order:index
      }
    })
    this.botService.reOrderAutomations(this.deviceId,orderedData).subscribe()
  
  }

  exportQRCode(element) {
    const typeNumber = 16; // or adjust as needed
    const errorCorrectionLevel = 'L'; // or adjust as needed
    const qrData = this.generateQrString(element);
  
    // Convert the string to a Uint8Array using UTF-8 encoding
    const utf8Bytes = new TextEncoder().encode(qrData);
  
    // Convert the Uint8Array to a string
    const utf8String = String.fromCharCode.apply(null, utf8Bytes);
  
    // Generate QR code using the string
    const qr = QRCode(typeNumber, errorCorrectionLevel);
    qr.addData(utf8String, 'Byte');
    qr.make();
  
    // Convert QR code to image data URL
    const qrCodeDataUrl = qr.createDataURL(10, 0);
  
    // Convert data URL to Blob
    const byteCharacters = atob(qrCodeDataUrl.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
  
    // Save the Blob as a file using FileSaver.js
    saveAs(blob, `${element.name}_qrcode.png`);
  }
  
  generateQrString(element: Automation): string {
    let criteria = element.criterias[0].criteria;
    return `https://api.whatsapp.com/send?phone=${this.deviceNumber}&text=${encodeURIComponent(criteria)}`;
  }
  
   // get devices data
 getDevices(){
  this.authService.getDevices(10,0,"","").subscribe(
    (res)=>{
      this.alldevices=res;
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

      }
      else{
        this.noData=false

        this.deviceId=res[0].id;


        if(this.authService.selectedDeviceId ==""){

          this.form.patchValue({
          devicesData: {
          title:this.alldevices[0]?.deviceName,
          value:this.alldevices[0]?.id,
          deviceIcon:this.alldevices[0].deviceType

          }

          })
          this.deviceNumber=this.alldevices[0].deviceNumber;

        }
        else{
          let selected= this.devices.find((device)=>device.value==this.authService.selectedDeviceId);
          let deviceSelectedAllData=this.alldevices.find((device)=>device.id==this.authService.selectedDeviceId);
          this.deviceId=this.authService.selectedDeviceId;

          this.form.patchValue({
            devicesData: {
            title:selected.title,
            value:selected?.value,
            deviceIcon:selected.deviceIcon

            }

            })
            this.deviceNumber=deviceSelectedAllData.deviceNumber;

        }
      }
        this.getAutomations(this.deviceId);

    },
    (err)=>{
      this.loading = false;
      this.length=0;
      this.noData=true;

    }
  )
}
scrollRight(element, wrapper: HTMLElement) {
  element.hideLeftArrow = false;
element.WrapperOffsetWidth = wrapper.offsetWidth;

// Calculate the total width of list items dynamically
const totalListWidth = Array.from(wrapper.querySelectorAll('.criteriaName')).reduce((acc, listItem) => {
  // Calculate the width of each list item and add it to the accumulator
  const listItemWidth = listItem.clientWidth;
  return acc + listItemWidth;
}, 0);



// Update hideRightArrow based on the scroll position
if (this.WrapperScrollLeft > totalListWidth - element.WrapperOffsetWidth) {
  element.hideRightArrow = true;
} else {
  element.hideRightArrow = false;
}
this.WrapperScrollLeft = wrapper.scrollLeft + 100;
// Scroll to the calculated position
wrapper.scrollTo({
  left: this.WrapperScrollLeft,
  behavior: "smooth",
});
}
scrollLeft(element , wrapper){
  element.hideRightArrow = false;
  this.WrapperScrollLeft =wrapper.scrollLeft-100
  if(this.WrapperScrollLeft<=5){
    this.WrapperScrollLeft =0;
    element.hideLeftArrow=true;
    
  }
  wrapper.scrollTo({
    left: this.WrapperScrollLeft,
    behavior: "smooth",
  })
  


}
getAutomationReq(deviceId,searchVal){
  let shows=this.display;
  let search=searchVal?searchVal:"";
  this.loading = true;
  let pageNumber=searchVal?0:this.pageNum
  if(searchVal && this.paginator){
    this.paginator.pageIndex=0
  }
  return this.botService.getAutomations(shows,pageNumber,search,deviceId)
}
handleGetAutomationsResponce(deviceId,res,search){
  this.loading = false;
  this.dataSource=new MatTableDataSource<any>(res);
  this.accordionData=res;
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
  this.paginator.pageIndex=this.pageNum
  this.notFound=false;
  this.getAutomationsCount(deviceId);


}
}
handleError(){
  this.loading = false;
  this.length=0;
}
setupSearchSubscription(): void {
  this.searchSub = this.searchControl.valueChanges.pipe(
    debounceTime(700), // Wait for 1s pause in events
    distinctUntilChanged(), // Only emit if value is different from previous value
    switchMap(searchVal => this.getAutomationReq(this.deviceId,searchVal))
  ).subscribe(
    res => this.handleGetAutomationsResponce(this.deviceId,res,this.searchControl.value),
    err => this.handleError()
  );
  this.subscriptions.push(this.searchSub);
}
  getAutomations(deviceId,searchVal?){
    let search=searchVal?searchVal:"";
    if(this.searchSub){
      this.searchSub.unsubscribe();
      this.searchSub=null;
      this.searchForm.patchValue({
        searchControl:''
      })
    }
   this.getAutomationReq(deviceId,search).subscribe(
        (res)=>{
         this.handleGetAutomationsResponce(deviceId,res,search)
          this.setupSearchSubscription();
        },
        (err)=>{
   
      this.handleError()
  
        }
      )
    
  }
  getAutomationsCount(deviceId){
    this.loading=true
    this.botService.getAutomationsCount(deviceId).subscribe(
      (res)=>{
        this.loading = false;
        this.length=res;
        if(this.length ==0){
          this.notFound=true;
        }
      }
      ,(err)=>{
  
        this.loading = false;
        this.length=0;
        this.noData=true;
  
      }
    )
  }
  onSelect(device){
    let foundDevice=this.alldevices.find((dev)=>dev.id==device.value)
    this.deviceNumber=foundDevice.deviceNumber;
    this.deviceId=device.value;
    this.authService.selectedDeviceId=device.value
    this.getAutomations(this.deviceId)

  }
  deleteAutomation(element){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.panelClass='custom-dialog-delete-style'

    dialogConfig.data =
    {
      automationData:{automationId:element.id}
    }
    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getAutomations(this.deviceId);
      }
    });
  }

  addAutomation(){
    this.openNewAutomation.emit({openNewAutomation:true , editAutomationData:null})

  }
  showCriterias(element){
    if(element.criterias && element.criterias?.length > 0){
      let listNames=element.criterias.map((item)=>item.criteria)
      const placement = 'bottom'; // Set the placement to 'bottom' for bottom-to-top transition
  
      const drawerRef = this.drawerService.create<ContactInfoComponent, ContactInfoContent>({
        nzHeight: '40vh',
        nzWidth:'100vw',
        nzClosable: true,
        nzContent: ContactInfoComponent,
        nzPlacement: placement,
        nzWrapClassName: 'bottom-drawer',
        nzContentParams: {
          lists: listNames,
          contactName: element.name,
          contactNumber: element.mobileNumber,
          title:"criteria"
        }
      });
      this.openedDialogs.push(drawerRef)
  
    }
    
  }
    editAutomation(element){
    this.openNewAutomation.emit({openNewAutomation:true , editAutomationData:element})
  }
  onPageSizeChange(event) {

    this.pageNum = 0;
    this.display=event.value;

    if (this.paginator) {
      this.paginator.pageSize = event.value;
      this.paginator.pageIndex = 0;
    }
    this.getAutomations(this.deviceId);

  }
  onPageChange(event){
    this.display=event.pageSize;
    this.pageNum=event.pageIndex;
    this.getAutomations(this.deviceId);

  }
  onSearch(event:any){

    this.getAutomations(this.deviceId,event.value);
  }
  onSwitcherChange(e,automation){
    e.target.checked ? this.startAutomation(automation):this.stopAutomation(automation);
  }


  stopAutomation(automation){
    this.botService.stopWhatsappBusinessAutomation(automation.id).subscribe(
      (res) => {
      


      },
      (err) => {
       
      }
    
    )
    
  }
  startAutomation(automation){
    this.botService.startWhatsappBusinessAutomation(automation.id).subscribe(
      (res) => {
     


      },
      (err) => {
     
      }
    
    )
  }

  changeColumns(event){
    this.displayedColumns=[...event]

  }
}
