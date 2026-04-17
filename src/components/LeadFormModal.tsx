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
import { EVENT_TYPES, LEAD_STAGES, LEAD_SOURCES } from "@/lib/format";
import type { Lead } from "@/types/db";

export type LeadFormInitial = Partial<Lead> & { id?: string };

export function LeadFormModal({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: LeadFormInitial | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    event_type: "Wedding" as string,
    estimated_date: "" as string,
    guests: 0,
    budget: 0,
    stage: "New Inquiry" as string,
    source: "WhatsApp" as string,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        phone: initial?.phone ?? "",
        event_type: initial?.event_type ?? "Wedding",
        estimated_date: initial?.estimated_date ?? "",
        guests: Number(initial?.guests ?? 0),
        budget: Number(initial?.budget ?? 0),
        stage: initial?.stage ?? "New Inquiry",
        source: initial?.source ?? "WhatsApp",
        notes: initial?.notes ?? "",
      });
    }
  }, [open, initial]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");
      if (!form.phone.trim()) throw new Error("Phone is required");
      const payload = { ...form, estimated_date: form.estimated_date || null };
      if (initial?.id) {
        const { error } = await supabase.from("leads").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(initial?.id ? "Lead updated" : "Lead created");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-card border-gold/20">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl gold-text">
            {initial?.id ? "Edit Lead" : "New Lead"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
            <Label>Estimated Date</Label>
            <Input
              type="date"
              value={form.estimated_date}
              onChange={(e) => setForm({ ...form, estimated_date: e.target.value })}
            />
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
            <Label>Budget (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Stage</Label>
            <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            {mutation.isPending ? "Saving..." : initial?.id ? "Save Changes" : "Create Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
