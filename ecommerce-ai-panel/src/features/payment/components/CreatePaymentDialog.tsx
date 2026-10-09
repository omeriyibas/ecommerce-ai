import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Modal from "@/shared/components/modal/Modal.tsx"
import FormSelect from "@/shared/components/common/FormSelect.tsx"
import {
  useCreatePaymentMutation,
  usePaymentsQuery,
  useUpdatePaymentMutation,
} from "@/features/payment/hooks/usePaymentQueries.tsx"
import { useOrdersQuery } from "@/features/order/hooks/useOrderQueries.tsx"
import type { Payment, PaymentStatus } from "@/shared/types/payment"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const statusOptions = [
  { value: "pending", label: "Beklemede" },
  { value: "paid", label: "Ödendi" },
  { value: "failed", label: "Başarısız" },
  { value: "refunded", label: "İade" },
]

const schema = z.object({
  order_id: z.number({ error: "Sipariş seçin" }).int().positive("Sipariş seçin"),
  status: z.enum(["pending", "paid", "failed", "refunded"]),
})

type FormValues = z.infer<typeof schema>

type CreatePaymentDialogProps = {
  open: boolean
  onClose: () => void
  payment?: Payment | null
}

export default function CreatePaymentDialog({
  open,
  onClose,
  payment = null,
}: CreatePaymentDialogProps) {
  const createMutation = useCreatePaymentMutation()
  const updateMutation = useUpdatePaymentMutation()
  const { data: orders = [], isLoading: ordersLoading } = useOrdersQuery()
  const { data: payments = [] } = usePaymentsQuery()
  const [errorText, setErrorText] = useState<string | null>(null)
  const isEdit = !!payment

  const orderOptions = useMemo(() => {
    const paidOrderIds = new Set(
      payments
        .filter((p) => !payment || p.id !== payment.id)
        .map((p) => p.order_id),
    )
    return orders
      .filter((o) => !paidOrderIds.has(o.id) || o.id === payment?.order_id)
      .map((o) => ({
        value: o.id,
        label: `#${o.id} — ${o.product}`,
      }))
  }, [orders, payments, payment])

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      order_id: undefined as unknown as number,
      status: "pending",
    },
  })

  useEffect(() => {
    if (!open) return
    setErrorText(null)
    if (payment) {
      reset({
        order_id: payment.order_id,
        status: (payment.status as PaymentStatus) || "pending",
      })
    } else {
      reset({
        order_id: undefined as unknown as number,
        status: "pending",
      })
    }
  }, [open, payment, reset])

  if (!open) return null

  const submitting = createMutation.isPending || updateMutation.isPending

  const close = () => {
    if (submitting) return
    setErrorText(null)
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    setErrorText(null)
    try {
      if (payment) {
        await updateMutation.mutateAsync({
          id: payment.id,
          payload: {
            order_id: values.order_id,
            status: values.status,
          },
        })
      } else {
        await createMutation.mutateAsync({
          order_id: values.order_id,
          status: values.status,
        })
      }
      reset()
      onClose()
    } catch (err) {
      setErrorText(
        getApiErrorMessage(
          err,
          isEdit ? "Ödeme güncellenemedi" : "Ödeme oluşturulamadı",
        ),
      )
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Modal
        headText={isEdit ? "Ödeme düzenle" : "Ödeme oluştur"}
        panelClassName="w-full max-w-md"
        closeHandle={close}
        buttons={[
          {
            text: "Vazgeç",
            handleButton: close,
            color: "bg-secondary hover:bg-secondary/90 ",
          },
          {
            text: submitting
              ? isEdit
                ? "Kaydediliyor..."
                : "Oluşturuluyor..."
              : isEdit
                ? "Kaydet"
                : "Oluştur",
            handleButton: () => {
              void handleSubmit(onSubmit)()
            },
            color: submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90",
            loading: submitting,
            disabled:
              submitting || ordersLoading || orderOptions.length === 0,
          },
        ]}
      >
        <FormSelect
          label="Sipariş"
          name="order_id"
          control={control}
          options={orderOptions}
          placeholder={
            ordersLoading
              ? "Siparişler yükleniyor..."
              : orderOptions.length === 0
                ? "Ödemesiz sipariş yok"
                : "Sipariş seçin"
          }
          isDisabled={ordersLoading || orderOptions.length === 0}
        />
        <FormSelect
          label="Durum"
          name="status"
          control={control}
          options={statusOptions}
          placeholder="Durum seçin"
          searchIsHidden
        />
        {errorText ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorText}
          </p>
        ) : null}
      </Modal>
    </form>
  )
}
