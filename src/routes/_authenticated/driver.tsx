import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Radar, MapPin, ScanLine, Power, CheckCircle2, XCircle, Navigation, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/biluxs/PageShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/driver")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Driver Operations — BiLUXS" }] }),
  component: Page,
});

type Booking = {
  id: string; waybill_code: string; pickup_location: string; dropoff_location: string;
  status: string; qr_status: string; driver_id: string | null;
};

function Page() {
  const { user, isDriver, isAdmin } = useAuth();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [trips, setTrips] = useState<Booking[]>([]);
  const [scanning, setScanning] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [lastScan, setLastScan] = useState<{ ok: boolean; msg: string } | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("drivers").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setDriverId(data?.id ?? null));
  }, [user]);

  useEffect(() => {
    if (!driverId) return;
    const load = () => supabase.from("bookings").select("*").eq("driver_id", driverId)
      .in("status", ["confirmed", "in_progress"]).order("pickup_time")
      .then(({ data }) => setTrips((data as Booking[]) || []));
    load();
    const ch = supabase.channel("driver-trips")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `driver_id=eq.${driverId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [driverId]);

  // Cleanup scanner + geolocation on unmount
  useEffect(() => () => {
    scannerRef.current?.stop().catch(() => {});
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setLastScan(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = { stop: () => scanner.stop(), clear: () => scanner.clear() };
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await handleScan(decoded);
          await scanner.stop().catch(() => {});
          scanner.clear();
          scannerRef.current = null;
          setScanning(false);
        },
        () => {}
      );
    } catch (e) {
      toast.error("Camera access denied or unavailable.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    await scannerRef.current?.stop().catch(() => {});
    scannerRef.current?.clear();
    scannerRef.current = null;
    setScanning(false);
  };

  const handleScan = async (token: string) => {
    const trimmed = token.trim();
    const { data, error } = await supabase.rpc("scan_booking_qr" as never, { _qr_token: trimmed } as never);
    if (error) { setLastScan({ ok: false, msg: error.message }); toast.error(error.message); return; }
    const res = data as { ok: boolean; error?: string; waybill?: string };
    if (!res.ok) {
      const map: Record<string, string> = {
        not_found: "QR not recognised", already_used: "QR already used",
        not_paid: "Booking unpaid", unauthorized: "Not authorized to scan",
      };
      const msg = map[res.error ?? ""] ?? res.error ?? "Scan failed";
      setLastScan({ ok: false, msg });
      toast.error(msg);
    } else {
      setLastScan({ ok: true, msg: `Verified · ${res.waybill}` });
      toast.success(`Passenger verified · ${res.waybill}`);
    }
  };

  const toggleTracking = () => {
    if (tracking) {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setTracking(false);
      return;
    }
    if (!navigator.geolocation) { toast.error("Geolocation unsupported."); return; }
    const activeTrip = trips.find((t) => t.status === "in_progress");
    if (!activeTrip) { toast.error("No active in-transit trip to broadcast."); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        await supabase.from("bookings").update({ driver_lat_lng: c } as never).eq("id", activeTrip.id);
        await supabase.from("tracking_logs").insert({
          booking_id: activeTrip.id, latitude: c.lat, longitude: c.lng,
        } as never);
      },
      () => toast.error("Location permission denied."),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    setTracking(true);
  };

  if (!user) return null;
  if (!isDriver && !isAdmin) {
    return <PageShell><div className="py-24 text-center text-muted-foreground text-sm">Driver access only.</div></PageShell>;
  }

  return (
    <PageShell>
      <div className="min-h-screen bg-[var(--navy-deep)] py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-gold">
              <Radar className="h-3 w-3 animate-pulse" /> Driver Ops · Mobile Deck
            </div>
            <h1 className="font-display text-3xl mt-2 tracking-widest">Handshake</h1>
          </div>

          <div className="bg-black border border-gold/40 p-4">
            <div className="relative aspect-square bg-black grid place-items-center overflow-hidden">
              <div id="qr-reader" className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
              {!scanning && (
                <div className="text-center z-10">
                  <ScanLine className="h-16 w-16 mx-auto text-gold opacity-40" />
                  <div className="mt-3 text-xs text-muted-foreground">Camera idle</div>
                </div>
              )}
              {scanning && (
                <>
                  <div className="pointer-events-none absolute inset-8 border-2 border-gold" />
                  <motion.div
                    className="pointer-events-none absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                    animate={{ top: ["12%", "88%", "12%"] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {!scanning ? (
                <button onClick={startScanner}
                  className="col-span-2 h-12 bg-gold text-[var(--navy-deep)] text-xs uppercase tracking-widest font-semibold inline-flex items-center justify-center gap-2">
                  <ScanLine className="h-4 w-4" /> Start Scanner
                </button>
              ) : (
                <button onClick={stopScanner}
                  className="col-span-2 h-12 bg-crimson text-white text-xs uppercase tracking-widest font-semibold inline-flex items-center justify-center gap-2">
                  <Power className="h-4 w-4" /> Stop Scanner
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {lastScan && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mt-4 p-4 border flex items-center gap-3 ${lastScan.ok ? "border-emerald-400 bg-emerald-500/10 text-emerald-300" : "border-red-400 bg-red-500/10 text-red-300"}`}>
                {lastScan.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <div className="text-sm">{lastScan.msg}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 bg-card border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gold flex items-center gap-1"><Navigation className="h-3 w-3" /> Live GPS Broadcast</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Idle"}
                </div>
              </div>
              <button onClick={toggleTracking}
                className={`h-10 px-4 text-[10px] uppercase tracking-widest inline-flex items-center gap-2 ${tracking ? "bg-emerald-500 text-white" : "border border-border hover:border-gold"}`}>
                {tracking ? <>ON <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" /></> : "Start"}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Assigned Trips</div>
            {!trips.length && <div className="text-xs text-muted-foreground p-6 border border-dashed border-border text-center">No active assignments.</div>}
            <div className="space-y-2">
              {trips.map((t) => (
                <div key={t.id} className="p-4 bg-card border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-display tracking-widest text-lg">{t.waybill_code}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3 text-gold" /> {t.pickup_location}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3 text-crimson" /> {t.dropoff_location}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] uppercase tracking-widest px-2 py-1 ${t.status === "in_progress" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"}`}>{t.status.replace("_", " ")}</div>
                      {t.qr_status === "used" && <div className="mt-1 text-[10px] text-gold inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
