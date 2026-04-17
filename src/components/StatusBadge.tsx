import { cn } from "@/lib/utils";
import { eventTypeColor, slotColor, statusColor, stageColor } from "@/lib/format";

type Variant = "status" | "event" | "slot" | "stage" | "source" | "neutral";

export function Pill({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  let cls = "bg-muted text-foreground border-border";
  if (typeof children === "string") {
    if (variant === "status") cls = statusColor(children);
    else if (variant === "event") cls = eventTypeColor(children);
    else if (variant === "slot") cls = slotColor(children);
    else if (variant === "stage") cls = stageColor(children);
    else if (variant === "source") cls = "bg-gold/15 text-gold border-gold/30";
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap",
        cls,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PaymentBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  let color = "bg-red-500";
  if (pct >= 100) color = "bg-green-500";
  else if (pct > 0) color = "bg-orange-500";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={cn("h-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
