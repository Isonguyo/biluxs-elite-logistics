import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin, ScanLine, CheckCircle2, XCircle, Navigation, ShieldCheck, Phone, User,
  Camera, Wrench, AlertTriangle, Clock, Star, Car, MessageCircle, Siren, Home,
  Bell, House, Route as RouteIcon, MessagesSquare, UserCircle2, ChevronRight, X, Gauge,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/biluxs/Logo";
import { DriverChat, type SystemEvent } from "@/components/driver/DriverChat";
import { dt } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/driver")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Driver Cockpit — BiLUXS" },
      { name: "description", content: "Chauffeur console: live assignments, passenger verification, dispatch chat and emergency support." },
      { property: "og:title", content: "Driver Cockpit — BiLUXS" },
      { property: "og:description", content: "Live chauffeur console for BiLUXS assignments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Booking = {
  id: string; waybill_code: string; user_id: string; pickup_location: string; dropoff_location: string;
  status: string; qr_status: string; driver_id: string | null; pickup_time: string;
  distance_km: number; luxury_protocol: boolean; updated_at: string;
};
type DriverRow = {
  id: string; full_name: string; phone: string; photo_url: string | null; plate_number: string | null;
  vehicle_model: string | null; rating: number; verified: boolean; years_experience: number;
  availability: string; luxury_certified: boolean;
};
type PassengerInfo = {
  waybill: string; passenger_name: string; passenger_phone: string | null;
  pickup: string; dropoff: string; pickup_time: string | null; luxury: boolean; at: string;
};
type TripEvent = { id: string; booking_id: string; event: string; note: string | null; created_at: string };
type Notif = { id: string; title: string; body: string | null; kind: string; read: boolean; created_at: string };

const CHECKLIST = ["Fuel", "Tyres", "Brakes", "Oil", "Interior", "Exterior", "Documents", "Insurance"];
const INCIDENTS = ["Accident", "Breakdown", "Passenger complaint", "Road block", "Police check", "Medical emergency"];
const DRIVER_KINDS = ["assignment", "dispatch", "vehicle", "alert", "message"];

const EVENT_TEXT: Record<string, string> = {
  assigned: "Chauffeur assigned",
  accepted: "Assignment accepted",
  en_route: "Driver heading to pickup",
  arrived: "Driver marked arrival",
  qr_scanned: "Passenger verified",
  identity_confirmed: "Passenger verified",
  onboard: "Passenger onboard",
  started: "Trip started",
  destination_reached: "Destination reached",
  completed: "Trip completed",
  cancelled: "Trip cancelled",
};

const TABS = [
  { key: "home", label: "Home", icon: House },
  { key: "rides", label: "Rides", icon: RouteIcon },
  { key: "chat", label: "Chat", icon: MessagesSquare },
  { key: "profile", label: "Profile", icon: UserCircle2 },
] as const;
type TabKey = typeof TABS[number]["key"];

function beep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880; o.type = "sine";
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.65);
  } catch { /* audio not permitted */ }
}

