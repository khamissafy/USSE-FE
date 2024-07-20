import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { compaignDetails } from '../../campaigns';
import { DevicesPermissions, CompaignsService } from '../../compaigns.service';
import { CAMPAIGNSHEADER } from '../../constants/contstants';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-campaigns-mobileView',
  templateUrl: './campaigns-mobileView.component.html',
  styleUrls: ['./campaigns-mobileView.component.scss']
})
export class CampaignsMobileViewComponent implements OnInit {
  isUser: boolean;
  length: number = 0;
  loading: boolean = true;
  cellClick: boolean = false;
  isCompagins: boolean = true;
  columns: FormControl;
  displayed: string[] = CAMPAIGNSHEADER.slice(1);
  displayedColumns: string[] = ['Name', 'Status', 'Creator Name', 'Start Date', 'Action'];
  dataSource: MatTableDataSource<compaignDetails>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Output() addCampaign = new EventEmitter<boolean>
  noData: boolean = false;
  notFound: boolean = false;
  canEdit: boolean = true;
  // devices
  devices: SelectOption[];

  deviceLoadingText: string = 'Loading ...';
  devicesData: any = new FormControl([]);
  form = new FormGroup({
    devicesData: this.devicesData,
  });
  deviceId: string;
  permission: DevicesPermissions[];
  display: number;
  pageNum: number = 0;

  showsOptions: SelectOption[] = [
    { title: '10', value: 10 },
    { title: '50', value: 50 },
    { title: '100', value: 100 }


  ];
  showsSelectedOptions: any = new FormControl([]);

  displayForm = new FormGroup({
    showsSelectedOptions: this.showsSelectedOptions,

  });
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  selectedSortingName: string = 'name';
  selectedSortingType: string = 'ASC'
  orderedBy: string = '';
  topSortingOptions: any = [{ opitonName: 'name', lable: `${this.translate.instant('nameLabel')}`, isSelected: true }
    , { opitonName: 'createdAt', lable: `${this.translate.instant('CREATE_AT')}`, isSelected: false }]

  bottomSortingOptions: any = [{ opitonName: 'ASC', lable: `${this.translate.instant('ASCENDING')}`, isSelected: true },
  { opitonName: 'DEC', lable: `${this.translate.instant('DESCENDING')}`, isSelected: false }]

  messagesTableData: any = []
  subscribtions: any=[];
  openedDialogs: any=[];
  searchSub: any;
  alldevices: any[];
  @Input() selectedTimeZone :number=0;

  constructor(private compaignsService: CompaignsService,
    public dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService,
  ) {
    this.display = compaignsService.getUpdatedDisplayNumber();
    this.pageNum = this.compaignsService.pageNum;
  }


  ngOnInit() {
    this.displayForm.patchValue({
      showsSelectedOptions: {
        title: String(this.compaignsService.getUpdatedDisplayNumber()),
        value: this.compaignsService.getUpdatedDisplayNumber(),
      }
    })
    // set default device to be first one

    // get device's messages
    this.permission = this.compaignsService.devicesPermissions;
    if (this.authService.getUserInfo()?.customerId != "") {
      this.isUser = true;
    }
    else {
      this.isUser = false;
    }
    // this.getDevices();



    this.columns = new FormControl(this.displayedColumns)

  }
  ngAfterViewInit() {
  }

