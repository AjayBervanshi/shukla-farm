import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, CalendarDays, Target, Wallet, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { format } from "date-fns";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/leads", label: "Leads", icon: Target },
  { to: "/payments", label: "Payments", icon: Wallet },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const today = format(new Date(), "EEE, dd MMM yyyy");

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border/50 bg-sidebar/95 backdrop-blur">
        <div className="font-display text-2xl gold-text leading-none">Shukla Farms</div>
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-md text-gold hover:bg-accent"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 inset-y-0 left-0 w-56 bg-sidebar border-r border-sidebar-border flex flex-col
          transform transition-transform md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"} pt-14 md:pt-0`}
      >
        <div className="p-5 border-b border-sidebar-border hidden md:block">
          <div className="font-display font-bold text-2xl gold-text leading-tight tracking-tight">Shukla Farms</div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1.5">Internal Dashboard</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.to, n.exact);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 min-h-[40px] group
                  ${active
                    ? "bg-gold/10 text-gold font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
                  }`}
              >
                <Icon size={18} className={`${active ? "text-gold" : "text-muted-foreground group-hover:text-foreground"} transition-colors`} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Today</div>
          <div className="text-sm font-mono-num gold-text mt-1">{today}</div>
        </div>
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20" onClick={() => setOpen(false)} />
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
