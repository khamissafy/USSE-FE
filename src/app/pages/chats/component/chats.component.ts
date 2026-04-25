import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { ChatContactsComponent } from '../components/chat-contacts/chat-contacts.component';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectOption } from 'src/app/shared/components/select/select-option.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Observable, Subscription, concatMap,pipe, interval, throttleTime, combineLatest, find, debounceTime, distinctUntilChanged, switchMap, firstValueFrom } from 'rxjs';
import { ChatById, Chats, chatHub, chatsData } from '../interfaces/Chats';
import { ChatsService } from '../chats.service';
import { DeleteModalComponent } from 'src/app/shared/components/delete-modal/delete-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MessagesService } from '../../messages/messages.service';
import { DatePipe } from '@angular/common';
import { ToasterServices } from 'src/app/shared/components/us-toaster/us-toaster.component';
import { isFileSizeNotAllowed } from 'src/app/shared/methods/fileSizeValidator';
import { TranslateService } from '@ngx-translate/core';
import { TimeZoneServiceService } from 'src/app/shared/services/timeZoneService.service';

interface files{
  fileName:string,
  fileType:string,
  fileSize:number
}
@Component({
  selector: 'app-chats',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.scss'] ,
})
export class ChatsComponent implements OnInit, AfterViewInit,OnDestroy{
  /** Avoid concurrent refresh for the same message bubble. */
  private readonly _chatMediaRefreshing = new Set<string>();

  devices:any=[];
  deviceLoadingText:string='Loading';
  devicesData :any= new FormControl([]);
  message :any= new FormControl('',Validators.required);
  @ViewChild('fileInput') fileInputRef: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer') searchContainer: ElementRef<HTMLInputElement>;
  selectedTimeZone:number=0;

  uploadedAttachments:files[]=[];
  form = new FormGroup({
    devicesData:this.devicesData,

  });
  searchControl = new FormControl({ value: '', disabled: false });
  disableSearch:boolean;
  searchForm = new FormGroup({
    searchControl:this.searchControl
  })
  cursorPosition:any= 0
  searchMsg = new FormControl();

  searchMsgForm=new FormGroup({
    searchMsg:this.searchMsg
  })
  
  messageForm = new FormGroup({
    message:this.message,
  });
  deviceId:any
  // listChatsObservable$:Observable<Chats[]>;
  listChats:chatsData[]=[];
  email=this.authService.getUserInfo()?.email;
  searchKey:string='';
  openChat:boolean=false;
  emojiForm: FormGroup;
  showEmoji: boolean = false;
  isEmojiClicked: boolean = false;
  @ViewChild('chatContainer') chatContainer: ElementRef;
  @ViewChild('contactsContainer') contactsContainer: ElementRef;
  @ViewChild('MsgsearchInput') MsgsearchInput: ElementRef;

  groupedMessages: { [day: string]: ChatById[] } = {};

  isDelete:boolean=false;
  selectedChat:ChatById[]=[]
  selectedChatId:any;
  chatName:string='';
  targetPhoneNumber:string='';
  queryParamsSubscription: Subscription;
  devicesSub$:Observable<any>;
  listChatsSub$:Observable<any>;
  filesList: any=[];
  chatMessagesCount:number=60;
  contactsCount: number=60;
  noMoreMessages:boolean;
  loadingChat: boolean;
  counter:number=0;
  isLoading: boolean;
  noMoreChats: any;
  isSearch:boolean =false;
  searchVal: string = '';
  sortedDays: string[]=[]; 
  textDirection: string;
  disable: boolean = true;
  hideSearch:boolean=false;
  subscriptions:Subscription[]=[];
  searchSub: Subscription;
  filteredDevices: any=[];
  isGroupe: boolean=false;
  activeChat:chatsData;
  constructor( public dialog: MatDialog,
    private translationService:TranslationService,
    private authService:AuthService,
    private chatService:ChatsService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private messageService:MessagesService,
   private datePipe: DatePipe,
   private toaster:ToasterServices,
   private translate:TranslateService,
   private timeZoneService:TimeZoneServiceService

    ){
      this.emojiForm = this.formBuilder.group({
        emojiInput: ['']
      });
  }
  initRouting() {
    // Assign the subscription to queryParamsSubscription
    // this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
    //   if (params['chatId']) {
    //     this.router.navigateByUrl("/chats")


    //   } 
    // });
  }

