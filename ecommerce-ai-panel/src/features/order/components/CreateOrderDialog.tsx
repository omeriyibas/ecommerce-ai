import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Modal from "@/shared/components/modal/Modal.tsx"
import FormSelect from "@/shared/components/common/FormSelect.tsx"
import {
  useCreateOrderMutation,
  useUpdateOrderMutation,
} from "@/features/order/hooks/useOrderQueries.tsx"
import { useProductsQuery } from "@/features/product/hooks/useProductQueries.tsx"
import type { Order, OrderStatus } from "@/shared/types/order"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const statusOptions = [
  { value: "pending", label: "Beklemede" },
  { value: "shipped", label: "Kargoda" },
  { value: "delivered", label: "Teslim edildi" },
  { value: "cancelled", label: "İptal" },
]

const schema = z.object({
  product_id: z.number({ error: "Ürün seçin" }).int().positive("Ürün seçin"),
  status: z.enum(["pending", "shipped", "delivered", "cancelled"]),
})

type FormValues = z.infer<typeof schema>

type CreateOrderDialogProps = {
  open: boolean
  onClose: () => void
  order?: Order | null
}

export default function CreateOrderDialog({
  open,
  onClose,
  order = null,
}: CreateOrderDialogProps) {
  const createMutation = useCreateOrderMutation()
  const updateMutation = useUpdateOrderMutation()
  const { data: products = [], isLoading: productsLoading } = useProductsQuery()
  const [errorText, setErrorText] = useState<string | null>(null)
  const isEdit = !!order

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.name} — ${new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
        }).format(p.price)}`,
      })),
    [products],
  )

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: undefined as unknown as number,
      status: "pending",
    },
  })

  useEffect(() => {
    if (!open) return
    setErrorText(null)
    if (order) {
      reset({
        product_id: order.product_id,
        status: (order.status as OrderStatus) || "pending",
      })
    } else {
      reset({
        product_id: undefined as unknown as number,
        status: "pending",
      })
    }
  }, [open, order, reset])

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
      if (order) {
        await updateMutation.mutateAsync({
          id: order.id,
          payload: {
            product_id: values.product_id,
            status: values.status,
          },
        })
      } else {
        await createMutation.mutateAsync({
          product_id: values.product_id,
          status: values.status,
        })
      }
      reset()
      onClose()
    } catch (err) {
      setErrorText(
        getApiErrorMessage(
          err,
          isEdit ? "Sipariş güncellenemedi" : "Sipariş oluşturulamadı",
        ),
      )
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Modal
        headText={isEdit ? "Sipariş düzenle" : "Sipariş oluştur"}
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
              submitting || productsLoading || productOptions.length === 0,
          },
        ]}
      >
        <FormSelect
          label="Ürün"
          name="product_id"
          control={control}
          options={productOptions}
          placeholder={
            productsLoading
              ? "Ürünler yükleniyor..."
              : productOptions.length === 0
                ? "Önce ürün ekleyin"
                : "Ürün seçin"
          }
          isDisabled={productsLoading || productOptions.length === 0}
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
