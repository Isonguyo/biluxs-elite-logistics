import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Activity, Truck, Users, DollarSign, Radio, Bell, MapPin, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/biluxs/PageShell";
import { LiveMap } from "@/components/biluxs/LiveMap";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role")
      .eq("user_id", s.session.user.id).in("role", ["admin", "super_user"]);
    if (!data || !data.length) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Command Center — BiLUXS" }] }),
  component: Page,
});

type Booking = {
  id: string; waybill_code: string; pickup_location: string; dropoff_location: string;
  status: string; total_price: number; user_id: string; created_at: string;
  driver_id: string | null; payment_status: string; driver_lat_lng: { lat: number; lng: number } | null;
};
type Driver = { id: string; full_name: string; status: string };
type Alert = { id: string; kind: string; title: string; body: string | null; created_at: string; metadata: Record<string, unknown> };

function Page() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pulse, setPulse] = useState(false);

  const loadAll = () => {
    supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setBookings((data as Booking[]) || []));
    supabase.from("drivers").select("id,full_name,status").order("full_name")
      .then(({ data }) => setDrivers((data as Driver[]) || []));
    supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => setAlerts((data as Alert[]) || []));
  };

  useEffect(() => {
    loadAll();
    const ch = supabase.channel("cmd-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        setPulse(true); setTimeout(() => setPulse(false), 800); loadAll();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        const a = payload.new as Alert;
        setAlerts((prev) => [a, ...prev].slice(0, 30));
        toast.success(`🛰 ${a.title}`, { description: a.body ?? undefined });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const assignDriver = async (bookingId: string, driverId: string) => {
    const { error } = await supabase.from("bookings").update({ driver_id: driverId || null } as never).eq("id", bookingId);
    if (error) toast.error(error.message);
    else {
      const d = drivers.find((x) => x.id === driverId);
      toast.success(driverId ? `Assigned ${d?.full_name}` : "Driver unassigned");
    }
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status } as never).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Status → ${status}`);
  };

  const activeDriverPins = useMemo(() => {
    return bookings
      .filter((b) => b.status === "in_progress" && b.driver_lat_lng && b.driver_id)
      .map((b) => {
        const d = drivers.find((x) => x.id === b.driver_id);
        return {
          id: b.id, lat: b.driver_lat_lng!.lat, lng: b.driver_lat_lng!.lng,
          label: d?.full_name ?? "Driver", waybill: b.waybill_code,
        };
      });
  }, [bookings, drivers]);

  const stats = {
    total: bookings.length,
    revenue: bookings.filter((b) => b.payment_status === "paid").reduce((a, b) => a + Number(b.total_price), 0),
    active: bookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status)).length,
    onRoute: activeDriverPins.length,
  };

  return (
    <PageShell>
      <div className="min-h-screen bg-[#05070f]">
        <div className="border-b border-gold/20 bg-gradient-to-r from-[var(--navy-deep)] via-[#0a0d1a] to-[var(--navy-deep)]">
          <div className="max-w-[1600px] mx-auto px-6 py-6 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-gold">
                <Radio className={`h-3 w-3 ${pulse ? "text-emerald-400 animate-ping" : "text-emerald-500"}`} /> Live · Command Center
              </div>
              <h1 className="font-display text-3xl md:text-4xl mt-1 tracking-widest">Enterprise Mission Control</h1>
            </div>
            <div className="hidden md:flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" /> Systems Nominal
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <S icon={<Activity className="h-4 w-4" />} label="Bookings" value={stats.total.toString()} />
            <S icon={<Activity className="h-4 w-4" />} label="Active" value={stats.active.toString()} accent />
            <S icon={<DollarSign className="h-4 w-4" />} label="Revenue (paid)" value={`₦${stats.revenue.toLocaleString()}`} />
            <S icon={<Truck className="h-4 w-4" />} label="Fleet On-Route" value={stats.onRoute.toString()} />
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-4">
            <div className="space-y-4">
              <div className="border border-gold/20 bg-black/40">
                <div className="p-3 border-b border-gold/20 flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><MapPin className="h-3 w-3" /> Live Fleet Telemetry</div>
                  <div className="text-[10px] text-muted-foreground">{activeDriverPins.length} drivers streaming</div>
                </div>
                <div className="h-[420px] relative">
                  <LiveMap pins={activeDriverPins} />
                </div>
              </div>

              <div className="border border-border bg-card">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><Users className="h-3 w-3" /> Booking Queue</div>
                  <span className="text-[10px] text-muted-foreground">Last 100</span>
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
                  {bookings.map((b) => (
                    <div key={b.id} className="p-3 grid md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center text-sm">
                      <div>
                        <div className="font-display tracking-widest">{b.waybill_code}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-white/80 truncate max-w-[220px]">{b.pickup_location}</div>
                        <div className="text-muted-foreground truncate max-w-[220px]">→ {b.dropoff_location}</div>
                      </div>
                      <div className={`text-[10px] px-2 h-6 inline-flex items-center uppercase tracking-widest ${b.payment_status === "paid" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{b.payment_status}</div>
                      <div className="font-display text-base">₦{Number(b.total_price).toLocaleString()}</div>
                      <select value={b.driver_id ?? ""} onChange={(e) => assignDriver(b.id, e.target.value)}
                        className={`bg-input border h-8 px-2 text-[10px] uppercase focus:outline-none focus:border-gold ${b.driver_id ? "border-gold text-gold" : "border-border"}`}>
                        <option value="">— Driver —</option>
                        {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                      </select>
                      <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)}
                        className="bg-input border border-border h-8 px-2 text-[10px] focus:outline-none focus:border-gold">
                        {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) =>
                          <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                  {!bookings.length && <div className="p-10 text-center text-muted-foreground text-sm">No bookings yet.</div>}
                </div>
              </div>
            </div>

            <aside className="border border-gold/20 bg-black/40 h-fit sticky top-24">
              <div className="p-3 border-b border-gold/20 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><Bell className="h-3 w-3" /> Live Alerts</div>
                <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div className="max-h-[820px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {alerts.map((a) => (
                    <motion.div key={a.id} initial={{ opacity: 0, x: 20, backgroundColor: "rgba(212,175,55,0.15)" }}
                      animate={{ opacity: 1, x: 0, backgroundColor: "rgba(0,0,0,0)" }}
                      transition={{ duration: 1.4 }}
                      className="p-3 border-b border-border">
                      <div className="flex items-start gap-2">
                        <ScanLine className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold">{a.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{a.body}</div>
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{new Date(a.created_at).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!alerts.length && <div className="p-8 text-center text-xs text-muted-foreground">No alerts yet. QR verifications and dispatch events will flash here.</div>}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function S({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-4 border ${accent ? "border-gold bg-gold/5" : "border-gold/20 bg-black/30"}`}>
      <div className="flex items-center justify-between text-gold">{icon}<span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span></div>
      <div className="font-display text-2xl mt-2">{value}</div>
    </div>
  );
}
