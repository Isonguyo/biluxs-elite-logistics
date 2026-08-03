import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Radio, CalendarRange, Users, Truck, Car, Route as RouteIcon, CreditCard,
  Package, Palmtree, ShoppingBag, LifeBuoy, Bell, BarChart3, FileText, ShieldAlert,
  Sparkles, ScrollText, Settings, Menu, X, Search, ChevronLeft, Crown,
} from "lucide-react";
import { Logo } from "@/components/biluxs/Logo";
import { useAuth } from "@/hooks/useAuth";

type Item = { to: string; label: string; icon: typeof LayoutGrid };

const GROUPS: { heading: string; items: Item[] }[] = [
  {
    heading: "Command",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutGrid },
      { to: "/admin/dispatch", label: "Dispatch Center", icon: Radio },
      { to: "/admin/bookings", label: "Bookings", icon: CalendarRange },
      { to: "/admin/trips", label: "Live Trips", icon: RouteIcon },
    ],
  },
  {
    heading: "Network",
    items: [
      { to: "/admin/drivers", label: "Drivers", icon: Truck },
      { to: "/admin/fleet", label: "Fleet", icon: Car },
      { to: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    heading: "Commerce",
    items: [
      { to: "/admin/payments", label: "Payments", icon: CreditCard },
      { to: "/admin/cargo", label: "Cargo Ops", icon: Package },
      { to: "/admin/tourism", label: "Tourism", icon: Palmtree },
      { to: "/admin/shopping", label: "Luxury Shopping", icon: ShoppingBag },
    ],
  },
  {
    heading: "Care",
    items: [
      { to: "/admin/concierge", label: "Concierge", icon: Sparkles },
      { to: "/admin/support", label: "Support Center", icon: LifeBuoy },
      { to: "/admin/incidents", label: "Incident Center", icon: ShieldAlert },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    heading: "Intelligence",
    items: [
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/reports", label: "Reports", icon: FileText },
      { to: "/admin/audit", label: "Audit Logs", icon: ScrollText },
      { to: "/admin/settings", label: "System Settings", icon: Settings },
    ],
  },
];

export function AdminLayout({ children, title, subtitle, actions }: {
  children: React.ReactNode; title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { isSuperUser } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const Nav = (
    <nav className="flex flex-col gap-6 pb-10">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase()));
        if (!items.length) return null;
        return (
          <div key={g.heading}>
            <div className="px-4 text-[9px] uppercase tracking-[0.35em] text-muted-foreground/70 mb-2">{g.heading}</div>
            <div className="flex flex-col">
              {items.map((i) => {
                const active = i.to === "/admin" ? pathname === "/admin" : pathname.startsWith(i.to);
                return (
                  <Link key={i.to} to={i.to} onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                      active ? "text-gold bg-white/[0.05]" : "text-white/70 hover:text-white hover:bg-white/[0.03]"
                    }`}>
                    {active && <motion.span layoutId="ops-active" className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold" />}
                    <i.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{i.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      {isSuperUser && (
        <div>
          <div className="px-4 text-[9px] uppercase tracking-[0.35em] text-muted-foreground/70 mb-2">Platform</div>
          <Link to="/super" className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-crimson hover:bg-white/[0.03]">
            <Crown className="h-4 w-4" /> Control Plane
          </Link>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#05070f] flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-gold/15 sticky top-0 h-screen overflow-y-auto bg-[var(--navy-deep)]">
        <div className="h-20 px-4 flex items-center gap-3 border-b border-gold/15">
          <Logo size={32} />
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-gold">Operations</div>
            <div className="font-display text-sm tracking-widest">Command Center</div>
          </div>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to module…"
              className="w-full h-9 pl-9 pr-3 bg-white/[0.03] border border-border text-xs outline-none focus:border-gold transition-colors" />
          </div>
        </div>
        {Nav}
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }} onClick={(e) => e.stopPropagation()}
              className="w-72 h-full bg-[var(--navy-deep)] border-r border-gold/15 overflow-y-auto">
              <div className="h-16 px-4 flex items-center justify-between border-b border-gold/15">
                <Logo size={28} />
                <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              {Nav}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-16 lg:h-20 px-4 md:px-8 flex items-center gap-3 border-b border-gold/15 bg-[#05070f]/90 backdrop-blur-md">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <Link to="/" className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold">
            <ChevronLeft className="h-3 w-3" /> Site
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.35em] text-gold inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live · Systems Nominal
            </div>
            <div className="font-display text-lg md:text-xl truncate">{title}</div>
          </div>
          {actions}
        </header>
        <main className="flex-1 p-4 md:p-8">
          {subtitle && <p className="text-xs text-muted-foreground mb-6 max-w-3xl">{subtitle}</p>}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: {
  title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`border border-gold/20 bg-black/40 ${className}`}>
      {title && (
        <div className="p-3 border-b border-gold/20 flex items-center justify-between gap-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{title}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Stat({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: string; accent?: boolean }) {
  return (
    <div className={`p-4 border ${accent ? "border-gold bg-gold/5" : "border-gold/20 bg-black/30"}`}>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-2">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "good" | "warn" | "bad" | "neutral"; children: React.ReactNode }) {
  const map = {
    good: "bg-emerald-500/20 text-emerald-300",
    warn: "bg-amber-500/20 text-amber-300",
    bad: "bg-crimson/20 text-crimson",
    neutral: "bg-white/10 text-white/70",
  } as const;
  return <span className={`text-[10px] px-2 h-6 inline-flex items-center uppercase tracking-widest ${map[tone]}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-12 text-center text-sm text-muted-foreground">{children}</div>;
}