  unSubscripQueryParam(){
    if(this.queryParamsSubscription){
      this.queryParamsSubscription.unsubscribe();

    }
  }
  updateQueryParams(){
    this.router.navigateByUrl("/chats?chatId="+this.selectedChatId)
  }
  closeSubsciptions(){
    this.subscriptions.map((sub)=>sub.unsubscribe())
  }
  ngOnInit() {
    this.getDevices();
    this.setTimeZone();

    let searchMsgSub=this.searchMsg.valueChanges.pipe(
    debounceTime(700),
    distinctUntilChanged(),
    switchMap(search=>this.chatRec(search))
   ).subscribe(
    (res)=>{
        
      if(res.length == 0){
        this.noMoreMessages=true;
          this.isLoading=false;
      }
      else{
        this.noMoreMessages=false;
      }

      this.selectedChat =  this.sortBasedOnDate(res);
      this.groupMessagesByDay();

        setTimeout(() => {
          this.scrollToBottom();
          return
        }, 0);
      
    }
   )
    this.subscriptions.push(searchMsgSub)
    this.router.navigateByUrl("/chats")

    this.chatService.startConnection()
    this.onRecieveMessages();
    this.onStatusChange();
    const hubReconSub = this.chatService.hubReconnected$.subscribe(() => {
      if (this.openChat && this.selectedChatId) {
        this.getChatById(this.selectedChatId);
      }
    });
    this.subscriptions.push(hubReconSub);
  }
   setTimeZone(){
    let sub = this.timeZoneService.timezone$.subscribe(
      res=> this.selectedTimeZone=res

    )
    this.subscriptions.push(sub)
  }
  setupSearchSubscription(): void {
    this.searchSub= this.searchControl.valueChanges.pipe(
      debounceTime(700), // Wait for 1s pause in events
      distinctUntilChanged(), // Only emit if value is different from previous value
      switchMap(searchVal => this.listChatsReq(searchVal))
    ).subscribe(
      (res) => {
        this.listChats=res.data;
      }
    );
    this.subscriptions.push(this.searchSub)
  }
  
  ngAfterViewInit() {
    this.chatContainer.nativeElement.addEventListener('scroll', this.onScrollToTop.bind(this));
    this.contactsContainer.nativeElement.addEventListener('scroll', this.onScrollToBottom.bind(this));
    
  }
 
 
  toggleUpdatedAt(msg){
    let findMessage = this.selectedChat.find((message)=>message.id == msg.id);
    this.selectedChat.filter((chat)=>chat.id !== msg.id).map((chat)=>chat.updatedAtVisible = false);
    findMessage.updatedAtVisible= !findMessage.updatedAtVisible;

    this.groupMessagesByDay();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: any) {
   if(!this.hideSearch){
    if (!this.searchContainer?.nativeElement.contains(event.target) ) {
      if(this.searchVal === ''){
        this.isSearch = false;
      }
      else{
        this.isSearch = true
      }
    } 
 
    const clickedElement = event.target as HTMLElement;

    // Check if the clicked element or any of its ancestors contain the class "updatedAt"
    let isClickInsideUpdatedAt = false;
    let element = clickedElement;
    while (element) {
      if (element?.classList?.contains('message-out')) {
        isClickInsideUpdatedAt = true;
        break;
      }
      element = element.parentElement;
    }
  
    // Print whether the click occurred inside or outside of the updatedAt element
    if (!isClickInsideUpdatedAt) {
      if(typeof(this.selectedChat[0])!=='string'){
        
        this.selectedChat.map((chat)=>chat.updatedAtVisible = false);  
        this.groupMessagesByDay();   
      }
    
    }
     }
  
    }


  toggleSearch(msg?): void {
    setTimeout(() => {
    this.isSearch=true
    if( this.MsgsearchInput)
    {
      this.MsgsearchInput.nativeElement.focus();
    }
  
  
    }, 200);
    }

