import { useEffect, useRef, useState } from "react"
import { Loader2, Send } from "lucide-react"
import ChatItemList from "@/features/support/components/ChatItemList.tsx"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import { AppInput } from "@/shared/components/common/AppInput.tsx"
import {
  getSupportHistory,
  sendSupportMessage,
} from "@/services/support.tsx"
import type { ChatMessage } from "@/shared/types/support"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"
import { cn } from "@/lib/utils.ts"

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Merhaba! Sipariş, ödeme veya ürün hakkında sorularınızı sorabilirsiniz.",
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type SupportChatProps = {
  conversationId: string | null
  onConversationIdChange: (id: string) => void
  /** Modal içinde: dış kart çerçevesi yok */
  embedded?: boolean
}

export default function SupportChat({
  conversationId,
  onConversationIdChange,
  embedded = false,
}: SupportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadGen = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const gen = ++loadGen.current
    setInput("")
    setMessages([WELCOME])

    if (!conversationId) {
      setLoadingHistory(false)
      return
    }

    setLoadingHistory(true)
    void getSupportHistory(conversationId)
      .then((res) => {
        if (gen !== loadGen.current) return
        onConversationIdChange(res.conversation_id)
        if (res.messages.length === 0) {
          setMessages([WELCOME])
          return
        }
        setMessages([
          WELCOME,
          ...res.messages.map((m) => ({
            id: newId(),
            role: m.role,
            content: m.content,
          })),
        ])
      })
      .catch(() => {
        if (gen !== loadGen.current) return
        setMessages([WELCOME])
      })
      .finally(() => {
        if (gen === loadGen.current) setLoadingHistory(false)
      })
  }, [conversationId, onConversationIdChange])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: text,
    }
    const pendingId = newId()
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: pendingId,
        role: "assistant",
        content: "Yanıt hazırlanıyor…",
        pending: true,
      },
    ])
    setInput("")
    setSending(true)

    try {
      const res = await sendSupportMessage({
        message: text,
        conversation_id: conversationId,
      })
      onConversationIdChange(res.conversation_id)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: pendingId,
                role: "assistant",
                content: res.message,
                orderItems: res.order_items ?? [],
                paymentItems: res.payment_items ?? [],
              }
            : m,
        ),
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: pendingId,
                role: "assistant",
                content: getApiErrorMessage(
                  err,
                  "Yanıt alınamadı. Lütfen tekrar deneyin.",
                ),
                error: true,
              }
            : m,
        ),
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        embedded
          ? "h-[min(55vh,480px)]"
          : "h-[min(70vh,640px)] rounded-2xl border border-border bg-card shadow-sm",
      )}
    >
      <div
        className={cn(
          "min-h-0 flex-1 space-y-3 overflow-y-auto",
          embedded ? "px-1 py-2" : "p-4 sm:p-5",
        )}
      >
        {loadingHistory ? (
          <p className="text-sm text-muted-foreground">Geçmiş yükleniyor…</p>
        ) : null}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[85%]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.error
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-foreground",
                msg.pending && "italic text-muted-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {!msg.pending && !msg.error ? (
                <ChatItemList
                  orderItems={msg.orderItems}
                  paymentItems={msg.paymentItems}
                />
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t border-border p-3 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <AppInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesajınızı yazın…"
          disabled={sending || loadingHistory}
          className="flex-1"
          autoComplete="off"
        />
        <AppButton
          type="submit"
          variant="secondary"
          disabled={sending || loadingHistory || !input.trim()}
          className="shrink-0"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Gönder
        </AppButton>
      </form>
    </div>
  )
}
