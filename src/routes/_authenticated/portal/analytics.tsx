import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, MapPin, Navigation, DollarSign, Award, Package, ShoppingBag, Compass } from "lucide-react";
import { PortalLayout, Card, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { ngn, useProfile, tierOf } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/analytics")({
  head: () => ({
    meta: [
      { title: "My Analytics — BiLUXS Member Portal" },
      { name: "description", content: "Total trips, distance travelled and lifetime spend across BiLUXS services." },
      { property: "og:title", content: "My Analytics — BiLUXS" },
      { property: "og:description", content: "Your travel footprint across chauffeur, cargo, tours and shopping." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type B = {
  id: string;
  total_price: number;
  distance_km: number;
  luxury_protocol: boolean;
  payment_status: string;
  status: string;
  created_at: string;
  dropoff_location: string;
};

function Page() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [bookings, setBookings] = useState<B[]>([]);
  const [counts, setCounts] = useState({ tours: 0, cargo: 0, shopping: 0 });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("id,total_price,distance_km,luxury_protocol,payment_status,status,created_at,dropoff_location")
      .eq("user_id", user.id)
      .then(({ data }) => setBookings((data as B[]) ?? []));
    Promise.all([
      supabase.from("tour_bookings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("cargo_shipments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("shop_orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([t, c, s]) => setCounts({ tours: t.count ?? 0, cargo: c.count ?? 0, shopping: s.count ?? 0 }));
  }, [user]);

  const spend = bookings.filter((b) => b.payment_status === "paid").reduce((a, b) => a + Number(b.total_price), 0);
  const distance = bookings.reduce((a, b) => a + Number(b.distance_km ?? 0), 0);
  const luxury = bookings.filter((b) => b.luxury_protocol).length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const destinations = new Set(bookings.map((b) => b.dropoff_location?.split(",").pop()?.trim()).filter(Boolean)).size;
  const tier = tierOf(profile?.loyalty_points ?? 0);

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; spend: number; trips: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString(undefined, { month: "short" });
      map.set(`${d.getFullYear()}-${d.getMonth()}`, { month: key, spend: 0, trips: 0 });
    }
    bookings.forEach((b) => {
      const d = new Date(b.created_at);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const row = map.get(k);
      if (!row) return;
      row.trips += 1;
      if (b.payment_status === "paid") row.spend += Number(b.total_price);
    });
    return [...map.values()];
  }, [bookings]);

  return (
    <PortalLayout
      title="Member Analytics"
      subtitle="Comprehensive overview of your travel footprint, lifetime spend, and engagement across all BiLUXS services."
    >
      <div className="space-y-8">
        {/* Primary Stats Grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Total Trips</span>
              </div>
              <div className="text-2xl font-display text-white mt-1">{bookings.length}</div>
              <div className="text-[11px] text-white/40 mt-1">{completed} completed journeys</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Distance Travelled</span>
              </div>
              <div className="text-2xl font-display text-white mt-1">{Math.round(distance).toLocaleString()} km</div>
              <div className="text-[11px] text-white/40 mt-1">Cumulative distance</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Lifetime Spend</span>
              </div>
              <div className="text-2xl font-display text-emerald-400 mt-1">{ngn(spend)}</div>
              <div className="text-[11px] text-white/40 mt-1">Total settled value</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card className="border-white/10 bg-[#0a0511]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Award className="h-4 w-4 text-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/50">Luxury Protocol</span>
              </div>
              <div className="text-2xl font-display text-gold mt-1">{luxury}</div>
              <div className="text-[11px] text-white/40 mt-1">Elite protocol selections</div>
            </Card>
          </motion.div>
        </div>

        {/* Secondary Activity Grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
            <Card className="border-white/10 bg-[#0a0511]/40 p-5">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-4 w-4 text-gold" />
                <span className="text-[10px] uppercase tracking-widest text-white/50">Destinations</span>
              </div>
              <div className="text-xl font-display text-white mt-1">{destinations}</div>
              <div className="text-[11px] text-white/40 mt-1">Unique drop-off cities</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.45 }}>
            <Card className="border-white/10 bg-[#0a0511]/40 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Compass className="h-4 w-4 text-gold" />
                <span className="text-[10px] uppercase tracking-widest text-white/50">Tours Booked</span>
              </div>
              <div className="text-xl font-display text-white mt-1">{counts.tours}</div>
              <div className="text-[11px] text-white/40 mt-1">Expeditions & tours</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
            <Card className="border-white/10 bg-[#0a0511]/40 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-4 w-4 text-gold" />
                <span className="text-[10px] uppercase tracking-widest text-white/50">Cargo Shipments</span>
              </div>
              <div className="text-xl font-display text-white mt-1">{counts.cargo}</div>
              <div className="text-[11px] text-white/40 mt-1">Dispatched logistics</div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.55 }}>
            <Card className="border-white/10 bg-[#0a0511]/40 p-5">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="h-4 w-4 text-gold" />
                <span className="text-[10px] uppercase tracking-widest text-white/50">Shopping Orders</span>
              </div>
              <div className="text-xl font-display text-white mt-1">{counts.shopping}</div>
              <div className="text-[11px] text-white/40 mt-1">Boutique purchases</div>
            </Card>
          </motion.div>
        </div>

        {/* Chart Section */}
        <div className="space-y-4">
          <SectionTitle>Last 6 Months Activity</SectionTitle>
          {bookings.length === 0 ? (
            <Card className="border-white/10 bg-[#0a0511]/50 p-8 text-center">
              <Empty text="Book your first journey to unlock deep account analytics." />
            </Card>
          ) : (
            <Card className="h-80 border-white/10 bg-[#0a0511]/50 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#0a0511",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "4px",
                      fontSize: 12,
                      color: "#fff",
                    }}
                    formatter={(v, n) => (n === "spend" ? ngn(Number(v)) : String(v))}
                  />
                  <Bar dataKey="spend" fill="var(--gold, #c8a15a)" name="spend" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="trips" fill="rgba(220,38,38,0.7)" name="trips" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Membership Standing Section */}
        <div className="space-y-4">
          <SectionTitle>Membership Standing</SectionTitle>
          <Card className="border-gold/30 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Current Tier Level</div>
                <div className="font-display text-2xl text-gold">{tier.current.label}</div>
              </div>
              <div className="text-right sm:text-left">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Loyalty Metrics</div>
                <div className="text-[12px] text-white/80">
                  {(profile?.loyalty_points ?? 0).toLocaleString()} points
                  {tier.next ? ` · ${tier.toNext.toLocaleString()} points to ${tier.next.label}` : " · Maximum tier reached"}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