  arraysContainSameObjects(arr1: any[], arr2: any[]): boolean {
    // Check if arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Check if every object in arr1 exists in arr2
    return arr1.every(obj1 => {
        // Find an object in arr2 with the same ID
        const obj2 = arr2.find(obj => obj['id'] === obj1['id']);
        // Check if the object exists in arr2
        return obj2 !== undefined;
    });
}
sortBasedOnDate(array){
 return array.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return 0; // if either date is invalid, don't perform comparison
    }
    return dateA.getTime() - dateB.getTime(); // compare timestamps
  });
}
resetValues(){
  this.noMoreMessages=false;
  this.isLoading=false;
  this.chatMessagesCount=60;
  
}
onScrollToTop() {
  
    const container = this.chatContainer.nativeElement;
    if (container.scrollTop < 100 && container.scrollTop > 80 && !this.noMoreMessages && !this.isLoading ) {
      if(this.searchVal){
        this.isLoading = false;
  
      }
      else{
        this.isLoading = true;
  
      }
      // Remember the position of the scroll
      const previousScrollHeight = container.scrollHeight;
      const previousScrollTop = container.scrollTop;
      
      this.chatService.getChatById(this.selectedChatId, this.chatMessagesCount, 0, this.searchVal, this.deviceId)
        .subscribe(
          (res) => {
            if (res.length === 0) {
              this.noMoreMessages = true;
            } else {
              if (this.selectedChat.length === res.length) {
                this.noMoreMessages = true;
              } else {
                this.noMoreMessages = false;
                this.selectedChat =  this.sortBasedOnDate(res);
                this.groupMessagesByDay();

                setTimeout(() => {
                // Calculate the height of newly added messages
                const newMessagesHeight = container.scrollHeight - previousScrollHeight;
                // Adjust the scroll position to maintain the user's position before loading new messages
                container.scrollTop = previousScrollTop + newMessagesHeight;
                this.chatMessagesCount += 30;
                this.isLoading = false;
              }, 0);
              }
  
            
            }
          },
          (error) => {
            console.error('Error loading more data:', error);
            this.isLoading = false;
          }
        );
    }
  

}
onScrollToBottom(){
  const container = this.contactsContainer.nativeElement;

  // Check if the user has scrolled to the bottom of the container
  const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 30;

  if (isNearBottom && !this.noMoreChats && !this.loadingChat) {
    this.loadingChat = true;
    let prevContainerHeight = container.scrollHeight;
    let prevScrollTop = container.scrollTop;

    this.chatService.listChats(this.contactsCount, 0, '', this.deviceId)
      .subscribe(
        (res) => {
          if (res.data.length === 0) {
            this.noMoreChats = true;
          } else {
            if (this.listChats.length === res.data.length) {
              this.noMoreChats = true;
            } else {
              this.noMoreChats = false;
              let prevChat = this.listChats[0];
              if(res.data.includes(prevChat)){
                this.listChats=res.data.splice(res.data.indexOf(prevChat , 1))
                this.listChats.unshift(prevChat)
              }
              else{
                this.listChats = res.data;

              }
              setTimeout(() => {
                const newContentHeight = container.scrollHeight - prevContainerHeight;
                // Adjust the scroll position to maintain the position of the last visible data
                container.scrollTop +=newContentHeight;

                // container.scrollTop +=(newContentHeight -30);

                this.contactsCount += 30;
                this.loadingChat = false;
              }, 0);
            }
            
          }
        },
        (error) => {
          this.loadingChat = false;
        }
      );
  }
}
  onSearchMsg(search){
    this.searchVal=search.value;
  this.getChatById(this.selectedChatId,search.value);

}
scrollToBottom() {
  const container = this.chatContainer.nativeElement;
  container.scrollTop = container.scrollHeight;
}
groupMessagesByDay() {
  this.groupedMessages = {}; // Clear previous grouping

  this.selectedChat.forEach(chat => {
    const messageDate = new Date(chat.createdAt);
    const day = this.getGroupHeader(messageDate);

    // Check if the day already exists in groupedMessages
    if (!this.groupedMessages[day]) {
      // If the day doesn't exist, initialize it with an empty array
      this.groupedMessages[day] = [];
    }

    // Push the current chat into the array for this day
    this.groupedMessages[day].push(chat);
  });

  // Extract keys (days) and sort them
  this.sortedDays = Object.keys(this.groupedMessages).sort((a, b) => {
    // Convert keys to dates and compare
    return new Date(a).getTime() - new Date(b).getTime();
  });

}


isString(value: any): boolean {
  return typeof value === 'string';
}
getGroupHeader(messageDate: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set the time part to midnight for today

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1); // Subtract one day from today to get yesterday

  const messageDateOnly = new Date(messageDate);
  messageDateOnly.setHours(0, 0, 0, 0); // Set the time part to midnight for comparison

  if (messageDateOnly.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return messageDate.toDateString(); // Or any other format you prefer for other dates
  }
}

