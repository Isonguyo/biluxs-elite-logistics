import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Gauge, Building2, UserCog, ShieldCheck, ToggleRight, Coins, Car, Wallet,
  ScrollText, ShieldAlert, Plug, Megaphone, Sparkles, BarChart3, Workflow, LayoutTemplate,
  Globe2, Handshake, Users, DatabaseBackup, Activity, Terminal, Menu, X, Search, ChevronLeft,
} from "lucide-react";
import { Logo } from "@/components/biluxs/Logo";
import { supabase } from "@/integrations/supabase/client";

type Item = { to: string; label: string; icon: typeof Gauge };

const GROUPS: { heading: string; items: Item[] }[] = [
  { heading: "Platform", items: [
    { to: "/super", label: "Platform Overview", icon: Gauge },
    { to: "/super/organizations", label: "Organizations", icon: Building2 },
    { to: "/super/admins", label: "Admin Management", icon: UserCog },
    { to: "/super/rbac", label: "Roles & Permissions", icon: ShieldCheck },
  ]},
  { heading: "Configuration", items: [
    { to: "/super/features", label: "Feature Flags", icon: ToggleRight },
    { to: "/super/pricing", label: "Pricing Engine", icon: Coins },
    { to: "/super/automation", label: "Workflow Automation", icon: Workflow },
    { to: "/super/integrations", label: "Integrations", icon: Plug },
  ]},
  { heading: "Governance", items: [
    { to: "/super/fleet", label: "Fleet Governance", icon: Car },
    { to: "/super/finance", label: "Financial Center", icon: Wallet },
    { to: "/super/audit", label: "Audit Center", icon: ScrollText },
    { to: "/super/security", label: "Security Center", icon: ShieldAlert },
  ]},
  { heading: "Growth", items: [
    { to: "/super/intelligence", label: "Business Intelligence", icon: BarChart3 },
    { to: "/super/ai", label: "AI Operations", icon: Sparkles },
    { to: "/super/customers", label: "Customer Intelligence", icon: Users },
    { to: "/super/partners", label: "Partners", icon: Handshake },
  ]},
  { heading: "Content", items: [
    { to: "/super/cms", label: "Content Manager", icon: LayoutTemplate },
    { to: "/super/destinations", label: "Destinations", icon: Globe2 },
    { to: "/super/broadcasts", label: "Notification Engine", icon: Megaphone },
  ]},
  { heading: "Infrastructure", items: [
    { to: "/super/infrastructure", label: "Disaster Recovery", icon: DatabaseBackup },
    { to: "/super/api", label: "API Monitoring", icon: Activity },
    { to: "/super/developer", label: "Developer Center", icon: Terminal },
  ]},
];

type Hit = { label: string; sub: string; to: string };

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const [bk, pr, dr, ve, pa, de] = await Promise.all([
        supabase.from("bookings").select("id,waybill_code,pickup_location,total_price").ilike("waybill_code", like).limit(5),
        supabase.from("profiles").select("id,full_name,phone").ilike("full_name", like).limit(5),
        supabase.from("drivers").select("id,full_name,plate_number").ilike("full_name", like).limit(5),
        supabase.from("vehicles").select("id,name,category").ilike("name", like).limit(5),
        (supabase as any).from("partners").select("id,name,category").ilike("name", like).limit(5),
        (supabase as any).from("destinations").select("id,city,country").ilike("city", like).limit(5),
      ]);
      const out: Hit[] = [];
      (bk.data ?? []).forEach((r: any) => out.push({ label: r.waybill_code, sub: `Booking · ${r.pickup_location}`, to: `/admin/bookings/${r.id}` }));
      (pr.data ?? []).forEach((r: any) => out.push({ label: r.full_name ?? "Unnamed", sub: `Customer · ${r.phone ?? "—"}`, to: `/super/customers` }));
      (dr.data ?? []).forEach((r: any) => out.push({ label: r.full_name, sub: `Driver · ${r.plate_number ?? "—"}`, to: `/admin/drivers` }));
      (ve.data ?? []).forEach((r: any) => out.push({ label: r.name, sub: `Vehicle · ${r.category}`, to: `/super/fleet` }));
      (pa.data ?? []).forEach((r: any) => out.push({ label: r.name, sub: `Partner · ${r.category}`, to: `/super/partners` }));
      (de.data ?? []).forEach((r: any) => out.push({ label: `${r.city}, ${r.country}`, sub: "Destination", to: `/super/destinations` }));
      setHits(out);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm p-4 md:p-20" onClick={onClose}>
      <div className="max-w-2xl mx-auto border border-gold/30 bg-[var(--navy-deep)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-gold/20">
          <Search className="h-4 w-4 text-gold" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search bookings, users, drivers, vehicles, partners, destinations…"
            className="flex-1 bg-transparent text-sm outline-none" />
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-border">
          {hits.map((h, i) => (
            <button key={i} onClick={() => { onClose(); void nav({ to: h.to }); }}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.04]">
              <div className="text-sm">{h.label}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{h.sub}</div>
            </button>
          ))}
          {!hits.length && <div className="p-8 text-center text-xs text-muted-foreground">
            {q.length < 2 ? "Type at least two characters." : "No matches across the platform."}
          </div>}
        </div>
      </div>
    </div>
  );
}

