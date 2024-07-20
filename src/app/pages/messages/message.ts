import { DeviceData } from "../devices/device"

export interface Message {
    success: boolean,
    message: string,
    count: number,
    data: messageData[],
}
export interface messageData{
  id: string,
  deviceid:string,
  device: DeviceData | null,
  targetPhoneNumber: string,
  direction: boolean,
  attachments: string | null,
  msgBody:string,
  createdAt:string,
  updatedAt: string | null,
  isDeleted: boolean,
  isSeened: boolean,
  status: number | null,
  applicationUserId: string,
  msgType:string,
  fileName: string | null,
  fileUrl: string | null,
  campaignId: string | null,
  chat:ChatData,
  groupName:string,
}
export interface Shceduled{
  success:boolean,
  statusCode:number,
  message:string,
  count:number,
  data:ShceduledData[]
}
export interface ShceduledData{
  id:string,
  msgType: string,
  targetPhoneNumber:{number:string} [],
  attachments: [],
  msgBody: string,
  scheduledAt: string,
  createdAt: string,
  device: DeviceData,
  chat:ChatData

}
export interface SendData{
  deviceid: string,
  targetPhoneNumber:   {
    number: string,
    name: string
  }[],
  attachments:string[],
  msgBody: string,
  scheduledAt:string,
  email: string
}
export interface ChatData{

    id: string,
    chatName: string,
    targetPhoneNumber: string,
    createdAt: string,
    isDeleted: boolean

}
