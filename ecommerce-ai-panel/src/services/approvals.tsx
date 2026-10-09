import api from "@/shared/api/client"
import type {
  ApprovalListResponse,
  ApprovalResolveResponse,
} from "@/shared/types/approval"

export async function listPendingApprovals(): Promise<ApprovalListResponse> {
  const { data } = await api.get<ApprovalListResponse>("/support/approvals")
  return data
}

export async function approvePending(
  approvalId: string,
): Promise<ApprovalResolveResponse> {
  const { data } = await api.post<ApprovalResolveResponse>(
    `/support/approvals/${encodeURIComponent(approvalId)}/approve`,
  )
  return data
}

export async function rejectPending(
  approvalId: string,
): Promise<ApprovalResolveResponse> {
  const { data } = await api.post<ApprovalResolveResponse>(
    `/support/approvals/${encodeURIComponent(approvalId)}/reject`,
  )
  return data
}
