import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {SelectionModel} from '@angular/cdk/collections';
import { FormControl, FormGroup } from '@angular/forms';
import { CompaignsService, DevicesPermissions } from '../compaigns.service';
import { Router } from '@angular/router';
import { compaignDetails } from '../campaigns';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { CAMPAIGNSHEADER } from '../constants/contstants';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { CampaignsMobileViewComponent } from '../mobile view/campaigns-mobileView/campaigns-mobileView.component';
import { arraysContainSameObjects } from 'src/app/shared/methods/arraysContainSameObjects';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';

@Component({
  selector: 'app-compaigns',
  templateUrl: './compaigns.component.html',
  styleUrls: ['./compaigns.component.scss']
})
export class CompaignsComponent implements AfterViewInit ,OnInit,OnDestroy {
  isUser:boolean;
  length:number=0;
  loading:boolean=true;
  cellClick:boolean=false;
  isCompagins:boolean=true;
  columns :FormControl;
  displayed: string[] = CAMPAIGNSHEADER;
  displayedColumns: string[] = ['Name', 'Status', 'Creator Name', 'Start Date','Action'];
  dataSource:MatTableDataSource<compaignDetails>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  noData: boolean=false;
  notFound: boolean=false;
  canEdit: boolean=true;
  // devices
  devices:SelectOption[];
  subscribtions:Subscription[]=[]
  deviceLoadingText:string='Loading ...';
  devicesData :any= new FormControl([]);
  form = new FormGroup({
    devicesData:this.devicesData,
  });
  deviceId:string;
  permission:DevicesPermissions[];
  display: number;
  pageNum: number;
  isSmallScreen: boolean = false;
  destroy$: Subject<void> = new Subject<void>();
  searchSub: any;
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  @ViewChild(CampaignsMobileViewComponent) mobileView :CampaignsMobileViewComponent
  alldevices: any[];
  isDataCalledInMobile: any;
  selectedTimeZone:number=0;

  constructor(private compaignsService:CompaignsService,
    public dialog: MatDialog, 
    private router:Router,
    private authService:AuthService,
    private timeZoneService:TimeZoneServiceService,
    private breakpointObserver: BreakpointObserver
    ){
    this.display=compaignsService.getUpdatedDisplayNumber();
    this.pageNum=this.compaignsService.pageNum;
  }


