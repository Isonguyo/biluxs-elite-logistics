import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, Truck, Users, DollarSign, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role")
      .eq("user_id", s.session.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Admin Control Center — BiLUXS" }] }),
  component: Page,
});

type Booking = {
  id: string; waybill_code: string; pickup_location: string; dropoff_location: string;
  status: string; total_price: number; user_id: string; created_at: string;
};
type Vehicle = { id: string; name: string; status: string; category: string };

function Page() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pulse, setPulse] = useState(false);

  const loadAll = () => {
    supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setBookings((data as Booking[]) || []));
    supabase.from("vehicles").select("id,name,status,category").order("name")
      .then(({ data }) => setVehicles((data as Vehicle[]) || []));
  };

  useEffect(() => {
    loadAll();
    const ch = supabase.channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        setPulse(true); setTimeout(() => setPulse(false), 800); loadAll();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status: status as Booking["status"] as never }).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Status → ${status}`);
  };
  const setVehicleStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("vehicles").update({ status: status as never }).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Vehicle marked ${status}`);
  };

  const stats = {
    total: bookings.length,
    revenue: bookings.reduce((a, b) => a + Number(b.total_price), 0),
    active: bookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status)).length,
    available: vehicles.filter((v) => v.status === "available").length,
  };

  return (
    <PageShell>
      <PageHero
        eyebrow={<span className="inline-flex items-center gap-2"><Radio className={`h-3 w-3 ${pulse ? "text-emerald-400 animate-ping" : "text-emerald-500"}`} /> Live Control Center</span> as unknown as string}
        title={<>Admin <span className="gradient-text">Operations</span></>}
        subtitle="Real-time booking management, fleet status and revenue analytics."
      />
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <S icon={<Activity className="h-5 w-5" />} label="Total Bookings" value={stats.total.toString()} />
            <S icon={<Activity className="h-5 w-5" />} label="Active Trips" value={stats.active.toString()} accent />
            <S icon={<DollarSign className="h-5 w-5" />} label="Gross Revenue" value={`₦${stats.revenue.toLocaleString()}`} />
            <S icon={<Truck className="h-5 w-5" />} label="Vehicles Available" value={`${stats.available}/${vehicles.length}`} />
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="bg-card border border-border">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-xl tracking-widest flex items-center gap-2"><Users className="h-5 w-5 text-gold" /> Live Bookings</h2>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Last 50</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-border">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 grid md:grid-cols-[auto_1fr_auto_auto] gap-4 items-center text-sm">
                    <div>
                      <div className="font-display tracking-widest">{b.waybill_code}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-xs">
                      <div className="text-white/80">{b.pickup_location}</div>
                      <div className="text-muted-foreground">→ {b.dropoff_location}</div>
                    </div>
                    <div className="font-display text-lg">₦{Number(b.total_price).toLocaleString()}</div>
                    <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)}
                      className="bg-input border border-border h-9 px-3 text-xs focus:outline-none focus:border-gold">
                      {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) =>
                        <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
                {!bookings.length && <div className="p-10 text-center text-muted-foreground text-sm">No bookings yet.</div>}
              </div>
            </div>

            <aside className="bg-card border border-border p-5 h-fit">
              <h2 className="font-display text-xl tracking-widest flex items-center gap-2 mb-5"><Truck className="h-5 w-5 text-gold" /> Fleet Status</h2>
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-3 p-3 bg-[var(--navy-deep)] border border-border">
                    <div>
                      <div className="text-sm">{v.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-gold">{v.category}</div>
                    </div>
                    <select value={v.status} onChange={(e) => setVehicleStatus(v.id, e.target.value)}
                      className="bg-input border border-border h-8 px-2 text-[10px] uppercase focus:outline-none focus:border-gold">
                      {["available", "in_use", "maintenance"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function S({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-5 border ${accent ? "border-gold bg-gold/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between text-gold">{icon}<span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span></div>
      <div className="font-display text-3xl mt-3">{value}</div>
    </div>
  );
}
