import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Car, Route as RouteIcon, Plane, Hotel, Package, Palmtree, ShoppingBag,
  MessageSquare, CreditCard, Wallet, Bell, LifeBuoy, User, Settings, Crown, Sparkles,
  MapPin, FileText, BarChart3, Menu, X, Search, ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, useProfile, greeting } from "@/lib/portal";
import { Logo } from "@/components/biluxs/Logo";

type Item = { to: string; label: string; icon: typeof LayoutGrid; badge?: number };

export function PortalLayout({ children, title, subtitle, actions }: {
  children: React.ReactNode; title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { unread } = useNotifications();
  const { profile } = useProfile();
  const { user, isAdmin, isDriver, isSuperUser } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups: { heading: string; items: Item[] }[] = [
    {
      heading: "Journey",
      items: [
        { to: "/portal", label: "Overview", icon: LayoutGrid },
        { to: "/portal/trips", label: "My Trips", icon: RouteIcon },
        { to: "/fleet", label: "Book a Ride", icon: Car },
        { to: "/portal/places", label: "Saved Places", icon: MapPin },
      ],
    },
    {
      heading: "Services",
      items: [
        { to: "/portal/flights", label: "Flights", icon: Plane },
        { to: "/portal/hotels", label: "Hotels", icon: Hotel },
        { to: "/portal/cargo", label: "Cargo", icon: Package },
        { to: "/portal/tours", label: "Tour Packages", icon: Palmtree },
        { to: "/portal/shopping", label: "Luxury Shopping", icon: ShoppingBag },
        { to: "/portal/concierge", label: "Concierge", icon: Sparkles },
      ],
    },
    {
      heading: "Finance",
      items: [
        { to: "/portal/wallet", label: "Wallet", icon: Wallet },
        { to: "/portal/payments", label: "Payments", icon: CreditCard },
        { to: "/portal/loyalty", label: "Rewards", icon: Crown },
        { to: "/portal/documents", label: "Documents", icon: FileText },
      ],
    },
    {
      heading: "Account",
      items: [
        { to: "/portal/messages", label: "Messages", icon: MessageSquare },
        { to: "/portal/notifications", label: "Notifications", icon: Bell, badge: unread },
        { to: "/portal/analytics", label: "My Analytics", icon: BarChart3 },
        { to: "/portal/support", label: "Support", icon: LifeBuoy },
        { to: "/portal/profile", label: "Profile", icon: User },
        { to: "/portal/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  const initials = (profile?.full_name || user?.email || "B").slice(0, 2).toUpperCase();

  const Nav = (
    <nav className="flex flex-col gap-6 pb-10">
      {groups.map((g) => (
        <div key={g.heading}>
          <div className="px-4 text-[9px] uppercase tracking-[0.35em] text-muted-foreground/70 mb-2">{g.heading}</div>
          <div className="flex flex-col">
            {g.items
              .filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase()))
              .map((i) => {
                const active = i.to === "/portal" ? pathname === "/portal" : pathname.startsWith(i.to);
                return (
                  <Link
                    key={i.to}
                    to={i.to}
                    onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                      active ? "text-gold bg-white/[0.04]" : "text-white/70 hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    {active && (
                      <motion.span layoutId="portal-active" className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold" />
                    )}
                    <i.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{i.label}</span>
                    {!!i.badge && (
                      <span className="ml-auto min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-crimson text-white text-[10px]">
                        {i.badge > 99 ? "99+" : i.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        </div>
      ))}

      {(isDriver || isAdmin || isSuperUser) && (
        <div>
          <div className="px-4 text-[9px] uppercase tracking-[0.35em] text-muted-foreground/70 mb-2">Staff</div>
          <div className="flex flex-col">
            {isDriver && <Link to="/driver" className="px-4 py-2.5 text-[13px] text-emerald-400 hover:bg-white/[0.03]">Driver Cockpit</Link>}
            {isAdmin && <Link to="/admin" className="px-4 py-2.5 text-[13px] text-gold hover:bg-white/[0.03]">Command Center</Link>}
            {isSuperUser && <Link to="/super" className="px-4 py-2.5 text-[13px] text-crimson hover:bg-white/[0.03]">Control Plane</Link>}
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--navy-deep)] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border sticky top-0 h-screen overflow-y-auto">
        <div className="h-20 px-4 flex items-center border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={34} />
          </Link>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search portal…"
              className="w-full h-9 pl-9 pr-3 bg-white/[0.03] border border-border text-xs outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>
        {Nav}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 h-full bg-[var(--navy-deep)] border-r border-border overflow-y-auto"
            >
              <div className="h-16 px-4 flex items-center justify-between border-b border-border">
                <Logo size={30} />
                <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              {Nav}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-16 lg:h-20 px-4 md:px-8 flex items-center gap-3 border-b border-border bg-[var(--navy-deep)]/90 backdrop-blur-md">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <Link to="/" className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold">
            <ChevronLeft className="h-3 w-3" /> Site
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.35em] text-gold">{greeting()}, {(profile?.full_name || "Guest").split(" ")[0]}</div>
            <div className="font-display text-lg md:text-xl truncate">{title}</div>
          </div>
          {actions}
          <Link to="/portal/notifications" className="relative h-10 w-10 grid place-items-center border border-border hover:border-gold transition-colors">
            <Bell className="h-4 w-4" />
            {!!unread && <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 grid place-items-center rounded-full bg-crimson text-white text-[9px]">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <Link to="/portal/profile" className="h-10 w-10 grid place-items-center border border-gold text-gold text-[11px] tracking-widest overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials}
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {subtitle && <p className="text-xs text-muted-foreground mb-6 max-w-2xl">{subtitle}</p>}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-border p-5 ${className}`}>{children}</div>;
}

export function Stat({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: string; accent?: string }) {
  return (
    <Card className="hover:border-gold/60 transition-colors">
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className={`font-display text-2xl md:text-3xl mt-2 ${accent ?? "text-white"}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4 mt-10 first:mt-0">
      <h2 className="font-display text-xl tracking-wide">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
