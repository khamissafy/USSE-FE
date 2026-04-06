import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AutoReplayComponent } from '../../components/autoReplay/autoReplay.component';
import { SubscribeToListComponent } from '../../components/subscribeToList/subscribeToList.component';
import { InquiryComponent } from '../../components/inquiry/inquiry.component';
import { CompaignsService } from 'src/app/pages/compaigns/compaigns.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ConfirmaionsComponent } from '../../../confirmaions/confirmaions.component';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BotService } from 'src/app/pages/bot/bot.service';
import { Automation } from 'src/app/pages/bot/interfaces/automation';
import { Subject, takeUntil } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
@Component({
  selector: 'app-campaignActions',
  templateUrl: './campaignActions.component.html',
  styleUrls: ['./campaignActions.component.scss']
})
export class CampaignActionsComponent implements OnInit ,AfterViewInit,OnDestroy {
  displayedColumns: string[] = ['Reorder','Name', 'Operations'];
  dataSource :MatTableDataSource<any>;
  length:number=0;
  id:number=-1;
  selectedElementName:string;
  accordionData:any=[]
  @ViewChild(MatPaginator) paginator: MatPaginator;
  tableData:any=[];
  actions:any=[];
  @Output() actionsData = new EventEmitter<any>
  @Input() deviceId:string;
  @Input() isCampaignAction:boolean=false;
  @Output() formValidityChange = new EventEmitter<boolean>(true);
  MessageAfterTimeOut : any = new FormControl('',Validators.required);
  sessionTimeOut: any = new FormControl(15);
  email:string=this.authService.getUserInfo()?.email
  campArr:SelectOption[];
  selectedActions:any = new FormControl([]);

  pageNum:number=0;
  display:any;
  listsLoadingText:string=this.translate.instant('Loading')
  selectedCampaignActions:any=[];
  selectedElementID:string;
  @Input() automationData:Automation
    selecetedCampainsIDs:string[]=[]

    loading:boolean=false;
    showsOptions:SelectOption[]=[
      {title:'10',value:10},
      {title:'50',value:50},
      {title:'100',value:100}
  
  
    ];
 
    showsSelectedOptions:any = new FormControl([]);
    form = new FormGroup({

      selectedActions:this.selectedActions,
      showsSelectedOptions:this.showsSelectedOptions
  
    });
 
