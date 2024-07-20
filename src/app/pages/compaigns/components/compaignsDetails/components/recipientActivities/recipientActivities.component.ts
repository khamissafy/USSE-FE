import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { CompainMessages, compaignDetails } from 'src/app/pages/compaigns/campaigns';
import { FormControl, FormGroup } from '@angular/forms';
import { CompaignsDetailsService } from '../../compaignsDetails.service';
import { RECEPEINTHEADERS } from 'src/app/pages/compaigns/constants/contstants';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CompaignsService } from 'src/app/pages/compaigns/compaigns.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ResendMessagesComponent } from 'src/app/pages/messages/Components/resendMessages/resendMessages.component';
import { TranslateService } from '@ngx-translate/core';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';



@Component({
  selector: 'app-recipientActivities',
  templateUrl: './recipientActivities.component.html',
  styleUrls: ['./recipientActivities.component.scss']
})
export class RecipientActivitiesComponent implements OnInit, AfterViewInit,OnDestroy {
  columns :FormControl;
  displayed: string[] = RECEPEINTHEADERS;
  displayedColumns: string[] = ['Mobile Number', 'Name', 'Updated At', 'Status',"Ation"];
  loading:boolean=true;
  length:number=0;
  filterdData :any= new FormControl([]);
  filteringForm= new FormGroup({
    filterdData:this.filterdData,
  });
filters:any;
@Output() tableDataLength = new EventEmitter<number>;

  dataSource:MatTableDataSource<CompainMessages>;
  @Input() compaignId:string;

  @Input() compaign!:compaignDetails;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  display: number;
  pageNum: number;
  selectedTimeZone:number=0;

  isSmallScreen: boolean = false;

    selectedItems:any=[
      {title:this.translate.instant("Pending") ,value:1},
      {title:this.translate.instant("Sent") ,value:2},
      {title:this.translate.instant("Delivered") ,value:3},
      {title:this.translate.instant("Read") ,value:4},
      {title:this.translate.instant("failedLabel") ,value:5},
    
    ]
    
  showsOptions: SelectOption[] = [
    { title: '10', value: 10 },
    { title: '50', value: 50 },
    { title: '100', value: 100 }


  ];
  showsSelectedOptions: any = new FormControl([]);

  displayForm = new FormGroup({
    showsSelectedOptions: this.showsSelectedOptions,

  });

  selectedSortingName: string = 'name';
  selectedSortingType: string = 'ASC'
  orderedBy: string = '';
  topSortingOptions: any = [{ opitonName: 'name', lable: `${this.translate.instant('nameLabel')}`, isSelected: true }
    , { opitonName: 'createdAt', lable: `${this.translate.instant('CREATE_AT')}`, isSelected: false }]

  bottomSortingOptions: any = [{ opitonName: 'ASC', lable: `${this.translate.instant('ASCENDING')}`, isSelected: true },
  { opitonName: 'DEC', lable: `${this.translate.instant('DESCENDING')}`, isSelected: false }]

  destroy$: Subject<void> = new Subject<void>();
  sub:any;
  constructor(private compaignDetailsService:CompaignsDetailsService,public dialog: MatDialog,
    private compaignsService:CompaignsService,
    private authService:AuthService,
    private translate:TranslateService,
    private breakpointObserver: BreakpointObserver,
    private timeZoneService:TimeZoneServiceService
  ) {
      this.display=compaignsService.getUpdatedDisplayNumber();
      this.pageNum=this.compaignsService.pageNum;
      this.filters=[
        {title:this.translate.instant("Pending") ,value:1},
        {title:this.translate.instant("Sent") ,value:2},
        {title:this.translate.instant("Delivered") ,value:3},
        {title:this.translate.instant("Read") ,value:4},
        {title:this.translate.instant("failedLabel") ,value:5},
      
      ]
    }
  ngOnInit() {
    this.setTimeZone();
    this.breakpointObserver.observe(['(max-width: 768px)'])
.pipe(takeUntil(this.destroy$))
.subscribe(result => {
  this.isSmallScreen = result.matches;
  if(this.isSmallScreen){
    this.displayed= RECEPEINTHEADERS.filter((_, index) => index !==1);

  }
  else{
    this.displayed= RECEPEINTHEADERS;

  }
 
});
this.displayForm.patchValue({
  showsSelectedOptions: {
  title:String(this.compaignsService.getUpdatedDisplayNumber()),
  value:this.compaignsService.getUpdatedDisplayNumber(),
  }
  })
    this.columns=new FormControl(this.displayedColumns)
    this.filteringForm.patchValue({
      filterdData:this.selectedItems
    }
    
    )
    this.getComMessages()
  }
  setTimeZone(){
    this.sub = this.timeZoneService.timezone$.subscribe(
      res=> this.selectedTimeZone=res

    )
    
  }

