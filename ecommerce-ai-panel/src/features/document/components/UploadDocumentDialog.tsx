import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Modal from "@/shared/components/modal/Modal.tsx"
import FormSelect from "@/shared/components/common/FormSelect.tsx"
import { useUploadDocumentMutation } from "@/features/document/hooks/useDocumentQueries.tsx"
import {
  DOCUMENT_TYPE_OPTIONS,
  type DocumentType,
} from "@/shared/types/document"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"

const schema = z.object({
  document_type: z.enum([
    "urun",
    "kargo",
    "iade",
    "odeme",
    "garanti",
    "destek",
    "genel",
  ]),
})

type FormValues = z.infer<typeof schema>

type UploadDocumentDialogProps = {
  open: boolean
  onClose: () => void
}

export default function UploadDocumentDialog({
  open,
  onClose,
}: UploadDocumentDialogProps) {
  const uploadMutation = useUploadDocumentMutation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { document_type: "genel" },
  })

  useEffect(() => {
    if (!open) return
    setErrorText(null)
    setFile(null)
    reset({ document_type: "genel" })
    if (inputRef.current) inputRef.current.value = ""
  }, [open, reset])

  if (!open) return null

  const submitting = uploadMutation.isPending

  const close = () => {
    if (submitting) return
    setErrorText(null)
    setFile(null)
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    setErrorText(null)
    if (!file) {
      setErrorText("PDF seçin")
      return
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorText("Yalnızca PDF yüklenebilir")
      return
    }
    try {
      await uploadMutation.mutateAsync({
        file,
        documentType: values.document_type as DocumentType,
      })
      reset()
      onClose()
    } catch (err) {
      setErrorText(getApiErrorMessage(err, "Belge yüklenemedi"))
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Modal
        headText="Belge yükle"
        panelClassName="w-full max-w-md"
        closeHandle={close}
        buttons={[
          {
            text: "Vazgeç",
            handleButton: close,
            color: "bg-secondary hover:bg-secondary/90 ",
          },
          {
            text: submitting ? "Yükleniyor…" : "Yükle",
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
        <div className="space-y-4">
          <FormSelect
            control={control}
            name="document_type"
            label="Belge türü"
            options={DOCUMENT_TYPE_OPTIONS}
            placeholder="Tür seçin"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              PDF dosyası
            </label>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              disabled={submitting}
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null
                setFile(next)
                setErrorText(null)
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
            />
            {file ? (
              <p className="mt-1 text-xs text-muted-foreground">{file.name}</p>
            ) : null}
          </div>

          {errorText ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorText}
            </p>
          ) : null}
        </div>
      </Modal>
    </form>
  )
}
