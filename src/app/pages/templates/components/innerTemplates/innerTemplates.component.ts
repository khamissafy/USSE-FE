import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewChildren,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { TemplatesService } from '../../templates.service';
import {AddTemplateComponent} from '../addTemplate/addTemplate.component'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';

import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { Templates } from '../../templates';
import { SelectionModel } from '@angular/cdk/collections';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TEMPLATESHEADERS } from '../constats/contstants';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DisplayMessageComponent } from 'src/app/pages/messages/Components/display-message/display-message.component';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { TemplatesMobileViewComponent } from '../../mobile-view/templates-mobileView/templates-mobileView.component';
import { arraysContainSameObjects } from 'src/app/shared/methods/arraysContainSameObjects';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';

@Component({
  selector: 'app-innerTemplates',
  templateUrl: './innerTemplates.component.html',
  styleUrls: ['./innerTemplates.component.scss'],
})
export class InnerTemplatesComponent implements OnInit ,AfterViewInit,OnDestroy{
  length: number;
  delay: number = 5;
  active: boolean = false;
  numRows;
  loading:boolean=true;
  isSearch:boolean=false;
  cellClick:boolean;
    noData: boolean;
    notFound: boolean;
  @Input() isCanceled: boolean;
  @Input() canEdit: boolean;

  subscribtions:Subscription[]=[];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('search') search!: ElementRef;

  deletedContacts: string[] = [];
  columns: FormControl;
  displayed: string[] = TEMPLATESHEADERS;
  displayedColumns: string[] = [
    'Template Name',
    'Message',
    'Created At',
    'Action',
  ];
  isSmallScreen: boolean = false;
  @ViewChild(TemplatesMobileViewComponent) mobileView :TemplatesMobileViewComponent

  destroy$: Subject<void> = new Subject<void>();
  searchControl = new FormControl();
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  searchSub: Subscription;
  dataSource: MatTableDataSource<Templates>;
  isDataCalledInMobile: any;
  selectedTimeZone:number=0;

  constructor(
    public dialog: MatDialog,
    private toaster: ToasterServices,
    private templatesService: TemplatesService,
    private breakpointObserver: BreakpointObserver,
    private translationService:TranslationService,
    private timeZoneService:TimeZoneServiceService


  ) {}

  ngAfterViewInit(): void {
    if(this.paginator){
      this.paginator.pageSize=this.templatesService.showsNum
    }
    }
    onChangeSecreanSizes(){
      this.breakpointObserver.observe(['(max-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isSmallScreen = result.matches;
        if(!this.isSmallScreen){
          if(this.paginator){
            this.paginator.pageSize=this.templatesService.showsNum
          }
          if(this.dataSource){
  
            if(!arraysContainSameObjects(this.dataSource.data,this.mobileView.templatesTableData)){
              if(this.mobileView.searchControl.value){
                this.getTemplates()
  
              }
              else{
                this.getDataFromChild(this.mobileView?.templatesTableData,'',this.mobileView.length)
  
              }
            }
          }
           else{
            if(!this.isDataCalledInMobile){
              this.getTemplates()
            }
            else{
              if(this.mobileView.searchControl.value){
                this.getTemplates()
  
              }
              else{
                this.getDataFromChild(this.mobileView?.templatesTableData,'',this.mobileView.length)
  
              }
            }
          } 
        }
        else{
  
            if(this.dataSource){
              setTimeout(() => {
                if(this.searchControl.value){
                  this.mobileView?.getTemplates();
    
                }
                else{
                  this.mobileView?.getDataFromParent(this.dataSource.data,'',this.length)
    
                }
            }, 100);
            }
            else{
              setTimeout(() => {
  
                this.mobileView?.getTemplates('');
                this.isDataCalledInMobile=true;
  
              }, 100);
            }
          
          
        }
      });
    }

