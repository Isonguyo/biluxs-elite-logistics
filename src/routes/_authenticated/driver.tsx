import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Radar, MapPin, ScanLine, Power, CheckCircle2, XCircle, Navigation, ShieldCheck,
  Phone, User, Camera, Wallet, Wrench, AlertTriangle, Clock, Star, Gauge, Car,
  MessageCircle, Siren, LayoutDashboard, Route as RouteIcon, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtTopic } from "@/lib/realtime";
import { PageShell } from "@/components/biluxs/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { Panel, Stat, Btn } from "@/components/driver/DriverKit";
import { ngn, dt, greeting } from "@/lib/portal";

export const Route = createFileRoute("/_authenticated/driver")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Driver Operations Cockpit — BiLUXS" },
      { name: "description", content: "Live chauffeur console: assignments, passenger handshake, earnings, inspections and incident reporting." },
      { property: "og:title", content: "Driver Operations Cockpit — BiLUXS" },
      { property: "og:description", content: "Live chauffeur console for BiLUXS fleet operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Booking = {
  id: string; waybill_code: string; pickup_location: string; dropoff_location: string;
  status: string; qr_status: string; driver_id: string | null; pickup_time: string;
  total_price: number; distance_km: number; luxury_protocol: boolean; payment_status: string; updated_at: string;
};
type DriverRow = {
  id: string; full_name: string; phone: string; photo_url: string | null; plate_number: string | null;
  vehicle_model: string | null; rating: number; verified: boolean; years_experience: number;
  availability: string; luxury_certified: boolean; whatsapp: string | null;
};
type PassengerInfo = {
  waybill: string; passenger_name: string; passenger_phone: string | null;
  pickup: string; dropoff: string; pickup_time: string | null; total: number; luxury: boolean;
};
type TripEvent = { id: string; booking_id: string; event: string; note: string | null; created_at: string };

const PRESENCE = [
  { key: "online", label: "Online", dot: "bg-emerald-400" },
  { key: "busy", label: "Busy", dot: "bg-amber-400" },
  { key: "break", label: "Break", dot: "bg-sky-400" },
  { key: "offline", label: "Offline", dot: "bg-white/40" },
  { key: "emergency", label: "Emergency", dot: "bg-crimson" },
] as const;

const CHECKLIST = ["Fuel", "Tyres", "Brakes", "Oil", "Interior", "Exterior", "Documents", "Insurance"];
const INCIDENTS = ["Accident", "Breakdown", "Passenger complaint", "Road block", "Police check", "Medical emergency"];

const TABS = [
  { key: "cockpit", label: "Cockpit", icon: LayoutDashboard },
  { key: "trips", label: "Assignments", icon: RouteIcon },
  { key: "earnings", label: "Earnings", icon: Wallet },
  { key: "vehicle", label: "Vehicle", icon: Wrench },
  { key: "incidents", label: "Incidents", icon: AlertTriangle },
] as const;
type TabKey = typeof TABS[number]["key"];

const sod = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

