import axios from 'axios'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { API_BASE_URL, FORCE_TAKEOVER_TRIGGER } from '@/config.options'
import type { RespObject, CreateConversationResp, SseEvent, ConversationOption } from '@/types/api'

function authHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
}

export function subscribeSse(
  apiKey: string,
  onMessage: (event: SseEvent) => void,
  onError: (err: unknown) => void,
  signal: AbortSignal,
) {
  return fetchEventSource(`${API_BASE_URL}/v1/browser/extension/subscribe`, {
    method: 'GET',
    headers: authHeaders(apiKey),
    signal,
    onmessage(ev) {
      try {
        const parsed = JSON.parse(ev.data) as SseEvent
        onMessage(parsed)
      } catch {
        // ignore parse errors
      }
    },
    onerror(err) {
      onError(err)
    },
  })
}

export async function createConversation(
  apiKey: string,
  lineUserId: string,
): Promise<string | null> {
  try {
    const resp = await axios.post<CreateConversationResp>(
      `${API_BASE_URL}/v1/conversation`,
      { user_id: lineUserId },
      { headers: authHeaders(apiKey) },
    )
    return resp.data.conversation_id ?? null
  } catch {
    return null
  }
}

export async function sendForceTakeover(
  apiKey: string,
  conversationId: string,
): Promise<boolean> {
  try {
    await axios.post(
      `${API_BASE_URL}/v2/conversation/message`,
      {
        conversation_id: conversationId,
        response_mode: 'webhook',
        messages: [{ role: 'user', content: FORCE_TAKEOVER_TRIGGER }],
        conversation_config: {
          short_term_memory: false,
          long_term_memory: false,
          custom_variables: { admin_takeover: 'true' },
        },
      },
      { headers: authHeaders(apiKey) },
    )
    return true
  } catch {
    return false
  }
}

export async function closeConversation(
  apiKey: string,
  conversationId: string,
): Promise<boolean> {
  try {
    await axios.post<RespObject<void>>(
      `${API_BASE_URL}/v1/human/close`,
      { conversation_id: conversationId, timestamp: Date.now() },
      { headers: authHeaders(apiKey) },
    )
    return true
  } catch {
    return false
  }
}

export async function getConversationList(
  apiKey: string,
): Promise<ConversationOption[]> {
  try {
    const resp = await axios.post<RespObject<ConversationOption[]>>(
      `${API_BASE_URL}/v1/browser/extension/conversation/list`,
      {},
      { headers: authHeaders(apiKey) },
    )
    return resp.data.data ?? []
  } catch {
    return []
  }
}
