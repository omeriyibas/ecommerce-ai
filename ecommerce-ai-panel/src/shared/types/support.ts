export type SupportChatRequest = {
  message: string
  conversation_id?: string | null
}

export type SupportPendingApproval = {
  id: string
  summary: string
  tool_name: string
}

export type ChatOrderItem = {
  id: number
  product: string
  amount: number
}

export type ChatPaymentItem = {
  order_id: number
  product: string
  status: string
}

export type SupportChatResponse = {
  conversation_id: string
  message: string
  route: string
  order_items: ChatOrderItem[]
  payment_items: ChatPaymentItem[]
  pending_approvals?: SupportPendingApproval[]
}

export type SupportHistoryMessage = {
  role: "user" | "assistant"
  content: string
}

export type SupportHistoryResponse = {
  conversation_id: string
  messages: SupportHistoryMessage[]
}

export type SupportConversationSummary = {
  conversation_id: string
  title: string
}

export type SupportConversationListResponse = {
  conversations: SupportConversationSummary[]
}

export type SupportConversationCreateResponse = {
  conversation_id: string
}

export type ChatRole = "user" | "assistant"

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  orderItems?: ChatOrderItem[]
  paymentItems?: ChatPaymentItem[]
  pending?: boolean
  error?: boolean
}
