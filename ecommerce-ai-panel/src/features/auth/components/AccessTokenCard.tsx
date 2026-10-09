import { useEffect, useMemo, useState } from "react"
import { Copy, Eye, EyeOff, KeyRound, RefreshCw, Timer } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/hooks/useAuth.tsx"
import { refreshAccessToken } from "@/shared/api/refresh"
import { AppButton } from "@/shared/components/common/AppButton.tsx"
import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/shared/components/common/AppCard.tsx"
import {
  formatRemainingMs,
  getJwtExpiresAtMs,
} from "@/shared/utils/jwt.ts"

function maskToken(token: string): string {
  if (token.length <= 12) return "•".repeat(token.length)
  return `${token.slice(0, 8)}${"•".repeat(16)}${token.slice(-4)}`
}

export default function AccessTokenCard() {
  const { token, user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [refreshing, setRefreshing] = useState(false)

  const expiresAtMs = useMemo(
    () => (token ? getJwtExpiresAtMs(token) : null),
    [token],
  )

  useEffect(() => {
    if (expiresAtMs == null) return
    const id = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [expiresAtMs])

  const remainingLabel =
    expiresAtMs == null
      ? "—"
      : formatRemainingMs(expiresAtMs - nowMs)

  const handleCopy = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      toast.success("Token kopyalandı")
    } catch {
      toast.error("Token kopyalanamadı")
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const next = await refreshAccessToken()
      if (!next) {
        toast.error("Token yenilenemedi")
        return
      }
      setNowMs(Date.now())
      toast.success("Token yenilendi")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <AppCard className="overflow-hidden border-0 bg-card shadow-md ring-0">
      <AppCardHeader className="bg-muted/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <AppCardTitle>API token</AppCardTitle>
              <AppCardDescription>
                {user?.name || user?.email
                  ? [user.name, user.email].filter(Boolean).join(" · ")
                  : "Giriş yapmış kullanıcının access JWT’si"}
              </AppCardDescription>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <AppButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={!token}
              onClick={() => {
                setVisible((v) => !v)
              }}
            >
              {visible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {visible ? "Gizle" : "Göster"}
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={!token}
              onClick={() => {
                void handleCopy()
              }}
            >
              <Copy className="h-4 w-4" />
              Kopyala
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={refreshing}
              onClick={() => {
                void handleRefresh()
              }}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Yenile
            </AppButton>
          </div>
        </div>
      </AppCardHeader>
      <AppCardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm shadow-inner">
          <Timer className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">Kalan süre</span>
          <span className="ml-auto font-medium tabular-nums">
            {token ? remainingLabel : "—"}
          </span>
        </div>
        {token ? (
          <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs break-all whitespace-pre-wrap shadow-inner">
            {visible ? token : maskToken(token)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">Oturum token’ı yok</p>
        )}
      </AppCardContent>
    </AppCard>
  )
}
