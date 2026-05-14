import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message as antMessage } from 'ant-design-vue'
import { globalState } from '@/hooks/use-global-data'
import { useStorage } from '@/hooks/use-storage'
import { STORAGE_KEYS } from '@/config.options'
import { ExtensionMessageType } from '@/types/default'
import type { PendingUser, SseEvent } from '@/types/api'
import {
  subscribeSse,
  createConversation,
  sendForceTakeover,
  closeConversation,
  getConversationList,
} from '@/api/assistant'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function useAssistant() {
  const { t } = useI18n()
  const { getStorage, updateStorage } = useStorage()

  const serviceInfo = reactive({
    enabled: false,
    loading: false,
  })

  const pendingUsers = reactive({
    data: [] as PendingUser[],
  })

  // conversation_id cache: lineUserId → conversation_id
  const conversationCache = reactive<Record<string, string>>({})

  // active force takeovers: lineUserId → conversation_id
  const activeTakeovers = reactive<Record<string, string>>({})

  // Force takeover in-progress flag
  const takeoverLoading = ref(false)

  let abortController: AbortController | null = null

  async function loadPersistedData() {
    const pending = await getStorage<PendingUser[]>(STORAGE_KEYS.PENDING_USERS)
    if (pending) pendingUsers.data = pending

    const cache = await getStorage<Record<string, string>>(STORAGE_KEYS.CONVERSATION_CACHE)
    if (cache) Object.assign(conversationCache, cache)

    const takeovers = await getStorage<Record<string, string>>(STORAGE_KEYS.ACTIVE_TAKEOVERS)
    if (takeovers) Object.assign(activeTakeovers, takeovers)
  }

  async function persistPendingUsers() {
    await updateStorage(STORAGE_KEYS.PENDING_USERS, pendingUsers.data)
  }

  async function persistConversationCache() {
    await updateStorage(STORAGE_KEYS.CONVERSATION_CACHE, { ...conversationCache })
  }

  async function persistActiveTakeovers() {
    await updateStorage(STORAGE_KEYS.ACTIVE_TAKEOVERS, { ...activeTakeovers })
  }

  function handleSseMessage(event: SseEvent) {
    if (event.code !== 0 || !event.data) return
    const data = event.data

    // Update conversation cache: try to map user_id to conversation_id
    const userId = data.user_info?.user_id
    if (userId && data.conversation_id) {
      conversationCache[userId] = data.conversation_id
      persistConversationCache()
    }

    // Check if this is confirming a force takeover (user already in activeTakeovers)
    const currentUserInfo = globalState.userInfo
    if (currentUserInfo?.user_id && activeTakeovers[currentUserInfo.user_id]) {
      // Already handled - skip adding to pending queue
      return
    }

    // Build pending user entry
    const displayName =
      data.user_info?.user_name ??
      data.user_info?.email ??
      data.user_info?.phone ??
      data.user_info?.user_id ??
      data.user_info?.anonymous_id ??
      'Unknown'

    const lastMessage = data.body?.find((b) => b.message_type === 'QUESTION')?.text ?? ''

    const newUser: PendingUser = {
      user_name: displayName,
      user_id: data.user_info?.user_id,
      email: data.user_info?.email,
      phone: data.user_info?.phone,
      anonymous_id: data.user_info?.anonymous_id,
      message: lastMessage,
      time: data.timestamp ?? Date.now(),
      conversation_id: data.conversation_id,
      conversation_type: data.conversation_type,
      channel_id: data.channel_id,
      channel_name: data.channel_name,
    }

    // Avoid duplicates
    const existingIdx = pendingUsers.data.findIndex(
      (u) => u.conversation_id === newUser.conversation_id,
    )
    if (existingIdx >= 0) {
      pendingUsers.data[existingIdx] = newUser
    } else {
      pendingUsers.data.unshift(newUser)
    }
    persistPendingUsers()
  }

  async function handleStart() {
    if (!globalState.config.api_key) {
      antMessage.warning(t('assistant.noApiKey'))
      return
    }
    serviceInfo.enabled = true
    abortController = new AbortController()

    try {
      await subscribeSse(
        globalState.config.api_key,
        handleSseMessage,
        (err) => {
          console.error('SSE error:', err)
          if (serviceInfo.enabled) {
            // Auto-reconnect after 3s
            setTimeout(() => {
              if (serviceInfo.enabled) handleStart()
            }, 3000)
          }
        },
        abortController.signal,
      )
    } catch (err) {
      console.error('SSE connection failed:', err)
    }
  }

  function handleStop() {
    serviceInfo.enabled = false
    abortController?.abort()
    abortController = null
  }

  async function handleForceTakeover(lineUserId: string) {
    if (!globalState.config.api_key) {
      antMessage.warning(t('assistant.noApiKey'))
      return
    }
    if (takeoverLoading.value) return

    takeoverLoading.value = true
    try {
      // Step 1: Get conversation_id (cache first, then API)
      let conversationId = conversationCache[lineUserId]
      if (!conversationId) {
        conversationId = (await createConversation(globalState.config.api_key, lineUserId)) ?? ''
        if (!conversationId) {
          antMessage.error(t('assistant.takeoverFailed'))
          return
        }
        conversationCache[lineUserId] = conversationId
        await persistConversationCache()
      }

      // Step 2: Send force takeover trigger
      const ok = await sendForceTakeover(globalState.config.api_key, conversationId)
      if (!ok) {
        antMessage.error(t('assistant.takeoverFailed'))
        return
      }

      // Register active takeover (will be confirmed when SSE establish arrives)
      activeTakeovers[lineUserId] = conversationId
      await persistActiveTakeovers()
      antMessage.success(t('assistant.takeoverSuccess'))
    } finally {
      takeoverLoading.value = false
    }
  }

  async function handleEndService(lineUserId: string) {
    const conversationId = activeTakeovers[lineUserId]
    if (!conversationId || !globalState.config.api_key) return

    await closeConversation(globalState.config.api_key, conversationId)
    delete activeTakeovers[lineUserId]
    await persistActiveTakeovers()
  }

  async function handleRemovePendingUser(user: PendingUser) {
    if (globalState.config.api_key && user.conversation_id) {
      await closeConversation(globalState.config.api_key, user.conversation_id)
    }
    pendingUsers.data = pendingUsers.data.filter(
      (u) => u.conversation_id !== user.conversation_id,
    )
    await persistPendingUsers()
  }

  async function handleClearAllPendingUsers() {
    if (globalState.config.api_key) {
      await Promise.all(
        pendingUsers.data.map((u) =>
          closeConversation(globalState.config.api_key, u.conversation_id),
        ),
      )
    }
    pendingUsers.data = []
    await persistPendingUsers()
  }

  function handleSwitchChat(user: PendingUser) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (!tabId) return
      chrome.tabs.sendMessage(tabId, {
        type: ExtensionMessageType.SwitchChat,
        data: {
          userId: user.user_id,
          channelId: user.channel_id,
        },
      })
    })
  }

  function isUserInQueue(lineUserId: string): boolean {
    return pendingUsers.data.some((u) => u.user_id === lineUserId)
  }

  function isTakeoverActive(lineUserId: string): boolean {
    return !!activeTakeovers[lineUserId]
  }

  function formatTime(timestamp?: number): string {
    if (!timestamp) return ''
    return dayjs(timestamp).fromNow()
  }

  return {
    serviceInfo,
    pendingUsers,
    activeTakeovers,
    takeoverLoading,
    loadPersistedData,
    handleStart,
    handleStop,
    handleForceTakeover,
    handleEndService,
    handleRemovePendingUser,
    handleClearAllPendingUsers,
    handleSwitchChat,
    isUserInQueue,
    isTakeoverActive,
    formatTime,
  }
}
