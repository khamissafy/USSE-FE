import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Attatchment, Templates } from 'src/app/pages/templates/templates';
import { TemplatesService } from 'src/app/pages/templates/templates.service';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';

export interface files{
  name:string,
  type:string,
  url:string,
  size:number
}
@Component({
  selector: 'app-write-message',
  templateUrl: './write-message.component.html',
  styleUrls: ['./write-message.component.scss']
})
export class WriteMessageComponent implements OnInit {
  templates:SelectOption[];
  allTemplates:Templates[]=[];
  fileData:files[]=[];
  templateLoadingText:string='Loading ...';
  // @Output() messageBody = new EventEmitter<string>;
  @Output() attachments = new EventEmitter<string[]>;
  @Output() emptyMessageAndFiles=new EventEmitter<boolean>;
  messageBody:string="";
  loading:boolean=false;
  templatesData = new FormControl([]);
  message = new FormControl('',[Validators.required]);
  files:boolean=false;
  @Output() formValidityChange = new EventEmitter<boolean>(true);
  @Output() filesAndMessage=new EventEmitter<any>
  form = new FormGroup({
    templatesData:this.templatesData,
    message:this.message
  });
  constructor(private templateService:TemplatesService) { }

  ngOnInit() {
    this.formValidityChange.emit(this.form.valid);

    this.form.valueChanges.subscribe(() => {
      this.emptyMessageAndFiles.emit(!this.form.valid && !this.files)

    });
    this.getTemplates();
  }
  filesAndMessageToParent(){
    this.filesAndMessage.emit({files:this.fileData.map((file)=>file.url) , message: this.form.value.message})
  }
  getTemplates(){

    this.templateService.getTemplates(10,0,"","").subscribe(
      (res)=>{
        this.allTemplates=res;
        this.templates = this.allTemplates.map(res=>{
          return {
            title:res.templateName,
            value:res.id
          }
        });
        if(res.length==0){
          this.templateLoadingText='No Results'
        }
       },
       (err)=>{

       })
  }
  // next(){
  //   this.selectedtemplates = this.form.value.templatesData.map((e)=>e.value);

  // }
  onSelect(event){
    let template=this.allTemplates.find((t)=>t.id==event.value);
    this.form.patchValue({
      message:template.messageBody
    });
    this.loading=true;

    this.templateService.getTemplateById(event.value).subscribe(
      (res)=>{
        this.loading=false;

          let attachments=res.result.attachments;
          // console.log("attachment",attachments)
          this.fileData=attachments.map((attach)=>{
            let size=this.templateService.calculateFileSizeInKB(attach.base64);
            let type = this.templateService.extractTypeFromBase64(attach.base64)
            return{
              name:attach.fileName,
              type:type,
              url:attach.base64,
              size:size
            }
          })
          if(this.fileData.length > 0){
            this.files=true;
            this.emptyMessageAndFiles.emit(!this.form.valid && !this.files)
          }
      },
      (err)=>{
        this.loading=false;

      }
    )



    // })




    this.messageBody=(this.form.value.message)

//  console.log("file data",this.fileData);


  }


  onFileChange(e){
    this.files=true;
    this.emptyMessageAndFiles.emit(!this.form.valid && !this.files)

  }
  onFileDelete(e){
    this.files=this.fileData.length==0? false : true;
    this.emptyMessageAndFiles.emit(!this.form.valid && !this.files)

  }
}

