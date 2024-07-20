import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectorRef, Component, ComponentFactoryResolver, ComponentRef, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { DevicesPermissions } from 'src/app/pages/compaigns/compaigns.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { INBOXHEADER, OUTBOX, FAILED } from '../../Components/constants/messagesConst';
import { DisplayMessageComponent } from '../../Components/display-message/display-message.component';
import { ResendMessagesComponent } from '../../Components/resendMessages/resendMessages.component';
import { Message, messageData } from '../../message';
import { MessagesService } from '../../messages.service';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NavActionsComponent } from 'src/app/shared/components/nav-actions/nav-actions.component';

@Component({
  selector: 'app-messages-mobileView',
  templateUrl: './messages-mobileView.component.html',
  styleUrls: ['./messages-mobileView.component.scss']
})
export class MessagesMobileViewComponent implements OnInit {
    length:number=0;
    numRows;
    loading:boolean=true;
    @Input() msgCategory:string="inbox"
    @Output() isOpenNewMessage = new EventEmitter<boolean>;
    @Output() selectedDeviceId = new EventEmitter<string>;
    dynamicComponentRef: ComponentRef<NavActionsComponent>;
    @ViewChild('dynamicComponentContainer', { read: ViewContainerRef }) dynamicComponentContainer: ViewContainerRef;
    isChecked:boolean=false;
    @ViewChild(MatPaginator)  paginator!: MatPaginator;
    @ViewChild("search") search!:ElementRef
    @Input() canEdit: boolean;
    cellClick:boolean=false;
    // devices
    devices:SelectOption[];
    deviceLoadingText:string='Loading ...';
    devicesData :any= new FormControl([]);
    form = new FormGroup({
      devicesData:this.devicesData,
    });
    
    searchControl = new FormControl();
    searchForm = new FormGroup({
      searchControl:this.searchControl
    })
    searchSub: Subscription;
    filteration: any=[];

    @Input() selectedTimeZone :number=0;

  showsOptions:SelectOption[]=[
    {title:'10',value:10},
    {title:'50',value:50},
    {title:'100',value:100}


  ];
  showsSelectedOptions:any = new FormControl([]);

  displayForm = new FormGroup({
    showsSelectedOptions:this.showsSelectedOptions,
   
  });
    filterdData :any= new FormControl([]);
    filteringForm= new FormGroup({
      filterdData:this.filterdData,
    });
  selectedSortingName:string='name';
  selectedSortingType:string='ASC'
  orderedBy: string='';
  topSortingOptions:any=[{opitonName:'name' ,lable:`${this.translate.instant('nameLabel')}`, isSelected:true} 
                          , {opitonName:'createdAt' , lable:`${this.translate.instant('CREATE_AT')}`,isSelected:false}]
  
bottomSortingOptions:any=[{opitonName:'ASC' ,lable:`${this.translate.instant('ASCENDING')}`, isSelected:true} ,
                            {opitonName:'DEC' , lable:`${this.translate.instant('DESCENDING')}`,isSelected:false}]
messagesTableData:any=[]
  filters:any;
    deviceId:string;
    pageIndex:number=0;
    columns :FormControl;
    displayed: string[] ;
    displayedColumns: string[] = ['select' , 'Sender', 'Messages', 'Received At','Updated At','Status','Action'];
    dataSource:MatTableDataSource<messageData>;
    selection = new SelectionModel<messageData>(true, []);
    navActionSubscriptions:Subscription[]=[];