export function SuperLayout({ children, title, subtitle, actions }: {
  children: React.ReactNode; title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const groups = useMemo(() => GROUPS.map((g) => ({
    ...g, items: g.items.filter((i) => !filter || i.label.toLowerCase().includes(filter.toLowerCase())),
  })).filter((g) => g.items.length), [filter]);

  const Nav = (
    <nav className="flex flex-col gap-6 pb-10">
      {groups.map((g) => (
        <div key={g.heading}>
          <div className="px-4 text-[9px] uppercase tracking-[0.35em] text-muted-foreground/70 mb-2">{g.heading}</div>
          <div className="flex flex-col">
            {g.items.map((i) => {
              const active = i.to === "/super" ? pathname === "/super" : pathname.startsWith(i.to);
              return (
                <Link key={i.to} to={i.to} onClick={() => setOpen(false)}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                    active ? "text-crimson bg-white/[0.05]" : "text-white/70 hover:text-white hover:bg-white/[0.03]"
                  }`}>
                  {active && <motion.span layoutId="cp-active" className="absolute left-0 top-0 bottom-0 w-[2px] bg-crimson" />}
                  <i.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{i.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <div className="px-4 text-[9px] uppercase tracking-[0.35em] text-muted-foreground/70 mb-2">Operations</div>
        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gold hover:bg-white/[0.03]">
          <Gauge className="h-4 w-4" /> Command Center
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#05070f] flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-crimson/20 sticky top-0 h-screen overflow-y-auto bg-[var(--navy-deep)]">
        <div className="h-20 px-4 flex items-center gap-3 border-b border-crimson/20">
          <Logo size={32} />
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-crimson">Platform</div>
            <div className="font-display text-sm tracking-widest">Control Plane</div>
          </div>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Jump to module…"
              className="w-full h-9 pl-9 pr-3 bg-white/[0.03] border border-border text-xs outline-none focus:border-crimson transition-colors" />
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
              className="w-72 h-full bg-[var(--navy-deep)] border-r border-crimson/20 overflow-y-auto">
              <div className="h-16 px-4 flex items-center justify-between border-b border-crimson/20">
                <Logo size={28} />
                <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              {Nav}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-16 lg:h-20 px-4 md:px-8 flex items-center gap-3 border-b border-crimson/20 bg-[#05070f]/90 backdrop-blur-md">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <Link to="/" className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-crimson">
            <ChevronLeft className="h-3 w-3" /> Site
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.35em] text-crimson inline-flex items-center gap-2">
              <Crown className="h-3 w-3" /> Governance Tier
            </div>
            <div className="font-display text-lg md:text-xl truncate">{title}</div>
          </div>
          <button onClick={() => setSearch(true)}
            className="inline-flex items-center gap-2 h-9 px-3 border border-border text-[11px] text-muted-foreground hover:border-crimson hover:text-white transition-colors">
            <Search className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Search platform</span>
            <span className="hidden md:inline text-[9px] border border-border px-1">⌘K</span>
          </button>
          {actions}
        </header>
        <main className="flex-1 p-4 md:p-8">
          {subtitle && <p className="text-xs text-muted-foreground mb-6 max-w-3xl">{subtitle}</p>}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {children}
          </motion.div>
        </main>
      </div>

      <AnimatePresence>{search && <GlobalSearch onClose={() => setSearch(false)} />}</AnimatePresence>
    </div>
  );
}

export function CPanel({ title, action, children, className = "" }: {
  title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`border border-crimson/20 bg-black/40 ${className}`}>
      {title && (
        <div className="p-3 border-b border-crimson/20 flex items-center justify-between gap-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-crimson">{title}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function CStat({ label, value, hint, tone = "neutral" }: {
  label: string; value: React.ReactNode; hint?: string; tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const border = tone === "good" ? "border-emerald-500/40" : tone === "warn" ? "border-amber-500/40"
    : tone === "bad" ? "border-crimson" : "border-crimson/20";
  return (
    <div className={`p-4 border ${border} bg-black/30`}>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-2">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? "bg-emerald-500/70" : "bg-white/15"} ${disabled ? "opacity-50" : ""}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function CEmpty({ children }: { children: React.ReactNode }) {
  return <div className="p-12 text-center text-sm text-muted-foreground">{children}</div>;
}
