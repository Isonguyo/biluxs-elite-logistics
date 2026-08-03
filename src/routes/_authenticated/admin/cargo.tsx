import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/cargo")({ component: Page });

const STAGES = ["received", "warehouse", "in_transit", "customs", "out_for_delivery", "delivered"];

function Page() {
  const { rows: shipments, reload } = useTable("cargo_shipments");

  const advance = async (s: Row, status: string) => {
    const { error } = await (supabase as any).from("cargo_shipments").update({ status }).eq("id", s.id);
    if (error) return toast.error(error.message);
    await logAudit("update_shipment", "cargo_shipment", s.id, `Status → ${status}`);
    toast.success(`Shipment → ${status}`);
    void reload();
  };

  return (
    <AdminLayout title="Cargo Operations" subtitle="Shipments, warehouse staging, courier hand-off, customs and proof of delivery.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Shipments" value={shipments.length.toString()} />
        <Stat label="In Transit" value={shipments.filter((s) => s.status === "in_transit").length.toString()} accent />
        <Stat label="At Warehouse" value={shipments.filter((s) => s.status === "warehouse").length.toString()} />
        <Stat label="Delivered" value={shipments.filter((s) => s.status === "delivered").length.toString()} />
      </div>

      <Panel title="Shipment Register">
        <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
          {shipments.map((s: Row) => (
            <div key={s.id} className="p-4 grid md:grid-cols-[auto_1fr_auto_auto] gap-3 items-center">
              <div>
                <div className="font-display tracking-widest">{s.tracking_code ?? s.id.slice(0, 8)}</div>
                <div className="text-[10px] text-muted-foreground">{since(s.created_at)}</div>
              </div>
              <div className="text-xs min-w-0">
                <div className="truncate text-white/80">{s.origin ?? s.pickup_location ?? "—"}</div>
                <div className="truncate text-muted-foreground">→ {s.destination ?? s.dropoff_location ?? "—"}</div>
              </div>
              <Pill tone={s.status === "delivered" ? "good" : "warn"}>{s.status ?? "received"}</Pill>
              <select value={s.status ?? "received"} onChange={(e) => advance(s, e.target.value)}
                className="h-9 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
                {STAGES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          ))}
          {!shipments.length && <Empty>No shipments recorded.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
