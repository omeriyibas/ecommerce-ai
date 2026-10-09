import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Modal from "@/shared/components/modal/Modal.tsx"
import FormTextInput from "@/shared/components/common/FormTextInput.tsx"
import FormNumberInput from "@/shared/components/common/FormNumberInput.tsx"
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/features/product/hooks/useProductQueries.tsx"
import type { Product } from "@/shared/types/product"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const schema = z.object({
  name: z.string().trim().min(1, "Ürün adı gerekli").max(128),
  price: z.number({ error: "Fiyat gerekli" }).positive("Fiyat 0'dan büyük olmalı"),
  description: z.string().max(512).optional(),
})

type FormValues = z.infer<typeof schema>

type CreateProductDialogProps = {
  open: boolean
  onClose: () => void
  product?: Product | null
}

export default function CreateProductDialog({
  open,
  onClose,
  product = null,
}: CreateProductDialogProps) {
  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation()
  const [errorText, setErrorText] = useState<string | null>(null)
  const isEdit = !!product

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
    },
  })

  useEffect(() => {
    if (!open) return
    setErrorText(null)
    if (product) {
      reset({
        name: product.name,
        price: product.price,
        description: product.description ?? "",
      })
    } else {
      reset({ name: "", price: 0, description: "" })
    }
  }, [open, product, reset])

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
    const payload = {
      name: values.name.trim(),
      price: values.price,
      description: values.description?.trim() || "",
    }
    try {
      if (product) {
        await updateMutation.mutateAsync({ id: product.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      reset()
      onClose()
    } catch (err) {
      setErrorText(
        getApiErrorMessage(
          err,
          isEdit ? "Ürün güncellenemedi" : "Ürün eklenemedi",
        ),
      )
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Modal
        headText={isEdit ? "Ürün düzenle" : "Ürün ekle"}
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
                : "Ekleniyor..."
              : isEdit
                ? "Kaydet"
                : "Ekle",
            handleButton: () => {
              void handleSubmit(onSubmit)()
            },
            color: submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90",
            loading: submitting,
            disabled: submitting,
          },
        ]}
      >
        <FormTextInput
          label="Ürün adı"
          name="name"
          control={control}
          placeholder="Ürün adı"
        />
        <FormNumberInput
          label="Fiyat (₺)"
          name="price"
          control={control}
          placeholder="0,00"
          decimalScale={2}
          fixedDecimalScale
        />
        <FormTextInput
          label="Açıklama"
          name="description"
          control={control}
          placeholder="Opsiyonel"
          rowCount={3}
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
