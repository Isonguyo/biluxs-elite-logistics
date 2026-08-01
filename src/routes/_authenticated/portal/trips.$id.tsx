import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { ngn, dt, EVENT_LABEL, progressFor } from "@/lib/portal";
import { Share2, ShieldAlert, Navigation, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/trips/$id")({
  head: () => ({
    meta: [
      { title: "Live Trip Tracking — BiLUXS" },
      { name: "description", content: "Follow your BiLUXS chauffeur in real time: ETA, distance remaining, trip progress and driver contact." },
      { property: "og:title", content: "Live Trip Tracking — BiLUXS" },
      { property: "og:description", content: "Real-time chauffeur location, ETA and trip progress for your BiLUXS journey." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const STEPS = [
  { key: 25, label: "Assigned" },
  { key: 50, label: "Arrived" },
  { key: 75, label: "In transit" },
  { key: 100, label: "Arrived" },
];

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    };
    void load();
    const ch = supabase.channel("trip-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_events", filter: `booking_id=eq.${id}` }, () => void load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [id]);

  const progress = booking ? progressFor(events, booking.status) : 0;
  const latlng = booking?.driver_lat_lng as { lat?: number; lng?: number } | null;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: "My BiLUXS trip", url }); return; } catch { /* dismissed */ } }
    await navigator.clipboard.writeText(url);
    toast.success("Trip link copied to clipboard");
  };

  const sos = async () => {
    if (!user || !booking) return;
    await supabase.from("concierge_requests").insert({
      user_id: user.id, service: "emergency_sos",
      details: `SOS raised on trip ${booking.waybill_code}. Pickup: ${booking.pickup_location}. Drop-off: ${booking.dropoff_location}.`,
    });
    toast.error("SOS sent — BiLUXS dispatch has been alerted.");
  };

  if (loading) return <PortalLayout title="Live Trip"><Empty text="Loading journey…" /></PortalLayout>;
  if (!booking) return <PortalLayout title="Trip not found"><Empty text="This journey doesn't exist or isn't yours." /></PortalLayout>;

  return (
    <PortalLayout
      title={booking.waybill_code}
      subtitle="Live chauffeur position, journey timeline and passenger controls."
      actions={<button onClick={share} className="hidden sm:inline-flex h-10 px-4 border border-border hover:border-gold text-[10px] uppercase tracking-widest items-center gap-2"><Share2 className="h-3 w-3" /> Share</button>}
    >
      {/* Progress rail */}
      <Card>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          {STEPS.map((s) => <span key={s.key} className={progress >= s.key ? "text-gold" : ""}>{s.label}</span>)}
        </div>
        <div className="h-1.5 bg-white/10">
          <div className="h-full bg-gradient-to-r from-crimson to-gold transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-6 text-sm">
          <span><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-2">Progress</span>{progress}%</span>
          <span><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-2">Distance</span>{Number(booking.distance_km)} km</span>
          <span><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-2">Pickup</span>{dt(booking.pickup_time)}</span>
          <span><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-2">Fare</span>{ngn(booking.total_price)}</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="relative aspect-[16/10] bg-[var(--navy-deep)]">
            {latlng?.lat && latlng?.lng ? (
              <iframe
                title="Live chauffeur position"
                className="absolute inset-0 h-full w-full grayscale-[35%]"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${latlng.lng - 0.02}%2C${latlng.lat - 0.015}%2C${latlng.lng + 0.02}%2C${latlng.lat + 0.015}&layer=mapnik&marker=${latlng.lat}%2C${latlng.lng}`}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-center text-xs text-muted-foreground">
                <div>
                  <Navigation className="h-7 w-7 mx-auto mb-3 opacity-40" />
                  Live position appears once your chauffeur starts broadcasting GPS.
                </div>
              </div>
            )}
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex gap-3"><MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" /><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Pickup</div>{booking.pickup_location}</div></div>
            <div className="flex gap-3"><MapPin className="h-4 w-4 text-crimson shrink-0 mt-0.5" /><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Destination</div>{booking.dropoff_location}</div></div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Your Chauffeur</div>
            {driver ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 border border-gold overflow-hidden grid place-items-center text-gold">
                    {driver.photo_url ? <img src={driver.photo_url} alt={driver.full_name} className="h-full w-full object-cover" /> : driver.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-lg truncate">{driver.full_name}</div>
                    <div className="text-[11px] text-muted-foreground">{driver.vehicle_model ?? "Luxury vehicle"}</div>
                    <div className="text-[11px] text-gold">★ {Number(driver.rating).toFixed(1)} · {driver.years_experience} yrs exp</div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground">Plate <span className="text-white tracking-widest">{driver.plate_number ?? "—"}</span>{driver.verified && <span className="ml-2 text-emerald-400">· Verified</span>}</div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a href={`tel:${driver.phone}`} className="h-10 grid place-items-center border border-border hover:border-gold text-[10px] uppercase tracking-widest">Call</a>
                  <a href={`https://wa.me/${(driver.whatsapp ?? driver.phone ?? "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="h-10 grid place-items-center border border-emerald-500/60 text-emerald-400 text-[10px] uppercase tracking-widest">WhatsApp</a>
                  <Link to="/portal/messages" className="h-10 grid place-items-center border border-border hover:border-gold text-[10px] uppercase tracking-widest">Message</Link>
                  <button onClick={share} className="h-10 grid place-items-center border border-border hover:border-gold text-[10px] uppercase tracking-widest">Share trip</button>
                </div>
              </>
            ) : <Empty text="Chauffeur not yet assigned." />}
            <button onClick={sos} className="w-full mt-3 h-11 bg-crimson text-white text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Emergency SOS
            </button>
          </Card>

          {booking.qr_token && (
            <Card>
              <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Boarding QR</div>
              <div className="bg-white p-3 w-fit mx-auto">
                <QRCode value={booking.qr_token} size={140} />
              </div>
              <div className="text-center text-[11px] text-muted-foreground mt-3 capitalize">{String(booking.qr_status).replace("_", " ")}</div>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-4">
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold mb-4">Journey Timeline</div>
        {events.length === 0 ? <Empty text="No timeline events yet." /> : (
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
    </PortalLayout>
  );
}