    subscribtions:Subscription[]=[];
    noData: boolean;
    notFound: boolean;
    isUser: boolean;
    permission:DevicesPermissions[];
    display: number;
    isSmallScreen: boolean = false;
    openedDialogs: any = [];
  alldevices: any=[]=[];
  filteredDevices: string[]=[];
  selectedMsgs: messageData[]=[];
    constructor(public cdr: ChangeDetectorRef ,
      public dialog: MatDialog,
      private messageService:MessagesService,
      private authService:AuthService,
      private translate:TranslateService,
      private translationService:TranslationService,
      private drawerService: NzDrawerService,
    private componentFactoryResolver: ComponentFactoryResolver,
    
      ){
        this.display=this.messageService.getUpdatedDisplayNumber()
        this.pageIndex=this.messageService.pageNum;
  
        this.filters=[
          {title:this.translate.instant("Pending") ,value:1},
          {title:this.translate.instant("Sent") ,value:2},
          {title:this.translate.instant("Delivered") ,value:3},
          {title:this.translate.instant("Read") ,value:4}
        
        ]
      }
      selectedItems:any=[
        {title:this.translate.instant("Pending") ,value:1},
        {title:this.translate.instant("Sent") ,value:2},
        {title:this.translate.instant("Delivered") ,value:3},
        {title:this.translate.instant("Read") ,value:4}
      
      ]
      openNewMessage(){
        this.isOpenNewMessage.emit(true)
      }
      getFilterationFromParent(selectedFilters,selectedDevices,filterationArr,devicesArr){
        
        setTimeout(() => {
       
            this.filteration=filterationArr;
            this.filteredDevices=devicesArr;
      
            this.form.patchValue({
              devicesData:selectedDevices.value
            })
      
            this.filteringForm.patchValue({
              filterdData:selectedFilters.value
            })
      
          
        }, 0);
     
      
      }
    ngOnInit() {
      this.filteringForm.patchValue({
        filterdData:this.selectedItems
      }
      )
      this.displayForm.patchValue({
        showsSelectedOptions: {
        title:String(this.messageService.getUpdatedDisplayNumber()),
        value:this.messageService.getUpdatedDisplayNumber(),
        }
        })
      this.columns=new FormControl(this.displayedColumns)
  
      this.selection.changed.subscribe(
        (res) => {
  
          if(res.source.selected.length){
            if(this.permission){
              this.selectedMsgs= res.source.selected.filter((msg) => {
              
                let device=this.permission.find((dev)=>dev.deviceId == msg.device.id)
                let canDeleted = device.value=="FullAccess" ? true : false
                return canDeleted; // Return true if canDeleted is true
              });

            }
           else{
            this.selectedMsgs=res.source.selected

           }
            this.isChecked=this.selectedMsgs.length>0
          
          }
          else{
            this.isChecked=false
          }
        });
  this.tableData();
  
  this.permission =this.messageService.devicesPermissions;
  if(this.authService.getUserInfo()?.customerId!=""){
    this.isUser=true;
  }
  else{
    this.isUser=false;
  }
  // get device's messages


}
getDataFromParent(res,messages?,length?){
  if(this.searchSub){
    this.searchSub.unsubscribe();
    this.searchSub=null;
    this.searchForm.patchValue({
      searchControl:''
    })
  }
  this.handleResponce(res,messages,length);
  this.setupSearchSubscription()
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

    // this.selectedDeviceId.emit(this.filteredDevices)
    // this.filteredDevices.map((device)=> this.getDevicePermission(device))
 
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
    //   this.filteredDevices=this.authService.selectedDeviceId;
    //   this.selectedDeviceId.emit(this.filteredDevices)

    //   this.form.patchValue({
    //     devicesData: {
    //     title:selected.title,
    //     value:selected?.value,
    //     deviceIcon:selected.deviceIcon

    //     }

    //     })
    // }
    if(messages){
      this.numRows = res.length;
      this.messagesTableData=messages
      this.length=length;
      if (this.paginator) {
        this.paginator.pageIndex = this.pageIndex;
      }
    
      this.notFound = false;
      if(this.length ==0){
        this.notFound=true;
      }
      this.loading=false

    }
    else{
      this.getMessages();
    }

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
this.selection.clear();
this.getMessages(this.filteredDevices);
} 
    
  ngAfterViewInit(): void {
    if(this.paginator){
      this.paginator.pageSize=this.messageService.display;

    }
  }

