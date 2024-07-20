import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { compaignDetails } from '../../../campaigns';
import { CompaignsService } from '../../../compaigns.service';
import { ReportSummaryComponent } from '../components/reportSummary/reportSummary.component';
import { CompaignsDetailsService } from '../compaignsDetails.service';
import { RecipientActivitiesComponent } from '../components/recipientActivities/recipientActivities.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { ResendMessagesComponent } from 'src/app/pages/messages/Components/resendMessages/resendMessages.component';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';

@Component({
  selector: 'app-compaignsDetails',
  templateUrl: './compaignsDetails.component.html',
  styleUrls: ['./compaignsDetails.component.scss']
})
export class CompaignsDetailsComponent implements OnInit ,AfterViewInit,OnDestroy{
  compaignId:string;
  compaign:compaignDetails;
  @ViewChild(ReportSummaryComponent) reportSummaryComponent:ReportSummaryComponent;
  @ViewChild(RecipientActivitiesComponent) recipientActivitiesComponent:RecipientActivitiesComponent;
  selectedTab="summary";
  tabs=["summary","activity"]
  length: number;
  selectedTimeZone:number=0;
  subscriptions: any=[];
  utcTime:{
    sendingoutFrom:any,
    sendingoutTo:any
  }
  constructor(private activeRoute:ActivatedRoute,public dialog: MatDialog,
    private compaignsService:CompaignsService,
    private campaignDetailsService:CompaignsDetailsService,
    private toaster: ToasterServices,
    private authService:AuthService,
    private router:Router,
    private timeZoneService:TimeZoneServiceService
  ) {
    activeRoute.paramMap.subscribe((data)=>
    {
    this.compaignId=data.get('id');

    })
  }
  ngOnDestroy(): void {
    this.subscriptions.map((sub)=>sub.unsubscribe())
  }
  ngAfterViewInit() {
    this.reportSummaryComponent.compaign=this.compaign
    this.reportSummaryComponent.compaignId=this.compaignId;
    // this.listContacts.count=this.count;
    // this.listContacts.getContacts();
        }

  ngOnInit() {
    this.getCompaignData();
    this.setTimeZone();

    }
  
    setTimeZone(){
      let sub = this.timeZoneService.timezone$.subscribe(
        res=>{ this.selectedTimeZone=res;
          setTimeout(() => {
            this.reportSummaryComponent?.convertFromUtcToLocal(this.utcTime);

          }, 0);
        }

  
      )
      this.subscriptions.push(sub)
    }
    resetTableData(ev){
      // this.compaignDetailsService.display=10;
      // this.compaignDetailsService.pageNum=0;
      this.selectedTab = this.tabs[ev.index]

    }
    getCompaignData(){
      this.compaignsService.getCampaignById(this.compaignId).subscribe(
      (res)=>{
        this.utcTime={
          sendingoutFrom:res.sendingoutFrom,
          sendingoutTo:res.sendingoutTo
        }
          this.compaign=res;
          this.compaign.sendingoutFrom=this.campaignDetailsService.convertUTCToLocal(this.compaign.sendingoutFrom,this.timeZoneService.getTimezone())
          this.compaign.sendingoutTo=this.campaignDetailsService.convertUTCToLocal(this.compaign.sendingoutTo,this.timeZoneService.getTimezone())
         
      },
      (err)=>{

      }
      )
    }
  
    resendAllCampaigns(){
      
      const dialogConfig=new MatDialogConfig();
      dialogConfig.disableClose = true;
      dialogConfig.height='50vh';
      dialogConfig.width='35vw';
      dialogConfig.maxWidth='100%';
      dialogConfig.minWidth='465px';
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
        this.recipientActivitiesComponent.getComMessages()
        }
      });
    }
    backToCompaigns(){
      this.router.navigateByUrl('compaigns')
        }
        getTabLength(ev){
          this.length=ev
        }
  }

