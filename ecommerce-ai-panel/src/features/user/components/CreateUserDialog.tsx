import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Modal from "@/shared/components/modal/Modal.tsx"
import FormTextInput from "@/shared/components/common/FormTextInput.tsx"
import { useCreateUserMutation } from "@/features/user/hooks/useUserQueries.tsx"
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts"
import { useState } from "react"

const schema = z
  .object({
    name: z.string().trim().min(2, "Ad en az 2 karakter olmalı"),
    email: z.string().trim().email("Geçerli bir e-posta girin"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
    confirm_password: z.string().min(1, "Şifre tekrarı gerekli"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm_password"],
  })

type FormValues = z.infer<typeof schema>

type CreateUserDialogProps = {
  open: boolean
  onClose: () => void
}

export default function CreateUserDialog({
  open,
  onClose,
}: CreateUserDialogProps) {
  const createMutation = useCreateUserMutation()
  const [errorText, setErrorText] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  })

  if (!open) return null

  const submitting = createMutation.isPending

  const close = () => {
    if (submitting) return
    setErrorText(null)
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    setErrorText(null)
    try {
      await createMutation.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })
      reset()
      onClose()
    } catch (err) {
      setErrorText(getApiErrorMessage(err, "Kullanıcı eklenemedi"))
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Modal
        headText="Kullanıcı ekle"
        panelClassName="w-full max-w-md"
        closeHandle={close}
        buttons={[
          {
            text: "Vazgeç",
            handleButton: close,
            color: "bg-secondary hover:bg-secondary/90 ",
          },
          {
            text: submitting ? "Ekleniyor..." : "Ekle",
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
          label="Ad"
          name="name"
          control={control}
          placeholder="Ad Soyad"
        />
        <FormTextInput
          label="E-posta"
          name="email"
          type="email"
          control={control}
          placeholder="ornek@mail.com"
        />
        <FormTextInput
          label="Şifre"
          name="password"
          type="password"
          control={control}
        />
        <FormTextInput
          label="Şifre (tekrar)"
          name="confirm_password"
          type="password"
          control={control}
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
