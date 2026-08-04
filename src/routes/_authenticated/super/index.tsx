import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Activity, AlertTriangle, Building2, Car, Users, Wallet } from "lucide-react";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";
import { useCP, usePlatformHealth } from "@/lib/super";

export const Route = createFileRoute("/_authenticated/super/")({ component: Page });

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

function Dot({ state }: { state: string }) {
  const c = state === "operational" ? "bg-emerald-400" : state === "degraded" ? "bg-crimson" : "bg-amber-400";
  return <span className={`h-2 w-2 rounded-full ${c} ${state === "operational" ? "animate-pulse" : ""}`} />;
}

function Page() {
  const health = usePlatformHealth();
  const { rows: bookings } = useTable("bookings", { limit: 1000 });
  const { rows: drivers } = useTable("drivers", { order: "updated_at", limit: 400 });
  const { rows: profiles } = useTable("profiles", { limit: 1000 });
  const { rows: alerts } = useTable("alerts", { limit: 30 });
  const { rows: incidents } = useTable("driver_incidents", { limit: 200 });
  const { rows: orgs } = useCP("organizations", "name");

  const paid = useMemo(() => bookings.filter((b: Row) => b.payment_status === "paid"), [bookings]);
  const revenue = useMemo(() => paid.reduce((a: number, b: Row) => a + Number(b.total_price || 0), 0), [paid]);
  const today = startOfToday().getTime();
  const bookingsToday = bookings.filter((b: Row) => new Date(b.created_at).getTime() >= today).length;
  const activeDrivers = drivers.filter((d: Row) => d.status === "active").length;
  const liveUsers = profiles.filter((p: Row) => p.last_login_at && Date.now() - new Date(p.last_login_at).getTime() < 15 * 60000).length;
  const openIncidents = incidents.filter((i: Row) => !i.resolved);

  return (
    <SuperLayout title="Platform Overview" subtitle="One glance tells you whether the entire BiLUXS platform is healthy — services, footprint, demand and risk.">
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "API", state: health.api, hint: `${health.latency}ms round trip` },
          { label: "Database", state: health.db, hint: "Postgres · RLS enforced" },
          { label: "Realtime", state: health.realtime, hint: "Websocket channels" },
          { label: "Storage", state: "operational", hint: "Procurement bucket · private" },
        ].map((s) => (
          <div key={s.label} className="p-4 border border-crimson/20 bg-black/30">
            <div className="flex items-center gap-2">
              <Dot state={s.state} />
              <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{s.label}</span>
            </div>
            <div className="font-display text-lg mt-2 capitalize">{s.state}</div>
            <div className="text-[10px] text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <CStat label="Organizations" value={orgs.length.toString()} hint="Branches & regions" />
        <CStat label="Total Revenue" value={naira(revenue)} hint="Settled bookings" tone="good" />
        <CStat label="Live Users" value={liveUsers.toString()} hint="Active last 15 min" />
        <CStat label="Active Drivers" value={activeDrivers.toString()} hint={`${drivers.length} on network`} />
        <CStat label="Bookings Today" value={bookingsToday.toString()} hint="All channels" />
        <CStat label="Pending Incidents" value={openIncidents.length.toString()} tone={openIncidents.length ? "bad" : "neutral"} hint="Unresolved" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CPanel title={<span className="inline-flex items-center gap-2"><AlertTriangle className="h-3 w-3" /> System Alerts</span>}>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {alerts.map((a: Row) => (
              <div key={a.id} className="p-3">
                <div className="text-sm">{a.title}</div>
                <div className="text-[11px] text-muted-foreground">{a.body}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{since(a.created_at)}</div>
              </div>
            ))}
            {!alerts.length && <CEmpty>No platform alerts.</CEmpty>}
          </div>
        </CPanel>

        <CPanel title={<span className="inline-flex items-center gap-2"><Activity className="h-3 w-3" /> Governance Shortcuts</span>}>
          <div className="grid grid-cols-2 gap-px bg-crimson/10">
            {[
              { to: "/super/security", label: "Security Center", icon: AlertTriangle },
              { to: "/super/rbac", label: "Roles & Permissions", icon: Users },
              { to: "/super/pricing", label: "Pricing Engine", icon: Wallet },
              { to: "/super/fleet", label: "Fleet Governance", icon: Car },
              { to: "/super/organizations", label: "Organizations", icon: Building2 },
              { to: "/super/api", label: "API Monitoring", icon: Activity },
            ].map((s) => (
              <Link key={s.to} to={s.to} className="p-5 bg-black/40 hover:bg-white/[0.04] transition-colors">
                <s.icon className="h-4 w-4 text-crimson" />
                <div className="text-xs mt-2">{s.label}</div>
              </Link>
            ))}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
