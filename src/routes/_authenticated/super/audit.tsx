import { createFileRoute } from "@tanstack/react-router";
import { useCP } from "@/lib/super";
import { SuperLayout, CPanel, CStat, CEmpty } from "@/components/super/SuperLayout";
import { useTable, naira, since, type Row } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/super/audit")({ component: Page });

function Page() {
  const { rows } = useCP("audit_logs", "created_at", false);
  return (
    <SuperLayout title="Audit Center" subtitle="Immutable record of every governed action — actor, entity, IP address and the value before and after the change.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CStat label="Events" value={rows.length.toString()} />
        <CStat label="Actors" value={new Set(rows.map((r) => r.actor_name)).size.toString()} />
        <CStat label="Entities" value={new Set(rows.map((r) => r.entity)).size.toString()} />
        <CStat label="Latest" value={since(rows[0]?.created_at)} />
      </div>
      <CPanel title="Immutable Trail">
        <div className="divide-y divide-border max-h-[680px] overflow-y-auto">
          {rows.map((r: Row) => (
            <div key={r.id} className="p-3 text-xs grid md:grid-cols-[160px_120px_1fr_150px_140px] gap-2 items-center">
              <span className="truncate text-white/85">{r.actor_name ?? "Staff"}</span>
              <span className="text-[10px] uppercase tracking-widest text-crimson">{r.action}</span>
              <span className="text-muted-foreground truncate">{r.entity}{r.detail ? ` · ${r.detail}` : ""}</span>
              <span className="text-[10px] text-muted-foreground">IP {r.ip_address ?? "internal"}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </div>
          ))}
          {!rows.length && <CEmpty>No audit records yet.</CEmpty>}
        </div>
      </CPanel>
    </SuperLayout>
  );
}
