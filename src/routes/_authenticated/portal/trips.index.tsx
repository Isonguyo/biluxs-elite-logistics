import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { ngn, dt } from "@/lib/portal";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/trips/")({
  head: () => ({
    meta: [
      { title: "My Trips — BiLUXS Member Portal" },
      { name: "description", content: "Every BiLUXS journey you've booked: upcoming, in progress, completed and cancelled." },
      { property: "og:title", content: "My Trips — BiLUXS" },
      { property: "og:description", content: "Track upcoming and past chauffeur journeys in your BiLUXS member portal." },
    ],
  }),
  component: Page,
});

const FILTERS = ["all", "upcoming", "in_progress", "completed", "cancelled"];

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("bookings").select("*").eq("user_id", user.id)
        .order("pickup_time", { ascending: false });
      setRows(data ?? []);
    };
    void load();
    const ch = supabase.channel(rtTopic("trips-" + user.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  const now = Date.now();
  const list = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return new Date(r.pickup_time).getTime() >= now && !["completed", "cancelled"].includes(r.status);
    return r.status === filter;
  });

  return (
    <PortalLayout title="My Trips" subtitle="Your full journey history with live status, fares and verification.">
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 h-9 text-[10px] uppercase tracking-widest border transition-colors ${
              filter === f ? "bg-crimson text-white border-crimson" : "border-border hover:border-gold"}`}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty text="No trips in this view yet." />
      ) : (
        <div className="grid gap-3">
          {list.map((b) => (
            <Card key={b.id} className="hover:border-gold/60 transition-colors">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{b.waybill_code}</div>
                  <div className="font-display text-lg mt-1 truncate">{b.pickup_location} → {b.dropoff_location}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{dt(b.pickup_time)} · {Number(b.distance_km)} km{b.luxury_protocol ? " · Luxury Protocol" : ""}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl">{ngn(b.total_price)}</div>
                  <div className={`text-[10px] uppercase tracking-widest ${b.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>{b.payment_status}</div>
                </div>
                <div className={`px-3 py-1 text-[10px] uppercase tracking-widest capitalize ${
                  b.status === "completed" ? "bg-emerald-500/15 text-emerald-300"
                  : b.status === "cancelled" ? "bg-red-500/15 text-red-300"
                  : b.status === "in_progress" ? "bg-amber-500/15 text-amber-300"
                  : "bg-white/10 text-white/70"}`}>{String(b.status).replace("_", " ")}</div>
                <Link to="/portal/trips/$id" params={{ id: b.id }}
                  className="px-4 h-10 border border-border hover:border-gold inline-flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  Open <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
