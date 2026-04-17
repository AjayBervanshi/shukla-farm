import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EVENT_TYPES, BOOKING_STATUSES, SLOTS } from "@/lib/format";
import type { Booking } from "@/types/db";
import { AlertTriangle } from "lucide-react";

export type BookingFormInitial = Partial<Booking> & { id?: string };

export function BookingFormModal({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: BookingFormInitial | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_name: "",
    phone: "",
    event_type: "Wedding" as string,
    event_date: "",
    slot: "Slot 1" as string,
    guests: 0,
    total_amount: 0,
    advance_paid: 0,
    status: "Pending" as string,
    notes: "",
  });
  const [conflict, setConflict] = useState<{ client_name: string } | null>(null);

  useEffect(() => {
    if (open) {
      setConflict(null);
      setForm({
        client_name: initial?.client_name ?? "",
        phone: initial?.phone ?? "",
        event_type: initial?.event_type ?? "Wedding",
        event_date: initial?.event_date ?? "",
        slot: initial?.slot ?? "Slot 1",
        guests: Number(initial?.guests ?? 0),
        total_amount: Number(initial?.total_amount ?? 0),
        advance_paid: Number(initial?.advance_paid ?? 0),
        status: initial?.status ?? "Pending",
        notes: initial?.notes ?? "",
      });
    }
  }, [open, initial]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.client_name.trim()) throw new Error("Client name is required");
      if (!form.phone.trim()) throw new Error("Phone is required");
      if (!form.event_date) throw new Error("Event date is required");
      if (form.advance_paid > form.total_amount)
        throw new Error("Advance paid cannot exceed total amount");

      // Conflict check
      const conflictQuery = supabase
        .from("bookings")
        .select("id, client_name")
        .eq("event_date", form.event_date)
        .eq("slot", form.slot)
        .neq("status", "Cancelled");
      const { data: conflicts, error: conflictErr } = initial?.id
        ? await conflictQuery.neq("id", initial.id)
        : await conflictQuery;
      if (conflictErr) throw conflictErr;
      if (conflicts && conflicts.length > 0) {
        setConflict({ client_name: conflicts[0].client_name });
        throw new Error("Slot conflict");
      }

      if (initial?.id) {
        const { error } = await supabase
          .from("bookings")
          .update(form)
          .eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookings").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["payments-overview"] });
      toast.success(initial?.id ? "Booking updated" : "Booking created");
      onOpenChange(false);
    },
    onError: (e: Error) => {
      if (e.message !== "Slot conflict") toast.error(e.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-card border-gold/20">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl gold-text">
            {initial?.id ? "Edit Booking" : "New Booking"}
          </DialogTitle>
        </DialogHeader>

        {conflict && (
          <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 flex gap-3">
            <AlertTriangle className="text-orange-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <div className="font-semibold text-orange-300">Slot already booked</div>
              <div className="text-orange-200/80">
                {form.slot} on {form.event_date} is booked by <b>{conflict.client_name}</b>. Choose
                another slot or date.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Client Name *</Label>
            <Input
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Event Type</Label>
            <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Event Date *</Label>
            <Input
              type="date"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Slot</Label>
            <RadioGroup
              value={form.slot}
              onValueChange={(v) => { setForm({ ...form, slot: v }); setConflict(null); }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2"
            >
              {SLOTS.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer ${
                    form.slot === s.id ? "border-gold bg-gold/10" : "border-border hover:bg-accent/50"
                  }`}
                >
                  <RadioGroupItem value={s.id} id={s.id} />
                  <div>
                    <div className="font-medium text-sm">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.time}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label>Guests</Label>
            <Input
              type="number"
              min={0}
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Total Amount (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.total_amount}
              onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Advance Paid (₹)</Label>
            <Input
              type="number"
              min={0}
              max={form.total_amount}
              value={form.advance_paid}
              onChange={(e) => setForm({ ...form, advance_paid: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-gold text-primary-foreground hover:bg-gold-light"
          >
            {mutation.isPending ? "Saving..." : initial?.id ? "Save Changes" : "Create Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