chatRec(search){
    return this.chatService.getChatById(this.selectedChatId,30,0,search,this.deviceId) 

}
  getChatById(chatId,search?)
  {
    this.searchVal = search || '';

    this.chatService.getChatById(chatId,30,0,this.searchVal,this.deviceId) 
    .subscribe(
      (res)=>{
        
        if(res.length == 0){
          this.noMoreMessages=true;
            this.isLoading=false;

          
          
        }
        else{
          this.noMoreMessages=false;
        }

        this.selectedChat =  this.sortBasedOnDate(res);
        this.groupMessagesByDay();

          setTimeout(() => {
            this.scrollToBottom();
            return
          }, 0);
        
      }
    )

  }
  getDevices(){
    this.devicesSub$= this.authService.getDevices(10,0,"","");
    this.devicesSub$.subscribe(
      (res)=>{
        let alldevices=res;
        this.devices = alldevices.map(res=>{
          return {
            title:res.deviceName,
            value:res.id,
            deviceIcon:res.deviceType
          }
        });
        if(this.devices.length==0){ 
          this.deviceLoadingText='No Results'

        }
        else{

          this.deviceId=res[0].id;


        // if(this.authService.selectedDeviceId ==""){

        //   this.form.patchValue({
        //   devicesData: {
        //   title:alldevices[0]?.deviceName,
        //   value:alldevices[0]?.id,
        //   deviceIcon:alldevices[0].deviceType
        //   }

        //   })
        
        // }
        // else{
        //   let selected= this.devices.find((device)=>device.value==this.authService.selectedDeviceId)
        //   this.deviceId=this.authService.selectedDeviceId;
        //   this.form.patchValue({
        //     devicesData: {
        //     title:selected.title,
        //     value:selected?.value,
        //     deviceIcon:selected.deviceIcon
        //     }

        //     })
        // }
        this.getListChats();
        this.initRouting()

      }},
        (err)=>{
        this.deviceLoadingText='No Results'

        })
  }
  listChatsReq(search){
    return  this.chatService.listChats(30,0,search,this.filteredDevices);
  }
  getListChats(){
  this.listChatsSub$= this.chatService.listChats(30,0,this.searchKey,this.filteredDevices);
  if(this.searchSub){
    this.searchSub.unsubscribe();
    this.searchSub=null;

    this.searchForm.patchValue({
      searchControl:''
    })
  }
  this.listChatsSub$.subscribe(
      (res:Chats)=>{
        this.listChats=res.data;
        this.hideSearch=false;

          let chat:chatsData;
          if(!this.searchKey)
            {
              if(!this.selectedChatId){
                if(this.listChats.length <= 0){
                  this.clearChats()
                  }
                  else{
                    this.activeChat=res.data[0];
                    this.disable=this.activeChat.device.isDeleted;
                    this.selectedChatId=res.data[0]?.chat?.id;
                    this.chatName=res.data[0].chat?.chatName;
                    this.targetPhoneNumber=res.data[0].chat?.targetPhoneNumber;
                    chat=res.data[0];
                    this.deviceId=chat.device.id
                    this.getChatById(this.selectedChatId);
                    this.openChat=true;
                    // this.updateQueryParams();
                    if( this.listChats.length>0){
                      this.listChats.map((chat)=>chat.active=false) ;   
                      this.listChats[0].active=true
                    }
                    
                    if(chat?.unseenMessagesCount > 0){
                      this.chatService.markChatAsRead(chat.chat.id).subscribe(
                        (res)=>{
                          chat.unseenMessagesCount=0;
                        }
                      )
                    }
                  }
             
              }
              else{
                if( this.listChats.length>0){

                chat=this.listChats.find((chats)=>chats.chat.id == this.selectedChatId);
      
                if(chat){
                  this.chatName=chat.chat.chatName;
                  this.targetPhoneNumber=chat.chat.targetPhoneNumber;
                  this.deviceId=chat.device.id
                  chat.active=true
                  if(chat.unseenMessagesCount > 0){
                    this.chatService.markChatAsRead(chat.chat.id).subscribe(
                      (res)=>{
                        chat.unseenMessagesCount=0;
                      }
                    )
                  }
                }
              
                this.getChatById(this.selectedChatId,'');
              }
              else{
                this.clearChats()
              }

                // this.listChats.map((chat)=>chat.active=false) ;   
                // this.form.patchValue({
                //   devicesData: {
                //   title:chat?.device.deviceName,
                //   value:chat?.device.id,
                //   deviceIcon:chat?.device.deviceType
                //   }
        
                //   })
      
              }
            }
          if(this.listChats.length>0){
            this.searchControl.enable();
            this.setupSearchSubscription();
            this.hideSearch=false;

          }
          else{
            this.searchControl.disable();
            this.selectedChatId=''
            this.hideSearch=true
            if(this.searchSub){
              this.searchSub.unsubscribe();
              this.searchSub=null;
            }
          }


      }
    )
  }
  clearChats(){
    this.selectedChat=[];
    this.groupMessagesByDay();
    this.chatName='';
    this.targetPhoneNumber='';
    this.hideSearch=true;
  }
  private revokePendingAttachmentUrls(): void {
    for (const f of this.filesList) {
      const u = f?.url;
      if (typeof u === 'string' && u.startsWith('blob:')) {
        URL.revokeObjectURL(u);
      }
    }
  }

  onAttachmentRemoved(removed: { url?: string }): void {
    const u = removed?.url;
    if (typeof u === 'string' && u.startsWith('blob:')) {
      URL.revokeObjectURL(u);
    }
    this.disableButtonOrnot();
  }