      resetFilteration(filterName){
        if(filterName == 'devices'){
          this.filteredDevices=[];
          this.form.patchValue({
            devicesData:[]
          })
        }
        else{
          this.filteration=[];
          this.filteringForm.patchValue({
            filterdData:[]
          })
        }
       
      }
   // get devices data
   getDevices(megtype:string){
    this.msgCategory=megtype;
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
  selectAllRows(){
    this.selection.select(...this.messagesTableData);
    if (this.dynamicComponentRef && this.selectedMsgs.length  > 0 ) {
      this.dynamicComponentRef.instance.selectedItems=this.selectedMsgs;
      this.selectedItems=this.selectedMsgs;
      this.dynamicComponentRef.instance.selectedItemsCount = this.selectedMsgs.length;
    }
  }
  createDynamicComponent(selectedContacts) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(NavActionsComponent);
    this.dynamicComponentContainer.clear();
  
    const componentRef = this.dynamicComponentContainer.createComponent(componentFactory);
    const navActionsComponentInstance: NavActionsComponent = componentRef.instance;
    navActionsComponentInstance.selectedItems = selectedContacts;
    this.selectedItems=selectedContacts;

    navActionsComponentInstance.componentName =this.msgCategory;

    // Assign the componentRef to this.dynamicComponentRef
    this.dynamicComponentRef = componentRef;
  
    // Pass selected row data to the dynamic component
    let sub1 = navActionsComponentInstance.selectAllEvent.subscribe(() => {
      // Logic to handle "Select All" event
      this.selectAllRows();
    });
    let sub2 = navActionsComponentInstance.deselectAllEvent.subscribe((res) => {
     if(res){
      this.distroyDynamicComponent();
      // this.selectionData.emit(this.selection);
    }
    });
    let sub3 =  navActionsComponentInstance.updateData.subscribe((res) => {
      if(res){
        this.pageIndex=0;
        this.getMessages(this.filteredDevices);
        this.distroyDynamicComponent();
        
      }
    });
    let sub4 =  navActionsComponentInstance.resendFailedMessages.subscribe((res) => {
      this.resendSelectedMessages();
    });
    this.navActionSubscriptions.push(sub1,sub2,sub3,sub4)

  }
distroyDynamicComponent(){
  this.selection.clear();
  this.dynamicComponentContainer.clear();
  this.dynamicComponentRef = null;
  this.navActionSubscriptions.map((sub)=>sub.unsubscribe());
}

onCheckboxChange(event,element: any) {
  if(event.checked == false && this.dynamicComponentRef){
    if(this.msgCategory === 'failed'){
      this.dynamicComponentRef.instance.showFailedMsgMenueItems();
    }
    else{
      this.dynamicComponentRef.instance.showMessageMenueItems();
    }
    
  }
  if(this.selectedMsgs.length  > 0 && !this.dynamicComponentRef){
    this.createDynamicComponent(this.selectedMsgs);
    this.dynamicComponentRef.instance.selectedItemsCount = this.selectedMsgs.length;

    // this.selectionData.emit(this.selection);

  }
  else if(this.selectedMsgs.length  === 0 && this.dynamicComponentRef){
    this.distroyDynamicComponent()

    // this.selectionData.emit(this.selection);
  }
  if (this.dynamicComponentRef && this.selectedMsgs.length  > 0 ) {
    this.dynamicComponentRef.instance.selectedItems=this.selectedMsgs;
    this.selectedItems=this.selectedMsgs;

    this.dynamicComponentRef.instance.selectedItemsCount = this.selectedMsgs.length;
  }
}

setupSearchSubscription(): void {
  this.searchSub = this.searchControl.valueChanges.pipe(
    debounceTime(700), // Wait for 1s pause in events
    distinctUntilChanged(), // Only emit if value is different from previous value
    switchMap(searchVal => this.getMessagesReq(this.filteredDevices,this.msgCategory,this.filteration, searchVal))
  ).subscribe(
    res => this.handleGetMessagesResponse(res,this.searchControl.value,this.filteration, this.msgCategory),
    err => this.handleError()
  );
  this.subscribtions.push(this.searchSub);
}

getMessagesReq(deviceId:string[],msgCat?,filterdItems?,searchVal?){
  let shows=this.messageService.display;
  let email=this.messageService.email;
  let msgCategory=msgCat? msgCat : this.msgCategory;
  let pageNumber=searchVal?0:this.pageIndex
  if(searchVal && this.paginator){
    this.paginator.pageIndex=0
  }
  if(this.selection){
    this.selection.clear();
    this.isChecked=false   
    if(this.dynamicComponentRef){
      this.distroyDynamicComponent()
    }
   


  }
 
  this.loading=true;
  return this.messageService.getMessages(email,msgCategory,shows,pageNumber,searchVal,deviceId,filterdItems)
   

}

getMessages(deviceId?: string[], msgCat?: string, filterdItems?: any, searchVal?: string): void {
  let search=searchVal?searchVal:"";
  let msgCategory=msgCat? msgCat : this.msgCategory;
  if(this.searchSub && (!filterdItems && this.filteredDevices.length==0)){
    console.log('triggered',this.filteredDevices)
    this.searchSub.unsubscribe();
    this.searchSub=null;
    this.searchForm.patchValue({
      searchControl:''
    })
  }
  this.loading=true;
  const messagesSub = this.getMessagesReq(deviceId, msgCategory, filterdItems, search).subscribe(
    (res) => {  
    this.handleGetMessagesResponse(res, search,filterdItems,msgCategory);
    if(!this.searchSub){
      this.setupSearchSubscription();
    }

    },
    err => this.handleError()
  );
  this.subscribtions.push(messagesSub);
}
handleGetMessagesResponse(res: Message, searchVal: string,filterdItems,msgCategory): void {
  this.numRows = res.data.length;
  this.messagesTableData =res.data;
  this.loading = false;

  if (searchVal!='') {
    this.length = res.data.length;
    this.notFound = this.length === 0;
  } else {
    if (this.paginator) {
      this.paginator.pageIndex = this.pageIndex;
    }
    this.notFound = false;
    this.length=res.count;
    this.loading=false
    if(this.length ==0){
      this.notFound=true;
    }
    // this.getMessagesCount(this.filteredDevices, msgCategory,filterdItems);
  }
}


handleError(): void {
  this.loading = false;
  this.length = 0;
  this.noData = true;
}

