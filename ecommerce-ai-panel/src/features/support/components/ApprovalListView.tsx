import { useMemo } from "react"
import { Check, X } from "lucide-react"
import CardListTable from "@/shared/components/table/CardListTable.tsx"
import type { BaseItem, ItemDetail } from "@/shared/types/ItemDetail"
import type { ApprovalItem } from "@/shared/types/approval"

export type ApprovalRow = BaseItem & {
  id: string
  summary: string
  tool_name: string
  conversation_id: string
}

type ApprovalListViewProps = {
  approvals: ApprovalItem[]
  loading?: boolean
  error?: string | null
  onApprove: (approvalId: string) => void
  onReject: (index: number) => void
}

export default function ApprovalListView({
  approvals,
  loading,
  error,
  onApprove,
  onReject,
}: ApprovalListViewProps) {
  const items = useMemo<ApprovalRow[]>(
    () =>
      approvals.map((a) => ({
        id: a.id,
        summary: a.summary,
        tool_name: a.tool_name,
        conversation_id: a.conversation_id,
      })),
    [approvals],
  )

  const itemDetails = useMemo<ItemDetail[]>(
    () => [
      {
        title: "İşlem",
        dataKey: "summary",
        rowType: "text",
        width: 70,
      },
      {
        title: "Tool",
        dataKey: "tool_name",
        rowType: "text",
        width: 30,
      },
    ],
    [],
  )

  return (
    <CardListTable<ApprovalRow>
      items={items}
      itemDetails={itemDetails}
      loading={!!loading}
      error={error ?? null}
      emptyMessage="Bekleyen onay yok."
      listMaxHeight="70vh"
      editHandle={(itemId) => onApprove(String(itemId))}
      editButtonText="Onayla"
      editButtonIcon={Check}
      removeHandle={onReject}
      removeButtonText="Reddet"
      removeButtonIcon={X}
    />
  )
}