resetForm(){
  this.revokePendingAttachmentUrls();
  this.messageForm.patchValue(
    {
      message:''
    }
  );
  this.filesList=[]
}
  onSearch(search){
    this.searchKey=search.value;
    // this.getListChats()
  }
  addNewContact(deviceId){
    const currentLang=this.translationService.getCurrentLanguage()
    const dialogConfig=new MatDialogConfig();
    dialogConfig.height='100vh';
    dialogConfig.width='25vw';
    dialogConfig.maxWidth='450px';
    dialogConfig.minWidth='300px'
    dialogConfig.panelClass='add-new-chat-modal'
    dialogConfig.position =  currentLang=='ar'?{ right: '0'} :{ left: '0'} ;
    dialogConfig.direction = currentLang=='en'? "ltr" :"rtl";
    dialogConfig.data={deviceId:deviceId , chats:this.listChats};
    const dialogRef = this.dialog.open(ChatContactsComponent,dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(result.isFound){
          this.selectedChatId = result.foundChat.chat.id;
          this.chatName = result.foundChat.chat.chatName;
          this.targetPhoneNumber = result.foundChat.chat.targetPhoneNumber;
          this.getListChats()
          this.updateQueryParams()
        }
        else{
          this.selectedChatId=result.id;
          this.chatName=result.chatName;
          this.targetPhoneNumber=result.targetPhoneNumber;
          this.getListChats()
          this.updateQueryParams()
        }
        this.openChat=true
      
      }

    });
  }
  onSelect(device){
    if(device.value !== this.deviceId)
    {
      this.deviceId=device.value;
      this.authService.selectedDeviceId=device.value;
      this.selectedChatId = ""
      this.getListChats();  
    }

    }
    onSelectDev(device){
      this.selectedChatId = ""
      this.filteredDevices.push(device.value);
      this.getListChats();  

    }
    deselectDev(device){
      this.selectedChatId = ""
      this.filteredDevices.splice(this.filteredDevices.indexOf(device.value),1)
      this.getListChats();  
    }
    deleteChat(chat){
      this.isDelete=true;
      const dialogConfig=new MatDialogConfig();
      dialogConfig.height='50vh';
      dialogConfig.width='35vw';
      dialogConfig.maxWidth='100%';
      dialogConfig.minWidth='465px';
      dialogConfig.panelClass='custom-dialog-delete-style'
      dialogConfig.data = {
        chatData:{chat:chat}
      };
      dialogConfig.disableClose = true;
  
      const dialogRef = this.dialog.open(DeleteModalComponent,dialogConfig);
  
      dialogRef.afterClosed().subscribe(result => {
        this.isDelete=false;
        if(result){
          this.selectedChatId='';
          this.getListChats();

        }
      });
    }
    markMessageAsRead(chat){
      this.chatService.markChatAsRead(chat.chat.id).subscribe(
        (res)=>{
          chat.unseenMessagesCount=0;
        }
      )
    }

    navigateToChat(chat:chatsData){
      this.activeChat=chat;
      this.disable=this.activeChat.device.isDeleted;

      this.openChat=true;
      this.isSearch=false;
      this.hideSearch=false;
      this.isGroupe=chat.chat.channelType >1
      this.resetValues()
      if(!chat.active){
        this.clearInputData();
        if(chat.unseenMessagesCount > 0){
          this.markMessageAsRead(chat)
        }
        this.listChats.map((chat)=>chat.active=false)      
        chat.active=true;
        if(!this.isDelete){
          this.chatName='';
        this.targetPhoneNumber='';
        this.selectedChat=[];
        this.selectedChatId=chat.chat.id;
        this.updateQueryParams()
        this.chatName=chat.chat.chatName;
        this.targetPhoneNumber=chat.chat.targetPhoneNumber;
        this.deviceId=chat.device.id
        this.getChatById(this.selectedChatId)
        }
  
      }
      this.resetForm();

    }
    closeChatPage(){
      this.openChat=true
    }
    toggleEmojiPicker() {
      this.showEmoji = !this.showEmoji;
    }
    showEmojiPicker() {
      if (!this.showEmoji) {
        this.showEmoji = true;
      }
    }
  
    getCursorPosition(e){
      this.cursorPosition = e.target.selectionStart;
    }