  ngOnInit() {
    this.setTimeZone();

// set default device to be first one

// get device's messages
this.permission =this.compaignsService.devicesPermissions;
if(this.authService.getUserInfo()?.customerId!=""){
  this.isUser=true;
}
else{
  this.isUser=false;
}
    this.columns=new FormControl(this.displayedColumns)
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
      if(this.isCompagins){
          if(!this.isSmallScreen){

          
              if(this.dataSource){

              if(!arraysContainSameObjects(this.dataSource?.data,this.mobileView?.messagesTableData)){
                if(this.mobileView?.searchControl.value){
                  this.getDevices()
                }
                else{
                  this.getDataFromChild(this.mobileView?.alldevices,this.mobileView?.messagesTableData,this.mobileView?.length)

                }
              }
            }
            else{
              if(!this.isDataCalledInMobile){
                this.getDevices()
              }
              else{
                if(this.mobileView?.searchControl?.value){
                  this.getDevices()
                }
                else{
                  this.getDataFromChild(this.mobileView?.alldevices,this.mobileView?.messagesTableData,this.mobileView?.length)

                }
              }
            } 
          }
          else{

              if(this.dataSource){
                setTimeout(() => {
                  if(this.searchControl.value){
                    this.mobileView?.getDevices();
                  }
                  else{
                    this.mobileView?.getDataFromParent(this.alldevices,this.dataSource.data,this.length)

                  }
              }, 100);
              }
              else{
                setTimeout(() => {

                  this.mobileView?.getDevices();
                  this.isDataCalledInMobile=true;

                }, 100);
              }
            
            
          }
    }
    });
  }
  handleResponce(res,campaigns?,length?){
    this.alldevices=[];

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
    }
    else{
      this.noData=false

      this.deviceId=res[0].id;

    this.getDevicePermission(this.deviceId);

    if(this.authService.selectedDeviceId ==""){

      this.form.patchValue({
      devicesData: {
      title:this.alldevices[0]?.deviceName,
      value:this.alldevices[0]?.id,
      deviceIcon:this.alldevices[0].deviceType
      }

      })
    }
    else{
      let selected= this.devices.find((device)=>device.value==this.authService.selectedDeviceId)
      this.deviceId=this.authService.selectedDeviceId;
      this.form.patchValue({
        devicesData: {
        title:selected.title,
        value:selected?.value,
        deviceIcon:selected.deviceIcon
        }

        })
    }
    if(campaigns){
      this.dataSource=new MatTableDataSource<compaignDetails>(campaigns);

      this.length=length;
      this.loading=false
      if(this.length ==0){
        this.notFound=true;
      }
    }
    else{
      this.getCompaigns(this.deviceId);

    }

  }
  }
  getDataFromChild(res,campains,length){
    if(this.searchSub){
      this.searchSub.unsubscribe();
      this.searchSub=null;
  
      this.searchForm.patchValue({
        searchControl:''
      })
    }
    this.handleResponce(res,campains,length);
    this.setupSearchSubscription()
  }
  ngAfterViewInit() {
    if(this.paginator){
      this.paginator.pageSize=this.display
    }
  }

  getDevicePermission(deviceId:string){
    if(this.permission && this.isUser){

      let devicePermissions=this.permission.find((e)=>e.deviceId==deviceId);
      if(devicePermissions){
      let value=devicePermissions.value;
      this.displayedColumns=value=="FullAccess"?['Name', 'Status', 'Creator Name', 'Start Date','Action']:['Name', 'Status', 'Creator Name', 'Start Date'];
      this.canEdit=value=="ReadOnly"?false:true;
      }
      else{
        this.displayedColumns=['Name', 'Status', 'Creator Name', 'Start Date'];
        this.canEdit=false;
      }

    }
    if(!this.permission && this.isUser){
      this.displayedColumns=['Name', 'Status', 'Creator Name', 'Start Date'];
      this.canEdit=false;
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
onSelect(device){
  this.deviceId=device.value;
  this.authService.selectedDeviceId=device.value
  this.getCompaigns(this.deviceId)
  this.getDevicePermission(this.deviceId);
}

backToCompaigns(event){
this.isCompagins=event;
this.getCompaigns(this.deviceId);
}

  getCompaigns(deviceId:string,searchVal?){
    if(this.searchSub){
      this.searchSub.unsubscribe();
      this.searchSub=null;
      this.searchForm.patchValue({
        searchControl:''
      })
    }
    
    let search=searchVal?searchVal:"";
    this.loading = true;
 
    this.getCampaignsReq(deviceId,search).subscribe(
      (res)=>{
      this.handleGetCampaignssResponse(deviceId,res,search);
      this.setupSearchSubscription();

      },
      (err)=>{
       this.handleError()

      }
    )
  }
  setupSearchSubscription(): void {
    this.searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(700), // Wait for 1s pause in events
      distinctUntilChanged(), // Only emit if value is different from previous value
      switchMap(searchVal => this.getCampaignsReq(this.deviceId,searchVal))
    ).subscribe(
      res => this.handleGetCampaignssResponse(this.deviceId,res, this.searchControl.value),
      err => this.handleError()
    );
    this.subscribtions.push(this.searchSub);
  }
  
  getCampaignsReq(deviceId:string,searchVal?){
    let shows=this.compaignsService.display;
    let email=this.authService.getUserInfo()?.email;
    let search=searchVal?searchVal:"";
    this.loading = true;
    let pageNumber=searchVal?0:this.pageNum
    if(searchVal && this.paginator){
      this.paginator.pageIndex=0
    }
  return  this.compaignsService.getCampaigns(email,shows,pageNumber,search,deviceId)
    }

  handleGetCampaignssResponse(deviceId,res,search): void {
    this.loading = false;
    this.dataSource=new MatTableDataSource<compaignDetails>(res);
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
      if(this.paginator){
        this.paginator.pageIndex=this.pageNum
      }
      this.notFound=false;
      this.compaignsCount(deviceId);


    }
  }
  
  handleError(): void {
    this.loading = false;
    this.length = 0;
    this.notFound = true;
  }
compaignsCount(deviceId){
  this.loading=true
  let email=this.authService.getUserInfo()?.email;
  this.compaignsService.compaignsCount(email,deviceId).subscribe(
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
backToCampaign(){
  this.isCompagins=true;
  this.getCompaigns(this.deviceId)

}
  changeColumns(event){

    this.displayedColumns=this.canEdit?[...event,"Action"]: [...event]
    }

  addCampaigns(){
    this.compaignsService.search='';
    this.isCompagins=false;
  }

  onPageChange(event){
    this.compaignsService.display=event.pageSize;
    this.pageNum=event.pageIndex;
    this.compaignsService.updateDisplayNumber(event.pageSize)
    this.getCompaigns(this.deviceId);

  }

  campaignDetails(com:compaignDetails){
    if(!this.cellClick){
      let id=com.id;
      this.router.navigateByUrl(`compaign/${id}`)
    }
  }
  stopCampaign(element){

    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.data =
    {
      compaignData:{compaignId:element.id,action:"stop"}
    }
    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getCompaigns(this.deviceId);
      }
    });


  }
  deleteCampaign(element){

    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.data =
    {
      compaignData:{compaignId:element.id,action:"delete"}
    }
    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getCompaigns(this.deviceId);
      }
    });
  }

  onSearch(event:any){

    this.getCompaigns(this.deviceId,event.value);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  
    this.subscribtions.map(e=>e.unsubscribe());

    this.compaignsService.search='';
  }
}

