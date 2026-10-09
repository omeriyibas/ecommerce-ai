import { useCallback, useEffect, useState } from "react"
import { Loader2, MessageSquarePlus } from "lucide-react"
import { toast } from "sonner"
import SupportChat from "@/features/support/components/SupportChat.tsx"
import ConversationListView from "@/features/support/components/ConversationListView.tsx"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import ConfirmationModal from "@/shared/components/modal/ConfirmationModal.tsx"
import Modal from "@/shared/components/modal/Modal.tsx"
import {
  createSupportConversation,
  deleteSupportConversation,
  listSupportConversations,
} from "@/services/support.tsx"
import type { SupportConversationSummary } from "@/shared/types/support"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const STORAGE_KEY = "shopiva_support_conversation_id"

export default function SupportChatPage() {
  const [conversations, setConversations] = useState<
    SupportConversationSummary[]
  >([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] =
    useState<SupportConversationSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  const refreshList = useCallback(async () => {
    try {
      setListError(null)
      const res = await listSupportConversations()
      setConversations(res.conversations)
    } catch (err) {
      const msg = getApiErrorMessage(err, "Sohbet listesi yüklenemedi")
      setListError(msg)
      toast.error(msg)
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  const handleConversationIdChange = useCallback((id: string) => {
    setActiveId(id)
    sessionStorage.setItem(STORAGE_KEY, id)
  }, [])

  const openChat = (id: string) => {
    handleConversationIdChange(id)
    setChatOpen(true)
  }

  const closeChat = () => {
    setChatOpen(false)
    void refreshList()
  }

  const handleNew = async () => {
    setCreating(true)
    try {
      const res = await createSupportConversation()
      openChat(res.conversation_id)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Yeni sohbet açılamadı"))
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteRequest = (index: number) => {
    const row = conversations[index]
    if (row) setPendingDelete(row)
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDelete || deleting) return
    setDeleting(true)
    try {
      await deleteSupportConversation(pendingDelete.conversation_id)
      if (activeId === pendingDelete.conversation_id) {
        setChatOpen(false)
        setActiveId(null)
        sessionStorage.removeItem(STORAGE_KEY)
      }
      setPendingDelete(null)
      toast.success("Sohbet silindi")
      await refreshList()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Sohbet silinemedi"))
    } finally {
      setDeleting(false)
    }
  }

  const activeTitle =
    conversations.find((c) => c.conversation_id === activeId)?.title ??
    "Sohbet"

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Destek
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sipariş, ödeme ve ürün sorularınız için asistanla sohbet edin.
          </p>
        </div>
        <AppButton
          variant="secondary"
          className="shrink-0"
          onClick={() => {
            void handleNew()
          }}
          disabled={creating}
        >
          {creating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="size-4" />
          )}
          Yeni sohbet
        </AppButton>
      </div>

      <ConversationListView
        conversations={conversations}
        loading={listLoading}
        error={listError}
        onOpen={openChat}
        onDelete={handleDeleteRequest}
      />

      <ConfirmationModal
        isOpen={!!pendingDelete}
        onClose={() => {
          if (!deleting) setPendingDelete(null)
        }}
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
        title="Silme onayı"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" sohbeti silinsin mi?`
            : "Sohbet silinsin mi?"
        }
        confirmText={deleting ? "Siliniyor…" : "Sil"}
        cancelText="İptal"
      />

      {chatOpen && activeId ? (
        <Modal
          headText={activeTitle}
          closeHandle={closeChat}
          panelClassName="w-full max-w-2xl"
          marginY="my-4"
          buttons={[
            {
              text: "Kapat",
              handleButton: closeChat,
              color: "bg-secondary hover:bg-secondary/90 ",
            },
          ]}
        >
          <SupportChat
            conversationId={activeId}
            onConversationIdChange={handleConversationIdChange}
            embedded
          />
        </Modal>
      ) : null}
    </div>
  )
}
