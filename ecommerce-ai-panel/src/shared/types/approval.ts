export type ApprovalStatus = "pending" | "approved" | "rejected"

export type ApprovalItem = {
  id: string
  conversation_id: string
  tool_name: string
  summary: string
  args: Record<string, unknown>
  status: ApprovalStatus
  created_at?: string | null
}

export type ApprovalListResponse = {
  approvals: ApprovalItem[]
}

export type ApprovalResolveResponse = {
  approval_id: string
  status: "approved" | "rejected"
  conversation_id: string
  message: string
}
