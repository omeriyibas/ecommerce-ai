import { Loader2 } from "lucide-react";

type RouteLoadingFallbackProps = {
  message?: string;
};

export function RouteLoadingFallback({
  message = "Sayfa yükleniyor…",
}: RouteLoadingFallbackProps) {
  return (
    <div
      className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
