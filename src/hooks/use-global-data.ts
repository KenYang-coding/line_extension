import { reactive, computed, type App } from 'vue'
import { useStorage } from './use-storage'
import { aesEncrypt, aesDecrypt } from '@/utils/crypto'
import type { AppConfig, UserInfoState } from '@/types/default'
import { ExtensionMessageType } from '@/types/default'

const CONFIG_KEY = 'config'
const LOCALE_KEY = 'locale'

export const globalState = reactive({
  config: {
    api_key: '',
  } as AppConfig,
  userInfo: null as UserInfoState | null,
  locale: 'zh_TW',
})

export function useGlobalData(i18n?: InstanceType<typeof App>) {
  const { getStorage, updateStorage } = useStorage()

  async function loadConfig() {
    const raw = await getStorage<string>(CONFIG_KEY)
    if (raw) {
      try {
        const decrypted = aesDecrypt(raw)
        const parsed = JSON.parse(decrypted) as AppConfig
        globalState.config = parsed
      } catch {
        // ignore malformed data
      }
    }
    const locale = await getStorage<string>(LOCALE_KEY)
    if (locale) {
      globalState.locale = locale
    }
  }

  async function saveConfig(config: AppConfig) {
    const encrypted = aesEncrypt(JSON.stringify(config))
    await updateStorage(CONFIG_KEY, encrypted)
    globalState.config = config
  }

  async function saveLocale(locale: string) {
    await updateStorage(LOCALE_KEY, locale)
    globalState.locale = locale
  }

  const isConfigured = computed(() => !!globalState.config.api_key)

  function initMessageListener() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === ExtensionMessageType.Init && message.data?.userInfo) {
        globalState.userInfo = message.data.userInfo
      }
    })
  }

  return { loadConfig, saveConfig, saveLocale, isConfigured, initMessageListener }
}