  ngOnInit() {
    this.setTimeZone();
    this.columns = new FormControl(this.displayedColumns);
    this.displayedColumns=this.canEdit?[
      'Template Name',
      'Message',
      'Created At',
      'Action',
    ]: ['Template Name', 'Message', 'Created At'];
this.onChangeSecreanSizes();
  }

  setTimeZone(){
    let sub = this.timeZoneService.timezone$.subscribe(
      res=> this.selectedTimeZone=res

    )
    this.subscribtions.push(sub)
  }
  openDeleteModal(id:string){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.height='50vh';
    dialogConfig.width='35vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='465px';
    dialogConfig.data =
    {
      templatesData:{templatesId:id}
    }
    const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getTemplates();
      }
    });
  }





  openEditModal(data?){
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='77vh';
    dialogConfig.width='40vw';
    dialogConfig.maxWidth='100%';
    dialogConfig.minWidth='720px';
    dialogConfig.maxHeight='85vh';
    dialogConfig.disableClose = true;

    dialogConfig.data=data ;

    const dialogRef = this.dialog.open(AddTemplateComponent,dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getTemplates();
            }
    });

  }
  getTemplatesReq(searchVal){
    let showsNum=this.templatesService.showsNum;
    let pageNum=searchVal?0 :this.templatesService.pageNum;
    let email=this.templatesService.email;
    let orderedBy=this.templatesService.orderedBy;
    let search=searchVal?searchVal:"";
    this.loading = true;
    if(searchVal && this.paginator){
      this.paginator.pageIndex=0
    }
     return this.templatesService.getTemplates(email,showsNum,pageNum,orderedBy,search)
  }
  getDataFromChild(data,search,length){
    if(this.searchSub){
      this.searchSub.unsubscribe();
      this.searchSub=null;
  
      this.searchForm.patchValue({
        searchControl:''
      })
    }
    this.handleGetTemplatesResponce(data,search,length)
    this.setupSearchSubscription()
  
  }
  handleGetTemplatesResponce(res,search,count?){
    this.numRows=res.length;
    this.loading = false;
    this.dataSource=new MatTableDataSource<Templates>(res)
  
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
      this.paginator.pageIndex=this.templatesService.pageNum      
    }
    this.notFound=false;
    if(count){
      this.length=count;
      this.loading = false;
      if( this.length==0){
        this.noData=true;
  
      
      }
      else{
        this.noData=false;
  
    
      }
    }
    else{
      this.templatesCount();

    }

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
    switchMap(searchVal => this.getTemplatesReq(searchVal))
  ).subscribe(
    res => this.handleGetTemplatesResponce(res,this.searchControl.value),
    err => this.handleError()
  );
  this.subscribtions.push(this.searchSub);
}
getTemplates(searchVal?){
    let search=searchVal?searchVal:"";
    if(this.searchSub){
      this.searchSub.unsubscribe();
      this.searchSub=null;

      this.searchForm.patchValue({
        searchControl:''
      })
    }
        this.getTemplatesReq(search).subscribe(
            (res)=>{
              this.handleGetTemplatesResponce(res,search);
              this.setupSearchSubscription()

            },
            (err)=>{
            this.handleError()
      
            })
        }

templatesCount(){
let email=this.templatesService.email;
this.loading = true;

this.templatesService.listTemplatesCount(email).subscribe(
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




     onSearch(event: any) {

    this.getTemplates( event.value);
  }



  changeColumns(event) {
    if(this.canEdit){
      this.displayedColumns = [ ...event, 'Action'];

    }
    else{
      this.displayedColumns = [ ...event];

    }
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
      dialogConfig.data={template:row};
      const dialogRef = this.dialog.open(DisplayMessageComponent,dialogConfig);
  
      dialogRef.afterClosed().subscribe(result => {
        if(result){
        }
  
      });
    }
  }

  onPageChange(event){
    this.templatesService.showsNum=event.pageSize;
    this.templatesService.pageNum=event.pageIndex;


    this.getTemplates();

  }
  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
    this.subscribtions.map(e=>e.unsubscribe());
  }
  
}
