import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout, Panel, Pill, Empty, Stat } from "@/components/admin/AdminLayout";
import { useTable, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/audit")({ component: Page });

function Page() {
  const { rows } = useTable("audit_logs", { limit: 400 });
  const [q, setQ] = useState("");
  const list = rows.filter((r: Row) => !q || `${r.actor_name} ${r.action} ${r.entity} ${r.detail}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminLayout title="Audit Logs" subtitle="Every operator action is permanently recorded — who acted, on what, and when.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Events" value={rows.length.toString()} />
        <Stat label="Operators" value={new Set(rows.map((r) => r.actor_name)).size.toString()} />
        <Stat label="Entities" value={new Set(rows.map((r) => r.entity)).size.toString()} />
        <Stat label="Latest" value={since(rows[0]?.created_at)} accent />
      </div>
      <Panel title="Trail" action={
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter trail"
          className="h-8 px-2 bg-input border border-border text-xs outline-none focus:border-gold w-56" />
      }>
        <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
          {list.map((r: Row) => (
            <div key={r.id} className="p-3 flex items-center gap-3 text-xs">
              <span className="w-40 truncate text-white/85">{r.actor_name ?? "Staff"}</span>
              <Pill>{r.action}</Pill>
              <span className="text-muted-foreground flex-1 truncate">{r.entity}{r.detail ? ` · ${r.detail}` : ""}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </div>
          ))}
          {!list.length && <Empty>No recorded actions yet.</Empty>}
        </div>
      </Panel>
    </AdminLayout>
  );
}
