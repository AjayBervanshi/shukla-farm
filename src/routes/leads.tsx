import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Pill } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, Target, MessageCircle, Search, LayoutGrid, Table as TableIcon, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { LeadFormModal } from "@/components/LeadFormModal";
import { BookingFormModal, type BookingFormInitial } from "@/components/BookingFormModal";
import { LEAD_STAGES, formatINR, formatDate, whatsappLink } from "@/lib/format";
import type { Lead } from "@/types/db";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

export const Route = createFileRoute("/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertSeed, setConvertSeed] = useState<BookingFormInitial | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || l.phone.includes(q));
    }
    if (stageFilter !== "all") list = list.filter((l) => l.stage === stageFilter);
    return list;
  }, [data, search, stageFilter]);

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueryData<Lead[]>(["leads"]);
      qc.setQueryData<Lead[]>(["leads"], (old) =>
        (old ?? []).map((l) => (l.id === id ? { ...l, stage } : l)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["leads"], ctx.prev);
      toast.error("Failed to update stage");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Lead deleted");
      setDeleteId(null);
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const stage = String(over.id);
    const lead = (data ?? []).find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    updateStage.mutate({ id, stage });
  };

  const convertToBooking = (l: Lead) => {
    setConvertSeed({
      client_name: l.name,
      phone: l.phone,
      event_type: l.event_type,
      event_date: l.estimated_date ?? "",
      guests: l.guests,
      total_amount: l.budget,
      slot: "Slot 1",
      status: "Pending",
      advance_paid: 0,
      notes: l.notes,
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl gold-text">Leads</h1>
          <p className="text-sm text-muted-foreground">Track inquiries through your sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${view === "kanban" ? "bg-gold/15 text-gold" : "text-muted-foreground"}`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${view === "table" ? "bg-gold/15 text-gold" : "text-muted-foreground"}`}
            >
              <TableIcon size={14} /> Table
            </button>
          </div>
          <Button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-gold text-primary-foreground hover:bg-gold-light"
          >
            <Plus size={16} /> New Lead
          </Button>
        </div>
      </div>

      {view === "table" && (
        <div className="luxury-card p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {LEAD_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {LEAD_STAGES.map((s) => <Skeleton key={s} className="h-64 w-full" />)}
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="luxury-card">
          <EmptyState
            icon={Target}
            title="No leads yet"
            message="Add your first lead to start tracking your sales pipeline."
            ctaLabel="New Lead"
            onCta={() => { setEditing(null); setShowForm(true); }}
          />
        </div>
      ) : view === "kanban" ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {LEAD_STAGES.map((stage) => {
                const items = (data ?? []).filter((l) => l.stage === stage);
                return (
                  <KanbanColumn key={stage} stage={stage} count={items.length}>
                    {items.map((l) => (
                      <KanbanCard
                        key={l.id}
                        lead={l}
                        onEdit={() => { setEditing(l); setShowForm(true); }}
                        onDelete={() => setDeleteId(l.id)}
                        onConvert={() => convertToBooking(l)}
                      />
                    ))}
                  </KanbanColumn>
                );
              })}
            </div>
          </div>
        </DndContext>
      ) : (
        <div className="luxury-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-surface/60">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Est. Date</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border/30 hover:bg-surface/60 transition-colors duration-150 last:border-0">
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3">
                      <a href={whatsappLink(l.phone, l.name)} target="_blank" rel="noopener" className="flex items-center gap-1 text-green-400 hover:underline">
                        <MessageCircle size={12} /> {l.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3"><Pill variant="event">{l.event_type}</Pill></td>
                    <td className="px-4 py-3">{formatDate(l.estimated_date)}</td>
                    <td className="px-4 py-3 font-mono-num">{l.guests}</td>
                    <td className="px-4 py-3 font-mono-num">{formatINR(l.budget)}</td>
                    <td className="px-4 py-3"><Pill variant="stage">{l.stage}</Pill></td>
                    <td className="px-4 py-3"><Pill variant="source">{l.source}</Pill></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {l.stage === "Won" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => convertToBooking(l)}
                            className="text-gold text-xs"
                          >
                            Convert
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(l); setShowForm(true); }}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(l.id)} className="hover:text-destructive">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LeadFormModal open={showForm} onOpenChange={setShowForm} initial={editing} />
      <BookingFormModal
        open={!!convertSeed}
        onOpenChange={(v) => !v && setConvertSeed(null)}
        initial={convertSeed}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-gold/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function KanbanColumn({ stage, count, children }: { stage: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const headerColor =
    stage === "Won" ? "text-green-400 border-green-500/30" :
    stage === "Lost" ? "text-red-400 border-red-500/30" :
    "text-gold border-gold/30";
  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-xl border ${isOver ? "border-gold bg-gold/5" : "border-border bg-surface/30"} flex flex-col`}
    >
      <div className={`p-3 border-b ${headerColor} flex items-center justify-between`}>
        <div className="font-display text-base">{stage}</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 font-mono-num">{count}</span>
      </div>
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function KanbanCard({
  lead,
  onEdit,
  onDelete,
  onConvert,
}: {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
  onConvert: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border border-border bg-card p-3 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-60 ring-2 ring-gold" : "hover:border-gold/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm truncate">{lead.name}</div>
        <Pill variant="source" className="text-[10px]">{lead.source}</Pill>
      </div>
      <a
        href={whatsappLink(lead.phone, lead.name)}
        target="_blank"
        rel="noopener"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-xs text-green-400 mt-1 flex items-center gap-1 hover:underline"
      >
        <MessageCircle size={11} /> {lead.phone}
      </a>
      <div className="mt-2 flex flex-wrap gap-1">
        <Pill variant="event" className="text-[10px]">{lead.event_type}</Pill>
        {lead.estimated_date && (
          <span className="text-[10px] text-muted-foreground self-center">
            {formatDate(lead.estimated_date)}
          </span>
        )}
      </div>
      <div className="mt-2 text-xs flex justify-between text-muted-foreground">
        <span>{lead.guests} guests</span>
        <span className="font-mono-num text-gold">{formatINR(lead.budget)}</span>
      </div>
      <div className="mt-2 flex gap-1 justify-end" onPointerDown={(e) => e.stopPropagation()}>
        {lead.stage === "Won" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onConvert}
            className="h-7 text-xs text-gold hover:bg-gold/10"
          >
            <ArrowRight size={12} /> Booking
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={onEdit} className="h-7 w-7">
          <Pencil size={12} />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete} className="h-7 w-7 hover:text-destructive">
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}
