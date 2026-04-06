export interface Chats {
    success:boolean,
    statusCode:number,
    message:string,
    count:number,
    data:chatsData[]
  

}
export interface chatsData{
    chat?: chat,
    lastMessageDate?: string,
    lastMessageContent?: string,
    lastMessageFileName?:string,
    lastMessageFileUrl?:string,
    lastMessageDirection?: boolean,
    lastMessageStatus?: number,
    unseenMessagesCount?: number,
    fileType?:string,
    device?: devices,
    active?: boolean;
    targetPhoneNumber?:string
}
interface chat {
    id?: string,
    chatName?: string,
    targetPhoneNumber?: string,
    createdAt?: string,
    isDeleted?: boolean,
    channelType?:number
}
export interface ChatById {
    id?: string,
    deviceid?: string,
    device?: any,
    targetPhoneNumber?: string,
    direction?: boolean,
    chat?: chat,
    msgBody?: string,
    createdAt?: string,
    updatedAt?: string,
    isDeleted?: boolean,
    isSeened?: boolean,
    status?: number,
    applicationUserId?: string,
    msgType?: string,
    fileName?: any,
    fileUrl?: any,
    campaignId?: any,
    actionCount?: any,
    isReply?: boolean,
    isEnquiry?: boolean,
    enquiryQuestion?: number,
    botId?: any,
    isCampaignAction?: boolean,
    updatedAtVisible?:boolean | false,
    day?: string
    groupName?:string
}
interface devices {
    id?: string,
    deviceName?: string,
    deviceType?: string,
    deviceNumber?: string,
    createdAt?: string,
    isConnected?: boolean,
    instanceId?: string,
    isDeleted?: boolean,
    delayIntervalInSeconds?: number,
    applicationUserId?: string,
    host?: string,
    password?: string,
    port?: number,
    systemID?: string,
    lastUpdate?: string,
    token?: string
}

/** Matches backend SignalRDevice (safe subset, no secrets). */
export interface SignalRDevice {
    id: string;
    deviceName: string;
    deviceType: string;
    deviceNumber?: string;
    isConnected: boolean;
    isDeleted: boolean;
}

/** Matches backend <see cref="MessageForSignalR" /> JSON (camelCase from Newtonsoft). */
export interface chatHub {
    chatName: string;
    id: string;
    deviceId: string;
    targetPhoneNumber: string;
    direction: boolean;
    msgBody: string;
    createdAt: string;
    updatedAt: string;
    chatId: string;
    isDeleted: boolean;
    isSeened: boolean;
    status: number;
    msgType: string;
    fileName: string;
    fileUrl: string;
    campaignId: string;
    actionCount: any;
    isReply: boolean;
    isEnquiry: boolean;
    enquiryQuestion: number;
    botId: string;
    isCampaignAction: boolean;
    groupName?: string;
    device?: SignalRDevice;
}
