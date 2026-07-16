import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Radar, MapPin, ScanLine, Power, CheckCircle2, XCircle, Navigation, ShieldCheck, Phone, User, Camera } from "lucide-react";
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

type PassengerInfo = {
  waybill: string;
  passenger_name: string;
  passenger_phone: string | null;
  pickup: string;
  dropoff: string;
  pickup_time: string | null;
  total: number;
  luxury: boolean;
};

function Page() {
  const { user, isDriver, isAdmin } = useAuth();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [trips, setTrips] = useState<Booking[]>([]);
  const [scanning, setScanning] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [lastScan, setLastScan] = useState<{ ok: boolean; msg: string } | null>(null);
  const [passenger, setPassenger] = useState<PassengerInfo | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
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

  useEffect(() => () => {
    stopScannerSafe();
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const stopScannerSafe = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try { await s.stop(); } catch {}
    try { s.clear(); } catch {}
    scannerRef.current = null;
  };

  const startScanner = async () => {
    setCameraError(null);
    setLastScan(null);
    setPassenger(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported in this browser.");
      return;
    }
    setScanning(true);
    try {
      const mod = await import("html5-qrcode");
      const { Html5Qrcode } = mod;

      // Pre-flight camera permission — surfaces the OS/browser prompt clearly.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        stream.getTracks().forEach((t) => t.stop());
      } catch (permErr: any) {
        setCameraError(
          permErr?.name === "NotAllowedError"
            ? "Camera permission denied. Enable it in browser settings and try again."
            : "Could not access camera."
        );
        setScanning(false);
        return;
      }

      // Small delay so the #qr-reader element is committed to the DOM.
      await new Promise((r) => setTimeout(r, 50));
      const scanner = new Html5Qrcode("qr-reader", { verbose: false } as any);
      scannerRef.current = scanner;

      const config = { fps: 12, qrbox: { width: 260, height: 260 }, aspectRatio: 1 };
      await scanner.start(
        { facingMode: { exact: "environment" } as any },
        config as any,
        async (decoded) => {
          await handleScan(decoded);
          await stopScannerSafe();
          setScanning(false);
        },
        () => {}
      ).catch(async () => {
        // Fallback for devices where "exact" environment fails (desktop / single camera phones)
        await scanner.start(
          { facingMode: "environment" } as any,
          config as any,
          async (decoded) => {
            await handleScan(decoded);
            await stopScannerSafe();
            setScanning(false);
          },
          () => {}
        );
      });
    } catch (e: any) {
      setCameraError(e?.message || "Could not start camera.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    await stopScannerSafe();
    setScanning(false);
  };

  const handleScan = async (token: string) => {
    const trimmed = token.trim();
    // Accept either raw uuid or full url with qr_token param
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const qrToken = uuidMatch ? uuidMatch[0] : trimmed;
    const { data, error } = await supabase.rpc("scan_booking_qr" as never, { _qr_token: qrToken } as never);
    if (error) { setLastScan({ ok: false, msg: error.message }); toast.error(error.message); return; }
    const res = data as {
      ok: boolean; error?: string; waybill?: string;
      passenger_name?: string; passenger_phone?: string | null;
      pickup?: string; dropoff?: string; pickup_time?: string | null;
      total?: number; luxury?: boolean;
    };
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
      setPassenger({
        waybill: res.waybill!, passenger_name: res.passenger_name || "Guest",
        passenger_phone: res.passenger_phone ?? null,
        pickup: res.pickup || "", dropoff: res.dropoff || "",
        pickup_time: res.pickup_time ?? null,
        total: Number(res.total ?? 0), luxury: !!res.luxury,
      });
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
              {/* html5-qrcode injects the <video> element inside this div */}
              <div id="qr-reader" className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&>div]:!border-0" />
              {!scanning && (
                <div className="text-center z-10 px-6">
                  <Camera className="h-16 w-16 mx-auto text-gold opacity-40" />
                  <div className="mt-3 text-xs text-muted-foreground">Camera idle</div>
                  {cameraError && (
                    <div className="mt-3 text-[11px] text-red-400 leading-relaxed">{cameraError}</div>
                  )}
                </div>
              )}
              {scanning && (
                <>
                  <div className="pointer-events-none absolute inset-8 border-2 border-gold z-10" />
                  <motion.div
                    className="pointer-events-none absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-10"
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

          <AnimatePresence>
            {passenger && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 border border-gold/40 bg-gradient-to-b from-black/60 to-[var(--navy-deep)] p-5">
                <div className="text-[10px] uppercase tracking-[0.4em] text-gold flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Passenger Verified
                </div>
                <div className="font-display text-2xl tracking-widest mt-1">{passenger.waybill}</div>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gold" />
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Passenger</div>
                      <div className="text-white">{passenger.passenger_name}</div>
                    </div>
                  </div>
                  {passenger.passenger_phone && (
                    <a href={`tel:${passenger.passenger_phone}`}
                      className="flex items-center justify-between gap-3 p-3 border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-emerald-400" />
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Call passenger</div>
                          <div className="text-white">{passenger.passenger_phone}</div>
                        </div>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-emerald-400">Tap to dial</div>
                    </a>
                  )}
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-gold" /> {passenger.pickup}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-crimson" /> {passenger.dropoff}</div>
                  </div>
                  {passenger.pickup_time && (
                    <div className="text-[11px] text-muted-foreground">Pickup at {new Date(passenger.pickup_time).toLocaleString()}</div>
                  )}
                  {passenger.luxury && (
                    <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold">
                      <ShieldCheck className="h-3 w-3" /> Luxury Protocol
                    </div>
                  )}
                </div>
                <button onClick={() => setPassenger(null)}
                  className="mt-5 w-full h-10 border border-border text-[10px] uppercase tracking-widest hover:border-gold">
                  Dismiss
                </button>
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
