import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Receipt, Calendar, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BiLUXS" }] }),
  component: Page,
});

type Booking = {
  id: string; waybill_code: string; pickup_location: string; dropoff_location: string;
  status: string; total_price: number; created_at: string; pickup_time: string | null;
  luxury_protocol: boolean;
};

function Page() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    const load = () => supabase.from("bookings").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).then(({ data }) => setBookings((data as Booking[]) || []));
    load();
    const ch = supabase.channel("dash-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status)).length,
    spent: bookings.reduce((a, b) => a + Number(b.total_price), 0),
    vip: bookings.filter((b) => b.luxury_protocol).length,
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Member Dashboard"
        title={<>Welcome, <span className="gradient-text">{profile?.full_name || "VIP Member"}</span></>}
        subtitle="Track your active waybills, review past trips and manage your luxury reservations."
      />
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Stat icon={<Receipt className="h-5 w-5" />} label="Total Bookings" value={stats.total.toString()} />
            <Stat icon={<Calendar className="h-5 w-5" />} label="Active Trips" value={stats.active.toString()} accent />
            <Stat icon={<Crown className="h-5 w-5" />} label="Luxury Protocol" value={stats.vip.toString()} />
            <Stat icon={<MapPin className="h-5 w-5" />} label="Total Spend" value={`₦${stats.spent.toLocaleString()}`} />
          </div>

          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl tracking-widest">Your Bookings</h2>
            <Link to="/book" className="inline-flex items-center gap-2 px-4 h-11 bg-crimson text-white text-xs uppercase tracking-widest press-effect">
              <Plus className="h-4 w-4" /> New Booking
            </Link>
          </div>

          {!bookings.length ? (
            <div className="p-16 text-center border border-dashed border-border">
              <div className="text-muted-foreground">No bookings yet. Reserve your first journey.</div>
              <Link to="/book" className="mt-6 inline-flex px-6 h-11 items-center bg-crimson text-white text-xs uppercase tracking-widest press-effect">Book Now</Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {bookings.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border p-5 grid md:grid-cols-[auto_1fr_auto_auto] gap-5 items-center hover:border-gold transition-colors">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Waybill</div>
                    <div className="font-display text-lg tracking-widest">{b.waybill_code}</div>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-gold" />{b.pickup_location}</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3 text-crimson" />{b.dropoff_location}</div>
                    {b.luxury_protocol && <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-gold uppercase tracking-widest"><Crown className="h-3 w-3" /> Luxury Protocol</div>}
                  </div>
                  <StatusBadge status={b.status} />
                  <div className="text-right">
                    <div className="font-display text-xl">₦{Number(b.total_price).toLocaleString()}</div>
                    <Link to="/track" className="text-[10px] uppercase tracking-widest text-gold hover:underline">Track →</Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-5 border ${accent ? "border-gold bg-gold/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between text-gold">{icon}<span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span></div>
      <div className="font-display text-3xl mt-3">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-300",
    confirmed: "bg-blue-500/20 text-blue-300",
    in_progress: "bg-crimson/20 text-crimson",
    completed: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-red-500/20 text-red-300",
  };
  return <div className={`px-3 h-7 inline-flex items-center text-[10px] uppercase tracking-widest ${map[status] || "bg-muted text-foreground"}`}>{status.replace("_", " ")}</div>;
}
