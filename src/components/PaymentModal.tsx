import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_MODES, formatINR, formatDate } from "@/lib/format";
import type { Booking, Payment } from "@/types/db";

export function PaymentModal({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  booking: Booking | null;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState("Cash");
  const [note, setNote] = useState("");

  const balance = booking ? Number(booking.total_amount) - Number(booking.advance_paid) : 0;

  const history = useQuery({
    queryKey: ["payments", booking?.id],
    queryFn: async () => {
      if (!booking) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("booking_id", booking.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!booking && open,
  });

  useEffect(() => {
    if (open) {
      setAmount(0);
      setDate(new Date().toISOString().slice(0, 10));
      setMode("Cash");
      setNote("");
    }
  }, [open, booking?.id]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking");
      if (amount <= 0) throw new Error("Amount must be greater than zero");
      if (amount > balance) throw new Error(`Amount cannot exceed balance ${formatINR(balance)}`);

      const { error: insErr } = await supabase.from("payments").insert({
        booking_id: booking.id,
        amount,
        payment_date: date,
        payment_mode: mode,
        note,
      });
      if (insErr) throw insErr;

      const newAdvance = Number(booking.advance_paid) + amount;
      const { error: upErr } = await supabase
        .from("bookings")
        .update({ advance_paid: newAdvance })
        .eq("id", booking.id);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments-overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment recorded");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto bg-card border-gold/20">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl gold-text">Record Payment</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border border-gold/15 bg-surface/40 p-4 text-sm">
          <div className="font-semibold">{booking.client_name}</div>
          <div className="text-muted-foreground text-xs mt-0.5">
            {booking.event_type} • {formatDate(booking.event_date)} • {booking.slot}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Total</div>
              <div className="font-mono-num">{formatINR(booking.total_amount)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Paid</div>
              <div className="font-mono-num text-green-400">{formatINR(booking.advance_paid)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Balance</div>
              <div className={`font-mono-num ${balance > 0 ? "text-orange-400" : "text-green-400"}`}>
                {formatINR(balance)}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase text-muted-foreground tracking-wide mb-2">
            Payment History
          </div>
          {history.isLoading ? (
            <div className="text-xs text-muted-foreground">Loading...</div>
          ) : history.data && history.data.length > 0 ? (
            <ul className="divide-y divide-border max-h-40 overflow-y-auto rounded-md border border-border/60">
              {history.data.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-2 text-sm">
                  <div>
                    <div className="font-mono-num">{formatINR(p.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(p.payment_date)} • {p.payment_mode}
                      {p.note ? ` • ${p.note}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground italic">No payments yet</div>
          )}
        </div>

        {balance > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Amount (₹) — Max {formatINR(balance)}</Label>
              <Input
                type="number"
                min={0}
                max={balance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          {balance > 0 && (
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || amount <= 0}
              className="bg-gold text-primary-foreground hover:bg-gold-light"
            >
              {mutation.isPending ? "Saving..." : "Record Payment"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