resetChatsOrder(chatContact){
  if(chatContact){
    this.listChats.splice(this.listChats.indexOf(chatContact),1);
    this.listChats.unshift(chatContact)
  }
}
    addEmoji(event: any) {
      let emoji =event.emoji.native;
      let val = this.messageForm.value.message;

      const newMessage =val.slice(0, this.cursorPosition) + emoji + val.slice(this.cursorPosition);
      this.message.setValue(newMessage);
      this.isEmojiClicked = true;
      this.showEmoji = true;

      this.disableButtonOrnot()

      
    }
    chatIcon(chatName){
      if(parseInt(chatName)){

        return chatName.substring(chatName.length-2);
      }
      else{

        return chatName?.trim().split(" ",2).map((e)=>e.charAt(0).toUpperCase()).join("");

      }
    }
  
    async sendMsg(event?){
      let message = this.messageForm.value.message;
      let newMessage:any=[];

      if((this.filesList.length > 0 || message.trim() !== '') && !this.disable){
        this.disable=true;

        if(event){
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); 
          }  
        }
        let chatMsg=this.activeChat?.chat.channelType>1? {
          channelType:this.activeChat.chat.channelType,
          groupName:this.activeChat.chat.chatName
        }:null

        try {
          let attachements: string[] = [];
          if (this.filesList.length > 0) {
            const uploads = await Promise.all(
              this.filesList.map((file, index) =>
                firstValueFrom(
                  this.messageService.uploadFile(
                    file.file,
                    index === 0 ? message : undefined,
                    'chat'
                  )
                ).then((r) => r.signedUrl)
              )
            );
            attachements = uploads;
          }

          const res = await firstValueFrom(
            this.messageService.sendWhatsappBusinessMessage(
              this.deviceId,
              [this.targetPhoneNumber],
              message,
              null,
              attachements,
              chatMsg
            )
          );

          const messageIds: string[] = Array.isArray(res) ? res : [];
          const messageId = messageIds[0] ?? `pending-${Date.now()}`;
          let mainData:any={
            id: messageId,
            deviceId: this.deviceId,
            chatId: this.selectedChatId,
            chatName: this.chatName,
            targetPhoneNumber: this.targetPhoneNumber,
            direction: true,
            chat:{chatName:this.chatName,id:this.selectedChatId},
            msgBody: message,
            createdAt:String(this.convertToUTC(new Date())) ,
            updatedAt:String(this.convertToUTC(new Date())) ,
            status: 0,
            msgType: 'WBS',
          }

          if(this.filesList.length > 0){
            newMessage = this.filesList.map((file, index) => {
              let messageWithFile = {
                  ...mainData,
                  fileName: file.name,
                  fileUrl: attachements[index]
              };
              if(index !== 0){
                messageWithFile.msgBody='';
              }
              return messageWithFile;
          });

            }
            else{
              newMessage=[mainData];
            }
            let foundChat:chatsData=this.listChats.find((chat)=>chat.chat.id == this.selectedChatId );
            if(foundChat){
              foundChat.lastMessageContent='';
              foundChat.lastMessageFileName='';
              foundChat.lastMessageFileUrl='';
              foundChat.fileType='';
              foundChat.lastMessageContent=message;
              foundChat.lastMessageStatus=0;
              
              if(this.filesList.length > 0){
                let fileType=this.filesList[this.filesList.length -1].type
                if(fileType.includes('image')){
                  foundChat.fileType=`.${fileType.slice(fileType.indexOf('/') +1)}`;
                }
                else{
                  foundChat.fileType='';
                }
                foundChat.lastMessageFileName=this.filesList[this.filesList.length -1].name;
                foundChat.lastMessageFileUrl=attachements[attachements.length - 1];
              }
              this.resetChatsOrder(foundChat)

            }
            else{
              let chat:any={
                chat: {
                  id: this.selectedChatId,
                  chatName: this.chatName,
                  targetPhoneNumber: this.targetPhoneNumber,
                  createdAt:String(this.convertToUTC(new Date())),
                },
                lastMessageDate: String(this.convertToUTC(new Date())),
                lastMessageContent: message,
                lastMessageDirection: true,
                lastMessageStatus: 0,
                unseenMessagesCount: 0,
              }
              if(this.filesList.length > 0){
                let fileType=this.filesList[this.filesList.length -1].type
                chat.fileType=`.${fileType.slice(fileType.indexOf('/') +1)}`;
                chat.lastMessageFileName=this.filesList[this.filesList.length -1].name;
                chat.lastMessageFileUrl=attachements[attachements.length - 1];
              }
              this.listChats.unshift(chat)
              this.resetChatsOrder(chat)

            }

          this.selectedChat=[...this.selectedChat,...newMessage];
          this.groupMessagesByDay();
          this.resetForm();
          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
        } catch {
          this.toaster.error(this.translate.instant('Error'));
        } finally {
          this.disableButtonOrnot();
        }
      }
  
