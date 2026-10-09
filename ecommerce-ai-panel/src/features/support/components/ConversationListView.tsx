import { useMemo } from "react"
import { MessageCircle } from "lucide-react"
import CardListTable from "@/shared/components/table/CardListTable.tsx"
import type { BaseItem, ItemDetail } from "@/shared/types/ItemDetail"
import type { SupportConversationSummary } from "@/shared/types/support"

export type ConversationRow = BaseItem & {
  id: string
  title: string
  conversation_id: string
}

type ConversationListViewProps = {
  conversations: SupportConversationSummary[]
  loading?: boolean
  error?: string | null
  onOpen: (conversationId: string) => void
  onDelete?: (index: number) => void
}

export default function ConversationListView({
  conversations,
  loading,
  error,
  onOpen,
  onDelete,
}: ConversationListViewProps) {
  const items = useMemo<ConversationRow[]>(
    () =>
      conversations.map((c) => ({
        id: c.conversation_id,
        title: c.title,
        conversation_id: c.conversation_id,
      })),
    [conversations],
  )

  const itemDetails = useMemo<ItemDetail[]>(
    () => [
      {
        title: "Sohbet",
        dataKey: "title",
        rowType: "text",
        width: 100,
      },
    ],
    [],
  )

  return (
    <CardListTable<ConversationRow>
      items={items}
      itemDetails={itemDetails}
      loading={!!loading}
      error={error ?? null}
      emptyMessage="Henüz sohbet yok."
      listMaxHeight="40vh"
      editHandle={(itemId) => onOpen(String(itemId))}
      editButtonText="Devam et"
      editButtonIcon={MessageCircle}
      removeHandle={onDelete}
    />
  )
}
