import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { Avatar } from "@/components/portal/Avatar";
import { RideChat } from "@/components/portal/RideChat";
import { RideReview } from "@/components/portal/RideReview";
import { ngn, dt, EVENT_LABEL } from "@/lib/portal";
import { STAGES, stageOf, stageIndex, stageProgress, stageHint, stageLabel } from "@/lib/ride";
import { Share2, ShieldAlert, Navigation, MapPin, QrCode, X, Printer, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/trips/$id")({
  head: () => ({
    meta: [
      { title: "My Ride — BiLUXS" },
      { name: "description", content: "Follow your BiLUXS chauffeur in real time: live location, ride status, boarding pass and chauffeur contact." },
      { property: "og:title", content: "My Ride — BiLUXS" },
      { property: "og:description", content: "Real-time chauffeur location and ride status for your BiLUXS journey." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const ago = (iso?: string | null) => {
  if (!iso) return null;
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  return `${Math.floor(secs / 3600)} hr ago`;
};

function trustScore(d: { rating?: number; verified?: boolean; years_experience?: number } | null) {
  if (!d) return 0;
  const base = 55;
  const verified = d.verified ? 15 : 0;
  const exp = Math.min(15, (d.years_experience ?? 0) * 1.5);
  const rate = Math.max(0, Math.min(15, ((Number(d.rating ?? 0) - 3.5) / 1.5) * 15));
  return Math.round(Math.min(100, base + verified + exp + rate));
}

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [b, e] = await Promise.all([
        supabase.from("bookings").select("*").eq("id", id).maybeSingle(),
        supabase.from("trip_events").select("*").eq("booking_id", id).order("created_at"),
      ]);
      setBooking(b.data);
      setEvents(e.data ?? []);
      setLoading(false);
      if (b.data?.driver_id) {
        const { data } = await supabase.rpc("get_booking_driver", { _booking_id: id });
        setDriver(Array.isArray(data) ? data[0] ?? null : null);
      } else {
        setDriver(null);
      }
    };
    void load();
    const ch = supabase.channel(rtTopic("trip-" + id))
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_events", filter: `booking_id=eq.${id}` }, () => void load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const stage = stageOf(booking, events);
  const progress = stageProgress(stage);
  const latlng = booking?.driver_lat_lng as { lat?: number; lng?: number; at?: string } | null;
  const lastPing = ago(latlng?.at ?? booking?.updated_at) ?? "—";
  void tick;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: "My BiLUXS ride", url }); return; } catch { /* dismissed */ } }
    await navigator.clipboard.writeText(url);
    toast.success("Ride link copied");
  };

  const sos = async () => {
    if (!user || !booking) return;
    await supabase.from("concierge_requests").insert({
      user_id: user.id, service: "emergency_sos",
      details: `SOS raised on ride ${booking.waybill_code}. Pickup: ${booking.pickup_location}. Drop-off: ${booking.dropoff_location}.`,
    });
    toast.error("SOS sent — the BiLUXS team has been alerted.");
  };

  if (loading) return <PortalLayout title="My Ride"><Empty text="Loading your ride…" /></PortalLayout>;
  if (!booking) return <PortalLayout title="Ride not found"><Empty text="This ride doesn't exist or isn't yours." /></PortalLayout>;

  const current = stageIndex(stage);

  return (
    <PortalLayout
      title={`${booking.pickup_location} → ${booking.dropoff_location}`}
      actions={
        <button onClick={share} aria-label="Share ride"
          className="h-10 px-3 border border-border hover:border-gold text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
          <Share2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Share</span>
        </button>
      }
    >
      {/* What's happening */}
      <Card className="border-gold/40">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{booking.waybill_code}</div>
        <div className="font-display text-2xl md:text-3xl mt-2">{stageLabel(stage)}</div>
        <p className="text-sm text-muted-foreground mt-1">{stageHint(stage)}</p>

        <div className="h-1.5 bg-white/10 mt-5">
          <div className="h-full bg-gradient-to-r from-crimson to-gold transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-y-2 text-[11px]">
          {STAGES.map((s, i) => (
            <li key={s.key} className={i <= current && stage !== "cancelled" ? "text-gold" : "text-muted-foreground"}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full mr-2 align-middle ${i <= current && stage !== "cancelled" ? "bg-gold" : "bg-white/20"}`} />
              {s.label}
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-2">Pickup</span>{dt(booking.pickup_time)}</span>
          <span><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-2">Distance</span>{Number(booking.distance_km)} km</span>
          <span><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-2">Fare</span>{ngn(booking.total_price)}</span>
          <span className={booking.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}>
            <span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-2">Payment</span>
            {booking.payment_status === "paid" ? "Paid" : "Awaiting payment"}
          </span>
        </div>

        {booking.qr_token && stage !== "completed" && stage !== "cancelled" && (
          <button onClick={() => setPass(true)}
            className="mt-5 w-full sm:w-auto h-12 px-6 bg-crimson text-white text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
            <QrCode className="h-4 w-4" /> Show boarding pass
          </button>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* Live map */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="relative aspect-[16/11] sm:aspect-[16/9] bg-[var(--navy-deep)]">
            {latlng?.lat && latlng?.lng ? (
              <iframe
                title="Live chauffeur position"
                className="absolute inset-0 h-full w-full grayscale-[35%]"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${latlng.lng - 0.02}%2C${latlng.lat - 0.015}%2C${latlng.lng + 0.02}%2C${latlng.lat + 0.015}&layer=mapnik&marker=${latlng.lat}%2C${latlng.lng}`}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center text-xs text-muted-foreground p-6">
                <div>
                  <Navigation className="h-7 w-7 mx-auto mb-3 opacity-40" />
                  Your chauffeur's live location appears here as soon as they set off.
                </div>
              </div>
            )}
          </div>
          <div className="p-4 sm:p-5 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex gap-3"><MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" /><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pickup</div>{booking.pickup_location}</div></div>
            <div className="flex gap-3"><MapPin className="h-4 w-4 text-crimson shrink-0 mt-0.5" /><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Destination</div>{booking.dropoff_location}</div></div>
            {latlng?.lat && <div className="sm:col-span-2 text-[11px] text-muted-foreground">Location updated {lastPing}</div>}
          </div>
        </Card>

        {/* Chauffeur */}
        <div className="space-y-4">
          <Card>
            <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Your chauffeur</div>
            {driver ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar value={driver.photo_url} name={driver.full_name} size={64} />
                  <div className="min-w-0">
                    <div className="font-display text-lg truncate">{driver.full_name}</div>
                    <div className="text-[11px] text-muted-foreground">{driver.vehicle_model ?? "Luxury vehicle"} · {driver.plate_number ?? "—"}</div>
                    <div className="text-[11px] text-gold">★ {Number(driver.rating).toFixed(1)} rider rating</div>
                  </div>
                </div>

                <div className="mt-4 border border-border p-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> BiLUXS trust score
                    </span>
                    <span className="text-emerald-400 font-display text-base">{trustScore(driver)}%</span>
                  </div>
                  <div className="h-1 bg-white/10 mt-2">
                    <div className="h-full bg-emerald-400" style={{ width: `${trustScore(driver)}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2">
                    Based on verification, {driver.years_experience} yrs experience and completed BiLUXS rides.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a href={`tel:${driver.phone}`} className="h-11 grid place-items-center border border-border hover:border-gold text-[10px] uppercase tracking-widest">Call</a>
                  <a href={`https://wa.me/${(driver.whatsapp ?? driver.phone ?? "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="h-11 grid place-items-center border border-emerald-500/60 text-emerald-400 text-[10px] uppercase tracking-widest">WhatsApp</a>
                </div>
              </>
            ) : (
              <Empty text="No chauffeur assigned yet — we'll notify you the moment one is." />
            )}
            <button onClick={sos} className="w-full mt-3 h-12 bg-crimson text-white text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Emergency SOS
            </button>
          </Card>

          {driver && stage !== "completed" && stage !== "cancelled" && (
            <Card><RideChat bookingId={booking.id} driverName={driver.full_name} /></Card>
          )}

          {driver && stage === "completed" && (
            <Card><RideReview bookingId={booking.id} driverId={driver.id} driverName={driver.full_name} /></Card>
          )}
        </div>
      </div>

      <Card className="mt-4">
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Ride history</div>
        {events.length === 0 ? <Empty text="Nothing has happened yet." /> : (
          <ol className="relative border-l border-border ml-2">
            {events.map((e) => (
              <li key={e.id} className="ml-5 pb-5 last:pb-0">
                <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                <div className="text-sm">{EVENT_LABEL[e.event] ?? String(e.event).replace("_", " ")}</div>
                <div className="text-[11px] text-muted-foreground">{dt(e.created_at)}{e.note ? ` · ${e.note}` : ""}</div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Boarding pass */}
      {pass && booking.qr_token && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm grid place-items-center p-4" onClick={() => setPass(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[var(--navy-deep)] border border-gold/50 print:bg-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold">Boarding pass</span>
              <button onClick={() => setPass(false)} aria-label="Close boarding pass"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 text-center">
              <div className="bg-white p-4 w-fit mx-auto">
                <QRCode value={booking.qr_token} size={200} />
              </div>
              <div className="font-display text-xl mt-4">{booking.waybill_code}</div>
              <div className="text-[12px] text-muted-foreground mt-1">{booking.pickup_location} → {booking.dropoff_location}</div>
              <div className="text-[12px] text-muted-foreground">{dt(booking.pickup_time)}</div>
              <div className={`mt-4 text-[11px] uppercase tracking-widest ${booking.qr_status === "used" ? "text-emerald-400" : "text-gold"}`}>
                {booking.qr_status === "used" ? "Verified — you're checked in" : "Show this to your chauffeur to board"}
              </div>
              <button onClick={() => window.print()}
                className="mt-5 h-11 px-5 border border-border hover:border-gold text-[10px] uppercase tracking-widest inline-flex items-center gap-2">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
