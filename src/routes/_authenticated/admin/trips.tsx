import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { LiveMap } from "@/components/biluxs/LiveMap";
import { useTable, since, naira, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/trips")({ component: Page });

function Page() {
  const { rows: bookings } = useTable("bookings");
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true });

  const live = bookings.filter((b) => ["confirmed", "in_progress"].includes(b.status));
  const pins = useMemo(
    () => live.filter((b) => b.driver_lat_lng).map((b: Row) => ({
      id: b.id, lat: b.driver_lat_lng.lat, lng: b.driver_lat_lng.lng,
      label: drivers.find((d) => d.id === b.driver_id)?.full_name ?? "Driver", waybill: b.waybill_code,
    })),
    [live, drivers],
  );

  return (
    <AdminLayout title="Live Trips" subtitle="Journeys in flight — GPS health, chauffeur, destination and elapsed time.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="In Flight" value={live.length.toString()} accent />
        <Stat label="GPS Streaming" value={pins.length.toString()} />
        <Stat label="No Signal" value={(live.length - pins.length).toString()} />
        <Stat label="Completed Today" value={bookings.filter((b) => b.status === "completed").length.toString()} />
      </div>

      <Panel title={<span className="inline-flex items-center gap-2"><MapPin className="h-3 w-3" /> Fleet Positions</span>} className="mb-4">
        <div className="h-[400px]"><LiveMap pins={pins} /></div>
      </Panel>

      <Panel title="Active Journeys">
        <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
          {live.map((b: Row) => (
            <Link key={b.id} to="/admin/bookings/$id" params={{ id: b.id }} className="p-3 grid md:grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center hover:bg-white/[0.03]">
              <div className="font-display tracking-widest">{b.waybill_code}</div>
              <div className="text-xs min-w-0">
                <div className="truncate text-white/80">{b.pickup_location}</div>
                <div className="truncate text-muted-foreground">→ {b.dropoff_location}</div>
              </div>
              <div className="text-xs text-muted-foreground">{drivers.find((d) => d.id === b.driver_id)?.full_name ?? "Unassigned"}</div>
              <Pill tone={b.driver_lat_lng ? "good" : "warn"}>{b.driver_lat_lng ? "GPS ok" : "no signal"}</Pill>
              <div className="text-right">
                <div className="font-display">{naira(b.total_price)}</div>
                <div className="text-[10px] text-muted-foreground">{since(b.created_at)}</div>
              </div>
            </Link>
          ))}
          {!live.length && <Empty>No journeys in flight.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
