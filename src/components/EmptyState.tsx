import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCta,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
        <Icon className="text-gold" size={28} />
      </div>
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      {message && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{message}</p>}
      {ctaLabel && onCta && (
        <Button onClick={onCta} className="mt-5 bg-gold text-primary-foreground hover:bg-gold-light">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