function Page() {
  const { user, isDriver, isAdmin } = useAuth();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [tab, setTab] = useState<TabKey>("home");
  const [trips, setTrips] = useState<Booking[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [bell, setBell] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [alertBooking, setAlertBooking] = useState<Booking | null>(null);
  const [scanning, setScanning] = useState(false);
  const [passenger, setPassenger] = useState<PassengerInfo | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tracking, setTracking] = useState(false);
  const [chatTab, setChatTab] = useState<"ride" | "dispatch">("ride");
  const [confirmSos, setConfirmSos] = useState(false);
  const scannerRef = useRef<any>(null);
  const watchRef = useRef<number | null>(null);
  const knownRef = useRef<Set<string>>(new Set());

  const driverId = driver?.id ?? null;

  useEffect(() => {
    if (!user) return;
    void supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setDriver((data as DriverRow) ?? null));
  }, [user]);

  const loadTrips = useCallback(async () => {
    if (!driverId) return;
    const { data } = await supabase.from("bookings").select("*").eq("driver_id", driverId)
      .in("status", ["pending", "confirmed", "in_progress"]).order("pickup_time");
    const rows = (data as Booking[]) ?? [];
    setTrips(rows);
    return rows;
  }, [driverId]);

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_id", user.id).in("kind", DRIVER_KINDS)
      .order("created_at", { ascending: false }).limit(50);
    setNotifs((data as Notif[]) ?? []);
  }, [user]);

  useEffect(() => { void loadTrips(); }, [loadTrips]);
  useEffect(() => { void loadNotifs(); }, [loadNotifs]);

  /* realtime: assignments + notifications */
  useEffect(() => {
    if (!driverId || !user) return;
    const ch = supabase.channel(rtTopic("driver-live"))
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `driver_id=eq.${driverId}` },
        async () => {
          const rows = await loadTrips();
          const fresh = (rows ?? []).find((r) => !knownRef.current.has(r.id));
          if (fresh) {
            setAlertBooking(fresh);
            try { navigator.vibrate?.([250, 120, 250]); } catch { /* unsupported */ }
            beep();
          }
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void loadNotifs())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [driverId, user, loadTrips, loadNotifs]);

  useEffect(() => {
    if (!trips.length) return;
    if (knownRef.current.size === 0) { trips.forEach((t) => knownRef.current.add(t.id)); return; }
    trips.forEach((t) => knownRef.current.add(t.id));
  }, [trips]);

  const active = useMemo(
    () => trips.find((t) => t.id === activeId) ?? trips.find((t) => t.status === "in_progress") ?? trips[0] ?? null,
    [trips, activeId],
  );

  useEffect(() => {
    if (!active) { setEvents([]); return; }
    const load = () => supabase.from("trip_events").select("*").eq("booking_id", active.id)
      .order("created_at").then(({ data }) => setEvents((data as TripEvent[]) ?? []));
    void load();
    const ch = supabase.channel(rtTopic(`trip-events-${active.id}`))
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_events", filter: `booking_id=eq.${active.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [active?.id]);

  useEffect(() => () => {
    void stopScannerSafe();
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  /* ---------- workflow ---------- */
  const seen = useMemo(() => new Set(events.map((e) => e.event)), [events]);
  const verified = active?.qr_status === "used" || seen.has("qr_scanned") || seen.has("identity_confirmed");

  const logEvent = async (event: string, note?: string) => {
    if (!active) return;
    await supabase.from("trip_events").insert({ booking_id: active.id, event, note: note ?? null, actor_id: user?.id ?? null } as never);
  };

  const advance = async (event: string, status?: string, msg?: string) => {
    if (!active) return;
    if (status) {
      const { error } = await supabase.from("bookings").update({ status } as never).eq("id", active.id);
      if (error) return toast.error(error.message);
    }
    await logEvent(event);
    await loadTrips();
    toast.success(msg ?? EVENT_TEXT[event] ?? event.replace(/_/g, " "));
  };

  const openMaps = () => {
    if (!active) return;
    const target = seen.has("onboard") || active.status === "in_progress" ? active.dropoff_location : active.pickup_location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`, "_blank", "noreferrer");
  };

  type Step = { label: string; run: () => void };
  const nextStep: Step | null = useMemo(() => {
    if (!active) return null;
    if (!seen.has("accepted")) return { label: "Accept assignment", run: () => void advance("accepted", undefined, "Assignment accepted") };
    if (!seen.has("en_route")) return { label: "Navigate to pickup", run: () => { openMaps(); void advance("en_route"); } };
    if (!seen.has("arrived")) return { label: "I have arrived", run: () => void advance("arrived") };
    if (!verified) return { label: "Scan passenger QR", run: () => { setTab("rides"); void startScanner(); } };
    if (!seen.has("onboard")) return { label: "Passenger onboard", run: () => void advance("onboard") };
    if (active.status !== "in_progress") return { label: "Start trip", run: () => void advance("started", "in_progress") };
    if (!seen.has("destination_reached")) return { label: "Destination reached", run: () => { openMaps(); void advance("destination_reached"); } };
    return { label: "Complete trip", run: () => void advance("completed", "completed", "Trip completed") };
  }, [active, seen, verified]);

  const statusLine = !active ? "No assignment"
    : active.status === "in_progress" ? "Driving to destination"
    : verified ? "Passenger verified"
    : seen.has("arrived") ? "Arrived at pickup"
    : seen.has("en_route") ? "Heading to pickup"
    : "Assignment ready";

  const setPresence = async (availability: string) => {
    if (!driverId) return;
    const { error } = await supabase.from("drivers")
      .update({ availability, last_seen_at: new Date().toISOString() } as never).eq("id", driverId);
    if (error) return toast.error(error.message);
    setDriver((d) => (d ? { ...d, availability } : d));
  };

  const sos = async () => {
    setConfirmSos(false);
    if (!driverId) return;
    let pos = coords;
    if (!pos && navigator.geolocation) {
      pos = await new Promise((res) => navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(null as any), { timeout: 6000 },
      ));
    }
    await (supabase as any).from("driver_incidents").insert({
      driver_id: driverId, booking_id: active?.id ?? null, kind: "SOS", severity: "critical",
      note: "Emergency triggered from driver cockpit", lat: pos?.lat ?? null, lng: pos?.lng ?? null,
    });
    await setPresence("emergency");
    toast.error("SOS sent — dispatch has been alerted.");
  };

  /* ---------- scanner ---------- */
  async function stopScannerSafe() {
    const s = scannerRef.current;
    if (!s) return;
    try { await s.stop(); } catch { /* already stopped */ }
    try { s.clear(); } catch { /* noop */ }
    scannerRef.current = null;
  }

  async function startScanner() {
    setCameraError(null);
    setPassenger(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported in this browser.");
      return;
    }
    if (scannerRef.current) await stopScannerSafe();
    setScanning(true);
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader", { verbose: false } as any);
      scannerRef.current = scanner;
      const onDecode = async (decoded: string) => {
        if (!scannerRef.current) return;
        scannerRef.current = null;
        try { await scanner.stop(); } catch { /* stopped */ }
        try { scanner.clear(); } catch { /* noop */ }
        setScanning(false);
        await handleScan(decoded);
      };
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 } as any, onDecode, () => {});
    } catch (e: any) {
      await stopScannerSafe();
      const name = e?.name;
      setCameraError(
        name === "NotAllowedError" ? "Camera permission was denied. Allow camera access and try again."
        : name === "NotFoundError" ? "No camera was found on this device."
        : e?.message || "Could not start camera.",
      );
      setScanning(false);
    }
  }

  const handleScan = async (token: string) => {
    const trimmed = token.trim();
    const m = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const qrToken = m ? m[0] : trimmed;
    const { data, error } = await supabase.rpc("scan_booking_qr" as never, { _qr_token: qrToken } as never);
    if (error) return toast.error(error.message);
    const res = data as any;
    if (!res?.ok) {
      const map: Record<string, string> = {
        not_found: "QR not recognised", already_used: "QR already used",
        not_paid: "Booking unpaid", unauthorized: "Not authorised to scan",
      };
      toast.error(map[res?.error ?? ""] ?? res?.error ?? "Scan failed");
      return;
    }
    setPassenger({
      waybill: res.waybill, passenger_name: res.passenger_name || "Guest",
      passenger_phone: res.passenger_phone ?? null, pickup: res.pickup || "", dropoff: res.dropoff || "",
      pickup_time: res.pickup_time ?? null, luxury: !!res.luxury, at: new Date().toISOString(),
    });
    await logEvent("qr_scanned", `Passenger verified · ${res.waybill}`);
    await loadTrips();
    toast.success(`Passenger verified · ${res.waybill}`);
  };

  /* ---------- gps ---------- */
  const toggleTracking = () => {
    if (tracking) {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null; setTracking(false); return;
    }
    if (!navigator.geolocation) return toast.error("Location is not available on this device.");
    if (!active) return toast.error("No assignment to share location with.");
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        await supabase.from("bookings").update({ driver_lat_lng: { ...c, at: new Date().toISOString() } } as never).eq("id", active.id);
        await supabase.from("tracking_logs").insert({ booking_id: active.id, latitude: c.lat, longitude: c.lng } as never);
      },
      () => toast.error("Location permission denied."),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    setTracking(true);
  };

  const systemEvents: SystemEvent[] = useMemo(
    () => events.map((e) => ({ id: e.id, created_at: e.created_at, label: EVENT_TEXT[e.event] ?? e.event.replace(/_/g, " ") })),
    [events],
  );

  const unread = notifs.filter((n) => !n.read).length;
  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false).in("kind", DRIVER_KINDS);
    void loadNotifs();
  };

  if (!user) return null;
  if (!isDriver && !isAdmin) {
    return <div className="min-h-screen bg-[#05070f] grid place-items-center text-sm text-muted-foreground">Driver access only.</div>;
  }

  const presence = driver?.availability ?? "offline";
  const presenceDot = presence === "online" ? "bg-emerald-400" : presence === "busy" ? "bg-amber-400" : presence === "emergency" ? "bg-crimson" : "bg-white/40";

  return (
    <div className="min-h-screen bg-[#05070f] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gold/20 bg-[#05070f]/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Logo size={30} withText={false} />
          <div className="h-10 w-10 border border-gold/40 bg-black/60 overflow-hidden grid place-items-center shrink-0">
            {driver?.photo_url
              ? <img src={driver.photo_url} alt={`${driver.full_name} portrait`} className="h-full w-full object-cover" />
              : <User className="h-4 w-4 text-gold/60" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-display truncate">{driver?.full_name || "Chauffeur"}</div>
            <button onClick={() => void setPresence(presence === "online" ? "offline" : "online")}
              className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${presenceDot}`} /> {presence}
            </button>
          </div>
          <Link to="/" aria-label="Public homepage" className="h-11 w-11 grid place-items-center border border-border">
            <Home className="h-4 w-4" />
          </Link>
          <button onClick={() => setBell(true)} aria-label="Notifications" className="relative h-11 w-11 grid place-items-center border border-border">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 grid place-items-center bg-crimson text-white text-[10px] rounded-full">
                {unread}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* New assignment alert */}
        <AnimatePresence>
          {alertBooking && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="border-2 border-gold bg-gold/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.3em] text-gold">New ride assigned</div>
                <button onClick={() => setAlertBooking(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
              </div>
              <div className="font-display text-xl mt-2">{alertBooking.waybill_code}</div>
              <div className="text-sm mt-1">{alertBooking.pickup_location} → {alertBooking.dropoff_location}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{dt(alertBooking.pickup_time)} · {driver?.vehicle_model ?? "Vehicle"}</div>
              <button onClick={() => { setActiveId(alertBooking.id); setAlertBooking(null); setTab("rides"); }}
                className="mt-3 w-full h-12 bg-gold text-[var(--navy-deep)] text-[11px] uppercase tracking-widest font-semibold">
                Open assignment
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {tab === "home" && (
          <>
            <section className="border border-gold/30 bg-black/40 p-5">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{statusLine}</div>
              {active ? (
                <>
                  <div className="font-display text-2xl mt-2">{active.waybill_code}</div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex gap-2"><MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span>{active.pickup_location}</span></div>
                    <div className="flex gap-2"><MapPin className="h-4 w-4 text-crimson shrink-0 mt-0.5" /><span>{active.dropoff_location}</span></div>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-3">{dt(active.pickup_time)} · {Number(active.distance_km).toFixed(1)} km{active.luxury_protocol ? " · Luxury protocol" : ""}</div>

                  {nextStep && (
                    <button onClick={nextStep.run}
                      className="mt-5 w-full h-16 bg-gold text-[var(--navy-deep)] text-sm uppercase tracking-widest font-semibold">
                      {nextStep.label}
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={openMaps} className="h-12 border border-border text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
                      <Navigation className="h-4 w-4" /> Navigate
                    </button>
                    <button onClick={() => { setChatTab("ride"); setTab("chat"); }} className="h-12 border border-border text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
                      <MessageCircle className="h-4 w-4" /> Passenger
                    </button>
                  </div>
                  <button onClick={toggleTracking}
                    className={`mt-2 w-full h-12 text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2 border ${tracking ? "border-emerald-500 text-emerald-400" : "border-border"}`}>
                    <Navigation className="h-4 w-4" /> {tracking ? "Sharing live location" : "Share live location"}
                  </button>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No job right now. You'll be alerted the moment dispatch assigns a ride.
                </div>
              )}
            </section>

            {events.length > 0 && (
              <section className="border border-border bg-black/30 p-4">
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">Trip progress</div>
                <ol className="space-y-2 text-sm">
                  {events.slice(-6).map((e) => (
                    <li key={e.id} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{EVENT_TEXT[e.event] ?? e.event.replace(/_/g, " ")}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </>
        )}

        {tab === "rides" && (
          <>
            <section className="border border-border bg-black/30">
              <div className="px-4 py-3 border-b border-border text-[10px] uppercase tracking-[0.3em] text-gold">My assignments</div>
              <div className="divide-y divide-border">
                {trips.map((t) => (
                  <button key={t.id} onClick={() => setActiveId(t.id)}
                    className={`w-full text-left p-4 flex items-center gap-3 ${active?.id === t.id ? "bg-gold/5" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-display tracking-widest">{t.waybill_code}</div>
                      <div className="text-[12px] text-muted-foreground truncate">{t.pickup_location} → {t.dropoff_location}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{dt(t.pickup_time)} · {t.status.replace("_", " ")}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
                {!trips.length && <div className="p-6 text-center text-xs text-muted-foreground">No assignments right now.</div>}
              </div>
            </section>

            {/* Passenger verification */}
            <section className="border border-border bg-black/30">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold">
                  {passenger ? "Passenger verified" : "Passenger check-in"}
                </span>
                {passenger && (
                  <button onClick={() => { setPassenger(null); void startScanner(); }} className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Scan another
                  </button>
                )}
              </div>

              {passenger ? (
                <div className="p-4 space-y-4">
                  <div className="border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-400">Passenger verified</div>
                      <div className="font-display text-xl mt-1">{passenger.passenger_name}</div>
                      <div className="text-[11px] text-muted-foreground">Waybill {passenger.waybill} · {dt(passenger.at)}</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex gap-2"><MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />{passenger.pickup || "—"}</div>
                    <div className="flex gap-2"><MapPin className="h-4 w-4 text-crimson shrink-0 mt-0.5" />{passenger.dropoff || "—"}</div>
                  </div>
                  {passenger.luxury && (
                    <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold">
                      <ShieldCheck className="h-3 w-3" /> Luxury protocol
                    </div>
                  )}
                  {passenger.passenger_phone && (
                    <a href={`tel:${passenger.passenger_phone}`} className="h-12 border border-emerald-500/40 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-400" /> Call passenger
                    </a>
                  )}
                  <button onClick={() => void advance("onboard")} className="w-full h-14 bg-emerald-500 text-white text-[11px] uppercase tracking-widest font-semibold">
                    Passenger onboard
                  </button>
                  <button onClick={() => void advance("started", "in_progress")} className="w-full h-14 bg-gold text-[var(--navy-deep)] text-[11px] uppercase tracking-widest font-semibold">
                    Start trip
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  <div className="relative aspect-square bg-black overflow-hidden border border-border">
                    <div id="qr-reader"
                      className="absolute inset-0 overflow-hidden [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_video]:!rounded-none [&_video]:!block [&_img]:!hidden [&_canvas]:!hidden [&>div]:!border-0" />
                    {!scanning && (
                      <div className="absolute inset-0 z-20 grid place-items-center bg-[#05070f] text-center px-6">
                        <div>
                          <Camera className="h-10 w-10 text-gold/60 mx-auto" />
                          <div className="mt-3 text-sm">Scan the passenger boarding pass</div>
                          {cameraError && <div className="mt-3 text-[11px] text-red-400">{cameraError}</div>}
                        </div>
                      </div>
                    )}
                    {scanning && (
                      <div className="pointer-events-none absolute inset-0 z-10">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]">
                          <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-gold" />
                          <div className="absolute top-0 right-0 w-10 h-10 border-r-2 border-t-2 border-gold" />
                          <div className="absolute bottom-0 left-0 w-10 h-10 border-l-2 border-b-2 border-gold" />
                          <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-gold" />
                          <motion.div className="absolute left-2 right-2 h-0.5 bg-emerald-400"
                            animate={{ top: ["6%", "94%", "6%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {scanning ? (
                    <button onClick={async () => { await stopScannerSafe(); setScanning(false); }}
                      className="mt-3 w-full h-14 border border-crimson text-crimson text-[11px] uppercase tracking-widest">Stop camera</button>
                  ) : (
                    <button onClick={() => void startScanner()} disabled={!active}
                      className="mt-3 w-full h-14 bg-gold text-[var(--navy-deep)] text-[11px] uppercase tracking-widest font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2">
                      <ScanLine className="h-4 w-4" /> Scan QR
                    </button>
                  )}
                </div>
              )}
            </section>

            {active && (
              <button onClick={() => void advance("cancelled", "cancelled")}
                className="w-full h-12 border border-crimson text-crimson text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
                <XCircle className="h-4 w-4" /> Cancel trip
              </button>
            )}
          </>
        )}

        {tab === "chat" && (
          <section className="border border-border bg-black/30 flex flex-col h-[70vh]">
            <div className="grid grid-cols-2 border-b border-border">
              {(["ride", "dispatch"] as const).map((k) => (
                <button key={k} onClick={() => setChatTab(k)}
                  className={`h-12 text-[10px] uppercase tracking-widest ${chatTab === k ? "text-gold border-b-2 border-gold" : "text-muted-foreground"}`}>
                  {k === "ride" ? "Passenger" : "Dispatch"}
                </button>
              ))}
            </div>
            {chatTab === "ride" ? (
              active ? (
                <DriverChat key={"ride-" + active.id} bookingId={active.id} channel="driver" ownerUserId={active.user_id}
                  placeholder="I'm outside…" emptyText="Say hello to your passenger." />
              ) : (
                <div className="flex-1 grid place-items-center text-xs text-muted-foreground p-6 text-center">
                  Passenger chat opens when you have an active ride. It is deleted once the ride completes.
                </div>
              )
            ) : (
              <DriverChat key={"disp-" + (active?.id ?? "general")} bookingId={active?.id ?? null} channel="dispatch"
                ownerUserId={user.id} systemEvents={active ? systemEvents : []}
                placeholder="Message dispatch…" emptyText="Dispatch can reach you here." />
            )}
          </section>
        )}

        {tab === "profile" && (
          <>
            <section className="border border-border bg-black/30 p-5 text-center">
              <div className="h-24 w-24 mx-auto border border-gold/40 bg-black/60 overflow-hidden grid place-items-center">
                {driver?.photo_url
                  ? <img src={driver.photo_url} alt={`${driver.full_name} portrait`} className="h-full w-full object-cover" />
                  : <User className="h-8 w-8 text-gold/60" />}
              </div>
              <div className="font-display text-xl mt-3">{driver?.full_name || "Chauffeur"}</div>
              <div className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-2">
                <Car className="h-3.5 w-3.5" /> {driver?.vehicle_model || "Unassigned"} · {driver?.plate_number || "—"}
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest">
                <span className="text-gold inline-flex items-center gap-1"><Star className="h-3 w-3 fill-gold" /> {Number(driver?.rating ?? 0).toFixed(1)}</span>
                <span className={driver?.verified ? "text-emerald-400 inline-flex items-center gap-1" : "text-muted-foreground inline-flex items-center gap-1"}>
                  <ShieldCheck className="h-3 w-3" /> {driver?.verified ? "Verified" : "Unverified"}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-3">Contact dispatch to change your profile details.</div>
            </section>

            <InspectionCard driverId={driverId} />
            <IncidentCard driverId={driverId} bookingId={active?.id ?? null} coords={coords} />
          </>
        )}
      </main>

      {/* SOS floating */}
      <button onClick={() => setConfirmSos(true)} aria-label="Emergency SOS"
        className="fixed right-4 bottom-24 z-40 h-16 w-16 rounded-full bg-crimson text-white grid place-items-center shadow-lg">
        <Siren className="h-7 w-7" />
      </button>

      {confirmSos && (
        <div className="fixed inset-0 z-50 bg-black/85 grid place-items-center p-6" onClick={() => setConfirmSos(false)}>
          <div className="w-full max-w-sm border border-crimson bg-[var(--navy-deep)] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <AlertTriangle className="h-10 w-10 text-crimson mx-auto" />
            <div className="font-display text-xl mt-3">Send emergency SOS?</div>
            <p className="text-xs text-muted-foreground mt-2">Dispatch will be alerted with your location and current ride.</p>
            <button onClick={() => void sos()} className="mt-5 w-full h-14 bg-crimson text-white text-[11px] uppercase tracking-widest font-semibold">Yes, send SOS</button>
            <button onClick={() => setConfirmSos(false)} className="mt-2 w-full h-12 border border-border text-[10px] uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {/* Notification drawer */}
      {bell && (
        <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setBell(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] bg-[var(--navy-deep)] border-t border-gold/30 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold">Notifications</span>
              <div className="flex items-center gap-3">
                <button onClick={() => void markAll()} className="text-[10px] uppercase tracking-widest text-muted-foreground">Mark all read</button>
                <button onClick={() => setBell(false)} aria-label="Close"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="overflow-y-auto divide-y divide-border">
              {notifs.map((n) => (
                <div key={n.id} className={`p-4 ${n.read ? "" : "bg-gold/5"}`}>
                  <div className="text-sm">{n.title}</div>
                  {n.body && <div className="text-[12px] text-muted-foreground mt-0.5">{n.body}</div>}
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{dt(n.created_at)}</div>
                </div>
              ))}
              {!notifs.length && <div className="p-8 text-center text-xs text-muted-foreground">Nothing yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[#05070f]/95 backdrop-blur">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`h-[68px] flex flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-widest ${tab === t.key ? "text-gold" : "text-muted-foreground"}`}>
              <t.icon className="h-5 w-5" /> {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function InspectionCard({ driverId }: { driverId: string | null }) {
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!driverId) return;
    setBusy(true);
    const passed = CHECKLIST.every((c) => checks[c]);
    const { error } = await (supabase as any).from("vehicle_inspections").insert({
      driver_id: driverId, checklist: checks, passed,
      mileage: mileage ? Number(mileage) : null, fuel_level: fuel ? Number(fuel) : null, notes: notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setChecks({}); setMileage(""); setFuel(""); setNotes(""); setDone(true); setOpen(false);
    toast.success("Inspection completed");
  };

  return (
    <section className="border border-border bg-black/30">
      <button onClick={() => setOpen((o) => !o)} className="w-full px-4 py-4 flex items-center gap-3 text-left">
        <Wrench className="h-4 w-4 text-gold" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold flex-1">Vehicle inspection</span>
        {done && <span className="text-[10px] uppercase tracking-widest text-emerald-400">Completed</span>}
        <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-2">
            {CHECKLIST.map((c) => (
              <button key={c} onClick={() => setChecks((s) => ({ ...s, [c]: !s[c] }))}
                className={`h-12 px-3 text-[10px] uppercase tracking-widest border flex items-center justify-between ${
                  checks[c] ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-border text-muted-foreground"}`}>
                {c} {checks[c] ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 border border-border" />}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input value={mileage} onChange={(e) => setMileage(e.target.value)} type="number" placeholder="Mileage (km)"
              className="h-12 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
            <input value={fuel} onChange={(e) => setFuel(e.target.value)} type="number" min={0} max={100} placeholder="Fuel %"
              className="h-12 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notes…"
            className="mt-2 w-full bg-white/[0.03] border border-border p-3 text-sm outline-none focus:border-gold" />
          <button onClick={() => void submit()} disabled={busy || !driverId}
            className="mt-2 w-full h-14 bg-gold text-[var(--navy-deep)] text-[11px] uppercase tracking-widest font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2">
            <Gauge className="h-4 w-4" /> {busy ? "Submitting…" : "Submit inspection"}
          </button>
        </div>
      )}
    </section>
  );
}

function IncidentCard({ driverId, bookingId, coords }: {
  driverId: string | null; bookingId: string | null; coords: { lat: number; lng: number } | null;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(INCIDENTS[0]);
  const [severity, setSeverity] = useState("low");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!driverId) return;
    setBusy(true);
    const { error } = await (supabase as any).from("driver_incidents").insert({
      driver_id: driverId, booking_id: bookingId, kind, severity, note: note || null,
      lat: coords?.lat ?? null, lng: coords?.lng ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setNote(""); setOpen(false);
    toast.success("Reported to dispatch");
  };

  return (
    <section className="border border-crimson/30 bg-black/30">
      <button onClick={() => setOpen((o) => !o)} className="w-full px-4 py-4 flex items-center gap-3 text-left">
        <AlertTriangle className="h-4 w-4 text-crimson" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-crimson flex-1">Report an issue</span>
        <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="p-4 pt-0 space-y-2">
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="w-full h-12 bg-input border border-border px-3 text-sm outline-none focus:border-crimson">
            {INCIDENTS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}
            className="w-full h-12 bg-input border border-border px-3 text-sm outline-none focus:border-crimson">
            {["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What happened?"
            className="w-full bg-white/[0.03] border border-border p-3 text-sm outline-none focus:border-crimson" />
          <button onClick={() => void submit()} disabled={busy || !driverId}
            className="w-full h-14 bg-crimson text-white text-[11px] uppercase tracking-widest font-semibold disabled:opacity-40">
            {busy ? "Sending…" : "Report to dispatch"}
          </button>
        </div>
      )}
    </section>
  );
}
