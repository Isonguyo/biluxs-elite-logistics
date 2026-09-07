import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, CalendarRange, Users, Truck, Car, MessageSquare, Star, Bell, Home,
  Menu, X, ChevronDown, LogOut, Crown, Radio, ShieldAlert, CreditCard, BarChart3,
  FileText, ScrollText, Settings, LifeBuoy, Package, Palmtree, ShoppingBag, Sparkles,
  CalendarClock, Route as RouteIcon,
} from "lucide-react";
import { Logo } from "@/components/biluxs/Logo";
import { Avatar } from "@/components/portal/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/lib/portal";
import { useProfileMap } from "@/lib/ops";

type Item = { to: string; label: string; icon: typeof LayoutGrid };

const PRIMARY: Item[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/admin/drivers", label: "Drivers", icon: Truck },
  { to: "/admin/vehicles", label: "Vehicles", icon: Car },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
];

const MORE: Item[] = [
  { to: "/admin/dispatch", label: "Dispatch Center", icon: Radio },
  { to: "/admin/schedule", label: "Driver Schedule", icon: CalendarClock },
  { to: "/admin/trips", label: "Live Trips", icon: RouteIcon },
  { to: "/admin/incidents", label: "Incidents", icon: ShieldAlert },
  { to: "/admin/support", label: "Support Centre", icon: LifeBuoy },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/concierge", label: "Concierge", icon: Sparkles },
  { to: "/admin/cargo", label: "Cargo", icon: Package },
  { to: "/admin/tourism", label: "Tourism", icon: Palmtree },
  { to: "/admin/shopping", label: "Luxury Shopping", icon: ShoppingBag },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const OPS_KINDS = ["booking", "payment", "incident", "review", "message", "assignment", "alert", "trip"];

function NotificationBell() {
  const { items, unread, markRead, markAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const feed = items.filter((n) => OPS_KINDS.includes(n.kind));
  const count = feed.filter((n) => !n.read).length || unread;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label="Notifications"
        className="relative h-10 w-10 grid place-items-center border border-border hover:border-gold">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-crimson text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 mt-2 w-[min(92vw,380px)] max-h-[70vh] overflow-y-auto border border-gold/30 bg-[var(--navy-deep)] z-50 shadow-2xl">
            <div className="p-3 border-b border-gold/20 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold">Operational alerts</span>
              <button onClick={() => void markAll()} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold">Mark all read</button>
            </div>
            {feed.slice(0, 40).map((n) => (
              <Link key={n.id} to={n.link ?? "/admin"} onClick={() => { void markRead(n.id); setOpen(false); }}
                className={`block p-3 border-b border-border hover:bg-white/[0.04] ${n.read ? "opacity-60" : ""}`}>
                <div className="text-xs text-white/90 flex items-center gap-2">
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />}{n.title}
                </div>
                {n.body && <div className="text-[11px] text-muted-foreground mt-0.5">{n.body}</div>}
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">
                  {n.kind} · {new Date(n.created_at).toLocaleString()}
                </div>
              </Link>
            ))}
            {!feed.length && <div className="p-8 text-center text-xs text-muted-foreground">Nothing needs your attention.</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminLayout({ children, title, subtitle, actions }: {
  children: React.ReactNode; title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [menu, setMenu] = useState(false);
  const { isSuperUser, user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profiles = useProfileMap([user?.id]);
  const me = user ? profiles[user.id] : null;

  const isActive = (to: string) => (to === "/admin" ? pathname === "/admin" : pathname.startsWith(to));

  const logout = async () => {
    await signOut();
    void navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-[#05070f]">
      <header className="sticky top-0 z-50 border-b border-gold/20 bg-[#05070f]/95 backdrop-blur-md">
        <div className="h-16 px-3 md:px-6 flex items-center gap-3">
          <button className="lg:hidden h-10 w-10 grid place-items-center border border-border" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </button>

          <Link to="/admin" className="flex items-center gap-2 shrink-0"><Logo size={30} withText={false} /></Link>
          <span className="hidden xl:block text-[9px] uppercase tracking-[0.3em] text-gold">Operations</span>

          <nav className="hidden lg:flex items-center gap-1 ml-2 min-w-0">
            <Link to="/" className="px-3 h-9 inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-gold">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            {PRIMARY.map((i) => (
              <Link key={i.to} to={i.to}
                className={`px-3 h-9 inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap ${
                  isActive(i.to) ? "text-gold border-b-2 border-gold" : "text-white/70 hover:text-white"}`}>
                <i.icon className="h-3.5 w-3.5" /> {i.label}
              </Link>
            ))}
            <div className="relative">
              <button onClick={() => setMore((v) => !v)} className="px-3 h-9 inline-flex items-center gap-1 text-[12px] text-white/70 hover:text-white">
                More <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {more && (
                <div onMouseLeave={() => setMore(false)}
                  className="absolute left-0 mt-1 w-60 border border-gold/25 bg-[var(--navy-deep)] z-50 py-1 shadow-2xl">
                  {MORE.map((i) => (
                    <Link key={i.to} to={i.to} onClick={() => setMore(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] text-white/75 hover:bg-white/[0.05] hover:text-gold">
                      <i.icon className="h-3.5 w-3.5" /> {i.label}
                    </Link>
                  ))}
                  {isSuperUser && (
                    <Link to="/super" onClick={() => setMore(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] text-crimson hover:bg-white/[0.05]">
                      <Crown className="h-3.5 w-3.5" /> Control Plane
                    </Link>
                  )}
                </div>
              )}
            </div>
          </nav>

          <div className="flex-1" />

          <Link to="/" className="lg:hidden h-10 w-10 grid place-items-center border border-border hover:border-gold" aria-label="Public site">
            <Home className="h-4 w-4" />
          </Link>
          <NotificationBell />

          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-2" aria-label="Account">
              <Avatar value={me?.avatar_url} name={me?.full_name ?? user?.email} size={36} />
            </button>
            {menu && (
              <div onMouseLeave={() => setMenu(false)}
                className="absolute right-0 mt-2 w-56 border border-gold/25 bg-[var(--navy-deep)] z-50 shadow-2xl">
                <div className="p-3 border-b border-border">
                  <div className="text-xs text-white/90 truncate">{me?.full_name ?? "Administrator"}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                </div>
                <Link to="/portal/profile" onClick={() => setMenu(false)} className="block px-3 py-2 text-[12px] text-white/75 hover:bg-white/[0.05]">My profile</Link>
                <Link to="/" onClick={() => setMenu(false)} className="block px-3 py-2 text-[12px] text-white/75 hover:bg-white/[0.05]">Public site</Link>
                <button onClick={() => void logout()} className="w-full text-left px-3 py-2 text-[12px] text-crimson hover:bg-white/[0.05] inline-flex items-center gap-2">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }} onClick={(e) => e.stopPropagation()}
              className="w-[82vw] max-w-xs h-full bg-[var(--navy-deep)] border-r border-gold/20 overflow-y-auto">
              <div className="h-16 px-4 flex items-center justify-between border-b border-gold/20">
                <Logo size={28} />
                <button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-gold border-b border-border">
                <Home className="h-4 w-4" /> Public homepage
              </Link>
              {PRIMARY.map((i) => (
                <Link key={i.to} to={i.to} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm ${isActive(i.to) ? "text-gold bg-white/[0.05]" : "text-white/75"}`}>
                  <i.icon className="h-4 w-4" /> {i.label}
                </Link>
              ))}
              <div className="px-4 pt-4 pb-1 text-[9px] uppercase tracking-[0.35em] text-muted-foreground">More</div>
              {MORE.map((i) => (
                <Link key={i.to} to={i.to} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-[13px] text-white/70">
                  <i.icon className="h-4 w-4" /> {i.label}
                </Link>
              ))}
              {isSuperUser && (
                <Link to="/super" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[13px] text-crimson">
                  <Crown className="h-4 w-4" /> Control Plane
                </Link>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="p-4 md:p-7 max-w-[1500px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.35em] text-gold inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </div>
            <h1 className="font-display text-xl md:text-2xl truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-1 max-w-3xl">{subtitle}</p>}
          </div>
          {actions}
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: {
  title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`border border-gold/20 bg-black/40 ${className}`}>
      {title && (
        <div className="p-3 border-b border-gold/20 flex items-center justify-between gap-3 flex-wrap">
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

/** Dashboard card that links straight to the action it describes. */
export function ActionCard({ to, label, value, hint, tone = "neutral", icon: Icon }: {
  to: string; label: string; value: React.ReactNode; hint?: string;
  tone?: "gold" | "good" | "warn" | "bad" | "info" | "neutral"; icon: typeof LayoutGrid;
}) {
  const map = {
    gold: "border-gold bg-gold/5 text-gold",
    good: "border-emerald-500/40 bg-emerald-500/5 text-emerald-300",
    warn: "border-amber-500/50 bg-amber-500/5 text-amber-300",
    bad: "border-crimson/60 bg-crimson/10 text-crimson",
    info: "border-sky-500/40 bg-sky-500/5 text-sky-300",
    neutral: "border-gold/20 bg-black/30 text-white/70",
  } as const;
  return (
    <Link to={to} className={`p-4 border block transition-transform hover:-translate-y-0.5 ${map[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.3em] opacity-80">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="font-display text-3xl mt-2 text-white">{value}</div>
      {hint && <div className="text-[10px] mt-1 opacity-80">{hint}</div>}
    </Link>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "good" | "warn" | "bad" | "info" | "neutral"; children: React.ReactNode }) {
  const map = {
    good: "bg-emerald-500/20 text-emerald-300",
    warn: "bg-amber-500/20 text-amber-300",
    bad: "bg-crimson/20 text-crimson",
    info: "bg-sky-500/20 text-sky-300",
    neutral: "bg-white/10 text-white/70",
  } as const;
  return <span className={`text-[10px] px-2 h-6 inline-flex items-center uppercase tracking-widest ${map[tone]}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-12 text-center text-sm text-muted-foreground">{children}</div>;
}