else{
  event?.preventDefault?.();

}
}
    isImage(fileUrl:string){
      return !!fileUrl && fileUrl.includes('image')
    }

    isAttachmentUnavailable(chat: any): boolean {
      return chat?.fileName === 'ATTACHMENT_UNAVAILABLE';
    }

    isImageMedia(chat: any): boolean {
      const u = chat?.fileUrl;
      return typeof u === 'string' && u.includes('image');
    }

    async refreshChatMediaIfNeeded(chat: any): Promise<void> {
      if (!chat?.id || !chat?.fileUrl || this.isAttachmentUnavailable(chat)) return;
      const raw = chat.fileUrlExpiresAtUtc;
      if (!raw) return;
      const exp = new Date(raw).getTime();
      if (!Number.isFinite(exp)) return;
      const renewIfBefore = Date.now() + 24 * 60 * 60 * 1000;
      if (exp > renewIfBefore) return;
      await this.refreshChatMediaUrl(chat);
    }

    async onChatMediaLoadError(chat: any): Promise<void> {
      await this.refreshChatMediaUrl(chat);
    }

    private async refreshChatMediaUrl(chat: any): Promise<void> {
      if (!chat?.id || !chat?.fileUrl || this.isAttachmentUnavailable(chat)) return;
      if (this._chatMediaRefreshing.has(chat.id)) return;
      this._chatMediaRefreshing.add(chat.id);
      try {
        const res = await firstValueFrom(this.messageService.refreshChatMediaSignedUrl(chat.id));
        chat.fileUrl = res.signedUrl;
        chat.fileUrlExpiresAtUtc = res.expiresAtUtc as any;
      } catch {
        /* keep existing URL */
      } finally {
        this._chatMediaRefreshing.delete(chat.id);
      }
    }
    convertToUTC(timecontrol: any): any {
      const selectedTime = timecontrol;
  
      if (selectedTime) {
        const utcDate = new Date();
        utcDate.setHours(selectedTime.getHours());
        utcDate.setMinutes(selectedTime.getMinutes());
        utcDate.setSeconds(selectedTime.getSeconds());
  
        const utcFormattedDate = this.datePipe.transform(utcDate, 'yyyy-MM-dd HH:mm:ss', 'UTC');
  
        return utcFormattedDate;
      }
    }

    backToChats(){
      this.clearInputData();
      this.revokePendingAttachmentUrls();
      this.filesList=[];
      this.openChat=false
    }
    clearInputData(){
      const fileInput =this.fileInputRef.nativeElement.value='';
      }
  onChangeFile(e) {
    e.preventDefault();
    let reloadedFiles: string[] = [];
  
    for (let item of e?.dataTransfer?.files?.length ? e?.dataTransfer?.files : e?.target?.files?.length ? e?.target?.files : []) {
        const isReloaded = this.filesList.some(
          (f) =>
            f.file.name === item.name &&
            f.file.size === item.size &&
            f.file.lastModified === item.lastModified
        );
  
        if(isFileSizeNotAllowed(item.size,this.authService.getAllowedFileSize())){
          this.toaster.warning(`${this.translate.instant("File_Size_Warning")} ${this.authService.getAllowedFileSize()} MB`)
        }
        else if (isReloaded) {
          reloadedFiles.push(item.name);
        } 
        
        else {
            this.filesList.push(
                {
                    file: item,
                    name: item.name,
                    type: item.type,
                    url: URL.createObjectURL(item),
                    size: item.size
                }
            );
        }
        
        this.disableButtonOrnot()
    }
  
  
   // Log a message if any file was reloaded
   if (reloadedFiles.length > 0) {
    const reloadedFilesMessage = `( ${reloadedFiles.join(', ')} ) ${this.translate.instant("already_uploaded")}`;
    this.toaster.warning(reloadedFilesMessage)
  
  }
    
  
   this.clearInputData()
  }

    openFileUploader() {
      this.fileInputRef.nativeElement.click(); // Programmatically trigger file input click
    }
    onRecieveMessages(){
      console.log('[SIGNALR-DIAG] onRecieveMessages() subscriber registered, this.email=', this.email);
      const sub = this.chatService.receivedMessages$.subscribe((res)=>{
        if (!res?.userEmail) {
          console.log('[SIGNALR-DIAG] receivedMessages$ emitted null/no-email, skipping');
          return;
        }
        console.log('[SIGNALR-DIAG] receivedMessages$ emitted: userEmail=', res.userEmail, '| this.email=', this.email, '| match=', res.userEmail === this.email);
        if(res.userEmail === this.email){
          this.updateMessagesOnReceive(res.message);
        }
      });
      this.subscriptions.push(sub);
    }
   
    onStatusChange(){
      console.log('[SIGNALR-DIAG] onStatusChange() subscriber registered, this.email=', this.email);
      const sub = this.chatService.updatedStatus$.subscribe(
        (res)=>{
          if (!res?.userEmail) {
            console.log('[SIGNALR-DIAG] updatedStatus$ emitted null/no-email, skipping');
            return;
          }
          console.log('[SIGNALR-DIAG] updatedStatus$ emitted: userEmail=', res.userEmail, '| this.email=', this.email, '| match=', res.userEmail === this.email);
          if(res.userEmail === this.email){
            this.updateMessageStatus(res.message);
          }
        }
      );
      this.subscriptions.push(sub);
    }
  
    updateMessageStatus(payload: string){
      if (!payload) return;
      const message: chatHub = JSON.parse(payload);
      console.log('status update', message);
      if (this.filteredDevices.length > 0 && !this.filteredDevices.includes(message.deviceId)) {
        return;
      }

      const findChat = this.listChats.find((chat) => chat.chat.id === message.chatId);
      if (findChat) {
        findChat.lastMessageStatus = message.status;
        findChat.lastMessageContent = message.msgBody;
        findChat.lastMessageDate = message.createdAt;
      }

      if (this.selectedChatId === message.chatId) {
        const foundMesg = this.selectedChat.find((m) => m.id === message.id);
        if (foundMesg) {
          if (message.status > (foundMesg.status ?? 0)) {
            foundMesg.status = message.status;
          }
          foundMesg.updatedAt = message.updatedAt;
          this.groupMessagesByDay();
        }
      }
    }

      updateMessagesOnReceive(message){
        console.log('[SIGNALR-DIAG] updateMessagesOnReceive() called, raw payload=', message);
        let newMessage:chatHub=JSON.parse(message);
        console.log('[SIGNALR-DIAG] parsed newMessage=', newMessage, '| selectedChatId=', this.selectedChatId, '| newMessage.chatId=', newMessage.chatId);
        if(this.filteredDevices.length==0 || (this.filteredDevices.length > 0 && this.filteredDevices.indexOf(newMessage.deviceId)>-1)){
          
          // in case the message is sent from the current opend chat
            if(this.selectedChatId === newMessage.chatId){
              if(newMessage.direction){
                newMessage.status=1
              }
              const existingIdx = this.selectedChat.findIndex((m) => m.id === newMessage.id);
              if (existingIdx >= 0) {
                this.selectedChat[existingIdx] = { ...this.selectedChat[existingIdx], ...newMessage };
              } else {
                this.selectedChat.push(newMessage);
              }
              setTimeout(() => {
                this.scrollToBottom();
              }, 0);        
            }

            // in case the message is sent from closedChat and same device
            let newChat={
              chat: {
                id: newMessage.chatId,
                chatName: newMessage.chatName,
                targetPhoneNumber: newMessage.targetPhoneNumber,
                createdAt: newMessage.createdAt,
              },
              device:newMessage.device,
              lastMessageDate: newMessage.createdAt,
              lastMessageContent: newMessage.msgBody,
              lastMessageFileName:newMessage.fileName,
              lastMessageFileUrl:newMessage.fileUrl,
              fileType:'',
              lastMessageDirection: newMessage.direction,
              lastMessageStatus:  newMessage.direction?1:null,
              unseenMessagesCount: newMessage.direction?0:1,
              targetPhoneNumber:newMessage.targetPhoneNumber

            }
              let foundChat = this.listChats.find((chat)=>chat.chat.id == newMessage.chatId);
                if (foundChat) {
                this.updateChatDataWithNewMsg(foundChat,newMessage)
                if((this.selectedChatId === newMessage.chatId) ){
                    if(!newMessage.direction){
                      this.markMessageAsRead(foundChat)
                    }
                  }
                }
                else{
                  this.listChats.unshift(newChat)
                }
                this.groupMessagesByDay();
        }

    }

    updateChatDataWithNewMsg(foundChat:chatsData,newMessage:chatHub){
      foundChat.lastMessageContent='';
      foundChat.lastMessageFileName='';
      foundChat.lastMessageFileUrl='';
      foundChat.fileType='';
      if(this.selectedChatId !== newMessage.chatId && newMessage.direction==false){
        foundChat.unseenMessagesCount+=1;
      }
      foundChat.lastMessageStatus=newMessage.direction?1:null;
      foundChat.lastMessageContent=newMessage.msgBody;
      foundChat.lastMessageDate=newMessage.createdAt;
      foundChat.lastMessageFileName = newMessage.fileName;
      foundChat.lastMessageFileUrl = newMessage.fileUrl;
      foundChat.lastMessageDirection=newMessage.direction;
      if(foundChat.chat.channelType>1){
        foundChat.targetPhoneNumber=newMessage.targetPhoneNumber
      }
    
      if(this.listChats.indexOf(foundChat) !== 0){
        // Remove the element from its current position
        this.listChats.splice(this.listChats.indexOf(foundChat), 1);
        // Add the element to the beginning of the array
        this.listChats.unshift(foundChat);
      }
    }
    changeTextDir(text){
      return /[^\u0000-\u007F]/.test(text) ? 'rtl' : 'ltr';
    }
    detectLanguage(text: string) {

      // Simple detection based on whether the text contains Arabic characters
      this.textDirection = /[^\u0000-\u007F]/.test(text) ? 'rtl' : 'ltr';
    }
    disableButtonOrnot() {
      if(this.activeChat.device.isDeleted){
        this.disable=true
      }
      else{
        this.disable = !(this.filesList.length > 0 || this.message.value.trim() !== '')

      }
    }


    ngOnDestroy() {
      this.chatService.closeConnection();
      this.closeSubsciptions();
      this.subscriptions.map((sub)=>sub.unsubscribe())
      }
}
