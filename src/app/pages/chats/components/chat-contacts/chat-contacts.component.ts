import { Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Contacts } from 'src/app/pages/manage-contacts/contacts';
import { ManageContactsService } from 'src/app/pages/manage-contacts/manage-contacts.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ChatsService } from '../../chats.service';
import { Chats, chatsData } from '../../interfaces/Chats';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-chat-contacts',
  templateUrl: './chat-contacts.component.html',
  styleUrls: ['./chat-contacts.component.scss']
})
export class ChatContactsComponent implements OnInit {
  allContacts:any=[];
  contacts:any=[];
  foundChat:chatsData;
  searchControl = new FormControl();
  searchMsg = new FormControl();

  form = new FormGroup({
    searchControl:this.searchControl,
    searchMsg:this.searchMsg

  })
  clicked=0;
  hideSearch:boolean=true;
  @ViewChild('MsgsearchInput') MsgsearchInput: ElementRef;
  @ViewChild('searchContainer') searchContainer: ElementRef<HTMLInputElement>;

  isSearch: boolean;


  searchVal: string;
  searchSub: any;
  constructor(private authService:AuthService,
    private listService:ManageContactsService,
    public dialogRef: MatDialogRef<ChatContactsComponent>,
    private chatService:ChatsService,
    @Inject(MAT_DIALOG_DATA) public data:any) { }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(700), // Wait for 500ms pause in events
      distinctUntilChanged(), // Only emit if value is different from previous value
      switchMap(searchVal => this.getContacts(searchVal))
    ).subscribe(
      (res) => {
        this.contacts = res;
      }
    );
    this.getContacts().subscribe(
      (res)=>{
        this.contacts=res
      }
    );
  }
 

  getContacts(searchVal?){
    let shows=100;
    let pageNum=0;
    let email=this.authService.getUserInfo()?.email;
    let orderedBy="";
    let search=searchVal?searchVal:"";
    return this.listService.getContacts(email,false,shows,pageNum,orderedBy,search,"")
  
  }
  async addNewContact(contact: Contacts) {
    this.clicked+=1;
    if(this.clicked==1){
      let newContact = {
        chatName: contact.name,
        targetPhoneNumber: contact.mobileNumber,
        email: this.authService.getUserInfo()?.email,
        deviceId: this.data.deviceId
    };

    // Now we await the result of isContactExist
    if (await this.isContactExist(newContact)) {
        this.onClose({ isFound: true, foundChat: this.foundChat });
    } else {
        this.chatService.addNewChat(newContact).subscribe(
            (res) => {
              console.log(res)
                this.onClose(res);
            },
            (err)=>{
              this.onClose()
            }
        );
    }
    }
    
}


  async isContactExist(contactData) {
    let contact = this.data.chats.find((chat: chatsData) => (chat.chat.chatName === contactData.chatName) 
    && (chat.chat.targetPhoneNumber === contactData.targetPhoneNumber) 
    && chat.device.id == this.data.deviceId);

    if (contact) {
        this.foundChat = contact;
        return true;
    } else {
        let exists = await this.getChat(contactData.chatName);
        return exists;
    }
}
setUpSearch(){
 
  this.searchSub= this.searchMsg.valueChanges.pipe(
      debounceTime(700), // Wait for 500ms pause in events
      distinctUntilChanged(), // Only emit if value is different from previous value
      switchMap(searchVal => this.getContacts(searchVal))
    ).subscribe(
      (res) => {
        this.contacts = res;
      }
    );
    this.getContacts().subscribe(
      (res)=>{
        this.contacts=res
      }
    );
  
}
toggleSearch(isSearch){
  setTimeout(() => {
    this.isSearch=isSearch;
    if(isSearch){
      this.setUpSearch()
    }
    else{
      if(this.searchSub){
        this.searchSub.unsubscribe();
        this.searchSub=null;
      }
    }
    if( this.MsgsearchInput)
    {
      this.MsgsearchInput.nativeElement.focus();
    }
  
  
    }, 200);
}
async getChat(chatName) {
  try {
      let res = await this.chatService.listChats(this.authService.getUserInfo()?.email, 30, 0, chatName, this.data.deviceId).toPromise();
      if (res.data.length > 0) {
          let found:chatsData =res.data.find((chat: chatsData) => (chat.chat.chatName === chatName) 
          && chat.device.id == this.data.deviceId)
          if(found){
            this.foundChat=found
            return true;

          }
          else{
            return false
          }
      } else {
          return false;
      }
  } catch (error) {
      console.error("Error while fetching chats:", error);
      // Handle the error here, e.g., return false or throw an error
      return false;
  }
}
  onSearch(event:any){
    this.getContacts(event.value);
  }
  chatIcon(chatName){
    if(parseInt(chatName)){

      return chatName.substring(chatName.length-2);
    }
    else{

      return chatName.trim().split(" ",2).map((e)=>e.charAt(0).toUpperCase()).join("");

    }
  }
  onClose(data?):void {
    this.dialogRef.close(data);
  }
}
