import { useCallback, useMemo, useState } from "react";

export type AlertVariant = "error" | "warning" | "success" | "info";

type AlertPreset = {
  title: string;
  closeText: string;
  closeColor: string;
};

const PRESETS: Record<AlertVariant, AlertPreset> = {
  error: {
    title: "Hata",
    closeText: "Tamam",
    closeColor: "bg-primary hover:bg-primary/90",
  },
  warning: {
    title: "Uyarı",
    closeText: "Kapat",
    closeColor: "bg-secondary hover:bg-secondary/90",
  },
  success: {
    title: "Bilgi",
    closeText: "Tamam",
    closeColor: "bg-primary hover:bg-primary/90",
  },
  info: {
    title: "Bilgi",
    closeText: "Tamam",
    closeColor: "bg-primary hover:bg-primary/90",
  },
};

export type ShowAlertOptions = {
  message: string;
  variant?: AlertVariant;
  title?: string;
  closeText?: string;
  closeColor?: string;
};

type AlertState = {
  open: boolean;
  message: string;
  variant: AlertVariant;
  title?: string;
  closeText?: string;
  closeColor?: string;
};

export function useAlertModal() {
  const [state, setState] = useState<AlertState>({
    open: false,
    message: "",
    variant: "error",
  });

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false, message: "" }));
  }, []);

  const show = useCallback((options: string | ShowAlertOptions) => {
    const opts: ShowAlertOptions =
      typeof options === "string" ? { message: options } : options;
    const variant = opts.variant ?? "error";
    const preset = PRESETS[variant];
    setState({
      open: true,
      message: opts.message,
      variant,
      title: opts.title ?? preset.title,
      closeText: opts.closeText ?? preset.closeText,
      closeColor: opts.closeColor ?? preset.closeColor,
    });
  }, []);

  const showError = useCallback(
    (message: string) => show({ message, variant: "error" }),
    [show],
  );

  const showWarning = useCallback(
    (message: string) => show({ message, variant: "warning" }),
    [show],
  );

  const showSuccess = useCallback(
    (message: string) => show({ message, variant: "success" }),
    [show],
  );

  const alertProps = useMemo(() => {
    const preset = PRESETS[state.variant];
    return {
      isOpen: state.open && Boolean(state.message),
      title: state.title ?? preset.title,
      message: state.message,
      closeText: state.closeText ?? preset.closeText,
      closeColor: state.closeColor ?? preset.closeColor,
      onClose: close,
    };
  }, [state, close]);

  return {
    show,
    showError,
    showWarning,
    showSuccess,
    close,
    isOpen: state.open && Boolean(state.message),
    alertProps,
  };
}
