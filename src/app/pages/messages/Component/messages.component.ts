import { Component, AfterViewInit,OnInit, ViewChild , ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import {  MessageTypeComponent } from '../Components/message-type/message-type.component';
import { MessagesService } from '../messages.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ScheduledComponent } from '../Components/scheduled/scheduled.component';
import { InitPaginationService } from 'src/app/shared/services/initPagination.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResendMessagesComponent } from '../Components/resendMessages/resendMessages.component';
@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit , AfterViewInit,OnDestroy{
  tabs=["inbox","scheduled","outbox","failed"];
  tabsArr=[
    {
      title:'INBOX_LABEL',
      tab:'inbox',
      image:"assets/icons/inbox gray.svg"
    },
    {
      title:'SCHEDULED_LABEL',
      tab:'scheduled',
      image:"assets/icons/Scheduled gray.svg"

    },
    {
      title:'OUTBOX_LABEL',
      tab:'outbox',
      image:"assets/icons/Outbox gray.svg"

    },
    {
      title:'UNDELIVERED_LABEL',
      tab:'failed',
      image:"assets/icons/Undelivered gray.svg"

    }
  ]
  selectedTab;
  isChecked;
  isMessages:boolean=true;
  canEdit:boolean;
  deviceID:string;
  @ViewChild(MessageTypeComponent) messageType:MessageTypeComponent;
  @ViewChild(ScheduledComponent) scheduled:ScheduledComponent;
  routingObservable;
  selectedTabIndex=0
  constructor(
    private router:Router,
    private activatedRouter:ActivatedRoute,
    private initPaginationService:InitPaginationService,
    private cdr: ChangeDetectorRef ,public dialog: MatDialog,private  toaster: ToasterServices,private messageService:MessagesService,private authService:AuthService)
  {
    // initPaginationService.init();
    this.initRouting()
  }

  initRouting() {
    this.routingObservable = this.activatedRouter.queryParams.subscribe(params => {
      if (params["tab"]) {
        const requestedTab = params["tab"].replace(/[\s]/g);
        const tabIndex = this.tabs.findIndex(tab => tab === requestedTab);
  
        if (tabIndex !== -1) {
          // Valid tab, update accordingly
          this.selectedTab = requestedTab;
          this.selectedTabIndex = tabIndex;
        } else {
          // Invalid tab, default to the first tab
          this.selectedTab = this.tabs[0];
          this.selectedTabIndex = 0;
  
          // Update the URL with the default tab
          this.updateQueryParams();
        }
      } else {
        // No tab parameter, default to the first tab
        this.selectedTab = "inbox";
        this.selectedTabIndex = 0;
  
        // Update the URL with the default tab
        this.updateQueryParams();
      }
    });
  }
  updateQueryParams(){
    this.router.navigateByUrl("/messages?tab="+this.selectedTab)
  }
  ngOnInit() {
   


  }
  ngAfterViewInit() {
    // this.messageType.getDevices("inbox");

  }
  setDeviceIdFromChild(devid){
    this.deviceID=devid
  }
  openDeleteModal(){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.data =
    {
      messagesData:{messages:this.isChecked}
    }
    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      this.messageType.selection.clear();
      let id=this.messageType.deviceId
      this.messageType.pageNum=0;
      this.messageType.getMessages(this.messageType.filteredDevices);

    });
  }
  resendSelectedMessages(){
   const messagesIDs=this.isChecked.map((res)=>res.id)
    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.data ={
      from:"messages",
      data: {
        messageIds:messagesIDs,
        email: this.authService.getUserInfo().email,
        deviceId: this.deviceID
      }
    }
   
    const dialogRef = this.dialog.open(ResendMessagesComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.messageType.selection.clear();
        this.messageType.getMessages(this.messageType.filteredDevices,"failed")
      }
    });
  }
  onChecked(e){
    this.isChecked=e;

  }

  changeModal(ev){

    this.selectedTab = this.tabs[ev.index]
    this.updateQueryParams();
    // this.messageService.display=10;
    // this.messageService.pageNum=0;
    // this.messageService.orderedBy='';
    this.messageService.search='';
    this.isChecked=[]
    // this.cdr.detectChanges(); 
  }
  openNewMessage(){
    this.isMessages=false;
    this.messageService.search='';
    this.cdr.detectChanges(); 
  }
  ngOnDestroy(): void {
    this.routingObservable.unsubscribe();
    // this.messageService.display=10;
    // this.messageService.pageNum=0;
    // this.messageService.orderedBy='';
    this.messageService.search='';
  }
}