  getComMessages(filteredData?){
  let shows=this.compaignDetailsService.display;
  let email=this.authService.getUserInfo()?.email;


  this.loading = true;
  this.getComMessagesCount(filteredData);

    this.compaignDetailsService.listCampaignMessages(this.compaignId,email,shows,this.pageNum,filteredData).subscribe(
      (res)=>{
        this.loading = false;

    this.dataSource=new MatTableDataSource<CompainMessages>(res);
        },
        (err)=>{
          this.loading = false;
          this.length=0;
          this.tableDataLength.emit(this.length)

        }
    )

  }
  getComMessagesCount(filteredData?){
    this.loading=true
    this.compaignDetailsService.listCampaignMessagesCount(this.compaignId,filteredData).subscribe(
      (res)=>{
        this.length=res;
        this.tableDataLength.emit(this.length)
        this.loading=false

      }
      ,(err)=>{
        this.length=0;
        this.loading=false

        this.tableDataLength.emit(this.length)
      }
    )
  }
  ngAfterViewInit() {
  }
  onPageSizeChange(event) {
    this.compaignsService.display = event.value;
    this.compaignsService.updateDisplayNumber(event.value)
    this.pageNum = 0;

    if (this.paginator) {
      this.display=event.value
      this.paginator.pageSize = event.value;
      this.paginator.pageIndex = 0;
    }
    this.getComMessages();

  }
  onPageChange(event){
    this.compaignDetailsService.display=event.pageSize;
    this.pageNum=event.pageIndex;
    this.compaignsService.updateDisplayNumber(event.pageSize)
    this.displayForm.patchValue({
      showsSelectedOptions: {
      title:String(event.pageSize),
      value:event.pageSize,
      }
      })
    this.getComMessages();
  }
  changeColumns(event){
    this.displayedColumns=[...event]


  }
  reSendCampaingMessage(messageId,failedCampaignId){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='40vh';
    dialogConfig.width='90%';
    dialogConfig.minHeight='428';
    dialogConfig.maxWidth='100vw';
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'custom-mat-dialog-container';
    dialogConfig.data ={
      from:"CampaignDetails",
      data: {
        campaignId:failedCampaignId,
        messageIds:[messageId],
        email: this.authService.getUserInfo().email,
        resentAllFailedMessages: false
      }
    }
    
    const dialogRef = this.dialog.open(ResendMessagesComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getComMessages();
      }
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  if(this.sub){
    this.sub.unsubscribe()
  }
    this.compaignDetailsService.display=10;
    this.compaignDetailsService.pageNum=0;
  }
  selectFilter(item){
    // this.selectedItems.push(item);
      let selected= this.selectedItems.map((sel)=>sel.value-1)
     this.getComMessages(selected)
    }
    deselectFilter(item){
      let selected= this.selectedItems.map((sel)=>sel.value-1)
      this.getComMessages(selected)

    }
    resendAllCampaigns(){
      const dialogConfig=new MatDialogConfig();
      dialogConfig.height='40vh';
      dialogConfig.width='90%';
      dialogConfig.minHeight='428';
      dialogConfig.maxWidth='100vw';
      dialogConfig.disableClose = true;
      dialogConfig.panelClass = 'custom-mat-dialog-container';
      dialogConfig.data ={
        from:"CampaignDetails",
        data: {
          campaignId: this.compaignId,
          email: this.authService.getUserInfo().email,
          resentAllFailedMessages: true
        }
      }
     
      const dialogRef = this.dialog.open(ResendMessagesComponent,dialogConfig);
      dialogRef.afterClosed().subscribe(result => {
        if(result){
        this.getComMessages()
        }
      });
    }
}
