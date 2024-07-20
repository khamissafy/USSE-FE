import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input-gg';
import { Contacts } from 'src/app/pages/manage-contacts/contacts';
import { ListData } from 'src/app/pages/manage-contacts/list-data';
import { ManageContactsService } from 'src/app/pages/manage-contacts/manage-contacts.service';
import { SelectContactsComponent } from './select-contacts/select-contacts.component';
import { WriteMessageComponent } from './write-message/write-message.component';
import { SendMessageComponent } from './send-message/send-message.component';
import { MessagesService } from '../../messages.service';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
interface ListContacts {
  listId: string,
  contacts: Contacts[]
};

@Component({
  selector: 'app-new-message',
  templateUrl: './new-message.component.html',
  styleUrls: ['./new-message.component.scss']
})
export class NewMessageComponent implements OnInit,AfterViewInit {
  @ViewChild(SelectContactsComponent) selectContacts:SelectContactsComponent;
  @ViewChild(WriteMessageComponent) writeMessage:WriteMessageComponent;
  @ViewChild(SendMessageComponent) sendMessage:SendMessageComponent;
  @Output() back = new EventEmitter<boolean>;
  isLoading = false;
count:number=0;
contacts:Contacts[]=[];
deviceSelected:boolean=false;
sendMessageData:any;
  addedContacts: string[] = [];
  deviceId:string;
  message:string;
  dateTime:string;
  fileUrl:string;
  attachments:string[];
  stepTwoValidate: boolean = true;
  showWarningMsg: boolean=false;
  isSendMsg: boolean;

  constructor(private messageService:MessagesService,private toasterService:ToasterServices) { }
  ngAfterViewInit() {
    this.contacts=this.selectContacts.addedContacts;

    this.message=this.writeMessage.messageBody;


  }
  stepTwoValidation(validity: boolean) {
    this.stepTwoValidate = validity;
  }
  contactsCount(e){
    this.count=e
  }
  ngOnInit() {
  }
  // messageData(e){
  //   console.log("message",this.message)
  //   this.message=e;
  // }
  filesUrls(e){
    this.attachments=e;
  }
  toWriteMessage(contacts){
    this.addedContacts=contacts
  //  console.log(this.selectContacts.addHocs)
    this.writeMessage.getTemplates();
  }
  toSendMessage(data){
    this.isSendMsg=true
    this.message=data.message;
    this.attachments=data.files
    // this.message=this.writeMessage.form.value.message;

    // this.attachments=this.writeMessage.fileData.map((file)=>file.url);

  }
  sendMessages(){
    this.deviceId=this.sendMessage.deviceId;
    this.dateTime=`${this.sendMessage.utcDateTime}Z`;

    this.isLoading = true

    // console.log({
    //   deviceId:this.deviceId,
    //   addedContacts:this.addedContacts,
    //   dateTime:this.dateTime,
    //   attachements:this.attachments,
    //   message:this.message

    // })
    if(this.attachments.length>0){
      this.showWarningMsg=true;
    }
    else{
      this.showWarningMsg=false;
    
    }
    this.messageService.sendWhatsappBusinessMessage(this.deviceId,this.addedContacts,this.message,this.dateTime,this.messageService.email,this.attachments).subscribe(
      (res)=>{
        this.toasterService.success("Success");
        this.back.emit(true)
        this.isLoading = false

      },
      (err)=>{

        this.toasterService.error("Error");
        this.back.emit(false)
        this.isLoading = false

      }
    )



  }
}
