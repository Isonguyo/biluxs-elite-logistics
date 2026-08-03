import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/incidents")({ component: Page });

function Page() {
  const { rows, reload } = useTable("driver_incidents");
  const { rows: drivers } = useTable("drivers", { order: "full_name", ascending: true, realtime: false });

  const setStatus = async (i: Row, status: string) => {
    const { error } = await (supabase as any).from("driver_incidents").update({ status }).eq("id", i.id);
    if (error) return toast.error(error.message);
    await logAudit("update_incident", "driver_incident", i.id, `Status → ${status}`);
    void reload();
  };

  return (
    <AdminLayout title="Incident Center" subtitle="Accidents, breakdowns, SOS escalations and investigations across the chauffeur network.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Reports" value={rows.length.toString()} />
        <Stat label="Critical" value={rows.filter((i) => i.severity === "critical").length.toString()} accent />
        <Stat label="Open" value={rows.filter((i) => i.status !== "resolved").length.toString()} />
        <Stat label="Resolved" value={rows.filter((i) => i.status === "resolved").length.toString()} />
      </div>
      <Panel title="Incident Log">
        <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
          {rows.map((i: Row) => (
            <div key={i.id} className="p-4 grid md:grid-cols-[auto_1fr_auto_auto] gap-3 items-center">
              <Pill tone={i.severity === "critical" ? "bad" : "warn"}>{i.severity ?? "minor"}</Pill>
              <div className="min-w-0">
                <div className="text-sm">{i.kind ?? "Incident"} · {drivers.find((d) => d.id === i.driver_id)?.full_name ?? "Chauffeur"}</div>
                <div className="text-[10px] text-muted-foreground truncate">{i.description} · {since(i.created_at)}</div>
              </div>
              <Pill tone={i.status === "resolved" ? "good" : "neutral"}>{i.status ?? "open"}</Pill>
              <select value={i.status ?? "open"} onChange={(e) => setStatus(i, e.target.value)}
                className="h-9 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
                {["open", "investigating", "resolved"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
          {!rows.length && <Empty>No incidents reported.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
