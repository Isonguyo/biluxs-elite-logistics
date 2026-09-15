import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Bell, ScanLine, ArrowUpRight, Radio, Activity, Users, ShieldCheck, Clock } from "lucide-react";
import { AdminLayout, Panel, Stat, Empty } from "@/components/admin/AdminLayout";
import { LiveMap } from "@/components/biluxs/LiveMap";
import { useTable, naira, startOfDay, inRange, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — BiLUXS Control Room" },
      { name: "description", content: "Realtime pulse of the BiLUXS executive chauffeur and concierge network." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

function Page() {
  const { rows: bookings } = useTable("bookings");
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true });
  const { rows: alerts } = useTable("alerts", { limit: 40 });
  const { rows: profiles } = useTable("profiles", { order: "created_at" });

  const today = startOfDay();
  const todays = bookings.filter((b) => inRange(b.created_at, today));

  const pins = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "in_progress" && b.driver_lat_lng && b.driver_id)
        .map((b) => ({
          id: b.id,
          lat: b.driver_lat_lng.lat,
          lng: b.driver_lat_lng.lng,
          label: drivers.find((d) => d.id === b.driver_id)?.full_name ?? "Chauffeur",
          waybill: b.waybill_code,
        })),
    [bookings, drivers],
  );

  const online = drivers.filter((d) => d.availability === "online").length;
  const busy = drivers.filter((d) => d.availability === "busy" || d.status === "on_trip").length;
  const pending = bookings.filter((b) => !b.driver_id && b.status === "pending").length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const cancelRate = bookings.length ? Math.round((cancelled / bookings.length) * 100) : 0;
  const revenueToday = todays.filter((b) => b.payment_status === "paid").reduce((a, b) => a + Number(b.total_price ?? 0), 0);

  const respondMins = useMemo(() => {
    const withDriver = bookings.filter((b) => b.driver_id && b.updated_at && b.created_at).slice(0, 60);
    if (!withDriver.length) return null;
    const avg =
      withDriver.reduce((a, b) => a + (new Date(b.updated_at).getTime() - new Date(b.created_at).getTime()), 0) /
      withDriver.length /
      60000;
    return Math.max(0, Math.round(avg));
  }, [bookings]);

  return (
    <AdminLayout
      title="Operations Control"
      subtitle="Realtime telemetry, active dispatch queue, fleet telemetry, and network financial pulse."
    >
      <div className="space-y-6">
        {/* Core KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Revenue Today" value={naira(revenueToday)} accent />
          <Stat label="Trips Today" value={todays.length.toString()} />
          <Stat label="Drivers Online" value={online.toString()} hint={`${busy} on trip`} />
          <Stat label="Pending Dispatch" value={pending.toString()} accent={pending > 0} />
          <Stat label="Completed" value={completed.toString()} />
          <Stat label="Cancel Rate" value={`${cancelRate}%`} hint={`${cancelled} total`} />
        </div>

        {/* Secondary Operational Telemetry */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total Registered Clients" value={profiles.length.toString()} />
          <Stat label="GPS Telemetry Active" value={pins.length.toString()} hint="Live feeds" />
          <Stat label="Avg Response Time" value={respondMins === null ? "—" : `${respondMins}m`} />
          <Stat label="System Status" value="Nominal" hint="Realtime sync active" />
        </div>

        {/* Main Operational Workspace */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            {/* Fleet Telemetry Live Map */}
            <Panel
              title={
                <span className="inline-flex items-center gap-2 text-white font-medium">
                  <Radio className="h-4 w-4 text-gold animate-pulse" /> Live Fleet Telemetry
                </span>
              }
              action={
                <span className="text-[10px] uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {pins.length} active streams
                </span>
              }
            >
              <div className="h-[440px] relative rounded-sm overflow-hidden border border-white/10 bg-[#0a0511]">
                <LiveMap pins={pins} />
              </div>
            </Panel>

            {/* Priority Booking Queue */}
            <Panel
              title={
                <span className="inline-flex items-center gap-2 text-white font-medium">
                  <Activity className="h-4 w-4 text-gold" /> Priority Dispatch Queue
                </span>
              }
              action={
                <Link
                  to="/admin/dispatch"
                  className="text-[10px] uppercase tracking-widest text-gold hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Console <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            >
              <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto bg-[#0a0511]/40 rounded-sm">
                {bookings
                  .filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status))
                  .slice(0, 25)
                  .map((b: Row) => (
                    <Link
                      key={b.id}
                      to="/admin/bookings/$id"
                      params={{ id: b.id }}
                      className="p-3.5 flex items-center gap-4 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="font-display tracking-widest text-sm text-gold w-32 shrink-0 font-semibold">
                        {b.waybill_code}
                      </div>
                      <div className="text-xs min-w-0 flex-1">
                        <div className="truncate text-white/90 font-medium">{b.pickup_location}</div>
                        <div className="truncate text-white/40 mt-0.5">→ {b.dropoff_location}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-widest rounded border ${
                            b.status === "pending"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : b.status === "in_progress"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-white/5 border-white/10 text-white/60"
                          }`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                        <div className="font-display text-xs text-white/90 mt-1">{naira(b.total_price)}</div>
                      </div>
                    </Link>
                  ))}
                {!bookings.length && <Empty>No active bookings in queue.</Empty>}
              </div>
            </Panel>
          </div>

          {/* Realtime Alert Stream Sidebar */}
          <aside className="border border-gold/20 bg-[#0a0511]/80 backdrop-blur-md rounded-sm h-fit sticky top-24 overflow-hidden">
            <div className="p-3.5 border-b border-gold/20 bg-gold/5 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.25em] font-semibold text-gold flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" /> Operations Feed
              </div>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] uppercase tracking-widest text-white/40">Live</span>
              </span>
            </div>

            <div className="max-h-[760px] overflow-y-auto divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {alerts.map((a: Row) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <ScanLine className="h-3.5 w-3.5 text-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white/90">{a.title}</div>
                        <div className="text-[11px] text-white/50 mt-1 leading-relaxed">{a.body}</div>
                        <div className="text-[9px] uppercase tracking-widest text-gold/70 mt-2 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{since(a.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!alerts.length && <Empty>No system alerts logged.</Empty>}
            </div>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