function Page() {
  const { user, isDriver, isAdmin } = useAuth();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [tab, setTab] = useState<TabKey>("cockpit");
  const [trips, setTrips] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [shift, setShift] = useState<{ id: string; started_at: string } | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [lastScan, setLastScan] = useState<{ ok: boolean; msg: string } | null>(null);
  const [passenger, setPassenger] = useState<PassengerInfo | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const watchRef = useRef<number | null>(null);

  const driverId = driver?.id ?? null;

  /* ---------------- data ---------------- */
  useEffect(() => {
    if (!user) return;
    supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setDriver((data as DriverRow) ?? null));
  }, [user]);

  const loadTrips = useCallback(async () => {
    if (!driverId) return;
    const [{ data: live }, { data: past }] = await Promise.all([
      supabase.from("bookings").select("*").eq("driver_id", driverId)
        .in("status", ["pending", "confirmed", "in_progress"]).order("pickup_time"),
      supabase.from("bookings").select("*").eq("driver_id", driverId)
        .eq("status", "completed").order("updated_at", { ascending: false }).limit(50),
    ]);
    setTrips((live as Booking[]) || []);
    setHistory((past as Booking[]) || []);
  }, [driverId]);

  const loadOps = useCallback(async () => {
    if (!driverId) return;
    const [{ data: sh }, { data: inc }, { data: insp }] = await Promise.all([
      (supabase as any).from("driver_shifts").select("id,started_at").eq("driver_id", driverId).is("ended_at", null).order("started_at", { ascending: false }).limit(1),
      (supabase as any).from("driver_incidents").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }).limit(20),
      (supabase as any).from("vehicle_inspections").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }).limit(10),
    ]);
    setShift(sh?.[0] ?? null);
    setIncidents(inc || []);
    setInspections(insp || []);
  }, [driverId]);

  useEffect(() => { loadTrips(); loadOps(); }, [loadTrips, loadOps]);

  useEffect(() => {
    if (!driverId) return;
    const ch = supabase.channel(rtTopic("driver-ops"))
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `driver_id=eq.${driverId}` }, () => { loadTrips(); toast("Assignment board updated"); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [driverId, loadTrips]);

  const active = useMemo(
    () => trips.find((t) => t.id === activeId) ?? trips.find((t) => t.status === "in_progress") ?? trips[0] ?? null,
    [trips, activeId],
  );

  useEffect(() => {
    if (!active) { setEvents([]); return; }
    const load = () => supabase.from("trip_events").select("*").eq("booking_id", active.id)
      .order("created_at").then(({ data }) => setEvents((data as TripEvent[]) || []));
    load();
    const ch = supabase.channel(rtTopic(`trip-events-${active.id}`))
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_events", filter: `booking_id=eq.${active.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id]);

  useEffect(() => () => {
    stopScannerSafe();
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  /* ---------------- metrics ---------------- */
  const today = useMemo(() => {
    const start = sod();
    const rows = history.filter((b) => new Date(b.updated_at ?? b.pickup_time) >= start);
    return {
      trips: rows.length,
      gross: rows.reduce((a, b) => a + Number(b.total_price || 0), 0),
      distance: rows.reduce((a, b) => a + Number(b.distance_km || 0), 0),
    };
  }, [history]);

  const period = useCallback((days: number) => {
    const start = sod(); start.setDate(start.getDate() - days);
    return history.filter((b) => new Date(b.updated_at ?? b.pickup_time) >= start)
      .reduce((a, b) => a + Number(b.total_price || 0), 0);
  }, [history]);

  const hoursOnline = shift ? (Date.now() - new Date(shift.started_at).getTime()) / 36e5 : 0;

  /* ---------------- actions ---------------- */
  const setPresence = async (availability: string) => {
    if (!driverId) return;
    const { error } = await supabase.from("drivers")
      .update({ availability, last_seen_at: new Date().toISOString() } as never).eq("id", driverId);
    if (error) return toast.error(error.message);
    setDriver((d) => (d ? { ...d, availability } : d));
    toast.success(`Presence · ${availability}`);
  };

  const toggleShift = async () => {
    if (!driverId) return;
    if (shift) {
      await (supabase as any).from("driver_shifts").update({ ended_at: new Date().toISOString() }).eq("id", shift.id);
      setShift(null);
      await setPresence("offline");
      toast.success("Shift ended");
    } else {
      const { data, error } = await (supabase as any).from("driver_shifts").insert({ driver_id: driverId }).select("id,started_at").single();
      if (error) return toast.error(error.message);
      setShift(data);
      await setPresence("online");
      toast.success("Shift started");
    }
  };

  const logEvent = async (event: string, note?: string) => {
    if (!active) return;
    await supabase.from("trip_events").insert({ booking_id: active.id, event, note: note ?? null, actor_id: user?.id ?? null } as never);
  };

  const advance = async (event: string, status?: string) => {
    if (!active) return;
    if (status) {
      const { error } = await supabase.from("bookings").update({ status } as never).eq("id", active.id);
      if (error) return toast.error(error.message);
    }
    await logEvent(event);
    await loadTrips();
    toast.success(event.replace(/_/g, " "));
  };

  const notifyArrival = async () => {
    if (!active) return;
    await logEvent("driver_arrived", "Chauffeur is at the pickup point");
    toast.success("Passenger notified");
  };

  const sos = async () => {
    if (!driverId) return;
    const pos = coords;
    await (supabase as any).from("driver_incidents").insert({
      driver_id: driverId, booking_id: active?.id ?? null, kind: "SOS", severity: "critical",
      note: "Emergency triggered from driver cockpit", lat: pos?.lat ?? null, lng: pos?.lng ?? null,
    });
    await setPresence("emergency");
    await loadOps();
    toast.error("SOS broadcast to dispatch & command");
  };

  /* ---------------- scanner ---------------- */
  async function stopScannerSafe() {
    const s = scannerRef.current;
    if (!s) return;
    try { await s.stop(); } catch { /* already stopped */ }
    try { s.clear(); } catch { /* noop */ }
    scannerRef.current = null;
  }

  const startScanner = async () => {
    setCameraError(null); setLastScan(null); setPassenger(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported in this browser."); return;
    }
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        stream.getTracks().forEach((t) => t.stop());
      } catch (permErr: any) {
        setCameraError(permErr?.name === "NotAllowedError"
          ? "Camera permission denied. Enable it in browser settings and try again."
          : "Could not access camera.");
        setScanning(false); return;
      }
      await new Promise((r) => setTimeout(r, 60));
      const scanner = new Html5Qrcode("qr-reader", { verbose: false } as any);
      scannerRef.current = scanner;
      const config = { fps: 12, qrbox: { width: 260, height: 260 }, aspectRatio: 1 };
      const onDecode = async (decoded: string) => {
        await handleScan(decoded);
        await stopScannerSafe();
        setScanning(false);
      };
      await scanner.start({ facingMode: { exact: "environment" } as any }, config as any, onDecode, () => {})
        .catch(() => scanner.start({ facingMode: "environment" } as any, config as any, onDecode, () => {}));
    } catch (e: any) {
      setCameraError(e?.message || "Could not start camera.");
      setScanning(false);
    }
  };

  const handleScan = async (token: string) => {
    const trimmed = token.trim();
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const qrToken = uuidMatch ? uuidMatch[0] : trimmed;
    const { data, error } = await supabase.rpc("scan_booking_qr" as never, { _qr_token: qrToken } as never);
    if (error) { setLastScan({ ok: false, msg: error.message }); toast.error(error.message); return; }
    const res = data as any;
    if (!res?.ok) {
      const map: Record<string, string> = {
        not_found: "QR not recognised", already_used: "QR already used",
        not_paid: "Booking unpaid", unauthorized: "Not authorized to scan",
      };
      const msg = map[res?.error ?? ""] ?? res?.error ?? "Scan failed";
      setLastScan({ ok: false, msg }); toast.error(msg);
      return;
    }
    setLastScan({ ok: true, msg: `Verified · ${res.waybill}` });
    setPassenger({
      waybill: res.waybill, passenger_name: res.passenger_name || "Guest",
      passenger_phone: res.passenger_phone ?? null, pickup: res.pickup || "", dropoff: res.dropoff || "",
      pickup_time: res.pickup_time ?? null, total: Number(res.total ?? 0), luxury: !!res.luxury,
    });
    await logEvent("identity_confirmed", `QR verified · ${res.waybill}`);
    toast.success(`Passenger verified · ${res.waybill}`);
  };

  const toggleTracking = () => {
    if (tracking) {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null; setTracking(false); return;
    }
    if (!navigator.geolocation) { toast.error("Geolocation unsupported."); return; }
    const trip = trips.find((t) => t.status === "in_progress") ?? active;
    if (!trip) { toast.error("No active assignment to broadcast."); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        await supabase.from("bookings").update({ driver_lat_lng: c } as never).eq("id", trip.id);
        await supabase.from("tracking_logs").insert({ booking_id: trip.id, latitude: c.lat, longitude: c.lng } as never);
      },
      () => toast.error("Location permission denied."),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    setTracking(true);
  };

  if (!user) return null;
  if (!isDriver && !isAdmin) {
    return <PageShell><div className="py-24 text-center text-muted-foreground text-sm">Driver access only.</div></PageShell>;
  }

  const presence = driver?.availability ?? "offline";
  const presenceDot = PRESENCE.find((p) => p.key === presence)?.dot ?? "bg-white/40";

  return (
    <PageShell>
      <div className="min-h-screen bg-[#05070f]">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-[#0a0511] via-[var(--navy-deep)] to-[#0a0511]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 border border-gold/40 bg-black/60 overflow-hidden grid place-items-center">
                {driver?.photo_url
                  ? <img src={driver.photo_url} alt={`${driver.full_name} chauffeur portrait`} className="h-full w-full object-cover" />
                  : <User className="h-6 w-6 text-gold/60" />}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-gold inline-flex items-center gap-2">
                  <Radar className="h-3 w-3 animate-pulse" /> Driver Operations Cockpit
                </div>
                <h1 className="font-display text-2xl md:text-3xl tracking-widest mt-1">
                  {greeting()}, {(driver?.full_name || "Chauffeur").split(" ")[0]}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${presenceDot} animate-pulse`} /> {presence}</span>
                  {driver?.verified && <span className="inline-flex items-center gap-1 text-emerald-400"><ShieldCheck className="h-3 w-3" /> Verified</span>}
                  {driver?.luxury_certified && <span className="inline-flex items-center gap-1 text-gold"><Star className="h-3 w-3" /> Luxury certified</span>}
                  <span className="inline-flex items-center gap-1 text-gold"><Star className="h-3 w-3 fill-gold" /> {Number(driver?.rating ?? 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Btn tone={shift ? "outline" : "emerald"} onClick={toggleShift}>
                <Clock className="h-3.5 w-3.5" /> {shift ? "End shift" : "Start shift"}
              </Btn>
              <Btn tone="crimson" onClick={sos}><Siren className="h-3.5 w-3.5" /> SOS</Btn>
            </div>
          </div>

          {/* Presence switcher */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4 flex flex-wrap gap-2">
            {PRESENCE.map((p) => (
              <button key={p.key} onClick={() => setPresence(p.key)}
                className={`h-9 px-3 text-[10px] uppercase tracking-widest inline-flex items-center gap-2 border transition-colors ${
                  presence === p.key ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:border-gold/50"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} /> {p.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-[10px] uppercase tracking-widest whitespace-nowrap border-b-2 inline-flex items-center gap-2 ${
                  tab === t.key ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-white"}`}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {tab === "cockpit" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Today's earnings" value={ngn(today.gross)} tone="gold" />
                <Stat label="Trips today" value={today.trips} />
                <Stat label="Distance today" value={`${today.distance.toFixed(1)} km`} />
                <Stat label="Hours online" value={hoursOnline.toFixed(1)} sub={shift ? `Since ${dt(shift.started_at)}` : "Shift closed"} tone="emerald" />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Panel title="Vehicle & profile" icon={<Car className="h-3 w-3" />}>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <Field label="Vehicle" value={driver?.vehicle_model || "Unassigned"} />
                    <Field label="Plate" value={driver?.plate_number || "—"} />
                    <Field label="Experience" value={`${driver?.years_experience ?? 0} yrs`} />
                    <Field label="Rating" value={Number(driver?.rating ?? 0).toFixed(1)} />
                    <Field label="Contact" value={driver?.phone || "—"} />
                    <Field label="Last inspection" value={inspections[0] ? dt(inspections[0].created_at) : "Pending"} />
                  </dl>
                </Panel>

                <Panel title="Live GPS broadcast" icon={<Navigation className="h-3 w-3" />} tone="crimson"
                  right={<Btn tone={tracking ? "emerald" : "outline"} onClick={toggleTracking} className="h-9">{tracking ? "Broadcasting" : "Start"}</Btn>}>
                  <div className="text-sm text-muted-foreground">
                    {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Idle — no telemetry streaming."}
                  </div>
                  {coords && (
                    <a className="mt-3 inline-flex text-[10px] uppercase tracking-widest text-gold hover:underline"
                      target="_blank" rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}>Open in maps</a>
                  )}
                </Panel>
              </div>

              <Panel title="Current assignment" icon={<RouteIcon className="h-3 w-3" />}>
                {active ? (
                  <div className="flex flex-wrap items-center gap-6 justify-between">
                    <div>
                      <div className="font-display text-2xl tracking-widest">{active.waybill_code}</div>
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="h-3 w-3 text-gold" /> {active.pickup_location}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3 text-crimson" /> {active.dropoff_location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Fare</div>
                      <div className="font-display text-xl text-gold">{ngn(active.total_price)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{dt(active.pickup_time)}</div>
                    </div>
                    <Btn tone="gold" onClick={() => setTab("trips")}>Open workflow</Btn>
                  </div>
                ) : <Empty text="No active assignment. You'll be alerted the moment dispatch assigns a journey." />}
              </Panel>
            </>
          )}

          {tab === "trips" && (
            <div className="grid lg:grid-cols-[320px_1fr] gap-4">
              <Panel title="Assignment board" icon={<RouteIcon className="h-3 w-3" />}>
                <div className="space-y-2">
                  {trips.map((t) => (
                    <button key={t.id} onClick={() => setActiveId(t.id)}
                      className={`w-full text-left p-3 border transition-colors ${active?.id === t.id ? "border-gold bg-gold/5" : "border-border hover:border-gold/50"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-display tracking-widest">{t.waybill_code}</span>
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 ${t.status === "in_progress" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"}`}>{t.status.replace("_", " ")}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 truncate">{t.pickup_location} → {t.dropoff_location}</div>
                      <div className="text-[10px] text-gold mt-1">{ngn(t.total_price)} · {dt(t.pickup_time)}</div>
                    </button>
                  ))}
                  {!trips.length && <Empty text="No assignments on the board." />}
                </div>
              </Panel>

              <div className="space-y-4">
                {/* Guided workflow */}
                <Panel title="Guided handshake workflow" icon={<ShieldCheck className="h-3 w-3" />}>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <Btn onClick={notifyArrival} disabled={!active}><MapPin className="h-3.5 w-3.5" /> Notify arrival</Btn>
                    <Btn onClick={() => advance("passenger_arrived")} disabled={!active}>Passenger arrived</Btn>
                    <Btn tone="gold" onClick={startScanner} disabled={!active}><ScanLine className="h-3.5 w-3.5" /> Scan QR</Btn>
                    <Btn onClick={() => advance("passenger_onboard")} disabled={!active}>Passenger onboard</Btn>
                    <Btn tone="emerald" onClick={() => advance("trip_started", "in_progress")} disabled={!active}>Start trip</Btn>
                    <Btn onClick={() => advance("destination_reached")} disabled={!active}>Destination reached</Btn>
                    <Btn tone="gold" onClick={() => advance("trip_completed", "completed")} disabled={!active}><CheckCircle2 className="h-3.5 w-3.5" /> Complete trip</Btn>
                    <Btn tone="crimson" onClick={() => advance("trip_cancelled", "cancelled")} disabled={!active}><XCircle className="h-3.5 w-3.5" /> Cancel</Btn>
                    <Btn tone="crimson" onClick={sos}><Siren className="h-3.5 w-3.5" /> Emergency</Btn>
                  </div>
                </Panel>

                {/* Scanner */}
                <Panel title="Identity scanner" icon={<Camera className="h-3 w-3" />}
                  right={scanning
                    ? <Btn tone="crimson" className="h-9" onClick={async () => { await stopScannerSafe(); setScanning(false); }}><Power className="h-3.5 w-3.5" /> Stop</Btn>
                    : <Btn tone="gold" className="h-9" onClick={startScanner}><ScanLine className="h-3.5 w-3.5" /> Start</Btn>}>
                  <div className="relative aspect-square max-w-sm mx-auto bg-black grid place-items-center overflow-hidden">
                    <div id="qr-reader" className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&>div]:!border-0" />
                    {!scanning && (
                      <div className="text-center z-10 px-6">
                        <Camera className="h-14 w-14 mx-auto text-gold opacity-40" />
                        <div className="mt-3 text-xs text-muted-foreground">Camera idle</div>
                        {cameraError && <div className="mt-3 text-[11px] text-red-400 leading-relaxed">{cameraError}</div>}
                      </div>
                    )}
                    {scanning && (
                      <>
                        <div className="pointer-events-none absolute inset-8 border-2 border-gold z-10" />
                        <motion.div className="pointer-events-none absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-10"
                          animate={{ top: ["12%", "88%", "12%"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
                      </>
                    )}
                  </div>
                  <AnimatePresence>
                    {lastScan && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`mt-4 p-3 border flex items-center gap-3 ${lastScan.ok ? "border-emerald-400 bg-emerald-500/10 text-emerald-300" : "border-red-400 bg-red-500/10 text-red-300"}`}>
                        {lastScan.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        <div className="text-sm">{lastScan.msg}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Panel>

                {/* Passenger */}
                {passenger && (
                  <Panel title="Passenger dossier" icon={<User className="h-3 w-3" />}>
                    <div className="flex flex-wrap items-center gap-4 justify-between">
                      <div>
                        <div className="font-display text-2xl tracking-widest">{passenger.waybill}</div>
                        <div className="text-sm text-white mt-1">{passenger.passenger_name}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{passenger.pickup} → {passenger.dropoff}</div>
                        {passenger.luxury && <div className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold"><ShieldCheck className="h-3 w-3" /> Luxury protocol</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Fare</div>
                        <div className="font-display text-xl text-gold">{ngn(passenger.total)}</div>
                      </div>
                    </div>
                    {passenger.passenger_phone && (
                      <div className="mt-4 grid sm:grid-cols-3 gap-2">
                        <a href={`tel:${passenger.passenger_phone}`} className="h-11 border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-emerald-400" /> Call
                        </a>
                        <a href={`https://wa.me/${passenger.passenger_phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                          className="h-11 border border-border hover:border-gold text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                        <button onClick={notifyArrival} className="h-11 border border-border hover:border-gold text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2">
                          <MapPin className="h-3.5 w-3.5" /> Notify arrival
                        </button>
                      </div>
                    )}
                    <button onClick={() => setPassenger(null)} className="mt-4 w-full h-10 border border-border text-[10px] uppercase tracking-widest hover:border-gold">Dismiss</button>
                  </Panel>
                )}

                {/* Timeline */}
                <Panel title="Journey timeline" icon={<Clock className="h-3 w-3" />}>
                  {events.length ? (
                    <ol className="relative border-l border-border ml-2 space-y-4">
                      {events.map((e) => (
                        <li key={e.id} className="pl-5 relative">
                          <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-gold" />
                          <div className="text-sm capitalize">{e.event.replace(/_/g, " ")}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{dt(e.created_at)}</div>
                          {e.note && <div className="text-[11px] text-muted-foreground mt-0.5">{e.note}</div>}
                        </li>
                      ))}
                    </ol>
                  ) : <Empty text="No events recorded for this journey yet." />}
                </Panel>
              </div>
            </div>
          )}

          {tab === "earnings" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Today" value={ngn(today.gross)} tone="gold" />
                <Stat label="Last 7 days" value={ngn(period(7))} />
                <Stat label="Last 30 days" value={ngn(period(30))} />
                <Stat label="Lifetime" value={ngn(history.reduce((a, b) => a + Number(b.total_price || 0), 0))} tone="emerald" />
              </div>
              <Panel title="Completed journeys ledger" icon={<TrendingUp className="h-3 w-3" />}>
                {history.length ? (
                  <div className="divide-y divide-border">
                    {history.map((b) => (
                      <div key={b.id} className="py-3 flex flex-wrap items-center gap-4 justify-between">
                        <div>
                          <div className="font-display tracking-widest">{b.waybill_code}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{b.pickup_location} → {b.dropoff_location}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gold font-display">{ngn(b.total_price)}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{Number(b.distance_km).toFixed(1)} km · {b.payment_status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <Empty text="No completed journeys yet." />}
              </Panel>
            </>
          )}

          {tab === "vehicle" && <InspectionTab driverId={driverId} inspections={inspections} reload={loadOps} />}

          {tab === "incidents" && <IncidentTab driverId={driverId} incidents={incidents} coords={coords} bookingId={active?.id ?? null} reload={loadOps} />}
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-1">{value}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-6 border border-dashed border-border text-center text-xs text-muted-foreground">{text}</div>;
}

function InspectionTab({ driverId, inspections, reload }: { driverId: string | null; inspections: any[]; reload: () => void }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

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
    toast.success("Inspection filed to fleet command");
    setChecks({}); setMileage(""); setFuel(""); setNotes("");
    reload();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Panel title="Daily vehicle inspection" icon={<Wrench className="h-3 w-3" />}>
        <div className="grid grid-cols-2 gap-2">
          {CHECKLIST.map((c) => (
            <button key={c} onClick={() => setChecks((s) => ({ ...s, [c]: !s[c] }))}
              className={`h-11 px-3 text-[10px] uppercase tracking-widest border inline-flex items-center justify-between ${
                checks[c] ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-border text-muted-foreground"}`}>
              {c} {checks[c] ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 border border-border" />}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Mileage (km)</span>
            <input value={mileage} onChange={(e) => setMileage(e.target.value)} type="number"
              className="mt-1 w-full h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Fuel level (%)</span>
            <input value={fuel} onChange={(e) => setFuel(e.target.value)} type="number" min={0} max={100}
              className="mt-1 w-full h-11 bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-gold" />
          </label>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Observations for fleet command…"
          className="mt-3 w-full bg-white/[0.03] border border-border p-3 text-sm outline-none focus:border-gold" />
        <Btn tone="gold" className="mt-3 w-full" onClick={submit} disabled={busy || !driverId}>
          <Gauge className="h-3.5 w-3.5" /> {busy ? "Filing…" : "File inspection"}
        </Btn>
      </Panel>

      <Panel title="Inspection history" icon={<Clock className="h-3 w-3" />} tone="plain">
        {inspections.length ? (
          <div className="divide-y divide-border">
            {inspections.map((i) => (
              <div key={i.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm">{dt(i.created_at)}</div>
                  <div className="text-[11px] text-muted-foreground">{i.mileage ? `${i.mileage} km · ` : ""}{i.fuel_level != null ? `${i.fuel_level}% fuel` : "—"}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 ${i.passed ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                  {i.passed ? "Passed" : "Flagged"}
                </span>
              </div>
            ))}
          </div>
        ) : <Empty text="No inspections filed yet." />}
      </Panel>
    </div>
  );
}

function IncidentTab({ driverId, incidents, coords, bookingId, reload }: {
  driverId: string | null; incidents: any[]; coords: { lat: number; lng: number } | null; bookingId: string | null; reload: () => void;
}) {
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
    toast.success("Incident escalated to command");
    setNote(""); reload();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Panel title="Report incident" icon={<AlertTriangle className="h-3 w-3" />} tone="crimson">
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="mt-1 w-full h-11 bg-input border border-border px-3 text-sm outline-none focus:border-crimson">
            {INCIDENTS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <label className="block mt-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Severity</span>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}
            className="mt-1 w-full h-11 bg-input border border-border px-3 text-sm outline-none focus:border-crimson">
            {["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Describe what happened…"
          className="mt-3 w-full bg-white/[0.03] border border-border p-3 text-sm outline-none focus:border-crimson" />
        <Btn tone="crimson" className="mt-3 w-full" onClick={submit} disabled={busy || !driverId}>
          {busy ? "Escalating…" : "Escalate to command"}
        </Btn>
      </Panel>

      <Panel title="Incident log" icon={<Clock className="h-3 w-3" />} tone="plain">
        {incidents.length ? (
          <div className="divide-y divide-border">
            {incidents.map((i) => (
              <div key={i.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">{i.kind}</div>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 ${
                    i.severity === "critical" ? "bg-red-500/15 text-red-300"
                    : i.severity === "high" ? "bg-amber-500/15 text-amber-300" : "bg-white/10 text-white/70"}`}>{i.severity}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{dt(i.created_at)} · {i.resolved ? "Resolved" : "Open"}</div>
                {i.note && <div className="text-[11px] text-muted-foreground mt-1">{i.note}</div>}
              </div>
            ))}
          </div>
        ) : <Empty text="No incidents reported." />}
      </Panel>
    </div>
  );
}