  getDevicePermission(deviceId: string) {
    if (this.permission && this.isUser) {

      let devicePermissions = this.permission.find((e) => e.deviceId == deviceId);
      if (devicePermissions) {
        let value = devicePermissions.value;
        this.displayedColumns = value == "FullAccess" ? ['Name', 'Status', 'Creator Name', 'Start Date', 'Action'] : ['Name', 'Status', 'Creator Name', 'Start Date'];
        this.canEdit = value == "ReadOnly" ? false : true;
      }
      else {
        this.displayedColumns = ['Name', 'Status', 'Creator Name', 'Start Date'];
        this.canEdit = false;
      }

    }
    if (!this.permission && this.isUser) {
      this.displayedColumns = ['Name', 'Status', 'Creator Name', 'Start Date'];
      this.canEdit = false;
    }

  }
  handleResponce(res,campains?,length?){
    this.alldevices = [];

    this.alldevices = res;
  
    if (this.permission) {
  
      this.alldevices.map((device) => {
        let found = this.permission.find((devP) => devP.deviceId == device.id && devP.value == "None");
        if (found) {
          this.alldevices.splice(this.alldevices.indexOf(device), 1)
        }
      }
      )
    }
  
    this.devices = this.alldevices.map(res => {
      return {
        title: res.deviceName,
        value: res.id,
        deviceIcon: res.deviceType
      }
    });
    if (this.devices.length == 0) {
      this.loading = false;
      this.length = 0;
      this.noData = true;
    }
    else {
      this.noData = false
  
      this.deviceId = res[0].id;
  
      this.getDevicePermission(this.deviceId);
  
      if (this.authService.selectedDeviceId == "") {
  
        this.form.patchValue({
          devicesData: {
            title: this.alldevices[0]?.deviceName,
            value: this.alldevices[0]?.id,
            deviceIcon: this.alldevices[0].deviceType
          }
  
        })
      }
      else {
        let selected = this.devices.find((device) => device.value == this.authService.selectedDeviceId)
        this.deviceId = this.authService.selectedDeviceId;
        this.form.patchValue({
          devicesData: {
            title: selected.title,
            value: selected?.value,
            deviceIcon: selected.deviceIcon
          }
  
        })
      }
      if(campains){
        this.messagesTableData=campains;
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
getDataFromParent(res,campains,length){
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
  // get devices data
  getDevices() {
    this.authService.getDevices(this.authService.getUserInfo()?.email, 10, 0, "", "").subscribe(
      (res) => {
      this.handleResponce(res)
      },
      (err) => {
        this.loading = false;
        this.length = 0;
        this.noData = true;
      }
    )
  }
  onSelect(device) {
    this.deviceId = device.value;
    this.authService.selectedDeviceId = device.value
    this.getCompaigns(this.deviceId)
    this.getDevicePermission(this.deviceId);
  }

  backToCompaigns(event) {
    this.isCompagins = event;
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
    this.messagesTableData=res;
        if(search!=""){
          this.length=res.length;
          this.loading = false;

          if(this.length==0){
            this.notFound=true;
          }
          else{
            this.notFound=false;
          }
        }
        else {
          if (this.paginator) {
            this.paginator.pageIndex = this.pageNum
          }
          this.notFound = false;
          this.compaignsCount(deviceId);


        }
  }
  
  handleError(): void {
    this.loading = false;
    this.length = 0;
    this.notFound = true;
  }
  compaignsCount(deviceId) {
    this.loading = true
    let email = this.authService.getUserInfo()?.email;
    this.compaignsService.compaignsCount(email, deviceId).subscribe(
      (res)=>{
        this.length=res;
        this.loading=false
        if(this.length ==0){
          this.notFound=true;
        }
      }
      ,(err)=>{
        this.length=0;
        this.loading=false
        this.noData=true;

      }
    )

  }
  backToCampaign() {
    this.isCompagins = true;
    this.getCompaigns(this.deviceId)

  }
  changeColumns(event) {

    this.displayedColumns = this.canEdit ? [...event, "Action"] : [...event]
  }

  addCampaigns() {
    this.addCampaign.emit(true)
  }
  onPageSizeChange(event) {
    this.compaignsService.display = event.value;
    this.compaignsService.updateDisplayNumber(event.value)
    this.pageNum = 0;

    if (this.paginator) {
      this.paginator.pageSize = event.value;
      this.paginator.pageIndex = 0;
    }
    this.getCompaigns(this.deviceId);

  }

  onPageChange(event) {
    this.pageNum = event.pageIndex;
    this.getCompaigns(this.deviceId)
  }

  campaignDetails(com: compaignDetails) {
    if (!this.cellClick) {
      let id = com.id;
      this.router.navigateByUrl(`compaign/${id}`)
    }
  }
  stopCampaign(element) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.height='54vh';
    dialogConfig.width='90vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='80%';
    dialogConfig.minHeight='428';
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'custom-mat-dialog-container';
    dialogConfig.data =
    {
      compaignData: { compaignId: element.id, action: "stop" }
    }
    const dialogRef = this.dialog.open(DeleteModalComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getCompaigns(this.deviceId);
      }
    });
    this.openedDialogs.push(dialogRef)


  }
  deleteCampaign(element) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.height='54vh';
    dialogConfig.width='90vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='80%';
    dialogConfig.minHeight='428';
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'custom-dialog-delete-style';
    dialogConfig.data =
    {
      compaignData: { compaignId: element.id, action: "delete" }
    }
    const dialogRef = this.dialog.open(DeleteModalComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getCompaigns(this.deviceId);
      }
    });
    this.openedDialogs.push(dialogRef)

  }

  onSearch(event: any) {

    this.getCompaigns(this.deviceId, event.value);
  }
  ngOnDestroy(): void {
    this.openedDialogs.forEach((dialog) => {
      if (dialog) {
        dialog.close();
      }
    })

    this.subscribtions.map(e => e.unsubscribe());
    this.compaignsService.search = '';
  }
}
