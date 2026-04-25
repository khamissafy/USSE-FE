import { DeviceData } from "../devices/device"
import { ChatData } from "../messages/message"

export interface Campaigns {
  campaignName: string,
  scheduledAt: string,
  isRepeatable: true,
  repeatedDays: number,
  intervalFrom: number,
  intervalTo: number,
  blackoutFrom: string,
  blackoutTo: string,
  maxPerDay: number,
  attachments:string[],
  lists:string[],
  email: string,
  msgBody: string,
  deviceId: string
}
export interface compaignDetails{
  id:string,
  createdAt: string,
  scheduledAt: string,
  isRepeatable: boolean,
  repeatedDays:number,
  intervalFrom: number,
  intervalTo: number,
  sendingoutFrom:  string,
  sendingoutTo: string,
  maxPerDay: number,
  attachments: {fileName:string,fileUrl:string}[],
  lists: {listId:string}[],
  msgBody:string,
  isStopped: boolean,
  deviceId: string,
  device:DeviceData,
  message: string,
  campaignName:string,
  isInterval: boolean,
  actionCount:number,
  actions: any,
  sessionTimeOutMinutes: any,
  sessionTimeOutResponseContent: any
}
export interface CompaignStat{
  pendingCount: number,
  sentCount: number,
  deliveredCount: number,
  readCount: number,
  undeliveredCount: number,
  messageContent: string,
  attachments: []
}
export interface CompainMessages{
    id: string,
    deviceid: string,
    device:DeviceData | null,
    targetPhoneNumber: string,
    direction: boolean,
    chat: ChatData,
    attachments:string [] |null,
    msgBody: string,
    createdAt:string,
    updatedAt: string,
    isDeleted: boolean,
    isSeened: boolean,
    status: number,
    applicationUserId: string,
    msgType: string,
    fileName: string,
    fileUrl: string,
    campaignId: string
}