  isSmallScreen: boolean = false;
  destroy$: Subject<void> = new Subject<void>();
  currentPage = 1;
pageSize:number=10;
  constructor(private dialog: MatDialog ,
      private campaignsService:CompaignsService,
      private translate: TranslateService,
      private authService:AuthService,
      private botService:BotService,
      private breakpointObserver: BreakpointObserver

    ) {
        
}
getWidth(element: HTMLElement) {

  return `${element.clientWidth}px`;
}

ngOnDestroy(): void {
  this.destroy$.next();
    this.destroy$.complete();
  
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
  
});
    this.form.patchValue({
      showsSelectedOptions: {
      title:'10',
      value:10,
      }
      })

    if(this.isCampaignAction){
      this.getCampaings()
    }
    else{
      this.getAutomations()
    }
    if(this.automationData){
      if(this.automationData.botActionCount >0 && this.automationData.botActions){

        this.fillTableData(this.automationData.botActions)
      }
    }
  
  }

  onListDrop(event: CdkDragDrop<string[]>) {
    const data = [...this.dataSource.data];
    moveItemInArray (data, event.previousIndex, event.currentIndex);
    this.dataSource.data = data;
    this.tableData=data;
    this.accordionData=data
    this.setActions();
  }
  getAutomations(){
    this.botService.getAutomations(100,0,"",this.deviceId).subscribe(
      (res)=>{
        let autWithActions = res.filter((withActions)=>withActions.botActionCount>0);
        if(autWithActions.length==0){
          this.listsLoadingText=this.translate.instant('No Results')
        }
        else{
          this.campArr=autWithActions.map(res=>{
            return {
              title:res.name,
              value:res.id,
            
            }
          });
          if(this.automationData){
            let foundSelectedAutomation = autWithActions.find((action)=>action.id == this.automationData.id);
            if(foundSelectedAutomation){
              this.form.patchValue({
                selectedActions:{
                  title:foundSelectedAutomation.name,
                  value:foundSelectedAutomation.id
                }
              })
              this.selectedElementID=foundSelectedAutomation.id;
              this.loading=true;
              this.applyActionsFromAutomation(foundSelectedAutomation.id);
            

            }
          }
        
        
        }
        },
        (err)=>{

        this.listsLoadingText=this.translate.instant('No Results')

        })
    }
  getCampaings(){
    this.campaignsService.getCampaigns(100,0,"",this.deviceId).subscribe(
      (res)=>{
        let campWithActions = res.filter((withActions)=>withActions.actionCount>0);
        if(campWithActions.length==0){
          this.listsLoadingText=this.translate.instant('No Results')
        }
        else{
          this.campArr=campWithActions.map(res=>{
            return {
              title:res.campaignName,
              value:res.id,
             
            }
          });
        }
        },
        (err)=>{

        this.listsLoadingText=this.translate.instant('No Results')

        })
    }
  onSearch(){
    this.listsLoadingText=this.translate.instant('No Results')
  }
  onSelect(event){
    if( this.selectedElementID !== event.value){
      this.selectedElementID=event.value;
      this.selectedElementName=event.title;
      this.applyCampaignActions();
    }

  }
  onPageSizeChange(event){
    this.pageNum=0; 
    if(this.paginator){
      this.paginator.pageSize = event.value;
      this.paginator.pageIndex=0;
    }
    this.pageSize=event.value;
    this.updateDisplayedData();
  }
  onPageChange(event): void {
    this.currentPage = event.pageIndex + 1;
    this.updateDisplayedData();
  }
  updateDisplayedData() {
    this.dataSource.paginator=this.paginator;
    // Update the displayed data based on the current page and page size
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    // Use Array.slice to get the data for the current page
    this.accordionData = this.tableData.slice(startIndex, endIndex);
  }
 
  deleteAction(element){
    let foundElementFromTable = this.tableData.find((data)=>data.id == element.id);
    this.tableData.splice(this.tableData.indexOf(foundElementFromTable) , 1);
    this.dataSource=new MatTableDataSource<any>(this.tableData)
    this.accordionData=this.tableData
    this.dataSource.paginator = this.paginator;

    this.length=this.tableData.length;
    if(this.length==0){
      this.id=-1;
      
    
        this.form.patchValue({
          selectedActions:null
        })
        this.selectedElementID=null
      
    }
    this.setActions();

  }
 fillTableData(actions:any[]){

  this.id=-1;
  this.tableData=[];
  this.tableData=actions.map((action)=>{
    this.id++;
    return{
      id:this.id,
      name: action.actionName,
      data: action[action.actionName]
    }
  })
  this.dataSource=new MatTableDataSource<any>(this.tableData);
  this.accordionData=this.tableData

  this.dataSource.paginator = this.paginator;
  this.setActions();

 }
 applyActionsFromAutomation(autId){
  this.botService.getAutomationById(autId).subscribe(
    (res)=>{
      let botActions=res.botActions;
      
      this.fillTableData(botActions)
      this.loading=false;
    }
  )
 }
 clearTableData(){
  this.tableData=[];
  this.dataSource=new MatTableDataSource<any>(this.tableData);
  this.accordionData=this.tableData

  this.dataSource.paginator = this.paginator;

  this.setActions();
  this.id=-1;


    this.form.patchValue({
      selectedActions:null
    })
    this.selectedElementID=null
  
 }
 applyCampaignActions(){
  const dialogConfig=new MatDialogConfig();
  dialogConfig.disableClose = true;
  dialogConfig.height='45vh';
  dialogConfig.width='35vw';
  dialogConfig.maxWidth='100%';
  dialogConfig.panelClass='custom-dialog-delete-style'
  dialogConfig.minWidth='465px';
  dialogConfig.data ={id:this.selectedElementID, action:'apply' ,isCampaignAction:this.isCampaignAction , name:this.selectedElementName}
  const dialogRef = this.dialog.open(ConfirmaionsComponent,dialogConfig);
  dialogRef.afterClosed().subscribe(result => {
    if(result){
      this.selecetedCampainsIDs.push(this.selectedElementID);
      this.fillTableData(result);
    }
    else{
      this.form.patchValue({
        selectedActions:null
      })
      this.selectedElementID=""
    }
  });
}
clearAllActions(){
  const dialogConfig=new MatDialogConfig();
  dialogConfig.disableClose = true;
  dialogConfig.height='45vh';
  dialogConfig.width='35vw';
  dialogConfig.maxWidth='100%';
  dialogConfig.minWidth='465px';
  dialogConfig.panelClass='custom-dialog-delete-style'
  dialogConfig.data ={action:'clear'}
 
  const dialogRef = this.dialog.open(ConfirmaionsComponent,dialogConfig);
  dialogRef.afterClosed().subscribe(result => {
    if(result){
      this.clearTableData();
    }
  });
}
  editAction(element){
    if(element.name == "autoReply" || element.name=="sendAndWait" || element.name=="cancel" ) {
      this.openAutoReply(element.name , element)
    }
    else if(element.name == "subscribeToList" ){
      this.openSubscribeToList(element)
    }
    else if(element.name == "enqueryForm" ){
      this.openInquiry(element)
      
    }
    
  }
  openAutoReply(actionName:string,elementData?){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='90vh';
    dialogConfig.width='55vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='565px';
    dialogConfig.disableClose = true;
    dialogConfig.data={data:elementData?.data, actionName:actionName};
    dialogConfig.panelClass = 'responsive-dialog-for-actions-style2';
    const dialogRef = this.dialog.open(AutoReplayComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){

        if(elementData){
        let foundElementFromTable = this.tableData.find((element)=>element.id == elementData.id);
        foundElementFromTable.data=result;
      
        }
        else{
          this.id++;
          this.tableData.push({
            id:this.id,
            name:actionName,
            data:result
            
          })

        }
        this.setActions();
        this.dataSource=new MatTableDataSource<any>(this.tableData)
        this.accordionData=this.tableData

        this.dataSource.paginator = this.paginator;

        this.length=this.tableData.length

      
      }

    });
  }
  openSubscribeToList(elementData?){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='90vh';
    dialogConfig.width='55vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='565px';
    dialogConfig.disableClose = true;
    dialogConfig.data=elementData?.data;
    dialogConfig.panelClass = 'responsive-dialog-for-actions-style2';
    const dialogRef = this.dialog.open(SubscribeToListComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){

        if(elementData){
        let foundElementFromTable = this.tableData.find((element)=>element.id == elementData.id);
        foundElementFromTable.data=result;

        }
        else{
          this.id++;
          this.tableData.push({
          id:this.id,
          name:"subscribeToList",
          data:result
            
          })

        }
        this.setActions();
        this.dataSource=new MatTableDataSource<any>(this.tableData)
        this.accordionData=this.tableData

        this.dataSource.paginator = this.paginator;

        this.length=this.tableData.length

      
      }

    });
  }
  openInquiry(elementData?){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='90vh';
    dialogConfig.width='55vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='565px';
    dialogConfig.disableClose = true;
    dialogConfig.data=elementData?.data;
    dialogConfig.panelClass = 'responsive-dialog-for-actions';
    const dialogRef = this.dialog.open(InquiryComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){

        if(elementData){
        let foundElementFromTable = this.tableData.find((element)=>element.id == elementData.id);
        foundElementFromTable.data=result;

        }
        else{
            this.id++;
            this.tableData.push({
            id:this.id,
            name:"enqueryForm",
            data:result
            
          })

        }
        this.setActions();
        this.dataSource=new MatTableDataSource<any>(this.tableData)
        this.accordionData=this.tableData

        this.dataSource.paginator = this.paginator;

        this.length=this.tableData.length

      
      }

    });
  }
  setActions(){
    this.actions=[];
    this.tableData.map((action)=> {
      if(action.name == "autoReply"){
        const autoReplyObj: any = {
          actionName: "autoReply",
          autoReply: {
            criterias: action.data.criterias,
          },
        };
      
        if (action.data.messageContent) {
          if (typeof action.data.messageContent === 'string' && action.data.messageContent.trim() !== '') {
            autoReplyObj.autoReply.messageContent = action.data.messageContent;
          }
        }
      
        if (action.data.fileData && action.data.fileData.length > 0) {
          autoReplyObj.autoReply.attachments = action.data.fileData.map((file) => {
            return {
              fileUrl: file.url,
              fileName: file.name,
            };
          });
        }
        if(action.data.attachments){
          autoReplyObj.autoReply.attachments = action.data.attachments
        }
        this.actions.push(autoReplyObj);
      }
      
      else if (action.name == "subscribeToList"){
        this.actions.push({
          actionName:"subscribeToList",
          subscribeToList:action.data
        })
      }
      else if (action.name == "sendAndWait"){
        const sendAndWaitObj:any = {
          actionName: "sendAndWait",
          sendAndWait: {
            criterias: action.data.criterias,
          },
        };
      if(action.data.messageContent ){

        if (typeof action.data.messageContent === 'string' && action.data.messageContent.trim() !== '') {
          sendAndWaitObj.sendAndWait.messageContent = action.data.messageContent;
        }
      }
      
      if (action.data.fileData && action.data.fileData.length > 0) {
        sendAndWaitObj.sendAndWait.attachments = action.data.fileData.map((file) => {
          return {
            fileUrl: file.url,
            fileName: file.name,
          };
        });
      }
      if(action.data.attachments){
        sendAndWaitObj.sendAndWait.attachments =action.data.attachments
      }
      
        this.actions.push(sendAndWaitObj);
      }
      // else if (action.name == "forwardedNumbers"){
        
      // }
      // else if (action.name == "email"){
        
      // }
      else if (action.name == "cancel"){
        this.actions.push({
          actionName:"cancel",
          cancel:action.data
        })
      }
      else if (action.name == "enqueryForm"){
        this.actions.push({
          actionName:"enqueryForm",
          enqueryForm:action.data
        })
      }
    
    })
    this.actionsData.emit(this.actions)
  }
  getActions(){
    return this.actions
  }
}
