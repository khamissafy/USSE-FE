export interface DeviceData {
    id: string,
    deviceName: string,
    deviceType: string,
    deviceNumber: string,
    createdAt: string,
    isConnected: boolean,
    instanceId:string,
    delayIntervalInSeconds:number,
    isDeleted: boolean,
    applicationUserId: string,
    host: string,
    password: string,
    port: any,
    systemID: string,
    lastUpdate: string,
    token: string,
    canEdit?:boolean

}
export interface Init{
  base64:string,
  sessionName:string,
  token:string,
  isSuccess:boolean,
  port:number,
  serverId:number
  errorMessage:string | null
}
export interface CheckCon {
  status:boolean,
  message:string,
  isSuccess:boolean,
  errorMessage:string | null
}
