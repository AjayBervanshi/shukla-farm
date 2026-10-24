import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Pill, PaymentBar } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatINR, formatDate, EVENT_TYPES, BOOKING_STATUSES } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Download, Pencil, Trash2, Receipt, Calendar, Search } from "lucide-react";
import { toast } from "sonner";
import { BookingFormModal } from "@/components/BookingFormModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import type { Booking } from "@/types/db";
import { format } from "date-fns";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(""); // YYYY-MM
  const [editing, setEditing] = useState<Booking | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [receipt, setReceipt] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) => b.client_name.toLowerCase().includes(q) || b.phone.includes(q),
      );
    }
    if (statusFilter !== "all") list = list.filter((b) => b.status === statusFilter);
    if (eventFilter !== "all") list = list.filter((b) => b.event_type === eventFilter);
    if (monthFilter) list = list.filter((b) => b.event_date.startsWith(monthFilter));
    return list;
  }, [data, search, statusFilter, eventFilter, monthFilter]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Booking deleted");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCSV = () => {
    const headers = [
      "Client", "Phone", "Event", "Date", "Slot", "Guests",
      "Total", "Advance", "Balance", "Status", "Notes",
    ];
    const rows = filtered.map((b) => [
      b.client_name, b.phone, b.event_type, b.event_date, b.slot,
      b.guests, b.total_amount, b.advance_paid,
      Number(b.total_amount) - Number(b.advance_paid),
      b.status, (b.notes || "").replace(/[\r\n,]+/g, " "),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shukla-farms-bookings-${format(new Date(), "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl gold-text">Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage venue bookings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="border-gold/30 text-gold hover:bg-gold/10">
            <Download size={16} /> Export CSV
          </Button>
          <Button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-gold text-primary-foreground hover:bg-gold-light"
          >
            <Plus size={16} /> New Booking
          </Button>
        </div>
      </div>

      <div className="luxury-card p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger><SelectValue placeholder="Event Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
      </div>

      <div className="luxury-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings found"
            message={data && data.length > 0 ? "Try adjusting your filters." : "Add your first booking to get started."}
            ctaLabel="New Booking"
            onCta={() => { setEditing(null); setShowForm(true); }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-surface/60">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date / Slot</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Amounts</th>
                  <th className="px-4 py-3 w-32">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const due = Number(b.total_amount) - Number(b.advance_paid);
                  return (
                    <tr key={b.id} className="border-b border-border/30 hover:bg-surface/60 transition-colors duration-150 last:border-0">
                      <td className="px-4 py-3">
                        <div className={`font-medium ${b.status === "Cancelled" ? "line-through text-muted-foreground" : ""}`}>
                          {b.client_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{b.phone}</div>
                      </td>
                      <td className="px-4 py-3"><Pill variant="event">{b.event_type}</Pill></td>
                      <td className="px-4 py-3">
                        <div>{formatDate(b.event_date)}</div>
                        <div className="mt-1"><Pill variant="slot">{b.slot}</Pill></div>
                      </td>
                      <td className="px-4 py-3 font-mono-num">{b.guests}</td>
                      <td className="px-4 py-3 font-mono-num text-xs">
                        <div>Total: {formatINR(b.total_amount)}</div>
                        <div className="text-green-400">Adv: {formatINR(b.advance_paid)}</div>
                        <div className={due > 0 ? "text-orange-400" : "text-muted-foreground"}>
                          Due: {formatINR(due)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBar paid={Number(b.advance_paid)} total={Number(b.total_amount)} />
                      </td>
                      <td className="px-4 py-3"><Pill variant="status">{b.status}</Pill></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditing(b); setShowForm(true); }}
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReceipt(b)}
                            aria-label="Receipt"
                          >
                            <Receipt size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(b.id)}
                            aria-label="Delete"
                            className="hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BookingFormModal open={showForm} onOpenChange={setShowForm} initial={editing} />
      <ReceiptModal open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)} booking={receipt} />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-gold/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the booking and all associated payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
