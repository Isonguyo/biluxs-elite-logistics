import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Stat, SectionTitle, Empty } from "@/components/portal/PortalLayout";
import { ngn, useProfile, tierOf } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/portal/analytics")({
  head: () => ({ meta: [
    { title: "My Analytics — BiLUXS Member Portal" },
    { name: "description", content: "Total trips, distance travelled and lifetime spend across BiLUXS services." },
    { property: "og:title", content: "My Analytics — BiLUXS" },
    { property: "og:description", content: "Your travel footprint across chauffeur, cargo, tours and shopping." },
  ] }),
  component: Page,
});

type B = { id: string; total_price: number; distance_km: number; luxury_protocol: boolean; payment_status: string; status: string; created_at: string; dropoff_location: string };

function Page() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [bookings, setBookings] = useState<B[]>([]);
  const [counts, setCounts] = useState({ tours: 0, cargo: 0, shopping: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("bookings").select("id,total_price,distance_km,luxury_protocol,payment_status,status,created_at,dropoff_location")
      .eq("user_id", user.id).then(({ data }) => setBookings((data as B[]) ?? []));
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
    <PortalLayout title="My Analytics" subtitle="Your travel footprint across every BiLUXS service.">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Total trips" value={bookings.length.toString()} hint={`${completed} completed`} />
        <Stat label="Distance travelled" value={`${Math.round(distance).toLocaleString()} km`} />
        <Stat label="Lifetime spend" value={ngn(spend)} accent="text-emerald-400" />
        <Stat label="Luxury protocol trips" value={luxury.toString()} accent="text-gold" />
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <Stat label="Destinations" value={destinations.toString()} hint="Unique drop-off cities" />
        <Stat label="Tours booked" value={counts.tours.toString()} />
        <Stat label="Cargo shipments" value={counts.cargo.toString()} />
        <Stat label="Shopping orders" value={counts.shopping.toString()} />
      </div>

      <SectionTitle>Last 6 months</SectionTitle>
      {bookings.length === 0 ? <Empty text="Book your first journey to unlock analytics." /> : (
        <Card className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12 }}
                formatter={(v: number, n: string) => (n === "spend" ? ngn(v) : v)}
              />
              <Bar dataKey="spend" fill="var(--gold, #c8a15a)" name="spend" />
              <Bar dataKey="trips" fill="rgba(220,38,38,0.7)" name="trips" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <SectionTitle>Membership standing</SectionTitle>
      <Card>
        <div className="font-display text-2xl text-gold">{tier.current.label}</div>
        <div className="text-[12px] text-muted-foreground mt-1">
          {(profile?.loyalty_points ?? 0).toLocaleString()} points
          {tier.next ? ` · ${tier.toNext.toLocaleString()} to ${tier.next.label}` : " · highest tier"}
        </div>
      </Card>
    </PortalLayout>
  );
}
