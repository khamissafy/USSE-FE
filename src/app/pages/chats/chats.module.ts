import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatsComponent } from './component/chats.component';
import { ChatsRoutes } from './chats.routing';
import { SharedModule } from 'src/app/shared/shared.module';
import { ChatsService } from './chats.service';
import { ChatContactsComponent } from './components/chat-contacts/chat-contacts.component';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { TimeOnlyPipe } from './pipe/timeOnly.pipe';
import { AttachmentsComponent } from './components/upload-files/attachments/attachments.component';
import { AttachTypePipe } from './components/upload-files/attachType.pipe';
import { LastMsgFileTypePipe } from './pipe/lastMsgFileType.pipe';
import { SelectModule } from 'src/app/shared/components/select/select.module';


@NgModule({
  imports: [
    CommonModule,
    ChatsRoutes,
    SharedModule,
    PickerModule,
    SelectModule
    
  ],
  declarations: [
    ChatsComponent,
    ChatContactsComponent,
    TimeOnlyPipe,
    AttachmentsComponent,
    AttachTypePipe,
    LastMsgFileTypePipe

  ],
  providers:[ChatsService]
})
export class ChatsModule { }
