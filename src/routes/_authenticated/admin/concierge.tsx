import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, logAudit, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/concierge")({ component: Page });

function Page() {
  const { rows, reload } = useTable("concierge_requests");
  const setStatus = async (r: Row, status: string) => {
    const { error } = await (supabase as any).from("concierge_requests").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await logAudit("update_concierge", "concierge_request", r.id, `Status → ${status}`);
    void reload();
  };
  return (
    <AdminLayout title="Concierge Requests" subtitle="Airport meet-and-greet, hotels, restaurants, security and travel planning — kept separate from general support mail.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Requests" value={rows.length.toString()} />
        <Stat label="Open" value={rows.filter((r) => (r.status ?? "pending") !== "completed").length.toString()} accent />
        <Stat label="Completed" value={rows.filter((r) => r.status === "completed").length.toString()} />
        <Stat label="Categories" value={new Set(rows.map((r) => r.kind ?? r.category ?? "general")).size.toString()} />
      </div>
      <Panel title="Request Desk">
        <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
          {rows.map((r: Row) => (
            <div key={r.id} className="p-4 grid md:grid-cols-[auto_1fr_auto_auto] gap-3 items-center">
              <Pill>{r.kind ?? r.category ?? "general"}</Pill>
              <div className="min-w-0">
                <div className="text-sm truncate">{r.title ?? r.summary ?? "Concierge request"}</div>
                <div className="text-[10px] text-muted-foreground truncate">{r.details ?? r.notes ?? ""} · {since(r.created_at)}</div>
              </div>
              <Pill tone={r.status === "completed" ? "good" : "warn"}>{r.status ?? "pending"}</Pill>
              <select value={r.status ?? "pending"} onChange={(e) => setStatus(r, e.target.value)}
                className="h-9 px-2 bg-input border border-border text-[10px] uppercase outline-none focus:border-gold">
                {["pending", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
          {!rows.length && <Empty>No concierge requests yet.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
