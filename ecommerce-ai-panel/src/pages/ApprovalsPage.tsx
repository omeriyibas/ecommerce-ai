import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import ApprovalListView from "@/features/support/components/ApprovalListView.tsx"
import ConfirmationModal from "@/shared/components/modal/ConfirmationModal.tsx"
import {
  approvePending,
  listPendingApprovals,
  rejectPending,
} from "@/services/approvals.tsx"
import type { ApprovalItem } from "@/shared/types/approval"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingReject, setPendingReject] = useState<ApprovalItem | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const res = await listPendingApprovals()
      setApprovals(res.approvals)
    } catch (err) {
      const msg = getApiErrorMessage(err, "Onay listesi yüklenemedi")
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleApprove = async (approvalId: string) => {
    if (busy) return
    setBusy(true)
    try {
      const res = await approvePending(approvalId)
      toast.success(res.message || "İşlem onaylandı")
      await refresh()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Onaylanamadı"))
    } finally {
      setBusy(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!pendingReject || busy) return
    setBusy(true)
    try {
      const res = await rejectPending(pendingReject.id)
      toast.success(res.message || "İşlem reddedildi")
      setPendingReject(null)
      await refresh()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Reddedilemedi"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Onaylar
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Destek asistanının onay bekleyen işlemlerini buradan yönetin.
        </p>
      </div>

      <ApprovalListView
        approvals={approvals}
        loading={loading}
        error={error}
        onApprove={(id) => {
          void handleApprove(id)
        }}
        onReject={(index) => {
          const row = approvals[index]
          if (row) setPendingReject(row)
        }}
      />

      <ConfirmationModal
        isOpen={!!pendingReject}
        onClose={() => {
          if (!busy) setPendingReject(null)
        }}
        onConfirm={() => {
          void handleRejectConfirm()
        }}
        title="Red onayı"
        message={
          pendingReject
            ? `"${pendingReject.summary}" reddedilsin mi?`
            : "İşlem reddedilsin mi?"
        }
        confirmText={busy ? "Reddediliyor…" : "Reddet"}
        cancelText="İptal"
      />
    </div>
  )
}
