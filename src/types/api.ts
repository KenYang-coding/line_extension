export enum ConversationTypeEnum {
  WEB = 'WEB',
  SHARE = 'SHARE',
  API = 'API',
  EMBED = 'EMBED',
  WIDGET = 'WIDGET',
  APP = 'APP',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
  SLACK = 'SLACK',
  LINE = 'LINE',
  WHATSAPP_META = 'WHATSAPP_META',
  DINGTALK = 'DINGTALK',
  LIVECHAT = 'LIVECHAT',
  WORKFLOW_CHAT = 'WORKFLOW_CHAT',
}

export interface RespObject<T> {
  data: T
  code: number
  message: string
}

export interface UserInfo {
  user_id?: string
  user_name?: string
  email?: string
  phone?: string
  anonymous_id?: string
}

export interface MessageBody {
  text?: string
  message_type?: 'QUESTION' | 'ANSWER'
  files?: {
    content_type: string
    url: string
  }
}

export interface PendingUser {
  avatar?: string
  user_name?: string
  user_id?: string
  email?: string
  phone?: string
  anonymous_id?: string
  message?: string
  time?: number
  conversation_id: string
  conversation_type?: string
  channel_id?: string
  channel_name?: string
}

export interface SseEventData {
  conversation_id: string
  user_info?: UserInfo
  body?: MessageBody[]
  timestamp?: number
  conversation_type?: string
  channel_id?: string
  channel_name?: string
}

export interface SseEvent {
  code: number
  data: SseEventData
}

export interface ConversationOption {
  conversationType: ConversationTypeEnum
  channels: {
    channelName: string
    channelId: string
  }[]
}

export interface CreateConversationResp {
  conversation_id: string
}
