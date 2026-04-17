import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Pill, PaymentBar } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/format";
import { Wallet, IndianRupee, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import type { Booking, Payment } from "@/types/db";

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [selected, setSelected] = useState<Booking | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["payments-overview"],
    queryFn: async () => {
      const [bookingsRes, paymentsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .neq("status", "Cancelled")
          .order("event_date", { ascending: false }),
        supabase.from("payments").select("amount"),
      ]);
      if (bookingsRes.error) throw bookingsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      return {
        bookings: (bookingsRes.data ?? []) as Booking[],
        payments: (paymentsRes.data ?? []) as Pick<Payment, "amount">[],
      };
    },
  });

  const stats = useMemo(() => {
    const bookings = data?.bookings ?? [];
    const payments = data?.payments ?? [];
    const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
    const pendingDues = bookings
      .filter((b) => b.status === "Confirmed")
      .reduce((s, b) => s + (Number(b.total_amount) - Number(b.advance_paid)), 0);
    const fullyPaid = bookings.filter(
      (b) => b.status === "Confirmed" && Number(b.advance_paid) >= Number(b.total_amount) && Number(b.total_amount) > 0,
    ).length;
    return { totalCollected, pendingDues, fullyPaid };
  }, [data]);

  const status = (b: Booking) => {
    const total = Number(b.total_amount);
    const paid = Number(b.advance_paid);
    if (total === 0) return { label: "Unpaid", cls: "bg-red-500/20 text-red-300 border-red-500/40" };
    if (paid >= total) return { label: "Fully Paid", cls: "bg-green-500/20 text-green-300 border-green-500/40" };
    if (paid > 0) return { label: "Partial", cls: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
    return { label: "Unpaid", cls: "bg-red-500/20 text-red-300 border-red-500/40" };
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl gold-text">Payments</h1>
        <p className="text-sm text-muted-foreground">Track collections and outstanding dues</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<IndianRupee size={18} />}
          label="Total Collected"
          value={isLoading ? "—" : formatINR(stats.totalCollected)}
          color="text-green-400"
        />
        <StatCard
          icon={<AlertCircle size={18} />}
          label="Pending Dues"
          value={isLoading ? "—" : formatINR(stats.pendingDues)}
          color="text-orange-400"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Fully Paid Bookings"
          value={isLoading ? "—" : String(stats.fullyPaid)}
          color="text-gold"
        />
      </div>

      <div className="luxury-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !data?.bookings || data.bookings.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No bookings to track"
            message="Bookings will appear here once you create them."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-surface/60">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Client / Date</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 w-40">Progress</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((b) => {
                  const total = Number(b.total_amount);
                  const paid = Number(b.advance_paid);
                  const due = total - paid;
                  const st = status(b);
                  return (
                    <tr key={b.id} className="border-t border-border/50 hover:bg-accent/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{b.client_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(b.event_date)} • {b.slot}
                        </div>
                      </td>
                      <td className="px-4 py-3"><Pill variant="event">{b.event_type}</Pill></td>
                      <td className="px-4 py-3 text-right font-mono-num">{formatINR(total)}</td>
                      <td className="px-4 py-3 text-right font-mono-num text-green-400">{formatINR(paid)}</td>
                      <td className={`px-4 py-3 text-right font-mono-num ${due > 0 ? "text-red-400" : "text-green-400"}`}>
                        {formatINR(due)}
                      </td>
                      <td className="px-4 py-3"><PaymentBar paid={paid} total={total} /></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => setSelected(b)}
                          className="bg-gold text-primary-foreground hover:bg-gold-light"
                          disabled={due <= 0}
                        >
                          <Plus size={14} /> Pay
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaymentModal open={!!selected} onOpenChange={(v) => !v && setSelected(null)} booking={selected} />
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="luxury-card luxury-card-hover p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className="text-gold">{icon}</span>
      </div>
      <div className={`mt-2 font-mono-num text-2xl ${color}`}>{value}</div>
    </div>
  );
}
