import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Crown, TrendingUp, Users, DollarSign, Radio, Star } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/biluxs/PageShell";

export const Route = createFileRoute("/_authenticated/super")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role")
      .eq("user_id", s.session.user.id).eq("role", "super_user").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Super User Panel — BiLUXS" }] }),
  component: Page,
});

type Booking = {
  id: string; total_price: number; payment_status: string;
  paid_at: string | null; created_at: string; luxury_protocol: boolean;
};
type Profile = { id: string; full_name: string | null; phone: string | null };
type UserRow = { id: string; full_name: string | null; phone: string | null; roles: string[] };
type DriverStat = {
  driver_id: string; full_name: string; status: string;
  completed_rides: number; avg_rating: number; review_count: number;
};

const ROLES = ["super_user", "admin", "driver", "customer"] as const;
type Role = typeof ROLES[number];

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const daysAgo = (n: number) => { const x = startOfDay(new Date()); x.setDate(x.getDate() - n); return x; };

function Page() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [driverStats, setDriverStats] = useState<DriverStat[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: bks }, { data: profs }, { data: rls }, { data: ds }] = await Promise.all([
      supabase.from("bookings").select("id,total_price,payment_status,paid_at,created_at,luxury_protocol").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,phone"),
      supabase.from("user_roles").select("user_id,role"),
      (supabase as any).from("driver_stats").select("*").order("completed_rides", { ascending: false }),
    ]);
    setBookings((bks as Booking[]) || []);
    setDriverStats((ds as DriverStat[]) || []);
    const rolesMap = new Map<string, string[]>();
    (rls ?? []).forEach((r: any) => {
      const arr = rolesMap.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesMap.set(r.user_id, arr);
    });
    setUsers(
      (profs as Profile[] ?? []).map((p) => ({
        id: p.id, full_name: p.full_name, phone: p.phone,
        roles: rolesMap.get(p.id) ?? ["customer"],
      })),
    );
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("super-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const paid = useMemo(() => bookings.filter((b) => b.payment_status === "paid"), [bookings]);

  // Revenue horizons (based on paid_at fallback created_at)
  const horizons = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = daysAgo(1);
    const weekStart = daysAgo(7);
    const monthStart = daysAgo(30);
    let today_v = 0, yesterday_v = 0, week_v = 0, month_v = 0, total_v = 0;
    for (const b of paid) {
      const t = new Date(b.paid_at || b.created_at);
      const amt = Number(b.total_price);
      total_v += amt;
      if (t >= today) today_v += amt;
      else if (t >= yesterday) yesterday_v += amt;
      if (t >= weekStart) week_v += amt;
      if (t >= monthStart) month_v += amt;
    }
    return { today_v, yesterday_v, week_v, month_v, total_v };
  }, [paid]);

  // Daily revenue over the last 30 days
  const revenueSeries = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const b of paid) {
      const d = new Date(b.paid_at || b.created_at);
      const key = startOfDay(d).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(b.total_price));
    }
    return Array.from(buckets, ([date, revenue]) => ({
      date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      revenue,
    }));
  }, [paid]);

  const luxurySplit = useMemo(() => {
    const lux = paid.filter((b) => b.luxury_protocol).reduce((a, b) => a + Number(b.total_price), 0);
    const std = paid.reduce((a, b) => a + Number(b.total_price), 0) - lux;
    return [
      { name: "Luxury Protocol", value: lux },
      { name: "Standard", value: std },
    ];
  }, [paid]);

  const setRole = async (userId: string, role: Role) => {
    setSavingId(userId);
    // Replace all roles with a single new role for simplicity of the "Assign Role" flow.
    const del = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (del.error) { toast.error(del.error.message); setSavingId(null); return; }
    const ins = await supabase.from("user_roles").insert({ user_id: userId, role: role as never });
    setSavingId(null);
    if (ins.error) toast.error(ins.error.message);
    else toast.success(`Role → ${role}`);
    load();
  };

  return (
    <PageShell>
      <div className="min-h-screen bg-[#05070f]">
        <div className="border-b border-crimson/30 bg-gradient-to-r from-[#0a0511] via-[var(--navy-deep)] to-[#0a0511]">
          <div className="max-w-[1600px] mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-crimson">
                <Crown className="h-3 w-3" /> Restricted · Super User
              </div>
              <h1 className="font-display text-3xl md:text-4xl mt-1 tracking-widest">Executive Master Control</h1>
            </div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Radio className="h-3 w-3 text-crimson animate-pulse" /> Sovereign Access
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
          {/* Revenue Horizons */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-crimson mb-3">Financial Horizons</div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Kpi label="Today" value={horizons.today_v} icon={<DollarSign className="h-4 w-4" />} accent />
              <Kpi label="Yesterday" value={horizons.yesterday_v} icon={<DollarSign className="h-4 w-4" />} />
              <Kpi label="Last 7 days" value={horizons.week_v} icon={<TrendingUp className="h-4 w-4" />} />
              <Kpi label="Last 30 days" value={horizons.month_v} icon={<TrendingUp className="h-4 w-4" />} />
              <Kpi label="All-time" value={horizons.total_v} icon={<Crown className="h-4 w-4" />} gold />
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
            <div className="border border-crimson/20 bg-black/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-crimson flex items-center gap-2 mb-3">
                <TrendingUp className="h-3 w-3" /> Revenue · Last 30 Days
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#DC143C" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#DC143C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1a2036" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#5a6478" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#5a6478" fontSize={10} tickLine={false} axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`} />
                    <Tooltip
                      contentStyle={{ background: "#0b0d17", border: "1px solid #DC143C", fontSize: 12 }}
                      formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#DC143C" strokeWidth={2} fill="url(#revColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-gold/20 bg-black/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold flex items-center gap-2 mb-3">
                <Crown className="h-3 w-3" /> Revenue Mix
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={luxurySplit} innerRadius={55} outerRadius={90} dataKey="value" stroke="none">
                      <Cell fill="#DC143C" />
                      <Cell fill="#0b0d17" stroke="#D4AF37" />
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                    <Tooltip contentStyle={{ background: "#0b0d17", border: "1px solid #D4AF37", fontSize: 12 }}
                      formatter={(v: number) => `₦${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly comparison bar */}
          <div className="border border-crimson/20 bg-black/40 p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-crimson mb-3">Horizon Comparison</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { period: "Today", revenue: horizons.today_v },
                  { period: "Yesterday", revenue: horizons.yesterday_v },
                  { period: "Last 7d", revenue: horizons.week_v },
                  { period: "Last 30d", revenue: horizons.month_v },
                ]}>
                  <CartesianGrid stroke="#1a2036" strokeDasharray="3 3" />
                  <XAxis dataKey="period" stroke="#5a6478" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#5a6478" fontSize={10} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`} />
                  <Tooltip contentStyle={{ background: "#0b0d17", border: "1px solid #DC143C", fontSize: 12 }}
                    formatter={(v: number) => `₦${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#DC143C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Staff Directory + Role Assignment */}
            <div className="border border-crimson/20 bg-black/40">
              <div className="p-3 border-b border-crimson/20 flex items-center gap-2">
                <Users className="h-4 w-4 text-crimson" />
                <div className="text-[10px] uppercase tracking-[0.3em] text-crimson">Staff Directory & Role Engine</div>
              </div>
              <div className="max-h-[520px] overflow-y-auto divide-y divide-border">
                {users.map((u) => {
                  const currentRole = (u.roles.includes("super_user") ? "super_user" :
                    u.roles.includes("admin") ? "admin" :
                    u.roles.includes("driver") ? "driver" : "customer") as Role;
                  return (
                    <div key={u.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{u.full_name || "Unnamed"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{u.phone || u.id.slice(0, 12)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={currentRole} onChange={(e) => setRole(u.id, e.target.value as Role)}
                          disabled={savingId === u.id}
                          className={`h-9 px-3 bg-input border text-[10px] uppercase tracking-widest focus:outline-none focus:border-crimson ${
                            currentRole === "super_user" ? "border-crimson text-crimson" :
                            currentRole === "admin" ? "border-gold text-gold" :
                            currentRole === "driver" ? "border-emerald-500 text-emerald-400" :
                            "border-border text-white/70"
                          }`}>
                          {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
                {!users.length && <div className="p-8 text-xs text-muted-foreground text-center">No profiles.</div>}
              </div>
            </div>

            {/* Driver leaderboard */}
            <div className="border border-gold/20 bg-black/40">
              <div className="p-3 border-b border-gold/20 flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" />
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Chauffeur Performance</div>
              </div>
              <div className="max-h-[520px] overflow-y-auto divide-y divide-border">
                {driverStats.map((d) => (
                  <div key={d.driver_id} className="p-3 grid grid-cols-[1fr_auto_auto] items-center gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{d.full_name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Rides</div>
                      <div className="font-display text-lg">{d.completed_rides}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Rating</div>
                      <div className="font-display text-lg text-gold inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-gold text-gold" /> {Number(d.avg_rating || 0).toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
                {!driverStats.length && <div className="p-8 text-xs text-muted-foreground text-center">No drivers.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Kpi({ label, value, icon, accent, gold }: { label: string; value: number; icon: React.ReactNode; accent?: boolean; gold?: boolean }) {
  return (
    <div className={`p-4 border ${gold ? "border-gold bg-gold/10" : accent ? "border-crimson bg-crimson/10" : "border-crimson/20 bg-black/30"}`}>
      <div className={`flex items-center justify-between ${gold ? "text-gold" : accent ? "text-crimson" : "text-crimson/80"}`}>
        {icon}<span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
      </div>
      <div className="font-display text-2xl mt-2">₦{Math.round(value).toLocaleString()}</div>
    </div>
  );
}
