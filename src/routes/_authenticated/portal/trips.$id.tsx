import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";
import { PortalLayout, Card, Empty } from "@/components/portal/PortalLayout";
import { Avatar } from "@/components/portal/Avatar";
import { RideChat } from "@/components/portal/RideChat";
import { RideReview } from "@/components/portal/RideReview";
import { ngn, dt, EVENT_LABEL } from "@/lib/portal";
import { STAGES, stageOf, stageIndex, stageProgress, stageHint, stageLabel } from "@/lib/ride";
import {
  Share2,
  ShieldAlert,
  Navigation,
  MapPin,
  QrCode,
  X,
  Printer,
  ShieldCheck,
  Clock,
  Wallet,
  Car,
  MessageSquare,
  Phone,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/trips/$id")({
  head: () => ({
    meta: [
      { title: "My Ride — BiLUXS" },
      {
        name: "description",
        content:
          "Follow your BiLUXS chauffeur in real time: live location, ride status, boarding pass and chauffeur contact.",
      },
      { property: "og:title", content: "My Ride — BiLUXS" },
      {
        property: "og:description",
        content:
          "Real-time chauffeur location and ride status for your BiLUXS journey.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const ago = (iso?: string | null) => {
  if (!iso) return null;
  const secs = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  return `${Math.floor(secs / 3600)} hr ago`;
};

function trustScore(
  d: { rating?: number; verified?: boolean; years_experience?: number } | null,
) {
  if (!d) return 0;
  const base = 55;
  const verified = d.verified ? 15 : 0;
  const exp = Math.min(15, (d.years_experience ?? 0) * 1.5);
  const rate = Math.max(
    0,
    Math.min(15, ((Number(d.rating ?? 0) - 3.5) / 1.5) * 15),
  );
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
        supabase
          .from("trip_events")
          .select("*")
          .eq("booking_id", id)
          .order("created_at"),
      ]);
      setBooking(b.data);
      setEvents(e.data ?? []);
      setLoading(false);

      if (b.data?.driver_id) {
        const { data } = await supabase.rpc("get_booking_driver", {
          _booking_id: id,
        });
        setDriver(Array.isArray(data) ? data[0] ?? null : null);
      } else {
        setDriver(null);
      }
    };

    void load();

    const ch = supabase
      .channel(rtTopic("trip-" + id))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_events",
          filter: `booking_id=eq.${id}`,
        },
        () => void load(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${id}`,
        },
        () => void load(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const stage = stageOf(booking, events);
  const progress = stageProgress(stage);
  const latlng = booking?.driver_lat_lng as {
    lat?: number;
    lng?: number;
    at?: string;
  } | null;
  const lastPing = ago(latlng?.at ?? booking?.updated_at) ?? "—";
  void tick;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My BiLUXS ride", url });
        return;
      } catch {
        /* dismissed */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Ride link copied");
  };

  const sos = async () => {
    if (!user || !booking) return;
    await supabase.from("concierge_requests").insert({
      user_id: user.id,
      service: "emergency_sos",
      details: `SOS raised on ride ${booking.waybill_code}. Pickup: ${booking.pickup_location}. Drop-off: ${booking.dropoff_location}.`,
    });
    toast.error("SOS activated — the BiLUXS security team has been alerted.");
  };

  if (loading)
    return (
      <PortalLayout title="My Ride">
        <Empty text="Locating your journey details…" />
      </PortalLayout>
    );

  if (!booking)
    return (
      <PortalLayout title="Ride not found">
        <Empty text="This ride doesn't exist or isn't associated with your account." />
      </PortalLayout>
    );

  const current = stageIndex(stage);

  return (
    <PortalLayout
      title="Journey Details"
      subtitle={`${booking.pickup_location} → ${booking.dropoff_location}`}
      actions={
        <button
          onClick={share}
          aria-label="Share ride"
          className="h-10 px-4 border border-gold/30 bg-white/[0.02] text-gold text-[10px] uppercase tracking-[0.22em] inline-flex items-center gap-2 hover:bg-gold/10 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Journey Hero Status */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative overflow-hidden border-gold/40 bg-gradient-to-br from-[#0a0511] via-[var(--navy-deep)] to-gold/5">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Car className="w-48 h-48" />
            </div>

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] uppercase tracking-[0.35em] text-gold">
                      {booking.waybill_code}
                    </span>
                    <StatusPill status={booking.status} />
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl text-white">
                    {stageLabel(stage)}
                  </h2>
                  <p className="text-sm text-white/60 mt-2 max-w-xl">
                    {stageHint(stage)}
                  </p>
                </div>

                {booking.qr_token && stage !== "completed" && stage !== "cancelled" && (
                  <button
                    onClick={() => setPass(true)}
                    className="h-12 px-6 bg-crimson text-white text-[10px] uppercase tracking-[0.22em] inline-flex items-center justify-center gap-2 hover:bg-crimson/90 transition-colors shadow-[0_0_15px_rgba(220,20,60,0.3)]"
                  >
                    <QrCode className="h-4 w-4" />
                    Boarding Pass
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="h-1.5 bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-crimson to-gold"
                  />
                </div>
                <ol className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] uppercase tracking-widest">
                  {STAGES.map((s, i) => {
                    const isPast = i <= current && stage !== "cancelled";
                    const isCurrent = i === current && stage !== "cancelled";
                    return (
                      <li
                        key={s.key}
                        className={`flex items-center gap-2 transition-colors duration-500 ${
                          isCurrent
                            ? "text-gold"
                            : isPast
                              ? "text-white/80"
                              : "text-white/30"
                        }`}
                      >
                        <span
                          className={`shrink-0 flex items-center justify-center h-4 w-4 rounded-full border ${
                            isCurrent
                              ? "border-gold bg-gold/20 shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                              : isPast
                                ? "border-white/50 bg-white/20"
                                : "border-white/10 bg-transparent"
                          }`}
                        >
                          {isPast && !isCurrent && (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          )}
                          {isCurrent && (
                            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                          )}
                        </span>
                        {s.label}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Quick Details */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailItem
                  icon={<Clock className="h-4 w-4 text-gold" />}
                  label="Pickup Time"
                  value={dt(booking.pickup_time)}
                />
                <DetailItem
                  icon={<Navigation className="h-4 w-4 text-gold" />}
                  label="Distance"
                  value={`${Number(booking.distance_km).toFixed(1)} km`}
                />
                <DetailItem
                  icon={<Wallet className="h-4 w-4 text-gold" />}
                  label="Fare"
                  value={ngn(booking.total_price)}
                />
                <DetailItem
                  icon={<ShieldCheck className="h-4 w-4 text-gold" />}
                  label="Payment"
                  value={
                    <span
                      className={
                        booking.payment_status === "paid"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }
                    >
                      {booking.payment_status === "paid" ? "Paid" : "Pending"}
                    </span>
                  }
                />
              </div>
            </div>
          </Card>
        </motion.section>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Main Content Column */}
          <div className="space-y-6">
            {/* Live Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-0 overflow-hidden border-gold/20 bg-[var(--navy-deep)] flex flex-col">
                <div className="relative aspect-[16/10] sm:aspect-[21/9] bg-[#0a0511]">
                  {latlng?.lat && latlng?.lng ? (
                    <iframe
                      title="Live chauffeur position"
                      className="absolute inset-0 h-full w-full pointer-events-none"
                      style={{
                        filter:
                          "invert(90%) hue-rotate(180deg) brightness(85%) contrast(120%) sepia(10%)",
                      }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${latlng.lng - 0.015}%2C${latlng.lat - 0.01}%2C${latlng.lng + 0.015}%2C${latlng.lat + 0.01}&layer=mapnik&marker=${latlng.lat}%2C${latlng.lng}`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white/40">
                      <div className="h-16 w-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-4">
                        <Navigation className="h-8 w-8 opacity-50" />
                      </div>
                      <div className="text-sm">
                        Live tracking unavailable
                      </div>
                      <div className="text-[11px] mt-2 max-w-xs">
                        Your chauffeur's live location will appear on this map as
                        soon as they begin their journey to you.
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay for map borders */}
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(10,5,17,1)]" />
                </div>

                <div className="p-5 bg-gradient-to-b from-transparent to-[#0a0511]">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-gold shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] uppercase tracking-widest text-white/40">
                          Pickup Location
                        </div>
                        <div className="text-sm text-white/90 mt-1 truncate">
                          {booking.pickup_location}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-crimson shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] uppercase tracking-widest text-white/40">
                          Destination
                        </div>
                        <div className="text-sm text-white/90 mt-1 truncate">
                          {booking.dropoff_location}
                        </div>
                      </div>
                    </div>
                  </div>
                  {latlng?.lat && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-[10px] uppercase tracking-widest text-white/30 text-right">
                      Signal updated {lastPing}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Journey Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-6 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Journey Log
                </div>
                {events.length === 0 ? (
                  <Empty text="Your journey log will populate here once updates begin." />
                ) : (
                  <div className="pl-2">
                    <ol className="relative border-l border-gold/20">
                      {events.map((e, idx) => {
                        const isLatest = idx === events.length - 1;
                        return (
                          <li key={e.id} className="ml-6 mb-8 last:mb-0">
                            <span
                              className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                                isLatest
                                  ? "bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                                  : "bg-white/30"
                              }`}
                            />
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                              <div
                                className={`text-sm md:text-base ${
                                  isLatest ? "text-white" : "text-white/70"
                                }`}
                              >
                                {EVENT_LABEL[e.event] ??
                                  String(e.event).replace(/_/g, " ")}
                              </div>
                              <div className="text-[11px] uppercase tracking-widest text-white/40">
                                {dt(e.created_at)}
                              </div>
                            </div>
                            {e.note && (
                              <div className="mt-2 text-sm text-white/50 bg-white/[0.02] border border-white/5 p-3 rounded-sm">
                                {e.note}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-gold/20">
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-5">
                  Your Chauffeur
                </div>
                {driver ? (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar
                        value={driver.photo_url}
                        name={driver.full_name}
                        size={72}
                      />
                      <div className="min-w-0">
                        <div className="font-display text-xl truncate text-white">
                          {driver.full_name}
                        </div>
                        <div className="text-[12px] text-white/60 mt-1 truncate">
                          {driver.vehicle_model ?? "Luxury vehicle"} •{" "}
                          {driver.plate_number ?? "TBD"}
                        </div>
                        <div className="text-[12px] text-gold mt-1 flex items-center gap-1">
                          ★ {Number(driver.rating).toFixed(1)} rating
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-end justify-between mb-2">
                        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          Trust Score
                        </span>
                        <span className="text-emerald-400 font-display text-xl leading-none">
                          {trustScore(driver)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${trustScore(driver)}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-emerald-400"
                        />
                      </div>
                      <div className="text-[10px] text-white/40 mt-3 leading-relaxed">
                        Score based on verification, {driver.years_experience} yrs
                        experience, and exceptional completed journeys.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <a
                        href={`tel:${driver.phone}`}
                        className="h-11 grid place-items-center border border-gold/30 hover:bg-gold/10 text-gold text-[10px] uppercase tracking-widest transition-colors gap-2"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${(
                          driver.whatsapp ??
                          driver.phone ??
                          ""
                        ).replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-11 grid place-items-center bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest transition-colors gap-2"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </div>
                  </>
                ) : (
                  <Empty text="We are carefully selecting your chauffeur. You'll be notified immediately upon assignment." />
                )}

                <button
                  onClick={sos}
                  className="w-full mt-4 h-12 bg-crimson/10 border border-crimson/30 text-crimson hover:bg-crimson hover:text-white text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <ShieldAlert className="h-4 w-4" /> Emergency SOS
                </button>
              </Card>
            </motion.div>

            {driver && stage !== "completed" && stage !== "cancelled" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-gold/20">
                  <RideChat bookingId={booking.id} driverName={driver.full_name} />
                </Card>
              </motion.div>
            )}

            {driver && stage === "completed" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-gold/40 bg-gradient-to-br from-[#0a0511] to-gold/5">
                  <RideReview
                    bookingId={booking.id}
                    driverId={driver.id}
                    driverName={driver.full_name}
                  />
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Boarding Pass Modal */}
        <AnimatePresence>
          {pass && booking.qr_token && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md grid place-items-center p-4"
              onClick={() => setPass(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-[var(--navy-deep)] border border-gold/40 shadow-2xl overflow-hidden print:bg-white print:border-black"
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02] print:bg-transparent">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gold print:text-black">
                    Boarding Pass
                  </span>
                  <button
                    onClick={() => setPass(false)}
                    aria-label="Close"
                    className="text-white/50 hover:text-white transition-colors print:hidden"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8 text-center bg-gradient-to-b from-transparent to-black/20 print:bg-none">
                  <div className="bg-white p-5 w-fit mx-auto rounded-sm shadow-inner">
                    <QRCode value={booking.qr_token} size={220} />
                  </div>

                  <div className="font-display text-2xl tracking-widest text-white mt-6 print:text-black">
                    {booking.waybill_code}
                  </div>

                  <div className="text-[12px] text-white/60 mt-3 flex items-center justify-center gap-2 print:text-gray-700">
                    <span className="truncate max-w-[120px]">
                      {booking.pickup_location.split(",")[0]}
                    </span>
                    <ArrowRightIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {booking.dropoff_location.split(",")[0]}
                    </span>
                  </div>

                  <div className="text-[11px] uppercase tracking-widest text-white/40 mt-3 print:text-gray-500">
                    {dt(booking.pickup_time)}
                  </div>

                  <div
                    className={`mt-6 py-3 border-y border-white/10 text-[11px] uppercase tracking-[0.2em] font-medium ${
                      booking.qr_status === "used"
                        ? "text-emerald-400"
                        : "text-gold"
                    }`}
                  >
                    {booking.qr_status === "used"
                      ? "✓ Verified & Checked In"
                      : "Present to your chauffeur"}
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="mt-6 w-full h-12 border border-white/20 hover:border-white/50 hover:bg-white/5 text-white text-[10px] uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-all print:hidden"
                  >
                    <Printer className="h-4 w-4" /> Print Pass
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalLayout>
  );
}

// Sub-components

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-[9px] uppercase tracking-[0.25em] text-white/40">
          {label}
        </div>
        <div className="text-[13px] text-white/90 mt-1">{value}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    confirmed: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    in_progress: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    completed: "bg-white/5 text-white/50 border-white/10",
    cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
  };

  return (
    <span
      className={`px-2.5 py-1 border text-[9px] uppercase tracking-widest ${
        map[status] ?? "bg-white/5 text-white/60 border-white/10"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ArrowRightIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
