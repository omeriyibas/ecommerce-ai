import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePassword } from "@/services/auth.tsx";
import Modal from "@/shared/components/modal/Modal.tsx";
import FormTextInput from "@/shared/components/common/FormTextInput.tsx";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage.ts";

const schema = z
  .object({
    current_password: z.string().min(1, "Mevcut şifre gerekli"),
    new_password: z.string().min(8, "Yeni şifre en az 8 karakter olmalı"),
    confirm_password: z.string().min(1, "Şifre tekrarı gerekli"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

type ChangePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function ChangePasswordDialog({
  open,
  onClose,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  if (!open) return null;

  const close = () => {
    if (submitting) return;
    setErrorText(null);
    reset();
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setErrorText(null);
    try {
      await changePassword(values.current_password, values.new_password);
      onSuccess?.();
      close();
    } catch (err) {
      setErrorText(
        getApiErrorMessage(err, "Şifre güncellenemedi."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Modal
        headText="Şifre değiştir"
        panelClassName="w-full max-w-md"
        closeHandle={close}
        buttons={[
          {
            text: "Vazgeç",
            handleButton: close,
            color: "bg-secondary hover:bg-secondary/90 ",
          },
          {
            text: submitting ? "Kaydediliyor..." : "Kaydet",
            handleButton: () => {
              void handleSubmit(onSubmit)();
            },
            color: submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90",
            loading: submitting,
            disabled: submitting,
          },
        ]}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Şifre değişince tüm cihazlardaki oturumlarınız sonlandırılır; yeniden
          giriş yapmanız gerekir.
        </p>
        <FormTextInput
          label="Mevcut şifre"
          name="current_password"
          type="password"
          control={control as never}
        />
        <FormTextInput
          label="Yeni şifre"
          name="new_password"
          type="password"
          control={control as never}
        />
        <FormTextInput
          label="Yeni şifre (tekrar)"
          name="confirm_password"
          type="password"
          control={control as never}
        />
        {errorText ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorText}
          </p>
        ) : null}
      </Modal>
    </form>
  );
}
