import { createFileRoute } from "@tanstack/react-router";
import { useCP } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/fleet")({ component: Page });

function Page() {
  const { rows: vehicles } = useTable("vehicles", { order: "name", ascending: true, limit: 500 });
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true, limit: 500 });
  const { rows: inspections } = useTable("vehicle_inspections", { limit: 500 });
  const { rows: bookings } = useTable("bookings", { limit: 1000 });

  const inUse = vehicles.filter((v: Row) => v.status === "in_use");
  const maintenance = vehicles.filter((v: Row) => v.status === "maintenance");
  const idle = vehicles.filter((v: Row) => v.status === "available");
  const utilisation = vehicles.length ? (inUse.length / vehicles.length) * 100 : 0;
  const assigned = new Set(bookings.filter((b: Row) => b.driver_id).map((b: Row) => b.driver_id));

  return (
    <SuperLayout title="Fleet Governance" subtitle="Utilisation, idle capital, maintenance exposure and chauffeur coverage across the whole fleet — not individual vehicle admin.">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <CStat label="Fleet size" value={vehicles.length.toString()} />
        <CStat label="Utilisation" value={`${utilisation.toFixed(1)}%`} tone={utilisation > 60 ? "good" : "warn"} />
        <CStat label="Idle vehicles" value={idle.length.toString()} hint="Available, unassigned" />
        <CStat label="Maintenance due" value={maintenance.length.toString()} tone={maintenance.length ? "warn" : "neutral"} />
        <CStat label="Chauffeurs assigned" value={`${assigned.size}/${drivers.length}`} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <CPanel title="Vehicle Availability">
          <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
            {vehicles.map((v: Row) => (
              <div key={v.id} className="p-3 flex items-center gap-3 text-xs">
                <span className="flex-1 truncate">{v.name}</span>
                <span className="text-muted-foreground">{v.category}</span>
                <span className={`text-[10px] uppercase tracking-widest ${v.status === "available" ? "text-emerald-300" : v.status === "maintenance" ? "text-amber-300" : "text-white/70"}`}>{v.status}</span>
              </div>
            ))}
            {!vehicles.length && <CEmpty>No vehicles registered.</CEmpty>}
          </div>
        </CPanel>
        <CPanel title="Latest Inspections">
          <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
            {inspections.slice(0, 40).map((i: Row) => (
              <div key={i.id} className="p-3 flex items-center gap-3 text-xs">
                <span className="flex-1 truncate">{drivers.find((d: Row) => d.id === i.driver_id)?.full_name ?? "Chauffeur"}</span>
                <span className="text-muted-foreground">{i.mileage ? `${i.mileage} km` : "—"}</span>
                <span className={i.passed ? "text-emerald-300" : "text-crimson"}>{i.passed ? "Passed" : "Failed"}</span>
                <span className="text-[10px] text-muted-foreground">{since(i.created_at)}</span>
              </div>
            ))}
            {!inspections.length && <CEmpty>No inspections logged.</CEmpty>}
          </div>
        </CPanel>
      </div>
    </SuperLayout>
  );
}
