import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/fleet")({ component: Page });

function Page() {
  const { rows: vehicles } = useTable("vehicles", { order: "created_at" });
  const { rows: inspections } = useTable("vehicle_inspections", { realtime: false });
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true, realtime: false });

  const lastInspection = (vehicleId: string) =>
    inspections.find((i: Row) => i.vehicle_id === vehicleId || i.driver_id === vehicleId);

  return (
    <AdminLayout title="Fleet Management" subtitle="Vehicles, availability, inspections, mileage and service posture.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Vehicles" value={vehicles.length.toString()} />
        <Stat label="Available" value={vehicles.filter((v) => v.available !== false && v.status !== "maintenance").length.toString()} accent />
        <Stat label="In Maintenance" value={vehicles.filter((v) => v.status === "maintenance").length.toString()} />
        <Stat label="Inspections Logged" value={inspections.length.toString()} />
      </div>

      <Panel title="Fleet Register" className="mb-4">
        <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
          {vehicles.map((v: Row) => (
            <div key={v.id} className="p-4 grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
              <div className="min-w-0">
                <div className="text-sm truncate">{v.name ?? v.model ?? "Vehicle"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {[v.category, v.plate_number, v.year].filter(Boolean).join(" · ") || v.id.slice(0, 8)}
                </div>
              </div>
              <Pill tone={v.status === "maintenance" ? "warn" : v.available === false ? "neutral" : "good"}>
                {v.status ?? (v.available === false ? "engaged" : "available")}
              </Pill>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Last check</div>
                <div className="text-xs">{since(lastInspection(v.id)?.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Rate / day</div>
                <div className="font-display">{v.price_per_day ? `₦${Number(v.price_per_day).toLocaleString()}` : "—"}</div>
              </div>
            </div>
          ))}
          {!vehicles.length && <Empty>No vehicles registered.</Empty>}
        </div>
      </Panel>

      <Panel title="Recent Inspections">
        <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
          {inspections.map((i: Row) => (
            <div key={i.id} className="p-3 flex items-center gap-3 text-xs">
              <span className="text-white/80 w-40 truncate">{drivers.find((d) => d.id === i.driver_id)?.full_name ?? "Chauffeur"}</span>
              <span className="text-muted-foreground flex-1 truncate">{i.notes ?? "Daily checklist submitted"}</span>
              {i.mileage != null && <span className="text-muted-foreground">{Number(i.mileage).toLocaleString()} km</span>}
              <Pill tone={i.passed === false ? "bad" : "good"}>{i.passed === false ? "failed" : "passed"}</Pill>
              <span className="text-[10px] text-muted-foreground">{since(i.created_at)}</span>
            </div>
          ))}
          {!inspections.length && <Empty>No inspections logged yet.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
