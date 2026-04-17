import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Pill } from "@/components/StatusBadge";
import { formatINR, formatDate, SLOTS } from "@/lib/format";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  format,
  subMonths,
  addDays,
  parseISO,
} from "date-fns";
import {
  CalendarDays,
  IndianRupee,
  AlertCircle,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Booking, Lead } from "@/types/db";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const today = new Date();
  const todayIso = format(today, "yyyy-MM-dd");
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  const weekEnd = format(addDays(today, 7), "yyyy-MM-dd");
  const sixMonthsAgo = format(startOfMonth(subMonths(today, 5)), "yyyy-MM-dd");

  const dash = useQuery({
    queryKey: ["dashboard", todayIso],
    queryFn: async () => {
      const [todaySlots, monthBookings, allActive, openLeads, recent, weekBookings, chartBookings] =
        await Promise.all([
          supabase.from("bookings").select("*").eq("event_date", todayIso),
          supabase
            .from("bookings")
            .select("advance_paid")
            .gte("event_date", monthStart)
            .lte("event_date", monthEnd)
            .neq("status", "Cancelled"),
          supabase
            .from("bookings")
            .select("total_amount, advance_paid")
            .eq("status", "Confirmed"),
          supabase.from("leads").select("id", { count: "exact", head: true }).not("stage", "in", "(Won,Lost)"),
          supabase
            .from("bookings")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("bookings")
            .select("*")
            .gte("event_date", todayIso)
            .lte("event_date", weekEnd)
            .neq("status", "Cancelled")
            .order("event_date", { ascending: true }),
          supabase
            .from("bookings")
            .select("event_date, advance_paid")
            .gte("event_date", sixMonthsAgo)
            .neq("status", "Cancelled"),
        ]);

      const monthRevenue = (monthBookings.data ?? []).reduce(
        (s, b) => s + Number(b.advance_paid),
        0,
      );
      const pendingDues = (allActive.data ?? []).reduce(
        (s, b) => s + (Number(b.total_amount) - Number(b.advance_paid)),
        0,
      );

      // Build 6-month chart
      const months: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(today, i);
        months.push({ month: format(d, "MMM"), revenue: 0 });
      }
      (chartBookings.data ?? []).forEach((b) => {
        const d = parseISO(b.event_date);
        const key = format(d, "MMM");
        const m = months.find((x) => x.month === key);
        if (m) m.revenue += Number(b.advance_paid);
      });

      return {
        todaySlots: (todaySlots.data ?? []) as Booking[],
        monthRevenue,
        pendingDues,
        openLeadsCount: openLeads.count ?? 0,
        recent: (recent.data ?? []) as Booking[],
        week: (weekBookings.data ?? []) as Booking[],
        chart: months,
      };
    },
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl gold-text">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {format(today, "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<CalendarDays size={18} />}
          label="Today's Bookings"
          value={dash.isLoading ? "—" : `${dash.data?.todaySlots.length ?? 0}/3`}
          sub="slots booked"
        />
        <StatCard
          icon={<IndianRupee size={18} />}
          label="Month Revenue"
          value={dash.isLoading ? "—" : formatINR(dash.data?.monthRevenue ?? 0)}
          sub={format(today, "MMMM yyyy")}
          gold
        />
        <StatCard
          icon={<AlertCircle size={18} />}
          label="Pending Dues"
          value={dash.isLoading ? "—" : formatINR(dash.data?.pendingDues ?? 0)}
          sub="across confirmed"
          warning
        />
        <StatCard
          icon={<Target size={18} />}
          label="Open Leads"
          value={dash.isLoading ? "—" : String(dash.data?.openLeadsCount ?? 0)}
          sub="in pipeline"
        />
      </div>

      {/* Today's slots */}
      <div className="luxury-card p-5 mb-6">
        <h2 className="font-display text-xl mb-3 gold-text">Today's Slots</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SLOTS.map((s) => {
            const booking = dash.data?.todaySlots.find((b) => b.slot === s.id);
            return (
              <div
                key={s.id}
                className={`rounded-lg border p-4 ${
                  booking
                    ? "border-green-500/40 bg-green-500/5"
                    : "border-border bg-surface/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.time}</div>
                  </div>
                  <Pill variant="slot">{s.id}</Pill>
                </div>
                <div className="mt-3 text-sm">
                  {booking ? (
                    <Link
                      to="/bookings"
                      className="text-green-300 hover:underline font-medium"
                    >
                      {booking.client_name} • {booking.event_type}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground italic">Available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="luxury-card p-5 lg:col-span-2">
          <h2 className="font-display text-xl mb-4 gold-text">Monthly Revenue (Last 6 months)</h2>
          {dash.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dash.data?.chart ?? []}>
                <CartesianGrid stroke="oklch(0.74 0.13 80 / 0.1)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="oklch(0.68 0.03 270)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="oklch(0.68 0.03 270)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.24 0.05 270)",
                    border: "1px solid oklch(0.74 0.13 80 / 0.4)",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => [formatINR(v), "Revenue"]}
                  cursor={{ fill: "oklch(0.74 0.13 80 / 0.05)" }}
                />
                <Bar dataKey="revenue" fill="oklch(0.74 0.13 80)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming this week */}
        <div className="luxury-card p-5">
          <h2 className="font-display text-xl mb-4 gold-text">Upcoming This Week</h2>
          {dash.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : dash.data?.week && dash.data.week.length > 0 ? (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {dash.data.week.map((b) => (
                <li
                  key={b.id}
                  className="rounded-md border border-border bg-surface/40 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{b.client_name}</div>
                    <Pill variant="slot">{b.slot}</Pill>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(b.event_date)} • {b.event_type} • {b.guests} guests
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No bookings this week</p>
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="luxury-card p-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl gold-text">Recent Bookings</h2>
          <Link to="/bookings" className="text-xs text-gold hover:underline">View all →</Link>
        </div>
        {dash.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : dash.data?.recent && dash.data.recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="py-2">Client</th>
                  <th className="py-2">Event</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Slot</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {dash.data.recent.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3">{b.client_name}</td>
                    <td className="py-3"><Pill variant="event">{b.event_type}</Pill></td>
                    <td className="py-3">{formatDate(b.event_date)}</td>
                    <td className="py-3"><Pill variant="slot">{b.slot}</Pill></td>
                    <td className="py-3"><Pill variant="status">{b.status}</Pill></td>
                    <td className="py-3 text-right font-mono-num">{formatINR(b.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No bookings yet</p>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  gold,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  gold?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="luxury-card luxury-card-hover p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className="text-gold">{icon}</span>
      </div>
      <div
        className={`mt-2 font-mono-num text-2xl ${
          gold ? "text-gold" : warning ? "text-orange-400" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
