import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Bell, ScanLine, ArrowUpRight } from "lucide-react";
import { AdminLayout, Panel, Stat, Empty } from "@/components/admin/AdminLayout";
import { LiveMap } from "@/components/biluxs/LiveMap";
import { useTable, naira, startOfDay, inRange, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
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
          label: drivers.find((d) => d.id === b.driver_id)?.full_name ?? "Driver",
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
    <AdminLayout title="Operations Overview" subtitle="Realtime pulse of the BiLUXS network — fleet telemetry, demand, revenue and system health.">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Stat label="Revenue Today" value={naira(revenueToday)} accent />
        <Stat label="Trips Today" value={todays.length.toString()} />
        <Stat label="Drivers Online" value={online.toString()} hint={`${busy} on trip`} />
        <Stat label="Pending Assignments" value={pending.toString()} accent={pending > 0} />
        <Stat label="Completed" value={completed.toString()} />
        <Stat label="Cancel Rate" value={`${cancelRate}%`} hint={`${cancelled} cancelled`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Customers" value={profiles.length.toString()} />
        <Stat label="Fleet Streaming" value={pins.length.toString()} hint="GPS active" />
        <Stat label="Avg Response" value={respondMins === null ? "—" : `${respondMins}m`} />
        <Stat label="System Health" value="Nominal" hint="Realtime channel connected" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <Panel
            title={<span className="inline-flex items-center gap-2"><MapPin className="h-3 w-3" /> Live Fleet Telemetry</span>}
            action={<span className="text-[10px] text-muted-foreground">{pins.length} streaming</span>}
          >
            <div className="h-[420px] relative">
              <LiveMap pins={pins} />
            </div>
          </Panel>

          <Panel title="Priority Queue" action={<Link to="/admin/dispatch" className="text-[10px] uppercase tracking-widest text-gold inline-flex items-center gap-1">Dispatch <ArrowUpRight className="h-3 w-3" /></Link>}>
            <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
              {bookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status)).slice(0, 20).map((b: Row) => (
                <Link key={b.id} to="/admin/bookings/$id" params={{ id: b.id }} className="p-3 flex items-center gap-3 hover:bg-white/[0.03]">
                  <div className="font-display tracking-widest text-sm w-32 shrink-0">{b.waybill_code}</div>
                  <div className="text-xs min-w-0 flex-1">
                    <div className="truncate text-white/80">{b.pickup_location}</div>
                    <div className="truncate text-muted-foreground">→ {b.dropoff_location}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{b.status}</div>
                  <div className="font-display">{naira(b.total_price)}</div>
                </Link>
              ))}
              {!bookings.length && <Empty>No bookings yet.</Empty>}
            </div>
          </Panel>
        </div>

        <aside className="border border-gold/20 bg-black/40 h-fit sticky top-24">
          <div className="p-3 border-b border-gold/20 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold flex items-center gap-2"><Bell className="h-3 w-3" /> Live Alerts</div>
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div className="max-h-[760px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {alerts.map((a: Row) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-3 border-b border-border">
                  <div className="flex items-start gap-2">
                    <ScanLine className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{a.body}</div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{since(a.created_at)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!alerts.length && <Empty>No alerts yet.</Empty>}
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}
