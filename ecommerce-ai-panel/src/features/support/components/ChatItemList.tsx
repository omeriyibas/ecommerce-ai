import { cn } from "@/lib/utils.ts"
import type { ChatOrderItem, ChatPaymentItem } from "@/shared/types/support"

const amountFmt = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
})

const statusLabel: Record<string, string> = {
  pending: "Beklemede",
  paid: "Ödendi",
  failed: "Başarısız",
  refunded: "İade",
}

type ChatItemListProps = {
  orderItems?: ChatOrderItem[]
  paymentItems?: ChatPaymentItem[]
  className?: string
}

export default function ChatItemList({
  orderItems,
  paymentItems,
  className,
}: ChatItemListProps) {
  const hasOrders = !!orderItems?.length
  const hasPayments = !!paymentItems?.length
  if (!hasOrders && !hasPayments) return null

  return (
    <div className={cn("mt-3 space-y-2", className)}>
      {hasOrders ? (
        <ul className="overflow-hidden rounded-xl border border-border/60 bg-background/50">
          {orderItems!.map((item, i) => (
            <li
              key={item.id}
              className={cn(
                "flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm",
                i > 0 && "border-t border-border/50",
              )}
            >
              <div className="min-w-0">
                <span className="font-medium tabular-nums text-muted-foreground">
                  #{item.id}
                </span>
                <span className="mx-2 text-border">·</span>
                <span className="text-foreground">{item.product}</span>
              </div>
              <span className="shrink-0 tabular-nums font-medium tracking-tight">
                {amountFmt.format(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {hasPayments ? (
        <ul className="overflow-hidden rounded-xl border border-border/60 bg-background/50">
          {paymentItems!.map((item, i) => (
            <li
              key={`${item.order_id}-${item.status}-${i}`}
              className={cn(
                "flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm",
                i > 0 && "border-t border-border/50",
              )}
            >
              <div className="min-w-0">
                <span className="font-medium tabular-nums text-muted-foreground">
                  #{item.order_id}
                </span>
                {item.product ? (
                  <>
                    <span className="mx-2 text-border">·</span>
                    <span className="text-foreground">{item.product}</span>
                  </>
                ) : null}
              </div>
              <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {statusLabel[item.status] ?? item.status}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
