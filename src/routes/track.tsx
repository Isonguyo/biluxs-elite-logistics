import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MapPin, Clock, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHero } from "@/components/biluxs/PageShell";
import { toast } from "sonner";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Waybill — BiLUXS Live GPS Logistics" },
      { name: "description", content: "Track your BiLUXS waybill in real time. Enter your code to view live status and GPS updates." },
    ],
    links: [{ rel: "canonical", href: "/track" }],
  }),
  component: Page,
});

type Booking = { id: string; waybill_code: string; pickup_location: string; dropoff_location: string; status: string; created_at: string; pickup_time: string | null; total_price: number };
type Log = { id: string; latitude: number; longitude: number; note: string | null; recorded_at: string };

function Page() {
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from("bookings")
      .select("*").eq("waybill_code", code.trim().toUpperCase()).maybeSingle();
    setLoading(false);
    if (error || !data) { toast.error("Waybill not found or access denied."); setBooking(null); return; }
    setBooking(data as Booking);
    const { data: l } = await supabase.from("tracking_logs")
      .select("*").eq("booking_id", data.id).order("recorded_at", { ascending: false });
    setLogs((l as Log[]) || []);
  };

  useEffect(() => {
    if (!booking) return;
    const ch = supabase.channel(`track-${booking.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tracking_logs", filter: `booking_id=eq.${booking.id}` },
        () => {
          supabase.from("tracking_logs").select("*").eq("booking_id", booking.id)
            .order("recorded_at", { ascending: false }).then(({ data }) => setLogs((data as Log[]) || []));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [booking]);

  return (
    <PageShell>
      <PageHero eyebrow="Live Tracking" title={<>Track Your <span className="gradient-text">Waybill</span></>} />
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <form onSubmit={search} className="flex bg-card border border-border focus-within:border-gold transition-colors">
            <div className="grid place-items-center pl-4 text-gold"><Search className="h-5 w-5" /></div>
            <input value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="Enter waybill (e.g. BLX-A1B2C3)"
              className="flex-1 bg-transparent h-14 px-3 text-sm focus:outline-none placeholder:text-muted-foreground uppercase" />
            <button disabled={loading} className="px-6 text-xs uppercase tracking-widest bg-crimson text-white press-effect">
              {loading ? "…" : "Track"}
            </button>
          </form>

          {booking && (
            <div className="mt-10 bg-card border border-border p-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Waybill</div>
                  <div className="font-display text-3xl tracking-widest mt-1">{booking.waybill_code}</div>
                </div>
                <div className={`px-3 h-8 inline-flex items-center text-[10px] uppercase tracking-widest ${
                  booking.status === "completed" ? "bg-emerald-500/20 text-emerald-300"
                  : booking.status === "cancelled" ? "bg-red-500/20 text-red-300"
                  : "bg-amber-500/20 text-amber-300"}`}>{booking.status}</div>
              </div>
              <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                <div><div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Pickup</div><div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-gold mt-0.5" />{booking.pickup_location}</div></div>
                <div><div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Dropoff</div><div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-crimson mt-0.5" />{booking.dropoff_location}</div></div>
              </div>

              <div className="mt-8">
                <div className="text-xs uppercase tracking-widest text-gold mb-3 flex items-center gap-2"><Truck className="h-4 w-4" /> Live GPS Log</div>
                {!logs.length && <div className="text-sm text-muted-foreground p-4 border border-dashed border-border">Awaiting first GPS ping…</div>}
                <div className="space-y-2">
                  {logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-xs p-3 bg-[var(--navy-deep)] border border-border">
                      <div className="flex items-center gap-3"><Clock className="h-3 w-3 text-gold" />{new Date(l.recorded_at).toLocaleString()}</div>
                      <div className="text-muted-foreground">{Number(l.latitude).toFixed(4)}, {Number(l.longitude).toFixed(4)}</div>
                      {l.note && <div className="hidden md:block text-white/70">{l.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
