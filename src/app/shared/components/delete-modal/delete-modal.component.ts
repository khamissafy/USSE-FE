import { Component, Inject, OnInit } from '@angular/core';
import { UsButtonComponent } from '../us-button/us-button.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DevicesService } from 'src/app/pages/devices/devices.service';
import { TemplatesService } from 'src/app/pages/templates/templates.service';
import { Contacts } from 'src/app/pages/manage-contacts/contacts';
import { ManageContactsService } from 'src/app/pages/manage-contacts/manage-contacts.service';
import { ToasterServices } from '../us-toaster/us-toaster.component';
import { ListData } from 'src/app/pages/manage-contacts/list-data';
import { Message, messageData } from 'src/app/pages/messages/message';
import { MessagesService } from 'src/app/pages/messages/messages.service';
import { compaignDetails } from 'src/app/pages/compaigns/campaigns';
import { CompaignsService } from 'src/app/pages/compaigns/compaigns.service';
import { TranslateService } from '@ngx-translate/core';
import { UsersService } from 'src/app/pages/users/users.service';
import { AuthService } from '../../services/auth.service';
import { BotService } from 'src/app/pages/bot/bot.service';
import { Chats, chatsData } from 'src/app/pages/chats/interfaces/Chats';
import { ChatsService } from 'src/app/pages/chats/chats.service';

interface ComponentData {
  contactsData?: { contacts: Contacts[], remove: boolean },
  deviceData?: { deviceId: string },
  templatesData?: { templatesId: string },
  listsData?: { contacts: Contacts[], list: string[], lists: ListData[] },
  messagesData?: { messages: messageData[]},
  compaignData?: { compaignId: string, action: string },
  users?:{userEmail:string,customerEmail:string}
  automationData?: { automationId: string },
  chatData?:{chat:chatsData}


}
@Component({
  selector: 'app-delete-modal',
  templateUrl: './delete-modal.component.html',
  styleUrls: ['./delete-modal.component.scss']
})
export class DeleteModalComponent implements OnInit {

  contacts: string[];
  list: string[];
  action;
  isLoading = false;
  numOfItems: number = 0;
  isRemoveL: boolean;
  body: string[];
  removeCon: boolean = false;

  isContacts: boolean = false;
  isDevices: boolean = false;
  isTemplates: boolean = false;
  isLists: boolean = false;
  isMessages: boolean = false;
  isCampaigns: boolean = false;
  isUsers:boolean=false;
  isAutomation:boolean=false;
  isChats:boolean=false;
  constructor(
    private devicesService: DevicesService,
    private templatesService: TemplatesService,
    private listService: ManageContactsService,
    private messageService: MessagesService,
    private toaster: ToasterServices,
    private compaignsService: CompaignsService,
    private usersService:UsersService,
    private authService:AuthService,
    private botService:BotService,
    private chatService:ChatsService,
    public dialogRef: MatDialogRef<DeleteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ComponentData,
    private translate:TranslateService,
    
    
  ) {
  }

  ngOnInit() {

    if (this.data.contactsData) {
      this.isContacts = true;
      this.isDevices = false;
      this.isTemplates = false;
      this.isLists = false;
      this.isMessages = false
      this.isUsers=false
      this.isChats=false

      this.body = this.data.contactsData.contacts.map(res => res.id)
      this.numOfItems = this.body.length;




      if (this.data.contactsData.remove) {
        this.isRemoveL = true;
      }
      else {
        this.isRemoveL = false;

      }
    }
    else if (this.data.listsData) {

      if (this.data.listsData.list) {
        this.removeCon = true;
        this.contacts = this.data.listsData.contacts.map((e) => e.id);
        this.list = this.data.listsData.list;
        this.body = this.contacts
        this.numOfItems = this.body.length;
      }
      else {
        this.removeCon = false;
        this.body = this.data.listsData.lists.map(res => res.id);
        this.numOfItems = this.body.length;
      }



      this.isContacts = false;
      this.isDevices = false;
      this.isTemplates = false;
      this.isLists = true;
      this.isMessages = false;
      this.isUsers=false;
      this.isChats=false


    }
    else if (this.data.messagesData) {
      this.isContacts = false;
      this.isDevices = false;
      this.isTemplates = false;
      this.isLists = false;
      this.isMessages = true;
      this.isUsers=false
      this.isChats=false


      this.body = this.data.messagesData.messages.map(res => res.id);
      this.numOfItems = this.body.length;
    }


    else if (this.data.templatesData) {
      this.isContacts = false;
      this.isDevices = false;
      this.isTemplates = true;
      this.isLists = false;
      this.isMessages = false;
      this.isUsers=false
      this.isChats=false

    }
    else if (this.data.compaignData) {
      this.action = this.data.compaignData.action;
      this.isContacts = false;
      this.isDevices = false;
      this.isLists = false;
      this.isMessages = false;
      this.isCampaigns = true;
      this.isUsers=false
      this.isChats=false

    }
    else if(this.data.users){
      this.isContacts = false;
      this.isDevices = false;
      this.isTemplates = false;
      this.isLists = false;
      this.isMessages = false;
      this.isUsers=true;
      this.isChats=false

    }
    else if(this.data.automationData){
      this.isContacts = false;
      this.isDevices = false;
      this.isTemplates = false;
      this.isLists = false;
      this.isMessages = false;
      this.isUsers=false;
      this.isAutomation=true;
      this.isChats=false

    }
    else if(this.data.chatData)
    {
      this.isContacts = false;
      this.isDevices = false;
      this.isTemplates = false;
      this.isLists = false;
      this.isMessages = false;
      this.isCampaigns = false;
      this.isUsers=false;
      this.isChats=true
    }
    else {
      this.isContacts = false;
      this.isDevices = true;
      this.isTemplates = false;
      this.isLists = false;
      this.isMessages = false;
      this.isCampaigns = false;
      this.isUsers=false;
      this.isChats=false


    }


  }

