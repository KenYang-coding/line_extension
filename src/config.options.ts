export const API_BASE_URL = 'https://api-prod.gptbots.ai'

export const FORCE_TAKEOVER_TRIGGER = '<transfer_human>'

export const SUPPORTED_PLATFORMS = [
  { name: 'LINE', icon: 'line', match: ['chat.line.biz'] },
]

export const STORAGE_KEYS = {
  CONFIG: 'config',
  PENDING_USERS: 'pending_users',
  ACTIVE_TAKEOVERS: 'active_takeovers',
  CONVERSATION_CACHE: 'conversation_cache',
  LOCALE: 'locale',
}
