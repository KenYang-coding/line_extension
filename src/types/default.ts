export interface AppConfig {
  api_key: string
  response_mode?: 'streaming' | 'blocking'
}

export interface UserInfoState {
  user_id?: string
  name?: string
  avatar?: string
}

export enum ExtensionMessageType {
  Init = 'Init',
  SwitchChat = 'SwitchChat',
}

export interface ExtensionMessage {
  type: ExtensionMessageType
  data?: {
    userInfo?: UserInfoState
    userId?: string
    channelId?: string
  }
}
