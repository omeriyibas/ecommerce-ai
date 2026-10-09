import api from "@/shared/api/client"
import type {
  SupportChatRequest,
  SupportChatResponse,
  SupportConversationCreateResponse,
  SupportConversationListResponse,
  SupportHistoryResponse,
} from "@/shared/types/support"

/** Araştırma rotası uzun sürebilir — istek bazlı timeout. */
const SUPPORT_TIMEOUT_MS = 130_000

export async function sendSupportMessage(
  payload: SupportChatRequest,
): Promise<SupportChatResponse> {
  const { data } = await api.post<SupportChatResponse>(
    "/support/chat",
    payload,
    { timeout: SUPPORT_TIMEOUT_MS },
  )
  return data
}

export async function getSupportHistory(
  conversationId: string,
): Promise<SupportHistoryResponse> {
  const { data } = await api.get<SupportHistoryResponse>(
    `/support/conversations/${encodeURIComponent(conversationId)}/messages`,
  )
  return data
}

export async function listSupportConversations(): Promise<SupportConversationListResponse> {
  const { data } = await api.get<SupportConversationListResponse>(
    "/support/conversations",
  )
  return data
}

export async function createSupportConversation(): Promise<SupportConversationCreateResponse> {
  const { data } = await api.post<SupportConversationCreateResponse>(
    "/support/conversations",
  )
  return data
}

export async function deleteSupportConversation(
  conversationId: string,
): Promise<void> {
  await api.delete(
    `/support/conversations/${encodeURIComponent(conversationId)}`,
  )
}