  // getMessagesCount(deviceId,msgCategory,filterdItems?){
  //   this.loading=true
  //   let email=this.messageService.email;
    
  //   this.messageService.getMessagesCount(email,msgCategory,deviceId,filterdItems).subscribe(
  //     (res)=>{
  //       this.length=res;
  //       this.loading=false
  //       if(this.length ==0){
  //         this.notFound=true;
  //       }
  //     }
  //     ,(err)=>{
  //       this.length=0;
  //       this.loading=false
  //       this.noData=true;

  //     }
  //   )
  // }
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

      // onSelect(device){
      //   this.selection.clear()
      //   this.filteredDevices=device.value;
      //   this.selectedDeviceId.emit(this.filteredDevices)
  
      //   this.authService.selectedDeviceId=device.value
      //   this.getMessages(this.filteredDevices);
      //   this.getDevicePermission(this.filteredDevices);
      //       }
    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
      const numSelected = this.selectedMsgs.length;
  
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
  
    onSearch(event:any){
      this.selection.clear();
      this.getMessages(this.filteredDevices,null,null,event.value);
    }
  
    changeColumns(event){
    //  change displayed column based on component type
    if(this.msgCategory=='failed' && this.canEdit){
      this.displayedColumns=['select',...event,'Ation']
    }
    else if(this.msgCategory!='failed' && this.canEdit){
      this.displayedColumns=['select',...event]
    }
    else{
      this.displayedColumns=[...event]
    }
  
  
    }
  