  deleteCon() {

    this.listService.deleteContact(this.authService.getUserInfo()?.email, this.body).subscribe(
      (res) => {
        this.isLoading = false
        if(res.numberOfErrors === 0){
          this.onClose({errors:'noErrors' , data:this.body});
        }
        else{
          let errorObject =res;
          this.onClose({errors:errorObject , data:this.body});
        }      

      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    )
  }
  // this.translate.instant("COMMON.SUCC_MSG")
deleteAutomation(){
this.botService.deleteAutomation(this.data.automationData.automationId,this.authService.getUserInfo()?.email).subscribe(
  (res) => {
    this.isLoading = false

    this.onClose(true);

    this.toaster.success(this.translate.instant("COMMON.DELETE_MESSAGES"))


  },
  (err) => {
    this.isLoading = false
    this.onClose();

  }
)
}
  removeLists() {
    this.listService.removeContactsFromLists(this.body,this.authService.getUserInfo()?.email).subscribe(
      (res) => {
        this.isLoading = false
        if(res.numberOfErrors === 0){
          this.onClose('noErrors');
        }
        else{
          let errorObject =res;
          this.onClose(errorObject);
        }      

      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    )

  }

deleteChat(){
  this.chatService.deleteChat(this.data.chatData.chat.chat.id,this.authService.getUserInfo()?.email).subscribe(
    (res) => {
      this.isLoading = false

      this.onClose(true);

      this.toaster.success(this.translate.instant("COMMON.DELETE_MESSAGES"))


    },
    (err) => {
      this.isLoading = false
      this.onClose();

    }
  )

}
  deleteDevice() {
    this.devicesService.deleteDevice(this.authService.getUserInfo()?.email, this.data.deviceData.deviceId).subscribe(
      (res) => {
        this.isLoading = false

        this.onClose(true);

        this.toaster.success(this.translate.instant("COMMON.DELETE_MESSAGES"))


      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    )

  }


  deleteCompaign() {
    this.compaignsService.deleteWhatsappBusinessCampaign(this.data.compaignData.compaignId, this.authService.getUserInfo()?.email).subscribe(
      (res) => {
        this.isLoading = false


        this.onClose(true);

        this.toaster.success(this.translate.instant("COMMON.DELETE_MESSAGES"))



      },
      (err) => {
        this.isLoading = false
        this.onClose();


      }
    )


  }
  stopComaign() {
    this.compaignsService.stopWhatsappBusinessCampaign(this.data.compaignData.compaignId, this.authService.getUserInfo()?.email).subscribe(
      (res) => {
        this.isLoading = false

        this.onClose(true);

        this.toaster.success(this.translate.instant("COMMON.SUCC_MSG"))


      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    )

  }




  deleteTemplates() {
    this.templatesService.deleteTemplates(this.authService.getUserInfo()?.email, this.data.templatesData.templatesId).subscribe(
      (res) => {
        this.isLoading = false

        this.onClose(true);

        this.toaster.success(this.translate.instant("COMMON.DELETE_MESSAGES"))


      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    )

  }



  deleteList() {
    this.isLoading = true
    let body = this.data.listsData.lists.map(res => res.id)
    this.listService.deleteList(this.authService.getUserInfo()?.email, body).subscribe(
      (res) => {
        this.isLoading = false
        if(res.numberOfErrors === 0){
          this.onClose({errors:'noErrors' , data:body});

        }
        else{
          let errorObject =res;
          this.onClose({errors:errorObject , data:body});
        }      

      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    )
  }
  removeContacts() {
    this.listService.removeContactsFromOneList(this.contacts, this.list,this.authService.getUserInfo()?.email).subscribe(
      (res) => {
        this.isLoading = false
        if(res.numberOfErrors === 0){
          this.onClose('noErrors');
        }
        else{
          let errorObject =res;
          this.onClose(errorObject);
        }      

      },
      (err) => {
        this.isLoading = false
        this.onClose();

      }
    )
  }
  deleteMessages() {
    this.messageService.deleteMessage(this.body).subscribe(
      (res) => {
        this.isLoading = false
        this.onClose(this.body);
      
        this.toaster.success(this.translate.instant("COMMON.DELETE_MESSAGES"))

      })
  }



deleteUser(){
  this.usersService.deleteUser(this.data.users.customerEmail,this.data.users.userEmail).subscribe(
    (res) => {
      this.isLoading = false

      this.onClose(true);

      this.toaster.success(this.translate.instant("COMMON.DELETE_MESSAGES"))


    },
    (err) => {
      this.isLoading = false
      this.onClose();

    }

  )
}

submit() {
  this.isLoading = true;
  if (this.isContacts) {
    if (this.isRemoveL) {
      // remove lists from contacts
      this.removeLists();
    }
    else {
      this.deleteCon();

    }

  }
  else if (this.isLists) {
    if (this.data.listsData.list) {
      // from list details, remove contacts from list
      this.removeContacts();
    }
    else {
      this.deleteList()
    }
  }

  else if (this.isMessages) {
    this.deleteMessages();

  } else if (this.isTemplates) {
    this.deleteTemplates();
  }
  else if (this.isCampaigns) {
    if (this.data.compaignData.action == "delete") {

      this.deleteCompaign()
    }
    else {
      this.stopComaign()
    }}


else if(this.isUsers){
  this.deleteUser();
}
else if(this.isAutomation){
  this.deleteAutomation();
}
else if(this.isChats){
  this.deleteChat()
}
    else {
      this.deleteDevice();
    }

  }


  onClose(data ?): void {
    this.dialogRef.close(data);
  }

}