    onPageChange(event){
      this.pageIndex=event.pageIndex;
      this.selection.clear();
      this.getMessages(this.filteredDevices);
  
    }
    fillBasedOnPermissions(){
      if(this.msgCategory=='inbox'){
        this.displayed = INBOXHEADER
        this.displayedColumns = ['Device Name','Group Name', 'Sender', 'Messages', 'Received At'];
      }
      else if(this.msgCategory=='outbox'){
        this.displayed = OUTBOX;
        this.displayedColumns = ['Device Name','Group Name', 'Recipient', 'Messages', 'Received At','Updated At','Status'];
      }
      else if(this.msgCategory=='failed'){
  
        this.displayedColumns = ['Device Name','Group Name', 'Recipient', 'Messages', 'Received At'];
        this.displayed = FAILED;
  
      }
    
    this.columns.setValue(this.displayedColumns)
  }
    tableData(){
      if(!this.permission && this.isUser){
        this.fillBasedOnPermissions();
      }
      else{
        if(this.msgCategory=='inbox'){
  
          this.displayed = INBOXHEADER;
          this.displayedColumns = ['select' ,'Device Name','Group Name', 'Sender', 'Messages', 'Received At'];
        }
        else if(this.msgCategory=='outbox'){
          this.displayed = OUTBOX;
          this.displayedColumns = ['select' ,'Device Name','Group Name', 'Recipient', 'Messages', 'Received At','Updated At','Status'];
        }
        else if(this.msgCategory=='failed'){
          this.displayedColumns = ['select' ,'Device Name','Group Name', 'Recipient', 'Messages', 'Received At',"Ation"];
          this.displayed = FAILED;
    
        }
        this.columns.setValue(this.displayedColumns)
      }
  
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

      dialogConfig.data={message:row};

      const dialogRef = this.dialog.open(DisplayMessageComponent,dialogConfig);
  
      dialogRef.afterClosed().subscribe(result => {
        if(result){
        }
  
      });
    this.openedDialogs.push(dialogRef)
    }
    reSendMessage(msgId){
      const dialogConfig=new MatDialogConfig();
      dialogConfig.height='40vh';
      dialogConfig.width='100vw';
      dialogConfig.minHeight='428';
      dialogConfig.maxWidth='100vw';
      dialogConfig.disableClose = true;
      dialogConfig.panelClass = 'custom-mat-dialog-container';

      dialogConfig.data ={
        from:"messages",
        data: {
          messageIds:[msgId],
          email: this.authService.getUserInfo().email,
          deviceId: this.filteredDevices
        }
      }
    
      const dialogRef = this.dialog.open(ResendMessagesComponent,dialogConfig);
      dialogRef.afterClosed().subscribe(result => {
        if(result){
          this.getMessages(this.filteredDevices,"failed");
          
        }
      });
      this.openedDialogs.push(dialogRef)

    }
    resendSelectedMessages(){
      const messagesIDs=this.selectedMsgs.map((res)=>res.id)
       const dialogConfig=new MatDialogConfig();
       dialogConfig.height='40vh';
       dialogConfig.width='100vw';
       dialogConfig.minHeight='428';
       dialogConfig.maxWidth='100vw';
       dialogConfig.disableClose = true;
       dialogConfig.panelClass = 'custom-mat-dialog-container';
       dialogConfig.data ={
         from:"messages",
         data: {
           messageIds:messagesIDs,
           email: this.authService.getUserInfo().email,
           deviceId: this.filteredDevices
         }
       }
      
       const dialogRef = this.dialog.open(ResendMessagesComponent,dialogConfig);
       dialogRef.afterClosed().subscribe(result => {
         if(result){
           this.selection.clear();
           this.getMessages(this.filteredDevices,"failed");
           this.distroyDynamicComponent();

         }
       });
       this.openedDialogs.push(dialogRef)

     }
    ngOnDestroy(){
     
      this.openedDialogs.forEach((dialog) => {
        if (dialog) {
          dialog.close();
        }
      })
      this.selection.clear();
  
      this.subscribtions.map(e => e.unsubscribe());
    }

    onSelectDev(device){
      this.filteredDevices.push(device.value);
      if(this.paginator){
        this.paginator.pageIndex=0
      }
      this.pageIndex=0;
      this.getMessages(this.filteredDevices,this.msgCategory,this.filteration,this.searchControl.value)  

    }
    deselectDev(device){
      this.filteredDevices.splice(this.filteredDevices.indexOf(device.value),1)
      if(this.paginator){
        this.paginator.pageIndex=0
      }
      this.pageIndex=0;
      this.getMessages(this.filteredDevices,this.msgCategory,this.filteration,this.searchControl.value )  
    }
    selectFilter(item){
      // this.selectedItems.push(item);
          this.filteration= this.selectedItems.map((sel)=>sel.value-1)
      this.getMessages(this.filteredDevices,"outbox",this.filteration,this.searchControl.value )  
      }
      deselectFilter(item){
          this.filteration= this.selectedItems.map((sel)=>sel.value-1)
        this.getMessages(this.filteredDevices,"outbox",this.filteration,this.searchControl.value )   
    
      }
   
  }
  


